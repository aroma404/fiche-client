import { describe, expect, it } from "vitest";
import { getPrivateRouteLoader, loadAccountPage, loadCabinetFinancePage, loadClientFichePage, loadClientsPage, loadDashboardPage, loadNewClientPage, loadProgramSettingsPage, loadTransfersPage } from "./private-route-preload";

describe("préchargement des routes privées", () => {
  it("associe chaque destination privée à son module différé", () => {
    expect(getPrivateRouteLoader("/dashboard")).toBe(loadDashboardPage);
    expect(getPrivateRouteLoader("/clients")).toBe(loadClientsPage);
    expect(getPrivateRouteLoader("/clients/nouveau")).toBe(loadNewClientPage);
    expect(getPrivateRouteLoader("/clients/42/fiche")).toBe(loadClientFichePage);
    expect(getPrivateRouteLoader("/transferts")).toBe(loadTransfersPage);
    expect(getPrivateRouteLoader("/finances")).toBe(loadCabinetFinancePage);
    expect(getPrivateRouteLoader("/reglages")).toBe(loadProgramSettingsPage);
    expect(getPrivateRouteLoader("/compte")).toBe(loadAccountPage);
    expect(getPrivateRouteLoader("/connexion")).toBeUndefined();
  });
});
