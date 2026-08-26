import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { clients, programClientOptions, programClientStatuses } from "../../drizzle/schema";
import { requireCurrentAccount } from "../account-context";
import { getDb } from "../db";
import { listProgramClientStatuses, programClientStatusScope } from "../program-client-statuses";
import { clientColumnForOption, listProgramClientOptions, programOptionKinds, type ProgramOptionKind } from "../program-client-options";
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
      return listProgramClientStatuses(db, account.id);
    }),
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
      return listProgramClientOptions(db, account.id, input.kind);
    }),
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
      await db.transaction(async tx => { await tx.update(programClientOptions).set({ label: input.label }).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id))); await tx.update(clients).set({ [clientColumnForOption[current.kind as ProgramOptionKind]]: input.label } as any).where(and(eq(clients.accountId, account.id), eq((clients as any)[clientColumnForOption[current.kind as ProgramOptionKind]], current.label))); });
      return (await db.select().from(programClientOptions).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id))).limit(1))[0];
    }),
    remove: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
      const current = (await db.select().from(programClientOptions).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id), isNull(programClientOptions.deletedAt))).limit(1))[0];
      if (!current) throw new Error("Valeur introuvable.");
      const usage = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.accountId, account.id), eq((clients as any)[clientColumnForOption[current.kind as ProgramOptionKind]], current.label))).limit(1);
      if (usage.length) throw new Error("Cette valeur est encore utilisée par un dossier. Modifiez ou réaffectez les dossiers avant de l’archiver.");
      await db.update(programClientOptions).set({ deletedAt: new Date(), purgeAfter: archiveAfterThirtyDays() }).where(and(eq(programClientOptions.id, input.id), eq(programClientOptions.accountId, account.id)));
      return { success: true } as const;
    }),
  }),
});
