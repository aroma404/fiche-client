/** Atelier fiscal moderne — registre de versements temporaire et calcul de solde explicite. */

import { Plus, Trash2, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { useSession } from "@/core/session-store";
import { formatDA, paymentTotal } from "@/lib/format";

export default function PaymentsPlugin() {
  const { state, dispatch } = useSession();
  const total = paymentTotal(state.payments);
  const soldeFinal = state.soldeInitial - total;
  return <div><PageHeader eyebrow="Suivi financier" title="Versements et solde de travail" description="Ajoutez les versements utiles au dossier. Les calculs restent visibles et ne sont pas enregistrés après la session." actions={<Button onClick={() => dispatch({ type: "PAYMENT_ADD" })} className="bg-[#0f766e] hover:bg-[#0b625c]"><Plus size={16} /> Ajouter un versement</Button>} />
    <section className="mb-6 grid gap-3 md:grid-cols-3"><Summary label="Solde initial" value={formatDA(state.soldeInitial)} tone="navy" /><Summary label="Versements saisis" value={formatDA(total)} tone="teal" /><Summary label="Solde final" value={formatDA(soldeFinal)} tone={soldeFinal > 0 ? "ochre" : "slate"} /></section>
    <SectionCard title="Registre des versements" hint="Indiquez la date, l’objet, la référence et le montant de chaque règlement."><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead><tr className="border-b border-[#d7e0df] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#647987]"><th className="p-3">Date</th><th className="p-3">Objet</th><th className="p-3">Référence</th><th className="p-3">Montant (DA)</th><th className="p-3"><span className="sr-only">Supprimer</span></th></tr></thead><tbody>{state.payments.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-sm text-[#647987]">Aucun versement saisi. Ajoutez un règlement lorsque nécessaire.</td></tr> : state.payments.map((payment) => <tr key={payment.id} className="border-b border-[#edf1f0] last:border-0"><td className="p-3"><input type="date" value={payment.date} onChange={(event) => dispatch({ type: "PAYMENT", id: payment.id, patch: { date: event.target.value } })} className="h-9 rounded-lg border border-[#d7e0df] bg-[#fbfcfa] px-2 text-xs" /></td><td className="p-3"><input value={payment.objet} onChange={(event) => dispatch({ type: "PAYMENT", id: payment.id, patch: { objet: event.target.value } })} placeholder="Ex. acompte" className="h-9 w-full rounded-lg border border-[#d7e0df] bg-[#fbfcfa] px-3 text-xs" /></td><td className="p-3"><input value={payment.reference} onChange={(event) => dispatch({ type: "PAYMENT", id: payment.id, patch: { reference: event.target.value } })} placeholder="Référence" className="h-9 w-full rounded-lg border border-[#d7e0df] bg-[#fbfcfa] px-3 text-xs" /></td><td className="p-3"><input type="number" min="0" value={payment.montant || ""} onChange={(event) => dispatch({ type: "PAYMENT", id: payment.id, patch: { montant: Number(event.target.value) } })} placeholder="0,00" className="h-9 w-32 rounded-lg border border-[#d7e0df] bg-[#fbfcfa] px-3 text-xs" /></td><td className="p-3"><button onClick={() => dispatch({ type: "PAYMENT_DELETE", id: payment.id })} className="rounded-lg p-2 text-[#b42318] hover:bg-[#fff0ee]" aria-label="Supprimer ce versement"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div></SectionCard>
    <div className="mt-6 max-w-sm"><label className="grid gap-2"><span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#526775]">Solde initial (DA)</span><input type="number" min="0" value={state.soldeInitial || ""} onChange={(event) => dispatch({ type: "SOLDE_INITIAL", value: Number(event.target.value) })} className="h-10 rounded-md border border-[#d7e0df] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#0f766e]" /></label></div>
  </div>;
}

function Summary({ label, value, tone }: { label: string; value: string; tone: "navy" | "teal" | "ochre" | "slate" }) {
  const tones = { navy: "bg-[#102a43] text-white", teal: "bg-[#0f766e] text-white", ochre: "bg-[#c99a3e] text-white", slate: "bg-[#e9efed] text-[#102a43]" };
  return <div className={`rounded-[1.1rem] p-5 ${tones[tone]}`}><div className="mb-5 flex items-center justify-between"><p className="text-xs font-bold opacity-75">{label}</p><WalletCards size={17} className="opacity-80" /></div><p className="text-2xl font-extrabold tracking-tight">{value}</p></div>;
}
