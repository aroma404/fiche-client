import { and, asc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { clientContacts, clientDocuments, clients, passwordVaultEntries, programClientOptions, programClientStatuses } from "../../drizzle/schema";
import { requireCurrentAccount } from "../account-context";
import { getDb } from "../db";
import { listProgramClientStatuses, programClientStatusScope } from "../program-client-statuses";
import { clientColumnForOption, listProgramClientOptions, programOptionKinds, type ProgramOptionKind } from "../program-client-options";
import { countProgramOptionUsage, countProgramStatusUsage, getProgramReferenceSummary } from "../program-reference-usage";
import { archiveRcActivityByCode, archiveRcFamilyByCode, createRcActivity, createRcFamily, getRcCatalogueActivities, getRcCatalogueFamilies, getRcCatalogueSummary, listArchivedRcCatalogueItems, mergeRcCatalogueFromExcel, replaceRcCatalogueFromExcel, resetRcCatalogueToReference, restoreRcActivity, restoreRcFamily, updateRcActivityByCode, updateRcFamilyByCode } from "../program-rc-catalogue";
import { publicProcedure, router } from "../_core/trpc";

const statusLabel = z.string().trim().min(2, "Le statut doit comporter au moins deux caractères.").max(60, "Le statut est trop long.");
const optionKind = z.enum(programOptionKinds);
const optionLabel = z.string().trim().min(2, "La valeur doit comporter au moins deux caractères.").max(100, "La valeur est trop longue.");
const archiveAfterThirtyDays = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

export const programSettingsRouter = router({
  clientStatuses: router({
    list: publicProcedure.query(async ({ ctx }) => {
      const account = await requireCurrentAccount(ctx.req);
      const db = await getDb();
      if (!db) throw new Error("La base de données est indisponible.");
      const statuses = await listProgramClientStatuses(db, account.id);
      return Promise.all(statuses.map(async status => ({ ...status, usageCount: await countProgramStatusUsage(db, account.id, status.label) })));
    }),
    archived: publicProcedure.query(async ({ ctx }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return db.select().from(programClientStatuses).where(and(eq(programClientStatuses.accountId, account.id), isNotNull(programClientStatuses.deletedAt))); }),
    restore: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); const archived = (await db.select({ id: programClientStatuses.id }).from(programClientStatuses).where(and(eq(programClientStatuses.id, input.id), eq(programClientStatuses.accountId, account.id), isNotNull(programClientStatuses.deletedAt))).limit(1))[0]; if (!archived) throw new Error("Statut archivé introuvable."); await db.update(programClientStatuses).set({ deletedAt: null, purgeAfter: null }).where(and(eq(programClientStatuses.id, input.id), eq(programClientStatuses.accountId, account.id))); return { success: true } as const; }),
    create: publicProcedure.input(z.object({ label: statusLabel, isOperational: z.boolean() })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req);
      const db = await getDb();
      if (!db) throw new Error("La base de données est indisponible.");
      const statuses = await listProgramClientStatuses(db, account.id);
      if (statuses.some(status => status.label.toLocaleLowerCase("fr") === input.label.toLocaleLowerCase("fr"))) throw new Error("Ce statut existe déjà dans votre programme.");
      const inserted = await db.insert(programClientStatuses).values({ accountId: account.id, label: input.label, isOperational: input.isOperational, sortOrder: (statuses.at(-1)?.sortOrder ?? 0) + 10 });
      const id = Number(inserted[0]?.insertId);
      return (await db.select().from(programClientStatuses).where(programClientStatusScope(account.id, id)).limit(1))[0];
    }),
    update: publicProcedure.input(z.object({ id: z.number().int().positive(), label: statusLabel, isOperational: z.boolean() })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req);
      const db = await getDb();
      if (!db) throw new Error("La base de données est indisponible.");
      const statuses = await listProgramClientStatuses(db, account.id);
      const current = statuses.find(status => status.id === input.id);
      if (!current) throw new Error("Statut introuvable.");
      if (statuses.some(status => status.id !== input.id && status.label.toLocaleLowerCase("fr") === input.label.toLocaleLowerCase("fr"))) throw new Error("Ce statut existe déjà dans votre programme.");
      if (current.isOperational && !input.isOperational && statuses.filter(status => status.isOperational).length <= 1) throw new Error("Conservez au moins un statut compté comme actif.");
      await db.transaction(async tx => {
        await tx.update(programClientStatuses).set({ label: input.label, isOperational: input.isOperational }).where(programClientStatusScope(account.id, input.id));
        if (current.label !== input.label) await tx.update(clients).set({ status: input.label }).where(and(eq(clients.accountId, account.id), eq(clients.status, current.label)));
      });
      return (await db.select().from(programClientStatuses).where(programClientStatusScope(account.id, input.id)).limit(1))[0];
    }),
    remove: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req);
      const db = await getDb();
      if (!db) throw new Error("La base de données est indisponible.");
      const statuses = await listProgramClientStatuses(db, account.id);
      const current = statuses.find(status => status.id === input.id);
      if (!current) throw new Error("Statut introuvable.");
      if (statuses.length <= 1) throw new Error("Conservez au moins un statut dans votre programme.");
      const usage = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.accountId, account.id), eq(clients.status, current.label))).limit(1);
      if (usage.length) throw new Error("Ce statut est encore utilisé par un dossier. Réaffectez ces dossiers avant de le supprimer.");
      if (current.isOperational && statuses.filter(status => status.isOperational).length <= 1) throw new Error("Conservez au moins un statut compté comme actif.");
      await db.update(programClientStatuses).set({ deletedAt: new Date(), purgeAfter: archiveAfterThirtyDays() }).where(programClientStatusScope(account.id, input.id));
      return { success: true } as const;
    }),
  }),
  clientOptions: router({
    list: publicProcedure.input(z.object({ kind: optionKind })).query(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      const options = await listProgramClientOptions(db, account.id, input.kind);
      return Promise.all(options.map(async (option: any) => ({ ...option, usageCount: await countProgramOptionUsage(db, account.id, input.kind, option.label) })));
    }),
    archived: publicProcedure.query(async ({ ctx }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return db.select().from(programClientOptions).where(and(eq(programClientOptions.accountId, account.id), isNotNull(programClientOptions.deletedAt))); }),
    restore: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); const archived = (await db.select({ id: programClientOptions.id }).from(programClientOptions).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id), isNotNull(programClientOptions.deletedAt))).limit(1))[0]; if (!archived) throw new Error("Valeur archivée introuvable."); await db.update(programClientOptions).set({ deletedAt: null, purgeAfter: null }).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id))); return { success: true } as const; }),
    create: publicProcedure.input(z.object({ kind: optionKind, label: optionLabel })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      const items = await listProgramClientOptions(db, account.id, input.kind);
      if (items.some((item: any) => item.label.localeCompare(input.label, "fr", { sensitivity: "accent" }) === 0)) throw new Error("Cette valeur existe déjà.");
      const code = input.label.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70) || `option-${Date.now()}`;
      const inserted = await db.insert(programClientOptions).values({ accountId: account.id, kind: input.kind, code, label: input.label, sortOrder: (items.at(-1)?.sortOrder ?? 0) + 10 });
      return (await db.select().from(programClientOptions).where(and(eq(programClientOptions.id, Number(inserted[0]?.insertId)), eq(programClientOptions.accountId, account.id))).limit(1))[0];
    }),
    update: publicProcedure.input(z.object({ id: z.number().int().positive(), label: optionLabel })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      const current = (await db.select().from(programClientOptions).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id), isNull(programClientOptions.deletedAt))).limit(1))[0];
      if (!current) throw new Error("Valeur introuvable.");
      const items = await listProgramClientOptions(db, account.id, current.kind as ProgramOptionKind);
      if (items.some((item: any) => item.id !== input.id && item.label.localeCompare(input.label, "fr", { sensitivity: "accent" }) === 0)) throw new Error("Cette valeur existe déjà.");
      const kind = current.kind as ProgramOptionKind;
      await db.transaction(async tx => {
        await tx.update(programClientOptions).set({ label: input.label }).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id)));
        if (kind in clientColumnForOption) {
          const column = clientColumnForOption[kind as keyof typeof clientColumnForOption];
          await tx.update(clients).set({ [column]: input.label } as any).where(and(eq(clients.accountId, account.id), eq((clients as any)[column], current.label)));
        } else if (kind === "vaultCategory") {
          await tx.update(passwordVaultEntries).set({ category: input.label }).where(and(eq(passwordVaultEntries.accountId, account.id), eq(passwordVaultEntries.category, current.label)));
        } else if (kind === "documentCategory" || kind === "documentStatus") {
          const column = kind === "documentCategory" ? clientDocuments.category : clientDocuments.status;
          const owned = await tx.select({ id: clients.id }).from(clients).where(eq(clients.accountId, account.id));
          if (owned.length) await tx.update(clientDocuments).set({ [kind === "documentCategory" ? "category" : "status"]: input.label } as any).where(and(inArray(clientDocuments.clientId, owned.map(client => client.id)), eq(column, current.label)));
        } else {
          const owned = await tx.select({ id: clients.id }).from(clients).where(eq(clients.accountId, account.id));
          if (owned.length) await tx.update(clientContacts).set({ type: input.label }).where(and(inArray(clientContacts.clientId, owned.map(client => client.id)), eq(clientContacts.type, current.label)));
        }
      });
      return (await db.select().from(programClientOptions).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id))).limit(1))[0];
    }),
    remove: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      const current = (await db.select().from(programClientOptions).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id), isNull(programClientOptions.deletedAt))).limit(1))[0];
      if (!current) throw new Error("Valeur introuvable.");
      const usageCount = await countProgramOptionUsage(db, account.id, current.kind as ProgramOptionKind, current.label);
      if (usageCount) throw new Error(`Cette valeur est encore utilisée (${usageCount}). Modifiez ou réaffectez les éléments concernés avant de l’archiver.`);
      await db.update(programClientOptions).set({ deletedAt: new Date(), purgeAfter: archiveAfterThirtyDays() }).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id)));
      return { success: true } as const;
    }),
  }),
  referenceRegistry: router({
    list: publicProcedure.query(async ({ ctx }) => {
      const account = await requireCurrentAccount(ctx.req);
      const db = await getDb();
      if (!db) throw new Error("La base de données est indisponible.");
      return getProgramReferenceSummary(db, account.id);
    }),
  }),
  rcCatalogue: router({
    summary: publicProcedure.query(async ({ ctx }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return getRcCatalogueSummary(db, account.id); }),
    families: publicProcedure.query(async ({ ctx }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return getRcCatalogueFamilies(db, account.id); }),
    activities: publicProcedure.input(z.object({ familyCode: z.string().regex(/^\d{3}$/, "Choisissez une catégorie RC valide.") })).query(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return getRcCatalogueActivities(db, account.id, input.familyCode); }),
    replaceFromExcel: publicProcedure.input(z.object({ sourceFilename: z.string().min(5).max(255), entries: z.array(z.object({ code: z.string(), label: z.string() })).min(1).max(10_000) })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return replaceRcCatalogueFromExcel(db, account.id, input.sourceFilename, input.entries); }),
    mergeFromExcel: publicProcedure.input(z.object({ sourceFilename: z.string().min(5).max(255), entries: z.array(z.object({ code: z.string(), label: z.string() })).min(1).max(10_000) })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return mergeRcCatalogueFromExcel(db, account.id, input.sourceFilename, input.entries); }),
    resetToReference: publicProcedure.mutation(async ({ ctx }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return resetRcCatalogueToReference(db, account.id); }),
    archived: publicProcedure.query(async ({ ctx }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return listArchivedRcCatalogueItems(db, account.id); }),
    createFamily: publicProcedure.input(z.object({ code: z.string().regex(/^\d{3}$/, "Le code doit comporter trois chiffres."), label: z.string().trim().min(2).max(180) })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return createRcFamily(db, account.id, input.code, input.label); }),
    updateFamily: publicProcedure.input(z.object({ code: z.string().regex(/^\d{3}$/), label: z.string().trim().min(2).max(180) })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return updateRcFamilyByCode(db, account.id, input.code, input.label); }),
    archiveFamily: publicProcedure.input(z.object({ code: z.string().regex(/^\d{3}$/) })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return archiveRcFamilyByCode(db, account.id, input.code); }),
    restoreFamily: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return restoreRcFamily(db, account.id, input.id); }),
    createActivity: publicProcedure.input(z.object({ familyCode: z.string().regex(/^\d{3}$/), code: z.string().regex(/^\d{6}$/), label: z.string().trim().min(2).max(320) })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return createRcActivity(db, account.id, input.familyCode, input.code, input.label); }),
    updateActivity: publicProcedure.input(z.object({ code: z.string().regex(/^\d{6}$/), label: z.string().trim().min(2).max(320) })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return updateRcActivityByCode(db, account.id, input.code, input.label); }),
    archiveActivity: publicProcedure.input(z.object({ code: z.string().regex(/^\d{6}$/) })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return archiveRcActivityByCode(db, account.id, input.code); }),
    restoreActivity: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); return restoreRcActivity(db, account.id, input.id); }),
  }),
});
