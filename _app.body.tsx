import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_app/body")({
  head: () => ({ meta: [{ title: "Body — Iron Arena" }] }),
  component: BodyPage,
});

function BodyPage() {
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

  const logsQ = useQuery({
    queryKey: ["weight-logs", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("weight_logs").select("*").order("logged_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [current, setCurrent] = useState("");
  const [goal, setGoal] = useState("");
  const [newWeight, setNewWeight] = useState("");

  useEffect(() => {
    if (profileQ.data) {
      setCurrent(profileQ.data.current_weight_kg?.toString() ?? "");
      setGoal(profileQ.data.goal_weight_kg?.toString() ?? "");
    }
  }, [profileQ.data]);

  const saveGoalMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        current_weight_kg: current ? Number(current) : null,
        goal_weight_kg: goal ? Number(goal) : null,
      }).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Goals updated");
      qc.invalidateQueries({ queryKey: ["profile", uid] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const logWeightMut = useMutation({
    mutationFn: async () => {
      const w = Number(newWeight);
      if (!w) throw new Error("Enter a weight");
      const { error } = await supabase.from("weight_logs").insert({ user_id: uid, weight_kg: w });
      if (error) throw error;
      // Sync current weight on profile
      await supabase.from("profiles").update({ current_weight_kg: w }).eq("id", uid);
    },
    onSuccess: () => {
      toast.success("Weight logged");
      setNewWeight("");
      qc.invalidateQueries({ queryKey: ["weight-logs", uid] });
      qc.invalidateQueries({ queryKey: ["profile", uid] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const logs = logsQ.data ?? [];
  const start = profileQ.data?.current_weight_kg;
  const goalKg = profileQ.data?.goal_weight_kg;
  const first = logs[logs.length - 1]?.weight_kg ?? start;
  const latest = logs[0]?.weight_kg ?? start;
  const progressKg = first && latest ? Number(first) - Number(latest) : 0;
  const remaining = latest && goalKg ? Number(latest) - Number(goalKg) : 0;

  const max = Math.max(...logs.map((l) => Number(l.weight_kg)), Number(goalKg) || 0, Number(current) || 0, 1);
  const min = Math.min(...logs.map((l) => Number(l.weight_kg)), Number(goalKg) || Infinity, Number(current) || Infinity);
  const range = Math.max(1, max - min);

  return (
    <div className="space-y-8">
      <header>
        <p className="hud-chip mb-2">BODY METRICS</p>
        <h1 className="text-4xl font-bold">Track your weight</h1>
        <p className="text-muted-foreground text-sm mt-1">Set a goal, log it like a lift.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-4">
        <StatTile label="Current" value={latest ? `${latest} lbs` : "—"} accent="neon" />
        <StatTile label="Goal" value={goalKg ? `${goalKg} lbs` : "—"} accent="ember" />
        <StatTile
          label={Number(goalKg) && Number(latest) && Number(goalKg) > Number(latest) ? "To gain" : "To lose"}
          value={goalKg && latest ? `${Math.abs(remaining).toFixed(1)} lbs` : "—"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={(e) => { e.preventDefault(); logWeightMut.mutate(); }} className="glass-card p-6">
          <h2 className="text-lg font-bold mb-3">Log today's weight</h2>
          <div className="flex gap-2">
            <input className="input-field flex-1" type="number" step="0.1" placeholder="lbs" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} required />
            <button className="btn-primary" disabled={logWeightMut.isPending}>Log</button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{progressKg !== 0 && first ? `${Math.abs(progressKg).toFixed(1)} lbs ${progressKg > 0 ? "lost" : "gained"} so far` : "Your first log starts the streak."}</p>
        </form>

        <form onSubmit={(e) => { e.preventDefault(); saveGoalMut.mutate(); }} className="glass-card p-6">
          <h2 className="text-lg font-bold mb-3">Set your goal</h2>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Current (lbs)</span>
              <input className="input-field mt-1" type="number" step="0.1" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </label>
            <label>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Goal (lbs)</span>
              <input className="input-field mt-1" type="number" step="0.1" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </label>
          </div>
          <button className="btn-ghost mt-4 w-full">Save goal</button>
        </form>
      </div>

      <section className="glass-card p-6">
        <h2 className="text-lg font-bold mb-3">Last 30 logs</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No logs yet.</p>
        ) : (
          <>
            <div className="flex items-end gap-1 h-32 mb-4">
              {[...logs].reverse().map((l, i) => {
                const h = ((Number(l.weight_kg) - min) / range) * 100;
                return (
                  <div key={l.id} className="flex-1 flex flex-col items-center justify-end" title={`${l.weight_kg}lbs`}>
                    <div className="w-full rounded-t bg-gradient-to-t from-[color:var(--neon)] to-[color:var(--ember)] opacity-80" style={{ height: `${Math.max(4, h)}%` }} />
                  </div>
                );
              })}
            </div>
            <ul className="text-sm divide-y divide-border/30">
              {logs.slice(0, 8).map((l) => (
                <li key={l.id} className="flex justify-between py-2">
                  <span className="text-muted-foreground">{new Date(l.logged_at).toLocaleDateString()}</span>
                  <span className="font-mono">{l.weight_kg} lbs</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: "neon" | "ember" }) {
  return (
    <div className={`glass-card p-5 ${accent === "ember" ? "ember-border" : accent === "neon" ? "neon-border" : ""}`}>
      <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-3xl font-bold mt-1 font-display ${accent === "ember" ? "ember-text" : accent === "neon" ? "neon-text" : ""}`}>{value}</div>
    </div>
  );
}
