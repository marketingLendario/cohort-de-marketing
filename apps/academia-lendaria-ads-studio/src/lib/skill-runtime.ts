export interface SkillProposalArtifact {
  artifactType: string;
  title: string;
  path: string;
  format: 'markdown' | 'json' | 'yaml' | 'html';
  content: string;
}

export interface SkillProposal {
  summary: string;
  resultMarkdown: string;
  artifacts: SkillProposalArtifact[];
  fields: Array<{ key: string; value: string }>;
  questions: string[];
  warnings: string[];
}

export type SkillRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface SkillRunStepView {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  timestamp: string;
}

export interface SkillRunLogView {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface SkillRunError {
  reason: string;
  capabilityUnavailable: boolean;
}

/** Durable projection returned by the poll endpoint and the SSE snapshot. */
export interface SkillRunView {
  jobId: string;
  skillId: string;
  status: SkillRunStatus;
  attempt: number;
  attempts: Array<{ attempt: number; status: string; reason?: string; startedAt: string; endedAt?: string }>;
  steps: SkillRunStepView[];
  logs: SkillRunLogView[];
  proposal: SkillProposal | null;
  skillHash: string | null;
  model: string | null;
  error: SkillRunError | null;
  updatedAt: string;
}

export interface StartSkillRunInput {
  /** RLS/tenant axis. Optional at the edge — the BFF derives it from the project. */
  workspaceId?: string;
  projectId: string;
  brief: Record<string, unknown>;
  context?: Record<string, unknown>;
  operatorInput?: string;
}

export interface StartSkillRunResult {
  jobId: string;
  status: SkillRunStatus;
}

const TERMINAL_STATUSES: readonly SkillRunStatus[] = ['succeeded', 'failed', 'cancelled'];

export function isTerminalSkillRun(status: SkillRunStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

function baseUrl(): string {
  return import.meta.env.VITE_BFF_URL?.replace(/\/$/, '') ?? '';
}

async function readError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => ({})) as { message?: string };
  return payload.message ?? `Runner local respondeu ${response.status}.`;
}

/** Start a durable async run. Resolves once the BFF has PERSISTED the job (202). */
export async function startSkillRun(skillId: string, input: StartSkillRunInput): Promise<StartSkillRunResult> {
  const response = await fetch(`${baseUrl()}/api/local/skills/${encodeURIComponent(skillId)}/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readError(response));
  const payload = await response.json() as Partial<StartSkillRunResult>;
  if (!payload.jobId) throw new Error('Runner local não devolveu um jobId.');
  return { jobId: payload.jobId, status: payload.status ?? 'queued' };
}

/** Poll the durable projection (graceful-degradation fallback for the stream). */
export async function getSkillRunView(jobId: string): Promise<SkillRunView> {
  const response = await fetch(`${baseUrl()}/api/local/skill-runs/${encodeURIComponent(jobId)}`);
  if (!response.ok) throw new Error(await readError(response));
  return await response.json() as SkillRunView;
}

/** Cancel an in-flight/queued run (aborts the Codex child on the BFF). */
export async function cancelSkillRun(jobId: string): Promise<void> {
  const response = await fetch(`${baseUrl()}/api/local/skill-runs/${encodeURIComponent(jobId)}/cancel`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(await readError(response));
}

export interface RetrySkillRunResult {
  jobId: string;
  attempt: number;
  status: SkillRunStatus;
}

/** Retry a terminal run — creates a new auditable attempt on the same jobId. */
export async function retrySkillRun(jobId: string): Promise<RetrySkillRunResult> {
  const response = await fetch(`${baseUrl()}/api/local/skill-runs/${encodeURIComponent(jobId)}/retry`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(await readError(response));
  return await response.json() as RetrySkillRunResult;
}

export interface SkillRunProgressPayload {
  jobId: string;
  status: SkillRunStatus;
  attempt: number;
  step?: SkillRunStepView;
  log?: SkillRunLogView;
  timestamp: string;
}

export interface SkillRunDonePayload {
  jobId: string;
  proposal: SkillProposal;
  skillHash: string;
  model: string;
}

export interface ObserveSkillRunHandlers {
  onSnapshot?: (view: SkillRunView) => void;
  onProgress?: (payload: SkillRunProgressPayload) => void;
  onDone?: (payload: SkillRunDonePayload) => void;
  onError?: (error: SkillRunError, status: SkillRunStatus) => void;
}

/** Minimal EventSource contract so the transport is injectable for tests. */
export interface EventSourceLike {
  addEventListener(type: string, listener: (event: { data?: string }) => void): void;
  close(): void;
}
export type EventSourceFactory = (url: string) => EventSourceLike;

export interface ObserveSkillRunOptions {
  /** Poll cadence for the fallback path (ms). */
  pollIntervalMs?: number;
  /** Inject an EventSource factory (tests). Defaults to the global EventSource. */
  eventSourceFactory?: EventSourceFactory | null;
}

/**
 * Observe a run (AC3). Prefers SSE; falls back to polling the SAME projection on
 * any transport failure (or when EventSource is unavailable). Returns an
 * unsubscribe that stops both. Reattaches by `jobId` — never depends on the
 * original HTTP request, so a reload can resume the run (AC6).
 */
export function observeSkillRun(
  jobId: string,
  handlers: ObserveSkillRunHandlers,
  options: ObserveSkillRunOptions = {},
): () => void {
  let closed = false;
  let source: EventSourceLike | undefined;
  let pollTimer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    closed = true;
    if (pollTimer) clearTimeout(pollTimer);
    source?.close();
  };

  const settleTerminal = (view: SkillRunView) => {
    if (view.status === 'succeeded' && view.proposal && view.skillHash && view.model) {
      handlers.onDone?.({ jobId: view.jobId, proposal: view.proposal, skillHash: view.skillHash, model: view.model });
    } else if (view.error) {
      handlers.onError?.(view.error, view.status);
    }
  };

  const startPolling = () => {
    const loop = async () => {
      if (closed) return;
      try {
        const view = await getSkillRunView(jobId);
        handlers.onSnapshot?.(view);
        if (isTerminalSkillRun(view.status)) {
          settleTerminal(view);
          stop();
          return;
        }
      } catch {
        // Transient — keep polling until unsubscribed.
      }
      if (!closed) pollTimer = setTimeout(() => void loop(), options.pollIntervalMs ?? 1500);
    };
    void loop();
  };

  const resolveFactory = (): EventSourceFactory | null => {
    if (options.eventSourceFactory !== undefined) return options.eventSourceFactory;
    if (typeof EventSource !== 'undefined') return (url) => new EventSource(url) as unknown as EventSourceLike;
    return null;
  };

  const factory = resolveFactory();
  if (!factory) {
    startPolling();
    return stop;
  }

  const parse = <T,>(data: string | undefined): T | null => {
    if (!data) return null;
    try {
      return (JSON.parse(data) as { payload: T }).payload;
    } catch {
      return null;
    }
  };

  source = factory(`${baseUrl()}/api/local/skill-runs/${encodeURIComponent(jobId)}/stream`);
  source.addEventListener('snapshot', (event) => {
    const view = parse<SkillRunView>(event.data);
    if (view) {
      handlers.onSnapshot?.(view);
      if (isTerminalSkillRun(view.status)) {
        settleTerminal(view);
        stop();
      }
    }
  });
  source.addEventListener('progress', (event) => {
    const payload = parse<SkillRunProgressPayload>(event.data);
    if (payload) handlers.onProgress?.(payload);
  });
  source.addEventListener('done', (event) => {
    const payload = parse<SkillRunDonePayload>(event.data);
    if (payload) handlers.onDone?.(payload);
    stop();
  });
  source.addEventListener('error', (event) => {
    // A server-sent `error` frame carries data; a transport error does not.
    if (event.data) {
      const payload = parse<{ status: SkillRunStatus; error: SkillRunError }>(event.data);
      if (payload) handlers.onError?.(payload.error, payload.status);
      stop();
    } else if (!closed) {
      // Transport dropped — degrade to polling (AC3 fallback).
      source?.close();
      source = undefined;
      startPolling();
    }
  });

  return stop;
}

export interface SkillRuntimeResult {
  skillId: string;
  skillHash: string;
  model: string;
  proposal: SkillProposal;
}

/**
 * Backward-compatible synchronous helper (STORY-AL-ADS-1.x consumers). Runs the
 * durable async pipeline under the hood: start (202) → poll the projection until
 * terminal → resolve with the proposal (or throw a treatable error). New call
 * sites should prefer {@link startSkillRun} + {@link observeSkillRun}.
 */
export async function executeLocalSkill(
  skillId: string,
  input: StartSkillRunInput,
  options: { pollIntervalMs?: number } = {},
): Promise<SkillRuntimeResult> {
  const start = await startSkillRun(skillId, input);
  const interval = options.pollIntervalMs ?? 800;
  for (;;) {
    const view = await getSkillRunView(start.jobId);
    if (view.status === 'succeeded' && view.proposal && view.skillHash && view.model) {
      return { skillId, skillHash: view.skillHash, model: view.model, proposal: view.proposal };
    }
    if (view.status === 'failed') throw new Error(view.error?.reason ?? 'Runner local falhou.');
    if (view.status === 'cancelled') throw new Error('Execução da skill cancelada.');
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

export function isSkillProposal(value: unknown): value is SkillProposal {
  if (!value || typeof value !== 'object') return false;
  const proposal = value as Partial<SkillProposal>;
  return typeof proposal.summary === 'string'
    && typeof proposal.resultMarkdown === 'string'
    && Array.isArray(proposal.artifacts)
    && Array.isArray(proposal.fields)
    && Array.isArray(proposal.questions)
    && Array.isArray(proposal.warnings);
}
