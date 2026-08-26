export const vaultCategories = ["Fiscal", "Bancaire", "Administration", "Réseaux sociaux", "Autre"] as const;
export type VaultCategory = string;
export type VaultSearchEntry = { category: string | null; platformName: string; email: string | null; phone: string | null; username: string | null };

export function filterVaultEntries<T extends VaultSearchEntry>(entries: T[], search: string, category: "Toutes" | VaultCategory) {
  const normalized = search.trim().toLocaleLowerCase("fr-FR");
  return entries.filter(entry => (category === "Toutes" || entry.category === category) && (!normalized || [entry.category, entry.platformName, entry.email, entry.phone, entry.username].some(value => (value ?? "").toLocaleLowerCase("fr-FR").includes(normalized))));
}
