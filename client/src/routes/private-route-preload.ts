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
export const loadProgramSettingsPage = cachedModule(() => import("@/features/program-settings/program-settings-page").then(module => ({ default: module.ProgramSettingsPage })));
export const loadNewClientPage = cachedModule(() => import("@/features/clients/new-client-page").then(module => ({ default: module.NewClientPage })));
export const loadClientsPage = cachedModule(() => import("@/pages/clients-pages").then(module => ({ default: module.ClientsPage })));
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
export const loadPasswordVaultPage = cachedModule(() => import("@/pages/password-vault-page").then(module => ({ default: module.PasswordVaultPage })));

/** Centre d’enregistrement des imports différés et des chemins privés autorisés. */
export const privateRouteManifest = [
  { matches: (path: string) => path.startsWith("/dashboard"), loader: loadDashboardPage, warm: true },
  { matches: (path: string) => path === "/clients/nouveau", loader: loadNewClientPage, warm: true },
  { matches: (path: string) => path.startsWith("/clients/"), loader: loadClientFichePage, warm: false },
  { matches: (path: string) => path.startsWith("/clients"), loader: loadClientsPage, warm: true },
  { matches: (path: string) => path.startsWith("/transferts"), loader: loadTransfersPage, warm: true },
  { matches: (path: string) => path.startsWith("/finances"), loader: loadCabinetFinancePage, warm: true },
  { matches: (path: string) => path.startsWith("/archives"), loader: loadArchivesPage, warm: true },
  { matches: (path: string) => path.startsWith("/coffre"), loader: loadPasswordVaultPage, warm: true },
  { matches: (path: string) => path.startsWith("/reglages"), loader: loadProgramSettingsPage, warm: true },
  { matches: (path: string) => path.startsWith("/compte"), loader: loadAccountPage, warm: true },
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
    const warmPaths = ["/dashboard", "/clients/nouveau", "/clients", "/transferts", "/finances", "/archives", "/coffre", "/reglages", "/compte"];
    warmPaths.forEach(path => void preloadPrivateRoute(path));
  };
  if (typeof window === "undefined") return;
  const requestIdleCallback = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
  if (requestIdleCallback) requestIdleCallback(schedule, { timeout: 700 });
  else window.setTimeout(schedule, 400);
}
