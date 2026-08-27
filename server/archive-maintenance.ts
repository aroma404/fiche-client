import { and, eq, inArray, lte } from "drizzle-orm";
import type { Request, Response } from "express";
import { cabinetFinanceEntries, clientCashEntries, clientCompliance, clientContacts, clientDocuments, clientFiles, clientPayments, clients, clientWorkCases, passwordVaultEntries, programClientOptions, programClientStatuses, programRcCatalogueEntries, programRcCatalogueFamilies } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";

export async function purgeExpiredArchive(now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("La base de données est indisponible.");
  const expiredClients = await db.select({ id: clients.id, accountId: clients.accountId }).from(clients).where(lte(clients.purgeAfter, now));
  const clientIds = expiredClients.map(client => client.id);
  if (clientIds.length) await db.transaction(async tx => {
    await Promise.all([
      tx.delete(clientContacts).where(inArray(clientContacts.clientId, clientIds)), tx.delete(clientDocuments).where(inArray(clientDocuments.clientId, clientIds)), tx.delete(clientFiles).where(inArray(clientFiles.clientId, clientIds)), tx.delete(clientCompliance).where(inArray(clientCompliance.clientId, clientIds)), tx.delete(clientWorkCases).where(inArray(clientWorkCases.clientId, clientIds)), tx.delete(clientPayments).where(inArray(clientPayments.clientId, clientIds)), tx.delete(clientCashEntries).where(inArray(clientCashEntries.clientId, clientIds)), tx.delete(cabinetFinanceEntries).where(inArray(cabinetFinanceEntries.clientId, clientIds)), tx.delete(passwordVaultEntries).where(inArray(passwordVaultEntries.clientId, clientIds)),
    ]);
    for (const client of expiredClients) await tx.delete(clients).where(and(eq(clients.id, client.id), eq(clients.accountId, client.accountId), lte(clients.purgeAfter, now)));
  });
  const [contacts, documents, files, finances, options, statuses, vault, rcActivities, rcFamilies] = await Promise.all([
    db.delete(clientContacts).where(lte(clientContacts.purgeAfter, now)),
    db.delete(clientDocuments).where(lte(clientDocuments.purgeAfter, now)),
    db.delete(clientFiles).where(lte(clientFiles.purgeAfter, now)),
    db.delete(cabinetFinanceEntries).where(lte(cabinetFinanceEntries.purgeAfter, now)),
    db.delete(programClientOptions).where(lte(programClientOptions.purgeAfter, now)),
    db.delete(programClientStatuses).where(lte(programClientStatuses.purgeAfter, now)),
    db.delete(passwordVaultEntries).where(lte(passwordVaultEntries.purgeAfter, now)),
    db.delete(programRcCatalogueEntries).where(lte(programRcCatalogueEntries.purgeAfter, now)),
    db.delete(programRcCatalogueFamilies).where(lte(programRcCatalogueFamilies.purgeAfter, now)),
  ]);
  return { clients: clientIds.length, contacts: contacts[0]?.affectedRows ?? 0, documents: documents[0]?.affectedRows ?? 0, files: files[0]?.affectedRows ?? 0, finances: finances[0]?.affectedRows ?? 0, options: options[0]?.affectedRows ?? 0, statuses: statuses[0]?.affectedRows ?? 0, vault: vault[0]?.affectedRows ?? 0, rcActivities: rcActivities[0]?.affectedRows ?? 0, rcFamilies: rcFamilies[0]?.affectedRows ?? 0 };
}

export async function archiveCleanupHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    return res.json({ ok: true, purged: await purgeExpiredArchive() });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Archive cleanup failed", timestamp: new Date().toISOString() });
  }
}
