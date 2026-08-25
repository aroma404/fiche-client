/** Tests de contrat des sessions de compte. */

import { describe, expect, it } from "vitest";
import { sessionDurationSeconds, signAccountSession, verifyAccountSession } from "./auth/session";

describe("session de compte", () => {
  it("porte uniquement l’identifiant de compte et de session attendus", async () => {
    const token = await signAccountSession(42, "session-test-42", false);
    await expect(verifyAccountSession(token)).resolves.toEqual({ accountId: 42, sessionId: "session-test-42" });
  });

  it("limite une session non mémorisée à cinq minutes et allonge uniquement la session mémorisée", () => {
    expect(sessionDurationSeconds(false)).toBe(60 * 5);
    expect(sessionDurationSeconds(true)).toBe(60 * 60 * 24 * 14);
  });
});
