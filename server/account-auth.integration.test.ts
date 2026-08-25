/** Intégration auth : inscription, connexion, lecture de session et déconnexion, avec nettoyage automatique. */

import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { accountSessions, accounts } from "../drizzle/schema";
import { getAccountByEmail, getDb } from "./db";
import { accountRouter } from "./routers/account";

const suite = process.env.DATABASE_URL ? describe : describe.skip;
const email = `auth-${randomUUID()}@exemple.test`;
const updatedEmail = `auth-modifie-${randomUUID()}@exemple.test`;
const password = "MotDePasseTemporaire!2026";

function context(cookie = "") {
  const cookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];
  const cleared: string[] = [];
  const headers: Record<string, string> = {};
  return {
    ctx: { req: { protocol: "https", headers: { cookie } }, res: { cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }), clearCookie: (name: string) => cleared.push(name), setHeader: (name: string, value: string) => { headers[name] = value; } } } as any,
    cookies,
    cleared,
    headers,
  };
}

suite("parcours d’authentification persistant", () => {
  afterAll(async () => {
    const db = await getDb(); const account = await getAccountByEmail(email);
    if (db && account) { await db.delete(accountSessions).where(eq(accountSessions.accountId, account.id)); await db.delete(accounts).where(eq(accounts.id, account.id)); }
  });

  it("inscrit un compte, le reconnecte, protège le changement d’e-mail et efface le compte", async () => {
    const first = context();
    const register = accountRouter.createCaller(first.ctx);
    const created = await register.register({ fullName: "Compte temporaire", email, password, acceptTerms: true, rememberMe: false });
    expect(created).toMatchObject({ fullName: "Compte temporaire", email });
    expect(first.cookies).toHaveLength(1);
    expect(first.cookies[0].options?.maxAge).toBeUndefined();

    const firstCookie = `fiche_client_session=${first.cookies[0].value}`;
    const firstSession = context(firstCookie);
    const sessionStartedAt = performance.now();
    await expect(accountRouter.createCaller(firstSession.ctx).me()).resolves.toMatchObject({ id: created.id, email });
    const sessionElapsedMs = Math.round(performance.now() - sessionStartedAt);
    expect(firstSession.headers["Server-Timing"]).toMatch(/^account_session;dur=\d+$/);

    const second = context();
    const loginStartedAt = performance.now();
    await expect(accountRouter.createCaller(second.ctx).login({ email, password, rememberMe: true })).resolves.toMatchObject({ id: created.id });
    const loginElapsedMs = Math.round(performance.now() - loginStartedAt);
    expect(second.headers["Server-Timing"]).toMatch(/^account_login;dur=\d+$/);
    console.info(`[Performance auth] login=${loginElapsedMs}ms · session=${sessionElapsedMs}ms`);
    expect(Number(second.cookies[0].options?.maxAge)).toBeGreaterThan(60 * 60 * 24 * 1_000);
    const dbBeforeLogout = await getDb();
    if (dbBeforeLogout) expect(await dbBeforeLogout.select().from(accountSessions).where(eq(accountSessions.accountId, created.id))).toEqual(expect.arrayContaining([expect.objectContaining({ rememberMe: false }), expect.objectContaining({ rememberMe: true })]));
    const secondCookie = `fiche_client_session=${second.cookies[0].value}`;
    const logout = context(secondCookie);
    await expect(accountRouter.createCaller(logout.ctx).logout()).resolves.toEqual({ success: true });
    expect(logout.cleared).toEqual(["fiche_client_session"]);
    await expect(accountRouter.createCaller(context(secondCookie).ctx).me()).resolves.toBeNull();

    const emailContext = context(firstCookie);
    await expect(accountRouter.createCaller(emailContext.ctx).changeEmail({ currentPassword: password, email: updatedEmail })).resolves.toMatchObject({ id: created.id, email: updatedEmail });
    expect(await getAccountByEmail(email)).toBeNull();
    await expect(accountRouter.createCaller(context(firstCookie).ctx).changeEmail({ currentPassword: "mauvais-mot-de-passe", email })).rejects.toThrow("mot de passe actuel");
    await expect(accountRouter.createCaller(context(firstCookie).ctx).updatePreferences({ preferredExportFormat: "json", preferredDocumentMode: "print" })).resolves.toMatchObject({ preferredExportFormat: "json", preferredDocumentMode: "print" });

    const deletion = context(firstCookie);
    await expect(accountRouter.createCaller(deletion.ctx).deleteAccount({ currentPassword: password, confirmation: "SUPPRIMER" })).resolves.toEqual({ success: true });
    expect(deletion.cleared).toEqual(["fiche_client_session"]);
    expect(await getAccountByEmail(updatedEmail)).toBeNull();
    const db = await getDb();
    if (db) expect(await db.select().from(accountSessions).where(eq(accountSessions.accountId, created.id))).toHaveLength(0);
  }, 15_000);
});
