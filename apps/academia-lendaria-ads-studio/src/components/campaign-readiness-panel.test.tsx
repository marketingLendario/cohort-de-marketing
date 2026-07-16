import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectStore } from '@/stores/project-store';
import type { MarketingProject, ProjectArtifact, ProjectBriefRevision } from '@/lib/project-domain';

/**
 * Testes de estado do painel de prontidão (STORY-12.W2.1 — AC5): loading,
 * empty, blocked, ready, warning e erro. Usa as MESMAS fixtures (project/
 * brief/artifact) e os mesmos requisitos de `data/skill-unlock-rules.json`
 * que `shared/campaign-readiness.test.ts` (W1.1) já valida — esta suíte não
 * reintroduz uma segunda matriz de regras, só monta cenários de UI em cima
 * do contrato existente.
 */

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <a href="#" className={className}>{children}</a>
  ),
}));

const { shouldThrow } = vi.hoisted(() => ({ shouldThrow: { value: false } }));
vi.mock('@/lib/campaign-readiness', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/campaign-readiness')>();
  return {
    ...actual,
    evaluateCampaignReadiness: (...args: Parameters<typeof actual.evaluateCampaignReadiness>) => {
      if (shouldThrow.value) throw new Error('falha sintética de teste — não deve vazar para a UI');
      return actual.evaluateCampaignReadiness(...args);
    },
  };
});

import { CampaignReadinessPanel } from '@/components/campaign-readiness-panel';

const PROJECT_ID = 'project-1';

function project(overrides: Partial<MarketingProject> = {}): MarketingProject {
  return {
    id: PROJECT_ID,
    workspaceId: 'workspace-1',
    slug: 'demo',
    name: 'Projeto Demo',
    status: 'active',
    activeBriefRevisionId: 'brief-1',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    ...overrides,
  };
}

function brief(data: Record<string, unknown>, revision = 1): ProjectBriefRevision {
  return {
    schemaVersion: '1.0.0',
    id: 'brief-1',
    workspaceId: 'workspace-1',
    projectId: PROJECT_ID,
    revision,
    status: 'active',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    data: { schemaVersion: '0.1.0', project: { slug: 'demo' }, ...data },
    fieldSources: {},
  };
}

function artifact(artifactType: string, overrides: Partial<ProjectArtifact> = {}): ProjectArtifact {
  return {
    id: `artifact-${artifactType}`,
    workspaceId: 'workspace-1',
    projectId: PROJECT_ID,
    artifactType,
    title: artifactType,
    path: `${artifactType}.md`,
    format: 'markdown',
    state: 'confirmed',
    verification: 'confirmed',
    source: 'filesystem',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    ...overrides,
  };
}

// Satisfaz TODOS os requiredFields/requiredArtifacts de zelador, briefista,
// estruturador, leitor-de-metricas e diagnosticador (data/skill-unlock-rules.json)
// + os recommendedFields/recommendedArtifacts (para não sobrar nenhuma ressalva).
const READY_BRIEF_DATA = {
  project: { slug: 'demo', regulatedNiche: 'nao', voice: 'direto' },
  channels: {
    primaryCtaUrl: 'https://example.com',
    thankYouPageUrl: 'https://example.com/obrigado',
    adFormats: ['reels-9x16'],
  },
  market: {
    awarenessLevel: 3,
    dominantPain: 'Dor real do público',
    avatarSummary: 'Resumo do avatar',
    trafficTemperature: 'frio',
  },
  offer: { exactPrice: 997, proofAssets: ['depoimento'] },
  data: { dataSourceNotes: 'Notas da fonte de dados' },
};

const READY_ARTIFACTS = [
  artifact('copy'),
  artifact('trafficTrackingAudit'),
  artifact('trafficCreativeBattery'),
  artifact('trafficCampaignPlan'),
  artifact('trafficMetricReading'),
  artifact('funnel'),
  artifact('salesPage'),
  artifact('offerbook'),
];

function seedStore(overrides: {
  projects?: MarketingProject[];
  briefRevisions?: ProjectBriefRevision[];
  artifacts?: ProjectArtifact[];
} = {}) {
  useProjectStore.setState({
    projects: overrides.projects ?? [project()],
    briefRevisions: overrides.briefRevisions ?? [],
    artifacts: overrides.artifacts ?? [],
    skillRuns: [],
    campaignPlans: [],
  });
}

beforeEach(() => {
  shouldThrow.value = false;
  useProjectStore.getState().resetDemo();
});

afterEach(() => {
  shouldThrow.value = false;
});

describe('CampaignReadinessPanel — estados (AC5)', () => {
  it('loading: mostra o estado de carregamento quando o projeto ainda não resolveu no store', () => {
    seedStore({ projects: [] });

    render(<CampaignReadinessPanel projectId={PROJECT_ID} />);

    expect(screen.getByTestId('campaign-readiness-panel')).toHaveAttribute('data-panel-state', 'loading');
    expect(screen.getByText(/Carregando o projeto/i)).toBeInTheDocument();
  });

  it('empty: mostra o convite para o briefing quando o projeto ainda não tem revisão ativa', () => {
    seedStore({ briefRevisions: [] });

    render(<CampaignReadinessPanel projectId={PROJECT_ID} />);

    const panel = screen.getByTestId('campaign-readiness-panel');
    expect(panel).toHaveAttribute('data-panel-state', 'empty');
    expect(screen.getByText('Comece pelo briefing')).toBeInTheDocument();
  });

  it('blocked: lista as lacunas com fonte, impacto e ação inline quando o briefing está vazio', () => {
    seedStore({ briefRevisions: [brief({})], artifacts: [] });

    render(<CampaignReadinessPanel projectId={PROJECT_ID} />);

    const panel = screen.getByTestId('campaign-readiness-panel');
    expect(panel).toHaveAttribute('data-panel-state', 'blocked');
    expect(screen.getByTestId('campaign-readiness-capability-campaign.tracking')).toHaveTextContent('Bloqueada');
    // Fonte (AC3) — pelo menos uma lacuna de briefing exposta com o rótulo humano da fonte.
    expect(screen.getAllByText('Briefing').length).toBeGreaterThan(0);
    // Ação inline/âncora (AC3) — sempre uma CTA "Corrigir" por lacuna.
    expect(screen.getAllByText('Corrigir').length).toBeGreaterThan(0);
  });

  it('ready: mostra tudo pronto quando as 6 capabilities estão satisfeitas sem ressalvas', () => {
    seedStore({ briefRevisions: [brief(READY_BRIEF_DATA)], artifacts: READY_ARTIFACTS });

    render(<CampaignReadinessPanel projectId={PROJECT_ID} />);

    const panel = screen.getByTestId('campaign-readiness-panel');
    expect(panel).toHaveAttribute('data-panel-state', 'ready');
    expect(screen.getByText('Tudo pronto para operar')).toBeInTheDocument();
    expect(panel).toHaveAttribute('data-capability-allowed', 'true');
  });

  it('warning: mostra ressalvas quando falta apenas um campo recomendado (zelador)', () => {
    const warningData = {
      ...READY_BRIEF_DATA,
      // omite channels.thankYouPageUrl — recomendado do zelador, não bloqueante.
      channels: { primaryCtaUrl: READY_BRIEF_DATA.channels.primaryCtaUrl, adFormats: READY_BRIEF_DATA.channels.adFormats },
    };
    seedStore({ briefRevisions: [brief(warningData)], artifacts: READY_ARTIFACTS });

    render(<CampaignReadinessPanel projectId={PROJECT_ID} />);

    const panel = screen.getByTestId('campaign-readiness-panel');
    expect(panel).toHaveAttribute('data-panel-state', 'ready_with_warnings');
    expect(screen.getByRole('heading', { name: 'Pronta com ressalvas' })).toBeInTheDocument();
  });

  it('erro: mostra mensagem genérica e não vaza detalhe cru quando o cálculo falha', () => {
    seedStore({ briefRevisions: [brief(READY_BRIEF_DATA)], artifacts: READY_ARTIFACTS });
    shouldThrow.value = true;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<CampaignReadinessPanel projectId={PROJECT_ID} />);

    const panel = screen.getByTestId('campaign-readiness-panel');
    expect(panel).toHaveAttribute('data-panel-state', 'error');
    expect(screen.getByText(/Não foi possível calcular a prontidão da campanha/i)).toBeInTheDocument();
    expect(screen.queryByText(/falha sintética de teste/i)).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
