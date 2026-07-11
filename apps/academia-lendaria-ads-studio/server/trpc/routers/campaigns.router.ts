/**
 * `campaign.*` tRPC router — wizard state + Gate#1 enforcement (STORY-AL-ADS-1.6).
 *
 *   campaign.get({ campaignId })                  → { stepCurrent, viabilityApproved } (resumable — FR37)
 *   campaign.advanceToStep({ campaignId, targetStep }) → { stepCurrent, ltvCac, thresholds }
 *
 * `advanceToStep` is the heart of NFR5 (arch §5 Gate#1): the BFF reloads
 * `ads_unit_economics` from the DB, recomputes `ltv_cac` server-side via
 * `@sinkra/ads-economics`, and REJECTS with `PRECONDITION_FAILED` + a numeric
 * reason when `ltv_cac < 1` — it never trusts a client value (the mutation takes
 * no economics payload). On a pass it persists the derived thresholds the monitor
 * inherits (FR6/FR32) and the new `step_current`.
 */
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { publicProcedure, router } from '../trpc.js'
import { advanceToStep } from '../../orchestration/advance-step.js'
import type { TRPCContext } from '../context.js'
import type { CampaignEconomicsRepo } from '../../lib/campaign-economics-repo.js'

const advanceInput = z.object({
  campaignId: z.string().min(1),
  /** Target wizard step (2..8). Step 1 needs no gate. */
  targetStep: z.number().int().min(2).max(8),
})

const getInput = z.object({ campaignId: z.string().min(1) })

/** Treatable "no DB seam" — the BFF can boot without DB; surfaces, never mute. */
function requireRepo(ctx: TRPCContext): CampaignEconomicsRepo {
  if (!ctx.campaignRepo) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'campaign repository unavailable (no DB configured)',
    })
  }
  return ctx.campaignRepo
}

export const campaignsRouter = router({
  /** Resumable wizard cursor (FR37) — used by the UI to re-enter the right step. */
  get: publicProcedure.input(getInput).query(async ({ ctx, input }) => {
    const repo = requireRepo(ctx)
    const stepCurrent = await repo.getStepCurrent(input.campaignId)
    if (stepCurrent === null) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `campaign ${input.campaignId} not found` })
    }
    return { campaignId: input.campaignId, stepCurrent }
  }),

  /**
   * Advance the wizard with Gate#1 enforced server-side (NFR5). On reject the
   * mutation throws `PRECONDITION_FAILED` with the numeric reason; the UI mirrors
   * it (disabled button + message) but the backend is the authority — bypassing
   * the front cannot advance an infeasible campaign.
   */
  advanceToStep: publicProcedure.input(advanceInput).mutation(async ({ ctx, input }) => {
    const repo = requireRepo(ctx)
    const result = await advanceToStep({
      repo,
      campaignId: input.campaignId,
      targetStep: input.targetStep,
    })

    if (!result.ok) {
      if (result.code === 'CAMPAIGN_NOT_FOUND') {
        throw new TRPCError({ code: 'NOT_FOUND', message: result.reason })
      }
      // VIABILITY_REPROVED / ECONOMICS_MISSING / INVALID_STEP — all are
      // precondition failures (the request is well-formed; the state forbids it).
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: result.reason })
    }

    return {
      campaignId: input.campaignId,
      stepCurrent: result.stepCurrent,
      ltvCac: result.ltvCac,
      thresholds: result.thresholds,
    }
  }),
})
