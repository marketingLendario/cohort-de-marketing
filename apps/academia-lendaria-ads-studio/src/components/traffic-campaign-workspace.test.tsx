import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectStore } from '@/stores/project-store';
import type { CampaignPlanRevision, MarketingProject, ProjectArtifact, ProjectBriefRevision } from '@/lib/project-domain';

/**
 * Integration-level coverage of the production wiring point (STORY-12.W3.1
 * AC4/AC5 — QA finding: unit tests on `campaign-run-status.tsx` and
 * `campaign-run-errors.ts` in isolation cannot catch a gap in how
 * `traffic-campaign-workspace.tsx` actually composes them). Focused on the
 * readiness preflight + stale-snapshot retry guard, not every stage of the
 * workspace (already covered end-to-end by `e2e/traffic-squad.spec.ts`).
 */

const navigateMock = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <a href="#" className={className}>{children}</a>
  ),
  useNavigate: () => navigateMock,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { id: 'campaign-1', workspace_id: 'workspace-1', project_id: 'project-1', name: 'Campanha Teste', status: 'draft', step_current: 1, created_at: '2026-07-16T00:00:00.000Z' } }),
        }),
      }),
    }),
  },
}));

import { TrafficCampaignWorkspace } from './traffic-campaign-workspace';

const PROJECT_ID = 'project-1';
const CAMPAIGN_ID = 'campaign-1';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body } as unknown as Response;
}

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

// Satisfies every requiredField/requiredArtifact of zelador/briefista/estruturador
// (data/skill-unlock-rules.json) — mirrors campaign-readiness-panel.test.tsx's
// READY_BRIEF_DATA so this suite does not reintroduce a second rules matrix.
const READY_BRIEF_DATA = {
  project: { slug: 'demo', regulatedNiche: 'nao', voice: 'direto' },
  channels: { primaryCtaUrl: 'https://example.com', thankYouPageUrl: 'https://example.com/obrigado', adFormats: ['reels-9x16'] },
  market: { awarenessLevel: 3, dominantPain: 'Dor real do público', avatarSummary: 'Resumo do avatar', trafficTemperature: 'frio' },
  offer: { exactPrice: 997, proofAssets: ['depoimento'] },
  data: { dataSourceNotes: 'Notas da fonte de dados' },
};

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

function readyPlan(overrides: Partial<CampaignPlanRevision> = {}): CampaignPlanRevision {
  return {
    schemaVersion: '1.0.0',
    id: `campaign-plan-${CAMPAIGN_ID}-1`,
    projectId: PROJECT_ID,
    campaignId: CAMPAIGN_ID,
    revision: 1,
    sourceBrief: { id: 'brief-1', revision: 1 },
    platform: 'meta',
    objective: 'sales',
    budget: { daily: 30, periodDays: 7, currency: 'BRL' },
    angles: [{ id: 'angle-1', name: 'Dor real do público', awarenessLevel: 3, source: 'brief' }],
    finalists: [
      { id: 'finalist-1', angleId: 'angle-1', hook: 'Hook 1', copy: 'Copy 1', format: 'reels-9x16', selectedByHuman: true },
      { id: 'finalist-2', angleId: 'angle-1', hook: 'Hook 2', copy: 'Copy 2', format: 'feed', selectedByHuman: true },
    ],
    tracking: { status: 'OK', criticalItemsConfirmed: true, checks: {} },
    structure: null,
    manualSubmission: { status: 'not_ready' },
    overrides: {},
    updatedAt: '2026-07-16T00:00:00.000Z',
    ...overrides,
  };
}

function seedStore(options: { briefRevision?: number; withPlan?: boolean } = {}) {
  useProjectStore.setState({
    projects: [project()],
    briefRevisions: [brief(READY_BRIEF_DATA, options.briefRevision ?? 1)],
    artifacts: READY_ARTIFACTS,
    skillRuns: [],
    campaignPlans: options.withPlan === false ? [] : [readyPlan()],
  });
}

describe('TrafficCampaignWorkspace — readiness preflight + stale-retry guard (STORY-12.W3.1 AC4)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    navigateMock.mockReset();
    useProjectStore.getState().resetDemo();
    // The workspace persists the active jobId to localStorage keyed by
    // campaignId (AC3 — reload-resume) so it MUST be cleared between tests:
    // otherwise a PRIOR test's run leaks in as this test's initial `runJobIds`
    // state, causing an unexpected `observeSkillRun` subscription before this
    // test ever clicks "Gerar" — corrupting the fetch-mock call sequence.
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('blocks with READINESS_BLOCKED and performs ZERO mutation when the campaign.brief capability is not ready (AC2/AC4)', async () => {
    // An active brief EXISTS (so the workspace itself renders — it is not the
    // "empty project" state) but is missing every field briefista requires —
    // campaign.brief is blocked (FIELD_MISSING), same fixture shape as
    // campaign-readiness-panel.test.tsx's own "blocked" scenario.
    useProjectStore.setState({
      projects: [project()],
      briefRevisions: [brief({})],
      artifacts: [],
      skillRuns: [],
      campaignPlans: [readyPlan()],
    });
    const user = userEvent.setup();
    render(<TrafficCampaignWorkspace projectId={PROJECT_ID} campaignId={CAMPAIGN_ID} stageId="briefista" />);

    await user.click(await screen.findByRole('button', { name: /Gerar bateria/i }));

    expect(screen.getByTestId('campaign-run-status')).toHaveAttribute('data-run-code', 'READINESS_BLOCKED');
    // Zero mutation — startSkillRun's POST to /run must never have fired.
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/skills/briefista/run'), expect.anything());
  });

  it('starts a run only after a READY preflight, observing the SAME jobId returned by startSkillRun (AC1)', async () => {
    seedStore();
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: 'job-123', status: 'queued' }, { status: 202 }));
    fetchMock.mockResolvedValueOnce(jsonResponse({
      jobId: 'job-123', skillId: 'briefista', status: 'running', attempt: 1, attempts: [], steps: [], logs: [],
      proposal: null, skillHash: null, model: null, error: null, updatedAt: '2026-07-16T12:00:00.000Z',
    }));
    // Terminal from here on — the polling loop MUST stop itself (AC5) before
    // this test ends, so no stray real-timer poll survives into the NEXT
    // test and steals one of ITS fetch-mock responses (test isolation).
    fetchMock.mockResolvedValue(jsonResponse({
      jobId: 'job-123', skillId: 'briefista', status: 'succeeded', attempt: 1, attempts: [], steps: [], logs: [],
      proposal: { summary: 'ok', resultMarkdown: '# r', artifacts: [], fields: [], questions: [], warnings: [] },
      skillHash: 'hash-1', model: 'test-model', error: null, updatedAt: '2026-07-16T12:00:01.000Z',
    }));
    const user = userEvent.setup();
    render(<TrafficCampaignWorkspace projectId={PROJECT_ID} campaignId={CAMPAIGN_ID} stageId="briefista" />);

    await user.click(await screen.findByRole('button', { name: /Gerar bateria/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/local/skills/briefista/run', expect.objectContaining({ method: 'POST' })));
    await waitFor(() => expect(screen.getByTestId('campaign-run-status')).toHaveAttribute('data-run-status', 'running'));
    // Let it reach the terminal state (proposal handoff) so its polling loop
    // is fully stopped before this test's cleanup/unmount runs.
    await waitFor(() => expect(screen.getByText('Proposta da skill')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('blocks an in-place retry with STALE_READINESS when the readiness snapshot drifted since the run started (AC4)', async () => {
    seedStore();
    // Run starts while campaign.brief is READY (revision 1).
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: 'job-1', status: 'queued' }, { status: 202 }));
    fetchMock.mockResolvedValue(jsonResponse({
      jobId: 'job-1', skillId: 'briefista', status: 'failed', attempt: 1,
      attempts: [{ attempt: 1, status: 'failed', reason: 'backend indisponível', startedAt: 't', endedAt: 't' }],
      steps: [], logs: [], proposal: null, skillHash: null, model: null,
      error: { reason: 'backend indisponível', capabilityUnavailable: false, kind: 'runner_error' },
      updatedAt: '2026-07-16T12:00:00.000Z',
    }));
    const user = userEvent.setup();
    render(<TrafficCampaignWorkspace projectId={PROJECT_ID} campaignId={CAMPAIGN_ID} stageId="briefista" />);
    await user.click(await screen.findByRole('button', { name: /Gerar bateria/i }));
    await waitFor(() => expect(screen.getByTestId('campaign-run-status-error')).toHaveAttribute('data-run-code', 'RUN_FAILED'), { timeout: 3000 });

    // The briefing revision advances AFTER the run started — the original
    // go-ahead is now stale (AC4: "retry não reusa snapshot obsoleto").
    act(() => {
      useProjectStore.setState({ briefRevisions: [brief(READY_BRIEF_DATA, 2)] });
    });

    await user.click(screen.getByTestId('campaign-run-status-retry-button'));

    await waitFor(() => expect(screen.getByTestId('campaign-run-status')).toHaveAttribute('data-run-code', 'STALE_READINESS'));
    // The stale guard must have blocked the retry BEFORE it ever POSTed.
    expect(fetchMock).not.toHaveBeenCalledWith('/api/local/skill-runs/job-1/retry', expect.anything());
  });
});
