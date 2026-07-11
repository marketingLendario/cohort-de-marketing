/**
 * L2 — AI job layer (queue) — INTERFACE / STUB.
 *
 * arch §2.2 L2: creative generation, tracking audit, funnel recommendation,
 * hooks, structure, monitor. These run as Inngest jobs in the dedicated worker,
 * invoking skills/agents via `@sinkra/agent-host`, streaming progress through
 * `@sinkra/job-stream`, with granular per-item retry via `@sinkra/job-runtime`.
 *
 * In 1.3 this is the ENQUEUE INTERFACE only (AC6 — "L2: job de IA via fila =
 * stub/interface, job types `ads-*` vêm depois"). The concrete job types
 * (`ads-factory`, `ads-audit`, ...) and the Inngest function registration land
 * in epics 2-5. The skeleton enqueue marks the job `running` so the contract
 * (`jobs.get`) reports a live async state without a real worker attached.
 *
 * STORY-AL-ADS-1.3 (AC3, AC6).
 */
import type { JobStore } from '../jobs/store.js'
import type { AdsJobRecord } from '../jobs/types.js'

export interface L2EnqueueResult {
  layer: 'L2'
  /** `true` when the job was accepted into the (skeleton) queue. */
  enqueued: boolean
  /** Treatable reason when not enqueued. */
  reason?: string
}

/**
 * Enqueue an L2 AI job. SKELETON: marks the record `running` and logs the
 * pending dispatch. PRODUCTION (epics 2-5): `inngest.send({ name:
 * 'ads-studio/<type>', data })` via `@sinkra/job-runtime` (deploy-topology §1.3),
 * the worker function consumes the event and emits `step|item|log|done|error`.
 */
export function enqueueAiJob(store: JobStore, job: AdsJobRecord): L2EnqueueResult {
  store.setStatus(job.jobId, 'running')
  store.appendLog(
    job.jobId,
    `[L2] job ${job.type} accepted (skeleton queue) — worker job type 'ads-${job.type}' arrives in a later epic`,
  )
  // TODO(epics 2-5): inngest.send({ name: `ads-studio/${job.type}`, data: { jobId: job.jobId, ... } })
  return { layer: 'L2', enqueued: true }
}
