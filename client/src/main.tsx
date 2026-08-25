/** Atelier fiscal moderne — point d’entrée tRPC avec cache hors connexion et session serveur HttpOnly. */
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const bootShell = document.getElementById("app-boot-shell");
const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
const bootObserver = new MutationObserver(() => {
  if (!rootElement.children.length) return;
  window.requestAnimationFrame(() => bootShell?.remove());
  bootObserver.disconnect();
});
bootObserver.observe(rootElement, { childList: true });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.DEV) {
      // Évite que le preview Vite conserve des modules de développement obsolètes entre deux versions.
      navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map(registration => registration.unregister()))).catch(() => undefined);
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(registration => registration.update()).catch(() => undefined);
  });
}
