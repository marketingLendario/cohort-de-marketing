import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_PROJECT_ID, useProjectStore } from '@/stores/project-store';
import { skillCatalog } from '@/generated/skill-catalog';
import type { ObserveSkillRunHandlers } from '@/lib/skill-runtime';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <a href="#" className={className}>{children}</a>
  ),
}));

const observeSkillRun = vi.fn(() => () => {});
const startSkillRun = vi.fn(async () => ({ jobId: 'job-new', status: 'queued' as const }));
const cancelSkillRun = vi.fn(async () => {});
const retrySkillRun = vi.fn(async () => ({ jobId: 'job-1', attempt: 2, status: 'queued' as const }));

vi.mock('@/lib/skill-runtime', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/skill-runtime')>();
  return {
    ...actual,
    observeSkillRun: (...args: [string, ObserveSkillRunHandlers]) => observeSkillRun(...args),
    startSkillRun: (...args: unknown[]) => startSkillRun(...args),
    cancelSkillRun: (...args: unknown[]) => cancelSkillRun(...args),
    retrySkillRun: (...args: unknown[]) => retrySkillRun(...args),
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

  it('shows a Cancelar control for a running run and calls the runner on click (AC4)', () => {
    seedRun('running', 'job-active');
    render(<ProjectJourney projectId={DEMO_PROJECT_ID} />);
    // Select the seeded skill so its run surfaces in the detail panel.
    fireEvent.click(screen.getAllByText(SKILL_TITLE)[0]);
    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelButton);
    expect(cancelSkillRun).toHaveBeenCalledWith('job-active');
  });

  it('shows a Repetir control for a failed run and calls retry on click (AC4)', () => {
    seedRun('failed', 'job-failed');
    render(<ProjectJourney projectId={DEMO_PROJECT_ID} />);
    fireEvent.click(screen.getAllByText(SKILL_TITLE)[0]);
    const retryButton = screen.getByRole('button', { name: /Repetir/i });
    fireEvent.click(retryButton);
    expect(retrySkillRun).toHaveBeenCalledWith('job-failed');
  });
});
