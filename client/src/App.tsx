/** Atelier fiscal moderne — routes publiques, authentification et espaces privés par client. */
import { Route, Switch } from "wouter";
import { type ComponentType, type ReactNode, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import { WorkspaceLayout } from "./components/workspace-layout";
import { LoginPage, LandingPage, RegisterPage } from "./pages/auth-pages";
import { type CachedModule, loadAccountPage, loadClientCasesPage, loadClientCashPage, loadClientCompliancePage, loadClientDocumentsPage, loadClientFichePage, loadClientPaymentsPage, loadClientPrintPage, loadClientsPage, loadDashboardPage, loadNewClientPage, loadTransfersPage } from "./routes/private-route-preload";

function preloadedRoute<Props extends object>(loader: CachedModule<{ default: ComponentType<Props> }>) {
  return function PreloadedRoute(props: Props) {
    const [Component, setComponent] = useState<ComponentType<Props> | undefined>(() => loader.get()?.default);
    useEffect(() => { if (!Component) void loader().then(module => setComponent(() => module.default)); }, [Component]);
    if (!Component) return <div className="min-h-screen bg-[#f6f5f0] p-8 text-sm text-[#627785]" aria-busy="true">Préparation de votre espace…</div>;
    return <Component {...props} />;
  };
}

const AccountPage = preloadedRoute(loadAccountPage);
const NewClientPage = preloadedRoute(loadNewClientPage);
const ClientsPage = preloadedRoute(loadClientsPage);
const ClientFichePage = preloadedRoute(loadClientFichePage);
const ClientDocumentsPage = preloadedRoute(loadClientDocumentsPage);
const ClientCompliancePage = preloadedRoute(loadClientCompliancePage);
const ClientCasesPage = preloadedRoute(loadClientCasesPage);
const ClientPaymentsPage = preloadedRoute(loadClientPaymentsPage);
const ClientCashPage = preloadedRoute(loadClientCashPage);
const ClientPrintPage = preloadedRoute(loadClientPrintPage);
const DashboardPage = preloadedRoute(loadDashboardPage);
const TransfersPage = preloadedRoute(loadTransfersPage);

function ClientRoute({ clientId, children }: { clientId: number; children: ReactNode }) {
  const { loading, user } = useAuth({ redirectOnUnauthenticated: true });
  const query = trpc.clients.get.useQuery({ clientId }, { enabled: Boolean(user) && Number.isInteger(clientId) && clientId > 0 });
  if (loading || query.isLoading) return <WorkspaceLayout><p className="text-sm text-[#627785]">Chargement du dossier sécurisé…</p></WorkspaceLayout>;
  if (query.error || !query.data) return <WorkspaceLayout><div className="mx-auto max-w-xl rounded-xl border border-[#d5dfdc] bg-white p-8 text-center"><p className="font-serif text-3xl text-[#102a43]">Dossier indisponible</p><p className="mt-3 text-sm leading-6 text-[#627785]">Ce dossier est introuvable ou n’est pas rattaché au compte connecté.</p><a href="/clients" className="mt-6 inline-flex rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-bold text-white">Retour aux dossiers</a></div></WorkspaceLayout>;
  return <>{children}</>;
}

function Router() {
  return <Switch>
    <Route path="/" component={LandingPage} />
    <Route path="/connexion" component={LoginPage} />
    <Route path="/creer-un-compte" component={RegisterPage} />
    <Route path="/dashboard" component={DashboardPage} />
    <Route path="/clients/nouveau" component={NewClientPage} />
    <Route path="/clients" component={ClientsPage} />
    <Route path="/clients/:clientId/fiche">{params => <ClientRoute clientId={Number(params.clientId)}><ClientFichePage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/documents">{params => <ClientRoute clientId={Number(params.clientId)}><ClientDocumentsPage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/conformite">{params => <ClientRoute clientId={Number(params.clientId)}><ClientCompliancePage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/dossiers">{params => <ClientRoute clientId={Number(params.clientId)}><ClientCasesPage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/paiements">{params => <ClientRoute clientId={Number(params.clientId)}><ClientPaymentsPage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/caisse">{params => <ClientRoute clientId={Number(params.clientId)}><ClientCashPage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/impression">{params => <ClientRoute clientId={Number(params.clientId)}><ClientPrintPage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/transferts" component={TransfersPage} />
    <Route path="/compte" component={AccountPage} />
    <Route>{() => <LandingPage />}</Route>
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><Router /></ThemeProvider></ErrorBoundary>;
}
