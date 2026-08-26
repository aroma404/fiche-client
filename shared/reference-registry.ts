export type RegistryScope = "compte" | "utilisateur" | "système";
export type RegistrySource = "statuts" | "options-compte" | "valeurs-protégées" | "catalogue-rc-excel";
export type RegistryMode = "administrable" | "lecture-seule";

export const accountOptionKinds = ["legalForm", "clientType", "regime", "contactType", "vaultCategory"] as const;
export type AccountOptionKind = typeof accountOptionKinds[number];

export const accountOptionDefaults: Record<AccountOptionKind, readonly { code: string; label: string }[]> = {
  legalForm: [{ code: "physical", label: "Personne physique" }, { code: "legal", label: "Personne morale" }],
  clientType: [{ code: "new", label: "Nouveau client" }, { code: "former", label: "Ancien client" }],
  regime: [{ code: "real", label: "Régime réel" }, { code: "simplified", label: "Régime réel simplifié" }, { code: "ifu", label: "Régime IFU" }],
  contactType: [{ code: "phone", label: "Téléphone" }, { code: "email", label: "E-mail" }, { code: "other", label: "Autre" }],
  vaultCategory: [{ code: "fiscal", label: "Fiscal" }, { code: "banking", label: "Bancaire" }, { code: "administration", label: "Administration" }, { code: "social", label: "Réseaux sociaux" }, { code: "other", label: "Autre" }],
};

export const protectedReferenceChoices = {
  activityKind: [{ value: "", label: "Choisir le domaine" }, { value: "Agriculture", label: "Agriculture" }, { value: "Artisanat", label: "Artisanat" }, { value: "Auto-entrepreneur", label: "Auto-entrepreneur" }, { value: "Registre de commerce", label: "Registre de commerce" }],
  autoEntrepreneurActivity: [{ value: "", label: "Choisir une option" }, { value: "Micro-importation", label: "Micro-importation" }, { value: "Prestation de services", label: "Prestation de services" }],
  taxCenter: [{ value: "CDI", label: "CDI" }, { value: "CPI", label: "CPI" }],
  documentStatus: [{ value: "Reçu", label: "Reçu" }, { value: "À vérifier", label: "À vérifier" }, { value: "À demander", label: "À demander" }, { value: "Non requis", label: "Non requis" }],
  complianceStatus: [{ value: "À vérifier", label: "À vérifier" }, { value: "Conforme", label: "Conforme" }, { value: "À régulariser", label: "À régulariser" }],
  caseType: [{ value: "CDI", label: "CDI" }, { value: "CPI", label: "CPI" }, { value: "CASNOS", label: "CASNOS" }, { value: "Autre", label: "Autre" }],
  caseStatus: [{ value: "À préparer", label: "À préparer" }, { value: "En cours", label: "En cours" }, { value: "Terminé", label: "Terminé" }],
  financeCategory: [{ value: "Paiement", label: "Paiement" }, { value: "Caisse", label: "Caisse" }],
  financeDirection: [{ value: "Entrée", label: "Entrée" }, { value: "Sortie", label: "Sortie" }],
  preferredExportFormat: [{ value: "xlsx", label: "Classeur Excel" }, { value: "json", label: "Archive JSON" }],
  preferredDocumentMode: [{ value: "pdf", label: "PDF" }, { value: "print", label: "Impression" }],
  exportScope: [{ value: "active", label: "Dossier actif" }, { value: "selected", label: "Dossiers sélectionnés" }, { value: "all", label: "Tous les dossiers" }],
} as const;

export type ProgramReferenceDefinition = {
  id: string;
  title: string;
  description: string;
  group: "Dossiers" | "Référentiels" | "Activité" | "Conformité" | "Finance" | "Compte" | "Transferts";
  scope: RegistryScope;
  source: RegistrySource;
  mode: RegistryMode;
  optionKind?: AccountOptionKind;
  usageLabel: string;
};

export const programReferenceRegistry: readonly ProgramReferenceDefinition[] = [
  { id: "clientStatus", title: "Statuts client", description: "États opérationnels des dossiers.", group: "Dossiers", scope: "compte", source: "statuts", mode: "administrable", usageLabel: "dossiers" },
  { id: "legalForm", title: "Formes juridiques", description: "Valeurs proposées dans l’identité fiscale du dossier.", group: "Référentiels", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "legalForm", usageLabel: "dossiers" },
  { id: "clientType", title: "Types de client", description: "Qualification commerciale du dossier.", group: "Référentiels", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "clientType", usageLabel: "dossiers" },
  { id: "regime", title: "Régimes fiscaux", description: "Références fiscales proposées dans chaque fiche.", group: "Référentiels", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "regime", usageLabel: "dossiers" },
  { id: "contactType", title: "Types de contact", description: "Nature des coordonnées ajoutées à un dossier.", group: "Référentiels", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "contactType", usageLabel: "contacts" },
  { id: "vaultCategory", title: "Catégories d’accès", description: "Classement des identifiants chiffrés du dossier.", group: "Référentiels", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "vaultCategory", usageLabel: "accès chiffrés" },
  { id: "activityKind", title: "Domaines d’activité", description: "Domaine professionnel encadré du dossier.", group: "Activité", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "dossiers" },
  { id: "autoEntrepreneurActivity", title: "Activités d’auto-entrepreneur", description: "Sous-types autorisés pour les auto-entrepreneurs.", group: "Activité", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "dossiers" },
  { id: "registreCommerce", title: "Registre de commerce", description: "Catégories et activités strictement issues du catalogue Excel du cabinet.", group: "Activité", scope: "système", source: "catalogue-rc-excel", mode: "lecture-seule", usageLabel: "dossiers" },
  { id: "taxCenter", title: "Centres d’impôt", description: "Centres proposés dans les fiches, réglables dossier par dossier.", group: "Référentiels", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "dossiers" },
  { id: "documentStatus", title: "Statuts documentaires", description: "États contrôlés des justificatifs.", group: "Conformité", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "documents" },
  { id: "complianceStatus", title: "Statuts de conformité", description: "États contrôlés des vérifications.", group: "Conformité", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "contrôles" },
  { id: "caseType", title: "Types de dossiers", description: "Cadres de dossier réglementaires.", group: "Conformité", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "dossiers de travail" },
  { id: "caseStatus", title: "Statuts de dossiers", description: "Avancement des dossiers de travail.", group: "Conformité", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "dossiers de travail" },
  { id: "financeCategory", title: "Natures financières", description: "Catégories protégées du registre financier.", group: "Finance", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "opérations" },
  { id: "financeDirection", title: "Sens financier", description: "Entrée ou sortie du registre financier.", group: "Finance", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "opérations" },
  { id: "preferredExportFormat", title: "Format d’export préféré", description: "Préférence personnelle conservée dans Mon compte.", group: "Compte", scope: "utilisateur", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "préférences" },
  { id: "preferredDocumentMode", title: "Mode documentaire préféré", description: "Préférence personnelle conservée dans Mon compte.", group: "Compte", scope: "utilisateur", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "préférences" },
  { id: "exportScope", title: "Périmètre d’export", description: "Choix ponctuel du centre d’importation et d’exportation.", group: "Transferts", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "exports" },
] as const;

export type ProgramReferenceId = typeof programReferenceRegistry[number]["id"];

export function getProgramReference(id: ProgramReferenceId) {
  return programReferenceRegistry.find(reference => reference.id === id)!;
}

export function isAccountOptionKind(value: string): value is AccountOptionKind {
  return (accountOptionKinds as readonly string[]).includes(value);
}
