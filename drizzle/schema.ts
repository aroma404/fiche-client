/** Atelier fiscal moderne — schéma relationnel isolant les dossiers par compte connecté. */
import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  preferredExportFormat: mysqlEnum("preferredExportFormat", ["json", "xlsx"]).default("xlsx").notNull(),
  preferredDocumentMode: mysqlEnum("preferredDocumentMode", ["pdf", "print"]).default("pdf").notNull(),
  archiveRetentionDays: int("archiveRetentionDays").default(30).notNull(),
  allowImmediateArchiveDeletion: boolean("allowImmediateArchiveDeletion").default(false).notNull(),
  termsAcceptedAt: timestamp("termsAcceptedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("accounts_email_unique").on(table.email)]);

export const accountSessions = mysqlTable("account_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  accountId: int("accountId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  rememberMe: boolean("rememberMe").default(false).notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("account_sessions_account_idx").on(table.accountId), index("account_sessions_account_revoked_expiry_idx").on(table.accountId, table.revokedAt, table.expiresAt)]);

/** Coffre chiffré côté serveur, strictement isolé par compte et par dossier client. */
export const passwordVaultEntries = mysqlTable("password_vault_entries", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  clientId: int("clientId"),
  category: varchar("category", { length: 60 }).default("Autre").notNull(),
  platformName: varchar("platformName", { length: 180 }).notNull(),
  platformUrl: varchar("platformUrl", { length: 1200 }).default(""),
  email: varchar("email", { length: 320 }).default(""),
  phone: varchar("phone", { length: 80 }).default(""),
  username: varchar("username", { length: 320 }).default(""),
  encryptedPassword: text("encryptedPassword").notNull(),
  encryptionIv: varchar("encryptionIv", { length: 64 }).notNull(),
  encryptionTag: varchar("encryptionTag", { length: 64 }).notNull(),
  deletedAt: timestamp("deletedAt"),
  purgeAfter: timestamp("purgeAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("password_vault_entries_account_idx").on(table.accountId), index("password_vault_entries_account_client_idx").on(table.accountId, table.clientId), index("password_vault_entries_account_client_deleted_idx").on(table.accountId, table.clientId, table.deletedAt), index("password_vault_entries_purge_after_idx").on(table.purgeAfter)]);

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  referenceNumber: int("referenceNumber"),
  fullName: varchar("fullName", { length: 220 }).notNull(),
  activity: varchar("activity", { length: 220 }).default(""),
  activityKind: varchar("activityKind", { length: 80 }).default(""),
  autoEntrepreneurActivity: varchar("autoEntrepreneurActivity", { length: 80 }).default(""),
  rcActivityFamily: varchar("rcActivityFamily", { length: 10 }).default(""),
  rcActivityCode: varchar("rcActivityCode", { length: 10 }).default(""),
  legalForm: varchar("legalForm", { length: 80 }).default("Personne physique"),
  clientType: varchar("clientType", { length: 80 }).default("Nouveau client"),
  status: varchar("status", { length: 60 }).default("Actif"),
  commune: varchar("commune", { length: 160 }).default(""),
  contact: varchar("contact", { length: 160 }).default(""),
  nif: varchar("nif", { length: 80 }).default(""),
  rc: varchar("rc", { length: 80 }).default(""),
  bp: varchar("bp", { length: 80 }).default(""),
  taxArticle: varchar("taxArticle", { length: 80 }).default(""),
  nin: varchar("nin", { length: 80 }).default(""),
  regime: varchar("regime", { length: 80 }).default("Régime réel"),
  taxCenter: varchar("taxCenter", { length: 20 }).default("CDI"),
  cnasAffiliated: boolean("cnasAffiliated").default(false).notNull(),
  casnosAffiliated: boolean("casnosAffiliated").default(false).notNull(),
  cacobatphAffiliated: boolean("cacobatphAffiliated").default(false).notNull(),
  initialBalance: decimal("initialBalance", { precision: 14, scale: 2 }),
  observations: text("observations"),
  archivedAt: timestamp("archivedAt"),
  deletedAt: timestamp("deletedAt"),
  purgeAfter: timestamp("purgeAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("clients_account_idx").on(table.accountId), uniqueIndex("clients_account_reference_number_unique").on(table.accountId, table.referenceNumber), index("clients_account_name_idx").on(table.accountId, table.fullName), index("clients_account_archived_name_idx").on(table.accountId, table.archivedAt, table.fullName), index("clients_purge_after_idx").on(table.purgeAfter)]);

/** Compteur transactionnel, une ligne par compte, pour les références client non réutilisables. */
export const clientReferenceCounters = mysqlTable("client_reference_counters", {
  accountId: int("accountId").primaryKey(),
  nextReference: int("nextReference").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Statuts administrables des dossiers, strictement limités au compte propriétaire. */
export const programClientStatuses = mysqlTable("program_client_statuses", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  label: varchar("label", { length: 60 }).notNull(),
  isOperational: boolean("isOperational").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  deletedAt: timestamp("deletedAt"),
  purgeAfter: timestamp("purgeAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("program_client_statuses_account_idx").on(table.accountId), uniqueIndex("program_client_statuses_account_label_unique").on(table.accountId, table.label), index("program_client_statuses_account_deleted_sort_idx").on(table.accountId, table.deletedAt, table.sortOrder)]);

/** Valeurs administrables des listes client, isolées par cabinet et conservant un code métier stable. */
export const programClientOptions = mysqlTable("program_client_options", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  kind: varchar("kind", { length: 40 }).notNull(),
  code: varchar("code", { length: 80 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  deletedAt: timestamp("deletedAt"),
  purgeAfter: timestamp("purgeAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("program_client_options_account_kind_idx").on(table.accountId, table.kind), uniqueIndex("program_client_options_account_kind_code_unique").on(table.accountId, table.kind, table.code), index("program_client_options_account_kind_deleted_sort_idx").on(table.accountId, table.kind, table.deletedAt, table.sortOrder)]);

/** Catalogue RC personnel : il est exclusivement alimenté par une importation Excel contrôlée du cabinet. */
export const programRcCatalogueEntries = mysqlTable("program_rc_catalogue_entries", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  familyCode: varchar("familyCode", { length: 10 }).notNull(),
  activityCode: varchar("activityCode", { length: 16 }).notNull(),
  label: varchar("label", { length: 320 }).notNull(),
  sourceFilename: varchar("sourceFilename", { length: 255 }).notNull(),
  deletedAt: timestamp("deletedAt"),
  purgeAfter: timestamp("purgeAfter"),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
}, table => [uniqueIndex("program_rc_catalogue_account_activity_unique").on(table.accountId, table.activityCode), index("program_rc_catalogue_account_family_idx").on(table.accountId, table.familyCode), index("program_rc_catalogue_account_family_deleted_idx").on(table.accountId, table.familyCode, table.deletedAt), index("program_rc_catalogue_purge_after_idx").on(table.purgeAfter)]);

/** Catégories RC du cabinet, administrables indépendamment des activités. */
export const programRcCatalogueFamilies = mysqlTable("program_rc_catalogue_families", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  sourceFilename: varchar("sourceFilename", { length: 255 }).notNull(),
  deletedAt: timestamp("deletedAt"),
  purgeAfter: timestamp("purgeAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("program_rc_catalogue_families_account_code_unique").on(table.accountId, table.code), index("program_rc_catalogue_families_account_deleted_idx").on(table.accountId, table.deletedAt), index("program_rc_catalogue_families_purge_after_idx").on(table.purgeAfter)]);

/** Contacts administratifs du dossier. Les valeurs restent limitées au compte propriétaire du client. */
export const clientContacts = mysqlTable("client_contacts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  label: varchar("label", { length: 100 }).default(""),
  type: varchar("type", { length: 20 }).notNull(),
  value: varchar("value", { length: 320 }).notNull(),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  deletedAt: timestamp("deletedAt"),
  purgeAfter: timestamp("purgeAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("client_contacts_client_idx").on(table.clientId), index("client_contacts_client_deleted_idx").on(table.clientId, table.deletedAt), index("client_contacts_purge_after_idx").on(table.purgeAfter)]);

export const clientDocuments = mysqlTable("client_documents", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  category: varchar("category", { length: 100 }).default("Fiscal"),
  status: varchar("status", { length: 100 }).default("À demander").notNull(),
  note: varchar("note", { length: 500 }).default(""),
  deletedAt: timestamp("deletedAt"),
  purgeAfter: timestamp("purgeAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("client_documents_client_idx").on(table.clientId), index("client_documents_client_deleted_idx").on(table.clientId, table.deletedAt), index("client_documents_purge_after_idx").on(table.purgeAfter)]);

/** Métadonnées des fichiers du dossier. Les octets restent dans le stockage objet sécurisé. */
export const clientFiles = mysqlTable("client_files", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  clientId: int("clientId").notNull(),
  documentId: int("documentId"),
  displayName: varchar("displayName", { length: 180 }).notNull(),
  category: varchar("category", { length: 100 }).default("Autre").notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 600 }).notNull(),
  mimeType: varchar("mimeType", { length: 180 }).default("application/octet-stream").notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  deletedAt: timestamp("deletedAt"),
  purgeAfter: timestamp("purgeAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("client_files_account_client_deleted_idx").on(table.accountId, table.clientId, table.deletedAt), index("client_files_document_idx").on(table.documentId), index("client_files_purge_after_idx").on(table.purgeAfter)]);

export const clientCompliance = mysqlTable("client_compliance", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["À vérifier", "Conforme", "À régulariser"]).default("À vérifier").notNull(),
  note: varchar("note", { length: 500 }).default(""),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("client_compliance_client_idx").on(table.clientId)]);

export const clientWorkCases = mysqlTable("client_work_cases", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  caseType: mysqlEnum("caseType", ["CDI", "CPI", "CASNOS", "Autre"]).notNull(),
  status: mysqlEnum("status", ["À préparer", "En cours", "Terminé"]).default("À préparer").notNull(),
  note: varchar("note", { length: 500 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("client_work_cases_client_idx").on(table.clientId)]);

export const clientPayments = mysqlTable("client_payments", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  paymentDate: varchar("paymentDate", { length: 30 }).notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  reference: varchar("reference", { length: 160 }).default(""),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("client_payments_client_idx").on(table.clientId)]);

export const clientCashEntries = mysqlTable("client_cash_entries", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  entryDate: varchar("entryDate", { length: 30 }).notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  direction: mysqlEnum("direction", ["Entrée", "Sortie"]).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("client_cash_entries_client_idx").on(table.clientId)]);

/** Registre financier du cabinet, isolé par compte et rattachable facultativement à un client. */
export const cabinetFinanceEntries = mysqlTable("cabinet_finance_entries", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  clientId: int("clientId"),
  documentId: int("documentId"),
  entryDate: varchar("entryDate", { length: 30 }).notNull(),
  category: mysqlEnum("category", ["Paiement", "Caisse"]).notNull(),
  direction: mysqlEnum("direction", ["Entrée", "Sortie"]).notNull(),
  counterpartyName: varchar("counterpartyName", { length: 220 }).default("").notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  reference: varchar("reference", { length: 160 }).default(""),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  note: varchar("note", { length: 500 }).default(""),
  deletedAt: timestamp("deletedAt"),
  purgeAfter: timestamp("purgeAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("cabinet_finance_account_date_idx").on(table.accountId, table.entryDate), index("cabinet_finance_client_idx").on(table.clientId), index("cabinet_finance_document_idx").on(table.documentId), index("cabinet_finance_account_client_date_idx").on(table.accountId, table.clientId, table.entryDate, table.id), index("cabinet_finance_account_deleted_date_idx").on(table.accountId, table.deletedAt, table.entryDate), index("cabinet_finance_purge_after_idx").on(table.purgeAfter)]);

export const exportAudit = mysqlTable("export_audit", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  format: mysqlEnum("format", ["json", "xlsx"]).notNull(),
  scope: mysqlEnum("scope", ["active", "selected", "all"]).notNull(),
  clientCount: int("clientCount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("export_audit_account_idx").on(table.accountId), index("export_audit_account_created_idx").on(table.accountId, table.createdAt)]);
