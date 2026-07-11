import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelSkillRun,
  executeLocalSkill,
  getSkillRunView,
  observeSkillRun,
  retrySkillRun,
  startSkillRun,
  type EventSourceLike,
  type SkillRunView,
} from './skill-runtime';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

function view(overrides: Partial<SkillRunView> = {}): SkillRunView {
  return {
    jobId: 'job-1',
    skillId: 'offerbook',
    status: 'running',
    attempt: 1,
    attempts: [],
    steps: [],
    logs: [],
    proposal: null,
    skillHash: null,
    model: null,
    error: null,
    updatedAt: '2026-07-09T12:00:00.000Z',
    ...overrides,
  };
}

const SUCCEEDED = view({
  status: 'succeeded',
  proposal: { summary: 'ok', resultMarkdown: '# r', artifacts: [], fields: [], questions: [], warnings: [] },
  skillHash: 'hash-1',
  model: 'test-model',
});

/** Fake EventSource that lets the test emit named frames. */
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
    this.listeners.get(type)?.({ data: payload === undefined ? undefined : JSON.stringify({ type, payload }) });
  }
}

describe('skill-runtime client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('startSkillRun returns jobId + status on 202 (AC1)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ jobId: 'job-1', status: 'queued' }, { status: 202 }));
    const result = await startSkillRun('offerbook', { projectId: 'project-1', brief: {} });
    expect(result).toEqual({ jobId: 'job-1', status: 'queued' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/local/skills/offerbook/run',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('startSkillRun throws the treatable message on error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Runner local desabilitado.' }, { ok: false, status: 503 }));
    await expect(startSkillRun('offerbook', { projectId: 'project-1', brief: {} })).rejects.toThrow('desabilitado');
  });

  it('getSkillRunView, cancelSkillRun and retrySkillRun hit the right endpoints', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(view()));
    expect((await getSkillRunView('job-1')).jobId).toBe('job-1');

    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await cancelSkillRun('job-1');
    expect(fetchMock).toHaveBeenLastCalledWith('/api/local/skill-runs/job-1/cancel', expect.objectContaining({ method: 'POST' }));

    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: 'job-1', attempt: 2, status: 'queued' }));
    expect(await retrySkillRun('job-1')).toMatchObject({ attempt: 2 });
  });

  it('observeSkillRun delivers snapshot/progress/done over SSE and closes (AC3)', () => {
    const source = new FakeEventSource();
    const onSnapshot = vi.fn();
    const onProgress = vi.fn();
    const onDone = vi.fn();
    observeSkillRun('job-1', { onSnapshot, onProgress, onDone }, { eventSourceFactory: () => source });

    source.emit('snapshot', view());
    source.emit('progress', { jobId: 'job-1', status: 'running', attempt: 1, step: { id: 'codex', label: 'Executar', status: 'running', timestamp: 't' }, timestamp: 't' });
    source.emit('done', { jobId: 'job-1', proposal: SUCCEEDED.proposal, skillHash: 'hash-1', model: 'test-model' });

    expect(onSnapshot).toHaveBeenCalledOnce();
    expect(onProgress).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ jobId: 'job-1', skillHash: 'hash-1' }));
    expect(source.closed).toBe(true);
  });

  it('observeSkillRun reports a terminal cancelled snapshot even when the job has no error payload', () => {
    const source = new FakeEventSource();
    const onError = vi.fn();
    observeSkillRun('job-1', { onError }, { eventSourceFactory: () => source });

    source.emit('snapshot', view({
      status: 'cancelled',
      attempts: [{ attempt: 1, status: 'cancelled', reason: 'cancelado no teste', startedAt: 't', endedAt: 't' }],
    }));

    expect(onError).toHaveBeenCalledWith(
      { reason: 'cancelado no teste', capabilityUnavailable: false },
      'cancelled',
    );
    expect(source.closed).toBe(true);
  });

  it('observeSkillRun reconciles a terminal projection immediately when SSE emits no snapshot', async () => {
    const source = new FakeEventSource();
    const onSnapshot = vi.fn();
    const onDone = vi.fn();
    fetchMock.mockResolvedValueOnce(jsonResponse(SUCCEEDED));

    observeSkillRun('job-1', { onSnapshot, onDone }, { eventSourceFactory: () => source });

    await vi.waitFor(() => expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ jobId: 'job-1' })));
    expect(onSnapshot).toHaveBeenCalledWith(SUCCEEDED);
    expect(source.closed).toBe(true);
  });

  it('observeSkillRun falls back to polling when EventSource is unavailable (AC3)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(view({ status: 'running' })));
    fetchMock.mockResolvedValueOnce(jsonResponse(SUCCEEDED));
    const onSnapshot = vi.fn();
    const onDone = vi.fn();
    observeSkillRun('job-1', { onSnapshot, onDone }, { eventSourceFactory: null, pollIntervalMs: 1 });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(onSnapshot).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ skillHash: 'hash-1' }));
  });

  it('executeLocalSkill runs the durable pipeline and resolves the proposal (compat)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: 'job-1', status: 'queued' }, { status: 202 }));
    fetchMock.mockResolvedValueOnce(jsonResponse(view({ status: 'running' })));
    fetchMock.mockResolvedValueOnce(jsonResponse(SUCCEEDED));
    const result = await executeLocalSkill('offerbook', { projectId: 'project-1', brief: {} }, { pollIntervalMs: 1 });
    expect(result).toMatchObject({ skillId: 'offerbook', skillHash: 'hash-1', model: 'test-model' });
    expect(result.proposal.summary).toBe('ok');
  });

  it('executeLocalSkill throws when the run fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: 'job-1', status: 'queued' }, { status: 202 }));
    fetchMock.mockResolvedValueOnce(jsonResponse(view({ status: 'failed', error: { reason: 'boom', capabilityUnavailable: false } })));
    await expect(executeLocalSkill('offerbook', { projectId: 'project-1', brief: {} }, { pollIntervalMs: 1 })).rejects.toThrow('boom');
  });
});
