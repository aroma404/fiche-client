/** Contrats d’isolation : les identifiants fournis par le navigateur ne remplacent jamais le compte de la session. */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentAccount: vi.fn(),
  getClientBundle: vi.fn(),
  getClientBundles: vi.fn(),
  getDb: vi.fn(),
  getOwnedClient: vi.fn(),
  assertProgramClientStatus: vi.fn(),
}));

vi.mock("./account-context", () => ({ requireCurrentAccount: mocks.requireCurrentAccount }));
vi.mock("./db", () => ({
  getClientBundle: mocks.getClientBundle,
  getClientBundles: mocks.getClientBundles,
  getDb: mocks.getDb,
  getOwnedClient: mocks.getOwnedClient,
}));
vi.mock("./program-client-statuses", () => ({ assertProgramClientStatus: mocks.assertProgramClientStatus }));

import { clientsRouter } from "./routers/clients";
import { transfersRouter } from "./routers/transfers";

const ctx = { req: {}, res: {} } as any;
const ownBundle = { client: { id: 7, fullName: "Dossier autorisé" }, documents: [], compliance: [], cases: [], payments: [], cashEntries: [] };

describe("isolation des comptes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentAccount.mockResolvedValue({ id: 17, email: "cabinet@exemple.test" });
    mocks.getDb.mockResolvedValue(null);
    mocks.assertProgramClientStatus.mockResolvedValue(undefined);
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

  it("refuse une activité structurée incomplète ou absente de la nomenclature fournie", async () => {
    const caller = clientsRouter.createCaller(ctx);

    await expect(caller.create({ fullName: "Auto test", activityKind: "Auto-entrepreneur" })).rejects.toThrow("Choisissez Micro-importation ou Prestation de services.");
    await expect(caller.create({ fullName: "RC test", activityKind: "Registre de commerce", rcActivityFamily: "000", rcActivityCode: "0000000000" })).rejects.toThrow("Choisissez une activité valide de la nomenclature fournie.");
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

  it("empêche un second compte de lire, modifier ou exporter le dossier du premier", async () => {
    mocks.requireCurrentAccount.mockResolvedValue({ id: 18, email: "autre-cabinet@exemple.test" });
    mocks.getClientBundle.mockResolvedValue(null);
    mocks.getOwnedClient.mockResolvedValue(null);
    mocks.getClientBundles.mockResolvedValue([]);
    const clientsCaller = clientsRouter.createCaller(ctx);
    const transfersCaller = transfersRouter.createCaller(ctx);

    await expect(clientsCaller.get({ clientId: 7 })).rejects.toThrow("Client introuvable.");
    await expect(clientsCaller.saveBundle({
      clientId: 7,
      data: { client: { fullName: "Dossier autorisé" }, documents: [], compliance: [], cases: [], payments: [], cashEntries: [] },
    })).rejects.toThrow("Client introuvable.");

    await expect(transfersCaller.exportData({ format: "json", scope: "selected", clientIds: [7] })).resolves.toMatchObject({ clients: [] });
    expect(mocks.getClientBundle).toHaveBeenCalledWith(18, 7);
    expect(mocks.getOwnedClient).toHaveBeenCalledWith(18, 7);
    expect(mocks.getClientBundles).toHaveBeenCalledWith(18, [7]);
  });
});
