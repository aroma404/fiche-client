import { ArchiveRestore, BookOpenCheck, Download, Landmark, LayoutDashboard, Settings2, Users, type LucideIcon } from "lucide-react";

export type PrivateFeatureDefinition = {
  id: "dashboard" | "clients" | "finances" | "transfers" | "archives" | "commerce" | "settings" | "account";
  href: string;
  label: string;
  sectionTitle: string;
  icon: LucideIcon;
  prewarm: boolean;
  visibleInNavigation: boolean;
};

export type ClientFeatureDefinition = {
  slug: "fiche" | "documents" | "paiements" | "coffre" | "impression";
  label: string;
};

/** Registre central des fonctions principales visibles dans l’espace privé. */
export const privateFeatureRegistry: readonly PrivateFeatureDefinition[] = [
  { id: "dashboard", href: "/dashboard", label: "Tableau de bord", sectionTitle: "Tableau de bord", icon: LayoutDashboard, prewarm: true, visibleInNavigation: true },
  { id: "clients", href: "/clients", label: "Dossiers", sectionTitle: "Dossiers", icon: Users, prewarm: true, visibleInNavigation: true },
  { id: "finances", href: "/finances", label: "Finances du cabinet", sectionTitle: "Finances du cabinet", icon: Landmark, prewarm: true, visibleInNavigation: true },
  { id: "transfers", href: "/transferts", label: "Importer / exporter", sectionTitle: "Importation et exportation", icon: Download, prewarm: true, visibleInNavigation: true },
  { id: "archives", href: "/archives", label: "Archives", sectionTitle: "Archives", icon: ArchiveRestore, prewarm: true, visibleInNavigation: true },
  { id: "commerce", href: "/registre-commerce", label: "Registre de commerce", sectionTitle: "Registre de commerce", icon: BookOpenCheck, prewarm: true, visibleInNavigation: false },
  { id: "settings", href: "/reglages", label: "Réglages du programme", sectionTitle: "Réglages du programme", icon: Settings2, prewarm: true, visibleInNavigation: false },
  { id: "account", href: "/compte", label: "Mon compte", sectionTitle: "Mon compte", icon: Settings2, prewarm: true, visibleInNavigation: false },
] as const;

/** Registre central des sous-fonctions rattachées à chaque dossier client. */
export const clientFeatureRegistry: readonly ClientFeatureDefinition[] = [
  { slug: "fiche", label: "Fiche" },
  { slug: "documents", label: "Documents" },
  { slug: "paiements", label: "Paiements" },
  { slug: "coffre", label: "Accès" },
  { slug: "impression", label: "Impression" },
] as const;

export function getPrivateFeatureForPath(path: string) {
  return privateFeatureRegistry.find(feature => path === feature.href || path.startsWith(`${feature.href}/`));
}
