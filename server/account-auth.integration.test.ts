/** Intégration auth : inscription, connexion, lecture de session et déconnexion, avec nettoyage automatique. */

import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { accountSessions, accounts } from "../drizzle/schema";
import { getAccountByEmail, getDb } from "./db";
import { accountRouter } from "./routers/account";

const suite = process.env.DATABASE_URL ? describe : describe.skip;
const email = `auth-${randomUUID()}@exemple.test`;
const password = "MotDePasseTemporaire!2026";

function context(cookie = "") {
  const cookies: { name: string; value: string }[] = [];
  const cleared: string[] = [];
  return {
    ctx: { req: { protocol: "https", headers: { cookie } }, res: { cookie: (name: string, value: string) => cookies.push({ name, value }), clearCookie: (name: string) => cleared.push(name) } } as any,
    cookies,
    cleared,
  };
}

suite("parcours d’authentification persistant", () => {
  afterAll(async () => {
    const db = await getDb(); const account = await getAccountByEmail(email);
    if (db && account) { await db.delete(accountSessions).where(eq(accountSessions.accountId, account.id)); await db.delete(accounts).where(eq(accounts.id, account.id)); }
  });

  it("inscrit un compte, le reconnecte puis invalide la session de sortie", async () => {
    const first = context();
    const register = accountRouter.createCaller(first.ctx);
    const created = await register.register({ fullName: "Compte temporaire", email, password });
    expect(created).toMatchObject({ fullName: "Compte temporaire", email });
    expect(first.cookies).toHaveLength(1);

    const firstCookie = `fiche_client_session=${first.cookies[0].value}`;
    await expect(accountRouter.createCaller(context(firstCookie).ctx).me()).resolves.toMatchObject({ id: created.id, email });

    const second = context();
    await expect(accountRouter.createCaller(second.ctx).login({ email, password })).resolves.toMatchObject({ id: created.id });
    const secondCookie = `fiche_client_session=${second.cookies[0].value}`;
    const logout = context(secondCookie);
    await expect(accountRouter.createCaller(logout.ctx).logout()).resolves.toEqual({ success: true });
    expect(logout.cleared).toEqual(["fiche_client_session"]);
    await expect(accountRouter.createCaller(context(secondCookie).ctx).me()).resolves.toBeNull();
  });
});
