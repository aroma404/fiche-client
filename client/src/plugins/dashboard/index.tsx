/** Atelier fiscal moderne — tableau de bord éditorial qui explique le parcours avant la saisie. */

import { ArrowRight, CheckCircle2, ClipboardList, FileText, Printer, WalletCards } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { useSession } from "@/core/session-store";
import { paymentTotal } from "@/lib/format";

export default function DashboardPlugin() {
  const [, setLocation] = useLocation();
  const { state } = useSession();
  const received = state.documents.filter((item) => item.status === "Reçu").length;
  const complete = state.compliance.filter((item) => item.status === "Terminé").length;

  return (
    <div>
      <PageHeader eyebrow="Poste de pilotage" title="Préparez la fiche avant de la transmettre." description="Travaillez dans une session locale : les données restent dans ce navigateur et disparaissent à la fermeture ou au rechargement." actions={<Button onClick={() => setLocation("/fiche")} className="bg-[#0f766e] shadow-none hover:bg-[#0b625c]">Ouvrir la fiche <ArrowRight size={16} /></Button>} />
      <section className="relative mb-7 min-h-[300px] overflow-hidden rounded-[1.4rem] border border-[#d6e0dd] bg-[#ebeae4] p-7 shadow-[0_16px_45px_rgba(16,42,67,0.07)] sm:p-10">
        <div aria-hidden="true" className="paper-hero-art absolute inset-0 overflow-hidden" />
        <div className="relative max-w-xl"><div className="editorial-rule mb-5" /><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#0f766e]">Atelier temporaire</p><h2 className="mt-3 font-serif text-4xl leading-[0.98] text-[#102a43] sm:text-5xl">Un dossier clair, sans conservation durable.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[#354f60]">Commencez par les informations essentielles, complétez les pièces justificatives, puis vérifiez les paiements avant impression.</p><div className="mt-7 flex flex-wrap gap-2"><Button onClick={() => setLocation("/fiche")} className="bg-[#102a43] hover:bg-[#183a58]">Créer la fiche</Button><Button variant="outline" onClick={() => setLocation("/documents")} className="border-[#bacac4] bg-white/70">Voir les documents</Button></div></div>
      </section>
      <section className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={FileText} label="Documents reçus" value={`${received} / ${state.documents.length}`} tone="teal" />
        <Metric icon={ClipboardList} label="Obligations finalisées" value={`${complete} / ${state.compliance.length}`} tone="ochre" />
        <Metric icon={WalletCards} label="Versements saisis" value={`${state.payments.length}`} tone="navy" />
        <Metric icon={CheckCircle2} label="Total temporaire" value={`${paymentTotal(state.payments).toLocaleString("fr-DZ")} DA`} tone="slate" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Parcours recommandé" hint="Chaque étape est disponible dans la barre latérale."><div className="grid gap-3 sm:grid-cols-2">{[
          ["01", "Préparer la fiche", "Informations générales, fiscales et coordonnées de travail.", "/fiche"],
          ["02", "Vérifier les pièces", "Documents fournis, manquants et observations.", "/documents"],
          ["03", "Suivre les montants", "Versements, encours et synthèse de caisse.", "/paiements"],
          ["04", "Imprimer le dossier", "Aperçu A4 à enregistrer ou imprimer depuis le navigateur.", "/impression"],
        ].map(([number, title, description, route]) => <button key={number} onClick={() => setLocation(route)} className="group rounded-xl border border-[#dbe5e3] bg-[#fbfcfa] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#8ebbb0] hover:bg-white"><span className="text-xs font-extrabold text-[#c99a3e]">{number}</span><h3 className="mt-2 text-sm font-extrabold text-[#102a43]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#647986]">{description}</p></button>)}</div></SectionCard>
        <SectionCard title="À retenir" hint="Ce que fait la session actuelle."><div className="space-y-4"><div className="rounded-xl bg-[#e7f2ee] p-4"><p className="text-xs font-extrabold text-[#0f5d57]">Aucun enregistrement automatique</p><p className="mt-1 text-xs leading-5 text-[#477068]">Aucune donnée n’est écrite dans une base, un cookie ou le stockage local.</p></div><div className="rounded-xl bg-[#fbefcf] p-4"><p className="text-xs font-extrabold text-[#8a5c16]">Données sensibles</p><p className="mt-1 text-xs leading-5 text-[#806b48]">Ne saisissez jamais de mot de passe. Utilisez uniquement l’état « accès vérifié ».</p></div><Button variant="outline" onClick={() => setLocation("/impression")} className="w-full justify-between border-[#d7e0df]">Préparer l’impression <Printer size={15} /></Button></div></SectionCard>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof FileText; label: string; value: string; tone: "teal" | "ochre" | "navy" | "slate" }) {
  const tones = { teal: "bg-[#dff3eb] text-[#0f766e]", ochre: "bg-[#fbefcf] text-[#a66d13]", navy: "bg-[#e8eef4] text-[#102a43]", slate: "bg-[#edf1f0] text-[#536a78]" };
  return <div className="rounded-lg border border-[#d5dfdc] bg-white p-4 shadow-[0_1px_0_rgba(16,42,67,0.03)]"><div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}><Icon size={17} /></div><p className="text-[11px] font-bold text-[#6b7f8c]">{label}</p><p className="mt-1 text-xl font-extrabold tracking-tight text-[#102a43]">{value}</p></div>;
}
