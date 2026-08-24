/** Atelier fiscal moderne — obligations CNAS, CASNOS et CACOBATPH dans une vue de suivi concise. */

import { CalendarDays, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { useSession } from "@/core/session-store";
import type { ComplianceStatus } from "@/types/fiche";

const statuses: ComplianceStatus[] = ["À préparer", "En cours", "Terminé"];

export default function CompliancePlugin() {
  const { state, dispatch } = useSession();
  const finished = state.compliance.filter((item) => item.status === "Terminé").length;
  return <div><PageHeader eyebrow="Obligations déclaratives" title="Conformité sociale et déclarations" description="Planifiez les déclarations et contrôlez leur avancement. Les dates restent temporaires dans cette session." actions={<div className="rounded-full bg-[#e6f2ee] px-3 py-2 text-xs font-bold text-[#0f5d57]">{finished} obligation{finished > 1 ? "s" : ""} finalisée{finished > 1 ? "s" : ""}</div>} />
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><SectionCard title="Calendrier de conformité" hint="Sélectionnez un état et, si utile, une échéance de travail."><div className="space-y-3">{state.compliance.map((item) => <div key={item.id} className="grid gap-3 rounded-xl border border-[#dbe5e3] bg-[#fbfcfa] p-4 md:grid-cols-[1.2fr_0.75fr_0.75fr]"><div><p className="text-sm font-extrabold text-[#102a43]">{item.label}</p><p className="mt-1 text-xs text-[#647987]">Organisme : {item.organisme}</p></div><select value={item.status} onChange={(event) => dispatch({ type: "COMPLIANCE", id: item.id, patch: { status: event.target.value as ComplianceStatus } })} className="rounded-lg border border-[#d7e0df] bg-white px-3 text-xs font-bold text-[#102a43]">{statuses.map((status) => <option key={status}>{status}</option>)}</select><div className="flex items-center gap-2"><input type="date" value={item.echeance} onChange={(event) => dispatch({ type: "COMPLIANCE", id: item.id, patch: { echeance: event.target.value } })} className="h-9 w-full rounded-lg border border-[#d7e0df] bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-[#0f766e]" /><StatusPill label={item.status} /></div></div>)}</div></SectionCard>
      <SectionCard title="Méthode de travail" hint="Une conformité claire avant transmission."><div className="space-y-5"><Step icon={CalendarDays} title="Préparer" text="Ajoutez une échéance seulement si elle est connue et vérifiée." /><Step icon={ShieldCheck} title="Vérifier" text="Utilisez « Terminé » une fois la déclaration contrôlée, pas uniquement commencée." /><div className="rounded-xl bg-[#102a43] p-4 text-[#dce9ef]"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#9bd4c7]">Rappel</p><p className="mt-2 text-sm leading-6">Les statuts sont des repères de session : ils ne remplacent pas la validation réglementaire de votre équipe.</p></div></div></SectionCard></div>
  </div>;
}

function Step({ icon: Icon, title, text }: { icon: typeof CalendarDays; title: string; text: string }) { return <div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f2ee] text-[#0f766e]"><Icon size={17} /></div><div><p className="text-sm font-extrabold text-[#102a43]">{title}</p><p className="mt-1 text-xs leading-5 text-[#647987]">{text}</p></div></div>; }
