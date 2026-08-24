/** Atelier fiscal moderne — routes chargées depuis le registre de plugins. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SessionProvider } from "./core/session-store";
import { AppShell } from "./app/AppShell";
import { plugins } from "./core/plugin-registry";

function Router() {
  return (
    <AppShell>
      <Switch>
        {plugins.map(({ id, route, component: PluginPage }) => <Route key={id} path={route}>{() => <PluginPage />}</Route>)}
        <Route>{() => <div className="p-10 text-sm text-[#526775]">Cette page n’existe pas dans l’atelier fiscal.</div>}</Route>
      </Switch>
    </AppShell>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SessionProvider>
            <Toaster position="top-right" />
            <Router />
          </SessionProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
