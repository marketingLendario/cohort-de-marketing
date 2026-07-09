/**
 * `jobs.*` tRPC router — the BFF orchestration contract (arch §6.2, AC8).
 *
 *   jobs.enqueue({ type, campaignId, spoke, payload }) → { jobId }
 *   jobs.get({ jobId })                                → JobView (status/steps/items/log/error)
 *   jobs.retryItem({ jobId, itemId })                  → { ok }
 *
 * `enqueue` routes by nature through the L0-L3 dispatcher (NFR8/AC3 — async, does
 * not block the caller). `get` is the polling fallback for graceful degradation
 * (NFR9/AC5). A missing job or unavailable capability is a TREATABLE state, never
 * a mute error (AC2/AC5).
 *
 * STORY-AL-ADS-1.3 (AC1, AC2, AC3, AC5, AC8).
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { publicProcedure, router } from '../trpc.js'
import { dispatch } from '../../orchestration/dispatcher.js'
import type { AdsJobType } from '../../jobs/types.js'

const jobTypeSchema = z.enum([
  'factory',
  'audit',
  'funnel',
  'hooks',
  'structure',
  'publish',
]) satisfies z.ZodType<AdsJobType>

const enqueueInput = z.object({
  type: jobTypeSchema,
  campaignId: z.string().min(1),
  spoke: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
})

const getInput = z.object({ jobId: z.string().min(1) })

const retryItemInput = z.object({
  jobId: z.string().min(1),
  itemId: z.string().min(1),
})

export const jobsRouter = router({
  /** Create + dispatch a job. Returns immediately with the jobId (NFR8/AC3). */
  enqueue: publicProcedure
    .input(enqueueInput)
    .mutation(({ ctx, input }) => {
      const layer = dispatchLayerPlaceholder(input.type)
      const record = ctx.store.create(input, layer)
      const result = dispatch(ctx.store, record)
      // Dispatch failures (e.g. capability unavailable) are recorded on the job
      // record as a treatable state — `jobs.get` reports it; we still return the
      // jobId so the UI can poll/show the dedicated state (AC2/AC5).
      void result
      return { jobId: record.jobId }
    }),

  /** Poll job state — the graceful-degradation fallback for the stream (NFR9). */
  get: publicProcedure.input(getInput).query(({ ctx, input }) => {
    const view = ctx.store.view(input.jobId)
    if (!view) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `job ${input.jobId} not found` })
    }
    return view
  }),

  /**
   * Granular retry of a single failed sub-item (arch §6.3, FR28 AC5). Skeleton:
   * re-marks the item `pending` and the job `running` so the worker re-runs ONLY
   * that item (the real re-execution is owned by the `ads-*` job types). Returns
   * a treatable `{ ok, reason? }` — never throws on a non-failed item.
   */
  retryItem: publicProcedure.input(retryItemInput).mutation(({ ctx, input }) => {
    const record = ctx.store.get(input.jobId)
    if (!record) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `job ${input.jobId} not found` })
    }
    const item = record.items.find((i) => i.id === input.itemId)
    if (!item) {
      return { ok: false, reason: `item ${input.itemId} not found in job ${input.jobId}` }
    }
    if (item.status !== 'failed') {
      return { ok: false, reason: `item ${input.itemId} is '${item.status}', not retryable` }
    }
    ctx.store.upsertItem(input.jobId, { ...item, status: 'pending' })
    ctx.store.setStatus(input.jobId, 'running')
    ctx.store.appendLog(input.jobId, `[retry] item ${input.itemId} re-queued (granular)`)
    return { ok: true }
  }),
})

/**
 * Pre-resolve the routing layer for the initial record (the dispatcher re-sets it
 * authoritatively). Kept in sync with `dispatcher.layerForType` — imported lazily
 * to avoid a layer/router import cycle at module load.
 */
function dispatchLayerPlaceholder(type: AdsJobType): 'L0' | 'L1' | 'L2' | 'L3' {
  return type === 'publish' ? 'L1' : 'L2'
}
