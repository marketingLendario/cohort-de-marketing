import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { DEMO_AUTH_ENABLED, DEMO_AUTH_EVENT, getDemoSession } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';

/**
 * Sessão do usuário (AC1 — STORY-AL-ADS-1.2).
 *
 * Fonte da verdade da sessão é o próprio `supabase-js` (persistida + auto-refresh).
 * Este hook só espelha o estado reativo: `loading` cobre o boot inicial; o
 * `onAuthStateChange` mantém o React em sincronia com login/logout/refresh.
 */
export interface UseAuthResult {
  session: Session | null;
  loading: boolean;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_AUTH_ENABLED) {
      const syncDemoSession = () => {
        setSession(getDemoSession());
        setLoading(false);
      };
      syncDemoSession();
      window.addEventListener(DEMO_AUTH_EVENT, syncDemoSession);
      return () => window.removeEventListener(DEMO_AUTH_EVENT, syncDemoSession);
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
