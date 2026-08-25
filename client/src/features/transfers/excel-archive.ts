/** Archive Excel professionnelle : fiche complète d'abord, sommaire et tables réimportables ensuite. */

import * as XLSXStyle from "xlsx-js-style";
import { cashTotal, normalizeBundle, paymentTotal, type ClientDraft } from "@/lib/client-data";

type ExportPayload = { schemaVersion: 1; exportedAt: string; clients: unknown[] };
type CellStyle = Record<string, unknown>;
type ArchiveRow = Record<string, string | number>;

const navy = "102A43";
const teal = "0F766E";
const pale = "EAF3F0";
const titleStyle: CellStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 }, fill: { fgColor: { rgb: navy } }, alignment: { horizontal: "left", vertical: "center" } };
const subtitleStyle: CellStyle = { font: { bold: true, color: { rgb: teal }, sz: 10 }, fill: { fgColor: { rgb: pale } }, alignment: { vertical: "center", wrapText: true } };
const headerStyle: CellStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 9 }, fill: { fgColor: { rgb: teal } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: { top: { style: "thin", color: { rgb: "0B625D" } }, bottom: { style: "thin", color: { rgb: "0B625D" } } } };
const sectionStyle: CellStyle = { font: { bold: true, color: { rgb: navy }, sz: 10 }, fill: { fgColor: { rgb: "FFF5DB" } }, alignment: { vertical: "center" } };
const labelStyle: CellStyle = { font: { bold: true, color: { rgb: "526775" }, sz: 9 }, fill: { fgColor: { rgb: "F5F8F7" } }, alignment: { vertical: "center", wrapText: true } };
const evenStyle: CellStyle = { fill: { fgColor: { rgb: "F7FAF8" } }, alignment: { vertical: "top", wrapText: true }, border: { bottom: { style: "hair", color: { rgb: "D7E0DF" } } } };
const oddStyle: CellStyle = { fill: { fgColor: { rgb: "FFFFFF" } }, alignment: { vertical: "top", wrapText: true }, border: { bottom: { style: "hair", color: { rgb: "D7E0DF" } } } };
const navigationStyle: CellStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10, underline: false }, fill: { fgColor: { rgb: teal } }, alignment: { vertical: "center" }, border: { top: { style: "thin", color: { rgb: "0B625D" } }, bottom: { style: "thin", color: { rgb: "0B625D" } }, left: { style: "thin", color: { rgb: "0B625D" } }, right: { style: "thin", color: { rgb: "0B625D" } } } };

function tableSheet(title: string, subtitle: string, rows: ArchiveRow[], headers: string[], widths: number[]) {
  const ws = XLSXStyle.utils.aoa_to_sheet([[title], [subtitle], [], headers, ...rows.map(row => headers.map(header => row[header] ?? ""))]);
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(headers.length - 1, 0) } }, { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(headers.length - 1, 0) } }];
  ws["!cols"] = widths.map(width => ({ wch: width }));
  ws["!rows"] = [{ hpt: 28 }, { hpt: 22 }, { hpt: 8 }, { hpt: 26 }];
  ws["!freeze"] = { xSplit: 0, ySplit: 4 };
  ws["A1"].s = titleStyle;
  ws["A2"].s = subtitleStyle;
  headers.forEach((_, index) => { const cell = ws[XLSXStyle.utils.encode_cell({ r: 3, c: index })]; if (cell) cell.s = headerStyle; });
  rows.forEach((_, rowIndex) => headers.forEach((_, colIndex) => { const cell = ws[XLSXStyle.utils.encode_cell({ r: rowIndex + 4, c: colIndex })]; if (cell) cell.s = rowIndex % 2 ? evenStyle : oddStyle; }));
  ws["!autofilter"] = { ref: `A4:${XLSXStyle.utils.encode_col(Math.max(0, headers.length - 1))}${Math.max(4, rows.length + 4)}` };
  return ws;
}

function appendSection(rows: (string | number)[][], title: string, pairs: [string, string | number][]) { rows.push([title], ...pairs.map(([label, value]) => [label, value]), []); }

function detailedClientSheet(bundle: ClientDraft, index: number) {
  const { client } = bundle;
  const rows: (string | number)[][] = [["FICHE DE SUIVI FISCAL — ARCHIVE CLIENT"], [`Dossier n° ${index + 1} · ${client.fullName}`], ["Fiche administrative complète — à vérifier avant transmission ou impression"], []];
  appendSection(rows, "IDENTITÉ ET ACTIVITÉ", [["Nom / raison sociale", client.fullName], ["Activité", client.activity], ["Forme juridique", client.legalForm], ["Type de client", client.clientType], ["Statut", client.status], ["Commune", client.commune], ["Contact", client.contact]]);
  appendSection(rows, "RÉFÉRENCES FISCALES ET JURIDIQUES", [["NIF", client.nif], ["N° RC", client.rc], ["BP", client.bp], ["Article d’imposition", client.taxArticle], ["NIN", client.nin], ["Régime", client.regime]]);
  appendSection(rows, "SITUATION FINANCIÈRE (DA)", [["Solde initial", client.initialBalance], ["Versements saisis", paymentTotal(bundle)], ["Solde final", client.initialBalance - paymentTotal(bundle)], ["Solde de caisse", cashTotal(bundle)]]);
  appendSection(rows, "OBSERVATIONS", [["Notes", client.observations || "Aucune observation renseignée."]]);
  rows.push(["DOCUMENTS"], ["Document", "Catégorie", "Statut", "Observation"], ...(bundle.documents.length ? bundle.documents.map(item => [item.label, item.category, item.status, item.note]) : [["Aucun document", "", "", ""]]), []);
  rows.push(["CONFORMITÉ"], ["Obligation", "Statut", "Note"], ...(bundle.compliance.length ? bundle.compliance.map(item => [item.label, item.status, item.note]) : [["Aucune obligation", "", ""]]), []);
  rows.push(["DOSSIERS DE TRAVAIL"], ["Dossier", "Type", "Statut", "Note"], ...(bundle.cases.length ? bundle.cases.map(item => [item.label, item.caseType, item.status, item.note]) : [["Aucun dossier", "", "", ""]]), []);
  rows.push(["PAIEMENTS"], ["Date", "Objet", "Référence", "Montant (DA)"], ...(bundle.payments.length ? bundle.payments.map(item => [item.paymentDate, item.label, item.reference, item.amount]) : [["", "Aucun paiement", "", 0]]), []);
  rows.push(["CAISSE"], ["Date", "Libellé", "Sens", "Montant (DA)"], ...(bundle.cashEntries.length ? bundle.cashEntries.map(item => [item.entryDate, item.label, item.direction, item.amount]) : [["", "Aucune entrée", "", 0]]));
  const ws = XLSXStyle.utils.aoa_to_sheet(rows);
  const sectionNames = new Set(["IDENTITÉ ET ACTIVITÉ", "RÉFÉRENCES FISCALES ET JURIDIQUES", "SITUATION FINANCIÈRE (DA)", "OBSERVATIONS", "DOCUMENTS", "CONFORMITÉ", "DOSSIERS DE TRAVAIL", "PAIEMENTS", "CAISSE"]);
  ws["!cols"] = [{ wch: 28 }, { wch: 28 }, { wch: 20 }, { wch: 42 }];
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, ...rows.map((row, r) => sectionNames.has(String(row[0] ?? "")) ? ({ s: { r, c: 0 }, e: { r, c: 3 } }) : null).filter(Boolean) as any];
  ws["!rows"] = [{ hpt: 30 }, { hpt: 24 }, { hpt: 20 }];
  ws["!freeze"] = { xSplit: 0, ySplit: 3 };
  ["A1", "A2", "A3"].forEach((cell, position) => { ws[cell].s = position === 0 ? titleStyle : subtitleStyle; });
  rows.forEach((row, r) => { const first = String(row[0] ?? ""); const isSection = sectionNames.has(first); const isHeader = ["Document", "Obligation", "Dossier", "Date"].includes(first); for (let c = 0; c < row.length; c += 1) { const cell = ws[XLSXStyle.utils.encode_cell({ r, c })]; if (!cell) continue; if (isSection) cell.s = sectionStyle; else if (isHeader) cell.s = headerStyle; else if (r > 3) cell.s = c === 0 ? labelStyle : r % 2 ? oddStyle : evenStyle; } });
  return ws;
}

function coverSheet(clients: ClientDraft[], exportedAt: string, ficheNames: string[], archiveSheets: string[]) {
  const firstClient = clients.length === 1 ? clients[0]?.client.fullName : `${clients.length} dossiers clients`;
  const archiveCards = [
    ["▤", "DOSSIERS CLIENTS", "Identité et références", "Clients", navy],
    ["▧", "DOCUMENTS", "Pièces et statut", "Documents", teal],
    ["✓", "CONFORMITÉ", "Obligations et suivi", "Conformité", "795B1D"],
    ["▣", "DOSSIERS", "Suivi de travail", "Dossiers", navy],
    ["€", "PAIEMENTS", "Versements saisis", "Paiements", teal],
    ["↔", "CAISSE", "Entrées et sorties", "Caisse", "795B1D"],
  ] as const;
  const cards = [
    ...clients.map((client, index) => ({ icon: "▣", title: `FICHE ${index + 1}`, subtitle: client.client.fullName || "Client", target: ficheNames[index], tone: teal })),
    ...archiveCards.map(([icon, title, subtitle, target, tone]) => ({ icon, title, subtitle, target, tone })),
  ];
  const ws = XLSXStyle.utils.aoa_to_sheet([["FICHE CLIENT IMPÔT — ARCHIVE COMPLÈTE"], [`${firstClient}`], ["Tableau de navigation : choisissez une icône pour ouvrir une fiche ou une table du dossier."], [], ["Date de préparation", new Date(exportedAt).toLocaleString("fr-FR")], ["Dossiers inclus", clients.length], ["Organisation", "Chaque fiche et chaque registre restent dans leur feuille dédiée."], ["Usage", "Vérifiez les données avant impression, transmission ou réimport."], [], ["NAVIGATION RAPIDE"]]);
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, { s: { r: 9, c: 0 }, e: { r: 9, c: 6 } }];
  ws["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 4 }, { wch: 18 }, { wch: 14 }, { wch: 16 }];
  ws["!rows"] = [{ hpt: 34 }, { hpt: 25 }, { hpt: 35 }, {}, {}, {}, {}, {}, {}, { hpt: 24 }];
  ws["A1"].s = titleStyle;
  ws["A2"].s = { font: { bold: true, color: { rgb: teal }, sz: 14 }, fill: { fgColor: { rgb: pale } }, alignment: { vertical: "center" } };
  ws["A3"].s = subtitleStyle;
  ["A5", "A6", "A7", "A8"].forEach(cell => { if (ws[cell]) ws[cell].s = labelStyle; });
  ["B5", "B6", "B7", "B8"].forEach(cell => { if (ws[cell]) ws[cell].s = evenStyle; });
  ws["A10"].s = sectionStyle;
  cards.forEach((card, index) => {
    const row = 11 + Math.floor(index / 2) * 4;
    const col = index % 2 === 0 ? 0 : 4;
    const key = XLSXStyle.utils.encode_cell({ r: row - 1, c: col });
    ws[key] = { t: "s", v: `${card.icon}\n${card.title}\n${card.subtitle}\n→ Ouvrir`, l: { Target: `#'${card.target}'!A1`, Tooltip: `Ouvrir ${card.target}` }, s: { ...navigationStyle, font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, underline: false }, fill: { fgColor: { rgb: card.tone } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } } } as any;
    merges.push({ s: { r: row - 1, c: col }, e: { r: row + 1, c: col + 2 } });
    ws["!rows"]![row - 1] = { hpt: 25 }; ws["!rows"]![row] = { hpt: 25 }; ws["!rows"]![row + 1] = { hpt: 25 };
  });
  ws["!merges"] = merges;
  ws["!ref"] = `A1:G${11 + Math.ceil(cards.length / 2) * 4}`;
  return ws;
}

function createStyledExcelArchive(payload: ExportPayload) {
  const clients = payload.clients.map(normalizeBundle);
  const workbook = XLSXStyle.utils.book_new();
  const detailNames = clients.map((_, index) => `Fiche ${index + 1}`);
  const archiveSheetNames = ["Clients", "Documents", "Conformité", "Dossiers", "Paiements", "Caisse"];
  XLSXStyle.utils.book_append_sheet(workbook, coverSheet(clients, payload.exportedAt, detailNames, archiveSheetNames), "Accueil");
  clients.forEach((bundle, index) => XLSXStyle.utils.book_append_sheet(workbook, detailedClientSheet(bundle, index), detailNames[index]));
  const clientRows: ArchiveRow[] = clients.map((bundle, index) => ({ "Clé dossier": index + 1, "Nom / raison sociale": bundle.client.fullName, Activité: bundle.client.activity, "Forme juridique": bundle.client.legalForm, "Type de client": bundle.client.clientType, Statut: bundle.client.status, Commune: bundle.client.commune, Contact: bundle.client.contact, NIF: bundle.client.nif, "N° RC": bundle.client.rc, BP: bundle.client.bp, "Article d’imposition": bundle.client.taxArticle, NIN: bundle.client.nin, Régime: bundle.client.regime, "Solde initial (DA)": bundle.client.initialBalance, Observations: bundle.client.observations }));
  const docs: ArchiveRow[] = clients.flatMap((bundle, index) => bundle.documents.map(item => ({ "Clé dossier": index + 1, Document: item.label, Catégorie: item.category, Statut: item.status, Observation: item.note })));
  const compliance: ArchiveRow[] = clients.flatMap((bundle, index) => bundle.compliance.map(item => ({ "Clé dossier": index + 1, Obligation: item.label, Statut: item.status, Note: item.note })));
  const cases: ArchiveRow[] = clients.flatMap((bundle, index) => bundle.cases.map(item => ({ "Clé dossier": index + 1, Dossier: item.label, Type: item.caseType, Statut: item.status, Note: item.note })));
  const payments: ArchiveRow[] = clients.flatMap((bundle, index) => bundle.payments.map(item => ({ "Clé dossier": index + 1, Date: item.paymentDate, Objet: item.label, Référence: item.reference, "Montant (DA)": item.amount })));
  const cash: ArchiveRow[] = clients.flatMap((bundle, index) => bundle.cashEntries.map(item => ({ "Clé dossier": index + 1, Date: item.entryDate, Libellé: item.label, Sens: item.direction, "Montant (DA)": item.amount })));
  const tables: [string, string, string, ArchiveRow[], string[], number[]][] = [["Clients", "DOSSIERS CLIENTS", "Identité, références et situation fiscale", clientRows, ["Clé dossier", "Nom / raison sociale", "Activité", "Forme juridique", "Type de client", "Statut", "Commune", "Contact", "NIF", "N° RC", "BP", "Article d’imposition", "NIN", "Régime", "Solde initial (DA)", "Observations"], [12, 30, 24, 20, 18, 14, 18, 20, 16, 14, 12, 20, 16, 16, 18, 36]], ["Documents", "DOCUMENTS", "Pièces et statut documentaire", docs, ["Clé dossier", "Document", "Catégorie", "Statut", "Observation"], [12, 28, 18, 16, 42]], ["Conformité", "CONFORMITÉ", "Obligations sociales et administratives", compliance, ["Clé dossier", "Obligation", "Statut", "Note"], [12, 32, 18, 42]], ["Dossiers", "DOSSIERS DE TRAVAIL", "Suivi CDI, CPI, CASNOS et autres", cases, ["Clé dossier", "Dossier", "Type", "Statut", "Note"], [12, 32, 16, 18, 42]], ["Paiements", "PAIEMENTS", "Versements enregistrés", payments, ["Clé dossier", "Date", "Objet", "Référence", "Montant (DA)"], [12, 14, 28, 22, 18]], ["Caisse", "CAISSE", "Entrées et sorties enregistrées", cash, ["Clé dossier", "Date", "Libellé", "Sens", "Montant (DA)"], [12, 14, 28, 16, 18]]];
  tables.forEach(([name, title, subtitle, rows, headers, widths]) => XLSXStyle.utils.book_append_sheet(workbook, tableSheet(title, subtitle, rows, headers, widths), name));
  (workbook as any).Workbook = { Views: [{ activeTab: 0 }] };
  const safeClientName = String(clients[0]?.client.fullName || "client").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "client";
  const fileName = `fiche-client-${safeClientName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const content = XLSXStyle.write(workbook, { bookType: "xlsx", type: "array" });
  return { fileName, blob: new Blob([content], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }) };
}

export function createIndividualExcelArchives(payload: ExportPayload) {
  return payload.clients.map(client => createStyledExcelArchive({ schemaVersion: 1, exportedAt: payload.exportedAt, clients: [client] }));
}
