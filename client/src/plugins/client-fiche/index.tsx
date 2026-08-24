/** Atelier fiscal moderne — fiche principale : informations structurées, sans données persistées. */

import { CheckCircle2, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { Field } from "@/components/field";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/core/session-store";

const legalForms = ["Personne physique", "Entreprise individuelle", "EURL", "SARL", "Autre"];
const clientTypes = ["Particulier", "Professionnel", "Société", "Association"];

export default function FichePlugin() {
  const { state, dispatch } = useSession();
  const setField = (scope: "general" | "fiscal", field: string, value: string) => dispatch({ type: "FIELD", scope, field, value });
  const entered = Object.values({ ...state.general, ...state.fiscal }).filter(Boolean).length;

  return <div>
    <PageHeader eyebrow="Fiche de travail" title="Informations client et fiscales" description="Renseignez seulement les éléments nécessaires au dossier de la session. Les cellules de ce formulaire ne sont pas enregistrées après rechargement." actions={<div className="flex items-center gap-2 rounded-full bg-[#e6f2ee] px-3 py-2 text-xs font-bold text-[#0f5d57]"><CheckCircle2 size={15} /> {entered} champs renseignés</div>} />
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title="1. Informations générales" hint="Point de départ du dossier temporaire."><div className="grid gap-4 sm:grid-cols-2"><Field label="Raison sociale / Nom" value={state.general.raisonSociale} onChange={(value) => setField("general", "raisonSociale", value)} placeholder="À renseigner" /><Field label="Activité" value={state.general.activite} onChange={(value) => setField("general", "activite", value)} placeholder="Ex. prestations de services" /><SelectField label="Forme juridique" value={state.general.formeJuridique} options={legalForms} onChange={(value) => setField("general", "formeJuridique", value)} /><SelectField label="Type de client" value={state.general.typeClient} options={clientTypes} onChange={(value) => setField("general", "typeClient", value)} /><SelectField label="Statut" value={state.general.statut} options={["Actif", "À vérifier", "Suspendu"]} onChange={(value) => setField("general", "statut", value)} /><Field label="Commune" value={state.general.commune} onChange={(value) => setField("general", "commune", value)} placeholder="À renseigner" /></div></SectionCard>
      <SectionCard title="2. Références fiscales et juridiques" hint="Champs de suivi : vérifiez leur exactitude avant impression."><div className="grid gap-4 sm:grid-cols-2"><Field label="NIF" value={state.fiscal.nif} onChange={(value) => setField("fiscal", "nif", value)} placeholder="À renseigner" /><Field label="N° RC" value={state.fiscal.rc} onChange={(value) => setField("fiscal", "rc", value)} placeholder="À renseigner" /><Field label="BP" value={state.fiscal.bp} onChange={(value) => setField("fiscal", "bp", value)} placeholder="À renseigner" /><Field label="Article d’imposition" value={state.fiscal.articleImposition} onChange={(value) => setField("fiscal", "articleImposition", value)} placeholder="À renseigner" /><Field label="NIN" value={state.fiscal.nin} onChange={(value) => setField("fiscal", "nin", value)} placeholder="À renseigner" /><SelectField label="Régime" value={state.fiscal.regime} options={["Principal", "Secondaire", "À confirmer"]} onChange={(value) => setField("fiscal", "regime", value)} /></div></SectionCard>
      <SectionCard title="3. Contact de travail" hint="Ne saisissez pas d’identifiants confidentiels ni de mots de passe."><div className="grid gap-4 sm:grid-cols-2"><Field label="Contact / mobile" value={state.general.contact} onChange={(value) => setField("general", "contact", value)} placeholder="À renseigner" /><div className="rounded-xl border border-dashed border-[#bcd0ca] bg-[#f5faf8] p-4"><div className="flex items-center gap-2 text-[#0f766e]"><FilePlus2 size={16} /><p className="text-xs font-extrabold">Accès et pièces numériques</p></div><p className="mt-2 text-xs leading-5 text-[#5c7475]">Ne conservez aucun mot de passe dans cette fiche. Pour un accès externe, utilisez seulement l’état « accès vérifié » dans les documents.</p></div></div></SectionCard>
      <SectionCard title="4. Observations" hint="Ajoutez une note de travail destinée à l’impression temporaire."><Textarea value={state.observations} onChange={(event) => dispatch({ type: "OBSERVATIONS", value: event.target.value })} placeholder="Observation générale, élément à vérifier ou consigne de transmission…" className="min-h-32 resize-none border-[#d7e0df] bg-[#fbfcfa] text-sm focus-visible:ring-[#0f766e]" /></SectionCard>
      <SectionCard title="Prêt pour la suite" hint="Continuez avec la checklist des documents."><div className="flex h-full flex-col justify-between gap-6 rounded-xl bg-[#102a43] p-5 text-white"><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#91d0c2]">Étape suivante</p><h3 className="mt-3 font-serif text-3xl leading-tight">Vérifier les justificatifs du dossier.</h3><p className="mt-3 text-xs leading-5 text-[#c7d5df]">Le suivi documentaire permet d’indiquer les pièces reçues, à demander ou à vérifier.</p></div><Button asChild className="w-fit bg-[#dff3eb] text-[#0f5d57] hover:bg-white"><a href="/documents">Ouvrir les documents</a></Button></div></SectionCard>
    </div>
  </div>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#526775]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border border-[#d7e0df] bg-[#fbfcfa] px-3 text-sm text-[#102a43] outline-none focus:ring-2 focus:ring-[#0f766e]">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
