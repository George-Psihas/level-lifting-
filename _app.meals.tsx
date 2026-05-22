import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/meals")({
  head: () => ({ meta: [{ title: "Meals — Iron Arena" }] }),
  component: MealsPage,
});

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

function MealsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");

  const profileQ = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const mealsQ = useQuery({
    queryKey: ["meals", uid],
    queryFn: async () => {
      const since = startOfDay(new Date()); since.setDate(since.getDate() - 6);
      const { data, error } = await supabase.from("meals").select("*").gte("logged_at", since.toISOString()).order("logged_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [calGoal, setCalGoal] = useState("");
  const [protGoal, setProtGoal] = useState("");
  useEffect(() => {
    if (profileQ.data) {
      setCalGoal((profileQ.data as any).daily_calorie_goal?.toString() ?? "");
      setProtGoal((profileQ.data as any).daily_protein_goal?.toString() ?? "");
    }
  }, [profileQ.data]);

  const goalMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        daily_calorie_goal: calGoal ? Number(calGoal) : null,
        daily_protein_goal: protGoal ? Number(protGoal) : null,
      } as any).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Goals saved");
      qc.invalidateQueries({ queryKey: ["profile", uid] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name your meal");
      const { error } = await supabase.from("meals").insert({
        user_id: uid, name: name.trim(),
        calories: Number(cal) || 0,
        protein_g: Number(p) || 0,
        carbs_g: Number(c) || 0,
        fat_g: Number(f) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meal logged");
      setName(""); setCal(""); setP(""); setC(""); setF("");
      qc.invalidateQueries({ queryKey: ["meals", uid] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meals").delete().eq("id", id); if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meals", uid] }),
  });

  const meals = mealsQ.data ?? [];
  const today = startOfDay(new Date()).toISOString();
  const todays = meals.filter((m) => m.logged_at >= today);
  const todayTotals = todays.reduce((a, m) => ({
    cal: a.cal + m.calories,
    p: a.p + Number(m.protein_g),
    c: a.c + Number(m.carbs_g),
    f: a.f + Number(m.fat_g),
  }), { cal: 0, p: 0, c: 0, f: 0 });

  const calorieGoal = Number((profileQ.data as any)?.daily_calorie_goal) || 0;
  const proteinGoal = Number((profileQ.data as any)?.daily_protein_goal) || 0;

  const byDay = meals.reduce<Record<string, typeof meals>>((acc, m) => {
    const k = new Date(m.logged_at).toDateString();
    (acc[k] ??= []).push(m); return acc;
  }, {});

  return (
    <div className="space-y-8">
      <header>
        <p className="hud-chip mb-2">FUEL LOG</p>
        <h1 className="text-4xl font-bold">Track your meals</h1>
        <p className="text-muted-foreground text-sm mt-1">Macros in, gains out.</p>
      </header>

      {(calorieGoal > 0 || proteinGoal > 0) && (
        <section className="grid sm:grid-cols-2 gap-3">
          <GoalProgress label="Calories" current={todayTotals.cal} goal={calorieGoal} unit="kcal" accent="neon" />
          <GoalProgress label="Protein" current={Math.round(todayTotals.p)} goal={proteinGoal} unit="g" accent="ember" />
        </section>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Calories today" value={todayTotals.cal} unit="kcal" accent="neon" />
        <Tile label="Protein" value={todayTotals.p.toFixed(0)} unit="g" accent="ember" />
        <Tile label="Carbs" value={todayTotals.c.toFixed(0)} unit="g" />
        <Tile label="Fat" value={todayTotals.f.toFixed(0)} unit="g" />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); goalMut.mutate(); }} className="glass-card p-6">
        <h2 className="text-lg font-bold mb-3">Daily fuel goals</h2>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Calories</span>
            <input className="input-field mt-1" type="number" min="0" placeholder="e.g. 2800" value={calGoal} onChange={(e) => setCalGoal(e.target.value)} />
          </label>
          <label>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Protein (g)</span>
            <input className="input-field mt-1" type="number" min="0" placeholder="e.g. 180" value={protGoal} onChange={(e) => setProtGoal(e.target.value)} />
          </label>
        </div>
        <button className="btn-ghost mt-4 w-full">Save goals</button>
      </form>

      <form onSubmit={(e) => { e.preventDefault(); addMut.mutate(); }} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold">Add a meal</h2>
        <input className="input-field" placeholder="Meal name (e.g. Chicken & rice)" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <NumberInput label="Calories" value={cal} onChange={setCal} />
          <NumberInput label="Protein (g)" value={p} onChange={setP} />
          <NumberInput label="Carbs (g)" value={c} onChange={setC} />
          <NumberInput label="Fat (g)" value={f} onChange={setF} />
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={addMut.isPending}>Add meal</button>
        </div>
      </form>

      <section className="space-y-5">
        <h2 className="text-2xl font-bold">Last 7 days</h2>
        {meals.length === 0 && <p className="text-muted-foreground text-sm">Log your first meal above.</p>}
        {Object.entries(byDay).map(([day, items]) => {
          const totals = items.reduce((a, m) => ({ cal: a.cal + m.calories, p: a.p + Number(m.protein_g) }), { cal: 0, p: 0 });
          return (
            <div key={day} className="glass-card p-5">
              <div className="flex justify-between items-baseline mb-3">
                <h3 className="font-semibold">{day}</h3>
                <span className="text-xs font-mono text-muted-foreground">{totals.cal} kcal · {totals.p.toFixed(0)}g protein</span>
              </div>
              <ul className="divide-y divide-border/30">
                {items.map((m) => (
                  <li key={m.id} className="py-2 flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{m.calories} kcal · P{Number(m.protein_g).toFixed(0)} C{Number(m.carbs_g).toFixed(0)} F{Number(m.fat_g).toFixed(0)}</div>
                    </div>
                    <button onClick={() => delMut.mutate(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <input className="input-field mt-1" type="number" min="0" step="0.1" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Tile({ label, value, unit, accent }: { label: string; value: React.ReactNode; unit: string; accent?: "neon" | "ember" }) {
  return (
    <div className={`glass-card p-4 ${accent === "ember" ? "ember-border" : accent === "neon" ? "neon-border" : ""}`}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 font-display ${accent === "ember" ? "ember-text" : accent === "neon" ? "neon-text" : ""}`}>{value}<span className="text-xs text-muted-foreground ml-1">{unit}</span></div>
    </div>
  );
}

function GoalProgress({ label, current, goal, unit, accent }: { label: string; current: number; goal: number; unit: string; accent: "neon" | "ember" }) {
  if (goal <= 0) return null;
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return (
    <div className={`glass-card p-4 ${accent === "ember" ? "ember-border" : "neon-border"}`}>
      <div className="flex justify-between items-baseline mb-2">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xs font-mono text-muted-foreground">{current} / {goal} {unit}</div>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full ${accent === "ember" ? "bg-gradient-to-r from-[color:var(--ember)] to-[color:var(--neon)]" : "bg-gradient-to-r from-[color:var(--neon)] to-[color:var(--ember)]"}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`text-xs font-mono mt-1 ${pct >= 100 ? "neon-text" : "text-muted-foreground"}`}>{pct}%{pct >= 100 ? " · goal hit" : ""}</div>
    </div>
  );
}
