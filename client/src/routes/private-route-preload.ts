/** Préchargement contrôlé des modules privés : accélère la navigation sans exposer de données ni contourner l’authentification. */

import { clientFeatureRegistry, privateFeatureRegistry, type ClientFeatureDefinition, type PrivateFeatureDefinition } from "@/core/registry-index";

export type CachedModule<T> = (() => Promise<T>) & { get: () => T | undefined };

function cachedModule<T>(load: () => Promise<T>): CachedModule<T> {
  let promise: Promise<T> | undefined;
  let resolved: T | undefined;
  const cached = (() => (promise ??= load().then(module => (resolved = module)))) as CachedModule<T>;
  cached.get = () => resolved;
  return cached;
}

export const loadAccountPage = cachedModule(() => import("@/pages/account-page").then(module => ({ default: module.AccountPage })));
export const loadProgramSettingsPage = cachedModule(() => import("@/features/program-settings/program-settings-page").then(module => ({ default: module.ProgramSettingsPage })));
export const loadNewClientPage = cachedModule(() => import("@/features/clients/new-client-page").then(module => ({ default: module.NewClientPage })));
export const loadClientsPage = cachedModule(() => import("@/features/clients/client-register-page").then(module => ({ default: module.ClientRegisterPage })));
export const loadClientFichePage = cachedModule(() => import("@/features/clients/client-fiche-page").then(module => ({ default: module.ClientFichePage })));
export const loadClientDocumentsPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientDocumentsPage })));
export const loadClientCompliancePage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientCompliancePage })));
export const loadClientCasesPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientCasesPage })));
export const loadClientPaymentsPage = cachedModule(() => import("@/features/clients/client-payments-page").then(module => ({ default: module.ClientPaymentsPage })));
export const loadClientCashPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientCashPage })));
export const loadClientPrintPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientPrintPage })));
export const loadDashboardPage = cachedModule(() => import("@/pages/dashboard-page").then(module => ({ default: module.DashboardPage })));
export const loadTransfersPage = cachedModule(() => import("@/pages/transfers-page").then(module => ({ default: module.TransfersPage })));
export const loadCabinetFinancePage = cachedModule(() => import("@/pages/cabinet-finance-page").then(module => ({ default: module.CabinetFinancePage })));
export const loadArchivesPage = cachedModule(() => import("@/pages/archives-page").then(module => ({ default: module.ArchivesPage })));
export const loadClientPasswordVaultPage = cachedModule(() => import("@/features/clients/client-password-vault-page").then(module => ({ default: module.ClientPasswordVaultPage })));

const mainFeatureLoaders: Record<PrivateFeatureDefinition["id"], CachedModule<{ default: React.ComponentType<any> }>> = {
  dashboard: loadDashboardPage,
  clients: loadClientsPage,
  finances: loadCabinetFinancePage,
  transfers: loadTransfersPage,
  archives: loadArchivesPage,
  settings: loadProgramSettingsPage,
  account: loadAccountPage,
};

const featureRouteManifest = privateFeatureRegistry.map(feature => ({
  matches: (path: string) => feature.id === "clients" ? path === feature.href : path === feature.href || path.startsWith(`${feature.href}/`),
  loader: mainFeatureLoaders[feature.id],
  warm: feature.prewarm,
}));

const clientFeatureLoaders: Record<ClientFeatureDefinition["slug"], CachedModule<{ default: React.ComponentType<any> }>> = {
  fiche: loadClientFichePage,
  documents: loadClientDocumentsPage,
  conformite: loadClientCompliancePage,
  paiements: loadClientPaymentsPage,
  coffre: loadClientPasswordVaultPage,
  impression: loadClientPrintPage,
};

const clientFeatureRouteManifest = clientFeatureRegistry.map(feature => ({
  matches: (path: string) => new RegExp(`^/clients/\\d+/${feature.slug}(?:/|$)`).test(path),
  loader: clientFeatureLoaders[feature.slug],
  warm: false,
}));

/** Centre d’enregistrement des imports différés et des chemins privés autorisés. */
export const privateRouteManifest = [
  { matches: (path: string) => path === "/clients/nouveau", loader: loadNewClientPage, warm: true },
  ...clientFeatureRouteManifest,
  { matches: (path: string) => path.startsWith("/clients/"), loader: loadClientFichePage, warm: false },
  ...featureRouteManifest,
] as const;

export function getPrivateRouteLoader(path: string) {
  return privateRouteManifest.find(entry => entry.matches(path))?.loader;
}

export function preloadPrivateRoute(path: string) {
  return getPrivateRouteLoader(path)?.().catch(() => undefined) ?? Promise.resolve(undefined);
}

export function prewarmCorePrivateRoutes() {
  void preloadPrivateRoute("/dashboard");
  const schedule = () => {
    const warmPaths = ["/clients/nouveau", "/compte", ...privateFeatureRegistry.filter(feature => feature.prewarm).map(feature => feature.href)];
    warmPaths.forEach(path => void preloadPrivateRoute(path));
  };
  if (typeof window === "undefined") return;
  const requestIdleCallback = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
  if (requestIdleCallback) requestIdleCallback(schedule, { timeout: 700 });
  else window.setTimeout(schedule, 400);
}
