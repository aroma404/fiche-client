/** Préchargement contrôlé des modules privés : accélère la navigation sans exposer de données ni contourner l’authentification. */

export type CachedModule<T> = (() => Promise<T>) & { get: () => T | undefined };

function cachedModule<T>(load: () => Promise<T>): CachedModule<T> {
  let promise: Promise<T> | undefined;
  let resolved: T | undefined;
  const cached = (() => (promise ??= load().then(module => (resolved = module)))) as CachedModule<T>;
  cached.get = () => resolved;
  return cached;
}

export const loadAccountPage = cachedModule(() => import("@/pages/account-page").then(module => ({ default: module.AccountPage })));
export const loadNewClientPage = cachedModule(() => import("@/features/clients/new-client-page").then(module => ({ default: module.NewClientPage })));
export const loadClientsPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientsPage })));
export const loadClientFichePage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientFichePage })));
export const loadClientDocumentsPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientDocumentsPage })));
export const loadClientCompliancePage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientCompliancePage })));
export const loadClientCasesPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientCasesPage })));
export const loadClientPaymentsPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientPaymentsPage })));
export const loadClientCashPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientCashPage })));
export const loadClientPrintPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientPrintPage })));
export const loadDashboardPage = cachedModule(() => import("@/pages/dashboard-page").then(module => ({ default: module.DashboardPage })));
export const loadTransfersPage = cachedModule(() => import("@/pages/transfers-page").then(module => ({ default: module.TransfersPage })));

export function getPrivateRouteLoader(path: string) {
  if (path.startsWith("/dashboard")) return loadDashboardPage;
  if (path === "/clients/nouveau") return loadNewClientPage;
  if (path.startsWith("/clients/")) return loadClientFichePage;
  if (path.startsWith("/clients")) return loadClientsPage;
  if (path.startsWith("/transferts")) return loadTransfersPage;
  if (path.startsWith("/compte")) return loadAccountPage;
  return undefined;
}

export function preloadPrivateRoute(path: string) {
  return getPrivateRouteLoader(path)?.().catch(() => undefined) ?? Promise.resolve(undefined);
}

export function prewarmCorePrivateRoutes() {
  void preloadPrivateRoute("/dashboard");
  const schedule = () => {
    void preloadPrivateRoute("/clients");
    void preloadPrivateRoute("/compte");
    void preloadPrivateRoute("/clients/nouveau");
    void preloadPrivateRoute("/transferts");
  };
  if (typeof window === "undefined") return;
  const requestIdleCallback = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
  if (requestIdleCallback) requestIdleCallback(schedule, { timeout: 700 });
  else window.setTimeout(schedule, 400);
}
