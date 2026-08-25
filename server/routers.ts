/** Atelier fiscal moderne — contrat tRPC de l’espace comptable multi-clients. */
import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { accountRouter } from "./routers/account";
import { cabinetFinanceRouter } from "./routers/cabinet-finance";
import { clientsRouter } from "./routers/clients";
import { programSettingsRouter } from "./routers/program-settings";
import { transfersRouter } from "./routers/transfers";

export const appRouter = router({ system: systemRouter, account: accountRouter, clients: clientsRouter, cabinetFinance: cabinetFinanceRouter, transfers: transfersRouter, programSettings: programSettingsRouter });

export type AppRouter = typeof appRouter;
