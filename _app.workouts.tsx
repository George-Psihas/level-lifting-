import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import {
  SUGGESTED_EXERCISES,
  XP_PER_MINUTE,
  XP_PER_WORKOUT_BASE,
  XP_PER_LIFT_PR,
  computeWeeklyProgress,
  levelFromXp,
  newRewardsBetween,
} from "@/lib/game";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/workouts")({
  head: () => ({ meta: [{ title: "Workouts — Iron Arena" }] }),
  component: WorkoutsPage,
});

interface Draft { id: string; exercise: string; weight: string; reps: string }

function WorkoutsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();

  const [duration, setDuration] = useState("45");
  const [notes, setNotes] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([
    { id: crypto.randomUUID(), exercise: "", weight: "", reps: "" },
  ]);

  const workoutsQ = useQuery({
    queryKey: ["workouts-list", uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("id, duration_minutes, performed_at, notes, xp_awarded, exercise_sets(exercise_name, weight_kg, reps)")
        .order("performed_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const validSets = drafts
        .map((d) => ({ ...d, w: Number(d.weight), r: Number(d.reps) }))
        .filter((d) => d.exercise.trim() && d.w > 0 && d.r > 0);

      const dur = Math.max(1, Number(duration) || 0);

      // Pre-fetch last 21 days of sets to compute pre/post weekly improvements
      const since = new Date(); since.setDate(since.getDate() - 21);
      const { data: priorSets } = await supabase
        .from("exercise_sets").select("exercise_name, weight_kg, reps, created_at")
        .gte("created_at", since.toISOString());

      const beforeWeekly = computeWeeklyProgress(priorSets ?? []);
      const beforeImproved = new Set(beforeWeekly.filter((w) => w.improved).map((w) => w.exercise));

      // Insert workout
      const { data: workout, error: wErr } = await supabase
        .from("workouts")
        .insert({ user_id: uid, duration_minutes: dur, notes: notes || null, xp_awarded: 0 })
        .select().single();
      if (wErr) throw wErr;

      // Insert sets
      if (validSets.length) {
        const rows = validSets.map((d, i) => ({
          workout_id: workout.id, user_id: uid,
          exercise_name: d.exercise.trim(), weight_kg: d.w, reps: d.r, set_number: i + 1,
        }));
        const { error: sErr } = await supabase.from("exercise_sets").insert(rows);
        if (sErr) throw sErr;
      }

      // Re-compute weekly after insert
      const newSets = [
        ...(priorSets ?? []),
        ...validSets.map((d) => ({ exercise_name: d.exercise.trim(), weight_kg: d.w, reps: d.r, created_at: new Date().toISOString() })),
      ];
      const afterWeekly = computeWeeklyProgress(newSets);
      const newlyImproved = afterWeekly.filter((w) => w.improved && !beforeImproved.has(w.exercise));

      // Award XP server-side (validates ownership, caps duration & PR count)
      const { data: awardRaw, error: awardErr } = await supabase.rpc("award_workout_xp", {
        p_workout_id: workout.id,
        p_pr_count: newlyImproved.length,
      });
      if (awardErr) throw awardErr;
      const award = (awardRaw ?? {}) as { xp_gained: number; old_level: number; new_level: number; pr_count: number };
      const xpGained = award.xp_gained ?? 0;
      const oldLevel = award.old_level ?? 1;
      const newLevel = award.new_level ?? oldLevel;

      // Claim new rewards via server-side validated function
      const unlocked = newRewardsBetween(oldLevel, newLevel);
      if (unlocked.length) {
        await supabase.rpc("claim_rewards", { p_keys: unlocked.map((r) => r.key) });
      }

      return { xpGained, prCount: award.pr_count ?? 0, leveledUp: newLevel > oldLevel, newLevel, unlocked };

    },
    onSuccess: (res) => {
      toast.success(`+${res.xpGained} XP${res.prCount ? ` · ${res.prCount} weekly PR` : ""}${res.leveledUp ? ` · LEVEL ${res.newLevel}!` : ""}`);
      if (res.unlocked.length) {
        res.unlocked.forEach((u) => toast(`Unlocked: ${u.name}`, { description: u.description }));
      }
      setDrafts([{ id: crypto.randomUUID(), exercise: "", weight: "", reps: "" }]);
      setNotes("");
      qc.invalidateQueries({ queryKey: ["workouts-list", uid] });
      qc.invalidateQueries({ queryKey: ["profile", uid] });
      qc.invalidateQueries({ queryKey: ["sets-recent", uid] });
      qc.invalidateQueries({ queryKey: ["workouts-count", uid] });
      qc.invalidateQueries({ queryKey: ["rewards", uid] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save workout"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Workout deleted");
      qc.invalidateQueries({ queryKey: ["workouts-list", uid] });
      qc.invalidateQueries({ queryKey: ["sets-recent", uid] });
      qc.invalidateQueries({ queryKey: ["workouts-count", uid] });
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="hud-chip mb-2">TRAINING LOG</p>
        <h1 className="text-4xl font-bold">Log a workout</h1>
        <p className="text-muted-foreground text-sm mt-1">Each set scored by weight × reps. PRs vs last week grant bonus XP.</p>
      </header>

      <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }} className="glass-card p-6 space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Duration (min)</span>
            <input className="input-field mt-1" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} required />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Notes (optional)</span>
            <input className="input-field mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Push day, felt strong" />
          </label>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Sets</p>
          <div className="space-y-2">
            {drafts.map((d, i) => (
              <div key={d.id} className="grid grid-cols-12 gap-2">
                <input
                  list="exercises"
                  className="input-field col-span-6"
                  placeholder="Exercise (e.g. Bench Press)"
                  value={d.exercise}
                  onChange={(e) => setDrafts((p) => p.map((x, j) => j === i ? { ...x, exercise: e.target.value } : x))}
                />
                <input className="input-field col-span-3" type="number" step="0.5" min="0" placeholder="lbs"
                       value={d.weight}
                       onChange={(e) => setDrafts((p) => p.map((x, j) => j === i ? { ...x, weight: e.target.value } : x))} />
                <input className="input-field col-span-2" type="number" min="0" placeholder="reps"
                       value={d.reps}
                       onChange={(e) => setDrafts((p) => p.map((x, j) => j === i ? { ...x, reps: e.target.value } : x))} />
                <button type="button" className="col-span-1 btn-ghost px-2" onClick={() => setDrafts((p) => p.filter((_, j) => j !== i))}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <datalist id="exercises">
            {SUGGESTED_EXERCISES.map((x) => <option key={x} value={x} />)}
          </datalist>
          <button type="button" className="btn-ghost mt-3" onClick={() => setDrafts((p) => [...p, { id: crypto.randomUUID(), exercise: "", weight: "", reps: "" }])}>
            <Plus size={16}/> Add set
          </button>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary" disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving…" : "Save & earn XP"}
          </button>
        </div>
      </form>

      <section>
        <h2 className="text-2xl font-bold mb-3">Recent workouts</h2>
        {workoutsQ.isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {workoutsQ.data?.length === 0 && (
          <p className="text-muted-foreground text-sm">No workouts yet. Log your first above.</p>
        )}
        <ul className="space-y-3">
          {workoutsQ.data?.map((w: any) => (
            <li key={w.id} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{new Date(w.performed_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                  <div className="text-xs text-muted-foreground">{w.duration_minutes} min · +{w.xp_awarded} XP {w.notes ? `· ${w.notes}` : ""}</div>
                </div>
                <button className="text-muted-foreground hover:text-destructive" onClick={() => deleteMut.mutate(w.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              {w.exercise_sets?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {w.exercise_sets.map((s: any, idx: number) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded-md bg-secondary/60 font-mono">
                      {s.exercise_name} · {s.weight_kg}lbs × {s.reps}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
