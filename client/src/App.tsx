/** Atelier fiscal moderne — routes publiques, authentification et espaces privés par client. */
import { Route, Switch, useLocation } from "wouter";
import { type ComponentType, type ReactNode, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import { WorkspaceLayout } from "./components/workspace-layout";
import { PrivateWorkspaceSkeleton } from "./components/private-workspace-skeleton";
import { LoginPage, LandingPage, RegisterPage } from "./pages/auth-pages";
import { UsageConventionPage } from "./pages/usage-convention-page";
import { type CachedModule, loadAccountPage, loadArchivesPage, loadCabinetFinancePage, loadClientCompliancePage, loadClientDocumentsPage, loadClientFichePage, loadClientPasswordVaultPage, loadClientPaymentsPage, loadClientPrintPage, loadClientsPage, loadDashboardPage, loadNewClientPage, loadProgramSettingsPage, loadTransfersPage } from "./routes/private-route-preload";

function preloadedRoute<Props extends object>(loader: CachedModule<{ default: ComponentType<Props> }>) {
  return function PreloadedRoute(props: Props) {
    const [Component, setComponent] = useState<ComponentType<Props> | undefined>(() => loader.get()?.default);
    useEffect(() => { if (!Component) void loader().then(module => setComponent(() => module.default)); }, [Component]);
    if (!Component) return <PrivateWorkspaceSkeleton />;
    return <Component {...props} />;
  };
}

const AccountPage = preloadedRoute(loadAccountPage);
const ProgramSettingsPage = preloadedRoute(loadProgramSettingsPage);
const NewClientPage = preloadedRoute(loadNewClientPage);
const ClientsPage = preloadedRoute(loadClientsPage);
const ClientFichePage = preloadedRoute(loadClientFichePage);
const ClientDocumentsPage = preloadedRoute(loadClientDocumentsPage);
const ClientCompliancePage = preloadedRoute(loadClientCompliancePage);
const ClientPaymentsPage = preloadedRoute(loadClientPaymentsPage);
const ClientPrintPage = preloadedRoute(loadClientPrintPage);
const DashboardPage = preloadedRoute(loadDashboardPage);
const TransfersPage = preloadedRoute(loadTransfersPage);
const CabinetFinancePage = preloadedRoute(loadCabinetFinancePage);
const ArchivesPage = preloadedRoute(loadArchivesPage);
const ClientPasswordVaultPage = preloadedRoute(loadClientPasswordVaultPage);

function ClientRoute({ clientId, children }: { clientId: number; children: ReactNode }) {
  const { loading, user } = useAuth({ redirectOnUnauthenticated: true });
  const query = trpc.clients.get.useQuery({ clientId }, { enabled: Boolean(user) && Number.isInteger(clientId) && clientId > 0 });
  if (loading || query.isLoading) return <WorkspaceLayout><div className="mx-auto max-w-5xl space-y-6" aria-busy="true"><div className="h-4 w-28 rounded bg-[#dfe9e5]" /><div className="h-12 w-2/5 rounded bg-[#e3ebe8]" /><div className="h-10 w-full rounded bg-[#edf2f1]" /><div className="grid gap-5 xl:grid-cols-2">{[1, 2].map(item => <div key={item} className="h-64 rounded-xl border border-[#d5dfdc] bg-white/75" />)}</div></div></WorkspaceLayout>;
  if (query.error || !query.data) return <WorkspaceLayout><div className="mx-auto max-w-xl rounded-xl border border-[#d5dfdc] bg-white p-8 text-center"><p className="font-serif text-3xl text-[#102a43]">Dossier indisponible</p><p className="mt-3 text-sm leading-6 text-[#627785]">Ce dossier est introuvable ou n’est pas rattaché au compte connecté.</p><a href="/clients" className="mt-6 inline-flex rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-bold text-white">Retour aux dossiers</a></div></WorkspaceLayout>;
  return <>{children}</>;
}

function Router() {
  return <Switch>
    <Route path="/" component={LandingPage} />
    <Route path="/connexion" component={LoginPage} />
    <Route path="/creer-un-compte" component={RegisterPage} />
    <Route path="/convention-utilisation" component={UsageConventionPage} />
    <Route path="/dashboard" component={DashboardPage} />
    <Route path="/clients/nouveau" component={NewClientPage} />
    <Route path="/clients" component={ClientsPage} />
    <Route path="/clients/:clientId/fiche">{params => <ClientRoute clientId={Number(params.clientId)}><ClientFichePage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/documents">{params => <ClientRoute clientId={Number(params.clientId)}><ClientDocumentsPage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/conformite">{params => <ClientRoute clientId={Number(params.clientId)}><ClientCompliancePage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/paiements">{params => <ClientRoute clientId={Number(params.clientId)}><ClientPaymentsPage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/coffre">{params => <ClientRoute clientId={Number(params.clientId)}><ClientPasswordVaultPage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/clients/:clientId/impression">{params => <ClientRoute clientId={Number(params.clientId)}><ClientPrintPage clientId={Number(params.clientId)} /></ClientRoute>}</Route>
    <Route path="/transferts" component={TransfersPage} />
    <Route path="/finances" component={CabinetFinancePage} />
    <Route path="/archives" component={ArchivesPage} />
    <Route path="/reglages" component={ProgramSettingsPage} />
    <Route path="/compte" component={AccountPage} />
    <Route>{() => <LandingPage />}</Route>
  </Switch>;
}

function SessionWarmup() {
  const [location] = useLocation();
  const isPrivateRoute = location === "/dashboard" || location === "/clients" || location.startsWith("/clients/") || location === "/finances" || location === "/archives" || location === "/transferts" || location === "/reglages" || location === "/compte";
  trpc.account.me.useQuery(undefined, { enabled: isPrivateRoute, staleTime: 60_000, retry: false, refetchOnWindowFocus: false });
  return null;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><SessionWarmup /><Router /></ThemeProvider></ErrorBoundary>;
}
