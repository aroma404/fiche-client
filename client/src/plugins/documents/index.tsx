/** Atelier fiscal moderne — checklist de justificatifs avec états explicites et observations courtes. */

import { ClipboardCheck, FileWarning } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { useSession } from "@/core/session-store";
import type { Status } from "@/types/fiche";

const statuses: Status[] = ["À demander", "Reçu", "À vérifier", "Non requis"];

export default function DocumentsPlugin() {
  const { state, dispatch } = useSession();
  const ready = state.documents.filter((document) => document.status === "Reçu").length;
  return <div>
    <PageHeader eyebrow="Pièces justificatives" title="Documents fournis et manquants" description="Renseignez le statut de chaque pièce sans joindre ni conserver de fichier dans l’application." actions={<div className="rounded-full bg-[#e6f2ee] px-3 py-2 text-xs font-bold text-[#0f5d57]">{ready} document{ready > 1 ? "s" : ""} reçu{ready > 1 ? "s" : ""}</div>} />
    <SectionCard title="Checklist documentaire" hint="Une pièce peut être reçue, à vérifier, non requise ou à demander."><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b-2 border-[#cfdad7] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#647987]"><th className="px-3 py-2.5">Document</th><th className="px-3 py-2.5">Catégorie</th><th className="px-3 py-2.5">Statut</th><th className="px-3 py-2.5">Observation</th></tr></thead><tbody>{state.documents.map((document) => <tr key={document.id} className="border-b border-[#e7edeb] last:border-0"><td className="px-3 py-2.5 text-sm font-bold text-[#102a43]">{document.label}</td><td className="px-3 py-2.5 text-xs text-[#627785]">{document.category}</td><td className="px-3 py-2.5"><select aria-label={`Statut ${document.label}`} value={document.status} onChange={(event) => dispatch({ type: "DOCUMENT", id: document.id, patch: { status: event.target.value as Status } })} className="rounded-md border border-[#d7e0df] bg-[#fbfcfa] px-2 py-1.5 text-xs font-bold text-[#102a43]">{statuses.map((status) => <option key={status}>{status}</option>)}</select></td><td className="px-3 py-2.5"><input aria-label={`Observation ${document.label}`} value={document.note} onChange={(event) => dispatch({ type: "DOCUMENT", id: document.id, patch: { note: event.target.value } })} placeholder="Précision courte" className="h-8 w-full min-w-[180px] rounded-md border border-[#d7e0df] bg-[#fbfcfa] px-3 text-xs outline-none focus:ring-2 focus:ring-[#0f766e]" /></td></tr>)}</tbody></table></div></SectionCard>
    <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-[#d5e8e1] bg-[#eaf6f1] p-4"><div className="flex items-center gap-2 text-[#0f766e]"><ClipboardCheck size={17} /><p className="text-sm font-extrabold">Règle de vérification</p></div><p className="mt-2 text-xs leading-5 text-[#4f756c]">Un statut « Reçu » doit être vérifié avant impression si la pièce conditionne le dossier.</p></div><div className="rounded-xl border border-[#eadcb7] bg-[#fff8e9] p-4"><div className="flex items-center gap-2 text-[#9a6916]"><FileWarning size={17} /><p className="text-sm font-extrabold">Aucune pièce jointe ici</p></div><p className="mt-2 text-xs leading-5 text-[#79683f]">Cette application suit l’état des documents, mais ne les téléverse pas et ne les stocke pas.</p></div></div>
  </div>;
}
