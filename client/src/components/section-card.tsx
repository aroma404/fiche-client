import type { ReactNode } from "react";

export function SectionCard({ title, hint, children, className = "" }: { title: string; hint?: string; children: ReactNode; className?: string }) { return <section className={`ui-sheet p-5 sm:p-6 ${className}`}><div className="ui-marker mb-5"><h2 className="font-serif text-2xl text-[#182b3a]">{title}</h2>{hint ? <p className="mt-1 text-xs leading-5 text-[#63737d]">{hint}</p> : null}</div>{children}</section>; }
