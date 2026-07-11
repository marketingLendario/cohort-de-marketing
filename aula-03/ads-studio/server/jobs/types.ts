/**
 * Ads Studio job records — the persisted shape behind the `jobs.*` tRPC contract.
 *
 * In production these map to `publish_jobs` / `skill_jobs` + `publish_job_items`
 * (arch §6.3). The skeleton models the SAME shape in memory (see `store.ts`) so
 * the tRPC contract, the L0-L3 dispatcher and the worker can all be wired and
 * tested before the `ads-*` job types and the DB tables land (AC6: "esqueleto +
 * L0/L1 funcionando; L2/L3 ganham job types nos épicos seguintes").
 *
 * STORY-AL-ADS-1.3 (AC2, AC8).
 */

/** Job types per arch §6.2 `jobs.enqueue`. */
export type AdsJobType =
  | 'factory'
  | 'audit'
  | 'funnel'
  | 'hooks'
  | 'structure'
  | 'publish'

/** Job lifecycle states (arch §6.1). `pending` aliases `queued` at the contract edge. */
export type AdsJobStatus = 'pending' | 'running' | 'done' | 'partial' | 'failed'

/** Per-item state — the unit of granular retry (arch §6.3, FR28 AC5). */
export type AdsJobItemStatus = 'pending' | 'running' | 'ok' | 'failed'

/** A retryable sub-item of a job (one ad/creative, one factory piece, ...). */
export interface AdsJobItem {
  id: string
  /** Step this item belongs to (campaign create, adset create, creative+ad, ...). */
  stepId: string
  status: AdsJobItemStatus
  attempts: number
  /** Treatable failure reason surfaced to the UI (NFR9). Present when `failed`. */
  error?: string
}

/** A high-level step of a job, optionally containing N retryable items. */
export interface AdsJobStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'failed'
}

/** A treatable error envelope (AC2 + NFR9 — never a mute error). */
export interface AdsJobError {
  /** Human/UI reason. */
  reason: string
  /** `true` → capability indisponível (degradation), UI shows a dedicated state. */
  capabilityUnavailable: boolean
}

/** The persisted job record — returned (projected) by `jobs.get`. */
export interface AdsJobRecord {
  jobId: string
  type: AdsJobType
  campaignId: string
  spoke: string
  /** Routing layer resolved by the dispatcher (L0-L3). */
  layer: 'L0' | 'L1' | 'L2' | 'L3'
  status: AdsJobStatus
  steps: AdsJobStep[]
  items: AdsJobItem[]
  log: string[]
  error?: AdsJobError
  createdAt: string
  updatedAt: string
}

/** Opaque, JSON-shaped enqueue payload (per-type schema arrives with `ads-*`). */
export type AdsJobPayload = Record<string, unknown>

/** Input of `jobs.enqueue` (arch §6.2). */
export interface EnqueueInput {
  type: AdsJobType
  campaignId: string
  spoke: string
  payload: AdsJobPayload
}

/** Projection returned by `jobs.get` (arch §6.2 — status/steps/items/log). */
export interface JobView {
  jobId: string
  status: AdsJobStatus
  layer: 'L0' | 'L1' | 'L2' | 'L3'
  steps: AdsJobStep[]
  items: AdsJobItem[]
  log: string[]
  error?: AdsJobError
}

// ---------------------------------------------------------------------------
// Skill-run jobs — the durable, async, observable Codex CLI run journal.
// STORY-8.W2.2. Separate job family from the `ads-*` skeleton above: these back
// the LOCAL skill runner (`/api/local/skills/:skillId/run`), persist to Supabase
// (`skill_run_jobs`) and carry a recovery lease so a BFF restart can reclaim a
// non-terminal run without duplicating side effects.
// ---------------------------------------------------------------------------

import type { LocalSkillRunInput, SkillProposal } from '../local-skill-runner.js'

/** Persisted input snapshot — the run re-executes from THIS, never from the HTTP connection. */
export type { LocalSkillRunInput, SkillProposal } from '../local-skill-runner.js'

/** Skill-run lifecycle. `queued`/`running` are non-terminal (recoverable). */
export type SkillRunJobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

/** Terminal states — never reclaimed by recovery, never retried in place. */
export const SKILL_RUN_TERMINAL_STATUSES: readonly SkillRunJobStatus[] = [
  'succeeded',
  'failed',
  'cancelled',
] as const

export function isSkillRunTerminal(status: SkillRunJobStatus): boolean {
  return SKILL_RUN_TERMINAL_STATUSES.includes(status)
}

/** A coarse phase of the run, surfaced to the UI progress timeline. */
export interface SkillRunStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'failed'
  timestamp: string
}

/** A scrubbed log line for the progress timeline (never carries secrets — AC/NFR). */
export interface SkillRunLogLine {
  level: 'info' | 'warn' | 'error'
  message: string
  timestamp: string
}

/** An auditable attempt record — one per claim (retry/recovery each add one). */
export interface SkillRunAttempt {
  /** 1-based attempt number. */
  attempt: number
  status: 'running' | 'succeeded' | 'failed' | 'cancelled'
  /** Why the attempt ended (e.g. `lease_expired`, `cancelled`, error message). */
  reason?: string
  startedAt: string
  endedAt?: string
}

/** Treatable error envelope (never a mute error). */
export interface SkillRunJobError {
  reason: string
  capabilityUnavailable: boolean
}

/** The persisted durable skill-run job record (row of `skill_run_jobs`). */
export interface SkillRunJobRecord {
  jobId: string
  workspaceId: string
  projectId: string
  skillId: string
  /** sha256 of the canonical SKILL.md — set when a run resolves the skill. */
  skillHash: string | null
  status: SkillRunJobStatus
  /** Current attempt number (1-based). Incremented by retry and lease recovery. */
  attempt: number
  /** Full attempt audit trail. */
  attempts: SkillRunAttempt[]
  steps: SkillRunStep[]
  logs: SkillRunLogLine[]
  /** Persisted brief/context snapshot — the recovery source of truth. */
  input: LocalSkillRunInput
  proposal: SkillProposal | null
  model: string | null
  error: SkillRunJobError | null
  /** Recovery lease — owner id + expiry. Null when no worker holds the job. */
  leaseOwner: string | null
  leaseExpiresAt: string | null
  createdAt: string
  updatedAt: string
}

/** Projection returned by polling (`GET .../skill-runs/:jobId`) and the SSE snapshot. */
export interface SkillRunJobView {
  jobId: string
  skillId: string
  status: SkillRunJobStatus
  attempt: number
  attempts: SkillRunAttempt[]
  steps: SkillRunStep[]
  logs: SkillRunLogLine[]
  proposal: SkillProposal | null
  skillHash: string | null
  model: string | null
  error: SkillRunJobError | null
  updatedAt: string
}

export function projectSkillRun(record: SkillRunJobRecord): SkillRunJobView {
  return {
    jobId: record.jobId,
    skillId: record.skillId,
    status: record.status,
    attempt: record.attempt,
    attempts: record.attempts,
    steps: record.steps,
    logs: record.logs,
    proposal: record.proposal,
    skillHash: record.skillHash,
    model: record.model,
    error: record.error,
    updatedAt: record.updatedAt,
  }
}
