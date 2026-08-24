/** Tests de base de l’authentification e-mail : aucun mot de passe n’est conservé en clair. */

import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./auth/password";

describe("authentification e-mail", () => {
  it("hachage et vérifie un mot de passe sans conserver le texte original", async () => {
    const password = "MotDePasseFort!2026";
    const hash = await hashPassword(password);

    expect(hash).not.toContain(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("MotDePasseIncorrect", hash)).resolves.toBe(false);
  });

  it("produit des hashes distincts pour la même valeur grâce à un sel aléatoire", async () => {
    const first = await hashPassword("MotDePasseFort!2026");
    const second = await hashPassword("MotDePasseFort!2026");

    expect(first).not.toBe(second);
  });
});
