import { FastPrivateLink } from "@/components/fast-private-link";
import { PageTitle, useWorkspaceClients, WorkspaceLayout } from "@/components/workspace-layout";
import { ArrowRight, FolderKanban, MapPin, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export function ClientRegisterPage() {
  return <WorkspaceLayout><ClientRegisterContent /></WorkspaceLayout>;
}

function ClientRegisterContent() {
  const { allClients, operationalStatusLabels, isLoading } = useWorkspaceClients();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"Tous" | "Actif" | "Radié">("Tous");
  const shown = useMemo(() => allClients.filter(client => {
    const matchesText = `${client.fullName} ${client.activity ?? ""} ${client.commune ?? ""}`.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr"));
    const isActive = !client.archivedAt && operationalStatusLabels.includes(client.status ?? "");
    const matchesStatus = status === "Tous" || (status === "Actif" && isActive) || (status === "Radié" && !isActive && !client.archivedAt);
    return matchesText && matchesStatus && !client.archivedAt;
  }), [allClients, operationalStatusLabels, search, status]);
  const activeCount = allClients.filter(client => !client.archivedAt && operationalStatusLabels.includes(client.status ?? "")).length;

  return <>
    <PageTitle eyebrow="Registre clients" title="Dossiers du cabinet" description="Accédez à vos dossiers et poursuivez leur suivi." action={<Link href="/clients/nouveau" className="ui-action"><Plus size={17} /> Nouveau dossier</Link>} />
    <section className="ui-sheet">
      <div className="grid gap-4 border-b border-[#dfe3dc] p-5 lg:grid-cols-[1fr_auto]">
        <label className="flex h-11 items-center gap-3 border border-[#cfd6ce] bg-[#fffefa] px-3 text-[#63737d]"><Search size={17} className="text-[#0b625e]" /><input value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-[#182b3a] outline-none" placeholder="Rechercher un dossier, une activité ou une commune…" /></label>
        <div className="flex items-center gap-2"><span className="ui-label hidden sm:inline">État</span>{(["Tous", "Actif", "Radié"] as const).map(option => <button key={option} onClick={() => setStatus(option)} className={`h-11 border px-4 text-sm font-bold ${status === option ? "border-[#0b625e] bg-[#0b625e] text-white" : "border-[#cfd6ce] bg-[#fffefa] text-[#526872] hover:border-[#0b625e]"}`}>{option}</button>)}</div>
      </div>
      <div className="flex flex-col gap-3 border-b border-[#dfe3dc] bg-[#f7f7f2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center border border-[#b8d2c7] bg-[#eaf3ee] text-[#0b625e]"><FolderKanban size={17} /></span><div><p className="text-sm font-bold">{shown.length} dossier{shown.length > 1 ? "s" : ""} affiché{shown.length > 1 ? "s" : ""}</p><p className="text-xs text-[#63737d]">{activeCount} dossier{activeCount > 1 ? "s" : ""} actif{activeCount > 1 ? "s" : ""} dans le portefeuille</p></div></div>
        <div className="hidden items-center gap-2 text-xs font-semibold text-[#63737d] sm:flex"><SlidersHorizontal size={15} /> Recherche et filtres locaux</div>
      </div>
      <div>{isLoading ? <div className="divide-y divide-[#e1e4de]">{[1, 2, 3, 4].map(item => <div key={item} className="h-20 animate-pulse bg-[#fffdf8]" />)}</div> : shown.map((client, index) => <FastPrivateLink key={client.id} href={`/clients/${client.id}/fiche`} className="group grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 border-b border-[#e1e4de] px-5 py-4 last:border-b-0 hover:bg-[#f4f7f1]"><span className="font-serif text-xl text-[#0b625e]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate font-serif text-xl text-[#182b3a]">{client.fullName}</p><span className={`hidden border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[.08em] sm:inline ${operationalStatusLabels.includes(client.status ?? "") ? "border-[#b8d2c7] bg-[#eaf3ee] text-[#0b625e]" : "border-[#ead3c7] bg-[#fff1ec] text-[#a1433d]"}`}>{client.status}</span></div><p className="mt-1 truncate text-xs text-[#63737d]">{client.activity || "Activité à préciser"}</p></div><div className="flex items-center gap-2 text-xs font-semibold text-[#63737d]"><MapPin size={14} className="text-[#0b625e]" /><span className="hidden max-w-32 truncate sm:inline">{client.commune || "Sans commune"}</span><ArrowRight size={16} className="text-[#8ca19d] transition group-hover:translate-x-1 group-hover:text-[#0b625e]" /></div></FastPrivateLink>)}{!isLoading && !shown.length ? <div className="p-12 text-center"><FolderKanban className="mx-auto text-[#0b625e]" size={30} /><p className="mt-4 font-serif text-2xl">Aucun dossier trouvé</p><p className="mt-2 text-sm text-[#63737d]">Ajustez la recherche ou créez un nouveau dossier client.</p><Link href="/clients/nouveau" className="ui-action mt-5">Créer un dossier</Link></div> : null}</div>
    </section>
  </>;
}
