/** Coque privée du cabinet : navigation, recherche client et identité de session. */

import { BrandSymbol } from "@/components/local-visuals";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Download, LayoutDashboard, LogOut, Plus, Search, Settings, Users } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const appLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Dossiers clients", icon: Users },
  { href: "/transferts", label: "Importer / exporter", icon: Download },
  { href: "/compte", label: "Mon compte", icon: Settings },
];

function sectionTitle(location: string) { if (location.startsWith("/dashboard")) return "Tableau de bord"; if (location.startsWith("/clients")) return "Dossiers clients"; if (location.startsWith("/transferts")) return "Importation et exportation"; return "Mon compte"; }
function maskedEmail(email: string) { const [local = "", domain = ""] = email.split("@"); return `${local.slice(0, 1)}${local.length > 1 ? "•••" : ""}@${domain}`; }

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [location, setLocation] = useLocation();
  const clientsQuery = trpc.clients.list.useQuery(undefined, { enabled: Boolean(user) });
  const [search, setSearch] = useState("");
  const clients = clientsQuery.data ?? [];
  const visibleClients = useMemo(() => clients.filter(client => `${client.fullName} ${client.commune} ${client.status}`.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr"))), [clients, search]);

  if (loading || !user) return <div className="min-h-screen bg-[#f6f5f0] p-8 text-sm text-[#627785]">Préparation de votre espace de travail…</div>;

  return <div className="min-h-screen bg-[#f6f5f0] lg:flex">
    <aside className="sidebar-shell hidden h-screen w-[292px] shrink-0 flex-col border-r border-[#cfdad7] bg-[#edf1ee] px-5 py-6 lg:flex">
      <Link href="/dashboard" className="border-b border-[#cfdad7] pb-6"><div className="flex items-center gap-3"><BrandSymbol className="h-12 w-12 rounded-lg bg-white p-1 shadow-sm" /><div><p className="font-serif text-2xl leading-none text-[#102a43]">Fiche Client</p><p className="mt-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0f766e]">Atelier fiscal</p></div></div><p className="mt-4 text-xs leading-5 text-[#647987]">Bureau comptable sécurisé.</p></Link>
      <div className="mt-6"><p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#58727a]">Espace de travail</p><nav className="space-y-1">{appLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${location.startsWith(href) ? "bg-[#dff1ea] text-[#0f766e]" : "text-[#526775] hover:bg-white/75"}`}><Icon size={17} />{label}</Link>)}</nav></div>
      <div className="mt-7 min-h-0 flex-1"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#58727a]">Clients actifs</p><button onClick={() => setLocation("/clients?nouveau=1")} aria-label="Nouveau client" className="rounded-md p-1 text-[#0f766e] hover:bg-white"><Plus size={16} /></button></div>{clients.length > 5 ? <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#cbd9d5] bg-white px-2.5"><Search size={14} className="text-[#6f8790]" /><input value={search} onChange={event => setSearch(event.target.value)} className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="Rechercher un client…" aria-label="Rechercher un client" /></div> : null}<div className="max-h-[43vh] space-y-1 overflow-y-auto pr-1">{visibleClients.map(client => <Link key={client.id} href={`/clients/${client.id}/fiche`} className={`block rounded-lg border px-3 py-2 text-sm transition ${location.includes(`/clients/${client.id}`) ? "border-[#0f766e] bg-white text-[#102a43]" : "border-transparent text-[#526775] hover:border-[#d7e0df] hover:bg-white/70"}`}><p className="truncate font-bold">{client.fullName}</p><p className="mt-0.5 text-[11px] text-[#76909a]">{client.status} · {client.commune || "Sans commune"}</p></Link>)}{clients.length === 0 ? <p className="rounded-lg border border-dashed border-[#cfdad7] p-3 text-xs leading-5 text-[#627785]">Aucun client. Créez votre premier dossier.</p> : null}{clients.length > 5 && !visibleClients.length ? <p className="rounded-lg border border-dashed border-[#cfdad7] p-3 text-xs leading-5 text-[#627785]">Aucun client ne correspond à votre recherche.</p> : null}</div></div>
      <div className="border-t border-[#cfdad7] pt-4"><Link href="/compte" className="group block rounded-xl border border-transparent p-2 transition hover:border-[#c3d8d1] hover:bg-white/70"><p className="truncate text-sm font-bold text-[#102a43]">{user.fullName}</p><p className="mt-1 truncate text-xs text-[#627785]">{maskedEmail(user.email)}</p><p className="mt-2 text-[11px] font-extrabold text-[#0f766e]">Gérer mon compte</p></Link><button onClick={() => void logout().then(() => setLocation("/"))} className="mt-2 flex w-full items-center gap-2 rounded-lg border border-[#e1d4d1] bg-white px-3 py-2 text-xs font-bold text-[#a1433d] hover:bg-[#fff6f4]"><LogOut size={15} /> Se déconnecter</button></div>
    </aside>
    <div className="min-w-0 flex-1"><header className="topbar-shell sticky top-0 z-20 flex min-h-[72px] items-center justify-between border-t-[3px] border-[#c99a3e] border-b border-[#d7e0df] bg-[#f6f5f0]/95 px-5 backdrop-blur lg:px-10"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">Compte sécurisé</p><p className="text-sm font-bold text-[#102a43]">{sectionTitle(location)}</p></div><div className="flex items-center gap-2 text-xs font-bold text-[#627785]"><span className="h-2 w-2 rounded-full bg-[#0f766e]" /> Session active</div></header><main className="workspace-main mx-auto max-w-[1400px] p-5 lg:p-10">{children}</main></div>
  </div>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <div className="mb-8 border-b border-[#d7e0df] pb-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">{eyebrow}</p><h1 className="mt-2 font-serif text-4xl leading-tight text-[#102a43] sm:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#627785]">{description}</p></div>{action}</div></div>; }
