/** Vue client : même système visuel que Finances du cabinet, limité aux opérations de ce dossier. */

import { WorkspaceLayout } from "@/components/workspace-layout";
import { formatDA, normalizeBundle, paymentTotal, type ClientDraft } from "@/lib/client-data";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Check, Landmark, Save, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

const clientTabs = [
  { slug: "fiche", label: "Fiche" },
  { slug: "documents", label: "Documents" },
  { slug: "conformite", label: "Conformité" },
  { slug: "paiements", label: "Paiements" },
  { slug: "impression", label: "Impression" },
];

export function ClientPaymentsPage({ clientId }: { clientId: number }) {
  const query = trpc.clients.get.useQuery({ clientId });
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<ClientDraft | null>(null);
  useEffect(() => { if (query.data) setDraft(normalizeBundle(query.data)); }, [query.data]);
  const save = trpc.clients.saveBundle.useMutation({ onSuccess: () => void utils.clients.get.invalidate({ clientId }) });
  const entries = useMemo(() => (draft?.financeEntries ?? []).slice().sort((a, b) => b.entryDate.localeCompare(a.entryDate)), [draft]);

  if (!draft) return <WorkspaceLayout><div className="h-64 rounded-2xl border border-[#d5dfdc] bg-white/75" aria-busy="true" /></WorkspaceLayout>;
  const incoming = entries.filter(entry => entry.direction === "Entrée").reduce((sum, entry) => sum + entry.amount, 0);
  const outgoing = entries.filter(entry => entry.direction === "Sortie").reduce((sum, entry) => sum + entry.amount, 0);
  const paid = paymentTotal(draft);
  const finalBalance = draft.client.initialBalance - paid;

  return <WorkspaceLayout>
    <div className="mb-7">
      <Link href="/clients" className="inline-flex items-center gap-2 text-sm font-bold text-[#0f766e]"><ArrowLeft size={16} /> Dossiers clients</Link>
      <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">Registre client rattaché au cabinet</p><h1 className="mt-2 font-serif text-4xl text-[#102a43]">Paiements et observations</h1><p className="mt-2 text-sm text-[#627785]">Même registre financier que le cabinet, filtré exclusivement sur ce client.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/finances" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cfdad7] bg-white px-4 text-sm font-bold text-[#102a43]"><Landmark size={16} /> Gérer au cabinet</Link><button disabled={save.isPending} onClick={() => save.mutate({ clientId, data: draft })} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white disabled:opacity-60"><Save size={16} />{save.isPending ? "Enregistrement…" : "Enregistrer"}</button></div>
      </div>
      <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-[#d7e0df]">
        {clientTabs.map(tab => <Link key={tab.slug} href={`/clients/${clientId}/${tab.slug}`} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold ${tab.slug === "paiements" ? "border-[#0f766e] text-[#0f766e]" : "border-transparent text-[#627785] hover:text-[#102a43]"}`}>{tab.label}</Link>)}
      </nav>
    </div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="order-2 rounded-2xl border border-[#d5dfdc] bg-white p-5 lg:order-1">
        <div className="grid gap-3 sm:grid-cols-3"><Metric icon={ArrowDownRight} label="Encaissements client" value={formatDA(incoming)} tone="teal" /><Metric icon={ArrowUpRight} label="Décaissements client" value={formatDA(outgoing)} tone="gold" /><Metric icon={WalletCards} label="Solde estimé" value={formatDA(finalBalance)} tone="navy" /></div>
        <div className="mt-7 overflow-x-auto rounded-xl border border-[#d5dfdc]"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#f7faf8] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#627785]"><tr>{["Date", "Nature", "Libellé", "Référence", "Sens", "Montant"].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{entries.length ? entries.map(entry => <tr key={`${entry.id ?? entry.label}-${entry.entryDate}`} className="border-t border-[#edf1f0]"><td className="px-4 py-3 text-[#627785]">{entry.entryDate}</td><td className="px-4 py-3"><span className="rounded-full bg-[#edf4f1] px-2 py-1 text-xs font-bold text-[#0f766e]">{entry.category}</span></td><td className="px-4 py-3 font-bold">{entry.label}</td><td className="px-4 py-3 text-[#627785]">{entry.reference || "—"}</td><td className={`px-4 py-3 font-bold ${entry.direction === "Entrée" ? "text-[#0f766e]" : "text-[#a1433d]"}`}>{entry.direction}</td><td className="px-4 py-3 font-extrabold">{formatDA(entry.amount)}</td></tr>) : <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[#627785]">Aucune opération liée à ce client.</td></tr>}</tbody></table></div>
      </section>
      <aside className="order-1 rounded-2xl border border-[#c8ddd5] bg-[#edf7f3] p-5 lg:order-2"><div className="flex items-start gap-3"><span className="rounded-xl bg-white p-2.5 text-[#0f766e]"><Landmark size={20} /></span><div><h2 className="font-serif text-2xl text-[#102a43]">Suivi du paiement</h2><p className="mt-1 text-sm leading-5 text-[#627785]">Les opérations sont ajoutées depuis le registre du cabinet. Gardez ici les observations du client.</p></div></div><div className="mt-6 rounded-xl border border-[#c7d8d3] bg-white p-4"><p className="text-xs font-bold text-[#627785]">Solde initial du dossier</p><p className="mt-1 text-2xl font-extrabold text-[#102a43]">{formatDA(draft.client.initialBalance)}</p><p className="mt-4 text-xs font-bold text-[#627785]">Paiements nets</p><p className="mt-1 text-xl font-extrabold text-[#0f766e]">{formatDA(paid)}</p></div><label className="mt-5 block text-sm font-bold text-[#30505d]">Observations financières<textarea value={draft.client.observations} onChange={event => setDraft({ ...draft, client: { ...draft.client, observations: event.target.value } })} className="mt-2 min-h-32 w-full rounded-lg border border-[#c7d8d3] bg-white p-3 font-normal outline-none focus:border-[#0f766e]" placeholder="Notes utiles au suivi du paiement…" /></label></aside>
    </div>
    {save.isSuccess ? <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#0f766e]"><Check size={16} /> Observations enregistrées.</p> : null}
  </WorkspaceLayout>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Landmark; label: string; value: string; tone: "teal" | "gold" | "navy" }) { const classes = { teal: "bg-[#e8f4ef] text-[#0f766e]", gold: "bg-[#fff7df] text-[#795b1d]", navy: "bg-[#102a43] text-white" }; return <div className={`rounded-xl p-4 ${classes[tone]}`}><Icon size={18} /><p className="mt-4 text-xs font-bold opacity-75">{label}</p><p className="mt-1 text-xl font-extrabold">{value}</p></div>; }
