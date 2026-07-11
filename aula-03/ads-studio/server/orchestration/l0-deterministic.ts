/**
 * L0 — Deterministic layer (server-side gate). STORY-AL-ADS-1.6.
 *
 * arch §2.2 L0 + §5 Gate#1: unit-economics is computed on the CLIENT in real
 * time (`@sinkra/ads-economics`, NFR4) and **re-validated server-side** as the
 * authority (NFR5). This module recomputes `ltv_cac` from the persisted economics
 * using the SAME `@sinkra/ads-economics` function the client uses (single source
 * of truth) and decides the viability gate — it NEVER trusts a client-supplied
 * number.
 *
 * Invariant (arch §5): the "unlocked" state is a REAL server-side confirmation,
 * not cosmetic. LTV:CAC < 1 ⇒ the gate rejects with a numeric reason.
 *
 * STORY-AL-ADS-1.3 (AC6 — L0 hook); STORY-AL-ADS-1.6 (Gate#1 enforcement).
 */
import { computeUnitEconomics, type UnitEconomicsInputs } from '../lib/ads-economics.js'

export interface L0RevalidationInput {
  campaignId: string
  /** Economics inputs to recompute (server-trusted, read from the DB). */
  inputs: UnitEconomicsInputs
}

export interface L0RevalidationResult {
  layer: 'L0'
  /** Whether the campaign is economically viable (LTV:CAC >= 1). */
  valid: boolean
  /** The server-recomputed LTV:CAC (the number of record). */
  ltvCac: number
  /** Treatable, numeric reason when `valid: false`. */
  reason?: string
}

/** The Gate#1 frontier: a campaign is viable iff LTV:CAC >= 1 (FR5, arch §5). */
export const GATE1_MIN_LTV_CAC = 1

/**
 * Server-side viability re-validation (Gate#1). Recomputes from the given inputs
 * with `@sinkra/ads-economics` and applies the LTV:CAC >= 1 frontier. Pure and
 * synchronous (L0 is a gate, never a job). The reason string carries the numeric
 * value so the UI can surface "LTV:CAC 0.82 < 1" (arch §5).
 */
export function revalidateUnitEconomics(
  input: L0RevalidationInput,
): L0RevalidationResult {
  const metrics = computeUnitEconomics(input.inputs)
  const ltvCac = metrics.ltvCac
  if (ltvCac < GATE1_MIN_LTV_CAC) {
    return {
      layer: 'L0',
      valid: false,
      ltvCac,
      reason: `LTV:CAC ${ltvCac.toFixed(2)} < ${GATE1_MIN_LTV_CAC}`,
    }
  }
  return { layer: 'L0', valid: true, ltvCac }
}
