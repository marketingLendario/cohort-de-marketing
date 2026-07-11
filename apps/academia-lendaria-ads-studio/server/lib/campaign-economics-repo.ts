/**
 * Backend repository for the Gate#1 enforcement path (STORY-AL-ADS-1.6, arch §5).
 *
 * The BFF is the AUTHORITY for the viability gate (NFR5): it reloads
 * `ads_unit_economics` FROM THE DATABASE and recomputes `ltv_cac` server-side —
 * it never trusts a value sent by the client. This module is the thin DB seam
 * that the gate logic depends on, defined behind an interface so the gate can be
 * tested directly against a real DB (the NFR5 integration test) without a live
 * Fastify server, and so the in-memory orchestration tests stay DB-free.
 *
 * Boundary (arch §8 / NFR10): this runs on the BACKEND only. It uses the
 * service-role key (never shipped to the client). The public Vercel host never
 * holds this key nor reaches this code — it only speaks tRPC to the BFF.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The economics inputs needed to recompute the gate, read verbatim from
 * `ads_unit_economics`. Money is stored in CENTAVOS; the repo converts to the
 * monetary unit `@sinkra/ads-economics` expects (reais) at this single boundary,
 * mirroring the client-side conversion in `src/lib/unit-economics-db.ts`.
 */
export interface CampaignEconomicsRow {
  campaignId: string
  productPrice: number
  /** Gross margin as a fraction 0..1 (DB stores 0..100). */
  grossMargin: number
  adSpendMonthly: number
  customersMonthly: number
  repeatPurchaseRate: number
  avgCustomerLifespanMonths: number
  orderBump: { price: number; rate: number } | null
  upsells: Array<{ price: number; rate: number }>
}

/** Thresholds derived on a viability pass, persisted for the monitor (FR6/FR32). */
export interface CampaignThresholds {
  /** Max CPA in CENTAVOS. */
  cpaTargetCents: number | null
  /** Break-even ROAS (null when margin is 0 → undefined). */
  roasMin: number | null
}

/**
 * The seam the gate logic depends on. A real implementation talks to Supabase;
 * the NFR5 test provides a real one bound to the local DB; the unit tests can
 * provide an in-memory fake.
 */
export interface CampaignEconomicsRepo {
  /** Current `step_current` of the campaign (resumable cursor — FR37). */
  getStepCurrent(campaignId: string): Promise<number | null>
  /** Economics row for the campaign, or null if not set yet. */
  getEconomics(campaignId: string): Promise<CampaignEconomicsRow | null>
  /**
   * Persist the advance: step cursor + viability flag + derived thresholds, in a
   * single update. Called ONLY after the gate approves (arch §5 invariant: the
   * "unlocked" state is a real server-side confirmation).
   */
  commitAdvance(args: {
    campaignId: string
    stepCurrent: number
    viabilityApproved: boolean
    thresholds: CampaignThresholds
  }): Promise<void>
}

const CENTS = 100

function centsToUnit(cents: number | null | undefined): number {
  return (cents ?? 0) / CENTS
}

/** Map a raw `ads_unit_economics` DB row to gate inputs (cents→reais, 0..100→0..1). */
export function mapEconomicsRow(
  campaignId: string,
  raw: Record<string, unknown>,
): CampaignEconomicsRow {
  const bump = (raw.order_bump ?? {}) as { price_cents?: number; rate?: number }
  const upsells = (raw.upsells ?? []) as Array<{ price_cents?: number; rate?: number }>
  const hasBump = typeof bump.price_cents === 'number' || typeof bump.rate === 'number'
  return {
    campaignId,
    productPrice: centsToUnit(raw.product_price_cents as number),
    grossMargin: Number(raw.gross_margin_pct ?? 0) / 100,
    adSpendMonthly: centsToUnit(raw.ad_spend_monthly_cents as number),
    customersMonthly: Number(raw.customers_monthly ?? 0),
    repeatPurchaseRate: Number(raw.repeat_purchase_rate ?? 0),
    avgCustomerLifespanMonths: Number(raw.avg_customer_lifespan_months ?? 0),
    orderBump: hasBump
      ? { price: centsToUnit(bump.price_cents), rate: Number(bump.rate ?? 0) }
      : null,
    upsells: upsells.map((u) => ({
      price: centsToUnit(u.price_cents),
      rate: Number(u.rate ?? 0),
    })),
  }
}

/** Supabase-backed repo (service-role). Backend-only — NFR10. */
export function createSupabaseCampaignRepo(client: SupabaseClient): CampaignEconomicsRepo {
  return {
    async getStepCurrent(campaignId) {
      const { data, error } = await client
        .from('ads_campaigns')
        .select('step_current')
        .eq('id', campaignId)
        .maybeSingle()
      if (error) throw new Error(`[campaign-repo] step_current read failed: ${error.message}`)
      return data ? (data.step_current as number) : null
    },

    async getEconomics(campaignId) {
      const { data, error } = await client
        .from('ads_unit_economics')
        .select(
          'product_price_cents, gross_margin_pct, ad_spend_monthly_cents, customers_monthly, repeat_purchase_rate, avg_customer_lifespan_months, order_bump, upsells',
        )
        .eq('campaign_id', campaignId)
        .maybeSingle()
      if (error) throw new Error(`[campaign-repo] economics read failed: ${error.message}`)
      if (!data) return null
      return mapEconomicsRow(campaignId, data as Record<string, unknown>)
    },

    async commitAdvance({ campaignId, stepCurrent, viabilityApproved, thresholds }) {
      const { error } = await client
        .from('ads_campaigns')
        .update({
          step_current: stepCurrent,
          viability_approved: viabilityApproved,
          cpa_target_cents: thresholds.cpaTargetCents,
          roas_min: thresholds.roasMin,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
      if (error) throw new Error(`[campaign-repo] advance commit failed: ${error.message}`)
    },
  }
}

/**
 * Build the backend service-role client from env. Returns null when env is
 * absent (e.g. in the in-memory orchestration tests) so the BFF can boot without
 * DB credentials and the gate is wired only where a repo is actually provided.
 *
 * Env resolution honors the sinkra-hub Supabase namespacing rule
 * (`.claude/rules/supabase-env-mapping.md`): the dedicated product vars win,
 * with the generic vars as a fallback for local/dev.
 */
export function createBackendSupabaseClient(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseClient | null {
  const url =
    env.SUPABASE_SINKRA_HUB_URL ?? env.ADS_STUDIO_SUPABASE_URL ?? env.SUPABASE_URL
  const serviceKey =
    env.SUPABASE_SINKRA_HUB_SERVICE_ROLE_KEY ??
    env.ADS_STUDIO_SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
