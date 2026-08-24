/** Atelier fiscal moderne — aperçu A4 imprimable depuis le navigateur, sans génération ni envoi de fichier. */

import { Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { useSession } from "@/core/session-store";
import { formatDA, paymentTotal } from "@/lib/format";

export default function PrintPlugin() {
  const { state } = useSession();
  const total = paymentTotal(state.payments);
  const received = state.documents.filter((item) => item.status === "Reçu");
  return <div><div className="no-print"><PageHeader eyebrow="Sortie du dossier" title="Prévisualisation et impression A4" description="Le navigateur peut imprimer ce rendu ou l’enregistrer en PDF. Aucune copie n’est envoyée à un serveur." actions={<Button onClick={() => window.print()} className="bg-[#102a43] hover:bg-[#183a58]"><Printer size={16} /> Imprimer la fiche</Button>} /></div>
    <article className="print-area mx-auto max-w-[880px] rounded-[1.25rem] border border-[#cbd8d5] bg-white p-7 shadow-[0_18px_52px_rgba(16,42,67,0.08)] sm:p-10"><div className="flex items-start justify-between border-b-2 border-[#0f766e] pb-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#0f766e]">Fiche Client Impôt</p><h1 className="mt-2 font-serif text-4xl text-[#102a43]">Fiche de suivi</h1><p className="mt-2 text-xs text-[#647987]">Document de travail temporaire — données non enregistrées.</p></div><div className="text-right text-xs text-[#647987]"><p>État : {state.general.statut}</p><p className="mt-1">Régime : {state.fiscal.regime}</p></div></div>
      <PrintSection title="Informations générales"><PrintGrid values={[["Raison sociale / Nom", state.general.raisonSociale], ["Activité", state.general.activite], ["Forme juridique", state.general.formeJuridique], ["Type de client", state.general.typeClient], ["Commune", state.general.commune], ["Contact", state.general.contact]]} /></PrintSection>
      <PrintSection title="Informations fiscales et juridiques"><PrintGrid values={[["NIF", state.fiscal.nif], ["N° RC", state.fiscal.rc], ["BP", state.fiscal.bp], ["Article d’imposition", state.fiscal.articleImposition], ["NIN", state.fiscal.nin], ["Régime", state.fiscal.regime]]} /></PrintSection>
      <PrintSection title="Documents reçus"><div className="grid gap-2 sm:grid-cols-2">{received.length ? received.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#f3f7f5] px-3 py-2 text-xs"><span className="font-bold text-[#102a43]">{item.label}</span><span className="text-[#0f766e]">Reçu</span></div>) : <p className="text-xs text-[#647987]">Aucun document marqué comme reçu.</p>}</div></PrintSection>
      <PrintSection title="Paiements"><div className="flex items-center justify-between rounded-xl bg-[#f3f7f5] p-4"><div><p className="text-xs font-bold text-[#647987]">Versements saisis</p><p className="mt-1 text-2xl font-extrabold text-[#102a43]">{formatDA(total)}</p></div><div className="text-right text-xs text-[#647987]"><p>Solde initial : {formatDA(state.soldeInitial)}</p><p className="mt-1 font-bold text-[#0f766e]">Solde final : {formatDA(state.soldeInitial - total)}</p></div></div></PrintSection>
      <PrintSection title="Observations"><p className="min-h-16 whitespace-pre-line text-sm leading-6 text-[#425b69]">{state.observations || "Aucune observation renseignée."}</p></PrintSection>
      <div className="mt-10 flex justify-between border-t border-[#d7e0df] pt-5 text-[11px] text-[#647987]"><span>Fiche temporaire — à vérifier avant transmission.</span><span>Signature / cachet</span></div></article>
    <div className="no-print mt-5 flex justify-center"><Button variant="outline" onClick={() => window.print()} className="border-[#d7e0df]"><Save size={16} /> Enregistrer en PDF via l’impression</Button></div>
  </div>;
}

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-7"><h2 className="mb-3 border-l-[3px] border-[#c99a3e] pl-3 text-xs font-extrabold uppercase tracking-[0.1em] text-[#102a43]">{title}</h2>{children}</section>; }
function PrintGrid({ values }: { values: [string, string][] }) { return <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{values.map(([label, value]) => <div key={label} className="border-b border-[#e2e9e7] pb-2"><p className="text-[10px] font-extrabold uppercase tracking-[0.07em] text-[#70828c]">{label}</p><p className="mt-1 text-sm font-bold text-[#102a43]">{value || "—"}</p></div>)}</div>; }
