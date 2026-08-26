import { describe, expect, it } from "vitest";
import { decryptVaultPassword, encryptVaultPassword } from "./password-vault-crypto";

describe("coffre de mots de passe", () => {
  it("chiffre et déchiffre un mot de passe uniquement pour son compte", () => {
    const sealed = encryptVaultPassword(41, "Accès-Sensible-2026!");
    expect(sealed.encryptedPassword).not.toContain("Accès-Sensible-2026!");
    expect(decryptVaultPassword(41, sealed)).toBe("Accès-Sensible-2026!");
    expect(() => decryptVaultPassword(42, sealed)).toThrow();
  });
});
