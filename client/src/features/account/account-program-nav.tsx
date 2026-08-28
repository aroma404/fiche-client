import { BookOpenCheck, Settings2, Trash2, UserRound, Users } from "lucide-react";
import { Link, useLocation } from "wouter";

const tabs = [
  { href: "/clients", label: "Dossiers", icon: Users },
  { href: "/registre-commerce", label: "Registre de commerce", icon: BookOpenCheck },
  { href: "/reglages", label: "Réglages du programme", icon: Settings2 },
  { href: "/compte", label: "Mon compte", icon: UserRound },
] as const;

/** Navigation de second niveau, accessible depuis la carte profil du rail. */
export function AccountProgramNav({ settingsTab, onSettingsTabChange }: { settingsTab?: "dossiers" | "listes" | "conservation" | "commerce"; onSettingsTabChange?: (tab: "dossiers" | "listes" | "conservation" | "commerce") => void } = {}) {
  const [location] = useLocation();
  const settingsTabs = [{ id: "dossiers", label: "Statuts et informations client", icon: Users }, { id: "listes", label: "Contacts, accès et documents", icon: Settings2 }, { id: "conservation", label: "Suppression et délai", icon: Trash2 }, { id: "commerce", label: "Registre de commerce", icon: BookOpenCheck }] as const;
  return <nav aria-label="Espace compte et programme" className="-mt-3 mb-7 flex gap-1 overflow-x-auto border-b border-[#d7e0df]">
    {settingsTab && onSettingsTabChange ? settingsTabs.map(tab => { const Icon = tab.icon; const active = settingsTab === tab.id; return <button key={tab.id} type="button" onClick={() => onSettingsTabChange(tab.id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${active ? "border-[#0b625e] text-[#0b625e]" : "border-transparent text-[#627785] hover:text-[#182b3a]"}`}><Icon size={16} />{tab.label}</button>; }) : tabs.map(tab => { const Icon = tab.icon; const active = location === tab.href || location.startsWith(`${tab.href}/`); return <Link key={tab.href} href={tab.href} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${active ? "border-[#0b625e] text-[#0b625e]" : "border-transparent text-[#627785] hover:text-[#182b3a]"}`}><Icon size={16} />{tab.label}</Link>; })}
    {settingsTab && onSettingsTabChange ? <Link href="/compte" className="inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-bold text-[#627785] hover:text-[#182b3a]"><UserRound size={16} />Mon compte</Link> : null}
  </nav>;
}
