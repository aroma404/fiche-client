/** Génération PDF autonome : aucune ouverture de la fenêtre d’impression. */

import type { jsPDF } from "jspdf";
import type { ClientDraft } from "@/lib/client-data";
import { paymentTotal } from "@/lib/client-data";

const palette = { navy: [16, 42, 67] as const, teal: [15, 118, 110] as const, gold: [201, 154, 62] as const, muted: [97, 119, 132] as const, paper: [246, 245, 240] as const };

function money(value: number) { return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 2 }).format(value); }
function field(pdf: jsPDF, x: number, y: number, label: string, value: string, width = 83) {
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(6.5); pdf.setTextColor(...palette.muted); pdf.text(label.toUpperCase(), x, y);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(...palette.navy);
  const lines = pdf.splitTextToSize(value || "—", width); pdf.text(lines.slice(0, 2), x, y + 4.2);
}
function section(pdf: jsPDF, y: number, title: string) { pdf.setDrawColor(...palette.gold); pdf.setLineWidth(0.8); pdf.line(12, y - 2, 12, y + 4); pdf.setTextColor(...palette.navy); pdf.setFont("helvetica", "bold"); pdf.setFontSize(8.5); pdf.text(title.toUpperCase(), 16, y + 2); }

export async function downloadFichePdf(draft: ClientDraft) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const payments = paymentTotal(draft);
  const received = draft.documents.filter(item => item.status === "Reçu");
  pdf.setFillColor(...palette.navy); pdf.rect(0, 0, 210, 30, "F");
  pdf.setFillColor(...palette.teal); pdf.rect(0, 27, 210, 3, "F");
  pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(17); pdf.text("FICHE DE SUIVI FISCAL", 12, 14);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5); pdf.text("Document administratif interne · à vérifier avant transmission", 12, 20);
  pdf.setFillColor(255, 255, 255); pdf.roundedRect(147, 8, 51, 14, 2, 2, "F"); pdf.setTextColor(...palette.teal); pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); pdf.text("STATUT", 151, 13); pdf.setTextColor(...palette.navy); pdf.setFontSize(9); pdf.text(draft.client.status || "Actif", 151, 18);
  pdf.setTextColor(...palette.muted); pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); pdf.text(`Édité le ${new Intl.DateTimeFormat("fr-DZ", { dateStyle: "long" }).format(new Date())}`, 12, 38);

  section(pdf, 47, "Identité et activité");
  field(pdf, 12, 55, "Nom / raison sociale", draft.client.fullName); field(pdf, 108, 55, "Activité", draft.client.activity);
  field(pdf, 12, 67, "Forme juridique", draft.client.legalForm); field(pdf, 108, 67, "Type de client", draft.client.clientType);
  field(pdf, 12, 79, "Commune", draft.client.commune); field(pdf, 108, 79, "Contacts", draft.contacts.length ? draft.contacts.map(item => `${item.label || item.type} : ${item.value}`).join(" · ") : draft.client.contact);

  section(pdf, 95, "Références fiscales et juridiques");
  field(pdf, 12, 103, "NIF", draft.client.nif); field(pdf, 60, 103, "N° RC", draft.client.rc, 38); field(pdf, 108, 103, "BP", draft.client.bp); field(pdf, 156, 103, "NIN", draft.client.nin, 38);
  field(pdf, 12, 115, "Article d’imposition", draft.client.taxArticle, 83); field(pdf, 108, 115, "Régime fiscal", draft.client.regime);
  field(pdf, 12, 127, "Centre d’impôt", draft.client.taxCenter, 83);

  section(pdf, 143, "Paiements et observations");
  const initialBalance = Number(draft.client.initialBalance ?? 0);
  const cards = [["SOLDE INITIAL", money(initialBalance), palette.paper], ["PAIEMENTS", money(payments), [232, 246, 240] as const], ["SOLDE ESTIMÉ", money(initialBalance - payments), [255, 248, 229] as const]];
  cards.forEach(([label, value, color], index) => { const x = 12 + index * 62; pdf.setFillColor(...(color as readonly [number, number, number])); pdf.roundedRect(x, 150, 56, 19, 2, 2, "F"); pdf.setTextColor(...palette.muted); pdf.setFont("helvetica", "bold"); pdf.setFontSize(6.5); pdf.text(label as string, x + 4, 157); pdf.setTextColor(...palette.navy); pdf.setFontSize(10); pdf.text(value as string, x + 4, 164); });
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(...palette.navy); pdf.text(pdf.splitTextToSize(draft.client.observations || "Aucune observation financière renseignée.", 180).slice(0, 2), 16, 178);

  section(pdf, 193, "Pièces reçues");
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5); pdf.setTextColor(...palette.navy);
  const pieceText = received.length ? received.slice(0, 8).map(item => `• ${item.label}${item.note ? ` — ${item.note}` : ""}`).join("\n") : "Aucune pièce marquée comme reçue.";
  pdf.text(pdf.splitTextToSize(pieceText, 180), 16, 202);
  pdf.setDrawColor(...palette.teal); pdf.setLineWidth(0.3); pdf.line(12, 269, 198, 269); pdf.setTextColor(...palette.muted); pdf.setFont("helvetica", "normal"); pdf.setFontSize(7); pdf.text("Fiche client impôt · document confidentiel", 12, 275); pdf.text("Signature / cachet", 165, 275);
  const safeName = (draft.client.fullName || "client").trim().replace(/[^a-z0-9à-ÿ]+/gi, "-").replace(/(^-|-$)/g, "");
  pdf.save(`fiche-suivi-${safeName || "client"}.pdf`);
}
