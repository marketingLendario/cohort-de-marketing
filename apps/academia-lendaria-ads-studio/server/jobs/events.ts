/**
 * Ads Studio job-progress event protocol.
 *
 * This is the Ads Studio *consumer* union for `@sinkra/job-stream` (arch §2.2:
 * "Other consumers can define their own union and pass it as the generic
 * parameter to the stream functions"). The transport (`emitWsEvent` /
 * `getSessionBuffer`) is generic over {@link JobEventBase}; this file pins the
 * concrete `step|item|log|done|error` vocabulary that arch §6.2 / deploy-topology
 * §1.4 mandate for the `job:{jobId}` channel.
 *
 * Transport note (deploy-topology §1.4): the PRODUCTION channel is **SSE via the
 * BFF**, with tRPC polling (`jobs.get`) as the graceful-degradation fallback
 * (NFR9). WebSocket is an equivalent transport of the SAME union — the protocol
 * is transport-agnostic by construction, so AC8's `job:{jobId}` WS channel and
 * the topology's SSE channel carry identical events.
 *
 * STORY-AL-ADS-1.3 (AC8) — skeleton; the `ads-*` job types that emit these
 * events arrive in epics 2-5.
 */
import type { JobEventBase } from '../lib/job-stream/events.js'

/** Canonical channel name for a job's progress stream (SSE/WS). */
export function jobChannel(jobId: string): string {
  return `job:${jobId}`
}

/** A high-level phase of a job (e.g. "create campaign", "create adsets"). */
export interface AdsJobEventStep extends JobEventBase {
  type: 'step'
  payload: {
    jobId: string
    stepId: string
    label: string
    status: 'pending' | 'running' | 'done' | 'failed'
    timestamp: string
  }
}

/**
 * A single sub-item transition within a step (e.g. one ad/creative of N, one
 * factory piece of N). Sub-items are the unit of granular retry (arch §6.3).
 */
export interface AdsJobEventItem extends JobEventBase {
  type: 'item'
  payload: {
    jobId: string
    stepId: string
    itemId: string
    status: 'pending' | 'running' | 'ok' | 'failed'
    attempts: number
    error?: string
    timestamp: string
  }
}

/** A free-form, scrubbed log line for the progress timeline. */
export interface AdsJobEventLog extends JobEventBase {
  type: 'log'
  payload: {
    jobId: string
    level: 'info' | 'warn' | 'error'
    message: string
    timestamp: string
  }
}

/** Terminal success/partial — the job finished its passes. */
export interface AdsJobEventDone extends JobEventBase {
  type: 'done'
  payload: {
    jobId: string
    status: 'done' | 'partial'
    timestamp: string
  }
}

/** Terminal failure — the job (or capability) is unavailable/failed. */
export interface AdsJobEventError extends JobEventBase {
  type: 'error'
  payload: {
    jobId: string
    /** Treatable reason for the UI (NFR9 — never a mute error). */
    reason: string
    /** `true` when the failure is a missing/unavailable capability (degradation). */
    capabilityUnavailable: boolean
    timestamp: string
  }
}

/** The Ads Studio job event union — `step|item|log|done|error` (arch §6.2). */
export type AdsJobEvent =
  | AdsJobEventStep
  | AdsJobEventItem
  | AdsJobEventLog
  | AdsJobEventDone
  | AdsJobEventError

// ---------------------------------------------------------------------------
// Skill-run progress protocol — the SSE/polling vocabulary of the durable Codex
// runner (STORY-8.W2.2). SSE delivers `snapshot` then `progress|done|error`;
// polling reads the SAME projection (`SkillRunJobView`) as `snapshot.payload`.
// ---------------------------------------------------------------------------
import type {
  SkillProposal,
  SkillRunJobError,
  SkillRunJobStatus,
  SkillRunJobView,
  SkillRunLogLine,
  SkillRunStep,
} from './types.js'

/** Canonical SSE channel for a skill-run's progress stream. */
export function skillRunChannel(jobId: string): string {
  return `skill-run:${jobId}`
}

/** First event on subscribe — the full current projection (late-subscriber safe). */
export interface SkillRunEventSnapshot {
  type: 'snapshot'
  payload: SkillRunJobView
}

/** Incremental progress — a step transition and/or a new log line. */
export interface SkillRunEventProgress {
  type: 'progress'
  payload: {
    jobId: string
    status: SkillRunJobStatus
    attempt: number
    step?: SkillRunStep
    log?: SkillRunLogLine
    timestamp: string
  }
}

/** Terminal success — the proposal is ready for human review. */
export interface SkillRunEventDone {
  type: 'done'
  payload: {
    jobId: string
    status: 'succeeded'
    proposal: SkillProposal
    skillHash: string
    model: string
    timestamp: string
  }
}

/** Terminal failure/cancel — treatable reason (never a mute error). */
export interface SkillRunEventError {
  type: 'error'
  payload: {
    jobId: string
    status: 'failed' | 'cancelled'
    error: SkillRunJobError
    timestamp: string
  }
}

export type SkillRunEvent =
  | SkillRunEventSnapshot
  | SkillRunEventProgress
  | SkillRunEventDone
  | SkillRunEventError

export type SkillRunEventListener = (event: SkillRunEvent) => void

/**
 * In-process pub/sub for skill-run progress. Adequate for the MVP single-process
 * topology (BFF + worker coabit one Fastify process). A multi-replica deployment
 * swaps this for a Redis/`@sinkra/job-stream` bridge behind the same interface.
 */
export interface SkillRunEventBus {
  publish(jobId: string, event: SkillRunEvent): void
  subscribe(jobId: string, listener: SkillRunEventListener): () => void
}

export function createSkillRunEventBus(): SkillRunEventBus {
  const listeners = new Map<string, Set<SkillRunEventListener>>()
  return {
    publish(jobId, event) {
      const set = listeners.get(jobId)
      if (!set) return
      for (const listener of [...set]) {
        try {
          listener(event)
        } catch {
          // A failing subscriber must never break the publisher or sibling subscribers.
        }
      }
    },
    subscribe(jobId, listener) {
      let set = listeners.get(jobId)
      if (!set) {
        set = new Set()
        listeners.set(jobId, set)
      }
      set.add(listener)
      return () => {
        const current = listeners.get(jobId)
        if (!current) return
        current.delete(listener)
        if (current.size === 0) listeners.delete(jobId)
      }
    },
  }
}
