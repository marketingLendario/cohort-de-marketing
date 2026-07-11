import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { AdsCampaign } from '@/lib/types';

/**
 * Testes da Home / Dashboard (Tela 0 — STORY-AL-ADS-1.4).
 *
 * Mocka `@/lib/supabase` (evita o throw de env vars + rede) e o spoke store.
 * Cobre: render da lista com placeholders honestos (AC1) e o botão "Nova
 * campanha" criando um draft via insert (AC2).
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

// --- mock do cliente supabase RLS-aware (1.2) ---
const insertSingle = vi.fn();
const selectThen = vi.fn();

vi.mock('@/lib/supabase', () => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => ({ then: (cb: (r: unknown) => void) => cb(selectThen()) })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({ single: () => insertSingle() })),
    })),
  };
  return { supabase: { from: vi.fn(() => builder) } };
});

// --- mock do spoke store: spoke ativo fixo ---
vi.mock('@/stores/spoke-store', () => ({
  useSpokeStore: (selector: (s: { activeSpokeId: string | null }) => unknown) =>
    selector({ activeSpokeId: SPOKE_ID }),
}));

import { Dashboard } from '@/components/dashboard';
import { resolveUnifiedProjectsHref } from '@/lib/legacy-cutover';

beforeEach(() => {
  insertSingle.mockReset();
  selectThen.mockReset();
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

  it('AC2: "Nova campanha" cria um draft (status=draft, step_current=1) e navega ao wizard', async () => {
    selectThen.mockReturnValue({ data: [], error: null });
    const created: AdsCampaign = { ...SAMPLE, id: 'camp-new', name: 'Nova campanha' };
    insertSingle.mockResolvedValue({ data: created, error: null });

    const onNavigate = vi.fn();
    render(<Dashboard onNavigateToWizard={onNavigate} />);

    const btn = await screen.findByRole('button', { name: /\+ Nova campanha/i });
    fireEvent.click(btn);

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith(created));
    // O draft criado aparece no grid após a criação.
    expect(await screen.findByText('Nova campanha')).toBeInTheDocument();
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
