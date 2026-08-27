import { WorkspaceLayout } from "@/components/workspace-layout";
import { RcCatalogueManager } from "@/features/program-settings/rc-catalogue-manager";

/** Page directe du catalogue RC, séparée des réglages des listes générales. */
export function RegistreCommercePage() {
  return <WorkspaceLayout><RcCatalogueManager /></WorkspaceLayout>;
}
