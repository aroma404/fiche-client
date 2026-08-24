/** Atelier fiscal moderne — caisse unifiée : recettes, dépenses et frais dans une même vue lisible. */

import { Landmark, MinusCircle, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { useSession } from "@/core/session-store";
import { cashTotal, formatDA } from "@/lib/format";
import type { CashEntry } from "@/types/fiche";

export default function CashPlugin() {
  const { state, dispatch } = useSession();
  const recettes = cashTotal(state.cashEntries, "Recette");
  const depenses = cashTotal(state.cashEntries, "Dépense");
  const frais = cashTotal(state.cashEntries, "Frais");
  const solde = recettes - depenses - frais;
  return <div><PageHeader eyebrow="Caisse de travail" title="Recettes, dépenses et frais" description="Cette synthèse remplace les multiples feuilles de caisse et garde les montants dans la session en cours." actions={<div className="flex flex-wrap gap-2"><Button onClick={() => dispatch({ type: "CASH_ADD", entryType: "Recette" })} className="bg-[#0f766e] hover:bg-[#0b625c]"><Plus size={16} /> Recette</Button><Button onClick={() => dispatch({ type: "CASH_ADD", entryType: "Dépense" })} variant="outline" className="border-[#d7e0df]"><MinusCircle size={16} /> Dépense</Button></div>} />
    <section className="mb-6 grid gap-3 md:grid-cols-4"><CashMetric label="Recettes" value={formatDA(recettes)} icon={TrendingUp} tone="teal" /><CashMetric label="Dépenses" value={formatDA(depenses)} icon={TrendingDown} tone="ochre" /><CashMetric label="Frais" value={formatDA(frais)} icon={Landmark} tone="slate" /><CashMetric label="Solde de caisse" value={formatDA(solde)} icon={Landmark} tone="navy" /></section>
    <SectionCard title="Mouvements de caisse" hint="Ajoutez les recettes, dépenses ou frais associés au suivi de la session."><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-[#d7e0df] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#647987]"><th className="p-3">Date</th><th className="p-3">Libellé</th><th className="p-3">Type</th><th className="p-3">Montant (DA)</th><th className="p-3"><span className="sr-only">Supprimer</span></th></tr></thead><tbody>{state.cashEntries.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-sm text-[#647987]">Aucun mouvement de caisse. Ajoutez une recette ou une dépense si nécessaire.</td></tr> : state.cashEntries.map((entry) => <tr key={entry.id} className="border-b border-[#edf1f0] last:border-0"><td className="p-3"><input type="date" value={entry.date} onChange={(event) => dispatch({ type: "CASH", id: entry.id, patch: { date: event.target.value } })} className="h-9 rounded-lg border border-[#d7e0df] bg-[#fbfcfa] px-2 text-xs" /></td><td className="p-3"><input value={entry.libelle} onChange={(event) => dispatch({ type: "CASH", id: entry.id, patch: { libelle: event.target.value } })} placeholder="Libellé de travail" className="h-9 w-full rounded-lg border border-[#d7e0df] bg-[#fbfcfa] px-3 text-xs" /></td><td className="p-3"><select value={entry.type} onChange={(event) => dispatch({ type: "CASH", id: entry.id, patch: { type: event.target.value as CashEntry["type"] } })} className="h-9 rounded-lg border border-[#d7e0df] bg-[#fbfcfa] px-2 text-xs font-bold"><option>Recette</option><option>Dépense</option><option>Frais</option></select></td><td className="p-3"><input type="number" min="0" value={entry.montant || ""} onChange={(event) => dispatch({ type: "CASH", id: entry.id, patch: { montant: Number(event.target.value) } })} placeholder="0,00" className="h-9 w-32 rounded-lg border border-[#d7e0df] bg-[#fbfcfa] px-3 text-xs" /></td><td className="p-3"><button onClick={() => dispatch({ type: "CASH_DELETE", id: entry.id })} className="rounded-lg p-2 text-[#b42318] hover:bg-[#fff0ee]" aria-label="Supprimer ce mouvement"><MinusCircle size={15} /></button></td></tr>)}</tbody></table></div></SectionCard>
  </div>;
}

function CashMetric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Landmark; tone: "teal" | "ochre" | "slate" | "navy" }) {
  const tones = { teal: "bg-[#e6f2ee] text-[#0f5d57]", ochre: "bg-[#fff3d8] text-[#9a6813]", slate: "bg-[#edf1f0] text-[#536a78]", navy: "bg-[#102a43] text-white" };
  return <div className={`rounded-[1.1rem] p-4 ${tones[tone]}`}><Icon size={17} className="mb-5 opacity-80" /><p className="text-xs font-bold opacity-75">{label}</p><p className="mt-1 text-xl font-extrabold tracking-tight">{value}</p></div>;
}
