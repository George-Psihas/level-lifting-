import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { NeonCharacter, type AvatarStyle } from "@/components/NeonCharacter";
import {
  REWARDS, TITLES, levelFromXp, titleForLevel,
  type Hairstyle, type RewardKey, type RewardSlot,
} from "@/lib/game";
import { Lock, Check, Crown } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/titles")({
  head: () => ({ meta: [{ title: "Titles & Auras — Iron Arena" }] }),
  component: TitlesPage,
});

function TitlesPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data;
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

  const profile = profileQ.data;
  const level = levelFromXp(profile?.xp ?? 0).level;
  const currentTitle = titleForLevel(level);
  const equipped = (profile?.equipped_outfit ?? {}) as Partial<Record<RewardSlot, RewardKey>>;
  const unlocked = unlockedQ.data ?? new Set<RewardKey>();
  const avatarStyle = ((profile as any)?.avatar_style ?? "male") as AvatarStyle;
  const hairstyle = ((profile as any)?.hairstyle ?? "none") as Hairstyle;

  const equipMut = useMutation({
    mutationFn: async ({ slot, key }: { slot: RewardSlot; key: RewardKey | null }) => {
      const next = { ...equipped };
      if (key === null) delete next[slot]; else next[slot] = key;
      const { error } = await supabase.from("profiles").update({ equipped_outfit: next }).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", uid] }),
    onError: (e: any) => toast.error(e.message),
  });

  const auras = REWARDS.filter((r) => r.slot === "aura");

  // ── Lifting Legend: first 10 players to hit LV 100 ──
  const legendQ = useQuery({
    queryKey: ["legend-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legend_claims")
        .select("user_id, slot")
        .order("slot", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const legendCount = legendQ.data?.length ?? 0;
  const mySlot = legendQ.data?.find((r) => r.user_id === uid)?.slot ?? null;
  const legendOpen = legendCount < 10;
  const isLegend = mySlot !== null;

  const claimLegendMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("legend_claims")
        .insert({ user_id: uid, slot: 0 }); // slot replaced by trigger
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lifting Legend secured ✨");
      qc.invalidateQueries({ queryKey: ["legend-claims"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not claim"),
  });

  // Auto-claim once eligible
  useEffect(() => {
    if (level >= 100 && legendQ.data && !isLegend && legendOpen && !claimLegendMut.isPending) {
      claimLegendMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, legendQ.data, isLegend, legendOpen]);


  return (
    <div className="space-y-8">
      <header>
        <p className="hud-chip mb-2">TITLES & AURAS</p>
        <h1 className="text-4xl font-bold">Forge your legend</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Earn a new title every few levels. Unlock auras to equip on your fighter.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:sticky lg:top-6 h-fit space-y-3">
          <p className="hud-chip">LV {level} · {currentTitle.tag}</p>
          <div className="flex justify-center">
            <NeonCharacter level={level} equipped={equipped} size={240} style={avatarStyle} hairstyle={hairstyle} />
          </div>
          {isLegend && (
            <p className="text-center text-sm font-mono tracking-wider gold-text">
              ★ LIFTING LEGEND · #{mySlot}/10 ★
            </p>
          )}
          <p className="text-center text-sm text-muted-foreground">Current title: <span className="neon-text font-mono">{currentTitle.name}</span></p>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-2">Titles</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {/* Limited-edition Lifting Legend card */}
              <div
                className={`glass-card p-4 sm:col-span-2 relative overflow-hidden ${isLegend ? "gold-border" : "opacity-90"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold gold-text tracking-wide">Lifting Legend</div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">LIMITED · LV 100 · FIRST 10 ONLY</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {isLegend
                        ? `You are Legend #${mySlot} of 10. This title is yours forever.`
                        : legendOpen
                          ? `${10 - legendCount} of 10 slots remaining. Hit LV 100 to claim.`
                          : "All 10 slots have been claimed."}
                    </div>
                  </div>
                  <Crown size={22} className={isLegend ? "gold-text" : "text-muted-foreground"} />
                </div>
              </div>

              {TITLES.map((t) => {
                const earned = level >= t.minLevel;
                const isCurrent = t.tag === currentTitle.tag;
                return (
                  <div
                    key={t.tag}
                    className={`glass-card p-4 ${isCurrent ? "neon-border" : ""} ${!earned ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-xs font-mono text-muted-foreground mt-1">{t.tag}</div>
                      </div>
                      {!earned ? <Lock size={16} className="text-muted-foreground"/> :
                       isCurrent ? <Check size={16} className="neon-text"/> : null}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-3">
                      {earned ? (isCurrent ? "Active title" : "Unlocked") : `Unlocks at LV ${t.minLevel}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-2">Auras</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {auras.map((r) => {
                const isUnlocked = unlocked.has(r.key);
                const isEquipped = equipped[r.slot] === r.key;
                return (
                  <button
                    key={r.key}
                    disabled={!isUnlocked || equipMut.isPending}
                    onClick={() => equipMut.mutate({ slot: r.slot, key: isEquipped ? null : r.key })}
                    className={`glass-card text-left p-4 transition ${isEquipped ? "neon-border" : ""} ${!isUnlocked ? "opacity-50 cursor-not-allowed" : "hover:translate-y-[-2px]"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
                      </div>
                      {!isUnlocked ? <Lock size={16} className="text-muted-foreground"/> :
                       isEquipped ? <Check size={16} className="neon-text"/> : null}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-3">
                      {isUnlocked ? (isEquipped ? "Equipped — tap to remove" : "Tap to equip") : `Unlocks at LV ${r.unlockLevel}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
