/** Atelier fiscal moderne — création de compte, connexion, compte personnel et session sécurisée. */

import { and, eq, inArray } from "drizzle-orm";
import { parse } from "cookie";
import { nanoid } from "nanoid";
import { z } from "zod";
import { accounts, accountSessions, clientCashEntries, clientCompliance, clientDocuments, clientPayments, clients, clientWorkCases, exportAudit, programClientStatuses } from "../../drizzle/schema";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router } from "../_core/trpc";
import { getCurrentAccount, requireCurrentAccount } from "../account-context";
import { hashPassword, verifyPassword } from "../auth/password";
import { ACCOUNT_SESSION_COOKIE, sessionMaxAge, signAccountSession, verifyAccountSession } from "../auth/session";
import { getAccountByEmail, getDb } from "../db";

const passwordSchema = z.string().min(10, "Le mot de passe doit contenir au moins 10 caractères.").max(128);
const profileSchema = z.object({ fullName: z.string().trim().min(3).max(180) });
const emailSchema = z.string().trim().email("Indiquez une adresse e-mail valide.").max(320);

function publicAccount(account: { id: number; fullName: string; email: string; preferredExportFormat: "json" | "xlsx"; preferredDocumentMode: "pdf" | "print" }) {
  return { id: account.id, fullName: account.fullName, email: account.email, preferredExportFormat: account.preferredExportFormat, preferredDocumentMode: account.preferredDocumentMode };
}

function writeSessionCookie(ctx: { req: Parameters<typeof getSessionCookieOptions>[0]; res: { cookie: Function } }, token: string, rememberMe: boolean) {
  const options = { ...getSessionCookieOptions(ctx.req), sameSite: "lax" as const };
  ctx.res.cookie(ACCOUNT_SESSION_COOKIE, token, rememberMe ? { ...options, maxAge: sessionMaxAge(true) } : options);
}

function recordAuthTiming(ctx: { res: { setHeader?: (name: string, value: string) => void } }, label: string, startedAt: number) {
  ctx.res.setHeader?.("Server-Timing", `${label};dur=${Math.round(performance.now() - startedAt)}`);
}

async function createSession(ctx: { req: Parameters<typeof getSessionCookieOptions>[0]; res: { cookie: Function } }, accountId: number, rememberMe: boolean) {
  const db = await getDb();
  if (!db) throw new Error("La base de données est indisponible.");
  const id = nanoid(40);
  const expiresAt = new Date(Date.now() + sessionMaxAge(rememberMe));
  const [, token] = await Promise.all([
    db.insert(accountSessions).values({ id, accountId, expiresAt, rememberMe }),
    signAccountSession(accountId, id, rememberMe),
  ]);
  writeSessionCookie(ctx, token, rememberMe);
}

export const accountRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    const startedAt = performance.now();
    const account = await getCurrentAccount(ctx.req);
    recordAuthTiming(ctx, "account_session", startedAt);
    return account ? publicAccount(account) : null;
  }),

  register: publicProcedure.input(z.object({
    fullName: z.string().trim().min(3, "Indiquez votre nom complet.").max(180),
    email: z.string().trim().email("Indiquez une adresse e-mail valide.").max(320),
    password: passwordSchema,
    acceptTerms: z.literal(true, { error: "Vous devez accepter la convention d’utilisation." }),
    rememberMe: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    const email = input.email.toLowerCase();
    if (await getAccountByEmail(email)) throw new Error("Cette adresse e-mail est déjà utilisée.");
    const result = await db.insert(accounts).values({ fullName: input.fullName, email, passwordHash: await hashPassword(input.password) });
    const account = await getAccountByEmail(email);
    if (!account || !result[0]?.insertId) throw new Error("Impossible de créer le compte.");
    await createSession(ctx, account.id, input.rememberMe);
    return publicAccount(account);
  }),

  login: publicProcedure.input(z.object({ email: z.string().trim().email(), password: z.string().min(1), rememberMe: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    const startedAt = performance.now();
    const account = await getAccountByEmail(input.email.toLowerCase());
    if (!account || !(await verifyPassword(input.password, account.passwordHash))) throw new Error("E-mail ou mot de passe incorrect.");
    await createSession(ctx, account.id, input.rememberMe);
    recordAuthTiming(ctx, "account_login", startedAt);
    return publicAccount(account);
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const token = parse(ctx.req.headers.cookie ?? "")[ACCOUNT_SESSION_COOKIE];
    if (token) {
      try {
        const { accountId, sessionId } = await verifyAccountSession(token);
        const db = await getDb();
        if (db) await db.update(accountSessions).set({ revokedAt: new Date() }).where(and(eq(accountSessions.id, sessionId), eq(accountSessions.accountId, accountId)));
      } catch { /* La suppression du cookie reste sûre même si le jeton est déjà invalide. */ }
    }
    ctx.res.clearCookie(ACCOUNT_SESSION_COOKIE, { ...getSessionCookieOptions(ctx.req), sameSite: "lax" });
    return { success: true } as const;
  }),

  updateProfile: publicProcedure.input(profileSchema).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await db.update(accounts).set({ fullName: input.fullName }).where(eq(accounts.id, account.id));
    return { ...publicAccount(account), fullName: input.fullName };
  }),

  changeEmail: publicProcedure.input(z.object({ currentPassword: z.string().min(1), email: emailSchema })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    if (!(await verifyPassword(input.currentPassword, account.passwordHash))) throw new Error("Le mot de passe actuel est incorrect.");
    const email = input.email.toLowerCase();
    const existing = await getAccountByEmail(email);
    if (existing && existing.id !== account.id) throw new Error("Cette adresse e-mail est déjà utilisée.");
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await db.update(accounts).set({ email }).where(eq(accounts.id, account.id));
    return { ...publicAccount(account), email };
  }),

  updatePreferences: publicProcedure.input(z.object({ preferredExportFormat: z.enum(["json", "xlsx"]), preferredDocumentMode: z.enum(["pdf", "print"]) })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await db.update(accounts).set(input).where(eq(accounts.id, account.id));
    return { ...publicAccount(account), ...input };
  }),

  changePassword: publicProcedure.input(z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    if (!(await verifyPassword(input.currentPassword, account.passwordHash))) throw new Error("Le mot de passe actuel est incorrect.");
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await db.update(accounts).set({ passwordHash: await hashPassword(input.newPassword) }).where(eq(accounts.id, account.id));
    return { success: true } as const;
  }),

  deleteAccount: publicProcedure.input(z.object({ currentPassword: z.string().min(1), confirmation: z.literal("SUPPRIMER") })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    if (!(await verifyPassword(input.currentPassword, account.passwordHash))) throw new Error("Le mot de passe actuel est incorrect.");
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await db.transaction(async tx => {
      const ownedClients = await tx.select({ id: clients.id }).from(clients).where(eq(clients.accountId, account.id));
      const clientIds = ownedClients.map(client => client.id);
      if (clientIds.length) await Promise.all([tx.delete(clientDocuments).where(inArray(clientDocuments.clientId, clientIds)), tx.delete(clientCompliance).where(inArray(clientCompliance.clientId, clientIds)), tx.delete(clientWorkCases).where(inArray(clientWorkCases.clientId, clientIds)), tx.delete(clientPayments).where(inArray(clientPayments.clientId, clientIds)), tx.delete(clientCashEntries).where(inArray(clientCashEntries.clientId, clientIds)), tx.delete(clients).where(eq(clients.accountId, account.id))]);
      await Promise.all([tx.delete(exportAudit).where(eq(exportAudit.accountId, account.id)), tx.delete(programClientStatuses).where(eq(programClientStatuses.accountId, account.id)), tx.delete(accountSessions).where(eq(accountSessions.accountId, account.id))]);
      await tx.delete(accounts).where(eq(accounts.id, account.id));
    });
    ctx.res.clearCookie(ACCOUNT_SESSION_COOKIE, { ...getSessionCookieOptions(ctx.req), sameSite: "lax" });
    return { success: true } as const;
  }),
});
