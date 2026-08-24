/** Atelier fiscal moderne — modèles métier anonymes, temporaires et typés. */

export type Status = "À demander" | "Reçu" | "À vérifier" | "Non requis";
export type ComplianceStatus = "À préparer" | "En cours" | "Terminé";

export interface DocumentItem {
  id: string;
  label: string;
  category: string;
  status: Status;
  note: string;
}

export interface ComplianceItem {
  id: string;
  label: string;
  organisme: string;
  status: ComplianceStatus;
  echeance: string;
}

export interface WorkCase {
  id: string;
  label: string;
  type: "CDI" | "CPI" | "CASNOS" | "Autre";
  status: ComplianceStatus;
  note: string;
}

export interface Payment {
  id: string;
  date: string;
  objet: string;
  reference: string;
  montant: number;
}

export interface CashEntry {
  id: string;
  date: string;
  libelle: string;
  type: "Recette" | "Dépense" | "Frais";
  montant: number;
}

export interface FicheState {
  general: Record<string, string>;
  fiscal: Record<string, string>;
  documents: DocumentItem[];
  compliance: ComplianceItem[];
  cases: WorkCase[];
  payments: Payment[];
  cashEntries: CashEntry[];
  soldeInitial: number;
  observations: string;
}

export const createInitialFicheState = (): FicheState => ({
  general: {
    raisonSociale: "",
    activite: "",
    formeJuridique: "Personne physique",
    typeClient: "Particulier",
    statut: "Actif",
    commune: "",
    contact: "",
  },
  fiscal: {
    nif: "",
    rc: "",
    articleImposition: "",
    nin: "",
    bp: "",
    regime: "Principal",
  },
  documents: [
    ["cachet", "Cachet", "Identité"],
    ["g8", "G8", "Fiscal"],
    ["nif", "NIF", "Fiscal"],
    ["nis", "NIS", "Fiscal"],
    ["bp", "BP", "Fiscal"],
    ["livres", "Livres obligatoires", "Comptabilité"],
    ["g12", "G12", "Fiscal"],
    ["g12bis", "G12 bis", "Fiscal"],
    ["tapp", "TAP / TFPC", "Fiscal"],
    ["g50", "G50 ter", "Fiscal"],
    ["301bis", "301 bis", "Fiscal"],
    ["extrait", "Extrait de rôle", "Fiscal"],
  ].map(([id, label, category]) => ({ id, label, category, status: "À demander" as Status, note: "" })),
  compliance: [
    { id: "cnas", label: "Déclaration CNAS", organisme: "CNAS", status: "À préparer", echeance: "" },
    { id: "casnos", label: "Déclaration CASNOS", organisme: "CASNOS", status: "À préparer", echeance: "" },
    { id: "cacobatph", label: "Déclaration CACOBATPH", organisme: "CACOBATPH", status: "À préparer", echeance: "" },
  ],
  cases: [
    { id: "cdi", label: "Dossier CDI", type: "CDI", status: "À préparer", note: "" },
    { id: "cpi", label: "Dossier CPI", type: "CPI", status: "À préparer", note: "" },
    { id: "casnos-case", label: "Dossier CASNOS", type: "CASNOS", status: "À préparer", note: "" },
  ],
  payments: [],
  cashEntries: [],
  soldeInitial: 0,
  observations: "",
});
