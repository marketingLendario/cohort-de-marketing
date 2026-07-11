/**
 * Gate#1 enforcement on the wizard-advance path (STORY-AL-ADS-1.6, arch §5).
 *
 * This is the heart of NFR5: advancing the wizard from step 1 → 2 (and any
 * step > 1) is gated on the SERVER. The flow reloads `ads_unit_economics` from
 * the DB, recomputes `ltv_cac` via `@sinkra/ads-economics` (L0, single source of
 * truth) and rejects with `PRECONDITION_FAILED` if `ltv_cac < 1` — regardless of
 * anything the client sent. On a pass it derives + persists the thresholds the
 * monitor inherits (FR6/FR32) and advances `step_current` (FR37 resumable).
 *
 * Bypassing the front (calling this path directly with a tampered payload) MUST
 * NOT permit an advance with viability reproved — there is no client number in
 * this path at all; the only economics used are the ones read from the DB.
 */
import { computeUnitEconomics, maxCpa, breakevenRoas } from '../lib/ads-economics.js'
import {
  revalidateUnitEconomics,
  type L0RevalidationResult,
} from './l0-deterministic.js'
import type {
  CampaignEconomicsRepo,
  CampaignThresholds,
} from '../lib/campaign-economics-repo.js'

const CENTS = 100

export type AdvanceRejectionCode =
  | 'CAMPAIGN_NOT_FOUND'
  | 'ECONOMICS_MISSING'
  | 'VIABILITY_REPROVED'
  | 'INVALID_STEP'

export interface AdvanceOk {
  ok: true
  stepCurrent: number
  /** Server-recomputed LTV:CAC of record. */
  ltvCac: number
  /** Thresholds persisted for the monitor (FR6/FR32). */
  thresholds: CampaignThresholds
}

export interface AdvanceRejected {
  ok: false
  code: AdvanceRejectionCode
  /** Numeric/human reason (e.g. "LTV:CAC 0.82 < 1"). */
  reason: string
}

export type AdvanceResult = AdvanceOk | AdvanceRejected

/**
 * Derive the monitor thresholds from the (server-trusted) economics inputs.
 * cpa_target = Max CPA (= price × margin × 0.5); roas_min = break-even ROAS
 * (= 1 / margin). Both via `@sinkra/ads-economics` (no invention — Art. IV).
 * Max CPA is stored in CENTAVOS (the campaign/economics money unit). A
 * non-finite break-even ROAS (margin 0) persists as null ("undefined").
 */
export function deriveThresholds(inputs: {
  productPrice: number
  grossMargin: number
}): CampaignThresholds {
  const maxCpaUnit = maxCpa(inputs.productPrice, inputs.grossMargin)
  const beRoas = breakevenRoas(inputs.grossMargin)
  return {
    cpaTargetCents: Math.round(maxCpaUnit * CENTS),
    roasMin: Number.isFinite(beRoas) ? beRoas : null,
  }
}

export interface AdvanceToStepArgs {
  repo: CampaignEconomicsRepo
  campaignId: string
  /** The wizard step the operator wants to move to (2..8). */
  targetStep: number
}

/**
 * Enforce Gate#1 and, on success, persist the advance. Returns a treatable
 * result (never throws on a domain rejection); infrastructure errors from the
 * repo propagate so the caller maps them to an INTERNAL error.
 */
export async function advanceToStep({
  repo,
  campaignId,
  targetStep,
}: AdvanceToStepArgs): Promise<AdvanceResult> {
  if (!Number.isInteger(targetStep) || targetStep < 2 || targetStep > 8) {
    return {
      ok: false,
      code: 'INVALID_STEP',
      reason: `target step ${targetStep} out of range (2..8)`,
    }
  }

  const current = await repo.getStepCurrent(campaignId)
  if (current === null) {
    return { ok: false, code: 'CAMPAIGN_NOT_FOUND', reason: `campaign ${campaignId} not found` }
  }

  // Gate#1 guards EVERY transition to a step > 1 (arch §5), so the gate is
  // re-checked even when resuming or jumping forward — the unlocked state is
  // never assumed from a prior session.
  const economics = await repo.getEconomics(campaignId)
  if (!economics) {
    return {
      ok: false,
      code: 'ECONOMICS_MISSING',
      reason: 'unit economics not set — complete step 1 first',
    }
  }

  const inputs = {
    productPrice: economics.productPrice,
    grossMargin: economics.grossMargin,
    adSpendMonthly: economics.adSpendMonthly,
    customersMonthly: economics.customersMonthly,
    repeatPurchaseRate: economics.repeatPurchaseRate,
    avgCustomerLifespanMonths: economics.avgCustomerLifespanMonths,
    orderBump: economics.orderBump,
    upsells: economics.upsells,
  }

  const verdict: L0RevalidationResult = revalidateUnitEconomics({ campaignId, inputs })
  if (!verdict.valid) {
    // Hard gate (NFR5): do NOT advance, do NOT persist thresholds. Numeric reason.
    return { ok: false, code: 'VIABILITY_REPROVED', reason: verdict.reason ?? 'inviável' }
  }

  // Viable — derive thresholds and commit the advance as ONE confirmation.
  const thresholds = deriveThresholds(inputs)
  await repo.commitAdvance({
    campaignId,
    stepCurrent: targetStep,
    viabilityApproved: true,
    thresholds,
  })

  // Sanity: the computed metrics align with the verdict (defensive, no I/O).
  void computeUnitEconomics(inputs)

  return { ok: true, stepCurrent: targetStep, ltvCac: verdict.ltvCac, thresholds }
}
