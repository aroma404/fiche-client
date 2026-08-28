import { BookOpenCheck, Settings2, Trash2, UserRound, Users } from "lucide-react";
import { Link } from "wouter";


/** Navigation de second niveau, accessible depuis la carte profil du rail. */
type SettingsNavId = "dossiers" | "listes" | "conservation" | "commerce";
const settingsTabs = [{ id: "dossiers", label: "Statuts et informations client", icon: Users }, { id: "listes", label: "Contacts, accès et documents", icon: Settings2 }, { id: "conservation", label: "Suppression et délai", icon: Trash2 }, { id: "commerce", label: "Registre de commerce", icon: BookOpenCheck }] as const;

export function AccountProgramNav({ settingsTab, onSettingsTabChange }: { settingsTab?: SettingsNavId | "account"; onSettingsTabChange?: (tab: SettingsNavId) => void } = {}) {
  return <nav aria-label="Espace compte et programme" className="-mt-3 mb-7 flex gap-1 overflow-x-auto border-b border-[#d7e0df]">
    {settingsTabs.map(tab => { const Icon = tab.icon; const active = settingsTab === tab.id; return onSettingsTabChange ? <button key={tab.id} type="button" onClick={() => onSettingsTabChange(tab.id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${active ? "border-[#0b625e] text-[#0b625e]" : "border-transparent text-[#627785] hover:text-[#182b3a]"}`}><Icon size={16} />{tab.label}</button> : <Link key={tab.id} href={`/reglages?tab=${tab.id}`} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${active ? "border-[#0b625e] text-[#0b625e]" : "border-transparent text-[#627785] hover:text-[#182b3a]"}`}><Icon size={16} />{tab.label}</Link>; })}
    <Link href="/compte" className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${settingsTab === "account" ? "border-[#0b625e] text-[#0b625e]" : "border-transparent text-[#627785] hover:text-[#182b3a]"}`}><UserRound size={16} />Mon compte</Link>
  </nav>;
}
