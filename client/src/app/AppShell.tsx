/** Atelier fiscal moderne — coque persistante : navigation sobre, session visible et effacement contrôlé. */

import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Eraser, Menu, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { plugins } from "@/core/plugin-registry";
import { useSession } from "@/core/session-store";

const logoUrl = "/manus-storage/fiche-client-logo_924d3505.png";

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { reset } = useSession();
  const active = plugins.find((plugin) => plugin.route === location) ?? plugins[0];

  const navigation = (onNavigate?: () => void) => (
    <nav className="space-y-1" aria-label="Fonctionnalités">
      {plugins.map((plugin) => {
        const Icon = plugin.icon;
        const current = plugin.route === location;
        return (
          <Link key={plugin.id} href={plugin.route} onClick={onNavigate} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-150 ${current ? "bg-[#e5f2ee] text-[#0f5d57] shadow-[inset_3px_0_0_#0f766e]" : "text-[#536a78] hover:bg-white hover:text-[#102a43]"}`}>
            <Icon size={17} strokeWidth={current ? 2.4 : 1.8} />
            <span>{plugin.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f6f5f0] lg:flex">
      <aside className="sidebar-shell sticky top-0 z-30 hidden h-screen w-[286px] shrink-0 flex-col border-r border-[#cfdad7] bg-[#edf1ee] px-5 py-6 lg:flex">
        <Link href="/" className="mb-7 border-b border-[#cfdad7] pb-6">
          <div className="flex items-center gap-3"><img src={logoUrl} alt="Symbole Fiche Client Impôt" className="h-12 w-12 rounded-lg bg-[#fbfcfa] object-contain p-1.5 shadow-sm" /><div><p className="font-serif text-2xl leading-none text-[#102a43]">Fiche Client</p><p className="mt-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0f766e]">Atelier fiscal</p></div></div>
          <p className="mt-4 text-xs leading-5 text-[#647987]">Registre de suivi temporaire et imprimable.</p>
        </Link>
        <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#58727a]">Parcours de travail</p><span className="text-[10px] font-extrabold text-[#c99a3e]">01—04</span></div>
        {navigation()}
        <div className="mt-auto space-y-3 border-t border-[#d7e0df] pt-4">
          <div className="border-l-[3px] border-[#0f766e] bg-[#dff1ea] p-3"><div className="flex items-center gap-2 text-[#0f766e]"><ShieldCheck size={15} /><span className="text-[10px] font-extrabold uppercase tracking-[0.08em]">Session locale</span></div><p className="mt-1 text-xs leading-5 text-[#426c62]">Non enregistrée et effacée au rechargement.</p></div>
          <ResetButton reset={reset} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="topbar-shell sticky top-0 z-20 flex h-[72px] items-center justify-between border-t-[3px] border-[#c99a3e] border-b border-[#d7e0df] bg-[#f6f5f0]/90 px-5 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#102a43] text-white lg:hidden"><Menu size={18} /></button><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0f766e]">Fonction active</p><p className="text-sm font-extrabold text-[#102a43]">{active.label}</p></div></div>
          <div className="hidden items-center gap-2 text-xs font-bold text-[#617581] sm:flex"><span className="h-2 w-2 rounded-full bg-[#0f766e]" /> Session temporaire</div>
        </header>
        <main className="app-enter mx-auto min-h-[calc(100vh-72px)] max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
      {mobileOpen ? <div className="fixed inset-0 z-50 bg-[#102a43]/35 backdrop-blur-[2px] lg:hidden"><aside className="h-full w-[290px] bg-[#f1f4f1] p-5 shadow-2xl"><div className="mb-8 flex items-center justify-between"><Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3"><img src={logoUrl} alt="Symbole Fiche Client Impôt" className="h-10 w-10 rounded-xl object-cover" /><div><p className="font-serif text-lg text-[#102a43]">Fiche Client</p><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0f766e]">Atelier fiscal</p></div></Link><button onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" className="rounded-lg p-2 text-[#526775] hover:bg-white"><X size={19} /></button></div>{navigation(() => setMobileOpen(false))}<div className="mt-8 border-t border-[#d7e0df] pt-4"><ResetButton reset={() => { reset(); setMobileOpen(false); }} /></div></aside></div> : null}
    </div>
  );
}

function ResetButton({ reset }: { reset: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="outline" className="w-full justify-start gap-2 border-[#d7e0df] bg-white text-[#a12a22] hover:bg-[#fff2ef] hover:text-[#a12a22]"><Eraser size={15} /> Effacer la session</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Effacer les données temporaires ?</AlertDialogTitle><AlertDialogDescription>Cette action remet à zéro la fiche, les documents, les paiements et la caisse de cette session. Elle est irréversible.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Conserver la session</AlertDialogCancel><AlertDialogAction className="bg-[#b42318] hover:bg-[#941f16]" onClick={reset}>Effacer maintenant</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
