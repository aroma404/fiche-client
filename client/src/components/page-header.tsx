/** Atelier fiscal moderne — en-tête éditorial compact pour chaque plugin. */

import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-[#d7e0df] pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0f766e]">{eyebrow}</p>
        <h1 className="font-serif text-4xl leading-none text-[#102a43] sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526775]">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
