import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import titleScreen from "@/assets/title-screen.png";
import { useAuth } from "@/lib/use-auth";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Iron Arena" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/dashboard`;
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: redirectUrl, data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to verify.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back, fighter.");
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-black">
      {/* Title screen */}
      <div className="relative flex items-center justify-center overflow-hidden bg-black min-h-[50vh] lg:min-h-screen">
        <img
          src={titleScreen}
          alt="Level Lifting — level up your lifts"
          className="h-full w-full object-contain object-center select-none"
          draggable={false}
        />
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="glass-card w-full max-w-md p-8">
          <p className="hud-chip mb-3">ACCESS TERMINAL</p>
          <h2 className="text-3xl font-bold mb-1">{mode === "signin" ? "Welcome back" : "Enter the arena"}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "signin" ? "Sign in to keep grinding." : "Create your fighter to begin."}
          </p>

          {mode === "signup" && (
            <label className="block mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Display name</span>
              <input className="input-field mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Iron Sully" />
            </label>
          )}
          <label className="block mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</span>
            <input className="input-field mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block mb-5">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Password</span>
            <input className="input-field mt-1" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button type="button" className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full text-center"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "No account yet? Create one →" : "Already have an account? Sign in →"}
          </button>
        </form>
      </div>
    </div>
  );
}
