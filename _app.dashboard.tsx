import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { NeonCharacter } from "@/components/NeonCharacter";
import { levelFromXp, computeWeeklyProgress, REWARDS, rewardsUpToLevel, titleForLevel, DAILY_CHALLENGES } from "@/lib/game";
import { DailyChallengeCard } from "@/components/DailyChallengeCard";
import { Flame, TrendingUp, Dumbbell, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Arena — Iron Arena" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const uid = user!.id;

  const profileQ = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const setsQ = useQuery({
    queryKey: ["sets-recent", uid],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 21);
      const { data, error } = await supabase
        .from("exercise_sets")
        .select("exercise_name, weight_kg, reps, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const workoutsQ = useQuery({
    queryKey: ["workouts-count", uid],
    queryFn: async () => {
      const { count, error } = await supabase.from("workouts").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const profile = profileQ.data;
  const xp = profile?.xp ?? 0;
  const { level, intoLevel, needed, progress } = levelFromXp(xp);
  const equipped = (profile?.equipped_outfit ?? {}) as Record<string, any>;
  const weekly = computeWeeklyProgress(setsQ.data ?? []);
  const improvements = weekly.filter((w) => w.improved);
  const unlockedCount = rewardsUpToLevel(level).length;
  const nextReward = REWARDS.find((r) => r.unlockLevel > level);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="hud-chip mb-2">FIGHTER PROFILE</p>
          <h1 className="text-4xl font-bold">
            {profile?.display_name ?? "Anonymous Fighter"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Lift. Eat. Evolve.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/workouts" className="btn-primary"><Dumbbell size={16}/> Log workout</Link>
          <Link to="/titles" className="btn-ghost"><Sparkles size={16}/> Titles</Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Character */}
        <div className="glass-card p-6 relative overflow-visible scan-line lg:col-span-1">
          <p className="hud-chip mb-3 relative z-20">AVATAR · LV {level} · {titleForLevel(level).tag}</p>
          <div className="flex justify-center">
            <NeonCharacter level={level} equipped={equipped} size={260} style={((profile as any)?.avatar_style ?? "male")} hairstyle={((profile as any)?.hairstyle ?? "none")} />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              <span>XP {intoLevel} / {needed}</span>
              <span>Total {xp}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[color:var(--neon)] to-[color:var(--ember)]" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <StatCard icon={<Dumbbell size={18}/>} label="Workouts logged" value={workoutsQ.data ?? 0} />
          <StatCard icon={<TrendingUp size={18}/>} label="Lifts improved this week" value={improvements.length} accent="ember" />
          <StatCard icon={<Sparkles size={18}/>} label="Cosmetics unlocked" value={`${unlockedCount} / ${REWARDS.length}`} />
          <StatCard icon={<Flame size={18}/>} label="Current weight"
                    value={profile?.current_weight_kg ? `${profile.current_weight_kg} lbs` : "—"}
                    sub={profile?.goal_weight_kg ? `goal ${profile.goal_weight_kg} lbs` : "set a goal in Body"}
                    accent="ember" />

          <div className="glass-card p-5 sm:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="hud-chip">WEEKLY LIFT CHECK</p>
              <Link to="/workouts" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
            </div>
            {weekly.length === 0 && (
              <p className="text-sm text-muted-foreground">Log a few sets and check back. Improvements vs last week appear here.</p>
            )}
            <ul className="space-y-2">
              {weekly.slice(0, 5).map((w) => (
                <li key={w.exercise} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                  <span className="font-medium">{w.exercise}</span>
                  <span className={`font-mono text-sm ${w.improved ? "neon-text" : w.delta < 0 ? "ember-text" : "text-muted-foreground"}`}>
                    {w.lastWeekBest > 0 ? (w.delta > 0 ? `+${w.delta}` : w.delta) : "new"}
                    <span className="text-muted-foreground ml-2 text-xs">({w.thisWeekBest} vs {w.lastWeekBest || "—"})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5 sm:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="hud-chip">DAILY AVATAR CHALLENGES</p>
              <span className="text-[10px] font-mono text-muted-foreground">Resets at midnight UTC</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {DAILY_CHALLENGES.filter((c) => c.scope === "avatar").map((c) => (
                <DailyChallengeCard key={c.key} challenge={c} />
              ))}
            </div>
          </div>


          {nextReward && (
            <div className="glass-card p-5 sm:col-span-2 ember-border">
              <p className="hud-chip ember-text" style={{ borderColor: "oklch(0.72 0.21 40 / 0.4)" }}>NEXT UNLOCK</p>
              <h3 className="text-xl font-bold mt-2">{nextReward.name}</h3>
              <p className="text-sm text-muted-foreground">{nextReward.description}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-2">
                Reach level {nextReward.unlockLevel} · {nextReward.unlockLevel - level} level{nextReward.unlockLevel - level === 1 ? "" : "s"} to go
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent = "neon" }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; accent?: "neon" | "ember" }) {
  return (
    <div className={`glass-card p-5 ${accent === "ember" ? "ember-border" : "neon-border"}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono uppercase tracking-wider">{icon} {label}</div>
      <div className={`text-3xl font-bold mt-2 font-display ${accent === "ember" ? "ember-text" : "neon-text"}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
