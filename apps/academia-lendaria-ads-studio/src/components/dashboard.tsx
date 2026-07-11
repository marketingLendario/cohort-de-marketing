import { useEffect, useMemo, useState } from 'react';
import { Button, Alert } from '@/lib/lendaria-ds';
import { DEMO_AUTH_ENABLED, getDemoCampaigns } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import { useSpokeStore } from '@/stores/spoke-store';
import { useCreateCampaign } from '@/lib/use-create-campaign';
import { CampaignCard } from '@/components/campaign-card';
import { MonitorAlerts } from '@/components/monitor-alerts';
import type { AdsCampaign } from '@/lib/types';
import { projectMonitorAlerts } from '@/lib/monitor-alerts';
import { resolveUnifiedProjectsHref } from '@/lib/legacy-cutover';
import { useProjectStore } from '@/stores/project-store';

/**
 * Dashboard / Home — Tela 0 (STORY-AL-ADS-1.4).
 *
 * Centro de comando da conta/spoke ativa:
 *  - AC1: lista campanhas do spoke ativo com status e estado de dados honesto.
 *  - AC2: botão "Nova campanha" cria um draft (status=draft, step_current=1) e
 *    entra no wizard.
 *  - AC3: alertas derivados da operação semanal persistida, sempre para revisão humana.
 *  - AC4: isolamento por spoke herdado da RLS (1.2) — a query usa o cliente
 *    RLS-aware + `workspace_id` do spoke ativo; o front nunca reimplementa a
 *    regra de isolamento.
 *
 * REUSE da 1.2: `supabase` (cliente RLS-aware), `useSpokeStore` (spoke ativo).
 * Esta tela aposenta o uso de `CampaignsList` (1.2) no shell — o grid aqui é a
 * superfície rica (métricas + ações).
 */
export interface DashboardProps {
  /**
   * Navega para o passo do wizard de uma campanha. Injetado pela rota (TanStack
   * Router) para manter o Dashboard testável sem o router montado. O wizard de
   * 8 passos é das stories 1.5+; aqui só disparamos a navegação.
   */
  onNavigateToWizard?: (campaign: AdsCampaign) => void;
}

export function Dashboard({ onNavigateToWizard }: DashboardProps) {
  const activeSpokeId = useSpokeStore((s) => s.activeSpokeId);
  const projects = useProjectStore((s) => s.projects);
  const weeklyPanels = useProjectStore((s) => s.weeklyPanels);
  const artifacts = useProjectStore((s) => s.artifacts);
  const [campaigns, setCampaigns] = useState<AdsCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { creating, error: createError, createCampaign } = useCreateCampaign();

  useEffect(() => {
    if (!activeSpokeId) {
      setCampaigns([]);
      return;
    }
    if (DEMO_AUTH_ENABLED) {
      setCampaigns(getDemoCampaigns(activeSpokeId));
      setLoading(false);
      setError(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);

    supabase
      .from('ads_campaigns')
      .select('id, workspace_id, project_id, name, status, step_current, created_at')
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

  const monitorAlerts = useMemo(
    () => projectMonitorAlerts({ panels: weeklyPanels, campaigns, artifacts }),
    [artifacts, campaigns, weeklyPanels],
  );
  const queryCampaignId = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('campaignId');
  const unifiedHref = resolveUnifiedProjectsHref(
    campaigns,
    new Set(projects.map((project) => project.id)),
    queryCampaignId,
  );

  async function handleNewCampaign() {
    if (!activeSpokeId) return;
    // Nome provisório; o wizard (1.5+) deixa o usuário renomear no passo 1.
    const draft = await createCampaign(activeSpokeId, 'Nova campanha');
    if (draft) {
      setCampaigns((prev) => [draft, ...prev]);
      onNavigateToWizard?.(draft);
    }
  }

  return (
    <section data-testid="dashboard">
      <div
        data-testid="unified-cutover-bridge"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-base)' }}
      >
        <span>O workspace unificado reúne projetos, campanhas e operação semanal.</span>
        <a className="al-btn al-btn--outline cms-action-link" href={unifiedHref}>Abrir projetos</a>
      </div>

      {/* Alertas projetados somente a partir de painéis semanais persistidos. */}
      <div style={{ marginBottom: '1.5rem' }}>
        <MonitorAlerts alerts={monitorAlerts} />
      </div>

      {/* Header da seção campanhas + botão primário (AC2). */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h2
          style={{
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 0.7,
            margin: 0,
          }}
        >
          Campanhas
        </h2>
        <Button onClick={handleNewCampaign} disabled={!activeSpokeId || creating}>
          {creating ? 'Criando…' : '+ Nova campanha'}
        </Button>
      </div>

      {createError && (
        <Alert variant="destructive" style={{ marginBottom: '1rem' }}>
          Não foi possível criar a campanha: {createError}
        </Alert>
      )}

      {/* AC1 — grid de campanhas do spoke ativo. */}
      {loading ? (
        <p style={{ opacity: 0.7 }}>Carregando campanhas…</p>
      ) : error ? (
        <Alert variant="destructive">Não foi possível carregar campanhas: {error}</Alert>
      ) : campaigns.length === 0 ? (
        <p style={{ opacity: 0.7 }}>Nenhuma campanha ainda. Crie a primeira com “+ Nova campanha”.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))',
          }}
        >
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} onOpen={onNavigateToWizard} />
          ))}
        </div>
      )}
    </section>
  );
}
