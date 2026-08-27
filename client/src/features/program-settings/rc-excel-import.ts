import * as XLSX from "xlsx";
import { normalizeRcCatalogueEntries, type RcCatalogueEntryInput } from "@shared/rc-catalogue";

export type RcExcelPreview = { sourceFilename: string; entries: RcCatalogueEntryInput[]; familyCount: number };

function asCellText(value: unknown) {
  return String(value ?? "").trim();
}

/** Lit les deux premières colonnes de chaque feuille : code RC à six chiffres, puis libellé. */
export function parseRcCatalogueExcel(sourceFilename: string, buffer: ArrayBuffer): RcExcelPreview {
  if (!/\.(xlsx|xls|xlsb|csv)$/i.test(sourceFilename)) throw new Error("Choisissez un fichier Excel ou CSV pour le catalogue RC.");
  const workbook = XLSX.read(buffer, { type: "array" });
  const rawEntries: RcCatalogueEntryInput[] = [];
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", blankrows: false });
    for (const row of rows) {
      const cells = row.map(asCellText);
      const codeIndex = cells.findIndex(cell => /^\d{6}$/.test(cell));
      if (codeIndex < 0) continue;
      const label = cells.slice(codeIndex + 1).find(Boolean) ?? "";
      rawEntries.push({ code: cells[codeIndex], label });
    }
  }
  const entries = normalizeRcCatalogueEntries(rawEntries).map(({ code, label }) => ({ code, label }));
  return { sourceFilename, entries, familyCount: new Set(entries.map(entry => entry.code.slice(0, 3))).size };
}
