/** Atelier fiscal moderne — champ de saisie réutilisable avec hiérarchie documentaire nette. */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Field({ label, value, onChange, placeholder = "", type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="grid gap-2">
      <Label className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#526775]">{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-10 border-[#d7e0df] bg-[#fbfcfa] text-sm shadow-none focus-visible:ring-[#0f766e]" />
    </label>
  );
}
