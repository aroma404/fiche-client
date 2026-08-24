/** Tests de contrat des sessions de compte. */

import { describe, expect, it } from "vitest";
import { signAccountSession, verifyAccountSession } from "./auth/session";

describe("session de compte", () => {
  it("porte uniquement l’identifiant de compte et de session attendus", async () => {
    const token = await signAccountSession(42, "session-test-42");
    await expect(verifyAccountSession(token)).resolves.toEqual({ accountId: 42, sessionId: "session-test-42" });
  });
});
