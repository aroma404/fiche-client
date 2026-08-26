/** Intégration DB : deux comptes distincts ne peuvent jamais partager un dossier, même via import/export. */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { accountSessions, accounts, cabinetFinanceEntries, clientContacts, clients, exportAudit, programClientOptions, programClientStatuses } from "../drizzle/schema";
import { getDb, getOwnedClient } from "./db";
import { signAccountSession } from "./auth/session";
import { clientsRouter } from "./routers/clients";
import { cabinetFinanceRouter } from "./routers/cabinet-finance";
import { transfersRouter } from "./routers/transfers";
import { programSettingsRouter } from "./routers/program-settings";

const integrationEnabled = Boolean(process.env.DATABASE_URL);
const suite = integrationEnabled ? describe : describe.skip;
const runId = randomUUID().replaceAll("-", "");
let db: any;
let accountA = 0;
let accountB = 0;
let clientA = 0;
let clientA2 = 0;
let importedForB = 0;
const sessionA = `itest-${runId.slice(0, 40)}-a`;
const sessionB = `itest-${runId.slice(0, 40)}-b`;

function contextFor(token: string) { return { req: { headers: { cookie: `fiche_client_session=${token}` } }, res: {} } as any; }

suite("isolation persistante A/B", () => {
  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Base de données indisponible pour le test d’intégration.");
    const createdA = await db.insert(accounts).values({ fullName: "Compte test A", email: `isolation-${runId}-a@exemple.test`, passwordHash: "test-only" });
    const createdB = await db.insert(accounts).values({ fullName: "Compte test B", email: `isolation-${runId}-b@exemple.test`, passwordHash: "test-only" });
    accountA = Number(createdA[0].insertId); accountB = Number(createdB[0].insertId);
    await db.insert(accountSessions).values([{ id: sessionA, accountId: accountA, expiresAt: new Date(Date.now() + 60_000) }, { id: sessionB, accountId: accountB, expiresAt: new Date(Date.now() + 60_000) }]);
    const tokenA = await signAccountSession(accountA, sessionA);
    const createdClient = await clientsRouter.createCaller(contextFor(tokenA)).create({ fullName: "Dossier isolé A", observations: "Test temporaire supprimé automatiquement" });
    clientA = createdClient.clientId;
    const createdSecondClient = await clientsRouter.createCaller(contextFor(tokenA)).create({ fullName: "Dossier isolé A secondaire", status: "Radié", observations: "Test temporaire supprimé automatiquement" });
    clientA2 = createdSecondClient.clientId;
  });

  afterAll(async () => {
    if (!db) return;
    const accountIds = [accountA, accountB].filter(Boolean);
    const clientIds = [clientA, clientA2, importedForB].filter(Boolean);
    if (accountIds.length) await db.delete(exportAudit).where(inArray(exportAudit.accountId, accountIds));
    if (accountIds.length) await db.delete(cabinetFinanceEntries).where(inArray(cabinetFinanceEntries.accountId, accountIds));
    if (clientIds.length) await db.delete(clientContacts).where(inArray(clientContacts.clientId, clientIds));
    if (clientIds.length) await db.delete(clients).where(inArray(clients.id, clientIds));
    if (accountIds.length) await db.delete(programClientStatuses).where(inArray(programClientStatuses.accountId, accountIds));
    if (accountIds.length) await db.delete(programClientOptions).where(inArray(programClientOptions.accountId, accountIds));
    if (accountIds.length) await db.delete(accountSessions).where(inArray(accountSessions.accountId, accountIds));
    if (accountIds.length) await db.delete(accounts).where(inArray(accounts.id, accountIds));
  });

  it("isole get, saveBundle et archive entre le compte A et le compte B", async () => {
    const tokenA = await signAccountSession(accountA, sessionA); const tokenB = await signAccountSession(accountB, sessionB);
    const callerA = clientsRouter.createCaller(contextFor(tokenA)); const callerB = clientsRouter.createCaller(contextFor(tokenB));

    await expect(callerA.get({ clientId: clientA })).resolves.toMatchObject({ client: { id: clientA, accountId: accountA } });
    await expect(callerB.get({ clientId: clientA })).rejects.toThrow("Client introuvable.");
    await expect(callerB.saveBundle({ clientId: clientA, data: { client: { fullName: "Tentative B" }, documents: [], compliance: [], cases: [], payments: [], cashEntries: [] } })).rejects.toThrow("Client introuvable.");
    await expect(callerB.archive({ clientId: clientA })).resolves.toEqual({ success: true });
    await expect(getOwnedClient(accountA, clientA)).resolves.not.toBeNull();
    await expect(getOwnedClient(accountB, clientA)).resolves.toBeNull();
  });

  it("limite l’export à la propriété et réattribue un import au compte B", async () => {
    const tokenA = await signAccountSession(accountA, sessionA); const tokenB = await signAccountSession(accountB, sessionB);
    const exportA = transfersRouter.createCaller(contextFor(tokenA)); const exportB = transfersRouter.createCaller(contextFor(tokenB)); const importB = transfersRouter.createCaller(contextFor(tokenB));
    await expect(exportA.exportData({ format: "json", scope: "all", clientIds: [clientA] })).resolves.toMatchObject({ clients: expect.arrayContaining([expect.objectContaining({ client: expect.objectContaining({ id: clientA, accountId: accountA }) }), expect.objectContaining({ client: expect.objectContaining({ id: clientA2, accountId: accountA }) })]) });
    await expect(exportA.exportData({ format: "json", scope: "selected", clientIds: [clientA] })).resolves.toMatchObject({ clients: [expect.objectContaining({ client: expect.objectContaining({ id: clientA }) })] });
    await expect(exportB.exportData({ format: "json", scope: "selected", clientIds: [clientA] })).resolves.toMatchObject({ clients: [] });
    const imported = await importB.commitImport({ schemaVersion: 1, clients: [{ client: { fullName: "Import rattaché à B" }, documents: [], compliance: [], cases: [], payments: [], cashEntries: [] }] });
    importedForB = imported.clientIds[0];
    await expect(getOwnedClient(accountB, importedForB)).resolves.toMatchObject({ accountId: accountB });
    await expect(getOwnedClient(accountA, importedForB)).resolves.toBeNull();
  });

  it("isole les statuts administrables et interdit une valeur étrangère lors de la création", async () => {
    const tokenA = await signAccountSession(accountA, sessionA); const tokenB = await signAccountSession(accountB, sessionB);
    const settingsA = programSettingsRouter.createCaller(contextFor(tokenA)); const settingsB = programSettingsRouter.createCaller(contextFor(tokenB));
    const created = await settingsA.clientStatuses.create({ label: "En attente", isOperational: false });
    await expect(settingsA.clientStatuses.list()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: created.id, label: "En attente", accountId: accountA })]));
    await expect(settingsB.clientStatuses.list()).resolves.not.toEqual(expect.arrayContaining([expect.objectContaining({ label: "En attente" })]));
    await expect(settingsB.clientStatuses.update({ id: created.id, label: "Interdit", isOperational: false })).rejects.toThrow("Statut introuvable.");
    await expect(clientsRouter.createCaller(contextFor(tokenB)).create({ fullName: "Statut non autorisé B", status: "En attente" })).rejects.toThrow("statut choisi");
    const radiated = (await settingsA.clientStatuses.list()).find(status => status.label === "Radié");
    if (!radiated) throw new Error("Statut Radié absent du jeu de test.");
    await expect(settingsA.clientStatuses.update({ id: radiated.id, label: "Clôturé", isOperational: false })).resolves.toMatchObject({ id: radiated.id, label: "Clôturé", isOperational: false });
    await expect(clientsRouter.createCaller(contextFor(tokenA)).list({ includeArchived: true })).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: clientA2, status: "Clôturé", archivedAt: null })]));
  });

  it("isole les opérations financières du cabinet entre les comptes", async () => {
    const tokenA = await signAccountSession(accountA, sessionA); const tokenB = await signAccountSession(accountB, sessionB);
    const financeA = cabinetFinanceRouter.createCaller(contextFor(tokenA)); const financeB = cabinetFinanceRouter.createCaller(contextFor(tokenB));
    await expect(clientsRouter.createCaller(contextFor(tokenA)).saveBundle({ clientId: clientA, data: { client: { fullName: "Dossier isolé A" }, documents: [], compliance: [], cases: [], payments: [], cashEntries: [], financeEntries: [{ entryDate: "2026-08-24", category: "Caisse", direction: "Entrée", label: "Opération depuis la fiche", reference: "FICHE", amount: 80, note: "Test de propagation" }] } })).resolves.toEqual({ success: true });
    await expect(financeA.list({ clientId: clientA })).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ category: "Caisse", label: "Opération depuis la fiche", amount: "80.00" })]));
    const created = await financeA.create({ clientId: clientA, entryDate: "2026-08-25", category: "Paiement", direction: "Entrée", label: "Règlement isolé", reference: "ITEST", amount: 1200, note: "Test nettoyé automatiquement" });
    await expect(financeB.list()).resolves.toEqual([]);
    await expect(financeB.create({ clientId: clientA, entryDate: "2026-08-25", category: "Paiement", direction: "Entrée", label: "Tentative B", reference: "", amount: 1, note: "" })).rejects.toThrow("Client introuvable.");
    await expect(financeB.remove({ entryId: created.entryId })).resolves.toEqual({ success: true });
    await expect(financeA.list({ clientId: clientA })).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: created.entryId, accountId: accountA, clientId: clientA })]));
    await expect(transfersRouter.createCaller(contextFor(tokenA)).exportData({ format: "json", scope: "selected", clientIds: [clientA] })).resolves.toMatchObject({ clients: [expect.objectContaining({ client: expect.objectContaining({ id: clientA }), financeEntries: expect.arrayContaining([expect.objectContaining({ category: "Caisse", label: "Opération depuis la fiche", amount: "80.00" }), expect.objectContaining({ id: created.entryId, category: "Paiement", amount: "1200.00" })]) })] });
  });

  it("liste et restaure les contacts, statuts et valeurs archivés dans leur seul compte", async () => {
    const tokenA = await signAccountSession(accountA, sessionA); const tokenB = await signAccountSession(accountB, sessionB);
    const contactsA = clientsRouter.createCaller(contextFor(tokenA)).contacts; const contactsB = clientsRouter.createCaller(contextFor(tokenB)).contacts;
    await contactsA.create({ clientId: clientA, contact: { label: "Archive contact", type: "Téléphone", value: "+213550000000", isPrimary: false } });
    const contact = (await contactsA.list({ clientId: clientA })).find(item => item.label === "Archive contact"); if (!contact) throw new Error("Contact de test absent.");
    await contactsA.archive({ id: contact.id, clientId: clientA });
    await expect(contactsA.archived()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: contact.id, clientId: clientA })]));
    await expect(contactsB.restore({ id: contact.id, clientId: clientA })).rejects.toThrow("Client introuvable.");
    await contactsA.restore({ id: contact.id, clientId: clientA });
    await expect(contactsA.list({ clientId: clientA })).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: contact.id })]));

    const settingsA = programSettingsRouter.createCaller(contextFor(tokenA)); const settingsB = programSettingsRouter.createCaller(contextFor(tokenB));
    const status = await settingsA.clientStatuses.create({ label: "Archive statut", isOperational: false }); await settingsA.clientStatuses.remove({ id: status.id });
    await expect(settingsA.clientStatuses.archived()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: status.id })]));
    await expect(settingsB.clientStatuses.restore({ id: status.id })).resolves.toEqual({ success: true });
    await expect(settingsA.clientStatuses.archived()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: status.id })]));
    await settingsA.clientStatuses.restore({ id: status.id });

    const option = await settingsA.clientOptions.create({ kind: "clientType", label: "Archive valeur" }); await settingsA.clientOptions.remove({ id: option.id });
    await expect(settingsA.clientOptions.archived()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: option.id })]));
    await expect(settingsB.clientOptions.restore({ id: option.id })).resolves.toEqual({ success: true });
    await expect(settingsA.clientOptions.archived()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: option.id })]));
    await settingsA.clientOptions.restore({ id: option.id });
  });
});
