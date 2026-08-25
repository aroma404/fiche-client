/** Espace financier du cabinet : chaque opération appartient au compte et peut viser un client. */

import { PageTitle, useWorkspaceClients, WorkspaceLayout } from "@/components/workspace-layout";
import { formatDA } from "@/lib/client-data";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, ArrowUpRight, Landmark, Plus, Trash2, WalletCards } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";

type FinanceForm = {
  clientId: string;
  entryDate: string;
  category: "Paiement" | "Caisse";
  direction: "Entrée" | "Sortie";
  label: string;
  reference: string;
  amount: string;
  note: string;
};

const initialForm = (): FinanceForm => ({
  clientId: "",
  entryDate: new Date().toISOString().slice(0, 10),
  category: "Paiement",
  direction: "Entrée",
  label: "",
  reference: "",
  amount: "",
  note: "",
});

export function CabinetFinancePage() { return <WorkspaceLayout><CabinetFinanceContent /></WorkspaceLayout>; }

function CabinetFinanceContent() {
  const { clients } = useWorkspaceClients();
  const utils = trpc.useUtils();
  const entriesQuery = trpc.cabinetFinance.list.useQuery();
  const [form, setForm] = useState<FinanceForm>(initialForm);
  const create = trpc.cabinetFinance.create.useMutation({
    onSuccess: async () => {
      setForm(initialForm());
      await Promise.all([utils.cabinetFinance.list.invalidate(), utils.clients.get.invalidate()]);
    },
  });
  const remove = trpc.cabinetFinance.remove.useMutation({
    onSuccess: () => void Promise.all([utils.cabinetFinance.list.invalidate(), utils.clients.get.invalidate()]),
  });
  const entries = entriesQuery.data ?? [];
  const clientNames = useMemo(() => new Map(clients.map(client => [client.id, client.fullName])), [clients]);
  const incoming = entries.filter(entry => entry.direction === "Entrée").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const outgoing = entries.filter(entry => entry.direction === "Sortie").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const cashBalance = entries.filter(entry => entry.category === "Caisse").reduce((sum, entry) => sum + (entry.direction === "Entrée" ? Number(entry.amount) : -Number(entry.amount)), 0);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.label.trim() || !Number.isFinite(amount) || amount <= 0) return;
    create.mutate({
      clientId: form.clientId ? Number(form.clientId) : null,
      entryDate: form.entryDate,
      category: form.category,
      direction: form.direction,
      label: form.label.trim(),
      reference: form.reference.trim(),
      amount,
      note: form.note.trim(),
    });
  };

  return <>
    <PageTitle eyebrow="Trésorerie de votre cabinet" title="Finances du cabinet" description="Saisissez ici les paiements et mouvements de caisse du cabinet. Une opération peut être liée à un client ou rester générale au cabinet." />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="order-2 rounded-2xl border border-[#d5dfdc] bg-white p-5 lg:order-1">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric icon={ArrowDownRight} label="Encaissements" value={formatDA(incoming)} tone="teal" />
          <Metric icon={ArrowUpRight} label="Décaissements" value={formatDA(outgoing)} tone="gold" />
          <Metric icon={WalletCards} label="Solde de caisse" value={formatDA(cashBalance)} tone="navy" />
        </div>
        <div className="mt-7 overflow-x-auto rounded-xl border border-[#d5dfdc]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#f7faf8] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#627785]"><tr>{["Date", "Client", "Nature", "Libellé", "Sens", "Montant", ""].map(label => <th key={label || "action"} className="px-4 py-3">{label}</th>)}</tr></thead>
            <tbody>
              {entriesQuery.isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#627785]">Préparation du registre…</td></tr> : null}
              {!entriesQuery.isLoading && !entries.length ? <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-[#627785]">Aucune opération enregistrée. Ajoutez une première ligne depuis le formulaire.</td></tr> : null}
              {entries.map(entry => <tr key={entry.id} className="border-t border-[#edf1f0]">
                <td className="px-4 py-3 text-[#627785]">{entry.entryDate}</td>
                <td className="px-4 py-3 font-semibold">{entry.clientId ? clientNames.get(entry.clientId) ?? "Client archivé" : "Cabinet"}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-[#edf4f1] px-2 py-1 text-xs font-bold text-[#0f766e]">{entry.category}</span></td>
                <td className="px-4 py-3"><p className="font-bold">{entry.label}</p>{entry.reference ? <p className="mt-0.5 text-xs text-[#627785]">{entry.reference}</p> : null}</td>
                <td className={`px-4 py-3 font-bold ${entry.direction === "Entrée" ? "text-[#0f766e]" : "text-[#a1433d]"}`}>{entry.direction}</td>
                <td className="px-4 py-3 font-extrabold">{formatDA(Number(entry.amount))}</td>
                <td className="px-4 py-3"><button onClick={() => remove.mutate({ entryId: entry.id })} disabled={remove.isPending} aria-label="Supprimer l’opération" className="rounded-md p-2 text-[#a1433d] hover:bg-[#fff2ef] disabled:opacity-50"><Trash2 size={16} /></button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
      <form onSubmit={submit} className="order-1 rounded-2xl border border-[#c8ddd5] bg-[#edf7f3] p-5 lg:order-2">
        <div className="flex items-start gap-3"><span className="rounded-xl bg-white p-2.5 text-[#0f766e]"><Landmark size={20} /></span><div><h2 className="font-serif text-2xl text-[#102a43]">Nouvelle opération</h2><p className="mt-1 text-sm leading-5 text-[#627785]">Choisissez un client uniquement lorsque le mouvement le concerne.</p></div></div>
        <div className="mt-6 space-y-4">
          <Field label="Client associé (facultatif)"><select value={form.clientId} onChange={event => setForm({ ...form, clientId: event.target.value })}><option value="">Opération générale du cabinet</option>{clients.filter(client => !client.archivedAt).map(client => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Date"><input type="date" value={form.entryDate} onChange={event => setForm({ ...form, entryDate: event.target.value })} /></Field><Field label="Nature"><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value as FinanceForm["category"] })}><option>Paiement</option><option>Caisse</option></select></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Sens"><select value={form.direction} onChange={event => setForm({ ...form, direction: event.target.value as FinanceForm["direction"] })}><option>Entrée</option><option>Sortie</option></select></Field><Field label="Montant (DA)"><input type="number" min="0" step="0.01" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} placeholder="0,00" /></Field></div>
          <Field label="Libellé"><input value={form.label} onChange={event => setForm({ ...form, label: event.target.value })} placeholder="Ex. règlement, dépense, caisse" /></Field>
          <Field label="Référence"><input value={form.reference} onChange={event => setForm({ ...form, reference: event.target.value })} placeholder="Facultative" /></Field>
          <Field label="Observation"><textarea value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} placeholder="Précision facultative" /></Field>
        </div>
        <button disabled={create.isPending || !form.label.trim() || !form.amount} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white disabled:opacity-55"><Plus size={17} />{create.isPending ? "Enregistrement…" : "Ajouter au registre"}</button>
        {create.error ? <p className="mt-3 rounded-lg bg-[#fff2ef] p-3 text-sm font-semibold text-[#a1433d]">{create.error.message}</p> : null}
      </form>
    </div>
  </>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-bold text-[#30505d]">{label}<span className="mt-1.5 block [&_input]:h-10 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-[#c7d8d3] [&_input]:bg-white [&_input]:px-3 [&_select]:h-10 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-[#c7d8d3] [&_select]:bg-white [&_select]:px-3 [&_textarea]:min-h-20 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-[#c7d8d3] [&_textarea]:bg-white [&_textarea]:p-3">{children}</span></label>; }
function Metric({ icon: Icon, label, value, tone }: { icon: typeof Landmark; label: string; value: string; tone: "teal" | "gold" | "navy" }) { const classes = { teal: "bg-[#e8f4ef] text-[#0f766e]", gold: "bg-[#fff7df] text-[#795b1d]", navy: "bg-[#102a43] text-white" }; return <div className={`rounded-xl p-4 ${classes[tone]}`}><Icon size={18} /><p className="mt-4 text-xs font-bold opacity-75">{label}</p><p className="mt-1 text-xl font-extrabold">{value}</p></div>; }
