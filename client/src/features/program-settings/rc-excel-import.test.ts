import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { parseRcCatalogueExcel } from "./rc-excel-import";

describe("parseRcCatalogueExcel", () => {
  it("lit les codes et libellés RC depuis les deux premières colonnes Excel", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Code", "Activité"], ["101001", "Commerce de détail"], ["101002", "Commerce spécialisé"]]), "Nomenclature");
    const preview = parseRcCatalogueExcel("nomenclature.xlsx", XLSX.write(workbook, { type: "array", bookType: "xlsx" }));
    expect(preview).toMatchObject({ sourceFilename: "nomenclature.xlsx", familyCount: 1, entries: [{ code: "101001", label: "Commerce de détail" }, { code: "101002", label: "Commerce spécialisé" }] });
  });

  it("refuse les fichiers dont les codes RC ne respectent pas la nomenclature", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["10101", "Invalide"]]), "Nomenclature");
    expect(() => parseRcCatalogueExcel("nomenclature.xlsx", XLSX.write(workbook, { type: "array", bookType: "xlsx" }))).toThrow("aucune activité RC valide");
  });
});
