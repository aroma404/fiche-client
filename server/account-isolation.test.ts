/** Contrats d’isolation : les identifiants fournis par le navigateur ne remplacent jamais le compte de la session. */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentAccount: vi.fn(),
  getClientBundle: vi.fn(),
  getClientBundles: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./account-context", () => ({ requireCurrentAccount: mocks.requireCurrentAccount }));
vi.mock("./db", () => ({
  getClientBundle: mocks.getClientBundle,
  getClientBundles: mocks.getClientBundles,
  getDb: mocks.getDb,
  getOwnedClient: vi.fn(),
}));

import { clientsRouter } from "./routers/clients";
import { transfersRouter } from "./routers/transfers";

const ctx = { req: {}, res: {} } as any;
const ownBundle = { client: { id: 7, fullName: "Dossier autorisé" }, documents: [], compliance: [], cases: [], payments: [], cashEntries: [] };

describe("isolation des comptes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentAccount.mockResolvedValue({ id: 17, email: "cabinet@exemple.test" });
    mocks.getDb.mockResolvedValue(null);
  });

  it("charge un dossier uniquement avec le compte de la session", async () => {
    mocks.getClientBundle.mockResolvedValue(ownBundle);
    const caller = clientsRouter.createCaller(ctx);

    await expect(caller.get({ clientId: 7 })).resolves.toEqual(ownBundle);
    expect(mocks.getClientBundle).toHaveBeenCalledWith(17, 7);
    expect(mocks.getClientBundle).not.toHaveBeenCalledWith(expect.any(Number), 17);
  });

  it("borne l’export sélectionné aux clients recherchés pour le compte de la session", async () => {
    mocks.getClientBundles.mockImplementation(async (accountId: number, clientIds?: number[]) => {
      expect(accountId).toBe(17);
      expect(clientIds).toEqual([7]);
      return [ownBundle];
    });
    const caller = transfersRouter.createCaller(ctx);

    const result = await caller.exportData({ format: "json", scope: "selected", clientIds: [7] });
    expect(result.clients).toEqual([ownBundle]);
    expect(result.clients).not.toContainEqual(expect.objectContaining({ client: expect.objectContaining({ id: 99 }) }));
  });

  it("refuse un export sans client lorsqu’il n’est pas demandé sur tous les dossiers", async () => {
    const caller = transfersRouter.createCaller(ctx);

    await expect(caller.exportData({ format: "xlsx", scope: "active" })).rejects.toThrow("Sélectionnez au moins un client.");
  });

  it("ignore tout accountId fourni dans un import et rattache le nouveau dossier à la session", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 501 }]);
    const tx = { insert: vi.fn(() => ({ values })) };
    mocks.getDb.mockResolvedValue({ transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) });
    const caller = transfersRouter.createCaller(ctx);

    await expect(caller.commitImport({
      schemaVersion: 1,
      clients: [{
        client: { fullName: "Nouveau dossier isolé", accountId: 999 } as any,
        documents: [], compliance: [], cases: [], payments: [], cashEntries: [],
      }],
    })).resolves.toEqual({ clientIds: [501] });

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ accountId: 17, fullName: "Nouveau dossier isolé" }));
    expect(values).not.toHaveBeenCalledWith(expect.objectContaining({ accountId: 999 }));
  });
});
