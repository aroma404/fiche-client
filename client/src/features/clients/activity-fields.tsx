import { activitiesForRegistreCommerceFamily, registreCommerceFamilies } from "@shared/registre-commerce-activities";
import { protectedReferenceChoices } from "@shared/reference-registry";
import { AppSelect } from "@/components/form/app-select";
import { chooseRcListboxSide, filterRcPickerEntries, type RcPickerEntry } from "@/features/clients/rc-picker-utils";
import type { ClientDraft } from "@/lib/client-data";
import { useDeferredValue, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

type ClientActivity = ClientDraft["client"];
type RcActivity = ReturnType<typeof activitiesForRegistreCommerceFamily>[number];
const domainChoices = protectedReferenceChoices.activityKind;
const rcFamilies = registreCommerceFamilies.map(family => ({ code: family.code, label: `${family.code} — ${family.label} · ${family.activityCount} activité(s)` }));

export function ActivityFields({ client, onChange }: { client: ClientActivity; onChange: (patch: Partial<ClientActivity>) => void }) {
  const activities = useMemo(() => activitiesForRegistreCommerceFamily(client.rcActivityFamily), [client.rcActivityFamily]);
  const updateKind = (activityKind: ClientActivity["activityKind"]) => onChange({ activityKind, autoEntrepreneurActivity: "", rcActivityFamily: "", rcActivityCode: "" });
  return <div className="grid gap-4 sm:grid-cols-2">
    <SelectField label="Domaine d’activité" value={client.activityKind} onChange={value => updateKind(value as ClientActivity["activityKind"])} choices={domainChoices} />
    {client.activityKind === "Auto-entrepreneur" ? <SelectField label="Type d’auto-entreprise" value={client.autoEntrepreneurActivity} onChange={value => onChange({ autoEntrepreneurActivity: value as ClientActivity["autoEntrepreneurActivity"] })} choices={protectedReferenceChoices.autoEntrepreneurActivity} /> : null}
    {client.activityKind === "Registre de commerce" ? <>
      <RcCombobox label="Catégorie RC" entries={rcFamilies} value={client.rcActivityFamily} placeholder="Ouvrir puis saisir un code, ex. 101" onChange={nextFamily => onChange({ rcActivityFamily: nextFamily, rcActivityCode: "" })} />
      <RcCombobox label="Activité RC" entries={activities} value={client.rcActivityCode} disabled={!client.rcActivityFamily} placeholder={client.rcActivityFamily ? "Rechercher par code ou activité" : "Choisissez d’abord une catégorie"} onChange={rcActivityCode => onChange({ rcActivityCode })} />
    </> : null}
  </div>;
}

function RcCombobox<T extends RcPickerEntry>({ label, entries, value, disabled = false, placeholder, onChange }: { label: string; entries: readonly T[]; value: string; disabled?: boolean; placeholder: string; onChange: (value: string) => void }) {
  const anchorRef = useRef<HTMLLabelElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionListId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [side, setSide] = useState<"top" | "bottom">("bottom");
  const deferredQuery = useDeferredValue(query);
  const selected = useMemo(() => entries.find(entry => entry.code === value), [entries, value]);
  const matches = useMemo(() => filterRcPickerEntries(entries, deferredQuery, label === "Activité RC" ? 60 : 99), [deferredQuery, entries, label]);
  const listHeight = Math.min(288, Math.max(112, matches.length * 44 + 8));

  const positionList = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSide(chooseRcListboxSide({ anchorTop: rect.top, anchorBottom: rect.bottom, viewportHeight: window.innerHeight, desiredHeight: listHeight }));
  };
  const openList = () => { if (disabled) return; setOpen(true); setQuery(""); setActiveIndex(0); };
  const select = (code: string) => { onChange(code); setOpen(false); setQuery(""); inputRef.current?.blur(); };

  useEffect(() => { setQuery(""); setOpen(false); setActiveIndex(0); }, [entries]);
  useEffect(() => { if (activeIndex >= matches.length) setActiveIndex(0); }, [activeIndex, matches.length]);
  useLayoutEffect(() => {
    if (!open) return;
    positionList();
    const refreshPosition = () => positionList();
    window.addEventListener("resize", refreshPosition);
    window.addEventListener("scroll", refreshPosition, true);
    return () => { window.removeEventListener("resize", refreshPosition); window.removeEventListener("scroll", refreshPosition, true); };
  }, [open, listHeight]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown") { event.preventDefault(); if (!open) openList(); else setActiveIndex(index => Math.min(index + 1, Math.max(0, matches.length - 1))); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); if (!open) openList(); else setActiveIndex(index => Math.max(index - 1, 0)); return; }
    if (event.key === "Enter" && open && matches[activeIndex]) { event.preventDefault(); select(matches[activeIndex].code); return; }
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); setQuery(""); inputRef.current?.blur(); }
  };
  const displayValue = open ? query : selected ? `${selected.code} — ${selected.label.replace(/^[^—]+—\s*/, "")}` : "";

  return <label ref={anchorRef} className="relative text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#627785]">{label}<span className="mt-2 block normal-case tracking-normal"><input ref={inputRef} disabled={disabled} role="combobox" aria-autocomplete="list" aria-controls={optionListId} aria-expanded={open} aria-activedescendant={open && matches[activeIndex] ? `${optionListId}-${matches[activeIndex].code}` : undefined} value={displayValue} onFocus={openList} onClick={openList} onChange={event => { setOpen(true); setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={onKeyDown} placeholder={placeholder} className="h-12 w-full rounded-lg border border-[#b9d4ca] bg-white px-3 text-sm font-bold text-[#102a43] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15 disabled:cursor-not-allowed disabled:bg-[#f5f8f7]" /></span>{open && !disabled ? <div id={optionListId} role="listbox" className={`absolute z-50 max-h-72 w-full overflow-y-auto rounded-xl border border-[#c9ddd6] bg-white p-1 shadow-[0_14px_32px_rgba(16,42,67,0.14)] ${side === "top" ? "bottom-[calc(100%+0.25rem)]" : "top-[calc(100%+0.25rem)]"}`}>{matches.map((entry, index) => <button id={`${optionListId}-${entry.code}`} key={entry.code} type="button" role="option" aria-selected={value === entry.code} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => select(entry.code)} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${index === activeIndex ? "bg-[#eaf6f1] text-[#0f766e]" : "text-[#102a43] hover:bg-[#eaf6f1] hover:text-[#0f766e]"}`}><span className="mr-2 text-xs text-[#0f766e]">{entry.code}</span>{entry.label.replace(new RegExp(`^${entry.code}\\s+—\\s+`), "")}</button>)}{matches.length === 0 ? <p className="p-3 text-sm font-semibold text-[#627785]">Aucune valeur ne correspond à votre recherche.</p> : null}</div> : null}</label>;
}

function SelectField({ label, value, choices, disabled, onChange }: { label: string; value: string; choices: ReadonlyArray<{ value: string; label: string }>; disabled?: boolean; onChange: (value: string) => void }) {
  return <label className="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#627785]">{label}<span className="mt-2 block normal-case tracking-normal"><AppSelect value={value} disabled={disabled} onValueChange={onChange} options={choices} /></span></label>;
}
