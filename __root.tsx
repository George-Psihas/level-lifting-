import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useAuth } from "@/lib/use-auth";
import titleScreen from "@/assets/title-screen.png";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  if (typeof window !== "undefined" && window.location.pathname === "/index") {
    return <IndexAlias />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md text-center px-8 py-10">
        <p className="hud-chip mb-4">SIGNAL LOST</p>
        <h1 className="text-7xl font-bold neon-text">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This zone doesn't exist in the arena.
        </p>
        <Link to="/" className="btn-primary mt-6">Return to base</Link>
      </div>
    </div>
  );
}

function IndexAlias() {
  const { user, loading } = useAuth();

  if (!loading && user && typeof window !== "undefined") {
    window.location.replace("/dashboard");
    return null;
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      <img
        src={titleScreen}
        alt="Level Lifting — Level up your lifts"
        className="absolute inset-0 h-full w-full object-contain object-center select-none"
        draggable={false}
      />
      <div className="absolute inset-x-0 bottom-0 pb-10 sm:pb-14 flex flex-col items-center gap-3 z-10">
        <Link to="/auth" className="btn-primary px-10 py-3 text-base tracking-wider uppercase">
          Enter
        </Link>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/60">Tap to begin</p>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md text-center px-8 py-10">
        <p className="hud-chip ember-text mb-4" style={{ borderColor: "oklch(0.72 0.21 40 / 0.4)" }}>SYSTEM FAULT</p>
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head back to base.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button className="btn-primary" onClick={() => { router.invalidate(); reset(); }}>Retry</button>
          <a href="/" className="btn-ghost">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#000000" },
      { name: "apple-mobile-web-app-title", content: "Level Lifting" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "Level Lifting — Level up your lifts" },
      { name: "description", content: "Track workouts, body weight, and meals. Level up a neon character every time you get stronger." },
      { property: "og:title", content: "Level Lifting — Level up your lifts" },
      { property: "og:description", content: "Track workouts, body weight, and meals. Level up a neon character every time you get stronger." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Level Lifting" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Level Lifting — Level up your lifts" },
      { name: "twitter:description", content: "Track workouts, body weight, and meals. Level up a neon character every time you get stronger." },
      { property: "og:image", content: "/app-icon.png" },
      { name: "twitter:image", content: "/app-icon.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/app-icon.png" },
      { rel: "apple-touch-icon", href: "/app-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="top-center" richColors />
    </QueryClientProvider>
  );
}
