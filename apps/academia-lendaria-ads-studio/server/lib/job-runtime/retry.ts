/**
 * Granular per-item retry — PURE, infra-agnostic.
 *
 * Distilled from the squad-engine retry pattern (Inngest `retries` + per-node
 * frontier handling in `inngest/node-execute.ts`, OCC backoff in
 * `agent/occ.ts`). Those implementations are coupled to Inngest/Supabase; this
 * helper extracts the genuinely reusable kernel: **on a batch, only the failed
 * items are re-executed on the next attempt, while successful results are
 * preserved** (FR28/FR39 — retry granular). No singletons, no I/O of its own.
 *
 * STORY-AL-ADS-0c.4 AC1 + Testing.
 */
import type { BatchResult, JobItem, JobItemResult } from './types.js'

export interface RetryOptions {
  /** Max attempts PER ITEM (>=1). attempt 1 is the initial run. Default 3. */
  maxAttempts?: number
  /** Base backoff in ms before re-running failed items. Default 0 (no wait). */
  baseDelayMs?: number
  /** Exponential backoff factor applied per attempt. Default 2. */
  backoffFactor?: number
  /** Sleep impl (injectable for deterministic tests). Default real setTimeout. */
  sleep?: (ms: number) => Promise<void>
}

const DEFAULT_OPTS: Required<Omit<RetryOptions, 'sleep'>> = {
  maxAttempts: 3,
  baseDelayMs: 0,
  backoffFactor: 2,
}

const realSleep = (ms: number): Promise<void> =>
  ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve()

/**
 * Execute every item, then re-execute ONLY the ones that failed, up to
 * `maxAttempts` total passes. A passing item is recorded once and never
 * re-run; a failing item carries its latest error. The returned
 * {@link BatchResult} partitions the final state.
 *
 * The executor receives the item and the 1-based attempt number. It must throw
 * (or reject) to signal failure; any return value (including `undefined`) is a
 * success.
 *
 * Invariant proven by the unit test: a single failing item re-runs in
 * isolation across attempts while the already-succeeded items are preserved and
 * not re-executed.
 */
export async function retryGranular<TPayload, TValue>(
  items: ReadonlyArray<JobItem<TPayload>>,
  executor: (item: JobItem<TPayload>, attempt: number) => Promise<TValue>,
  options: RetryOptions = {},
): Promise<BatchResult<TValue>> {
  const opts = { ...DEFAULT_OPTS, ...options }
  if (opts.maxAttempts < 1) {
    throw new Error(`retryGranular: maxAttempts must be >= 1, got ${opts.maxAttempts}`)
  }
  const sleep = options.sleep ?? realSleep

  const succeeded = new Map<string, Extract<JobItemResult<TValue>, { ok: true }>>()
  let pending: Array<JobItem<TPayload>> = [...items]
  const lastError = new Map<string, Error>()
  const attemptsByItem = new Map<string, number>()
  let attemptsUsed = 0

  for (let attempt = 1; attempt <= opts.maxAttempts && pending.length > 0; attempt++) {
    attemptsUsed = attempt
    if (attempt > 1 && opts.baseDelayMs > 0) {
      await sleep(opts.baseDelayMs * Math.pow(opts.backoffFactor, attempt - 2))
    }

    const stillPending: Array<JobItem<TPayload>> = []
    // Run the current pending set; only failures roll into the next attempt.
    const outcomes = await Promise.all(
      pending.map(async (item) => {
        attemptsByItem.set(item.id, attempt)
        try {
          const value = await executor(item, attempt)
          return { item, ok: true as const, value }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          return { item, ok: false as const, error }
        }
      }),
    )

    for (const outcome of outcomes) {
      if (outcome.ok) {
        succeeded.set(outcome.item.id, {
          id: outcome.item.id,
          ok: true,
          value: outcome.value,
          attempts: attemptsByItem.get(outcome.item.id) ?? attempt,
        })
        lastError.delete(outcome.item.id)
      } else {
        lastError.set(outcome.item.id, outcome.error)
        stillPending.push(outcome.item)
      }
    }

    pending = stillPending
  }

  const failed: Array<Extract<JobItemResult<TValue>, { ok: false }>> = pending.map((item) => ({
    id: item.id,
    ok: false,
    error: lastError.get(item.id) ?? new Error(`item ${item.id} failed`),
    attempts: attemptsByItem.get(item.id) ?? attemptsUsed,
  }))

  return {
    succeeded: [...succeeded.values()],
    failed,
    attemptsUsed,
  }
}
