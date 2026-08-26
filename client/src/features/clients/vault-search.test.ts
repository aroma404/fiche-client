import { describe, expect, it } from "vitest";
import { filterVaultEntries } from "./vault-search";

const entries = [
  { category: "Fiscal", platformName: "Impôts", email: "fiscal@client.dz", phone: "", username: "nif-client" },
  { category: "Bancaire", platformName: "Banque", email: "", phone: "0550123456", username: "compte-client" },
  { category: "Autre", platformName: "Portail fournisseur", email: "service@fournisseur.dz", phone: "", username: "" },
];

describe("recherche des accès client", () => {
  it("filtre les accès par catégorie", () => {
    expect(filterVaultEntries(entries, "", "Fiscal").map(entry => entry.platformName)).toEqual(["Impôts"]);
  });
  it("recherche dans la plateforme, le courriel et le nom d’utilisateur", () => {
    expect(filterVaultEntries(entries, "fournisseur", "Toutes").map(entry => entry.platformName)).toEqual(["Portail fournisseur"]);
    expect(filterVaultEntries(entries, "compte-client", "Toutes").map(entry => entry.platformName)).toEqual(["Banque"]);
  });
});
