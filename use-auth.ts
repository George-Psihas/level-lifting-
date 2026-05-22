import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Shared module-level state so every useAuth() consumer sees the same
// session immediately — otherwise each child component renders once with
// `user=null` before its own useEffect runs, crashing `user!.id` access.
type AuthState = { session: Session | null; loading: boolean };
let current: AuthState = { session: null, loading: true };
const listeners = new Set<(s: AuthState) => void>();
let initialized = false;

function setState(next: AuthState) {
  current = next;
  listeners.forEach((l) => l(current));
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  supabase.auth.onAuthStateChange((_event, s) => {
    setState({ session: s, loading: false });
  });
  supabase.auth.getSession().then(({ data }) => {
    setState({ session: data.session, loading: false });
  });
}

export function useAuth() {
  init();
  const [state, setLocal] = useState<AuthState>(current);
  useEffect(() => {
    setLocal(current);
    const l = (s: AuthState) => setLocal(s);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  const user: User | null = state.session?.user ?? null;
  return { session: state.session, user, loading: state.loading };
}

export async function signOut() {
  await supabase.auth.signOut();
}
