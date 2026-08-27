/** Fiche identité du client : les choix fiscaux et d’activité sont contraints et cohérents avec le registre. */
import { AppSelect } from "@/components/form/app-select";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { clientFeatureRegistry } from "@/core/registry-index";
import { ActivityFields } from "@/features/clients/activity-fields";
import { ClientContactsPanel } from "@/features/clients/client-contacts-panel";
import { normalizeBundle, type ClientDraft } from "@/lib/client-data";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const tabs = clientFeatureRegistry;
const yesNoChoices = ["Oui", "Non"];

export function ClientFichePage({ clientId }: { clientId: number }) {
  const [, setLocation] = useLocation();
  const query = trpc.clients.get.useQuery({ clientId });
  const statuses = trpc.programSettings.clientStatuses.list.useQuery(undefined, { staleTime: 30_000 });
  const legalForms = trpc.programSettings.clientOptions.list.useQuery({ kind: "legalForm" }, { staleTime: 30_000 });
  const clientTypes = trpc.programSettings.clientOptions.list.useQuery({ kind: "clientType" }, { staleTime: 30_000 });
  const regimes = trpc.programSettings.clientOptions.list.useQuery({ kind: "regime" }, { staleTime: 30_000 });
  const taxCenters = trpc.programSettings.clientOptions.list.useQuery({ kind: "taxCenter" }, { staleTime: 30_000 });
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<ClientDraft | null>(null);

  useEffect(() => { if (query.data) setDraft(normalizeBundle(query.data)); }, [query.data]);
  const save = trpc.clients.saveBundle.useMutation({ onSuccess: () => void Promise.all([utils.clients.get.invalidate({ clientId }), utils.clients.list.invalidate()]) });
  const archive = trpc.clients.archive.useMutation({ onSuccess: async () => { await utils.clients.list.invalidate(); setLocation("/clients"); } });
  if (!draft) return <WorkspaceLayout><div className="mx-auto max-w-5xl space-y-5" aria-busy="true"><div className="h-4 w-28 rounded bg-[#dfe9e5]" /><div className="h-12 w-2/5 rounded bg-[#e3ebe8]" /><div className="grid gap-5 xl:grid-cols-2"><div className="h-80 rounded-xl border border-[#d5dfdc] bg-white/75" /><div className="h-80 rounded-xl border border-[#d5dfdc] bg-white/75" /></div></div></WorkspaceLayout>;

  const setClient = (field: keyof ClientDraft["client"], value: string) => setDraft({ ...draft, client: { ...draft.client, [field]: value } });
  const legalFormChoices = Array.from(new Set([draft.client.legalForm, ...(legalForms.data?.map((item: any) => item.label) ?? ["Personne physique", "Personne morale"])]));
  const clientTypeChoices = Array.from(new Set([draft.client.clientType, ...(clientTypes.data?.map((item: any) => item.label) ?? ["Nouveau client", "Ancien client"])]));
  const regimeChoices = Array.from(new Set([draft.client.regime, ...(regimes.data?.map((item: any) => item.label) ?? ["Régime réel", "Régime réel simplifié", "Régime IFU"])]));

  return <WorkspaceLayout>
    <div className="mb-7">
      <Link href="/clients" className="inline-flex items-center gap-2 text-sm font-bold text-[#0f766e]"><ArrowLeft size={16} /> Dossiers clients</Link>
      <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">Dossier client actif · Réf. {draft.client.referenceNumber ? String(draft.client.referenceNumber).padStart(3, "0") : "—"}</p><h1 className="mt-2 font-serif text-4xl text-[#102a43]">Fiche du client</h1></div>
        <div className="flex flex-wrap gap-2"><Link href={`/transferts?clientId=${clientId}`} className="inline-flex h-10 items-center justify-center rounded-lg border border-[#cfdad7] bg-white px-4 text-sm font-bold text-[#102a43]">Exporter ce client</Link><button type="button" disabled={archive.isPending} onClick={() => { if (window.confirm("Archiver ce client et ses documents pendant 30 jours ? La suppression définitive anticipée est impossible.")) archive.mutate({ clientId }); }} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#efc8c3] bg-white px-3 text-sm font-bold text-[#a1433d] disabled:opacity-60"><Trash2 size={16} /> Archiver</button><button disabled={save.isPending} onClick={() => save.mutate({ clientId, data: draft })} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f766e] px-4 text-sm font-bold text-white disabled:opacity-60"><Save size={16} />{save.isPending ? "Enregistrement…" : "Enregistrer"}</button></div>
      </div>
      <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-[#d7e0df]">{tabs.map(tab => <Link key={tab.slug} href={`/clients/${clientId}/${tab.slug}`} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold ${tab.slug === "fiche" ? "border-[#0f766e] text-[#0f766e]" : "border-transparent text-[#627785] hover:text-[#102a43]"}`}>{tab.label}</Link>)}</nav>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <FormCard title="1. Informations générales">
        <TextGrid draft={draft} onChange={setClient} fields={[["Nom / raison sociale", "fullName"], ["Adresse", "commune"]]} />
        <div className="mt-4"><ActivityFields client={draft.client} onChange={patch => setDraft({ ...draft, client: { ...draft.client, ...patch } })} /></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectField label="Forme juridique" value={draft.client.legalForm} onChange={value => setClient("legalForm", value)} choices={legalFormChoices} />
          <SelectField label="Type de client" value={draft.client.clientType} onChange={value => setClient("clientType", value)} choices={clientTypeChoices} />
          <SelectField label="Statut" value={draft.client.status} onChange={value => setClient("status", value)} choices={Array.from(new Set([draft.client.status, ...(statuses.data?.map(status => status.label) ?? ["Actif", "Radié"])]))} />
        </div>
      </FormCard>
      <FormCard title="2. Références fiscales et juridiques">
        <TextGrid draft={draft} onChange={setClient} fields={[["NIF", "nif"], ["N° RC", "rc"], ["BP", "bp"], ["Article d’imposition", "taxArticle"], ["NIN", "nin"]]} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><SelectField label="Régime fiscal" value={draft.client.regime} onChange={value => setClient("regime", value)} choices={regimeChoices} /><SelectField label="Centre d’impôt" value={draft.client.taxCenter} onChange={value => setClient("taxCenter", value)} choices={Array.from(new Set([draft.client.taxCenter, ...(taxCenters.data?.map((item: any) => item.label) ?? ["CDI", "CPI"])]))} /></div>
        <div className="mt-4 border-t border-[#e6eeeb] pt-4"><p className="ui-label">Affiliations sociales</p><div className="mt-3 grid gap-4 sm:grid-cols-3"><SelectField label="Affilié à la CNAS" value={draft.client.cnasAffiliated ? "Oui" : "Non"} onChange={value => setDraft({ ...draft, client: { ...draft.client, cnasAffiliated: value === "Oui" } })} choices={yesNoChoices} /><SelectField label="Affilié au CASNOS" value={draft.client.casnosAffiliated ? "Oui" : "Non"} onChange={value => setDraft({ ...draft, client: { ...draft.client, casnosAffiliated: value === "Oui" } })} choices={yesNoChoices} /><SelectField label="Affilié au CACOBATPH" value={draft.client.cacobatphAffiliated ? "Oui" : "Non"} onChange={value => setDraft({ ...draft, client: { ...draft.client, cacobatphAffiliated: value === "Oui" } })} choices={yesNoChoices} /></div></div>
        <div className="mt-5 border-t border-[#e6eeeb] pt-4">{draft.client.initialBalance === null ? <button type="button" onClick={() => setDraft({ ...draft, client: { ...draft.client, initialBalance: 0 } })} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#9dc7bb] bg-white px-3 text-sm font-bold text-[#0f766e]"><Plus size={16} /> Ajouter un solde initial</button> : <div className="flex flex-wrap items-end gap-3"><label className="min-w-[13rem] flex-1 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#627785]">Solde initial (DA)<input value={draft.client.initialBalance} type="number" onChange={event => setDraft({ ...draft, client: { ...draft.client, initialBalance: event.target.value === "" ? null : Number(event.target.value) } })} className="mt-2 h-10 w-full rounded-lg border border-[#d5dfdc] px-3 text-sm font-normal normal-case tracking-normal text-[#102a43]" /></label><button type="button" onClick={() => setDraft({ ...draft, client: { ...draft.client, initialBalance: null } })} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#efc8c3] bg-white px-3 text-sm font-bold text-[#a1433d]"><Trash2 size={16} /> Retirer</button></div>}</div>
      </FormCard>
    </div>
    <div className="mt-5"><FormCard title="3. Contacts"><ClientContactsPanel clientId={clientId} /></FormCard></div>
    {save.isSuccess ? <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#0f766e]"><Check size={16} /> Fiche enregistrée.</p> : null}
  </WorkspaceLayout>;
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="ui-sheet p-5 sm:p-6"><div className="ui-marker"><h2 className="font-serif text-2xl text-[#182b3a]">{title}</h2></div><div className="mt-5">{children}</div></section>; }
function TextGrid({ draft, onChange, fields }: { draft: ClientDraft; onChange: (field: keyof ClientDraft["client"], value: string) => void; fields: [string, keyof ClientDraft["client"]][] }) { return <div className="grid gap-4 sm:grid-cols-2">{fields.map(([label, field]) => <label key={field}><span className="ui-label">{label}</span><input value={String(draft.client[field] ?? "")} onChange={event => onChange(field, event.target.value)} className="ui-input mt-2" /></label>)}</div>; }
function SelectField({ label, value, choices, disabled, onChange }: { label: string; value: string; choices: string[]; disabled?: boolean; onChange: (value: string) => void }) { return <label><span className="ui-label">{label}</span><span className="mt-2 block"><AppSelect value={value} disabled={disabled} onValueChange={onChange} options={choices.map(choice => ({ value: choice, label: choice }))} /></span></label>; }
