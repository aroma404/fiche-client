/** Atelier fiscal moderne — données multi-clients persistantes, chacune bornée au compte de la session. */

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { clientCashEntries, clientCompliance, clientDocuments, clientPayments, clients, clientWorkCases } from "../../drizzle/schema";
import { requireCurrentAccount } from "../account-context";
import { getClientBundle, getDb, getOwnedClient } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const documentStatus = z.enum(["Reçu", "À vérifier", "À demander", "Non requis"]);
const complianceStatus = z.enum(["À vérifier", "Conforme", "À régulariser"]);
const caseStatus = z.enum(["À préparer", "En cours", "Terminé"]);

const clientInput = z.object({
  fullName: z.string().trim().min(2, "Indiquez le nom du client.").max(220), activity: z.string().max(220).default(""),
  legalForm: z.string().max(80).default("Personne physique"), clientType: z.string().max(80).default("Particulier"), status: z.string().max(60).default("Actif"),
  commune: z.string().max(160).default(""), contact: z.string().max(160).default(""), nif: z.string().max(80).default(""), rc: z.string().max(80).default(""),
  bp: z.string().max(80).default(""), taxArticle: z.string().max(80).default(""), nin: z.string().max(80).default(""), regime: z.string().max(80).default("Principal"),
  initialBalance: z.number().finite().default(0), observations: z.string().max(8000).default(""),
});

const documentInput = z.object({ label: z.string().min(1).max(120), category: z.string().max(100).default("Fiscal"), status: documentStatus, note: z.string().max(500).default("") });
const complianceInput = z.object({ label: z.string().min(1).max(120), status: complianceStatus, note: z.string().max(500).default("") });
const caseInput = z.object({ label: z.string().min(1).max(160), caseType: z.enum(["CDI", "CPI", "CASNOS", "Autre"]), status: caseStatus, note: z.string().max(500).default("") });
const paymentInput = z.object({ paymentDate: z.string().min(4).max(30), label: z.string().min(1).max(180), reference: z.string().max(160).default(""), amount: z.number().finite() });
const cashInput = z.object({ entryDate: z.string().min(4).max(30), label: z.string().min(1).max(180), direction: z.enum(["Entrée", "Sortie"]), amount: z.number().finite() });

export const clientBundleInput = z.object({ client: clientInput, documents: z.array(documentInput).max(100), compliance: z.array(complianceInput).max(30), cases: z.array(caseInput).max(100), payments: z.array(paymentInput).max(500), cashEntries: z.array(cashInput).max(500) });

const DEFAULT_DOCUMENTS = [["Cachet", "Identité"], ["G8", "Fiscal"], ["NIF", "Fiscal"], ["NIS", "Fiscal"], ["BP", "Fiscal"], ["Livres obligatoires", "Comptabilité"], ["G12", "Fiscal"], ["G12 bis", "Fiscal"], ["TAP / TFPC", "Fiscal"], ["G50 ter", "Fiscal"], ["301 bis", "Fiscal"], ["Extrait de rôle", "Fiscal"]] as const;
const DEFAULT_COMPLIANCE = ["Déclaration CNAS", "Déclaration CASNOS", "Déclaration CACOBATPH"];
const DEFAULT_CASES = [["Dossier CDI", "CDI"], ["Dossier CPI", "CPI"], ["Dossier CASNOS", "CASNOS"]] as const;

export const clientsRouter = router({
  list: publicProcedure.input(z.object({ includeArchived: z.boolean().optional() }).optional()).query(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
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
    return db.transaction(async tx => {
      const inserted = await tx.insert(clients).values({ ...input, accountId: account.id, initialBalance: input.initialBalance.toFixed(2), observations: input.observations || null });
      const clientId = Number(inserted[0]?.insertId);
      await tx.insert(clientDocuments).values(DEFAULT_DOCUMENTS.map(([label, category]) => ({ clientId, label, category, status: "À demander" as const, note: "" })));
      await tx.insert(clientCompliance).values(DEFAULT_COMPLIANCE.map(label => ({ clientId, label, status: "À vérifier" as const, note: "" })));
      await tx.insert(clientWorkCases).values(DEFAULT_CASES.map(([label, caseType]) => ({ clientId, label, caseType, status: "À préparer" as const, note: "" })));
      return { clientId };
    });
  }),

  saveBundle: publicProcedure.input(z.object({ clientId: z.number().int().positive(), data: clientBundleInput })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    if (!(await getOwnedClient(account.id, input.clientId))) throw new Error("Client introuvable.");
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await db.transaction(async tx => {
      await tx.update(clients).set({ ...input.data.client, initialBalance: input.data.client.initialBalance.toFixed(2), observations: input.data.client.observations || null }).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id)));
      await Promise.all([tx.delete(clientDocuments).where(eq(clientDocuments.clientId, input.clientId)), tx.delete(clientCompliance).where(eq(clientCompliance.clientId, input.clientId)), tx.delete(clientWorkCases).where(eq(clientWorkCases.clientId, input.clientId)), tx.delete(clientPayments).where(eq(clientPayments.clientId, input.clientId)), tx.delete(clientCashEntries).where(eq(clientCashEntries.clientId, input.clientId))]);
      if (input.data.documents.length) await tx.insert(clientDocuments).values(input.data.documents.map(item => ({ clientId: input.clientId, ...item })));
      if (input.data.compliance.length) await tx.insert(clientCompliance).values(input.data.compliance.map(item => ({ clientId: input.clientId, ...item })));
      if (input.data.cases.length) await tx.insert(clientWorkCases).values(input.data.cases.map(item => ({ clientId: input.clientId, ...item })));
      if (input.data.payments.length) await tx.insert(clientPayments).values(input.data.payments.map(item => ({ clientId: input.clientId, ...item, amount: item.amount.toFixed(2) })));
      if (input.data.cashEntries.length) await tx.insert(clientCashEntries).values(input.data.cashEntries.map(item => ({ clientId: input.clientId, ...item, amount: item.amount.toFixed(2) })));
    });
    return { success: true } as const;
  }),

  archive: publicProcedure.input(z.object({ clientId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await db.update(clients).set({ archivedAt: new Date() }).where(and(eq(clients.id, input.clientId), eq(clients.accountId, account.id)));
    return { success: true } as const;
  }),
});
