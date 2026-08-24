/** Intégration DB : deux comptes distincts ne peuvent jamais partager un dossier, même via import/export. */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { accountSessions, accounts, clients, exportAudit } from "../drizzle/schema";
import { getDb, getOwnedClient } from "./db";
import { signAccountSession } from "./auth/session";
import { clientsRouter } from "./routers/clients";
import { transfersRouter } from "./routers/transfers";

const integrationEnabled = Boolean(process.env.DATABASE_URL);
const suite = integrationEnabled ? describe : describe.skip;
const runId = randomUUID().replaceAll("-", "");
let db: any;
let accountA = 0;
let accountB = 0;
let clientA = 0;
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
  });

  afterAll(async () => {
    if (!db) return;
    const accountIds = [accountA, accountB].filter(Boolean);
    const clientIds = [clientA, importedForB].filter(Boolean);
    if (accountIds.length) await db.delete(exportAudit).where(inArray(exportAudit.accountId, accountIds));
    if (clientIds.length) await db.delete(clients).where(inArray(clients.id, clientIds));
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
    await expect(exportA.exportData({ format: "json", scope: "all" })).resolves.toMatchObject({ clients: [expect.objectContaining({ client: expect.objectContaining({ id: clientA, accountId: accountA }) })] });
    await expect(exportB.exportData({ format: "json", scope: "selected", clientIds: [clientA] })).resolves.toMatchObject({ clients: [] });
    const imported = await importB.commitImport({ schemaVersion: 1, clients: [{ client: { fullName: "Import rattaché à B" }, documents: [], compliance: [], cases: [], payments: [], cashEntries: [] }] });
    importedForB = imported.clientIds[0];
    await expect(getOwnedClient(accountB, importedForB)).resolves.toMatchObject({ accountId: accountB });
    await expect(getOwnedClient(accountA, importedForB)).resolves.toBeNull();
  });
});
