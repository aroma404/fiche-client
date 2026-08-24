/** Atelier fiscal moderne — dossiers CDI, CPI et CASNOS modulaires, sans séries de feuilles vides. */

import { FolderPlus, NotebookTabs } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { useSession } from "@/core/session-store";
import type { ComplianceStatus, WorkCase } from "@/types/fiche";

const statuses: ComplianceStatus[] = ["À préparer", "En cours", "Terminé"];

export default function CasesPlugin() {
  const { state, dispatch } = useSession();
  const addCase = () => dispatch({ type: "CASE_ADD" });
  const cases = state.cases;
  return <div><PageHeader eyebrow="Dossiers de travail" title="CDI, CPI et suivi spécifique" description="Les anciens dossiers numérotés deviennent des dossiers temporaires : ajoutez uniquement ceux utiles à la session." actions={<Button onClick={addCase} className="bg-[#0f766e] hover:bg-[#0b625c]"><FolderPlus size={16} /> Ajouter un dossier</Button>} />
    <SectionCard title="Dossiers actifs" hint="Modifiez le libellé, le type, l’état et une note courte."><div className="grid gap-4 lg:grid-cols-3">{cases.map((item) => <article key={item.id} className="rounded-xl border border-[#dbe5e3] bg-[#fbfcfa] p-4"><div className="flex items-start justify-between gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e6f2ee] text-[#0f766e]"><NotebookTabs size={17} /></div><StatusPill label={item.status} /></div><input value={item.label} onChange={(event) => dispatch({ type: "CASE", id: item.id, patch: { label: event.target.value } })} className="mt-4 w-full border-0 bg-transparent p-0 text-sm font-extrabold text-[#102a43] outline-none" /><div className="mt-3 grid grid-cols-2 gap-2"><select value={item.type} onChange={(event) => dispatch({ type: "CASE", id: item.id, patch: { type: event.target.value as WorkCase["type"] } })} className="h-9 rounded-lg border border-[#d7e0df] bg-white px-2 text-xs font-bold"><option>CDI</option><option>CPI</option><option>CASNOS</option><option>Autre</option></select><select value={item.status} onChange={(event) => dispatch({ type: "CASE", id: item.id, patch: { status: event.target.value as ComplianceStatus } })} className="h-9 rounded-lg border border-[#d7e0df] bg-white px-2 text-xs font-bold">{statuses.map((status) => <option key={status}>{status}</option>)}</select></div><textarea value={item.note} onChange={(event) => dispatch({ type: "CASE", id: item.id, patch: { note: event.target.value } })} placeholder="Observation de travail" className="mt-3 min-h-20 w-full resize-none rounded-lg border border-[#d7e0df] bg-white p-3 text-xs outline-none focus:ring-2 focus:ring-[#0f766e]" /></article>)}</div></SectionCard>
  </div>;
}
