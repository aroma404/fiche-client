/** Atelier fiscal moderne — données multi-clients persistantes, chacune bornée au compte de la session. */

import { and, count, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { cabinetFinanceEntries, clientCashEntries, clientContacts, clientDocuments, clientFiles, clientPayments, clients, passwordVaultEntries } from "../../drizzle/schema";
import { getCurrentAccount, requireCurrentAccount } from "../account-context";
import { canonicalActivityLabel } from "../client-activity";
import { allocateNextClientReference } from "../client-reference";
import { canonicalFinanceEntries } from "../client-ledger";
import { archivePurgeAfterForAccount } from "../archive-policy";
import { listProgramClientOptions, resolveProgramClientOption } from "../program-client-options";
import { resolveRcActivityForAccount } from "../program-rc-catalogue";
import { assertProgramClientStatus } from "../program-client-statuses";
import { getClientBundle, getDb, getOwnedClient } from "../db";
import { storageGet, storagePut } from "../storage";
import { publicProcedure, router } from "../_core/trpc";

const clientStatus = z.string().trim().min(2, "Choisissez un statut.").max(60);
const optionValue = z.string().trim().min(2, "Choisissez une valeur dans les réglages du programme.").max(100);
const taxCenter = optionValue;
const activityKind = z.string().trim().max(100).default("");
const autoEntrepreneurActivity = z.enum(["", "Micro-importation", "Prestation de services"]);

const clientInput = z.object({
  fullName: z.string().trim().min(2, "Indiquez le nom du client.").max(220), activity: z.string().max(220).default(""),
  activityKind: activityKind.default(""), autoEntrepreneurActivity: autoEntrepreneurActivity.default(""), rcActivityFamily: z.string().max(10).default(""), rcActivityCode: z.string().max(10).default(""),
  legalForm: optionValue.default("Personne physique"), clientType: optionValue.default("Nouveau client"), status: clientStatus.default("Actif"),
  commune: z.string().max(160).default(""), contact: z.string().max(160).default(""), nif: z.string().max(80).default(""), rc: z.string().max(80).default(""),
  bp: z.string().max(80).default(""), taxArticle: z.string().max(80).default(""), nin: z.string().max(80).default(""), regime: optionValue.default("Régime réel"), taxCenter: taxCenter.default("CDI"), cnasAffiliated: z.boolean().default(false), casnosAffiliated: z.boolean().default(false), cacobatphAffiliated: z.boolean().default(false),
  initialBalance: z.number().finite().nullable().optional().default(null), observations: z.string().max(8000).default(""),
}).superRefine((value, ctx) => {
  if (value.activityKind === "Auto-entrepreneur" && !value.autoEntrepreneurActivity) ctx.addIssue({ code: "custom", path: ["autoEntrepreneurActivity"], message: "Choisissez Micro-importation ou Prestation de services." });
  if (value.activityKind === "Registre de commerce" && (!/^\d{3}$/.test(value.rcActivityFamily) || !/^\d{6}$/.test(value.rcActivityCode))) ctx.addIssue({ code: "custom", path: ["rcActivityCode"], message: "Choisissez une activité valide de la nomenclature fournie." });
});

const documentInput = z.object({ id: z.number().int().positive().optional(), label: z.string().min(1).max(120), category: z.string().max(100).default("Fiscal"), status: z.string().min(2).max(100).default("À demander"), paymentDone: z.boolean().default(false), note: z.string().max(500).default("") });
const paymentInput = z.object({ paymentDate: z.string().min(4).max(30), label: z.string().min(1).max(180), reference: z.string().max(160).default(""), amount: z.number().finite() });
const cashInput = z.object({ entryDate: z.string().min(4).max(30), label: z.string().min(1).max(180), direction: z.enum(["Entrée", "Sortie"]), amount: z.number().finite() });
const financeEntryInput = z.object({ entryDate: z.string().min(4).max(30), category: z.enum(["Paiement", "Caisse"]), direction: z.enum(["Entrée", "Sortie"]), label: z.string().min(1).max(180), reference: z.string().max(160).default(""), amount: z.number().finite(), note: z.string().max(500).default("") });
const contactInput = z.object({ label: z.string().trim().max(100).default(""), type: z.string().trim().min(2, "Choisissez un type de contact.").max(100), value: z.string().trim().min(3, "Indiquez une coordonnée.").max(320), isPrimary: z.boolean().default(false) });
const documentMutationInput = z.object({ label: z.string().trim().min(1).max(120), category: z.string().trim().min(2).max(100), status: z.string().trim().min(2).max(100), paymentDone: z.boolean().default(false), note: z.string().trim().max(500).default("") });
const fileUploadInput = z.object({ clientId: z.number().int().positive(), documentId: z.number().int().positive().nullable().optional(), displayName: z.string().trim().min(1).max(180), category: z.string().trim().min(2).max(100), originalName: z.string().trim().min(1).max(255), mimeType: z.string().trim().min(3).max(180).default("application/octet-stream"), dataBase64: z.string().min(4).max(28 * 1024 * 1024) });

export const clientBundleInput = z.object({ client: clientInput, contacts: z.array(contactInput).max(30).default([]), documents: z.array(documentInput).max(100).default([]), compliance: z.array(z.object({ label: z.string().min(1).max(120), status: z.enum(["À vérifier", "Conforme", "À régulariser"]), note: z.string().max(500).default("") })).max(30).default([]), cases: z.array(z.object({ label: z.string().min(1).max(160), caseType: z.enum(["CDI", "CPI", "CASNOS", "Autre"]), status: z.enum(["À préparer", "En cours", "Terminé"]), note: z.string().max(500).default("") })).max(100).default([]), payments: z.array(paymentInput).max(500).default([]), cashEntries: z.array(cashInput).max(500).default([]), financeEntries: z.array(financeEntryInput).max(1000).default([]) });

const DEFAULT_DOCUMENTS = [["Cachet", "Identité"], ["G8", "Fiscal"], ["NIF", "Fiscal"], ["NIS", "Fiscal"], ["BP", "Fiscal"], ["Livres obligatoires", "Comptabilité"], ["G12", "Fiscal"], ["G12 bis", "Fiscal"], ["TAPP", "Fiscal"], ["G50 ter", "Fiscal"], ["301 bis", "Fiscal"], ["Extrait de rôle", "Fiscal"]] as const;
const taxCenterForRegimeCode = (code: string) => code === "ifu" ? "CPI" as const : "CDI" as const;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

async function assertActiveOwnedClient(accountId: number, clientId: number) {
  const client = await getOwnedClient(accountId, clientId);
  if (!client || client.deletedAt) throw new Error("Client introuvable ou archivé.");
  return client;
}

async function assertOwnedActiveDocument(db: any, clientId: number, documentId: number) {
  const document = (await db.select().from(clientDocuments).where(and(eq(clientDocuments.id, documentId), eq(clientDocuments.clientId, clientId), isNull(clientDocuments.deletedAt))).limit(1))[0];
  if (!document) throw new Error("Document introuvable dans ce dossier.");
  return document;
}

function bytesFromBase64(value: string) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) throw new Error("Le contenu du fichier est invalide.");
  const bytes = Buffer.from(value, "base64");
  if (!bytes.length || bytes.length > MAX_FILE_BYTES) throw new Error("Le fichier doit peser entre 1 octet et 20 Mo.");
  return bytes;
}

function safeFileSegment(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160) || "fichier";
}

export const clientsRouter = router({
  list: publicProcedure.input(z.object({ includeArchived: z.boolean().optional() }).optional()).query(async ({ ctx, input }) => {
    const account = await getCurrentAccount(ctx.req);
    if (!account) return [];
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    return db.select().from(clients).where(input?.includeArchived ? eq(clients.accountId, account.id) : and(eq(clients.accountId, account.id), isNull(clients.archivedAt)));
  }),

  get: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    const bundle = await getClientBundle(account.id, input.clientId);
    if (!bundle) throw new Error("Client introuvable.");
    return bundle;
  }),

  create: publicProcedure.input(clientInput).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await assertProgramClientStatus(db, account.id, input.status);
    const [legalFormOption, clientTypeOption, regimeOption, taxCenterOption, activityKindOption, rcActivity, documentCategories, documentStatuses] = await Promise.all([resolveProgramClientOption(db, account.id, "legalForm", input.legalForm), resolveProgramClientOption(db, account.id, "clientType", input.clientType), resolveProgramClientOption(db, account.id, "regime", input.regime), resolveProgramClientOption(db, account.id, "taxCenter", input.taxCenter), input.activityKind ? resolveProgramClientOption(db, account.id, "activityKind", input.activityKind) : Promise.resolve({ label: "" }), input.activityKind === "Registre de commerce" ? resolveRcActivityForAccount(db, account.id, input.rcActivityFamily, input.rcActivityCode) : Promise.resolve(undefined), listProgramClientOptions(db, account.id, "documentCategory"), listProgramClientOptions(db, account.id, "documentStatus")]);
    return db.transaction(async tx => {
      const referenceNumber = await allocateNextClientReference(tx, account.id);
      const inserted = await tx.insert(clients).values({ ...input, referenceNumber, legalForm: legalFormOption.label, clientType: clientTypeOption.label, regime: regimeOption.label, taxCenter: taxCenterOption.label, activityKind: activityKindOption.label, activity: canonicalActivityLabel({ ...input, activityKind: activityKindOption.label }, rcActivity?.label), accountId: account.id, initialBalance: input.initialBalance === null ? null : input.initialBalance.toFixed(2), observations: input.observations || null });
      const clientId = Number(inserted[0]?.insertId);
      if (input.contact.trim()) await tx.insert(clientContacts).values({ clientId, label: "Contact", type: input.contact.includes("@") ? "E-mail" : "Téléphone", value: input.contact.trim(), isPrimary: false });
      const defaultCategory = documentCategories.find((item: any) => item.label === "Fiscal")?.label ?? documentCategories[0]?.label ?? "Fiscal";
      const defaultStatus = documentStatuses.find((item: any) => item.label === "À demander")?.label ?? documentStatuses[0]?.label ?? "À demander";
      await tx.insert(clientDocuments).values(DEFAULT_DOCUMENTS.map(([label]) => ({ clientId, label, category: defaultCategory, status: defaultStatus, note: "" })));
      return { clientId, referenceNumber };
    });
  }),

  saveBundle: publicProcedure.input(z.object({ clientId: z.number().int().positive(), data: clientBundleInput })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable.");
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await assertProgramClientStatus(db, account.id, input.data.client.status);
    const [legalFormOption, clientTypeOption, regimeOption, taxCenterOption, activityKindOption, rcActivity] = await Promise.all([resolveProgramClientOption(db, account.id, "legalForm", input.data.client.legalForm), resolveProgramClientOption(db, account.id, "clientType", input.data.client.clientType), resolveProgramClientOption(db, account.id, "regime", input.data.client.regime), resolveProgramClientOption(db, account.id, "taxCenter", input.data.client.taxCenter), input.data.client.activityKind ? resolveProgramClientOption(db, account.id, "activityKind", input.data.client.activityKind) : Promise.resolve({ label: "" }), input.data.client.activityKind === "Registre de commerce" ? resolveRcActivityForAccount(db, account.id, input.data.client.rcActivityFamily, input.data.client.rcActivityCode) : Promise.resolve(undefined)]);
    await db.transaction(async tx => {
      await tx.update(clients).set({ ...input.data.client, legalForm: legalFormOption.label, clientType: clientTypeOption.label, regime: regimeOption.label, taxCenter: taxCenterOption.label, activityKind: activityKindOption.label, activity: canonicalActivityLabel({ ...input.data.client, activityKind: activityKindOption.label }, rcActivity?.label), initialBalance: input.data.client.initialBalance === null ? null : input.data.client.initialBalance.toFixed(2), observations: input.data.client.observations || null }).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id)));
      // Les documents et le registre financier disposent de mutations dédiées :
      // cette sauvegarde de fiche ne les supprime ni ne les recrée.
    });
    return { success: true } as const;
  }),

  contacts: router({
    list: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); const owned = await getOwnedClient(account.id, input.clientId); if (!owned) throw new Error("Client introuvable."); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      const entries = await db.select().from(clientContacts).where(and(eq(clientContacts.clientId, input.clientId), isNull(clientContacts.deletedAt)));
      if (!entries.length && owned.contact?.trim()) { await db.insert(clientContacts).values({ clientId: input.clientId, label: "Contact", type: owned.contact.includes("@") ? "E-mail" : "Téléphone", value: owned.contact.trim(), isPrimary: false }); return db.select().from(clientContacts).where(and(eq(clientContacts.clientId, input.clientId), isNull(clientContacts.deletedAt))); }
      return entries;
    }),
    archived: publicProcedure.query(async ({ ctx }) => {
      const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      return db.select({ id: clientContacts.id, clientId: clientContacts.clientId, label: clientContacts.label, type: clientContacts.type, value: clientContacts.value, deletedAt: clientContacts.deletedAt, purgeAfter: clientContacts.purgeAfter, clientName: clients.fullName }).from(clientContacts).innerJoin(clients, eq(clientContacts.clientId, clients.id)).where(and(eq(clients.accountId, account.id), isNotNull(clientContacts.deletedAt)));
    }),
    create: publicProcedure.input(z.object({ clientId: z.number().int().positive(), contact: contactInput })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable."); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      const type = await resolveProgramClientOption(db, account.id, "contactType", input.contact.type);
      await db.transaction(async tx => { if (input.contact.isPrimary) await tx.update(clientContacts).set({ isPrimary: false }).where(and(eq(clientContacts.clientId, input.clientId), isNull(clientContacts.deletedAt))); const inserted = await tx.insert(clientContacts).values({ clientId: input.clientId, ...input.contact, type: type.label }); await tx.update(clients).set({ contact: input.contact.value }).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id))); return inserted; });
      return { success: true } as const;
    }),
    update: publicProcedure.input(z.object({ id: z.number().int().positive(), clientId: z.number().int().positive(), contact: contactInput })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable."); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      const type = await resolveProgramClientOption(db, account.id, "contactType", input.contact.type);
      const current = (await db.select().from(clientContacts).where(and(eq(clientContacts.id, input.id), eq(clientContacts.clientId, input.clientId), isNull(clientContacts.deletedAt))).limit(1))[0]; if (!current) throw new Error("Contact introuvable.");
      await db.transaction(async tx => { if (input.contact.isPrimary) await tx.update(clientContacts).set({ isPrimary: false }).where(and(eq(clientContacts.clientId, input.clientId), isNull(clientContacts.deletedAt))); await tx.update(clientContacts).set({ ...input.contact, type: type.label }).where(eq(clientContacts.id, input.id)); await tx.update(clients).set({ contact: input.contact.value }).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id))); });
      return { success: true } as const;
    }),
    archive: publicProcedure.input(z.object({ id: z.number().int().positive(), clientId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable."); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      const now = new Date(); const purgeAfter = await archivePurgeAfterForAccount(db, account.id, now);
      await db.update(clientContacts).set({ deletedAt: now, purgeAfter, isPrimary: false }).where(and(eq(clientContacts.id, input.id), eq(clientContacts.clientId, input.clientId), isNull(clientContacts.deletedAt))); return { success: true } as const;
    }),
    restore: publicProcedure.input(z.object({ id: z.number().int().positive(), clientId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable."); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      await db.update(clientContacts).set({ deletedAt: null, purgeAfter: null }).where(and(eq(clientContacts.id, input.id), eq(clientContacts.clientId, input.clientId))); return { success: true } as const;
    }),
  }),
  documents: router({
    list: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); await assertActiveOwnedClient(account.id, input.clientId); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return db.select().from(clientDocuments).where(and(eq(clientDocuments.clientId, input.clientId), isNull(clientDocuments.deletedAt))); }),
    archived: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable."); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return db.select().from(clientDocuments).where(and(eq(clientDocuments.clientId, input.clientId), isNotNull(clientDocuments.deletedAt))); }),
    create: publicProcedure.input(z.object({ clientId: z.number().int().positive(), document: documentMutationInput })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); await assertActiveOwnedClient(account.id, input.clientId); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); const [category, status] = await Promise.all([resolveProgramClientOption(db, account.id, "documentCategory", input.document.category), resolveProgramClientOption(db, account.id, "documentStatus", input.document.status)]); const inserted = await db.insert(clientDocuments).values({ clientId: input.clientId, ...input.document, category: category.label, status: status.label }); return { id: Number(inserted[0]?.insertId) }; }),
    update: publicProcedure.input(z.object({ clientId: z.number().int().positive(), documentId: z.number().int().positive(), document: documentMutationInput })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); await assertActiveOwnedClient(account.id, input.clientId); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); await assertOwnedActiveDocument(db, input.clientId, input.documentId); const [category, status] = await Promise.all([resolveProgramClientOption(db, account.id, "documentCategory", input.document.category), resolveProgramClientOption(db, account.id, "documentStatus", input.document.status)]); await db.update(clientDocuments).set({ ...input.document, category: category.label, status: status.label }).where(and(eq(clientDocuments.id, input.documentId), eq(clientDocuments.clientId, input.clientId))); const [linked] = await db.select({ count: count(cabinetFinanceEntries.id) }).from(cabinetFinanceEntries).where(and(eq(cabinetFinanceEntries.documentId, input.documentId), eq(cabinetFinanceEntries.category, "Paiement"), isNull(cabinetFinanceEntries.deletedAt))); if (Number(linked?.count ?? 0) > 0 && !input.document.paymentDone) await db.update(clientDocuments).set({ paymentDone: true }).where(eq(clientDocuments.id, input.documentId)); return { success: true } as const; }),
    archive: publicProcedure.input(z.object({ clientId: z.number().int().positive(), documentId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); await assertActiveOwnedClient(account.id, input.clientId); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); await assertOwnedActiveDocument(db, input.clientId, input.documentId); const now = new Date(); const purgeAfter = await archivePurgeAfterForAccount(db, account.id, now); await db.transaction(async tx => { await tx.update(clientDocuments).set({ deletedAt: now, purgeAfter }).where(and(eq(clientDocuments.id, input.documentId), eq(clientDocuments.clientId, input.clientId))); await tx.update(clientFiles).set({ deletedAt: now, purgeAfter }).where(and(eq(clientFiles.accountId, account.id), eq(clientFiles.clientId, input.clientId), eq(clientFiles.documentId, input.documentId), isNull(clientFiles.deletedAt))); }); return { success: true } as const; }),
    restore: publicProcedure.input(z.object({ clientId: z.number().int().positive(), documentId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable."); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); const document = (await db.select().from(clientDocuments).where(and(eq(clientDocuments.id, input.documentId), eq(clientDocuments.clientId, input.clientId), isNotNull(clientDocuments.deletedAt))).limit(1))[0]; const archivedAt = document?.deletedAt; if (!archivedAt) throw new Error("Document archivé introuvable."); await db.transaction(async tx => { await tx.update(clientDocuments).set({ deletedAt: null, purgeAfter: null }).where(eq(clientDocuments.id, input.documentId)); await tx.update(clientFiles).set({ deletedAt: null, purgeAfter: null }).where(and(eq(clientFiles.accountId, account.id), eq(clientFiles.clientId, input.clientId), eq(clientFiles.documentId, input.documentId), eq(clientFiles.deletedAt, archivedAt))); }); return { success: true } as const; }),
  }),
  files: router({
    list: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); await assertActiveOwnedClient(account.id, input.clientId); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); const rows = await db.select().from(clientFiles).where(and(eq(clientFiles.accountId, account.id), eq(clientFiles.clientId, input.clientId), isNull(clientFiles.deletedAt))); return Promise.all(rows.map(async file => ({ ...file, downloadUrl: (await storageGet(file.storageKey)).url }))); }),
    upload: publicProcedure.input(fileUploadInput).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); await assertActiveOwnedClient(account.id, input.clientId); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); if (input.documentId) await assertOwnedActiveDocument(db, input.clientId, input.documentId); const bytes = bytesFromBase64(input.dataBase64); const keyPrefix = `accounts/${account.id}/clients/${input.clientId}/${crypto.randomUUID()}-${safeFileSegment(input.originalName)}`; const stored = await storagePut(keyPrefix, bytes, input.mimeType); const inserted = await db.insert(clientFiles).values({ accountId: account.id, clientId: input.clientId, documentId: input.documentId ?? null, displayName: input.displayName, category: input.category, originalName: input.originalName, storageKey: stored.key, mimeType: input.mimeType, sizeBytes: bytes.length }); return { id: Number(inserted[0]?.insertId), downloadUrl: stored.url }; }),
    archive: publicProcedure.input(z.object({ clientId: z.number().int().positive(), fileId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); await assertActiveOwnedClient(account.id, input.clientId); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); const file = (await db.select({ id: clientFiles.id }).from(clientFiles).where(and(eq(clientFiles.id, input.fileId), eq(clientFiles.accountId, account.id), eq(clientFiles.clientId, input.clientId), isNull(clientFiles.deletedAt))).limit(1))[0]; if (!file) throw new Error("Fichier introuvable."); const now = new Date(); await db.update(clientFiles).set({ deletedAt: now, purgeAfter: await archivePurgeAfterForAccount(db, account.id, now) }).where(eq(clientFiles.id, input.fileId)); return { success: true } as const; }),
  }),
  archive: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable.");
    const now = new Date();
    const purgeAfter = await archivePurgeAfterForAccount(db, account.id, now);
    await db.transaction(async tx => { await tx.update(clients).set({ archivedAt: now, deletedAt: now, purgeAfter }).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id))); await tx.update(passwordVaultEntries).set({ deletedAt: now, purgeAfter }).where(and(eq(passwordVaultEntries.clientId, input.clientId), eq(passwordVaultEntries.accountId, account.id), isNull(passwordVaultEntries.deletedAt))); await tx.update(clientDocuments).set({ deletedAt: now, purgeAfter }).where(and(eq(clientDocuments.clientId, input.clientId), isNull(clientDocuments.deletedAt))); await tx.update(clientFiles).set({ deletedAt: now, purgeAfter }).where(and(eq(clientFiles.accountId, account.id), eq(clientFiles.clientId, input.clientId), isNull(clientFiles.deletedAt))); });
    return { success: true } as const;
  }),
  restore: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
    const owned = await getOwnedClient(account.id, input.clientId); const archivedAt = owned?.archivedAt; if (!archivedAt) throw new Error("Client archivé introuvable.");
    await db.transaction(async tx => { await tx.update(clients).set({ archivedAt: null, deletedAt: null, purgeAfter: null }).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id))); await tx.update(passwordVaultEntries).set({ deletedAt: null, purgeAfter: null }).where(and(eq(passwordVaultEntries.clientId, input.clientId), eq(passwordVaultEntries.accountId, account.id), isNotNull(passwordVaultEntries.deletedAt))); await tx.update(clientDocuments).set({ deletedAt: null, purgeAfter: null }).where(and(eq(clientDocuments.clientId, input.clientId), eq(clientDocuments.deletedAt, archivedAt))); await tx.update(clientFiles).set({ deletedAt: null, purgeAfter: null }).where(and(eq(clientFiles.accountId, account.id), eq(clientFiles.clientId, input.clientId), eq(clientFiles.deletedAt, archivedAt))); });
    return { success: true } as const;
  }),
});
