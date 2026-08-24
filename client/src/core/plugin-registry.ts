/** Atelier fiscal moderne — registre unique : ajouter ou retirer un plugin ici modifie le système sans couplage. */

import { BookOpenCheck, ClipboardCheck, FileText, LayoutDashboard, Landmark, Printer, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import type { FeaturePlugin } from "./plugin-contract";
import DashboardPlugin from "@/plugins/dashboard";
import FichePlugin from "@/plugins/client-fiche";
import DocumentsPlugin from "@/plugins/documents";
import CompliancePlugin from "@/plugins/conformite-sociale";
import CasesPlugin from "@/plugins/dossiers";
import PaymentsPlugin from "@/plugins/paiements";
import CashPlugin from "@/plugins/caisse";
import PrintPlugin from "@/plugins/impression";
import PrivacyPlugin from "@/plugins/confidentialite";

export const plugins: FeaturePlugin[] = [
  { id: "dashboard", label: "Accueil", description: "Parcours et aperçu", route: "/", order: 1, icon: LayoutDashboard, component: DashboardPlugin },
  { id: "fiche", label: "Fiche client", description: "Informations du dossier", route: "/fiche", order: 2, icon: FileText, component: FichePlugin },
  { id: "documents", label: "Documents", description: "Pièces et justificatifs", route: "/documents", order: 3, icon: ClipboardCheck, component: DocumentsPlugin },
  { id: "conformite", label: "Conformité", description: "CNAS, CASNOS, CACOBATPH", route: "/conformite", order: 4, icon: ShieldCheck, component: CompliancePlugin },
  { id: "dossiers", label: "Dossiers", description: "CDI, CPI et suivi", route: "/dossiers", order: 5, icon: BookOpenCheck, component: CasesPlugin },
  { id: "paiements", label: "Paiements", description: "Versements et solde", route: "/paiements", order: 6, icon: WalletCards, component: PaymentsPlugin },
  { id: "caisse", label: "Caisse", description: "Recettes et dépenses", route: "/caisse", order: 7, icon: Landmark, component: CashPlugin },
  { id: "impression", label: "Impression", description: "Fiche A4", route: "/impression", order: 8, icon: Printer, component: PrintPlugin },
  { id: "confidentialite", label: "Confidentialité", description: "Session et effacement", route: "/confidentialite", order: 9, icon: ReceiptText, component: PrivacyPlugin },
].sort((a, b) => a.order - b.order);
