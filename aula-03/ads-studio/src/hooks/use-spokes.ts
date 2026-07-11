import { useEffect, useState } from 'react';
import { DEMO_AUTH_ENABLED, DEMO_SPOKES } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import { useSpokeStore } from '@/stores/spoke-store';
import type { Spoke } from '@/lib/types';

/**
 * Carrega os spokes do usuário (AC1 — STORY-AL-ADS-1.2).
 *
 * A query lê `workspaces` direto: a RLS de `workspaces` já restringe ao que o
 * usuário pertence via `workspace_members` (não filtramos por user no front —
 * o backend faz isso). O resultado popula o store global (eixo de re-escopo).
 *
 * NÃO reimplementa a regra de membership no front; só consome o que a RLS
 * autoriza retornar sob a identidade do usuário autenticado.
 */
export interface UseSpokesResult {
  loading: boolean;
  error: string | null;
}

export function useSpokes(enabled: boolean): UseSpokesResult {
  const setSpokes = useSpokeStore((s) => s.setSpokes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (DEMO_AUTH_ENABLED) {
      setSpokes(DEMO_SPOKES);
      setLoading(false);
      setError(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);

    supabase
      .from('workspaces')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data, error: err }) => {
        if (!mounted) return;
        if (err) {
          setError(err.message);
          setSpokes([]);
        } else {
          setSpokes((data ?? []) as Spoke[]);
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [enabled, setSpokes]);

  return { loading, error };
}
