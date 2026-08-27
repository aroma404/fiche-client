/** Atelier fiscal moderne — contrat tRPC de l’espace comptable multi-clients. */
import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { accountRouter } from "./routers/account";
import { archiveControlRouter } from "./routers/archive-control";
import { cabinetFinanceRouter } from "./routers/cabinet-finance";
import { clientsRouter } from "./routers/clients";
import { programSettingsRouter } from "./routers/program-settings";
import { passwordVaultRouter } from "./routers/password-vault";
import { transfersRouter } from "./routers/transfers";

export const appRouter = router({ system: systemRouter, account: accountRouter, archives: archiveControlRouter, clients: clientsRouter, cabinetFinance: cabinetFinanceRouter, transfers: transfersRouter, programSettings: programSettingsRouter, passwordVault: passwordVaultRouter });

export type AppRouter = typeof appRouter;
