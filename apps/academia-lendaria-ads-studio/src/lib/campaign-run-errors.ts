import type { CampaignCapability, CampaignReadinessSnapshot } from '@/lib/campaign-readiness';
import type { SkillRunError, SkillRunStatus } from '@/lib/skill-runtime';

/**
 * Classified error contract for an observed campaign run (STORY-12.W3.1 AC2).
 *
 * Covers the five treatable failure shapes an operator can hit while running
 * a skill from the campaign workspace: two are readiness preflight failures
 * (`READINESS_BLOCKED`, `STALE_READINESS` — contract owned by
 * `shared/campaign-readiness.ts`, STORY-12.W1.1/ADR-002) and three are
 * terminal run outcomes (`RUN_FAILED`, `RUN_CANCELLED`, `RUN_TIMEOUT` — owned
 * by the skill-run job journal, STORY-8.W2.2). This module does not
 * reimplement either contract: it only maps their existing, already-tested
 * shapes into ONE human-message + action + redacted-correlation-id + safe-retry
 * envelope so `campaign-run-status.tsx` never has to special-case each code.
 *
 * Never swallows the runner's own reason into a generic string (Dev Notes):
 * every `RUN_*` message embeds `error.reason` verbatim.
 */

export type CampaignRunErrorCode =
  | 'READINESS_BLOCKED'
  | 'STALE_READINESS'
  | 'RUN_FAILED'
  | 'RUN_CANCELLED'
  | 'RUN_TIMEOUT';

export interface CampaignRunErrorAction {
  label: string;
  /** `retry` re-runs the SAME skill; the others navigate the operator elsewhere. */
  kind: 'retry' | 'briefing' | 'journey' | 'inline';
  target?: string;
}

export interface CampaignRunClassifiedError {
  code: CampaignRunErrorCode;
  /** Human (PT-BR) message — never a mute/generic string. */
  message: string;
  action: CampaignRunErrorAction;
  /** Redacted — safe to render, never the raw internal id. */
  correlationId: string;
  /** `true` when clicking "Tentar novamente" is safe (won't duplicate a side effect). */
  retrySafe: boolean;
}

const VISIBLE_CORRELATION_CHARS = 8;

/** Redacts an internal id (jobId or readiness fingerprint) for display (AC2). */
export function redactCorrelationId(id: string | null | undefined): string {
  if (!id) return '—';
  if (id.length <= VISIBLE_CORRELATION_CHARS) return id;
  return `${id.slice(0, VISIBLE_CORRELATION_CHARS)}…`;
}

/**
 * Idempotency key for a single run ATTEMPT (AC4). Stable `jobId` = the run's
 * `correlationId` (the same operator intent across retries); `attempt`
 * disambiguates each retry so a downstream "already handled this key" guard
 * never conflates attempt N with attempt N+1.
 */
export function campaignRunIdempotencyKey(jobId: string, attempt: number): string {
  return `${jobId}:attempt-${attempt}`;
}

/**
 * Detects a stale readiness snapshot (AC4 — "retry não reusa snapshot
 * obsoleto"). Compares identity fields only (never `computedAt`), mirroring
 * `shared/campaign-readiness.ts#isSnapshotStale` without needing that
 * module's private fingerprint seed — both snapshots here are already fresh
 * `evaluateCampaignReadiness` outputs computed by the caller.
 */
export function isCampaignReadinessSnapshotStale(
  startedWith: Pick<CampaignReadinessSnapshot, 'inputFingerprint' | 'sourceRevision'>,
  current: Pick<CampaignReadinessSnapshot, 'inputFingerprint' | 'sourceRevision'>,
): boolean {
  return (
    startedWith.inputFingerprint !== current.inputFingerprint ||
    startedWith.sourceRevision !== current.sourceRevision
  );
}

/** READINESS_BLOCKED — the capability is not allowed; fix the blocking entry first (never a safe retry). */
export function classifyReadinessBlocked(
  snapshot: CampaignReadinessSnapshot,
): CampaignRunClassifiedError {
  const first = snapshot.blocking[0];
  const count = snapshot.blocking.length;
  return {
    code: 'READINESS_BLOCKED',
    message: first
      ? `${snapshot.capability.label} está bloqueada: ${first.label}${count > 1 ? ` (e mais ${count - 1} pendência(s))` : ''}.`
      : `${snapshot.capability.label} está bloqueada por pendências no projeto.`,
    action: {
      label: 'Corrigir pendência',
      kind: first?.action.kind === 'briefing' ? 'briefing' : 'journey',
      target: first?.action.target,
    },
    correlationId: redactCorrelationId(snapshot.inputFingerprint),
    retrySafe: false,
  };
}

/** STALE_READINESS — the checklist drifted since it was captured; re-evaluate before running/retrying. */
export function classifyStaleReadiness(
  target: CampaignCapability,
  snapshot: CampaignReadinessSnapshot,
): CampaignRunClassifiedError {
  return {
    code: 'STALE_READINESS',
    message: 'O checklist de prontidão mudou desde a última checagem. Releia antes de executar de novo.',
    action: { label: 'Reavaliar prontidão', kind: 'inline', target },
    correlationId: redactCorrelationId(snapshot.inputFingerprint),
    retrySafe: false,
  };
}

export interface CampaignRunTerminalErrorInput {
  jobId: string;
  attempt: number;
  /**
   * Whatever terminal (or near-terminal) status accompanied the error. Only
   * `'cancelled'` is treated distinctly (`RUN_CANCELLED`) below — everything
   * else classifies as `RUN_FAILED`/`RUN_TIMEOUT`, matching `observeSkillRun`'s
   * own `onError` contract (`SkillRunStatus`, not a narrowed subset).
   */
  status: SkillRunStatus;
  error: SkillRunError | null;
}

/** RUN_FAILED / RUN_CANCELLED / RUN_TIMEOUT — a terminal skill-run outcome. */
export function classifyRunError(input: CampaignRunTerminalErrorInput): CampaignRunClassifiedError {
  const correlationId = redactCorrelationId(input.jobId);
  const reason = input.error?.reason?.trim();

  if (input.status === 'cancelled') {
    return {
      code: 'RUN_CANCELLED',
      message: reason ? `Execução cancelada: ${reason}` : 'Execução cancelada pelo operador.',
      action: { label: 'Executar novamente', kind: 'retry' },
      correlationId,
      retrySafe: true,
    };
  }

  if (input.error?.kind === 'timeout') {
    return {
      code: 'RUN_TIMEOUT',
      message: reason ? `A skill excedeu o tempo limite: ${reason}` : 'A skill excedeu o tempo limite de execução.',
      action: { label: 'Tentar novamente', kind: 'retry' },
      correlationId,
      retrySafe: true,
    };
  }

  return {
    code: 'RUN_FAILED',
    message: reason ? `A skill falhou: ${reason}` : 'A skill falhou por um motivo não identificado pelo runner.',
    action: { label: 'Tentar novamente', kind: 'retry' },
    correlationId,
    retrySafe: true,
  };
}
