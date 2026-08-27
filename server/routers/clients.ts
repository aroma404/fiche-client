/** Atelier fiscal moderne — données multi-clients persistantes, chacune bornée au compte de la session. */

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { cabinetFinanceEntries, clientCashEntries, clientContacts, clientDocuments, clientPayments, clients, passwordVaultEntries } from "../../drizzle/schema";
import { isRegistreCommerceActivity, registreCommerceActivities } from "../../shared/registre-commerce-activities";
import { getCurrentAccount, requireCurrentAccount } from "../account-context";
import { canonicalActivityLabel } from "../client-activity";
import { canonicalFinanceEntries } from "../client-ledger";
import { resolveProgramClientOption } from "../program-client-options";
import { assertProgramClientStatus } from "../program-client-statuses";
import { getClientBundle, getDb, getOwnedClient } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const documentStatus = z.enum(["Reçu", "À vérifier", "À demander", "Non requis"]);
const legalForm = z.enum(["Personne physique", "Personne morale"]);
const clientType = z.enum(["Nouveau client", "Ancien client"]);
const clientStatus = z.string().trim().min(2, "Choisissez un statut.").max(60);
const optionValue = z.string().trim().min(2, "Choisissez une valeur dans les réglages du programme.").max(100);
const taxCenter = z.enum(["CDI", "CPI"]);
const activityKind = z.enum(["", "Agriculture", "Artisanat", "Auto-entrepreneur", "Registre de commerce"]);
const autoEntrepreneurActivity = z.enum(["", "Micro-importation", "Prestation de services"]);

const clientInput = z.object({
  fullName: z.string().trim().min(2, "Indiquez le nom du client.").max(220), activity: z.string().max(220).default(""),
  activityKind: activityKind.default(""), autoEntrepreneurActivity: autoEntrepreneurActivity.default(""), rcActivityFamily: z.string().max(10).default(""), rcActivityCode: z.string().max(10).default(""),
  legalForm: optionValue.default("Personne physique"), clientType: optionValue.default("Nouveau client"), status: clientStatus.default("Actif"),
  commune: z.string().max(160).default(""), contact: z.string().max(160).default(""), nif: z.string().max(80).default(""), rc: z.string().max(80).default(""),
  bp: z.string().max(80).default(""), taxArticle: z.string().max(80).default(""), nin: z.string().max(80).default(""), regime: optionValue.default("Régime réel"), taxCenter: taxCenter.default("CDI"), cnasAffiliated: z.boolean().default(false), casnosAffiliated: z.boolean().default(false),
  initialBalance: z.number().finite().nullable().optional().default(null), observations: z.string().max(8000).default(""),
}).superRefine((value, ctx) => {
  if (value.activityKind === "Auto-entrepreneur" && !value.autoEntrepreneurActivity) ctx.addIssue({ code: "custom", path: ["autoEntrepreneurActivity"], message: "Choisissez Micro-importation ou Prestation de services." });
  if (value.activityKind === "Registre de commerce" && !isRegistreCommerceActivity(value.rcActivityFamily, value.rcActivityCode)) ctx.addIssue({ code: "custom", path: ["rcActivityCode"], message: "Choisissez une activité valide de la nomenclature fournie." });
});

const documentInput = z.object({ label: z.string().min(1).max(120), category: z.string().max(100).default("Fiscal"), status: documentStatus, note: z.string().max(500).default("") });
const paymentInput = z.object({ paymentDate: z.string().min(4).max(30), label: z.string().min(1).max(180), reference: z.string().max(160).default(""), amount: z.number().finite() });
const cashInput = z.object({ entryDate: z.string().min(4).max(30), label: z.string().min(1).max(180), direction: z.enum(["Entrée", "Sortie"]), amount: z.number().finite() });
const financeEntryInput = z.object({ entryDate: z.string().min(4).max(30), category: z.enum(["Paiement", "Caisse"]), direction: z.enum(["Entrée", "Sortie"]), label: z.string().min(1).max(180), reference: z.string().max(160).default(""), amount: z.number().finite(), note: z.string().max(500).default("") });
const contactInput = z.object({ label: z.string().trim().max(100).default(""), type: z.string().trim().min(2, "Choisissez un type de contact.").max(100), value: z.string().trim().min(3, "Indiquez une coordonnée.").max(320), isPrimary: z.boolean().default(false) });
const purgeAfterThirtyDays = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

export const clientBundleInput = z.object({ client: clientInput, contacts: z.array(contactInput).max(30).default([]), documents: z.array(documentInput).max(100).default([]), compliance: z.array(z.object({ label: z.string().min(1).max(120), status: z.enum(["À vérifier", "Conforme", "À régulariser"]), note: z.string().max(500).default("") })).max(30).default([]), cases: z.array(z.object({ label: z.string().min(1).max(160), caseType: z.enum(["CDI", "CPI", "CASNOS", "Autre"]), status: z.enum(["À préparer", "En cours", "Terminé"]), note: z.string().max(500).default("") })).max(100).default([]), payments: z.array(paymentInput).max(500).default([]), cashEntries: z.array(cashInput).max(500).default([]), financeEntries: z.array(financeEntryInput).max(1000).default([]) });

const DEFAULT_DOCUMENTS = [["Cachet", "Identité"], ["G8", "Fiscal"], ["NIF", "Fiscal"], ["NIS", "Fiscal"], ["BP", "Fiscal"], ["Livres obligatoires", "Comptabilité"], ["G12", "Fiscal"], ["G12 bis", "Fiscal"], ["TAPP", "Fiscal"], ["G50 ter", "Fiscal"], ["301 bis", "Fiscal"], ["Extrait de rôle", "Fiscal"]] as const;
const taxCenterForRegimeCode = (code: string) => code === "ifu" ? "CPI" as const : "CDI" as const;

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
    const [legalFormOption, clientTypeOption, regimeOption] = await Promise.all([resolveProgramClientOption(db, account.id, "legalForm", input.legalForm), resolveProgramClientOption(db, account.id, "clientType", input.clientType), resolveProgramClientOption(db, account.id, "regime", input.regime)]);
    return db.transaction(async tx => {
      const inserted = await tx.insert(clients).values({ ...input, legalForm: legalFormOption.label, clientType: clientTypeOption.label, regime: regimeOption.label, taxCenter: input.taxCenter, activity: canonicalActivityLabel(input), accountId: account.id, initialBalance: input.initialBalance === null ? null : input.initialBalance.toFixed(2), observations: input.observations || null });
      const clientId = Number(inserted[0]?.insertId);
      if (input.contact.trim()) await tx.insert(clientContacts).values({ clientId, label: "Contact", type: input.contact.includes("@") ? "E-mail" : "Téléphone", value: input.contact.trim(), isPrimary: false });
      await tx.insert(clientDocuments).values(DEFAULT_DOCUMENTS.map(([label, category]) => ({ clientId, label, category, status: "À demander" as const, note: "" })));
      return { clientId };
    });
  }),

  saveBundle: publicProcedure.input(z.object({ clientId: z.number().int().positive(), data: clientBundleInput })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable.");
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await assertProgramClientStatus(db, account.id, input.data.client.status);
    const [legalFormOption, clientTypeOption, regimeOption] = await Promise.all([resolveProgramClientOption(db, account.id, "legalForm", input.data.client.legalForm), resolveProgramClientOption(db, account.id, "clientType", input.data.client.clientType), resolveProgramClientOption(db, account.id, "regime", input.data.client.regime)]);
    await db.transaction(async tx => {
      await tx.update(clients).set({ ...input.data.client, legalForm: legalFormOption.label, clientType: clientTypeOption.label, regime: regimeOption.label, taxCenter: input.data.client.taxCenter, activity: canonicalActivityLabel(input.data.client), initialBalance: input.data.client.initialBalance === null ? null : input.data.client.initialBalance.toFixed(2), observations: input.data.client.observations || null }).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id)));
      await Promise.all([tx.delete(clientDocuments).where(eq(clientDocuments.clientId, input.clientId)), tx.delete(clientPayments).where(eq(clientPayments.clientId, input.clientId)), tx.delete(clientCashEntries).where(eq(clientCashEntries.clientId, input.clientId)), tx.delete(cabinetFinanceEntries).where(and(eq(cabinetFinanceEntries.clientId, input.clientId), eq(cabinetFinanceEntries.accountId, account.id)))]);
      if (input.data.documents.length) await tx.insert(clientDocuments).values(input.data.documents.map(item => ({ clientId: input.clientId, ...item })));
      const financeEntries = canonicalFinanceEntries(input.data);
      if (financeEntries.length) await tx.insert(cabinetFinanceEntries).values(financeEntries.map(item => ({ ...item, accountId: account.id, clientId: input.clientId, amount: item.amount.toFixed(2) })));
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
      await db.update(clientContacts).set({ deletedAt: new Date(), purgeAfter: purgeAfterThirtyDays(), isPrimary: false }).where(and(eq(clientContacts.id, input.id), eq(clientContacts.clientId, input.clientId), isNull(clientContacts.deletedAt))); return { success: true } as const;
    }),
    restore: publicProcedure.input(z.object({ id: z.number().int().positive(), clientId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable."); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      await db.update(clientContacts).set({ deletedAt: null, purgeAfter: null }).where(and(eq(clientContacts.id, input.id), eq(clientContacts.clientId, input.clientId))); return { success: true } as const;
    }),
  }),
  archive: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    const now = new Date();
    const purgeAfter = purgeAfterThirtyDays();
    await db.transaction(async tx => { await tx.update(clients).set({ archivedAt: now, deletedAt: now, purgeAfter }).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id))); await tx.update(passwordVaultEntries).set({ deletedAt: now, purgeAfter }).where(and(eq(passwordVaultEntries.clientId, input.clientId), eq(passwordVaultEntries.accountId, account.id), isNull(passwordVaultEntries.deletedAt))); });
    return { success: true } as const;
  }),
  restore: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
    await db.transaction(async tx => { await tx.update(clients).set({ archivedAt: null, deletedAt: null, purgeAfter: null }).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id))); await tx.update(passwordVaultEntries).set({ deletedAt: null, purgeAfter: null }).where(and(eq(passwordVaultEntries.clientId, input.clientId), eq(passwordVaultEntries.accountId, account.id), isNotNull(passwordVaultEntries.deletedAt))); });
    return { success: true } as const;
  }),
});
