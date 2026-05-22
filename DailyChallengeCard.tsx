import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Sparkles, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import type { DailyChallenge } from "@/lib/game";

function todayUtcIso(): string {
  // YYYY-MM-DD in UTC to match the DB function's day calculation
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DailyChallengeCard({ challenge }: { challenge: DailyChallenge }) {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const today = todayUtcIso();

  const claimedQ = useQuery({
    queryKey: ["challenge-claims", uid, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_claims")
        .select("challenge_key")
        .eq("day", today);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.challenge_key));
    },
  });

  const claimed = claimedQ.data?.has(challenge.key) ?? false;

  const claimMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_daily_challenge", { p_key: challenge.key });
      if (error) throw error;
      return (data ?? {}) as { ok: boolean; xp_gained: number; reason?: string };
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`+${res.xp_gained} XP · ${challenge.name}`);
        qc.invalidateQueries({ queryKey: ["challenge-claims", uid, today] });
        qc.invalidateQueries({ queryKey: ["profile", uid] });
      } else if (res.reason === "already_claimed") {
        toast.info("Already claimed today");
        qc.invalidateQueries({ queryKey: ["challenge-claims", uid, today] });
      } else {
        toast.error("Not ready yet — complete the goal first.");
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className={`glass-card p-3 flex flex-col gap-2 ${claimed ? "neon-border opacity-90" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm">{challenge.name}</div>
        <span className="text-[10px] font-mono ember-text shrink-0">+{challenge.xp} XP</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{challenge.description}</p>
      <button
        onClick={() => claimMut.mutate()}
        disabled={claimed || claimMut.isPending}
        className={`mt-1 text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-md transition flex items-center justify-center gap-1
          ${claimed
            ? "bg-secondary text-muted-foreground cursor-default"
            : "bg-gradient-to-r from-[color:var(--neon)] to-[color:var(--ember)] text-background hover:-translate-y-0.5"}`}
      >
        {claimed ? (<><Check size={12}/> Claimed</>) : claimMut.isPending ? "Claiming…" : (<><Sparkles size={12}/> Claim</>)}
      </button>
    </div>
  );
}
