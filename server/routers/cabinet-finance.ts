import { and, count, desc, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { cabinetFinanceEntries, clientDocuments, clients } from "../../drizzle/schema";
import { requireCurrentAccount } from "../account-context";
import { getDb, getOwnedClient } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const financeInput = z.object({
  clientId: z.number().int().positive().nullable().optional(),
  documentId: z.number().int().positive().nullable().optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Utilisez une date valide."),
  category: z.enum(["Paiement", "Caisse"]),
  direction: z.enum(["Entrée", "Sortie"]),
  counterpartyName: z.string().trim().max(220).default(""),
  label: z.string().trim().min(1).max(180),
  reference: z.string().trim().max(160).default(""),
  amount: z.number().positive(),
  note: z.string().trim().max(500).default(""),
}).superRefine((entry, ctx) => {
  if (entry.category === "Paiement" && !entry.clientId && !entry.counterpartyName) ctx.addIssue({ code: "custom", path: ["counterpartyName"], message: "Choisissez un dossier ou indiquez le nom du tiers occasionnel." });
  if (entry.category === "Paiement" && entry.clientId && entry.counterpartyName) ctx.addIssue({ code: "custom", path: ["counterpartyName"], message: "Un paiement est lié soit à un dossier, soit à un tiers occasionnel." });
  if (entry.documentId && entry.category !== "Paiement") ctx.addIssue({ code: "custom", path: ["documentId"], message: "Seul un paiement peut être relié à un document." });
  if (entry.documentId && !entry.clientId) ctx.addIssue({ code: "custom", path: ["documentId"], message: "Choisissez le dossier propriétaire du document." });
});

async function assertFinanceOwnership(db: any, accountId: number, input: z.infer<typeof financeInput>) {
  if (input.clientId) {
    const client = await getOwnedClient(accountId, input.clientId);
    if (!client || client.deletedAt) throw new Error("Client introuvable ou archivé.");
  }
  if (input.documentId && input.clientId) {
    const document = (await db.select({ id: clientDocuments.id }).from(clientDocuments).where(and(eq(clientDocuments.id, input.documentId), eq(clientDocuments.clientId, input.clientId), isNull(clientDocuments.deletedAt))).limit(1))[0];
    if (!document) throw new Error("Le document choisi n’appartient pas au dossier actif.");
  }
}

function periodBounds(period: "day" | "month" | "year", now = new Date()) {
  const year = now.getUTCFullYear(); const month = String(now.getUTCMonth() + 1).padStart(2, "0"); const day = String(now.getUTCDate()).padStart(2, "0");
  if (period === "day") return { start: `${year}-${month}-${day}`, end: `${year}-${month}-${day}` };
  if (period === "month") return { start: `${year}-${month}-01`, end: `${year}-${month}-31` };
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

async function topClientStatistics(db: any, accountId: number, period: "day" | "month" | "year") {
  const { start, end } = periodBounds(period);
  const base = and(eq(cabinetFinanceEntries.accountId, accountId), isNotNull(cabinetFinanceEntries.clientId), gte(cabinetFinanceEntries.entryDate, start), lte(cabinetFinanceEntries.entryDate, end));
  const [mostTreated] = await db.select({ clientId: clients.id, fullName: clients.fullName, referenceNumber: clients.referenceNumber, count: count(cabinetFinanceEntries.id) }).from(cabinetFinanceEntries).innerJoin(clients, and(eq(clients.id, cabinetFinanceEntries.clientId), eq(clients.accountId, accountId))).where(base).groupBy(clients.id, clients.fullName, clients.referenceNumber).orderBy(desc(count(cabinetFinanceEntries.id)), ascClientName()).limit(1);
  const [bestPayer] = await db.select({ clientId: clients.id, fullName: clients.fullName, referenceNumber: clients.referenceNumber, total: sql<string>`COALESCE(SUM(${cabinetFinanceEntries.amount}), 0)` }).from(cabinetFinanceEntries).innerJoin(clients, and(eq(clients.id, cabinetFinanceEntries.clientId), eq(clients.accountId, accountId))).where(and(base, eq(cabinetFinanceEntries.category, "Paiement"), eq(cabinetFinanceEntries.direction, "Entrée"))).groupBy(clients.id, clients.fullName, clients.referenceNumber).orderBy(desc(sql`COALESCE(SUM(${cabinetFinanceEntries.amount}), 0)`), ascClientName()).limit(1);
  return { period, mostTreated: mostTreated ?? null, bestPayer: bestPayer ? { ...bestPayer, total: Number(bestPayer.total) } : null };
}

function ascClientName() { return sql`${clients.fullName} ASC`; }

export const cabinetFinanceRouter = router({
  list: publicProcedure.input(z.object({ clientId: z.number().int().positive().optional(), category: z.enum(["Paiement", "Caisse"]).optional() }).optional()).query(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    if (input?.clientId && !(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable.");
    const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
    const filters = [eq(cabinetFinanceEntries.accountId, account.id)];
    if (input?.clientId) filters.push(eq(cabinetFinanceEntries.clientId, input.clientId));
    if (input?.category) filters.push(eq(cabinetFinanceEntries.category, input.category));
    return db.select().from(cabinetFinanceEntries).where(and(...filters)).orderBy(desc(cabinetFinanceEntries.entryDate), desc(cabinetFinanceEntries.id));
  }),
  clientDocuments: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req); const client = await getOwnedClient(account.id, input.clientId); if (!client || client.deletedAt) throw new Error("Client introuvable ou archivé."); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
    return db.select({ id: clientDocuments.id, label: clientDocuments.label, category: clientDocuments.category, status: clientDocuments.status }).from(clientDocuments).where(and(eq(clientDocuments.clientId, input.clientId), isNull(clientDocuments.deletedAt))).orderBy(desc(clientDocuments.updatedAt));
  }),
  statistics: publicProcedure.query(async ({ ctx }) => {
    const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
    const [day, month, year] = await Promise.all([topClientStatistics(db, account.id, "day"), topClientStatistics(db, account.id, "month"), topClientStatistics(db, account.id, "year")]);
    return { day, month, year };
  }),
  create: publicProcedure.input(financeInput).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible."); await assertFinanceOwnership(db, account.id, input);
    const inserted = await db.insert(cabinetFinanceEntries).values({ ...input, accountId: account.id, clientId: input.clientId ?? null, documentId: input.documentId ?? null, amount: input.amount.toFixed(2) });
    return { entryId: Number(inserted[0]?.insertId) };
  }),
  update: publicProcedure.input(z.object({ entryId: z.number().int().positive(), entry: financeInput })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req); const db = await getDb(); if (!db) throw new Error("La base de données est indisponible.");
    const current = (await db.select({ id: cabinetFinanceEntries.id }).from(cabinetFinanceEntries).where(and(eq(cabinetFinanceEntries.id, input.entryId), eq(cabinetFinanceEntries.accountId, account.id))).limit(1))[0];
    if (!current) throw new Error("Mouvement introuvable."); await assertFinanceOwnership(db, account.id, input.entry);
    await db.update(cabinetFinanceEntries).set({ ...input.entry, clientId: input.entry.clientId ?? null, documentId: input.entry.documentId ?? null, amount: input.entry.amount.toFixed(2) }).where(and(eq(cabinetFinanceEntries.id, input.entryId), eq(cabinetFinanceEntries.accountId, account.id)));
    return { success: true } as const;
  }),
  remove: publicProcedure.input(z.object({ entryId: z.number().int().positive() })).mutation(async () => { throw new Error("La suppression définitive d’un mouvement financier est désactivée. Modifiez le mouvement si nécessaire."); }),
});
