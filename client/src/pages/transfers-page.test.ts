/** Contrat de fichiers : les formats JSON et XLSX réimportent la structure attendue sans données de propriété. */

import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseImport } from "./transfers-page";

describe("parseImport", () => {
  it("normalise un export JSON et ignore les champs de propriété qui ne font pas partie du brouillon", () => {
    const payload = JSON.stringify({ schemaVersion: 1, clients: [{ client: { fullName: "Dossier JSON", accountId: 999 }, documents: [], compliance: [], cases: [], payments: [], cashEntries: [] }] });
    const result = parseImport("export.json", payload);

    expect(result.clients).toHaveLength(1);
    expect(result.clients[0].client.fullName).toBe("Dossier JSON");
    expect(result.clients[0].client).not.toHaveProperty("accountId");
  });

  it("recompose l’archive XLSX structurée avec ses intitulés français", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ "Clé dossier": 1, "Nom / raison sociale": "Dossier Excel", "Solde initial (DA)": 1200, accountId: 123 }]), "Clients");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ "Clé dossier": 1, Document: "NIF", Catégorie: "Fiscal", Statut: "Reçu", Observation: "Validé" }]), "Documents");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), "Conformité");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), "Dossiers");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), "Paiements");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), "Caisse");
    const file = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = parseImport("export.xlsx", file);

    expect(result.clients[0]).toMatchObject({ client: { fullName: "Dossier Excel", initialBalance: 1200 }, documents: [{ label: "NIF", status: "Reçu", note: "Validé" }] });
    expect(result.clients[0].client).not.toHaveProperty("accountId");
  });
});
