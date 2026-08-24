/** Atelier fiscal moderne — transparence sur le mode session, l’effacement et les limites de confidentialité. */

import { Eraser, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { useSession } from "@/core/session-store";
import { PrivacyShieldArt } from "@/components/local-visuals";

export default function PrivacyPlugin() {
  const { reset } = useSession();
  return <div><PageHeader eyebrow="Confidentialité par défaut" title="Une session locale, sans historique" description="La fiche existe seulement dans l’état de cette page. Elle n’est pas synchronisée, envoyée ou enregistrée automatiquement." />
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]"><section className="relative min-h-[390px] overflow-hidden rounded-[1.25rem] border border-[#d7e0df] bg-[#ebefeb]"><PrivacyShieldArt /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#102a43] via-[#102a43]/80 to-transparent p-7 pt-24 text-white"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9bd4c7]">Principe de session</p><h2 className="mt-2 font-serif text-3xl">Vos saisies restent ici, puis disparaissent.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[#d8e4e8]">Le rechargement, la fermeture de l’onglet ou l’effacement manuel réinitialisent les données temporaires.</p></div></section>
      <div className="space-y-6"><SectionCard title="Ce que l’application ne fait pas" hint="Aucune donnée personnelle n’est sauvegardée par le MVP."><div className="space-y-4"><Rule icon={EyeOff} title="Pas de stockage local" text="Pas de localStorage, de cookies métier, de base de données ou d’historique client." /><Rule icon={ShieldCheck} title="Pas de mots de passe" text="Le système ne doit pas servir à enregistrer des identifiants, mots de passe ou secrets d’accès." /><Rule icon={Eraser} title="Effacement contrôlé" text="L’effacement remet à zéro la fiche, les documents, la caisse et les paiements de la session." /></div></SectionCard><SectionCard title="Effacer maintenant" hint="Une confirmation est demandée avant la remise à zéro."><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="border-[#e6bbb4] text-[#a12a22] hover:bg-[#fff0ee] hover:text-[#a12a22]"><Eraser size={16} /> Effacer toutes les données de session</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Effacer cette session locale ?</AlertDialogTitle><AlertDialogDescription>La fiche, les paiements, les documents et la caisse reviendront à leur état initial.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={reset} className="bg-[#b42318] hover:bg-[#941f16]">Effacer la session</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></SectionCard></div></div>
  </div>;
}

function Rule({ icon: Icon, title, text }: { icon: typeof EyeOff; title: string; text: string }) { return <div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f2ee] text-[#0f766e]"><Icon size={17} /></div><div><p className="text-sm font-extrabold text-[#102a43]">{title}</p><p className="mt-1 text-xs leading-5 text-[#647987]">{text}</p></div></div>; }
