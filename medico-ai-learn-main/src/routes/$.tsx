import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// Catch-all client-only route: the ported app uses BrowserRouter internally,
// so we hand the entire URL space to <App />. ssr:false because the app
// relies on Supabase session in localStorage and on browser-only APIs.
const App = lazy(() => import("../App"));

export const Route = createFileRoute("/$")({
  ssr: false,
  component: AppShell,
});

function AppShell() {
  return (
    <Suspense fallback={null}>
      <App />
    </Suspense>
  );
}
