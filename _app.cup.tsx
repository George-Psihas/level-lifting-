import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import {
  CUP_REWARDS,
  cupRewardsForStreak,
  cupLevelFromStreak,
  distinctDayCount,
  currentStreak,
  XP_PER_SUPPLEMENT_DAY,
  DAILY_CHALLENGES,
  type RewardKey,
} from "@/lib/game";
import { DailyChallengeCard } from "@/components/DailyChallengeCard";
import { Check, Flame, Lock, Trash2 } from "lucide-react";

// New 12 level-based cup skins
import cup0 from "@/assets/cups/cup_0.png";
import cup1 from "@/assets/cups/cup_1.png";
import cup2 from "@/assets/cups/cup_2.png";
import cup3 from "@/assets/cups/cup_3.png";
import cup4 from "@/assets/cups/cup_4.png";
import cup5 from "@/assets/cups/cup_5.png";
import cup6 from "@/assets/cups/cup_6.png";
import cup7 from "@/assets/cups/cup_7.png";
import cup8 from "@/assets/cups/cup_8.png";
import cup9 from "@/assets/cups/cup_9.png";
import cup10 from "@/assets/cups/cup_10.png";
import cup11 from "@/assets/cups/cup_11.png";

const CUP_ART: Record<string, string> = {
  "cup-starter": cup0,
  "cup-iron": cup1,
  "cup-energy": cup2,
  "cup-pulse": cup3,
  "cup-elite": cup4,
  "cup-champion": cup5,
  "cup-dominator": cup6,
  "cup-frost": cup7,
  "cup-neon": cup8,
  "cup-inferno": cup9,
  "cup-cosmic": cup10,
  "cup-legend": cup11,
};

export const Route = createFileRoute("/_app/cup")({
  head: () => ({ meta: [{ title: "Cup — Iron Arena" }] }),
  component: CupPage,
});

const KIND_OPTIONS = [
  { value: "creatine", label: "Creatine" },
  { value: "preworkout", label: "Pre-workout" },
  { value: "protein", label: "Protein shake" },
];

function CupPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const [kind, setKind] = useState("creatine");

  const profileQ = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const logsQ = useQuery({
    queryKey: ["supplement-logs", uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplement_logs")
        .select("id, kind, logged_at")
        .order("logged_at", { ascending: false })
        .limit(400);
      if (error) throw error;
      return data ?? [];
    },
  });

  const unlockedQ = useQuery({
    queryKey: ["rewards", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("unlocked_rewards").select("reward_key");
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.reward_key as RewardKey));
    },
  });

  const logs = logsQ.data ?? [];
  const totalDays = distinctDayCount(logs.map((l) => l.logged_at));
  const streak = currentStreak(logs.map((l) => l.logged_at));
  const todayKey = (() => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; })();
  const loggedToday = logs.some((l) => {
    const d = new Date(l.logged_at);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey;
  });

  const unlocked = unlockedQ.data ?? new Set<RewardKey>();
  const equipped = (profileQ.data?.equipped_outfit ?? {}) as Record<string, RewardKey>;

  // Cup unlock by STREAK
  const cupLevel = cupLevelFromStreak(streak);
  const streakUnlocked = cupRewardsForStreak(streak);
  const bestUnlockedCup = [...streakUnlocked].reverse()[0];
  const equippedCupKey = equipped.cup ?? bestUnlockedCup?.key;
  const equippedCupArt = equippedCupKey ? CUP_ART[equippedCupKey] : undefined;

  const nextCup = CUP_REWARDS.find((r) => (r.unlockDays ?? 0) > streak);

  // Auto-claim cups that became unlocked via streak growth
  useEffect(() => {
    if (!unlockedQ.data) return;
    const toClaim = streakUnlocked.filter((r) => !unlocked.has(r.key)).map((r) => r.key);
    if (toClaim.length === 0) return;
    (async () => {
      await supabase.rpc("claim_rewards", { p_keys: toClaim });
      qc.invalidateQueries({ queryKey: ["rewards", uid] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak, unlockedQ.data]);

  const logMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("supplement_logs").insert({ user_id: uid, kind });
      if (error) throw error;
      const { data: awardRaw, error: awardErr } = await supabase.rpc("award_supplement_day_xp");
      if (awardErr) throw awardErr;
      const award = (awardRaw ?? {}) as { xp_gained: number; total_days: number };
      return { xpGained: award.xp_gained ?? 0, newDays: award.total_days ?? 0 };
    },
    onSuccess: (res) => {
      if (res.xpGained > 0) toast.success(`+${res.xpGained} XP · Day ${res.newDays}`);
      else toast.success("Logged");
      qc.invalidateQueries({ queryKey: ["supplement-logs", uid] });
      qc.invalidateQueries({ queryKey: ["profile", uid] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("supplement_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplement-logs", uid] }),
  });

  const equipMut = useMutation({
    mutationFn: async (key: RewardKey | null) => {
      const next = { ...equipped };
      if (key === null) delete next.cup; else next.cup = key;
      const { error } = await supabase.from("profiles").update({ equipped_outfit: next }).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", uid] }),
  });

  const cupChallenges = DAILY_CHALLENGES.filter((c) => c.scope === "cup");

  return (
    <div className="space-y-8">
      <header>
        <p className="hud-chip mb-2">SUPPLEMENT STREAK · CUP SKINS</p>
        <h1 className="text-4xl font-bold">Your workout cup</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Every 7-day streak earns 2 cup levels. Keep the streak alive to climb all 12 tiers.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-1 flex flex-col items-center">
          <p className="hud-chip mb-3">EQUIPPED CUP · LV {cupLevel}</p>
          <div
            className="relative w-full max-w-[260px] aspect-[220/450] rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, oklch(0.14 0.02 255) 0%, oklch(0.05 0.005 255) 78%)",
            }}
          >
            {equippedCupArt ? (
              <img
                src={equippedCupArt}
                alt={equippedCupKey ?? "Workout shaker cup"}
                className="w-full h-full object-contain pulse-glow"
                style={{ filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.55))" }}
              />
            ) : (
              <p className="text-xs text-muted-foreground font-mono">No cup unlocked</p>
            )}
          </div>
          <p className="mt-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {equippedCupKey ? CUP_REWARDS.find((r) => r.key === equippedCupKey)?.name : "—"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center w-full">
            <Stat label={<span className="flex items-center justify-center gap-1"><Flame size={12}/> Streak</span>} value={`${streak}d`} accent="ember" />
            <Stat label="Total days" value={totalDays} accent="neon" />
            <Stat label="Cups" value={`${streakUnlocked.length}/${CUP_REWARDS.length}`} />
            <Stat label="Today" value={loggedToday ? "✓" : "—"} accent="ember" />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={(e) => { e.preventDefault(); logMut.mutate(); }}
            className="glass-card p-6 space-y-4"
          >
            <h2 className="text-lg font-bold">Log a scoop</h2>
            <div className="flex flex-wrap gap-2">
              {KIND_OPTIONS.map((k) => (
                <button
                  type="button"
                  key={k.value}
                  onClick={() => setKind(k.value)}
                  className={`btn-ghost ${kind === k.value ? "neon-border" : ""}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-mono">
                {loggedToday ? "Already counted today — extra logs are fine." : `First log today = +${XP_PER_SUPPLEMENT_DAY} XP`}
              </p>
              <button className="btn-primary" disabled={logMut.isPending}>
                {logMut.isPending ? "Logging…" : "Log scoop"}
              </button>
            </div>
            {nextCup && (
              <p className="text-xs font-mono text-muted-foreground">
                Next cup: <span className="neon-text">{nextCup.name}</span> at {nextCup.unlockDays}-day streak
                {" "}({(nextCup.unlockDays ?? 0) - streak} day{(nextCup.unlockDays ?? 0) - streak === 1 ? "" : "s"} to go)
              </p>
            )}
          </form>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Daily cup challenges</h2>
              <span className="text-[10px] font-mono text-muted-foreground">Resets at midnight UTC</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {cupChallenges.map((c) => <DailyChallengeCard key={c.key} challenge={c} />)}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-2">Cup skins</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CUP_REWARDS.map((r) => {
                const need = r.unlockDays ?? 0;
                const isUnlocked = streak >= need || unlocked.has(r.key);
                const isEquipped = equipped.cup === r.key;
                const art = CUP_ART[r.key];
                return (
                  <button
                    key={r.key}
                    disabled={!isUnlocked || equipMut.isPending}
                    onClick={() => equipMut.mutate(isEquipped ? null : r.key)}
                    className={`glass-card text-left p-3 transition flex flex-col items-center ${isEquipped ? "neon-border" : ""} ${!isUnlocked ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
                  >
                    <div
                      className="relative w-full aspect-[220/300] rounded-lg overflow-hidden flex items-center justify-center"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 50%, oklch(0.12 0.02 255) 0%, oklch(0.04 0.005 255) 80%)",
                      }}
                    >
                      {art && (
                        <img
                          src={art}
                          alt={r.name}
                          className="w-full h-full object-contain"
                          style={{
                            filter: isUnlocked ? "drop-shadow(0 8px 14px rgba(0,0,0,0.5))" : "grayscale(1) brightness(0.6)",
                          }}
                        />
                      )}
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Lock size={22} className="text-muted-foreground" />
                        </div>
                      )}
                      {isEquipped && (
                        <div className="absolute top-1.5 right-1.5">
                          <Check size={16} className="neon-text" />
                        </div>
                      )}
                    </div>
                    <div className="w-full mt-2">
                      <div className="font-semibold text-sm flex items-center justify-between">
                        <span>{r.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">LV {r.unlockLevel}</span>
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                        {isUnlocked ? (isEquipped ? "Equipped" : "Tap to equip") : `${need}-day streak`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-2">Recent logs</h2>
            {logs.length === 0 && <p className="text-sm text-muted-foreground">No scoops yet — log your first one above.</p>}
            <ul className="divide-y divide-border/30 glass-card">
              {logs.slice(0, 14).map((l) => (
                <li key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div>
                    <div className="font-medium capitalize">{l.kind.replace("-", " ")}</div>
                    <div className="text-xs text-muted-foreground font-mono">{new Date(l.logged_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => delMut.mutate(l.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: React.ReactNode; value: React.ReactNode; accent?: "neon" | "ember" }) {
  return (
    <div className={`rounded-lg p-3 ${accent === "neon" ? "neon-border" : accent === "ember" ? "ember-border" : "border border-border/40"}`}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold font-display ${accent === "neon" ? "neon-text" : accent === "ember" ? "ember-text" : ""}`}>{value}</div>
    </div>
  );
}
