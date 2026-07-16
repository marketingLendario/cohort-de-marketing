/**
 * Backend repository for the transactional/idempotent `campaign.create`
 * enforcement path (STORY-12.W4.2 / ADR-002).
 *
 * `src/lib/use-create-campaign.ts` (STORY-12.W1.1 AC4, rewired in STORY-12.W4.1
 * to call the RPC directly) already runs the `campaign-readiness.v1` preflight
 * client-side, but that story's own Dev Notes are explicit the client preflight
 * is NOT the security boundary. This repo is the thin seam over the boundary
 * that IS: the SQL migration
 * `supabase/migrations/20260716120000_campaign_create_readiness_rpc.sql`,
 * whose `campaign_create_readiness_rpc` re-reads the authoritative project row
 * INSIDE one transaction, rejects `READINESS_BLOCKED`/`STALE_READINESS`, and
 * inserts only the minimum `ads_campaigns` draft when the structural
 * `campaign.create` gate is satisfied. This module never computes readiness
 * itself and never trusts a client-supplied verdict — it only forwards the
 * caller's inputs (plus an optional previously-observed project name, for
 * staleness detection) and translates the RPC's sanitized result.
 *
 * Boundary (mirrors `campaign-economics-repo.ts`): backend-only, service-role.
 * The public Vercel host never holds this key nor reaches this code — it only
 * speaks tRPC to the BFF. The RPC itself is ALSO reachable directly by an
 * `authenticated` browser session (see the migration's grants) — that is the
 * surface `src/lib/use-create-campaign.ts` calls for the normal UI flow
 * (STORY-12.W4.1); this repo exists for a future backend-triggered creation
 * path and is exercised today only by this file's own tests.
 *
 * Payload interpretation (`isRpcPayload`/error-code mapping) is shared with the
 * browser call site via `shared/campaign-create.ts` (STORY-12.W4.1) — reuse,
 * not a second hand-rolled copy of the same jsonb contract.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { buildCampaignCreateRpcParams, mapCampaignCreateRpcResponse, type CampaignCreateResult } from '../../shared/campaign-create.js'

export type {
  CampaignCreateDraft,
  CampaignCreateErrorCode,
  CampaignCreateResult,
  CampaignCreateSuccessCode,
} from '../../shared/campaign-create.js'

export interface CampaignCreateInput {
  workspaceId: string
  projectId: string
  name: string
  /** Client-chosen idempotency key. A retried call with the same key returns the original campaign — no second row/plan/run (AC2). */
  idempotencyKey: string
  /**
   * The project name the caller last observed (e.g. the snapshot its own
   * `campaign-readiness.v1` preflight evaluated). When provided, the RPC
   * rejects the call with `STALE_READINESS` if the authoritative name changed
   * since that snapshot was taken. Omit (or pass `null`/`undefined`) to skip
   * the staleness check.
   */
  expectedProjectName?: string | null
}

/**
 * The seam the campaign-creation boundary depends on. The real implementation
 * talks to Supabase; tests can provide an in-memory fake (see
 * `campaign-create-repo.test.ts`).
 */
export interface CampaignCreateRepo {
  createCampaign(input: CampaignCreateInput): Promise<CampaignCreateResult>
}

/**
 * Supabase-backed repo (service-role). Backend-only, mirrors
 * `createSupabaseCampaignRepo` in `campaign-economics-repo.ts`.
 */
export function createSupabaseCampaignCreateRepo(client: SupabaseClient): CampaignCreateRepo {
  return {
    async createCampaign(input) {
      const { data, error } = await client.rpc(
        'campaign_create_readiness_rpc',
        buildCampaignCreateRpcParams({
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          name: input.name,
          idempotencyKey: input.idempotencyKey,
          expectedProjectName: input.expectedProjectName,
        }),
      )

      // Any DB error other than the RLS/membership rejection (Postgres
      // `42501`, AC3) is an infrastructure failure, not a domain rejection —
      // `mapCampaignCreateRpcResponse` propagates it via throw.
      return mapCampaignCreateRpcResponse(data, error)
    },
  }
}

// Re-exported (not duplicated — Dev Notes: reuse, don't invent a second env
// resolution) from `campaign-economics-repo.ts`, which already implements the
// sinkra-hub Supabase env-namespacing fallback for the backend service-role
// client this repo also needs.
export { createBackendSupabaseClient } from './campaign-economics-repo.js'
