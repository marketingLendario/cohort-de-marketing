/**
 * Worker job runner — granular per-item execution over `@sinkra/job-runtime`.
 *
 * This is the REUSE-of-libs montage (arch §2.2 mitigation, AC7): the dedicated
 * worker does NOT recreate the job foundation — it WIRES the extracted packages.
 * `retryGranular` re-executes ONLY failed sub-items across attempts while
 * preserving the succeeded ones (arch §6.3, FR28 AC5 — Tela 7 passo 4 / Tela 5b).
 *
 * Progress is streamed via an injected emitter (the BFF wires `@sinkra/job-stream`
 * over SSE/WS — deploy-topology §1.4). Per-item transitions update the job store
 * so `jobs.get` (polling fallback, NFR9) and the stream stay consistent.
 *
 * STORY-AL-ADS-1.3 (AC7, AC8) — skeleton: the executor is injected; the real
 * `ads-*` executors (`@sinkra/agent-host` skill invocation) arrive in epics 2-5.
 */
import { retryGranular, type JobItem } from '../lib/job-runtime/index.js'
import type { JobStore } from '../jobs/store.js'
import type { AdsJobEvent } from '../jobs/events.js'

/** Emits a progress event on the job channel (SSE/WS via `@sinkra/job-stream`). */
export type JobEventEmitter = (event: AdsJobEvent) => void | Promise<void>

export interface RunStepOptions<TPayload, TValue> {
  store: JobStore
  emit: JobEventEmitter
  jobId: string
  stepId: string
  stepLabel: string
  items: ReadonlyArray<JobItem<TPayload>>
  /** Per-item executor (real `ads-*` logic is injected by the job type). */
  executor: (item: JobItem<TPayload>, attempt: number) => Promise<TValue>
  maxAttempts?: number
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Run one step's N items with granular retry, emitting `step` + per-`item`
 * events and mirroring state into the job store. Returns the partition of
 * succeeded/failed items so the caller can decide the job's terminal status.
 */
export async function runStep<TPayload, TValue>(
  opts: RunStepOptions<TPayload, TValue>,
): Promise<{ succeededIds: string[]; failedIds: string[] }> {
  const { store, emit, jobId, stepId, stepLabel, items, executor } = opts

  store.upsertStep(jobId, { id: stepId, label: stepLabel, status: 'running' })
  await emit({
    type: 'step',
    payload: { jobId, stepId, label: stepLabel, status: 'running', timestamp: nowIso() },
  })

  // Seed every item as pending (mirrors `publish_job_items` rows — arch §6.3).
  for (const item of items) {
    store.upsertItem(jobId, { id: item.id, stepId, status: 'pending', attempts: 0 })
  }

  const result = await retryGranular(items, async (item, attempt) => {
    store.upsertItem(jobId, { id: item.id, stepId, status: 'running', attempts: attempt })
    await emit({
      type: 'item',
      payload: { jobId, stepId, itemId: item.id, status: 'running', attempts: attempt, timestamp: nowIso() },
    })
    const value = await executor(item, attempt)
    store.upsertItem(jobId, { id: item.id, stepId, status: 'ok', attempts: attempt })
    await emit({
      type: 'item',
      payload: { jobId, stepId, itemId: item.id, status: 'ok', attempts: attempt, timestamp: nowIso() },
    })
    return value
  }, { maxAttempts: opts.maxAttempts ?? 3 })

  for (const failure of result.failed) {
    store.upsertItem(jobId, {
      id: failure.id,
      stepId,
      status: 'failed',
      attempts: failure.attempts,
      error: failure.error.message,
    })
    await emit({
      type: 'item',
      payload: {
        jobId,
        stepId,
        itemId: failure.id,
        status: 'failed',
        attempts: failure.attempts,
        error: failure.error.message,
        timestamp: nowIso(),
      },
    })
  }

  const stepStatus = result.failed.length === 0 ? 'done' : 'failed'
  store.upsertStep(jobId, { id: stepId, label: stepLabel, status: stepStatus })
  await emit({
    type: 'step',
    payload: { jobId, stepId, label: stepLabel, status: stepStatus, timestamp: nowIso() },
  })

  return {
    succeededIds: result.succeeded.map((s) => s.id),
    failedIds: result.failed.map((f) => f.id),
  }
}
