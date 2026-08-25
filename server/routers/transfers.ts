/** Atelier fiscal moderne — export et import de données, toujours réattribués au compte connecté. */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { accounts, cabinetFinanceEntries, clientCompliance, clientDocuments, clients, clientWorkCases, exportAudit } from "../../drizzle/schema";
import { requireCurrentAccount } from "../account-context";
import { canonicalActivityLabel } from "../client-activity";
import { canonicalFinanceEntries } from "../client-ledger";
import { getClientBundles, getDb } from "../db";
import { assertProgramClientStatus } from "../program-client-statuses";
import { publicProcedure, router } from "../_core/trpc";
import { clientBundleInput } from "./clients";

const importPayload = z.object({ schemaVersion: z.literal(1), clients: z.array(clientBundleInput).min(1).max(200) });

export const transfersRouter = router({
  exportData: publicProcedure.input(z.object({ format: z.enum(["json", "xlsx"]), scope: z.enum(["active", "selected", "all"]), clientIds: z.array(z.number().int().positive()).max(200).optional() })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    const selectedIds = input.scope === "all" ? undefined : input.clientIds;
    if (input.scope !== "all" && !selectedIds?.length) throw new Error("Sélectionnez au moins un client.");
    const bundles = (await getClientBundles(account.id, selectedIds)).filter(Boolean);
    const db = await getDb();
    if (db) await db.insert(exportAudit).values({ accountId: account.id, format: input.format, scope: input.scope, clientCount: bundles.length });
    return { schemaVersion: 1 as const, exportedAt: new Date().toISOString(), clients: bundles };
  }),

  previewImport: publicProcedure.input(importPayload).mutation(async ({ ctx, input }) => {
    await requireCurrentAccount(ctx.req);
    return { schemaVersion: input.schemaVersion, clientCount: input.clients.length, names: input.clients.map(item => item.client.fullName), documentCount: input.clients.reduce((total, item) => total + item.documents.length, 0), paymentCount: input.clients.reduce((total, item) => total + (item.financeEntries.length || item.payments.length), 0) };
  }),

  commitImport: publicProcedure.input(importPayload).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await Promise.all(input.clients.map(bundle => assertProgramClientStatus(db, account.id, bundle.client.status)));
    const createdIds = await db.transaction(async tx => {
      const ids: number[] = [];
      for (const bundle of input.clients) {
        const created = await tx.insert(clients).values({ ...bundle.client, activity: canonicalActivityLabel(bundle.client), accountId: account.id, initialBalance: bundle.client.initialBalance.toFixed(2), observations: bundle.client.observations || null });
        const clientId = Number(created[0]?.insertId);
        ids.push(clientId);
        if (bundle.documents.length) await tx.insert(clientDocuments).values(bundle.documents.map(item => ({ clientId, ...item })));
        if (bundle.compliance.length) await tx.insert(clientCompliance).values(bundle.compliance.map(item => ({ clientId, ...item })));
        if (bundle.cases.length) await tx.insert(clientWorkCases).values(bundle.cases.map(item => ({ clientId, ...item })));
        const financeEntries = canonicalFinanceEntries(bundle);
        if (financeEntries.length) await tx.insert(cabinetFinanceEntries).values(financeEntries.map(item => ({ ...item, accountId: account.id, clientId, amount: item.amount.toFixed(2) })));
      }
      return ids;
    });
    return { clientIds: createdIds };
  }),
});
