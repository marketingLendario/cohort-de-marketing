import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_PROJECT_ID, DEMO_WORKSPACE_ID, useProjectStore } from '@/stores/project-store';
import { skillCatalog } from '@/generated/skill-catalog';
import type { SkillRun } from '@/lib/project-domain';
import {
  ProjectWorkspaceActionsProvider,
  type ProjectWorkspaceActions,
} from '@/components/project-hydration-boundary';
import { toCacheRunPatch } from '@/hooks/use-project-workspace';
import type { ObserveSkillRunHandlers } from '@/lib/skill-runtime';

type SkillRuntimeModule = typeof import('@/lib/skill-runtime');

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <a href="#" className={className}>{children}</a>
  ),
}));

const observeSkillRun = vi.fn<SkillRuntimeModule['observeSkillRun']>(() => () => {});
const startSkillRun = vi.fn<SkillRuntimeModule['startSkillRun']>(
  async () => ({ jobId: 'job-new', status: 'queued' as const }),
);
const cancelSkillRun = vi.fn<SkillRuntimeModule['cancelSkillRun']>(async () => {});
const retrySkillRun = vi.fn<SkillRuntimeModule['retrySkillRun']>(
  async () => ({ jobId: 'job-1', attempt: 2, status: 'queued' as const }),
);

vi.mock('@/lib/skill-runtime', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/skill-runtime')>();
  return {
    ...actual,
    observeSkillRun: (...args: Parameters<SkillRuntimeModule['observeSkillRun']>) => observeSkillRun(...args),
    startSkillRun: (...args: Parameters<SkillRuntimeModule['startSkillRun']>) => startSkillRun(...args),
    cancelSkillRun: (...args: Parameters<SkillRuntimeModule['cancelSkillRun']>) => cancelSkillRun(...args),
    retrySkillRun: (...args: Parameters<SkillRuntimeModule['retrySkillRun']>) => retrySkillRun(...args),
  };
});

import { ProjectJourney } from '@/components/project-journey';

const SKILL_ID = 'offerbook';
const SKILL_TITLE = skillCatalog.skills.find((skill) => skill.id === SKILL_ID)?.title ?? SKILL_ID;

/** Seed a durable run in the store with a backend jobId, as a reload would rehydrate. */
function seedRun(status: 'running' | 'failed', jobId = 'job-1'): string {
  const store = useProjectStore.getState();
  const runId = store.startSkillRun(DEMO_PROJECT_ID, SKILL_ID, { jobId });
  store.updateSkillRun(runId, { status, error: status === 'failed' ? 'boom' : undefined });
  return runId;
}

describe('ProjectJourney — durable async runs (AC6)', () => {
  beforeEach(() => {
    useProjectStore.getState().resetDemo();
    observeSkillRun.mockClear();
    startSkillRun.mockClear();
    cancelSkillRun.mockClear();
    retrySkillRun.mockClear();
  });

  it('renders the journey map', () => {
    render(<ProjectJourney projectId={DEMO_PROJECT_ID} />);
    expect(screen.getByRole('heading', { name: /Mapa do/i })).toBeInTheDocument();
  });

  it('resumes a non-terminal run by jobId after reload, without the original request', () => {
    seedRun('running', 'job-resume');
    render(<ProjectJourney projectId={DEMO_PROJECT_ID} />);
    expect(observeSkillRun).toHaveBeenCalledWith('job-resume', expect.any(Object));
  });

  it('transitions the store run to needs_review when the run completes (done)', () => {
    const runId = seedRun('running', 'job-done');
    render(<ProjectJourney projectId={DEMO_PROJECT_ID} />);
    const handlers = observeSkillRun.mock.calls[0][1] as unknown as ObserveSkillRunHandlers;
    act(() => {
      handlers.onDone?.({
        jobId: 'job-done',
        proposal: { summary: 'pronto', resultMarkdown: '# r', artifacts: [], fields: [], questions: [], warnings: [] },
        skillHash: 'hash-1',
        model: 'test-model',
      });
    });
    const run = useProjectStore.getState().skillRuns.find((candidate) => candidate.id === runId);
    expect(run?.status).toBe('needs_review');
    expect(run?.skillHash).toBe('hash-1');
  });

  it('marks the run cancelled when the run reports a cancel (error)', () => {
    const runId = seedRun('running', 'job-cancel');
    render(<ProjectJourney projectId={DEMO_PROJECT_ID} />);
    const handlers = observeSkillRun.mock.calls[0][1] as unknown as ObserveSkillRunHandlers;
    act(() => {
      handlers.onError?.({ reason: 'Execução cancelada pelo operador.', capabilityUnavailable: false }, 'cancelled');
    });
    const run = useProjectStore.getState().skillRuns.find((candidate) => candidate.id === runId);
    expect(run?.status).toBe('cancelled');
  });

  it('shows a Cancelar control and persists the confirmed cancellation (AC4)', async () => {
    const runId = seedRun('running', 'job-active');
    render(<ProjectJourney projectId={DEMO_PROJECT_ID} />);
    // Select the seeded skill so its run surfaces in the detail panel.
    fireEvent.click(screen.getAllByText(SKILL_TITLE)[0]);
    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelButton);
    expect(cancelSkillRun).toHaveBeenCalledWith('job-active');
    await waitFor(() => {
      expect(useProjectStore.getState().skillRuns.find((run) => run.id === runId)?.status).toBe('cancelled');
    });
  });

  it('shows a Repetir control for a failed run and calls retry on click (AC4)', () => {
    seedRun('failed', 'job-failed');
    render(<ProjectJourney projectId={DEMO_PROJECT_ID} />);
    fireEvent.click(screen.getAllByText(SKILL_TITLE)[0]);
    const retryButton = screen.getByRole('button', { name: /Repetir/i });
    fireEvent.click(retryButton);
    expect(retrySkillRun).toHaveBeenCalledWith('job-failed');
  });

  it('does not issue overlapping retry POSTs on a double-click (in-flight guard, QA-W2B1-01)', () => {
    seedRun('failed', 'job-guard');
    render(<ProjectJourney projectId={DEMO_PROJECT_ID} />);
    fireEvent.click(screen.getAllByText(SKILL_TITLE)[0]);
    const retryButton = screen.getByRole('button', { name: /Repetir/i });
    // Dois cliques na mesma janela síncrona: o guard duro deixa passar só um POST.
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);
    expect(retrySkillRun).toHaveBeenCalledTimes(1);
  });

  it('reattaches the stream when retrying a run whose previous observer is stale', async () => {
    const runId = seedRun('running', 'job-stale-observer');
    render(<ProjectJourney projectId={DEMO_PROJECT_ID} />);
    expect(observeSkillRun).toHaveBeenCalledTimes(1);

    act(() => {
      useProjectStore.getState().updateSkillRun(runId, { status: 'cancelled' });
    });
    fireEvent.click(screen.getAllByText(SKILL_TITLE)[0]);
    fireEvent.click(screen.getByRole('button', { name: /Repetir/i }));

    await waitFor(() => expect(observeSkillRun).toHaveBeenCalledTimes(2));
    expect(observeSkillRun).toHaveBeenLastCalledWith('job-stale-observer', expect.any(Object));
  });
});

describe('ProjectJourney — persistência real-mode via ações do workspace (QA-W2B1-02)', () => {
  /** Ações fake do workspace (dentro da boundary): espelham o cache como o controller real faz. */
  function makeFakeActions(): ProjectWorkspaceActions {
    return {
      createProject: vi.fn(async () => 'project-x'),
      persistSkillRunStart: vi.fn(async (input) => {
        const run: SkillRun = {
          id: 'real-run-1',
          workspaceId: DEMO_WORKSPACE_ID,
          projectId: input.projectId,
          skillId: input.skillId,
          status: 'running',
          skillHash: 'pending',
          inputSnapshot: input.inputSnapshot,
          createdAt: '2026-07-09T12:00:00.000Z',
          updatedAt: '2026-07-09T12:00:00.000Z',
        };
        useProjectStore.getState().upsertSkillRun(run);
        return run;
      }),
      persistSkillRunUpdate: vi.fn(async (runId, patch) => {
        useProjectStore.getState().updateSkillRun(runId, toCacheRunPatch(patch));
      }),
    };
  }

  beforeEach(() => {
    useProjectStore.getState().resetDemo();
    observeSkillRun.mockClear();
    startSkillRun.mockClear();
    cancelSkillRun.mockClear();
    retrySkillRun.mockClear();
  });

  it('reata pelo jobId e persiste a transição terminal pelo repository (ações do workspace)', () => {
    const runId = seedRun('running', 'job-real');
    const actions = makeFakeActions();
    render(
      <ProjectWorkspaceActionsProvider value={actions}>
        <ProjectJourney projectId={DEMO_PROJECT_ID} />
      </ProjectWorkspaceActionsProvider>,
    );
    // Reidratou o run e reatou o stream pelo jobId (sem a requisição original).
    expect(observeSkillRun).toHaveBeenCalledWith('job-real', expect.any(Object));

    const handlers = observeSkillRun.mock.calls[0][1] as unknown as ObserveSkillRunHandlers;
    act(() => {
      handlers.onDone?.({
        jobId: 'job-real',
        proposal: { summary: 'pronto', resultMarkdown: '# r', artifacts: [], fields: [], questions: [], warnings: [] },
        skillHash: 'hash-real',
        model: 'test-model',
      });
    });

    // A transição needs_review foi ROTEADA pelo repositório (não só cache), com o skillHash real.
    expect(actions.persistSkillRunUpdate).toHaveBeenCalledWith(
      runId,
      expect.objectContaining({ status: 'needs_review', skillHash: 'hash-real' }),
    );
    const run = useProjectStore.getState().skillRuns.find((candidate) => candidate.id === runId);
    expect(run?.status).toBe('needs_review');
    expect(run?.skillHash).toBe('hash-real');
  });

  it('executa uma skill persistindo o início pelo repository com o jobId, e reata o stream (QA-W2B1-02)', async () => {
    const actions = makeFakeActions();
    render(
      <ProjectWorkspaceActionsProvider value={actions}>
        <ProjectJourney projectId={DEMO_PROJECT_ID} />
      </ProjectWorkspaceActionsProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Executar skill/i }));

    // 202 primeiro (jobId durável), depois o pointer via repository carregando o jobId.
    await waitFor(() => expect(actions.persistSkillRunStart).toHaveBeenCalled());
    expect(startSkillRun).toHaveBeenCalled();
    expect(actions.persistSkillRunStart).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: DEMO_PROJECT_ID,
        inputSnapshot: expect.objectContaining({ jobId: 'job-new' }),
      }),
    );
    // Reatou o run recém-criado pelo jobId devolvido pelo backend.
    await waitFor(() => expect(observeSkillRun).toHaveBeenCalledWith('job-new', expect.any(Object)));
  });
});
