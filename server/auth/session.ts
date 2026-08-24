/** Atelier fiscal moderne — sessions de compte signées et révocables, limitées au navigateur connecté. */

import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";

export const ACCOUNT_SESSION_COOKIE = "fiche_client_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14;

function secret() {
  if (!ENV.cookieSecret) throw new Error("La clé de session est indisponible.");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function signAccountSession(accountId: number, sessionId: string) {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(accountId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret());
}

export async function verifyAccountSession(token: string) {
  const { payload } = await jwtVerify(token, secret());
  const accountId = Number(payload.sub);
  const sessionId = typeof payload.sid === "string" ? payload.sid : "";
  if (!Number.isInteger(accountId) || accountId < 1 || !sessionId) throw new Error("Session invalide.");
  return { accountId, sessionId };
}

export function sessionMaxAge() {
  return SESSION_DURATION_SECONDS * 1000;
}
