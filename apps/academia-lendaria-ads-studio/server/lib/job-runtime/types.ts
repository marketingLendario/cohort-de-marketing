/**
 * Job-runtime types — infra-agnostic.
 *
 * Decoupled job vocabulary shared by the squad-engine and the Ads Studio
 * worker. These types carry NO dependency on Inngest, Supabase, Redis or any
 * singleton — they describe the *shape* of a job and its per-item outcome, so
 * any runtime (Inngest function, BullMQ worker, plain async loop) can adopt
 * them. (STORY-AL-ADS-0c.4 AC1 — "tipos de job genuinamente desacoplados".)
 */

/**
 * Terminal status of a job (or of a single item within a job).
 * Mirrors the squad-engine node terminal vocabulary ('completed' | 'failed')
 * generalized for reuse.
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed'

/**
 * A unit of work. `id` is the stable identity used to correlate the item
 * across retry attempts (so a re-run targets the same item). `payload` is the
 * opaque, JSON-shaped input handed to the executor.
 */
export interface JobItem<TPayload = unknown> {
  id: string
  payload: TPayload
}

/**
 * Outcome of executing a single item.
 *  - `ok: true`  → `value` holds the executor result.
 *  - `ok: false` → `error` holds the failure; the item is eligible for retry.
 */
export type JobItemResult<TValue = unknown> =
  | { id: string; ok: true; value: TValue; attempts: number }
  | { id: string; ok: false; error: Error; attempts: number }

/**
 * Aggregate result of a granular retry pass over a batch.
 *  - `succeeded` preserves every item that ever passed (across attempts).
 *  - `failed` holds items still failing after retries were exhausted.
 *  - `attemptsUsed` is the number of batch passes actually performed.
 */
export interface BatchResult<TValue = unknown> {
  succeeded: Array<Extract<JobItemResult<TValue>, { ok: true }>>
  failed: Array<Extract<JobItemResult<TValue>, { ok: false }>>
  attemptsUsed: number
}
