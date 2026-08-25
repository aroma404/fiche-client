import { BrandSymbol } from "@/components/local-visuals";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, LockKeyhole, Users } from "lucide-react";
import { type FormEvent, startTransition, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { preloadPrivateRoute, prewarmCorePrivateRoutes } from "@/routes/private-route-preload";

function PublicFrame({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f6f5f0] text-[#102a43]"><header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/" className="flex items-center gap-3"><BrandSymbol className="h-11 w-11 rounded-lg bg-white p-1 shadow-sm" /><div><p className="font-serif text-xl">Fiche Client</p><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">Atelier fiscal</p></div></Link><div className="flex items-center gap-3"><Link href="/connexion" className="text-sm font-bold text-[#526775] hover:text-[#0f766e]">Connexion</Link><Link href="/creer-un-compte" className="rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-bold text-white hover:bg-[#0b625d]">Créer un compte</Link></div></header>{children}</div>;
}

export function LandingPage() {
  return <PublicFrame><main className="mx-auto max-w-7xl px-5 pb-16 pt-10 lg:pt-20"><section className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#0f766e]">Bureau comptable organisé</p><h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.02] text-[#102a43] sm:text-6xl">Vos dossiers clients, séparés et prêts à imprimer.</h1><p className="mt-6 max-w-xl text-base leading-7 text-[#627785]">Créez votre compte, gérez plusieurs clients en même temps, sécurisez les accès et exportez uniquement les données de votre bureau.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/creer-un-compte" className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-5 py-3 font-bold text-white hover:bg-[#0b625d]">Commencer maintenant <ArrowRight size={17} /></Link><Link href="/connexion" className="rounded-lg border border-[#cfdad7] bg-white px-5 py-3 font-bold text-[#102a43] hover:border-[#0f766e]">Se connecter</Link></div></div><div className="relative overflow-hidden rounded-[1.5rem] border border-[#d6e0dd] bg-[#e5efea] p-8 shadow-[0_18px_45px_rgba(16,42,67,0.08)]"><div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#0f766e]/15" /><div className="relative"><div className="rounded-xl border border-[#d3ddd8] bg-white p-5"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#0f766e]">Dossiers actifs</p><div className="mt-5 space-y-3">{["Client A · Documents à vérifier", "Client B · Solde mis à jour", "Client C · Prêt pour impression"].map((item, index) => <div key={item} className="flex items-center justify-between rounded-lg border border-[#e5ece9] px-3 py-3"><span className="text-sm font-bold">{item}</span><span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[#c99a3e]" : "bg-[#0f766e]"}`} /></div>)}</div></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-lg bg-[#102a43] p-4 text-white"><Users size={18} /><p className="mt-5 text-2xl font-extrabold">Plusieurs</p><p className="mt-1 text-xs text-[#cfdde2]">clients par compte</p></div><div className="rounded-lg bg-[#fff7df] p-4 text-[#795b1d]"><LockKeyhole size={18} /><p className="mt-5 text-2xl font-extrabold">Isolé</p><p className="mt-1 text-xs">par compte connecté</p></div></div></div></div></section><section className="mt-14 grid gap-4 md:grid-cols-3">{[["Un compte, plusieurs clients", "Chaque dossier est séparé, filtré et imprimable individuellement."], ["Import et export contrôlés", "JSON ou Excel, pour un client, une sélection ou l’ensemble de votre compte."], ["Accès sécurisé", "Une session protégée, un espace privé et aucune visibilité sur les autres comptes."]].map(([title, body]) => <div key={title} className="rounded-xl border border-[#d5dfdc] bg-white p-5"><CheckCircle2 className="text-[#0f766e]" size={19} /><h2 className="mt-4 font-serif text-2xl">{title}</h2><p className="mt-2 text-sm leading-6 text-[#627785]">{body}</p></div>)}</section></main></PublicFrame>;
}

function UsageConvention({ compact = false }: { compact?: boolean }) {
  const text = "Les dossiers sont visibles uniquement depuis le compte auquel ils sont rattachés. Les contrôles de propriété sont appliqués côté serveur pour la consultation, la modification, l’archivage, l’import et l’export. Ne saisissez que les informations nécessaires et conservez les exports dans un emplacement protégé.";
  if (!compact) return <div className="rounded-xl border border-[#c8ddd7] bg-[#f1f8f4] p-4 text-xs leading-5 text-[#426c62]"><p className="font-extrabold text-[#102a43]">Convention d’utilisation et confidentialité</p><p className="mt-2">{text}</p></div>;
  return <details className="rounded-lg border border-[#d5dfdc] bg-[#fafcfb] px-3 py-2.5 text-xs leading-5 text-[#627785]"><summary className="cursor-pointer font-bold text-[#0f766e] marker:text-[#0f766e]">Convention d’utilisation</summary><p className="mt-2 pr-1">{text}</p></details>;
}

function AuthCard({ mode }: { mode: "login" | "register" }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const register = trpc.account.register.useMutation();
  const login = trpc.account.login.useMutation();
  const pending = register.isPending || login.isPending;
  const isRegister = mode === "register";

  useEffect(() => { void preloadPrivateRoute("/dashboard"); prewarmCorePrivateRoutes(); }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    const mark = `fiche-auth-${Date.now()}`;
    performance.mark(`${mark}-start`);
    try {
      if (isRegister && !acceptTerms) throw new Error("Vous devez accepter la convention d’utilisation.");
      const account = isRegister ? await register.mutateAsync({ fullName, email, password, acceptTerms: true, rememberMe }) : await login.mutateAsync({ email, password, rememberMe });
      await preloadPrivateRoute("/dashboard");
      performance.mark(`${mark}-ready`);
      performance.measure("fiche:auth-mutation", `${mark}-start`, `${mark}-ready`);
      utils.account.me.setData(undefined, account);
      startTransition(() => setLocation("/dashboard"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Une erreur est survenue."); }
  };

  return <PublicFrame><main className="mx-auto grid min-h-[calc(100vh-84px)] max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[.9fr_1.1fr]"><div className="hidden lg:block"><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">Espace privé</p><h1 className="mt-3 font-serif text-5xl leading-tight">{isRegister ? "Créez l’espace de votre bureau." : "Retrouvez vos dossiers clients."}</h1><p className="mt-5 max-w-md leading-7 text-[#627785]">{isRegister ? "Votre compte isole vos clients, vos documents, vos paiements et vos exports." : "Connectez-vous pour accéder uniquement aux dossiers rattachés à votre compte."}</p></div><section className="rounded-[1.35rem] border border-[#d5dfdc] bg-white p-6 shadow-[0_18px_45px_rgba(16,42,67,0.07)] sm:p-8"><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f766e]">{isRegister ? "Création de compte" : "Connexion"}</p><h2 className="mt-2 font-serif text-4xl">{isRegister ? "Créer un compte" : "Bienvenue"}</h2><p className="mt-3 text-sm leading-6 text-[#627785]">{isRegister ? "Commencez avec votre nom complet, votre e-mail et un mot de passe sécurisé." : "Saisissez vos identifiants pour ouvrir votre espace."}</p><form onSubmit={submit} className="mt-7 space-y-4">{isRegister ? <label className="block text-sm font-bold">Nom complet<input value={fullName} onChange={event => setFullName(event.target.value)} required className="mt-2 h-11 w-full rounded-lg border border-[#d5dfdc] px-3 font-normal outline-none focus:border-[#0f766e]" placeholder="Nom et prénom" /></label> : null}<label className="block text-sm font-bold">E-mail<input value={email} onChange={event => setEmail(event.target.value)} required type="email" className="mt-2 h-11 w-full rounded-lg border border-[#d5dfdc] px-3 font-normal outline-none focus:border-[#0f766e]" placeholder="nom@cabinet.dz" /></label><label className="block text-sm font-bold">Mot de passe<input value={password} onChange={event => setPassword(event.target.value)} required type="password" minLength={isRegister ? 10 : 1} className="mt-2 h-11 w-full rounded-lg border border-[#d5dfdc] px-3 font-normal outline-none focus:border-[#0f766e]" placeholder={isRegister ? "10 caractères minimum" : "Votre mot de passe"} /></label>{isRegister ? <><UsageConvention /><label className="flex cursor-pointer items-start gap-2 text-xs font-bold text-[#30505d]"><input checked={acceptTerms} onChange={event => setAcceptTerms(event.target.checked)} type="checkbox" className="mt-0.5 accent-[#0f766e]" />J’accepte la convention d’utilisation et de confidentialité.</label></> : null}<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#526775]"><input checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} type="checkbox" className="accent-[#0f766e]" />Se souvenir de moi <span className="text-xs font-normal text-[#78909a]">(sinon, session de 5 min et fermée avec le navigateur)</span></label><UsageConvention compact />{error ? <p role="alert" className="rounded-lg bg-[#fff2ef] p-3 text-sm font-semibold text-[#a1433d]">{error}</p> : null}<button disabled={pending || (isRegister && !acceptTerms)} className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0f766e] font-bold text-white hover:bg-[#0b625d] disabled:opacity-60">{pending ? "Traitement…" : isRegister ? "Créer mon compte" : "Se connecter"}<ArrowRight size={17} /></button></form><p className="mt-6 text-center text-sm text-[#627785]">{isRegister ? "Vous avez déjà un compte ?" : "Vous n’avez pas encore de compte ?"} <Link href={isRegister ? "/connexion" : "/creer-un-compte"} className="font-bold text-[#0f766e]">{isRegister ? "Connexion" : "Créer un compte"}</Link></p></section></main></PublicFrame>;
}

export function LoginPage() { return <AuthCard mode="login" />; }
export function RegisterPage() { return <AuthCard mode="register" />; }
