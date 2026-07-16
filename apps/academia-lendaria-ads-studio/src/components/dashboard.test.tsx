import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { AdsCampaign } from '@/lib/types';
import type { MarketingProject } from '@/lib/project-domain';

/**
 * Testes da Home / Dashboard (Tela 0 — STORY-AL-ADS-1.4, gate reescrito pela
 * STORY-12.W4.1).
 *
 * Mocka `@/lib/supabase` (evita o throw de env vars + rede) e o spoke/project
 * store. Cobre: render da lista com placeholders honestos (AC1), o gate de
 * `campaign.create` (STORY-12.W4.1 — zero/um/múltiplos projetos) e "Nova
 * campanha" criando um draft via a RPC transacional quando exatamente um
 * projeto resolve sem ambiguidade.
 */

const SPOKE_ID = 'ws-active';

const SAMPLE: AdsCampaign = {
  id: 'camp-1',
  workspace_id: SPOKE_ID,
  name: 'Campanha Black Friday',
  status: 'draft',
  step_current: 1,
  created_at: '2026-06-24T00:00:00Z',
};

function project(overrides: Partial<MarketingProject> = {}): MarketingProject {
  return {
    id: 'project-1',
    workspaceId: SPOKE_ID,
    slug: 'demo',
    name: 'Projeto Demo',
    status: 'active',
    activeBriefRevisionId: 'brief-1',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    ...overrides,
  };
}

// --- mock do cliente supabase RLS-aware (1.2) + RPC transacional (12.W4.1) ---
const rpcSpy = vi.fn();
const selectThen = vi.fn();

vi.mock('@/lib/supabase', () => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => ({ then: (cb: (r: unknown) => void) => cb(selectThen()) })),
  };
  return { supabase: { from: vi.fn(() => builder), rpc: (...args: unknown[]) => rpcSpy(...args) } };
});

// --- mock do spoke store: spoke ativo fixo ---
vi.mock('@/stores/spoke-store', () => ({
  useSpokeStore: (selector: (s: { activeSpokeId: string | null }) => unknown) =>
    selector({ activeSpokeId: SPOKE_ID }),
}));

// --- mock do project store: controla quantos projetos o spoke ativo enxerga ---
// `importOriginal` preserva `DEMO_PROJECT_ID`/`activeBriefFor` etc., que
// `demo-mode.ts`/`campaign-readiness.ts` importam deste mesmo módulo.
let mockProjects: MarketingProject[] = [];
vi.mock('@/stores/project-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/project-store')>();
  return {
    ...actual,
    useProjectStore: (
      selector: (s: { projects: MarketingProject[]; weeklyPanels: unknown[]; artifacts: unknown[] }) => unknown,
    ) => selector({ projects: mockProjects, weeklyPanels: [], artifacts: [] }),
  };
});

// `project-repository` é consultado pelo preflight de `useCreateCampaign` quando
// um `projectId` é passado — o dashboard sempre passa o `targetProject` real do
// store, então basta ecoar o mesmo projeto de volta.
vi.mock('@/lib/project-repository', () => ({
  projectRepository: {
    getProject: vi.fn((_workspaceId: string, projectId: string) =>
      Promise.resolve(mockProjects.find((p) => p.id === projectId) ?? null),
    ),
    getActiveBrief: vi.fn(() => Promise.resolve(null)),
    listArtifacts: vi.fn(() => Promise.resolve([])),
    listSkillRuns: vi.fn(() => Promise.resolve([])),
  },
}));

import { Dashboard } from '@/components/dashboard';
import { resolveUnifiedProjectsHref } from '@/lib/legacy-cutover';

beforeEach(() => {
  rpcSpy.mockReset();
  selectThen.mockReset();
  mockProjects = [];
});

describe('Dashboard (Tela 0)', () => {
  it('AC1: lista campanhas do spoke com placeholders honestos (sem métricas inventadas)', async () => {
    selectThen.mockReturnValue({ data: [SAMPLE], error: null });

    render(<Dashboard />);

    expect(await screen.findByText('Campanha Black Friday')).toBeInTheDocument();
    // Métricas exibidas como placeholder honesto, nunca números fabricados.
    expect(screen.getByText('CPA')).toBeInTheDocument();
    expect(screen.getByText('ROAS')).toBeInTheDocument();
    expect(screen.getByText('Gasto')).toBeInTheDocument();
    expect(screen.getByText(/aguardando publicação/i)).toBeInTheDocument();
    // Nenhum dígito de métrica fabricado no card.
    expect(screen.queryByText(/R\$\s?\d/)).not.toBeInTheDocument();
  });

  it('AC1: estado vazio quando o spoke não tem campanhas', async () => {
    selectThen.mockReturnValue({ data: [], error: null });

    render(<Dashboard />);

    expect(await screen.findByText(/Nenhuma campanha ainda/i)).toBeInTheDocument();
  });

  it('STORY-12.W4.1: com exatamente um projeto pronto, "Nova campanha" cria via RPC transacional e navega ao wizard', async () => {
    selectThen.mockReturnValue({ data: [], error: null });
    mockProjects = [project()];
    const createdDraft = {
      id: 'camp-new',
      workspaceId: SPOKE_ID,
      projectId: 'project-1',
      name: 'Nova campanha',
      status: 'draft',
      stepCurrent: 1,
      createdAt: '2026-06-24T00:00:00Z',
    };
    rpcSpy.mockResolvedValue({ data: { ok: true, code: 'CREATED', campaign: createdDraft }, error: null });

    const onNavigate = vi.fn();
    render(<Dashboard onNavigateToWizard={onNavigate} />);

    const btn = await screen.findByRole('button', { name: /\+ Nova campanha/i });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);

    await waitFor(() => expect(onNavigate).toHaveBeenCalled());
    expect(rpcSpy).toHaveBeenCalledWith(
      'campaign_create_readiness_rpc',
      expect.objectContaining({ p_workspace_id: SPOKE_ID, p_project_id: 'project-1', p_name: 'Nova campanha' }),
    );
    // O draft criado aparece no grid após a criação.
    expect(await screen.findByText('Nova campanha')).toBeInTheDocument();
  });

  it('STORY-12.W4.1: sem nenhum projeto, "Nova campanha" fica bloqueada e não chama a RPC', async () => {
    selectThen.mockReturnValue({ data: [], error: null });
    mockProjects = [];

    render(<Dashboard />);

    const btn = await screen.findByRole('button', { name: /\+ Nova campanha/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);

    expect(rpcSpy).not.toHaveBeenCalled();
    const blockedAlert = await screen.findByTestId('dashboard-campaign-create-blocked');
    expect(blockedAlert).toHaveAttribute('role', 'alert');
    const cta = screen.getByRole('link', { name: /Ir para projetos/i });
    expect(cta).toBeVisible();
  });

  it('STORY-12.W4.1: com múltiplos projetos ambíguos, "Nova campanha" fica bloqueada (escolha explícita exigida)', async () => {
    selectThen.mockReturnValue({ data: [], error: null });
    mockProjects = [project({ id: 'project-1' }), project({ id: 'project-2', slug: 'demo-2' })];

    render(<Dashboard />);

    const btn = await screen.findByRole('button', { name: /\+ Nova campanha/i });
    expect(btn).toBeDisabled();
    expect(rpcSpy).not.toHaveBeenCalled();
    expect(await screen.findByTestId('dashboard-campaign-create-blocked')).toBeInTheDocument();
  });

  it('STORY-12.W4.1: gate CTA link é alcançável por teclado', async () => {
    selectThen.mockReturnValue({ data: [], error: null });
    mockProjects = [];

    render(<Dashboard />);

    const cta = await screen.findByRole('link', { name: /Ir para projetos/i });
    cta.focus();
    expect(cta).toHaveFocus();
  });

  it('AC3: faixa de alertas do monitor inicia com estado vazio profissional', async () => {
    selectThen.mockReturnValue({ data: [], error: null });

    render(<Dashboard />);

    expect(screen.getByTestId('monitor-alerts-empty')).toBeInTheDocument();
    expect(screen.getByText('Nenhum alerta pendente')).toBeInTheDocument();
    expect(screen.queryByText(/Epic 5|Story 5\.2/i)).not.toBeInTheDocument();
  });
});

describe('resolveUnifiedProjectsHref', () => {
  const linkedCampaign: AdsCampaign = {
    ...SAMPLE,
    id: 'campaign-linked',
    project_id: 'project-linked',
  };

  it('preserves an unknown campaign id in the legacy fallback', () => {
    expect(resolveUnifiedProjectsHref([linkedCampaign], new Set(['project-linked']), 'does-not-exist'))
      .toBe('/projects?legacyCampaignId=does-not-exist');
  });

  it('opens the linked unified project for a known campaign', () => {
    expect(resolveUnifiedProjectsHref([linkedCampaign], new Set(['project-linked']), 'campaign-linked'))
      .toBe('/projects/project-linked/overview?campaignId=campaign-linked');
  });
});
