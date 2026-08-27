export type RcCatalogueEntryInput = { code: string; label: string };
export type RcCatalogueEntry = RcCatalogueEntryInput & { familyCode: string };

export const RC_CATALOGUE_MAX_ENTRIES = 10_000;

export function normalizeRcCatalogueEntries(rawEntries: readonly RcCatalogueEntryInput[]): RcCatalogueEntry[] {
  if (!rawEntries.length) throw new Error("Le fichier Excel ne contient aucune activité RC valide.");
  if (rawEntries.length > RC_CATALOGUE_MAX_ENTRIES) throw new Error("Le fichier Excel contient trop d’activités RC.");
  const unique = new Map<string, RcCatalogueEntry>();
  for (const rawEntry of rawEntries) {
    const code = String(rawEntry.code ?? "").trim();
    const label = String(rawEntry.label ?? "").trim().replace(/\s+/g, " ");
    if (!/^\d{6}$/.test(code)) throw new Error(`Le code RC « ${code || "vide"} » doit comporter six chiffres.`);
    if (label.length < 2 || label.length > 320) throw new Error(`Le libellé de l’activité ${code} est invalide.`);
    if (unique.has(code)) throw new Error(`Le code RC ${code} apparaît plusieurs fois dans le fichier.`);
    unique.set(code, { code, label, familyCode: code.slice(0, 3) });
  }
  return Array.from(unique.values()).sort((left, right) => left.code.localeCompare(right.code));
}

export function rcFamiliesFromEntries(entries: readonly RcCatalogueEntry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) counts.set(entry.familyCode, (counts.get(entry.familyCode) ?? 0) + 1);
  return Array.from(counts.entries()).sort(([left], [right]) => left.localeCompare(right)).map(([code, activityCount]) => ({ code, label: `Catégorie ${code}`, activityCount }));
}
