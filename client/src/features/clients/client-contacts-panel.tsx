import { AppSelect } from "@/components/form/app-select";
import { emailComposeLink, normalizeAlgerianWhatsApp, phoneDialLink } from "@/features/clients/contact-links";
import { trpc } from "@/lib/trpc";
import { Mail, MessageCircle, Phone, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const contactKinds = [{ value: "Téléphone", label: "Téléphone" }, { value: "E-mail", label: "E-mail" }] as const;
type ContactKind = typeof contactKinds[number]["value"];

function placeholderFor(type: ContactKind) { return type === "E-mail" ? "adresse@exemple.dz" : "05 XX XX XX XX"; }

export function ClientContactsPanel({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const query = trpc.clients.contacts.list.useQuery({ clientId });
  const [form, setForm] = useState<{ type: ContactKind; value: string }>({ type: "Téléphone", value: "" });
  const create = trpc.clients.contacts.create.useMutation({
    onSuccess: async () => {
      setForm({ type: "Téléphone", value: "" });
      await Promise.all([utils.clients.contacts.list.invalidate({ clientId }), utils.clients.get.invalidate({ clientId })]);
    },
  });
  const add = () => { if (form.value.trim()) create.mutate({ clientId, contact: { label: "", type: form.type, value: form.value.trim(), isPrimary: false } }); };
  return <div>
    <p className="text-sm leading-6 text-[#627785]">Sélectionnez le type de coordonnée puis saisissez sa valeur. Chaque contact enregistré propose les actions adaptées, sans alourdir la fiche.</p>
    <div className="mt-4 space-y-2.5">{query.data?.map(contact => <ContactRow key={contact.id} clientId={clientId} contact={contact} />)}{!query.isLoading && !query.data?.length ? <p className="border border-dashed border-[#c9ddd6] bg-[#f7faf8] px-3 py-3 text-sm text-[#627785]">Aucun contact enregistré.</p> : null}</div>
    <div className="mt-4 grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto]">
      <AppSelect value={form.type} onValueChange={value => setForm(current => ({ ...current, type: value as ContactKind }))} options={contactKinds} />
      <input value={form.value} onChange={event => setForm(current => ({ ...current, value: event.target.value }))} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); add(); } }} className="ui-input" placeholder={placeholderFor(form.type)} aria-label="Coordonnée du contact" />
      <button type="button" onClick={add} disabled={create.isPending || !form.value.trim()} className="ui-action justify-center disabled:opacity-60">{create.isPending ? "Ajout…" : "Ajouter"}</button>
    </div>
  </div>;
}

function ContactRow({ clientId, contact }: { clientId: number; contact: { id: number; type: string; value: string } }) {
  const utils = trpc.useUtils();
  const initialType: ContactKind = contact.type === "E-mail" ? "E-mail" : "Téléphone";
  const [form, setForm] = useState({ type: initialType, value: contact.value });
  const update = trpc.clients.contacts.update.useMutation({ onSuccess: async () => { await Promise.all([utils.clients.contacts.list.invalidate({ clientId }), utils.clients.get.invalidate({ clientId })]); } });
  const archive = trpc.clients.contacts.archive.useMutation({ onSuccess: async () => { await utils.clients.contacts.list.invalidate({ clientId }); } });
  useEffect(() => setForm({ type: contact.type === "E-mail" ? "E-mail" : "Téléphone", value: contact.value }), [contact.id, contact.type, contact.value]);
  const dial = form.type === "Téléphone" ? phoneDialLink(form.value) : "";
  const sms = dial ? `sms:${dial.slice(4)}` : "";
  const whatsapp = form.type === "Téléphone" ? normalizeAlgerianWhatsApp(form.value) : "";
  const email = form.type === "E-mail" ? emailComposeLink(form.value) : "";
  const save = () => { if (form.value.trim()) update.mutate({ id: contact.id, clientId, contact: { label: "", type: form.type, value: form.value.trim(), isPrimary: false } }); };
  return <div className="border border-[#dce7e3] bg-white p-2.5 sm:flex sm:items-center sm:gap-2">
    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <AppSelect value={form.type} onValueChange={value => setForm(current => ({ ...current, type: value as ContactKind }))} options={contactKinds} />
      <input value={form.value} onChange={event => setForm(current => ({ ...current, value: event.target.value }))} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); save(); } }} className="ui-input" placeholder={placeholderFor(form.type)} aria-label={`Coordonnée ${form.type}`} />
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#edf1f0] pt-2 sm:mt-0 sm:border-t-0 sm:pt-0">
      {dial ? <ContactAction href={dial} label="Appeler"><Phone size={15} /></ContactAction> : null}
      {sms ? <ContactAction href={sms} label="Envoyer un SMS"><MessageCircle size={15} /></ContactAction> : null}
      {whatsapp ? <ContactAction href={`https://wa.me/${whatsapp}`} label="Ouvrir WhatsApp" external><MessageCircle size={15} /></ContactAction> : null}
      {email ? <ContactAction href={email} label="Envoyer un e-mail"><Mail size={15} /></ContactAction> : null}
      <button type="button" onClick={save} disabled={update.isPending || !form.value.trim()} className="contact-action" aria-label="Enregistrer ce contact" title="Enregistrer"><Save size={15} /></button>
      <button type="button" onClick={() => archive.mutate({ id: contact.id, clientId })} disabled={archive.isPending} className="contact-action contact-action--danger" aria-label="Archiver ce contact" title="Archiver"><Trash2 size={15} /></button>
    </div>
  </div>;
}

function ContactAction({ href, label, external = false, children }: { href: string; label: string; external?: boolean; children: React.ReactNode }) {
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="contact-action" aria-label={label} title={label}>{children}</a>;
}
