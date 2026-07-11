import { useEffect, useState } from 'react';
import { Card, CardContent, Badge, Alert } from '@/lib/lendaria-ds';
import { supabase } from '@/lib/supabase';
import { useSpokeStore } from '@/stores/spoke-store';
import type { AdsCampaign } from '@/lib/types';

/**
 * Lista de campanhas do spoke ativo (AC3 — STORY-AL-ADS-1.2).
 *
 * Demonstra o re-escopo: a query usa o cliente RLS-aware E filtra por
 * `workspace_id` = spoke ativo. Quando o seletor (AC2) troca o ativo, este
 * componente reage (dep no `activeSpokeId`) e recarrega.
 *
 * Defense-in-depth: o filtro `.eq('workspace_id', ...)` é só UX (escopo correto);
 * o isolamento REAL é a RLS no backend (R7 provado 6/6). O front nunca
 * reimplementa a regra de isolamento.
 */
export function CampaignsList() {
  const activeSpokeId = useSpokeStore((s) => s.activeSpokeId);
  const [campaigns, setCampaigns] = useState<AdsCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSpokeId) {
      setCampaigns([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);

    supabase
      .from('ads_campaigns')
      .select('id, workspace_id, name, status, step_current, created_at')
      .eq('workspace_id', activeSpokeId)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (!mounted) return;
        if (err) {
          setError(err.message);
          setCampaigns([]);
        } else {
          setCampaigns((data ?? []) as AdsCampaign[]);
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeSpokeId]);

  if (loading) return <p style={{ opacity: 0.7 }}>Carregando campanhas…</p>;
  if (error) return <Alert variant="destructive">{error}</Alert>;
  if (campaigns.length === 0) {
    return <p style={{ opacity: 0.7 }}>Nenhuma campanha neste spoke ainda.</p>;
  }

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {campaigns.map((c) => (
        <Card key={c.id}>
          <CardContent>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <Badge variant="outline">{c.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
