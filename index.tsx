import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import titleScreen from "@/assets/title-screen.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Level Lifting — Level up your lifts" },
      { name: "description", content: "Track every lift. Every meal. Every rep. Watch your character evolve as you do." },
      { property: "og:title", content: "Level Lifting" },
      { property: "og:description", content: "Level up your lifts." },
      { property: "og:image", content: "/title-screen.png" },
    ],
  }),
  component: TitleScreen,
});

function TitleScreen() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      <img
        src={titleScreen}
        alt="Level Lifting — Level up your lifts"
        className="absolute inset-0 h-full w-full object-contain object-center select-none"
        draggable={false}
      />
      <div className="absolute inset-x-0 bottom-0 pb-10 sm:pb-14 flex flex-col items-center gap-3 z-10">
        <Link
          to="/auth"
          className="btn-primary px-10 py-3 text-base tracking-wider uppercase"
        >
          Enter
        </Link>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/60">
          Tap to begin
        </p>
      </div>
    </main>
  );
}
