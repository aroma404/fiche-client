/** Atelier fiscal moderne — résolution de l’utilisateur connecté pour protéger chaque requête métier. */

import { and, eq, gt, isNull } from "drizzle-orm";
import { parse } from "cookie";
import type { Request } from "express";
import { accounts, accountSessions } from "../drizzle/schema";
import { getDb } from "./db";
import { ACCOUNT_SESSION_COOKIE, verifyAccountSession } from "./auth/session";

export async function getCurrentAccount(req: Request) {
  const token = parse(req.headers.cookie ?? "")[ACCOUNT_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { accountId, sessionId } = await verifyAccountSession(token);
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select({ account: accounts, session: accountSessions })
      .from(accountSessions)
      .innerJoin(accounts, eq(accounts.id, accountSessions.accountId))
      .where(and(eq(accountSessions.id, sessionId), eq(accountSessions.accountId, accountId), isNull(accountSessions.revokedAt), gt(accountSessions.expiresAt, new Date())))
      .limit(1);
    return rows[0]?.account ?? null;
  } catch {
    return null;
  }
}

export async function requireCurrentAccount(req: Request) {
  const account = await getCurrentAccount(req);
  if (!account) throw new Error("AUTH_REQUIRED");
  return account;
}
