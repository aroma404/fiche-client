/** Atelier fiscal moderne — modèle de dossier utilisable par les écrans et compatible avec l’API persistante. */

export type DocumentStatus = string;
export type ComplianceStatus = "À vérifier" | "Conforme" | "À régulariser";
export type CaseStatus = "À préparer" | "En cours" | "Terminé";
export type LegalForm = string;
export type ClientType = string;
export type ClientStatus = string;
export type FiscalRegime = string;
export type TaxCenter = string;
export type ActivityKind = string;
export type AutoEntrepreneurActivity = "" | "Micro-importation" | "Prestation de services";

export type ClientDraft = {
  client: { referenceNumber: number | null; fullName: string; activity: string; activityKind: ActivityKind; autoEntrepreneurActivity: AutoEntrepreneurActivity; rcActivityFamily: string; rcActivityCode: string; legalForm: LegalForm; clientType: ClientType; status: ClientStatus; commune: string; contact: string; nif: string; rc: string; bp: string; taxArticle: string; nin: string; regime: FiscalRegime; taxCenter: TaxCenter; cnasAffiliated: boolean; casnosAffiliated: boolean; cacobatphAffiliated: boolean; initialBalance: number | null; observations: string };
  documents: { id?: number; label: string; category: string; status: DocumentStatus; paymentDone: boolean; note: string }[];
  /** Compatibilité d’import historique : non affiché ni réécrit par les parcours actifs. */
  compliance: { label: string; status: ComplianceStatus; note: string }[];
  /** Compatibilité d’import historique : non affiché ni réécrit par les parcours actifs. */
  cases: { label: string; caseType: "CDI" | "CPI" | "CASNOS" | "Autre"; status: CaseStatus; note: string }[];
  payments: { paymentDate: string; label: string; reference: string; amount: number }[];
  cashEntries: { entryDate: string; label: string; direction: "Entrée" | "Sortie"; amount: number }[];
  financeEntries: { id?: number; documentId?: number | null; clientTransactionReference?: number | null; entryDate: string; category: "Paiement" | "Caisse"; direction: "Entrée" | "Sortie"; label: string; reference: string; amount: number; note: string }[];
  files: { id?: number; documentId?: number | null; displayName: string; category: string; originalName: string; mimeType: string; sizeBytes: number }[];
  contacts: { id?: number; label: string; type: "Téléphone" | "E-mail" | "Autre"; value: string; isPrimary: boolean }[];
};

const documentDefaults = [["Cachet", "Identité"], ["G8", "Fiscal"], ["NIF", "Fiscal"], ["NIS", "Fiscal"], ["BP", "Fiscal"], ["Livres obligatoires", "Comptabilité"], ["G12", "Fiscal"], ["G12 bis", "Fiscal"], ["TAPP", "Fiscal"], ["G50 ter", "Fiscal"], ["301 bis", "Fiscal"], ["Extrait de rôle", "Fiscal"]] as const;

export function taxCenterForRegimeCode(code: string): TaxCenter { return code === "ifu" ? "CPI" : "CDI"; }
export function taxCenterForRegime(regime: FiscalRegime): TaxCenter { return taxCenterForRegimeCode(regime === "Régime IFU" ? "ifu" : "real"); }

export function createClientDraft(fullName = ""): ClientDraft {
  return {
    client: { referenceNumber: null, fullName, activity: "", activityKind: "", autoEntrepreneurActivity: "", rcActivityFamily: "", rcActivityCode: "", legalForm: "Personne physique", clientType: "Nouveau client", status: "Actif", commune: "", contact: "", nif: "", rc: "", bp: "", taxArticle: "", nin: "", regime: "Régime réel", taxCenter: "CDI", cnasAffiliated: false, casnosAffiliated: false, cacobatphAffiliated: false, initialBalance: null, observations: "" },
    documents: documentDefaults.map(([label, category]) => ({ label, category, status: "À demander" as DocumentStatus, paymentDone: false, note: "" })),
    compliance: [], cases: [],
    payments: [], cashEntries: [], financeEntries: [], files: [], contacts: [],
  };
}

export function normalizeBundle(raw: any): ClientDraft {
  const fallback = createClientDraft(raw?.client?.fullName ?? "");
  if (!raw?.client) return fallback;
  return {
    client: {
      referenceNumber: raw.client.referenceNumber === null || raw.client.referenceNumber === undefined ? null : Number(raw.client.referenceNumber), fullName: String(raw.client.fullName ?? fallback.client.fullName), activity: String(raw.client.activity ?? fallback.client.activity), activityKind: raw.client.activityKind === "Agriculture" ? "Agriculteur" : String(raw.client.activityKind ?? ""), autoEntrepreneurActivity: raw.client.autoEntrepreneurActivity === "Micro-importation" || raw.client.autoEntrepreneurActivity === "Prestation de services" ? raw.client.autoEntrepreneurActivity : "", rcActivityFamily: String(raw.client.rcActivityFamily ?? ""), rcActivityCode: String(raw.client.rcActivityCode ?? ""), legalForm: String(raw.client.legalForm ?? fallback.client.legalForm), clientType: String(raw.client.clientType ?? fallback.client.clientType), status: String(raw.client.status ?? fallback.client.status).trim() || fallback.client.status, commune: String(raw.client.commune ?? fallback.client.commune), contact: String(raw.client.contact ?? fallback.client.contact), nif: String(raw.client.nif ?? fallback.client.nif), rc: String(raw.client.rc ?? fallback.client.rc), bp: String(raw.client.bp ?? fallback.client.bp), taxArticle: String(raw.client.taxArticle ?? fallback.client.taxArticle), nin: String(raw.client.nin ?? fallback.client.nin), regime: String(raw.client.regime ?? fallback.client.regime), taxCenter: String(raw.client.taxCenter ?? taxCenterForRegime(String(raw.client.regime ?? fallback.client.regime))), cnasAffiliated: Boolean(raw.client.cnasAffiliated), casnosAffiliated: Boolean(raw.client.casnosAffiliated), cacobatphAffiliated: Boolean(raw.client.cacobatphAffiliated), initialBalance: raw.client.initialBalance === null || raw.client.initialBalance === "" || raw.client.initialBalance === undefined ? null : Number(raw.client.initialBalance), observations: String(raw.client.observations ?? ""),
    },
    documents: (raw.documents ?? fallback.documents).map((x: any) => ({ id: x.id, label: String(x.label ?? "").replace(/^TAP\s*\/\s*TFPC$/i, "TAPP"), category: x.category ?? "Fiscal", status: String(x.status ?? "À demander"), paymentDone: Boolean(x.paymentDone), note: x.note ?? "" })),
    compliance: (raw.compliance ?? []).map((x: any) => ({ label: x.label, status: x.status as ComplianceStatus, note: x.note ?? "" })),
    cases: (raw.cases ?? raw.workCases ?? []).map((x: any) => ({ label: x.label, caseType: (x.caseType ?? x.type ?? "Autre") as ClientDraft["cases"][number]["caseType"], status: x.status as CaseStatus, note: x.note ?? "" })),
    payments: (raw.payments ?? []).map((x: any) => ({ paymentDate: x.paymentDate ?? x.date ?? "", label: x.label ?? x.objet ?? "", reference: x.reference ?? "", amount: Number(x.amount ?? x.montant ?? 0) })),
    cashEntries: (raw.cashEntries ?? []).map((x: any) => ({ entryDate: x.entryDate ?? x.date ?? "", label: x.label ?? x.libelle ?? "", direction: (x.direction ?? (x.type === "Dépense" ? "Sortie" : "Entrée")) as "Entrée" | "Sortie", amount: Number(x.amount ?? x.montant ?? 0) })),
    financeEntries: (raw.financeEntries ?? []).map((x: any) => ({ id: x.id, documentId: x.documentId ?? null, clientTransactionReference: x.clientTransactionReference ?? null, entryDate: x.entryDate ?? x.date ?? "", category: x.category === "Caisse" ? "Caisse" : "Paiement", direction: x.direction === "Sortie" ? "Sortie" : "Entrée", label: x.label ?? "", reference: x.reference ?? "", amount: Number(x.amount ?? 0), note: x.note ?? "" })),
    files: (raw.files ?? []).map((x: any) => ({ id: x.id, documentId: x.documentId ?? null, displayName: String(x.displayName ?? x.originalName ?? "Fichier"), category: String(x.category ?? "Autre"), originalName: String(x.originalName ?? x.displayName ?? "fichier"), mimeType: String(x.mimeType ?? "application/octet-stream"), sizeBytes: Number(x.sizeBytes ?? 0) })),
    contacts: (raw.contacts?.length ? raw.contacts : raw.client.contact ? [{ label: "Contact principal", type: raw.client.contact.includes("@") ? "E-mail" : "Téléphone", value: raw.client.contact, isPrimary: true }] : []).map((x: any) => ({ id: x.id, label: String(x.label ?? ""), type: x.type === "E-mail" || x.type === "Autre" ? x.type : "Téléphone", value: String(x.value ?? ""), isPrimary: Boolean(x.isPrimary) })),
  };
}

export function formatDA(value: number | null | undefined) { return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 2 }).format(Number(value ?? 0)); }
export function financeEntriesForBundle(draft: ClientDraft): ClientDraft["financeEntries"] {
  if (draft.financeEntries.length) return draft.financeEntries;
  return [
    ...draft.payments.map(entry => ({ entryDate: entry.paymentDate, category: "Paiement" as const, direction: "Entrée" as const, label: entry.label, reference: entry.reference, amount: entry.amount, note: "" })),
    ...draft.cashEntries.map(entry => ({ entryDate: entry.entryDate, category: "Caisse" as const, direction: entry.direction, label: entry.label, reference: "", amount: entry.amount, note: "" })),
  ];
}
export function paymentTotal(draft: ClientDraft) { return financeEntriesForBundle(draft).filter(entry => entry.category === "Paiement").reduce((total, entry) => total + (entry.direction === "Entrée" ? Number(entry.amount || 0) : -Number(entry.amount || 0)), 0); }
export function cashTotal(draft: ClientDraft) { return financeEntriesForBundle(draft).filter(entry => entry.category === "Caisse").reduce((total, entry) => total + (entry.direction === "Entrée" ? Number(entry.amount || 0) : -Number(entry.amount || 0)), 0); }
export function isOperationalClient(client: { status?: string | null; archivedAt?: Date | string | null }, operationalStatuses: readonly string[] = ["Actif"]) { return !client.archivedAt && Boolean(client.status && operationalStatuses.includes(client.status)); }
