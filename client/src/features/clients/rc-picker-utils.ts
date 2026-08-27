export type RcPickerEntry = { code: string; label: string };

export function filterRcPickerEntries<T extends RcPickerEntry>(entries: readonly T[], query: string, limit: number) {
  const normalizedQuery = query.trim().toLocaleLowerCase("fr");
  const matches = normalizedQuery ? entries.filter(entry => `${entry.code} ${entry.label}`.toLocaleLowerCase("fr").includes(normalizedQuery)) : entries;
  return matches.slice(0, limit);
}

export function chooseRcListboxSide({ anchorTop, anchorBottom, viewportHeight, desiredHeight }: { anchorTop: number; anchorBottom: number; viewportHeight: number; desiredHeight: number }) {
  const spaceBelow = viewportHeight - anchorBottom;
  const spaceAbove = anchorTop;
  return spaceBelow < Math.min(desiredHeight, 240) && spaceAbove > spaceBelow ? "top" as const : "bottom" as const;
}
