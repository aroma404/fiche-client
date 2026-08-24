/** Atelier fiscal moderne — repères d’état compacts et lisibles. */

export function StatusPill({ label }: { label: string }) {
  const styles: Record<string, string> = {
    "Reçu": "bg-[#dff3eb] text-[#126a55]",
    "Terminé": "bg-[#dff3eb] text-[#126a55]",
    "À vérifier": "bg-[#fbefcf] text-[#916113]",
    "En cours": "bg-[#fbefcf] text-[#916113]",
    "Non requis": "bg-[#eef2f3] text-[#617581]",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] ${styles[label] ?? "bg-[#edf5f3] text-[#0f766e]"}`}>{label}</span>;
}
