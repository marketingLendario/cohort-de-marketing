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
