import { parseRcCatalogueExcel, type RcExcelPreview } from "@/features/program-settings/rc-excel-import";
import { trpc } from "@/lib/trpc";
import { BookOpenCheck, FileSearch, FileUp, RefreshCcw, RotateCcw, Save } from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";

type ImportMode = "merge" | "replace";

export function RcCatalogueManager() {
  const utils = trpc.useUtils();
  const summary = trpc.programSettings.rcCatalogue.summary.useQuery(undefined, { staleTime: 30_000 });
  const familiesQuery = trpc.programSettings.rcCatalogue.families.useQuery(undefined, { staleTime: 5 * 60_000 });
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<RcExcelPreview | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [message, setMessage] = useState("");
  const normalized = query.trim().toLocaleLowerCase("fr");
  const families = useMemo(() => (familiesQuery.data ?? []).filter(family => !normalized || `${family.code} ${family.label}`.toLocaleLowerCase("fr").includes(normalized)).slice(0, 50), [familiesQuery.data, normalized]);
  const refresh = async () => { await Promise.all([utils.programSettings.rcCatalogue.summary.invalidate(), utils.programSettings.rcCatalogue.families.invalidate(), utils.programSettings.referenceRegistry.list.invalidate()]); };
  const merge = trpc.programSettings.rcCatalogue.mergeFromExcel.useMutation({ onSuccess: async result => { setMessage(`${result.activityCount} activité(s) et ${result.familyCount} catégorie(s) disponibles depuis ${result.sourceFilename}.`); setPreview(null); await refresh(); } });
  const replace = trpc.programSettings.rcCatalogue.replaceFromExcel.useMutation({ onSuccess: async result => { setMessage(`Catalogue remplacé : ${result.activityCount} activité(s) et ${result.familyCount} catégorie(s).`); setPreview(null); await refresh(); } });
  const reset = trpc.programSettings.rcCatalogue.resetToReference.useMutation({ onSuccess: async () => { setMessage("Le catalogue de référence est de nouveau utilisé."); await refresh(); } });
  const pending = merge.isPending || replace.isPending || reset.isPending;

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error("Le fichier RC dépasse la limite de 8 Mo.");
      setPreview(parseRcCatalogueExcel(file.name, await file.arrayBuffer()));
    } catch (error) { setPreview(null); setMessage(error instanceof Error ? error.message : "Fichier RC non valide."); }
  };
  const commit = async () => {
    if (!preview) return;
    setMessage("");
    try { if (mode === "merge") await merge.mutateAsync(preview); else await replace.mutateAsync(preview); } catch (error) { setMessage(error instanceof Error ? error.message : "Mise à jour du catalogue impossible."); }
  };

  return <section className="space-y-5">
    <div className="ui-sheet flex items-start gap-3 p-5 sm:p-6"><span className="grid h-10 w-10 shrink-0 place-items-center border border-[#b8d2c7] bg-[#eaf3ee] text-[#0b625e]"><BookOpenCheck size={19} /></span><div><p className="ui-label">Nomenclature d’activité</p><h2 className="mt-2 font-serif text-3xl text-[#182b3a]">Registre de commerce</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#63737d]">Gérez le catalogue par import Excel contrôlé. Aucun code ni libellé ne peut être créé manuellement.</p></div></div>
    <section className="ui-sheet p-5 sm:p-6"><div className="grid grid-cols-3 gap-px border border-[#d8e2dc] bg-[#d8e2dc]"><Metric label="Catégories" value={String(summary.data?.familyCount ?? 0)} /><Metric label="Activités" value={String(summary.data?.activityCount ?? 0)} tone="teal" /><Metric label="Source" value={summary.data?.isCustom ? "Excel" : "Base"} /></div><div className="mt-5 flex flex-col gap-3 border-y border-[#dce3dc] py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[#182b3a]">{summary.data?.isCustom ? "Catalogue importé du cabinet" : "Catalogue de référence du programme"}</p><p className="mt-1 text-xs text-[#63737d]">{summary.data?.sourceFilename ? `${summary.data.sourceFilename} · ` : ""}{summary.data?.importedAt ? new Date(summary.data.importedAt).toLocaleDateString("fr-DZ") : "Catalogue initial"}</p></div><button type="button" disabled={pending || !summary.data?.isCustom} onClick={() => void reset.mutateAsync()} className="inline-flex h-10 items-center justify-center gap-2 border border-[#d7bcb7] px-3 text-xs font-bold text-[#9b463f] disabled:opacity-40"><RotateCcw size={15} /> Réinitialiser</button></div><label className="mt-5 flex h-11 items-center gap-2 border border-[#c7d8d3] bg-white px-3 text-[#63737d]"><FileSearch size={17} className="text-[#0b625e]" /><input value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-[#182b3a] outline-none" placeholder="Rechercher une catégorie RC…" /></label><div className="mt-4 max-h-80 overflow-y-auto border-y border-[#dce3dc]">{families.map(family => <div key={family.code} className="grid grid-cols-[4.5rem_1fr_auto] gap-3 border-b border-[#e7ece8] px-1 py-3 last:border-b-0"><span className="font-serif text-xl text-[#0b625e]">{family.code}</span><span className="min-w-0 text-sm font-bold text-[#182b3a]">{family.label}</span><span className="text-xs font-semibold text-[#63737d]">{family.activityCount} activité(s)</span></div>)}{!families.length ? <p className="p-4 text-sm text-[#63737d]">Aucune catégorie ne correspond.</p> : null}</div></section>
    <section className="ui-sheet p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center border border-[#d9c483] bg-[#fff7df] text-[#87661e]"><FileUp size={19} /></span><div><p className="ui-label">Mise à jour contrôlée</p><h3 className="mt-2 font-serif text-3xl text-[#182b3a]">Importer un fichier Excel RC</h3><p className="mt-1 text-sm leading-6 text-[#63737d]">Chaque ligne doit comporter un code RC à six chiffres et un libellé dans la colonne suivante. Les autres lignes sont ignorées.</p></div></div><div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end"><label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border border-dashed border-[#8eb7aa] bg-[#f4faf7] p-4 text-sm font-bold text-[#0b625e] hover:bg-[#eaf6f1]"><FileUp size={18} /><span className="truncate">Choisir le fichier Excel ou CSV</span><input type="file" accept=".xlsx,.xls,.xlsb,.csv" onChange={event => void onFile(event)} className="sr-only" /></label><button type="button" onClick={() => void refresh()} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 border border-[#bfd4cc] bg-[#fffefa] px-4 text-sm font-bold text-[#0b625e]"><RefreshCcw size={16} /> Actualiser</button></div>{preview ? <div className="mt-5 border-l-[3px] border-[#0b625e] bg-[#f2f8f5] p-4"><p className="font-bold text-[#182b3a]">{preview.sourceFilename}</p><p className="mt-1 text-sm text-[#526872]">{preview.entries.length} activité(s) détectée(s) dans {preview.familyCount} catégorie(s).</p><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><AppMode value={mode} onChange={setMode} /><button type="button" onClick={() => void commit()} disabled={pending} className="ui-action"><Save size={17} />{pending ? "Importation…" : mode === "merge" ? "Ajouter / mettre à jour" : "Remplacer le catalogue"}</button></div></div> : null}{message ? <p className="mt-4 border-l-[3px] border-[#0b625e] bg-[#eaf5f0] p-3 text-sm font-semibold text-[#0b625e]">{message}</p> : null}</section>
  </section>;
}

function AppMode({ value, onChange }: { value: ImportMode; onChange: (value: ImportMode) => void }) { return <label className="text-sm font-bold text-[#425b64]">Mode d’import<select value={value} onChange={event => onChange(event.target.value as ImportMode)} className="ml-3 h-11 border border-[#bdd2ca] bg-white px-3 text-sm text-[#182b3a] outline-none"><option value="merge">Ajouter / mettre à jour</option><option value="replace">Remplacer complètement</option></select></label>; }
function Metric({ label, value, tone = "paper" }: { label: string; value: string; tone?: "paper" | "teal" }) { return <div className={`min-w-0 p-3 ${tone === "teal" ? "bg-[#0b625e] text-white" : "bg-[#fffefa] text-[#182b3a]"}`}><p className="truncate text-[9px] font-extrabold uppercase tracking-[.1em] opacity-70">{label}</p><p className="mt-1 truncate font-serif text-xl">{value}</p></div>; }
