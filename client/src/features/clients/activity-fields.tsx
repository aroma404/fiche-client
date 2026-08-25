import type { ClientDraft } from "@/lib/client-data";
import { activitiesForRegistreCommerceFamily, registreCommerceFamilies } from "@shared/registre-commerce-activities";
import { AppSelect } from "@/components/form/app-select";
import { useMemo } from "react";

type ClientActivity = ClientDraft["client"];

export function ActivityFields({ client, onChange }: { client: ClientActivity; onChange: (patch: Partial<ClientActivity>) => void }) {
  const activities = useMemo(() => activitiesForRegistreCommerceFamily(client.rcActivityFamily), [client.rcActivityFamily]);
  const updateKind = (activityKind: ClientActivity["activityKind"]) => onChange({ activityKind, autoEntrepreneurActivity: "", rcActivityFamily: "", rcActivityCode: "" });
  return <div className="grid gap-4 sm:grid-cols-2">
    <SelectField label="Domaine d’activité" value={client.activityKind} onChange={value => updateKind(value as ClientActivity["activityKind"])} choices={[{ value: "", label: "Choisir le domaine" }, { value: "Agriculture", label: "Agriculture" }, { value: "Artisanat", label: "Artisanat" }, { value: "Auto-entrepreneur", label: "Auto-entrepreneur" }, { value: "Registre de commerce", label: "Registre de commerce" }]} />
    {client.activityKind === "Auto-entrepreneur" ? <SelectField label="Type d’auto-entreprise" value={client.autoEntrepreneurActivity} onChange={value => onChange({ autoEntrepreneurActivity: value as ClientActivity["autoEntrepreneurActivity"] })} choices={[{ value: "", label: "Choisir une option" }, { value: "Micro-importation", label: "Micro-importation" }, { value: "Prestation de services", label: "Prestation de services" }]} /> : null}
    {client.activityKind === "Registre de commerce" ? <><SelectField label="Catégorie RC" value={client.rcActivityFamily} onChange={value => onChange({ rcActivityFamily: value, rcActivityCode: "" })} choices={[{ value: "", label: "Choisir une catégorie" }, ...registreCommerceFamilies.map(family => ({ value: family.code, label: `${family.label} · ${family.activityCount} activité(s)` }))]} /><SelectField label="Activité RC" value={client.rcActivityCode} onChange={value => onChange({ rcActivityCode: value })} disabled={!client.rcActivityFamily} choices={[{ value: "", label: client.rcActivityFamily ? "Choisir une activité" : "Choisissez d’abord une catégorie" }, ...activities.map(activity => ({ value: activity.code, label: `${activity.code} — ${activity.label}` }))]} /></> : null}
  </div>;
}

function SelectField({ label, value, choices, disabled, onChange }: { label: string; value: string; choices: { value: string; label: string }[]; disabled?: boolean; onChange: (value: string) => void }) {
  return <label className="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#627785]">{label}<span className="mt-2 block normal-case tracking-normal"><AppSelect value={value} disabled={disabled} onValueChange={onChange} options={choices} /></span></label>;
}
