import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, signOut } from "@/lib/use-auth";
import { Dumbbell, HeartPulse, Utensils, Sparkles, Home, LogOut, GlassWater, CalendarDays, Trophy } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Arena", icon: Home },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/cup", label: "Cup", icon: GlassWater },
  { to: "/body", label: "Body", icon: HeartPulse },
  { to: "/meals", label: "Meals", icon: Utensils },
  { to: "/titles", label: "Titles", icon: Sparkles },
] as const;

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="hud-chip">LOADING ARENA…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Side nav (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col gap-1 p-6 border-r border-border/40">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2">
          <div className="size-9 rounded-lg neon-border grid place-items-center font-bold font-display">IA</div>
          <div className="font-display font-bold text-lg leading-none">
            <div className="neon-text">IRON</div>
            <div className="ember-text text-xs tracking-wider">ARENA</div>
          </div>
        </Link>
        {NAV.map((n) => {
          const active = location.pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? "bg-secondary text-foreground neon-border" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
            >
              <Icon size={18} /> {n.label}
            </Link>
          );
        })}
        <button onClick={signOut} className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50">
          <LogOut size={18} /> Sign out
        </button>
      </aside>

      {/* Top header (mobile) */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/80 backdrop-blur">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="size-8 rounded-md neon-border grid place-items-center text-xs font-bold font-display">IA</div>
          <span className="font-display font-bold neon-text">IRON ARENA</span>
        </Link>
        <button onClick={signOut} className="text-muted-foreground"><LogOut size={18} /></button>
      </header>

      <main className="flex-1 p-4 lg:p-10 pb-28 lg:pb-10 max-w-6xl">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border/40 bg-background">
        <ul className="grid grid-cols-7">
          {NAV.map((n) => {
            const active = location.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <li key={n.to} className="relative">
                <Link to={n.to} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-mono tracking-wider uppercase ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  <Icon size={20} /> {n.label}
                </Link>
                {active && <div className="absolute bottom-0 left-0 right-1 h-[2px] bg-[color:var(--neon)]" />}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
