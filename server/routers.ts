/** Atelier fiscal moderne — contrat tRPC de l’espace comptable multi-clients. */
import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { accountRouter } from "./routers/account";
import { clientsRouter } from "./routers/clients";
import { transfersRouter } from "./routers/transfers";

export const appRouter = router({ system: systemRouter, account: accountRouter, clients: clientsRouter, transfers: transfersRouter });

export type AppRouter = typeof appRouter;
