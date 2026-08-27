export type RegistryScope = "compte" | "utilisateur" | "système";
export type RegistrySource = "statuts" | "options-compte" | "valeurs-protégées" | "catalogue-rc-excel";
export type RegistryMode = "administrable" | "lecture-seule";

export const accountOptionKinds = ["legalForm", "clientType", "regime", "taxCenter", "activityKind", "contactType", "vaultCategory", "documentCategory", "documentStatus"] as const;
export type AccountOptionKind = typeof accountOptionKinds[number];

export const accountOptionDefaults: Record<AccountOptionKind, readonly { code: string; label: string }[]> = {
  legalForm: [{ code: "physical", label: "Personne physique" }, { code: "legal", label: "Personne morale" }],
  clientType: [{ code: "new", label: "Nouveau client" }, { code: "former", label: "Ancien client" }],
  regime: [{ code: "real", label: "Régime réel" }, { code: "simplified", label: "Régime réel simplifié" }, { code: "ifu", label: "Régime IFU" }],
  taxCenter: [{ code: "cdi", label: "CDI" }, { code: "cpi", label: "CPI" }],
  activityKind: [{ code: "farmer", label: "Agriculteur" }, { code: "craft", label: "Artisanat" }, { code: "self-employed", label: "Auto-entrepreneur" }, { code: "rc", label: "Registre de commerce" }],
  contactType: [{ code: "phone", label: "Téléphone" }, { code: "email", label: "E-mail" }, { code: "other", label: "Autre" }],
  vaultCategory: [{ code: "fiscal", label: "Fiscal" }, { code: "banking", label: "Bancaire" }, { code: "administration", label: "Administration" }, { code: "social", label: "Réseaux sociaux" }, { code: "other", label: "Autre" }],
  documentCategory: [{ code: "identity", label: "Identité" }, { code: "fiscal", label: "Fiscal" }, { code: "accounting", label: "Comptabilité" }, { code: "social", label: "Social" }, { code: "other", label: "Autre" }],
  documentStatus: [{ code: "received", label: "Reçu" }, { code: "review", label: "À vérifier" }, { code: "requested", label: "À demander" }, { code: "not-required", label: "Non requis" }],
};

export const protectedReferenceChoices = {
  autoEntrepreneurActivity: [{ value: "", label: "Choisir une option" }, { value: "Micro-importation", label: "Micro-importation" }, { value: "Prestation de services", label: "Prestation de services" }],
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
  group: "Dossiers" | "Référentiels" | "Activité" | "Documents" | "Finance" | "Compte" | "Transferts";
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
  { id: "taxCenter", title: "Centres d’impôt", description: "Centres proposés dans les fiches client.", group: "Référentiels", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "taxCenter", usageLabel: "dossiers" },
  { id: "activityKind", title: "Domaines d’activité", description: "Domaines proposés pour qualifier un dossier.", group: "Activité", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "activityKind", usageLabel: "dossiers" },
  { id: "contactType", title: "Types de contact", description: "Nature des coordonnées ajoutées à un dossier.", group: "Référentiels", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "contactType", usageLabel: "contacts" },
  { id: "vaultCategory", title: "Catégories d’accès", description: "Classement des identifiants chiffrés du dossier.", group: "Référentiels", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "vaultCategory", usageLabel: "accès chiffrés" },
  { id: "documentCategory", title: "Catégories de document", description: "Classement des justificatifs, dont C20.", group: "Documents", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "documentCategory", usageLabel: "documents" },
  { id: "documentStatus", title: "Statuts de document", description: "États proposés pour les justificatifs.", group: "Documents", scope: "compte", source: "options-compte", mode: "administrable", optionKind: "documentStatus", usageLabel: "documents" },
  { id: "autoEntrepreneurActivity", title: "Activités d’auto-entrepreneur", description: "Sous-types autorisés pour les auto-entrepreneurs.", group: "Activité", scope: "système", source: "valeurs-protégées", mode: "lecture-seule", usageLabel: "dossiers" },
  { id: "registreCommerce", title: "Registre de commerce", description: "Catégories et activités administrées par le cabinet.", group: "Activité", scope: "compte", source: "catalogue-rc-excel", mode: "administrable", usageLabel: "dossiers" },
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
