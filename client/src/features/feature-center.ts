import { ArchiveRestore, Download, KeyRound, Landmark, LayoutDashboard, Settings2, Users, type LucideIcon } from "lucide-react";

export type WorkspaceFeature = { href: string; label: string; sectionTitle: string; icon: LucideIcon };

/** Registre statique auditable des modules de l’espace privé. Aucun code externe n’est chargé à l’exécution. */
export const workspaceFeatures: readonly WorkspaceFeature[] = [
  { href: "/dashboard", label: "Tableau de bord", sectionTitle: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Dossiers clients", sectionTitle: "Dossiers clients", icon: Users },
  { href: "/finances", label: "Finances du cabinet", sectionTitle: "Finances du cabinet", icon: Landmark },
  { href: "/transferts", label: "Importer / exporter", sectionTitle: "Importation et exportation", icon: Download },
  { href: "/archives", label: "Archives", sectionTitle: "Archives", icon: ArchiveRestore },
  { href: "/coffre", label: "Coffre de mots de passe", sectionTitle: "Coffre de mots de passe", icon: KeyRound },
  { href: "/reglages", label: "Réglages du programme", sectionTitle: "Réglages du programme", icon: Settings2 },
];

export function workspaceSectionTitle(location: string) {
  return workspaceFeatures.find(feature => location.startsWith(feature.href))?.sectionTitle ?? "Mon compte";
}
