import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectStore } from '@/stores/project-store';
import type { MarketingProject, ProjectArtifact, ProjectBriefRevision } from '@/lib/project-domain';

/**
 * Testes de `ProjectCampaigns` (STORY-12.W2.1):
 *  - AC4: CTA de criação desabilitado e sem draft quando `campaign.create`
 *    está bloqueado; habilitado quando o projeto está pronto.
 *  - AC2: `ProjectOverview` e `ProjectCampaigns` expõem o MESMO
 *    `inputFingerprint`/`capability.allowed`/`nextAction.target` de
 *    `campaign.create` para a mesma revisão — o teste falha se qualquer um
 *    divergir.
 */

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <a href="#" className={className}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

const selectThen = vi.fn();
vi.mock('@/lib/supabase', () => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => ({ then: (cb: (r: unknown) => void) => cb(selectThen()) })),
  };
  return { supabase: { from: vi.fn(() => builder) } };
});

const createCampaignMock = vi.fn();
vi.mock('@/lib/use-create-campaign', () => ({
  useCreateCampaign: () => ({ createCampaign: createCampaignMock, creating: false, error: null }),
}));

import { ProjectCampaigns } from '@/components/project-campaigns';
import { ProjectOverview } from '@/components/project-overview';

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

function seedStore(overrides: {
  projects?: MarketingProject[];
  briefRevisions?: ProjectBriefRevision[];
  artifacts?: ProjectArtifact[];
} = {}) {
  useProjectStore.setState({
    projects: overrides.projects ?? [project()],
    briefRevisions: overrides.briefRevisions ?? [brief({})],
    artifacts: overrides.artifacts ?? [],
    skillRuns: [],
    campaignPlans: [],
  });
}

beforeEach(() => {
  selectThen.mockReset().mockReturnValue({ data: [], error: null });
  createCampaignMock.mockReset();
  useProjectStore.getState().resetDemo();
});

describe('ProjectCampaigns — gate de criação (AC4)', () => {
  it('mantém "Nova campanha" habilitado e cria o draft quando campaign.create está pronta', async () => {
    seedStore({ projects: [project()], briefRevisions: [brief({})] });
    createCampaignMock.mockResolvedValue({ id: 'camp-1', workspace_id: 'workspace-1', project_id: PROJECT_ID, name: 'Nova', status: 'draft', step_current: 1, created_at: '2026-07-16T00:00:00Z' });

    render(<ProjectCampaigns projectId={PROJECT_ID} />);

    const toggle = await screen.findByRole('button', { name: /Nova campanha/i });
    expect(toggle).toBeEnabled();

    await userEvent.click(toggle);
    const submit = screen.getByRole('button', { name: /Criar campanha/i });
    await userEvent.type(screen.getByLabelText('Nome da campanha'), 'Campanha de teste');
    expect(submit).toBeEnabled();
    await userEvent.click(submit);
    expect(createCampaignMock).toHaveBeenCalledWith('workspace-1', 'Campanha de teste', PROJECT_ID);
  });

  it('desabilita o CTA de criação e não chama createCampaign quando campaign.create está bloqueada (projeto sem nome válido)', async () => {
    seedStore({ projects: [project({ name: '' })], briefRevisions: [brief({})] });

    render(<ProjectCampaigns projectId={PROJECT_ID} />);

    const toggle = await screen.findByRole('button', { name: /Nova campanha/i });
    expect(toggle).toBeDisabled();
    expect(createCampaignMock).not.toHaveBeenCalled();
  });
});

describe('ProjectCampaigns × ProjectOverview — paridade de snapshot (AC2)', () => {
  it('expõem o mesmo inputFingerprint, capability.allowed e nextAction.target de campaign.create para a mesma revisão', async () => {
    seedStore({ projects: [project({ name: '' })], briefRevisions: [brief({})] });

    const { unmount } = render(<ProjectCampaigns projectId={PROJECT_ID} />);
    const panel = await screen.findByTestId('campaign-readiness-panel');
    const panelFingerprint = panel.getAttribute('data-fingerprint');
    const panelAllowed = panel.getAttribute('data-capability-allowed');
    const panelNextTarget = panel.getAttribute('data-next-action-target');
    unmount();

    render(<ProjectOverview projectId={PROJECT_ID} />);
    const overviewCard = screen.getByTestId('project-overview-campaign-readiness');
    expect(overviewCard.getAttribute('data-fingerprint')).toBe(panelFingerprint);
    expect(overviewCard.getAttribute('data-capability-allowed')).toBe(panelAllowed);
    expect(overviewCard.getAttribute('data-next-action-target')).toBe(panelNextTarget);
    // A divergência real que este teste protege: um projeto bloqueado deve
    // aparecer bloqueado nas DUAS superfícies, nunca só em uma.
    expect(panelAllowed).toBe('false');
  });
});
