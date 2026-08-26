import { describe, expect, it } from "vitest";
import { emailComposeLink, normalizeAlgerianWhatsApp } from "./contact-links";

describe("lien WhatsApp algérien", () => {
  it("convertit un numéro local conservé avec un 0 initial", () => {
    expect(normalizeAlgerianWhatsApp("0550 12-34-56")).toBe("213550123456");
  });
  it("préserve le préfixe 213 et retire seulement le signe +", () => {
    expect(normalizeAlgerianWhatsApp("+213 550 12 34 56")).toBe("213550123456");
    expect(normalizeAlgerianWhatsApp("213550123456")).toBe("213550123456");
  });

  it("crée un lien direct de composition pour l’adresse e-mail enregistrée", () => {
    expect(emailComposeLink("  contact@cabinet.dz ")).toBe("mailto:contact@cabinet.dz");
  });
});
