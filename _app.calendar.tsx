import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { ChevronLeft, ChevronRight, Dumbbell, GlassWater, Moon } from "lucide-react";

export const Route = createFileRoute("/_app/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Iron Arena" }] }),
  component: CalendarPage,
});

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function CalendarPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();

  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });

  const monthStart = new Date(cursor);
  const monthEnd = new Date(cursor); monthEnd.setMonth(monthEnd.getMonth() + 1);

  const workoutsQ = useQuery({
    queryKey: ["cal-workouts", uid, cursor.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts").select("performed_at")
        .gte("performed_at", monthStart.toISOString())
        .lt("performed_at", monthEnd.toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  const suppsQ = useQuery({
    queryKey: ["cal-supps", uid, cursor.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplement_logs").select("logged_at")
        .gte("logged_at", monthStart.toISOString())
        .lt("logged_at", monthEnd.toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  const restQ = useQuery({
    queryKey: ["cal-rest", uid, cursor.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rest_days").select("id, day")
        .gte("day", ymd(monthStart))
        .lt("day", ymd(monthEnd));
      if (error) throw error;
      return data ?? [];
    },
  });

  const workoutDays = new Set((workoutsQ.data ?? []).map((w) => ymd(new Date(w.performed_at))));
  const suppDays = new Set((suppsQ.data ?? []).map((s) => ymd(new Date(s.logged_at))));
  const restDays = new Set((restQ.data ?? []).map((r) => r.day));
  const restIdByDay = new Map((restQ.data ?? []).map((r) => [r.day, r.id]));

  const toggleRest = useMutation({
    mutationFn: async (day: string) => {
      const existingId = restIdByDay.get(day);
      if (existingId) {
        const { error } = await supabase.from("rest_days").delete().eq("id", existingId);
        if (error) throw error;
        return { removed: true };
      }
      const { error } = await supabase.from("rest_days").insert({ user_id: uid, day });
      if (error) throw error;
      return { removed: false };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["cal-rest", uid] });
      toast.success(res.removed ? "Rest day removed" : "Rest day logged 💤");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Build grid: include leading blanks from previous month so Monday is first column
  const firstWeekday = (monthStart.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: ({ day: number; date: Date } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
    cells.push({ day: d, date });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = ymd(new Date());

  // Compute monthly stats
  const activeDays = new Set<string>([...workoutDays, ...suppDays, ...restDays]);
  const consistency = Math.round((activeDays.size / daysInMonth) * 100);

  return (
    <div className="space-y-6">
      <header>
        <p className="hud-chip mb-2">CONSISTENCY</p>
        <h1 className="text-4xl font-bold">Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">See every day you showed up. Tap a day to mark a rest day.</p>
      </header>

      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="btn-ghost"><ChevronLeft size={16} /></button>
          <h2 className="text-xl font-display font-bold">{cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}</h2>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="btn-ghost"><ChevronRight size={16} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;
            const key = ymd(c.date);
            const hasW = workoutDays.has(key);
            const hasS = suppDays.has(key);
            const hasR = restDays.has(key);
            const isToday = key === todayKey;
            const isFuture = c.date > new Date();
            const active = hasW || hasS || hasR;
            return (
              <button
                key={i}
                disabled={isFuture || toggleRest.isPending}
                onClick={() => toggleRest.mutate(key)}
                className={`relative aspect-square rounded-lg border text-xs sm:text-sm font-mono flex flex-col items-center justify-center gap-0.5 transition
                  ${isToday ? "neon-border" : "border-border/40"}
                  ${active ? "bg-secondary/60" : "bg-secondary/20"}
                  ${isFuture ? "opacity-30 cursor-default" : "hover:bg-secondary"}
                `}
                title={hasR ? "Rest day · tap to remove" : "Tap to mark rest day"}
              >
                <span className={isToday ? "neon-text font-bold" : ""}>{c.day}</span>
                <span className="flex gap-0.5">
                  {hasW && <span className="size-1.5 rounded-full bg-[color:var(--neon)]" />}
                  {hasS && <span className="size-1.5 rounded-full bg-[color:var(--ember)]" />}
                  {hasR && <span className="size-1.5 rounded-full bg-muted-foreground" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5"><Dumbbell size={12} className="neon-text"/> Workout</span>
          <span className="flex items-center gap-1.5"><GlassWater size={12} className="ember-text"/> Supplement</span>
          <span className="flex items-center gap-1.5"><Moon size={12}/> Rest</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="Active days" value={`${activeDays.size}/${daysInMonth}`} accent="neon" />
        <Tile label="Workouts" value={workoutDays.size} accent="ember" />
        <Tile label="Supplement days" value={suppDays.size} />
        <Tile label="Consistency" value={`${consistency}%`} accent="neon" />
      </div>
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: React.ReactNode; accent?: "neon" | "ember" }) {
  return (
    <div className={`glass-card p-4 ${accent === "ember" ? "ember-border" : accent === "neon" ? "neon-border" : ""}`}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 font-display ${accent === "ember" ? "ember-text" : accent === "neon" ? "neon-text" : ""}`}>{value}</div>
    </div>
  );
}
