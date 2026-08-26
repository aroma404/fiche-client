import { activitiesForRegistreCommerceFamily, registreCommerceFamilies } from "@shared/registre-commerce-activities";
import { protectedReferenceChoices } from "@shared/reference-registry";
import { AppSelect } from "@/components/form/app-select";
import type { ClientDraft } from "@/lib/client-data";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

type ClientActivity = ClientDraft["client"];
const domainChoices = protectedReferenceChoices.activityKind;
const rcFamilyChoices = [{ value: "", label: "Choisir une catégorie" }, ...registreCommerceFamilies.map(family => ({ value: family.code, label: `${family.label} · ${family.activityCount} activité(s)` }))];

export function ActivityFields({ client, onChange }: { client: ClientActivity; onChange: (patch: Partial<ClientActivity>) => void }) {
  const activities = useMemo(() => activitiesForRegistreCommerceFamily(client.rcActivityFamily), [client.rcActivityFamily]);
  const updateKind = (activityKind: ClientActivity["activityKind"]) => onChange({ activityKind, autoEntrepreneurActivity: "", rcActivityFamily: "", rcActivityCode: "" });
  return <div className="grid gap-4 sm:grid-cols-2">
    <SelectField label="Domaine d’activité" value={client.activityKind} onChange={value => updateKind(value as ClientActivity["activityKind"])} choices={domainChoices} />
    {client.activityKind === "Auto-entrepreneur" ? <SelectField label="Type d’auto-entreprise" value={client.autoEntrepreneurActivity} onChange={value => onChange({ autoEntrepreneurActivity: value as ClientActivity["autoEntrepreneurActivity"] })} choices={protectedReferenceChoices.autoEntrepreneurActivity} /> : null}
    {client.activityKind === "Registre de commerce" ? <><SelectField label="Catégorie RC" value={client.rcActivityFamily} onChange={value => onChange({ rcActivityFamily: value, rcActivityCode: "" })} choices={rcFamilyChoices} /><RcActivityPicker activities={activities} value={client.rcActivityCode} disabled={!client.rcActivityFamily} onChange={value => onChange({ rcActivityCode: value })} /></> : null}
  </div>;
}

function RcActivityPicker({ activities, value, disabled, onChange }: { activities: ReturnType<typeof activitiesForRegistreCommerceFamily>; value: string; disabled: boolean; onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("fr"));
  const selected = useMemo(() => activities.find(activity => activity.code === value), [activities, value]);
  const matches = useMemo(() => {
    if (!deferredQuery) return activities.slice(0, 40);
    return activities.filter(activity => `${activity.code} ${activity.label}`.toLocaleLowerCase("fr").includes(deferredQuery)).slice(0, 60);
  }, [activities, deferredQuery]);
  useEffect(() => { setQuery(""); setOpen(false); }, [activities]);
  return <label className="relative text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#627785]">Activité RC<span className="mt-2 block normal-case tracking-normal"><input disabled={disabled} value={open ? query : selected ? `${selected.code} — ${selected.label}` : ""} onFocus={() => { setOpen(true); setQuery(""); }} onChange={event => { setOpen(true); setQuery(event.target.value); }} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} placeholder={disabled ? "Choisissez d’abord une catégorie" : "Rechercher par code ou activité"} className="h-12 w-full rounded-lg border border-[#b9d4ca] bg-white px-3 text-sm font-bold text-[#102a43] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15 disabled:cursor-not-allowed disabled:bg-[#f5f8f7]" /></span>{open && !disabled ? <div role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[#c9ddd6] bg-white p-1 shadow-[0_14px_32px_rgba(16,42,67,0.14)]">{matches.map(activity => <button key={activity.code} type="button" role="option" aria-selected={value === activity.code} onMouseDown={event => event.preventDefault()} onClick={() => { onChange(activity.code); setOpen(false); setQuery(""); }} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#102a43] hover:bg-[#eaf6f1] hover:text-[#0f766e]"><span className="mr-2 text-xs text-[#0f766e]">{activity.code}</span>{activity.label}</button>)}{matches.length === 0 ? <p className="p-3 text-sm font-semibold text-[#627785]">Aucune activité ne correspond à votre recherche.</p> : null}</div> : null}</label>;
}

function SelectField({ label, value, choices, disabled, onChange }: { label: string; value: string; choices: ReadonlyArray<{ value: string; label: string }>; disabled?: boolean; onChange: (value: string) => void }) {
  return <label className="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#627785]">{label}<span className="mt-2 block normal-case tracking-normal"><AppSelect value={value} disabled={disabled} onValueChange={onChange} options={choices} /></span></label>;
}
