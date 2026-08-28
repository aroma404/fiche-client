import { describe, expect, it } from "vitest";
import { createClientDraft, financeEntriesForBundle, isOperationalClient, normalizeBundle, taxCenterForRegimeCode } from "./client-data";

describe("règles client partagées", () => {
  it("ne compte comme actif que les statuts opérationnels non archivés", () => {
    expect(isOperationalClient({ status: "Actif", archivedAt: null }, ["Actif"])).toBe(true);
    expect(isOperationalClient({ status: "Radié", archivedAt: null }, ["Actif"])).toBe(false);
    expect(isOperationalClient({ status: "Actif", archivedAt: new Date() }, ["Actif"])).toBe(false);
    expect(isOperationalClient({ status: "En attente", archivedAt: null }, ["Actif", "En attente"])).toBe(true);
  });

  it("utilise le registre financier lorsqu’il existe et convertit les anciennes lignes une seule fois", () => {
    const draft = createClientDraft("Dossier de test");
    draft.payments = [{ paymentDate: "2026-08-25", label: "Ancien paiement", reference: "A1", amount: 100 }];
    draft.cashEntries = [{ entryDate: "2026-08-25", label: "Ancienne caisse", direction: "Sortie", amount: 25 }];
    expect(financeEntriesForBundle(draft)).toEqual(expect.arrayContaining([expect.objectContaining({ category: "Paiement", direction: "Entrée", amount: 100 }), expect.objectContaining({ category: "Caisse", direction: "Sortie", amount: 25 })]));
    draft.financeEntries = [{ entryDate: "2026-08-26", category: "Paiement", direction: "Entrée", label: "Registre", reference: "R1", amount: 250, note: "" }];
    expect(financeEntriesForBundle(draft)).toEqual([expect.objectContaining({ label: "Registre", amount: 250 })]);
  });

  it("applique CPI au code IFU et CDI aux autres régimes, même après personnalisation des libellés", () => {
    expect(taxCenterForRegimeCode("ifu")).toBe("CPI");
    expect(taxCenterForRegimeCode("real")).toBe("CDI");
    expect(taxCenterForRegimeCode("custom-regime")).toBe("CDI");
  });

  it("ne force aucun solde initial lors de la création d’un dossier", () => {
    expect(createClientDraft("Dossier sans solde").client.initialBalance).toBeNull();
  });

  it("initialise et relit les affiliations CNAS et CASNOS sans modifier les anciens paquets", () => {
    expect(createClientDraft("Dossier social").client).toMatchObject({ cnasAffiliated: false, casnosAffiliated: false });
    expect(normalizeBundle({ client: { fullName: "Dossier social", cnasAffiliated: true, casnosAffiliated: false } }).client).toMatchObject({ cnasAffiliated: true, casnosAffiliated: false });
    expect(normalizeBundle({ client: { fullName: "Ancien dossier" } }).client).toMatchObject({ cnasAffiliated: false, casnosAffiliated: false });
  });
});

  it("sépare l’état de paiement du statut documentaire", () => {
    const draft = normalizeBundle({
      client: { fullName: "Dossier documentaire" },
      documents: [
        { label: "G8", category: "Fiscal", status: "Reçu", paymentDone: true, note: "" },
        { label: "C20", category: "Fiscal", status: "Reçu", note: "" },
      ],
    });
    expect(draft.documents[0]).toMatchObject({ status: "Reçu", paymentDone: true });
    expect(draft.documents[1]).toMatchObject({ status: "Reçu", paymentDone: false });
  });
