import { ArchiveRestore, Download, Landmark, LayoutDashboard, Settings2, Users, type LucideIcon } from "lucide-react";

import { getPrivateFeatureForPath, privateFeatureRegistry } from "@/core/registry-index";

export type WorkspaceFeature = typeof privateFeatureRegistry[number];

/** Projection de navigation du registre central des fonctionnalités privées. */
export const workspaceFeatures = privateFeatureRegistry.filter(feature => feature.visibleInNavigation);

export function workspaceSectionTitle(location: string) {
  return getPrivateFeatureForPath(location)?.sectionTitle ?? "Mon compte";
}
