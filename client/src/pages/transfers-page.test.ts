/** Contrat de fichiers : les formats JSON et XLSX réimportent la structure attendue sans données de propriété. */

import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseImport } from "./transfers-page";

describe("parseImport", () => {
  it("normalise un export JSON et ignore les champs de propriété qui ne font pas partie du brouillon", () => {
    const payload = JSON.stringify({ schemaVersion: 1, clients: [{ client: { fullName: "Dossier JSON", accountId: 999, referenceNumber: 81, cacobatphAffiliated: true }, documents: [], compliance: [], cases: [], payments: [], cashEntries: [] }] });
    const result = parseImport("export.json", payload);

    expect(result.clients).toHaveLength(1);
    expect(result.clients[0].client.fullName).toBe("Dossier JSON");
    expect(result.clients[0].client.referenceNumber).toBeNull();
    expect(result.clients[0].client.cacobatphAffiliated).toBe(true);
    expect(result.clients[0].client).not.toHaveProperty("accountId");
  });

  it("refuse un JSON contenant plusieurs dossiers", () => {
    const payload = JSON.stringify({ schemaVersion: 1, clients: [{ client: { fullName: "Client 1" } }, { client: { fullName: "Client 2" } }] });
    expect(() => parseImport("plusieurs.json", payload)).toThrow("un seul dossier client");
  });

  it("recompose l’archive XLSX structurée avec ses intitulés français", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ "Clé dossier": 1, "Référence client": "081", "Nom / raison sociale": "Dossier Excel", Adresse: "Rue de test", "Affilié au CACOBATPH": "Oui", "Solde initial (DA)": 1200, accountId: 123 }]), "Clients");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ "Clé dossier": 1, Document: "NIF", Catégorie: "Fiscal", Statut: "Reçu", Observation: "Validé" }]), "Documents");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), "Conformité");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), "Dossiers");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), "Paiements");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), "Caisse");
    const file = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = parseImport("export.xlsx", file);

    expect(result.clients[0]).toMatchObject({ client: { fullName: "Dossier Excel", referenceNumber: null, commune: "Rue de test", cacobatphAffiliated: true, initialBalance: 1200 }, documents: [{ label: "NIF", status: "Reçu", note: "Validé" }] });
    expect(result.clients[0].client).not.toHaveProperty("accountId");
  });

  it("préserve les champs d’activité structurée dans un Excel réimporté", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ "Clé dossier": 1, "Nom / raison sociale": "Dossier RC", "Domaine d’activité": "Registre de commerce", "Catégorie RC": "123", "Code activité RC": "1234567890" }]), "Clients");
    const file = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseImport("activite.xlsx", file);

    expect(result.clients[0].client).toMatchObject({ fullName: "Dossier RC", activityKind: "Registre de commerce", rcActivityFamily: "123", rcActivityCode: "1234567890" });
  });

  it("refuse un Excel contenant plusieurs lignes clients", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ "Clé dossier": 1, "Nom / raison sociale": "Client 1" }, { "Clé dossier": 2, "Nom / raison sociale": "Client 2" }]), "Clients");
    const file = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    expect(() => parseImport("plusieurs.xlsx", file)).toThrow("un seul dossier client");
  });
});
