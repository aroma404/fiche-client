/** Atelier fiscal moderne — modèle de dossier utilisable par les écrans et compatible avec l’API persistante. */

export type DocumentStatus = "Reçu" | "À vérifier" | "À demander" | "Non requis";
export type ComplianceStatus = "À vérifier" | "Conforme" | "À régulariser";
export type CaseStatus = "À préparer" | "En cours" | "Terminé";

export type ClientDraft = {
  client: { fullName: string; activity: string; legalForm: string; clientType: string; status: string; commune: string; contact: string; nif: string; rc: string; bp: string; taxArticle: string; nin: string; regime: string; initialBalance: number; observations: string };
  documents: { label: string; category: string; status: DocumentStatus; note: string }[];
  compliance: { label: string; status: ComplianceStatus; note: string }[];
  cases: { label: string; caseType: "CDI" | "CPI" | "CASNOS" | "Autre"; status: CaseStatus; note: string }[];
  payments: { paymentDate: string; label: string; reference: string; amount: number }[];
  cashEntries: { entryDate: string; label: string; direction: "Entrée" | "Sortie"; amount: number }[];
};

const documentDefaults = [["Cachet", "Identité"], ["G8", "Fiscal"], ["NIF", "Fiscal"], ["NIS", "Fiscal"], ["BP", "Fiscal"], ["Livres obligatoires", "Comptabilité"], ["G12", "Fiscal"], ["G12 bis", "Fiscal"], ["TAP / TFPC", "Fiscal"], ["G50 ter", "Fiscal"], ["301 bis", "Fiscal"], ["Extrait de rôle", "Fiscal"]] as const;

export function createClientDraft(fullName = ""): ClientDraft {
  return {
    client: { fullName, activity: "", legalForm: "Personne physique", clientType: "Particulier", status: "Actif", commune: "", contact: "", nif: "", rc: "", bp: "", taxArticle: "", nin: "", regime: "Principal", initialBalance: 0, observations: "" },
    documents: documentDefaults.map(([label, category]) => ({ label, category, status: "À demander" as DocumentStatus, note: "" })),
    compliance: ["Déclaration CNAS", "Déclaration CASNOS", "Déclaration CACOBATPH"].map(label => ({ label, status: "À vérifier" as ComplianceStatus, note: "" })),
    cases: [{ label: "Dossier CDI", caseType: "CDI" as const, status: "À préparer" as CaseStatus, note: "" }, { label: "Dossier CPI", caseType: "CPI" as const, status: "À préparer" as CaseStatus, note: "" }, { label: "Dossier CASNOS", caseType: "CASNOS" as const, status: "À préparer" as CaseStatus, note: "" }],
    payments: [], cashEntries: [],
  };
}

export function normalizeBundle(raw: any): ClientDraft {
  const fallback = createClientDraft(raw?.client?.fullName ?? "");
  if (!raw?.client) return fallback;
  return {
    client: {
      fullName: String(raw.client.fullName ?? fallback.client.fullName), activity: String(raw.client.activity ?? fallback.client.activity), legalForm: String(raw.client.legalForm ?? fallback.client.legalForm), clientType: String(raw.client.clientType ?? fallback.client.clientType), status: String(raw.client.status ?? fallback.client.status), commune: String(raw.client.commune ?? fallback.client.commune), contact: String(raw.client.contact ?? fallback.client.contact), nif: String(raw.client.nif ?? fallback.client.nif), rc: String(raw.client.rc ?? fallback.client.rc), bp: String(raw.client.bp ?? fallback.client.bp), taxArticle: String(raw.client.taxArticle ?? fallback.client.taxArticle), nin: String(raw.client.nin ?? fallback.client.nin), regime: String(raw.client.regime ?? fallback.client.regime), initialBalance: Number(raw.client.initialBalance ?? 0), observations: String(raw.client.observations ?? ""),
    },
    documents: (raw.documents ?? fallback.documents).map((x: any) => ({ label: x.label, category: x.category ?? "Fiscal", status: x.status as DocumentStatus, note: x.note ?? "" })),
    compliance: (raw.compliance ?? fallback.compliance).map((x: any) => ({ label: x.label, status: x.status as ComplianceStatus, note: x.note ?? "" })),
    cases: (raw.cases ?? raw.workCases ?? fallback.cases).map((x: any) => ({ label: x.label, caseType: (x.caseType ?? x.type ?? "Autre") as ClientDraft["cases"][number]["caseType"], status: x.status as CaseStatus, note: x.note ?? "" })),
    payments: (raw.payments ?? []).map((x: any) => ({ paymentDate: x.paymentDate ?? x.date ?? "", label: x.label ?? x.objet ?? "", reference: x.reference ?? "", amount: Number(x.amount ?? x.montant ?? 0) })),
    cashEntries: (raw.cashEntries ?? []).map((x: any) => ({ entryDate: x.entryDate ?? x.date ?? "", label: x.label ?? x.libelle ?? "", direction: (x.direction ?? (x.type === "Dépense" ? "Sortie" : "Entrée")) as "Entrée" | "Sortie", amount: Number(x.amount ?? x.montant ?? 0) })),
  };
}

export function formatDA(value: number) { return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 2 }).format(value); }
export function paymentTotal(draft: ClientDraft) { return draft.payments.reduce((total, entry) => total + Number(entry.amount || 0), 0); }
export function cashTotal(draft: ClientDraft) { return draft.cashEntries.reduce((total, entry) => total + (entry.direction === "Entrée" ? Number(entry.amount || 0) : -Number(entry.amount || 0)), 0); }
