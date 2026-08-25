/** Tableau de bord du cabinet — vue d’ensemble strictement limitée au compte connecté. */

import { PageTitle, WorkspaceLayout } from "@/components/workspace-layout";
import { trpc } from "@/lib/trpc";
import { ArrowRight, ClipboardCheck, Download, FileSpreadsheet, FolderKanban, Plus, ShieldCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Date non renseignée";
  return new Intl.DateTimeFormat("fr-DZ", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function DashboardPage() {
  const clientsQuery = trpc.clients.list.useQuery({ includeArchived: true });
  const clients = clientsQuery.data ?? [];
  const active = clients.filter(client => !client.archivedAt);
  const archived = clients.filter(client => client.archivedAt);
  const incomplete = active.filter(client => !client.activity || !client.commune || !client.contact);
  const recent = [...active].sort((a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt))).slice(0, 5);
  const statusRows = Object.entries(active.reduce<Record<string, number>>((result, client) => {
    result[client.status || "Sans statut"] = (result[client.status || "Sans statut"] ?? 0) + 1;
    return result;
  }, {}));

  return <WorkspaceLayout>
    <PageTitle eyebrow="Vue d’ensemble du cabinet" title="Tableau de bord" description="Suivez votre portefeuille, les dossiers à compléter et les prochaines actions depuis un seul espace." action={<Link href="/clients?nouveau=1" className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b625d]"><Plus size={17} /> Nouveau client</Link>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardMetric label="Dossiers actifs" value={String(active.length)} detail="Disponibles dans votre espace" tone="teal" icon={<UsersRound size={20} />} />
      <DashboardMetric label="À compléter" value={String(incomplete.length)} detail="Activité, commune ou contact à préciser" tone="gold" icon={<ClipboardCheck size={20} />} />
      <DashboardMetric label="Dossiers archivés" value={String(archived.length)} detail="Conservés hors du portefeuille actif" tone="paper" icon={<FolderKanban size={20} />} />
      <DashboardMetric label="Exports disponibles" value="JSON / XLSX" detail="Un client, une sélection ou tout le cabinet" tone="navy" icon={<Download size={20} />} />
    </section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
      <div className="rounded-2xl border border-[#d5dfdc] bg-white p-6 shadow-[0_10px_28px_rgba(16,42,67,0.04)]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">Suivi prioritaire</p><h2 className="mt-2 font-serif text-3xl text-[#102a43]">Derniers dossiers modifiés</h2><p className="mt-2 text-sm leading-6 text-[#627785]">Ouvrez rapidement les fiches sur lesquelles votre cabinet a travaillé récemment.</p></div><Link href="/clients" className="inline-flex items-center gap-2 text-sm font-bold text-[#0f766e] hover:text-[#0b625d]">Tous les dossiers <ArrowRight size={16} /></Link></div>
        <div className="mt-6 divide-y divide-[#e8efec]">{recent.map(client => <Link key={client.id} href={`/clients/${client.id}/fiche`} className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f4ef] text-sm font-extrabold text-[#0f766e]">{client.fullName.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate font-bold text-[#102a43]">{client.fullName}</p><p className="mt-1 truncate text-xs text-[#627785]">{client.activity || "Activité à préciser"} · {client.commune || "Commune à préciser"}</p></div><div className="hidden text-right sm:block"><span className="rounded-full bg-[#f0f5f3] px-2.5 py-1 text-[11px] font-bold text-[#426c62]">{client.status}</span><p className="mt-1.5 text-[11px] text-[#78909a]">Mis à jour le {formatDate(client.updatedAt)}</p></div><ArrowRight size={17} className="shrink-0 text-[#92a8a4] transition group-hover:translate-x-1 group-hover:text-[#0f766e]" /></Link>)}{!clientsQuery.isLoading && !recent.length ? <div className="rounded-xl border border-dashed border-[#cbd9d5] bg-[#fbfdfc] p-8 text-center"><FolderKanban className="mx-auto text-[#0f766e]" /><p className="mt-3 font-serif text-2xl text-[#102a43]">Votre portefeuille est prêt.</p><p className="mt-2 text-sm text-[#627785]">Créez votre premier dossier client pour commencer le suivi.</p><Link href="/clients?nouveau=1" className="mt-5 inline-flex rounded-lg bg-[#102a43] px-4 py-2.5 text-sm font-bold text-white">Créer un dossier</Link></div> : null}</div>
      </div>
      <aside className="rounded-2xl border border-[#d5dfdc] bg-[#edf5f2] p-6"><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">Répartition du portefeuille</p><h2 className="mt-2 font-serif text-3xl text-[#102a43]">États des dossiers</h2><div className="mt-6 space-y-4">{statusRows.map(([status, count]) => <div key={status}><div className="flex items-center justify-between text-sm"><span className="font-bold text-[#30505d]">{status}</span><span className="font-extrabold text-[#0f766e]">{count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#0f766e]" style={{ width: `${active.length ? Math.max(8, Math.round((count / active.length) * 100)) : 0}%` }} /></div></div>)}{!statusRows.length ? <p className="rounded-xl border border-dashed border-[#c8ddd7] bg-white/60 p-4 text-sm leading-6 text-[#627785]">Les états de vos dossiers apparaîtront ici après création.</p> : null}</div><div className="mt-7 border-t border-[#c9dfd7] pt-5"><p className="text-sm font-bold text-[#102a43]">Protection du compte</p><p className="mt-2 text-sm leading-6 text-[#426c62]">Les indicateurs affichés sont calculés uniquement à partir des dossiers liés à votre session.</p><ShieldCheck className="mt-4 text-[#0f766e]" size={22} /></div></aside>
    </section>
    <section className="mt-6 grid gap-4 lg:grid-cols-3"><DashboardAction icon={<Plus size={20} />} title="Créer un dossier" description="Ajoutez une fiche client, puis complétez ses références fiscales." href="/clients?nouveau=1" action="Nouveau client" /><DashboardAction icon={<FileSpreadsheet size={20} />} title="Importer ou exporter" description="Transférez vos données JSON ou Excel dans un format contrôlé et isolé." href="/transferts" action="Gérer les fichiers" /><DashboardAction icon={<ClipboardCheck size={20} />} title="Contrôler les informations" description={incomplete.length ? `${incomplete.length} dossier(s) actif(s) demandent encore des informations de base.` : "Les informations de base de vos dossiers actifs sont complètes."} href="/clients" action="Voir les dossiers" /></section>
  </WorkspaceLayout>;
}

function DashboardMetric({ label, value, detail, tone, icon }: { label: string; value: string; detail: string; tone: "teal" | "gold" | "paper" | "navy"; icon: ReactNode }) { const tones = { teal: "border-[#bcded2] bg-[#e8f6f0] text-[#0f766e]", gold: "border-[#ead9a7] bg-[#fff8e5] text-[#8a641a]", paper: "border-[#d5dfdc] bg-white text-[#42616c]", navy: "border-[#102a43] bg-[#102a43] text-white" }; return <div className={`rounded-2xl border p-5 ${tones[tone]}`}><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold opacity-80">{label}</p><span className="opacity-85">{icon}</span></div><p className="mt-7 font-serif text-4xl font-bold">{value}</p><p className="mt-2 text-xs leading-5 opacity-80">{detail}</p></div>; }
function DashboardAction({ icon, title, description, href, action }: { icon: ReactNode; title: string; description: string; href: string; action: string }) { return <Link href={href} className="group rounded-2xl border border-[#d5dfdc] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#0f766e] hover:shadow-[0_10px_25px_rgba(16,42,67,0.06)]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f4ef] text-[#0f766e]">{icon}</span><h2 className="mt-5 font-serif text-2xl text-[#102a43]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#627785]">{description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0f766e]">{action} <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span></Link>; }
