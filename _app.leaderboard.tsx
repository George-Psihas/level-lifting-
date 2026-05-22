import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { NeonCharacter, type AvatarStyle } from "@/components/NeonCharacter";
import { levelFromXp, titleForLevel, type Hairstyle, type RewardKey, type RewardSlot } from "@/lib/game";
import { Trophy, Crown, Medal } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Iron Arena" }] }),
  component: LeaderboardPage,
});

interface Row {
  id: string;
  display_name: string | null;
  xp: number;
  avatar_style: string | null;
  equipped_outfit: any;
  hairstyle: string | null;
}

function LeaderboardPage() {
  const { user } = useAuth();
  const me = user?.id;
  const qc = useQueryClient();

  const lbQ = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_leaderboard", { limit_count: 50 });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const visQ = useQuery({
    queryKey: ["lb-visibility", me],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles").select("show_on_leaderboard").eq("id", me).single();
      if (error) throw error;
      return !!data?.show_on_leaderboard;
    },
  });

  const toggleMut = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await (supabase as any)
        .from("profiles").update({ show_on_leaderboard: next }).eq("id", me);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      toast.success(next ? "You're on the leaderboard" : "Hidden from leaderboard");
      qc.invalidateQueries({ queryKey: ["lb-visibility", me] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update"),
  });

  const rows = lbQ.data ?? [];
  const myRank = me ? rows.findIndex((r) => r.id === me) : -1;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="hud-chip mb-2">LEADERBOARD</p>
          <h1 className="text-4xl font-bold flex items-center gap-2"><Trophy className="text-[color:var(--neon)]"/> Top Fighters</h1>
          <p className="text-muted-foreground text-sm mt-1">Ranked by XP. Climb the ladder.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {me && visQ.data !== undefined && (
            <label className="glass-card px-3 py-2 text-xs font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer">
              <span className="text-muted-foreground">Show me</span>
              <Switch
                checked={visQ.data}
                onCheckedChange={(v) => toggleMut.mutate(v)}
                disabled={toggleMut.isPending}
              />
            </label>
          )}
          {myRank >= 0 && (
            <div className="glass-card px-4 py-2 text-sm">
              <span className="text-muted-foreground font-mono uppercase text-xs">Your rank · </span>
              <span className="neon-text font-bold">#{myRank + 1}</span>
            </div>
          )}
        </div>
      </header>

      {/* Podium */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx) => {
            const r = rows[idx];
            if (!r) return <div key={idx} />;
            const place = idx + 1;
            const lv = levelFromXp(r.xp).level;
            const t = titleForLevel(lv);
            const isMe = r.id === me;
            const podiumColor = place === 1 ? "oklch(0.86 0.16 90)" : place === 2 ? "oklch(0.82 0.02 250)" : "oklch(0.62 0.14 40)";
            return (
              <div
                key={r.id}
                className={`glass-card p-3 text-center ${place === 1 ? "ember-border" : "neon-border"} ${isMe ? "ring-2 ring-[color:var(--neon)]" : ""}`}
                style={{ marginTop: place === 1 ? 0 : 24 }}
              >
                <div className="flex items-center justify-center gap-1 text-xs font-mono uppercase tracking-widest" style={{ color: podiumColor }}>
                  {place === 1 ? <Crown size={14}/> : <Medal size={14}/>} #{place}
                </div>
                <div className="flex justify-center my-2">
                  <NeonCharacter
                    level={lv}
                    equipped={(r.equipped_outfit ?? {}) as Partial<Record<RewardSlot, RewardKey>>}
                    size={place === 1 ? 130 : 100}
                    animate={false}
                    style={(r.avatar_style ?? "male") as AvatarStyle}
                    hairstyle={(r.hairstyle ?? "none") as Hairstyle}
                  />
                </div>
                <div className="font-bold truncate">{r.display_name ?? "Anonymous"}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{t.tag} · LV {lv}</div>
                <div className="text-xs neon-text font-mono mt-1">{r.xp.toLocaleString()} XP</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="glass-card divide-y divide-border/40">
        {lbQ.isLoading && <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>}
        {!lbQ.isLoading && rows.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">No fighters yet. Be the first.</div>
        )}
        {rows.map((r, i) => {
          const lv = levelFromXp(r.xp).level;
          const t = titleForLevel(lv);
          const isMe = r.id === me;
          return (
            <div
              key={r.id}
              className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-secondary/40" : ""}`}
            >
              <div className={`w-8 text-center font-mono text-sm ${i < 3 ? "neon-text" : "text-muted-foreground"}`}>#{i + 1}</div>
              <div className="shrink-0">
                <NeonCharacter
                  level={lv}
                  equipped={(r.equipped_outfit ?? {}) as Partial<Record<RewardSlot, RewardKey>>}
                  size={48}
                  animate={false}
                  style={(r.avatar_style ?? "male") as AvatarStyle}
                  hairstyle={(r.hairstyle ?? "none") as Hairstyle}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate flex items-center gap-2">
                  {r.display_name ?? "Anonymous"}
                  {isMe && <span className="text-[9px] font-mono uppercase tracking-wider neon-text">You</span>}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{t.tag} · LV {lv}</div>
              </div>
              <div className="text-sm font-mono neon-text">{r.xp.toLocaleString()} XP</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
