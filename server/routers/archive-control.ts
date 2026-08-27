import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { cabinetFinanceEntries, clientCashEntries, clientCompliance, clientContacts, clientDocuments, clientFiles, clientPayments, clientWorkCases, clients, passwordVaultEntries, programClientOptions, programClientStatuses, programRcCatalogueEntries, programRcCatalogueFamilies } from "../../drizzle/schema";
import { getAccountArchivePolicy } from "../archive-policy";
import { requireCurrentAccount } from "../account-context";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";

async function requireImmediateDeletion(db: any, accountId: number) {
  const policy = await getAccountArchivePolicy(db, accountId);
  if (!policy.allowImmediateDeletion) throw new Error("La suppression définitive immédiate est désactivée dans les Archives.");
  return policy;
}

async function purgeArchivedClient(db: any, accountId: number, clientId: number) {
  const client = (await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, clientId), eq(clients.accountId, accountId), isNotNull(clients.archivedAt))).limit(1))[0];
  if (!client) throw new Error("Dossier archivé introuvable.");
  await db.transaction(async (tx: any) => {
    await Promise.all([
      tx.delete(clientContacts).where(eq(clientContacts.clientId, clientId)), tx.delete(clientDocuments).where(eq(clientDocuments.clientId, clientId)), tx.delete(clientFiles).where(and(eq(clientFiles.accountId, accountId), eq(clientFiles.clientId, clientId)),), tx.delete(clientCompliance).where(eq(clientCompliance.clientId, clientId)), tx.delete(clientWorkCases).where(eq(clientWorkCases.clientId, clientId)), tx.delete(clientPayments).where(eq(clientPayments.clientId, clientId)), tx.delete(clientCashEntries).where(eq(clientCashEntries.clientId, clientId)), tx.delete(cabinetFinanceEntries).where(and(eq(cabinetFinanceEntries.accountId, accountId), eq(cabinetFinanceEntries.clientId, clientId))), tx.delete(passwordVaultEntries).where(and(eq(passwordVaultEntries.accountId, accountId), eq(passwordVaultEntries.clientId, clientId))),
    ]);
    await tx.delete(clients).where(and(eq(clients.id, clientId), eq(clients.accountId, accountId), isNotNull(clients.archivedAt)));
  });
  return { clients: 1, contacts: 0, documents: 0, files: 0, options: 0, statuses: 0, vault: 0, rcActivities: 0, rcFamilies: 0 } as const;
}

async function purgeAllArchivedForAccount(db: any, accountId: number) {
  const archived = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.accountId, accountId), isNotNull(clients.archivedAt)));
  let clientCount = 0;
  for (const client of archived) { await purgeArchivedClient(db, accountId, client.id); clientCount += 1; }
  const ownedClientIds = (await db.select({ id: clients.id }).from(clients).where(eq(clients.accountId, accountId))).map((client: { id: number }) => client.id);
  const deleteOwnedChildren = async (table: any, column: any) => ownedClientIds.length ? db.delete(table).where(and(inArray(column, ownedClientIds), isNotNull(table.deletedAt))) : [{ affectedRows: 0 }];
  const [contacts, documents, files, finances, options, statuses, vault, rcActivities, rcFamilies] = await Promise.all([
    deleteOwnedChildren(clientContacts, clientContacts.clientId),
    deleteOwnedChildren(clientDocuments, clientDocuments.clientId),
    db.delete(clientFiles).where(and(eq(clientFiles.accountId, accountId), isNotNull(clientFiles.deletedAt))),
    db.delete(cabinetFinanceEntries).where(and(eq(cabinetFinanceEntries.accountId, accountId), isNotNull(cabinetFinanceEntries.deletedAt))),
    db.delete(programClientOptions).where(and(eq(programClientOptions.accountId, accountId), isNotNull(programClientOptions.deletedAt))),
    db.delete(programClientStatuses).where(and(eq(programClientStatuses.accountId, accountId), isNotNull(programClientStatuses.deletedAt))),
    db.delete(passwordVaultEntries).where(and(eq(passwordVaultEntries.accountId, accountId), isNotNull(passwordVaultEntries.deletedAt))),
    db.delete(programRcCatalogueEntries).where(and(eq(programRcCatalogueEntries.accountId, accountId), isNotNull(programRcCatalogueEntries.deletedAt))),
    db.delete(programRcCatalogueFamilies).where(and(eq(programRcCatalogueFamilies.accountId, accountId), isNotNull(programRcCatalogueFamilies.deletedAt))),
  ]);
  return { clients: clientCount, contacts: contacts[0]?.affectedRows ?? 0, documents: documents[0]?.affectedRows ?? 0, files: files[0]?.affectedRows ?? 0, finances: finances[0]?.affectedRows ?? 0, options: options[0]?.affectedRows ?? 0, statuses: statuses[0]?.affectedRows ?? 0, vault: vault[0]?.affectedRows ?? 0, rcActivities: rcActivities[0]?.affectedRows ?? 0, rcFamilies: rcFamilies[0]?.affectedRows ?? 0 };
}

export const archiveControlRouter = router({
  purgeClient: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); await requireImmediateDeletion(db, account.id); return purgeArchivedClient(db, account.id, input.clientId); }),
  purgeContact: publicProcedure.input(z.object({ id: z.number().int().positive(), clientId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); await requireImmediateDeletion(db, account.id); const owned = (await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id))).limit(1))[0]; if (!owned) throw new Error("Client introuvable."); const result = await db.delete(clientContacts).where(and(eq(clientContacts.id, input.id), eq(clientContacts.clientId, input.clientId), isNotNull(clientContacts.deletedAt))); if (!(result[0]?.affectedRows ?? 0)) throw new Error("Contact archivé introuvable."); return { success: true } as const; }),
  purgeStatus: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); await requireImmediateDeletion(db, account.id); const result = await db.delete(programClientStatuses).where(and(eq(programClientStatuses.id, input.id), eq(programClientStatuses.accountId, account.id), isNotNull(programClientStatuses.deletedAt))); if (!(result[0]?.affectedRows ?? 0)) throw new Error("Statut archivé introuvable."); return { success: true } as const; }),
  purgeOption: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); await requireImmediateDeletion(db, account.id); const result = await db.delete(programClientOptions).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id), isNotNull(programClientOptions.deletedAt))); if (!(result[0]?.affectedRows ?? 0)) throw new Error("Valeur archivée introuvable."); return { success: true } as const; }),
  purgeFinance: publicProcedure.input(z.object({ entryId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); await requireImmediateDeletion(db, account.id); const result = await db.delete(cabinetFinanceEntries).where(and(eq(cabinetFinanceEntries.id, input.entryId), eq(cabinetFinanceEntries.accountId, account.id), isNotNull(cabinetFinanceEntries.deletedAt))); if (!(result[0]?.affectedRows ?? 0)) throw new Error("Mouvement archivé introuvable."); return { success: true } as const; }),
  purgeAll: publicProcedure.mutation(async ({ ctx }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); await requireImmediateDeletion(db, account.id); return purgeAllArchivedForAccount(db, account.id); }),
});
