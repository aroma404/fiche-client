/** Atelier fiscal moderne — champ de saisie réutilisable avec hiérarchie documentaire nette. */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Field({ label, value, onChange, placeholder = "", type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="grid gap-2">
      <Label className="ui-label">{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-none border-[#cfd6ce] bg-[#fffefa] text-sm shadow-none focus-visible:border-[#0b625e] focus-visible:ring-[#0b625e]/15" />
    </label>
  );
}
