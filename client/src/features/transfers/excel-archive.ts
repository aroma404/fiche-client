/** Classeur administratif soigné pour archive et réimport Fiche Client Impôt. */

import * as XLSXStyle from "xlsx-js-style";
import { normalizeBundle, type ClientDraft } from "@/lib/client-data";

type ExportPayload = { schemaVersion: 1; exportedAt: string; clients: unknown[] };
type CellStyle = Record<string, unknown>;
const navy = "102A43", teal = "0F766E", gold = "C99A3E", pale = "EAF3F0", paper = "F6F5F0", slate = "627785";
const titleStyle: CellStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 }, fill: { fgColor: { rgb: navy } }, alignment: { horizontal: "left", vertical: "center" } };
const subtitleStyle: CellStyle = { font: { bold: true, color: { rgb: teal }, sz: 10 }, fill: { fgColor: { rgb: pale } }, alignment: { vertical: "center" } };
const headerStyle: CellStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 9 }, fill: { fgColor: { rgb: teal } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "thin", color: { rgb: "0B625D" } }, bottom: { style: "thin", color: { rgb: "0B625D" } } } };
const evenStyle: CellStyle = { fill: { fgColor: { rgb: "F7FAF8" } }, alignment: { vertical: "top", wrapText: true }, border: { bottom: { style: "hair", color: { rgb: "D7E0DF" } } } };
const oddStyle: CellStyle = { fill: { fgColor: { rgb: "FFFFFF" } }, alignment: { vertical: "top", wrapText: true }, border: { bottom: { style: "hair", color: { rgb: "D7E0DF" } } } };

function styledTable(title: string, subtitle: string, rows: Record<string, string | number>[], headers: string[], widths: number[]) {
  const ws = XLSXStyle.utils.aoa_to_sheet([[title], [subtitle], [], headers, ...rows.map(row => headers.map(header => row[header] ?? ""))]);
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(headers.length - 1, 0) } }, { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(headers.length - 1, 0) } }];
  ws["!cols"] = widths.map(width => ({ wch: width })); ws["!rows"] = [{ hpt: 28 }, { hpt: 20 }, { hpt: 8 }, { hpt: 26 }]; ws["!freeze"] = { xSplit: 0, ySplit: 4 };
  ws["A1"].s = titleStyle; ws["A2"].s = subtitleStyle;
  headers.forEach((_, index) => { const cell = ws[XLSXStyle.utils.encode_cell({ r: 3, c: index })]; if (cell) cell.s = headerStyle; });
  rows.forEach((_, rowIndex) => headers.forEach((_, colIndex) => { const cell = ws[XLSXStyle.utils.encode_cell({ r: rowIndex + 4, c: colIndex })]; if (cell) cell.s = rowIndex % 2 ? evenStyle : oddStyle; }));
  ws["!autofilter"] = { ref: `A4:${XLSXStyle.utils.encode_col(Math.max(0, headers.length - 1))}${Math.max(4, rows.length + 4)}` };
  return ws;
}

export function downloadStyledExcelArchive(payload: ExportPayload) {
  const clients = payload.clients.map(normalizeBundle); const workbook = XLSXStyle.utils.book_new();
  const overview = XLSXStyle.utils.aoa_to_sheet([["FICHE CLIENT IMPÔT — ARCHIVE ADMINISTRATIVE"], ["Date d’export", payload.exportedAt], ["Dossiers inclus", clients.length], ["Confidentialité", "Archive limitée à votre compte. Aucun identifiant de propriété n’est exporté."], ["Réimport", "Utilisez la fonction Importer / exporter pour créer de nouveaux dossiers."]]);
  overview["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]; overview["!cols"] = [{ wch: 25 }, { wch: 45 }, { wch: 18 }, { wch: 35 }]; overview["!rows"] = [{ hpt: 30 }]; overview["A1"].s = titleStyle; ["A2", "A3", "A4", "A5"].forEach(key => { if (overview[key]) overview[key].s = subtitleStyle; }); XLSXStyle.utils.book_append_sheet(workbook, overview, "Vue d’ensemble");
  const clientRows = clients.map((bundle, index) => ({ "Clé dossier": index + 1, "Nom / raison sociale": bundle.client.fullName, Activité: bundle.client.activity, Statut: bundle.client.status, Commune: bundle.client.commune, Contact: bundle.client.contact, NIF: bundle.client.nif, "N° RC": bundle.client.rc, Régime: bundle.client.regime, "Solde initial (DA)": bundle.client.initialBalance, Observations: bundle.client.observations }));
  const docs = clients.flatMap((bundle, index) => bundle.documents.map(item => ({ "Clé dossier": index + 1, Document: item.label, Catégorie: item.category, Statut: item.status, Observation: item.note })));
  const compliance = clients.flatMap((bundle, index) => bundle.compliance.map(item => ({ "Clé dossier": index + 1, Obligation: item.label, Statut: item.status, Note: item.note })));
  const cases = clients.flatMap((bundle, index) => bundle.cases.map(item => ({ "Clé dossier": index + 1, Dossier: item.label, Type: item.caseType, Statut: item.status, Note: item.note })));
  const payments = clients.flatMap((bundle, index) => bundle.payments.map(item => ({ "Clé dossier": index + 1, Date: item.paymentDate, Objet: item.label, Référence: item.reference, "Montant (DA)": item.amount })));
  const cash = clients.flatMap((bundle, index) => bundle.cashEntries.map(item => ({ "Clé dossier": index + 1, Date: item.entryDate, Libellé: item.label, Sens: item.direction, "Montant (DA)": item.amount })));
  const sheets: [string, string, string, Record<string, string | number>[], string[], number[]][] = [["Clients", "DOSSIERS CLIENTS", "Identité, références et situation fiscale", clientRows, ["Clé dossier", "Nom / raison sociale", "Activité", "Statut", "Commune", "Contact", "NIF", "N° RC", "Régime", "Solde initial (DA)", "Observations"], [12, 30, 24, 15, 18, 20, 16, 14, 16, 18, 36]], ["Documents", "DOCUMENTS", "Pièces et statut documentaire", docs, ["Clé dossier", "Document", "Catégorie", "Statut", "Observation"], [12, 28, 18, 16, 42]], ["Conformité", "CONFORMITÉ", "Obligations sociales et administratives", compliance, ["Clé dossier", "Obligation", "Statut", "Note"], [12, 32, 18, 42]], ["Dossiers", "DOSSIERS DE TRAVAIL", "Suivi CDI, CPI, CASNOS et autres", cases, ["Clé dossier", "Dossier", "Type", "Statut", "Note"], [12, 32, 16, 18, 42]], ["Paiements", "PAIEMENTS", "Versements enregistrés", payments, ["Clé dossier", "Date", "Objet", "Référence", "Montant (DA)"], [12, 14, 28, 22, 18]], ["Caisse", "CAISSE", "Entrées et sorties enregistrées", cash, ["Clé dossier", "Date", "Libellé", "Sens", "Montant (DA)"], [12, 14, 28, 16, 18]]];
  sheets.forEach(([name, title, subtitle, rows, headers, widths]) => XLSXStyle.utils.book_append_sheet(workbook, styledTable(title, subtitle, rows, headers, widths), name));
  const date = new Date().toISOString().slice(0, 10); XLSXStyle.writeFile(workbook, `fiche-client-archive-officielle-${date}.xlsx`);
}
