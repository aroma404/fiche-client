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
}, table => [index("account_sessions_account_idx").on(table.accountId)]);

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  fullName: varchar("fullName", { length: 220 }).notNull(),
  activity: varchar("activity", { length: 220 }).default(""),
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
  initialBalance: decimal("initialBalance", { precision: 14, scale: 2 }).default("0.00").notNull(),
  observations: text("observations"),
  archivedAt: timestamp("archivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("clients_account_idx").on(table.accountId), index("clients_account_name_idx").on(table.accountId, table.fullName)]);

export const clientDocuments = mysqlTable("client_documents", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  category: varchar("category", { length: 100 }).default("Fiscal"),
  status: mysqlEnum("status", ["Reçu", "À vérifier", "À demander", "Non requis"]).default("À demander").notNull(),
  note: varchar("note", { length: 500 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("client_documents_client_idx").on(table.clientId)]);

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
  entryDate: varchar("entryDate", { length: 30 }).notNull(),
  category: mysqlEnum("category", ["Paiement", "Caisse"]).notNull(),
  direction: mysqlEnum("direction", ["Entrée", "Sortie"]).notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  reference: varchar("reference", { length: 160 }).default(""),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  note: varchar("note", { length: 500 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("cabinet_finance_account_date_idx").on(table.accountId, table.entryDate), index("cabinet_finance_client_idx").on(table.clientId)]);

export const exportAudit = mysqlTable("export_audit", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  format: mysqlEnum("format", ["json", "xlsx"]).notNull(),
  scope: mysqlEnum("scope", ["active", "selected", "all"]).notNull(),
  clientCount: int("clientCount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("export_audit_account_idx").on(table.accountId)]);
