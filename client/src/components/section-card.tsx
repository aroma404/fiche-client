/** Atelier fiscal moderne — carte de section utilitaire, sans décoration vide. */

import type { ReactNode } from "react";

export function SectionCard({ title, hint, children, className = "" }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-[#d5dfdc] bg-white p-5 shadow-[0_1px_0_rgba(16,42,67,0.03)] ${className}`}>
      <div className="mb-5 border-l-[3px] border-[#0f766e] pl-3">
        <h2 className="text-sm font-extrabold tracking-tight text-[#102a43]">{title}</h2>
        {hint ? <p className="mt-1 text-xs leading-5 text-[#6b7f8c]">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}
