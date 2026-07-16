import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignRunStatus } from './campaign-run-status';
import { classifyReadinessBlocked } from '@/lib/campaign-run-errors';
import type { CampaignReadinessSnapshot } from '@/lib/campaign-readiness';
import type { EventSourceLike, SkillRunView } from '@/lib/skill-runtime';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body } as unknown as Response;
}

function view(overrides: Partial<SkillRunView> = {}): SkillRunView {
  return {
    jobId: 'job-1',
    skillId: 'estruturador',
    status: 'queued',
    attempt: 1,
    attempts: [],
    steps: [],
    logs: [],
    proposal: null,
    skillHash: null,
    model: null,
    error: null,
    updatedAt: '2026-07-16T12:00:00.000Z',
    ...overrides,
  };
}

/** Fake EventSource that lets the test emit named frames, mirroring skill-runtime.test.ts. */
class FakeEventSource implements EventSourceLike {
  readonly listeners = new Map<string, (event: { data?: string }) => void>();
  closed = false;
  addEventListener(type: string, listener: (event: { data?: string }) => void): void {
    this.listeners.set(type, listener);
  }
  close(): void {
    this.closed = true;
  }
  emit(type: string, payload?: unknown): void {
    // Mirrors a real EventSource dispatch — wrapped in `act()` by the caller so
    // the resulting setState (an event delivered OUTSIDE any React-managed
    // event handler, exactly like production SSE) is flushed before assertions.
    this.listeners.get(type)?.({ data: payload === undefined ? undefined : JSON.stringify({ type, payload }) });
  }
}

/** Emits a frame and flushes the resulting React state update (see note above). */
function emitFrame(source: FakeEventSource, type: string, payload?: unknown): void {
  act(() => {
    source.emit(type, payload);
  });
}

const blockedSnapshot: CampaignReadinessSnapshot = {
  contractVersion: 'campaign-readiness.v1',
  target: 'campaign.structure',
  state: 'blocked',
  capability: { allowed: false, label: 'Estrutura da campanha', skillId: 'estruturador' },
  blocking: [{ code: 'ARTIFACT_MISSING', label: 'Artefato pendente: trafficTrackingAudit', source: 'artifact', action: { kind: 'journey', target: 'trafficTrackingAudit' } }],
  warnings: [],
  satisfied: [],
  nextAction: { label: 'Artefato pendente: trafficTrackingAudit', target: 'trafficTrackingAudit' },
  inputFingerprint: 'fingerprint-abc',
  sourceRevision: 1,
  computedAt: '2026-07-16T12:00:00.000Z',
};

describe('CampaignRunStatus', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(view()));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('renders nothing when idle — no jobId and no preflight error', () => {
    const { container } = render(<CampaignRunStatus jobId={null} skillLabel="Estruturador" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a classified READINESS_BLOCKED before any run starts, with a working "reavaliar" action (AC2)', async () => {
    const onRetryPreflight = vi.fn();
    const classified = classifyReadinessBlocked(blockedSnapshot);
    const user = userEvent.setup();
    render(
      <CampaignRunStatus
        jobId={null}
        skillLabel="Estruturador"
        preflightError={classified}
        onRetryPreflight={onRetryPreflight}
      />,
    );
    expect(screen.getByTestId('campaign-run-status-error')).toHaveTextContent('trafficTrackingAudit');
    expect(screen.getByTestId('campaign-run-status')).toHaveAttribute('data-run-code', 'READINESS_BLOCKED');
    await user.click(screen.getByTestId('campaign-run-status-preflight-action'));
    expect(onRetryPreflight).toHaveBeenCalledOnce();
  });

  it('shows phase, last event, timestamp, and a DETERMINATE progress while a known step runs (AC1)', () => {
    const source = new FakeEventSource();
    render(<CampaignRunStatus jobId="job-1" skillLabel="Estruturador" eventSourceFactory={() => source} />);

    emitFrame(source, 'snapshot', view({ status: 'running', steps: [{ id: 'resolve', label: 'Resolver skill canônica', status: 'done', timestamp: 't1' }] }));
    emitFrame(source, 'progress', {
      jobId: 'job-1',
      status: 'running',
      attempt: 1,
      step: { id: 'codex', label: 'Executar Codex CLI', status: 'running', timestamp: 't2' },
      timestamp: 't2',
    });

    expect(screen.getByTestId('campaign-run-status-badge')).toHaveTextContent('Em execução');
    expect(screen.getByTestId('campaign-run-status-phase')).toHaveTextContent('Executar Codex CLI');
    expect(screen.getByTestId('campaign-run-status-progress')).toHaveAttribute('data-progress-mode', 'determinate');
    expect(screen.getByTestId('campaign-run-status-progress')).toHaveTextContent('Fase 1 de 3');
  });

  it('shows INDETERMINATE progress (never a fabricated percentage) before any known step arrives (AC1)', () => {
    const source = new FakeEventSource();
    render(<CampaignRunStatus jobId="job-1" skillLabel="Estruturador" eventSourceFactory={() => source} />);
    emitFrame(source, 'snapshot', view({ status: 'running', steps: [] }));
    expect(screen.getByTestId('campaign-run-status-progress')).toHaveAttribute('data-progress-mode', 'indeterminate');
  });

  it('classifies a terminal timeout as RUN_TIMEOUT and offers a safe retry (AC2)', () => {
    const source = new FakeEventSource();
    render(<CampaignRunStatus jobId="job-1" skillLabel="Estruturador" eventSourceFactory={() => source} />);
    emitFrame(source, 'error', {
      jobId: 'job-1',
      status: 'failed',
      error: { reason: 'Codex CLI excedeu o limite de 60 segundos.', capabilityUnavailable: false, kind: 'timeout' },
      timestamp: 't3',
    });
    expect(screen.getByTestId('campaign-run-status-error')).toHaveAttribute('data-run-code', 'RUN_TIMEOUT');
    expect(screen.getByTestId('campaign-run-status-error')).toHaveTextContent('60 segundos');
    expect(screen.getByTestId('campaign-run-status-retry-button')).toBeInTheDocument();
  });

  it('classifies a terminal cancel as RUN_CANCELLED and calls onCancelled (AC2/AC3)', () => {
    const source = new FakeEventSource();
    const onCancelled = vi.fn();
    render(<CampaignRunStatus jobId="job-1" skillLabel="Estruturador" eventSourceFactory={() => source} onCancelled={onCancelled} />);
    emitFrame(source, 'error', {
      jobId: 'job-1',
      status: 'cancelled',
      error: { reason: 'Execução cancelada pelo operador.', capabilityUnavailable: false },
      timestamp: 't3',
    });
    expect(screen.getByTestId('campaign-run-status-error')).toHaveAttribute('data-run-code', 'RUN_CANCELLED');
    expect(onCancelled).toHaveBeenCalledOnce();
  });

  it('pressing "Cancelar execução" POSTs to the cancel endpoint (AC3)', async () => {
    const source = new FakeEventSource();
    const user = userEvent.setup();
    render(<CampaignRunStatus jobId="job-1" skillLabel="Estruturador" eventSourceFactory={() => source} />);
    emitFrame(source, 'snapshot', view({ status: 'running' }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await user.click(screen.getByTestId('campaign-run-status-cancel-button'));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/local/skill-runs/job-1/cancel', expect.objectContaining({ method: 'POST' })),
    );
  });

  it('pressing "Tentar novamente" retries and resumes observing the SAME jobId (AC2/AC4)', async () => {
    let source = new FakeEventSource();
    const factory = vi.fn(() => source);
    const user = userEvent.setup();
    render(<CampaignRunStatus jobId="job-1" skillLabel="Estruturador" eventSourceFactory={factory} />);
    emitFrame(source, 'error', {
      jobId: 'job-1',
      status: 'failed',
      error: { reason: 'backend indisponível', capabilityUnavailable: false, kind: 'runner_error' },
      timestamp: 't3',
    });
    expect(screen.getByTestId('campaign-run-status-error')).toHaveAttribute('data-run-code', 'RUN_FAILED');

    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: 'job-1', attempt: 2, status: 'queued' }));
    source = new FakeEventSource(); // the retry re-subscribes with a fresh EventSource
    await user.click(screen.getByTestId('campaign-run-status-retry-button'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/local/skill-runs/job-1/retry', expect.objectContaining({ method: 'POST' })),
    );
    // The error card is cleared while the NEW attempt is observed (no stale error lingering).
    await waitFor(() => expect(screen.queryByTestId('campaign-run-status-error')).not.toBeInTheDocument());
    expect(factory).toHaveBeenCalledTimes(2); // re-subscribed on the SAME jobId, not a new run
  });

  it('shows a "stalled" indicator when no new event has arrived for a while during a non-terminal run (AC1/AC5)', () => {
    vi.useFakeTimers();
    const source = new FakeEventSource();
    let clock = Date.parse('2026-07-16T12:00:00.000Z');
    render(
      <CampaignRunStatus
        jobId="job-1"
        skillLabel="Estruturador"
        eventSourceFactory={() => source}
        stalledAfterMs={20_000}
        now={() => clock}
      />,
    );
    emitFrame(source, 'snapshot', view({ status: 'running', steps: [{ id: 'codex', label: 'Executar Codex CLI', status: 'running', timestamp: 't1' }] }));
    expect(screen.queryByTestId('campaign-run-status-stalled')).not.toBeInTheDocument();

    clock += 25_000;
    act(() => {
      vi.advanceTimersByTime(2_000); // the internal 1s ticker forces a re-render to notice the silence
    });

    expect(screen.getByTestId('campaign-run-status-stalled')).toBeInTheDocument();
  });
});
