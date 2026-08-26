/** Registre de paiements et caisse du cabinet, toujours filtré par le compte connecté. */

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { cabinetFinanceEntries } from "../../drizzle/schema";
import { requireCurrentAccount } from "../account-context";
import { getDb, getOwnedClient } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const financeInput = z.object({
  clientId: z.number().int().positive().nullable().optional(),
  entryDate: z.string().min(4).max(30),
  category: z.enum(["Paiement", "Caisse"]),
  direction: z.enum(["Entrée", "Sortie"]),
  counterpartyName: z.string().trim().max(220).default(""),
  label: z.string().trim().min(1).max(180),
  reference: z.string().trim().max(160).default(""),
  amount: z.number().positive(),
  note: z.string().trim().max(500).default(""),
}).superRefine((entry, ctx) => {
  if (entry.category !== "Paiement") return;
  if (!entry.clientId && !entry.counterpartyName) ctx.addIssue({ code: "custom", path: ["counterpartyName"], message: "Choisissez un dossier ou indiquez le nom du client non enregistré." });
  if (entry.clientId && entry.counterpartyName) ctx.addIssue({ code: "custom", path: ["counterpartyName"], message: "Un paiement est lié soit à un dossier, soit à un client non enregistré." });
});

export const cabinetFinanceRouter = router({
  list: publicProcedure.input(z.object({ clientId: z.number().int().positive().optional(), category: z.enum(["Paiement", "Caisse"]).optional() }).optional()).query(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    if (input?.clientId && !(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable.");
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    const filters = [eq(cabinetFinanceEntries.accountId, account.id)];
    if (input?.clientId) filters.push(eq(cabinetFinanceEntries.clientId, input.clientId));
    if (input?.category) filters.push(eq(cabinetFinanceEntries.category, input.category));
    return db.select().from(cabinetFinanceEntries).where(and(...filters)).orderBy(desc(cabinetFinanceEntries.entryDate), desc(cabinetFinanceEntries.id));
  }),

  create: publicProcedure.input(financeInput).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    if (input.clientId && !(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable.");
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    const inserted = await db.insert(cabinetFinanceEntries).values({ ...input, accountId: account.id, clientId: input.clientId ?? null, amount: input.amount.toFixed(2) });
    return { entryId: Number(inserted[0]?.insertId) };
  }),

  remove: publicProcedure.input(z.object({ entryId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await db.delete(cabinetFinanceEntries).where(and(eq(cabinetFinanceEntries.id, input.entryId), eq(cabinetFinanceEntries.accountId, account.id)));
    return { success: true } as const;
  }),
});
