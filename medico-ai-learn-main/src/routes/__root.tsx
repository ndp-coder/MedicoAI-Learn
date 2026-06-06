import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found.</p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MedicoAI Learn — AI-Powered MBBS & BDS Study Companion" },
      { name: "description", content: "MedicoAI Learn is an AI-powered study companion for MBBS and BDS students featuring daily quizzes, spaced-repetition flashcards, clinical case studies, OSCE practice, lecture recorder, and a doubt solver tailored to your year and subjects." },
      { property: "og:title", content: "MedicoAI Learn — AI-Powered MBBS & BDS Study Companion" },
      { name: "twitter:title", content: "MedicoAI Learn — AI-Powered MBBS & BDS Study Companion" },
      { property: "og:description", content: "AI-powered study companion for MBBS and BDS students: daily quizzes, flashcards, clinical cases, OSCE practice, lecture recorder, and AI doubt solver." },
      { name: "twitter:description", content: "AI-powered study companion for MBBS and BDS students: daily quizzes, flashcards, clinical cases, OSCE practice, lecture recorder, and AI doubt solver." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b319e6b2-8fdb-425d-850a-3636584495ce/id-preview-e0686d73--79936f76-94cb-491d-a125-cdcd1c34645b.lovable.app-1780668025834.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b319e6b2-8fdb-425d-850a-3636584495ce/id-preview-e0686d73--79936f76-94cb-491d-a125-cdcd1c34645b.lovable.app-1780668025834.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { name: "google-site-verification", content: "8gFbwq-gdLVhlPnlHxqUYFRb1EGK7zKRCf3k4tO-DW0" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
