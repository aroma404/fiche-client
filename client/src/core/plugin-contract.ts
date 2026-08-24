/** Atelier fiscal moderne — contrat extensible de chaque fonctionnalité du système. */

import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export interface FeaturePlugin {
  id: string;
  label: string;
  description: string;
  route: string;
  order: number;
  icon: LucideIcon;
  component: ComponentType;
}
