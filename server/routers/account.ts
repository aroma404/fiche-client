/** Atelier fiscal moderne — création de compte, connexion, compte personnel et session sécurisée. */

import { and, eq } from "drizzle-orm";
import { parse } from "cookie";
import { nanoid } from "nanoid";
import { z } from "zod";
import { accounts, accountSessions } from "../../drizzle/schema";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router } from "../_core/trpc";
import { getCurrentAccount, requireCurrentAccount } from "../account-context";
import { hashPassword, verifyPassword } from "../auth/password";
import { ACCOUNT_SESSION_COOKIE, sessionMaxAge, signAccountSession, verifyAccountSession } from "../auth/session";
import { getAccountByEmail, getDb } from "../db";

const passwordSchema = z.string().min(10, "Le mot de passe doit contenir au moins 10 caractères.").max(128);
const profileSchema = z.object({ fullName: z.string().trim().min(3).max(180) });

function publicAccount(account: { id: number; fullName: string; email: string }) {
  return { id: account.id, fullName: account.fullName, email: account.email };
}

function writeSessionCookie(ctx: { req: Parameters<typeof getSessionCookieOptions>[0]; res: { cookie: Function } }, token: string) {
  ctx.res.cookie(ACCOUNT_SESSION_COOKIE, token, {
    ...getSessionCookieOptions(ctx.req),
    sameSite: "lax",
    maxAge: sessionMaxAge(),
  });
}

async function createSession(ctx: { req: Parameters<typeof getSessionCookieOptions>[0]; res: { cookie: Function } }, accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de données est indisponible.");
  const id = nanoid(40);
  const expiresAt = new Date(Date.now() + sessionMaxAge());
  await db.insert(accountSessions).values({ id, accountId, expiresAt });
  writeSessionCookie(ctx, await signAccountSession(accountId, id));
}

export const accountRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    const account = await getCurrentAccount(ctx.req);
    return account ? publicAccount(account) : null;
  }),

  register: publicProcedure.input(z.object({
    fullName: z.string().trim().min(3, "Indiquez votre nom complet.").max(180),
    email: z.string().trim().email("Indiquez une adresse e-mail valide.").max(320),
    password: passwordSchema,
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    const email = input.email.toLowerCase();
    if (await getAccountByEmail(email)) throw new Error("Cette adresse e-mail est déjà utilisée.");
    const result = await db.insert(accounts).values({ fullName: input.fullName, email, passwordHash: await hashPassword(input.password) });
    const account = await getAccountByEmail(email);
    if (!account || !result[0]?.insertId) throw new Error("Impossible de créer le compte.");
    await createSession(ctx, account.id);
    return publicAccount(account);
  }),

  login: publicProcedure.input(z.object({ email: z.string().trim().email(), password: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const account = await getAccountByEmail(input.email.toLowerCase());
    if (!account || !(await verifyPassword(input.password, account.passwordHash))) throw new Error("E-mail ou mot de passe incorrect.");
    await createSession(ctx, account.id);
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

  changePassword: publicProcedure.input(z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema })).mutation(async ({ ctx, input }) => {
    const account = await requireCurrentAccount(ctx.req);
    if (!(await verifyPassword(input.currentPassword, account.passwordHash))) throw new Error("Le mot de passe actuel est incorrect.");
    const db = await getDb();
    if (!db) throw new Error("La base de données est indisponible.");
    await db.update(accounts).set({ passwordHash: await hashPassword(input.newPassword) }).where(eq(accounts.id, account.id));
    return { success: true } as const;
  }),
});
