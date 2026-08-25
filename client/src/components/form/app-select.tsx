import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AppSelectOption = { value: string; label: string; disabled?: boolean };
const emptyValue = "__fiche_client_empty_select__";

export function AppSelect({ value, onValueChange, options, placeholder, id, ariaLabel, disabled }: { value: string; onValueChange: (value: string) => void; options: readonly AppSelectOption[]; placeholder?: string; id?: string; ariaLabel?: string; disabled?: boolean }) {
  return <Select value={value || emptyValue} onValueChange={nextValue => onValueChange(nextValue === emptyValue ? "" : nextValue)} disabled={disabled}><SelectTrigger id={id} aria-label={ariaLabel} className="h-12 w-full rounded-lg border-[#b9d4ca] bg-white px-3 text-sm font-bold text-[#102a43] shadow-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15"><SelectValue placeholder={placeholder ?? "Sélectionner une option"} /></SelectTrigger><SelectContent className="rounded-xl border-[#c9ddd6] bg-white text-[#102a43] shadow-[0_14px_32px_rgba(16,42,67,0.14)]">{options.map(option => <SelectItem key={option.value || emptyValue} value={option.value || emptyValue} disabled={option.disabled} className="cursor-pointer rounded-lg py-2.5 text-sm font-semibold focus:bg-[#eaf6f1] focus:text-[#0f766e]">{option.label}</SelectItem>)}</SelectContent></Select>;
}
