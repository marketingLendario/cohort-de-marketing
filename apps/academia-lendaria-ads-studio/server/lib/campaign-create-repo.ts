/**
 * Backend repository for the transactional/idempotent `campaign.create`
 * enforcement path (STORY-12.W4.2 / ADR-002).
 *
 * `src/lib/use-create-campaign.ts` (STORY-12.W1.1 AC4) already runs the
 * `campaign-readiness.v1` preflight client-side, but that story's own Dev
 * Notes are explicit the client preflight is NOT the security boundary. This
 * repo is the thin seam over the boundary that IS: the SQL migration
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
 * speaks tRPC to the BFF.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type CampaignCreateSuccessCode = 'CREATED' | 'IDEMPOTENT_REPLAY'

/**
 * `READINESS_BLOCKED` / `STALE_READINESS` / `CAMPAIGN_CREATE_CONFLICT` are the
 * sanitized codes the RPC itself returns (Dev Notes: never paths, tokens or
 * private content). `UNAUTHORIZED` is added by this repo when the RPC raises
 * the RLS/workspace-membership rejection (Postgres `42501`, AC3) — the
 * database layer signals that as a thrown error, not a result payload.
 */
export type CampaignCreateErrorCode =
  | 'READINESS_BLOCKED'
  | 'STALE_READINESS'
  | 'CAMPAIGN_CREATE_CONFLICT'
  | 'UNAUTHORIZED'

export interface CampaignCreateDraft {
  id: string
  workspaceId: string
  projectId: string | null
  name: string
  status: string
  stepCurrent: number
  createdAt: string
}

export interface CampaignCreateSuccess {
  ok: true
  code: CampaignCreateSuccessCode
  campaign: CampaignCreateDraft
}

export interface CampaignCreateFailure {
  ok: false
  code: CampaignCreateErrorCode
  /** Sanitized, operator-safe message — never a path, token or private content. */
  message: string
}

export type CampaignCreateResult = CampaignCreateSuccess | CampaignCreateFailure

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

interface RpcCampaignRow {
  id: string
  workspaceId: string
  projectId: string | null
  name: string
  status: string
  stepCurrent: number
  createdAt: string
}

interface RpcSuccessPayload {
  ok: true
  code: CampaignCreateSuccessCode
  campaign: RpcCampaignRow
}

interface RpcFailurePayload {
  ok: false
  code: 'READINESS_BLOCKED' | 'STALE_READINESS' | 'CAMPAIGN_CREATE_CONFLICT'
  message: string
  blockingCode?: string
}

type RpcPayload = RpcSuccessPayload | RpcFailurePayload

function isRpcPayload(value: unknown): value is RpcPayload {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).ok === 'boolean' &&
    typeof (value as Record<string, unknown>).code === 'string'
  )
}

/** Postgres `insufficient_privilege` — the RLS/workspace-membership rejection (AC3). */
const INSUFFICIENT_PRIVILEGE = '42501'

/**
 * Supabase-backed repo (service-role). Backend-only, mirrors
 * `createSupabaseCampaignRepo` in `campaign-economics-repo.ts`.
 */
export function createSupabaseCampaignCreateRepo(client: SupabaseClient): CampaignCreateRepo {
  return {
    async createCampaign(input) {
      const { data, error } = await client.rpc('campaign_create_readiness_rpc', {
        p_workspace_id: input.workspaceId,
        p_project_id: input.projectId,
        p_name: input.name,
        p_idempotency_key: input.idempotencyKey,
        p_expected_project_name: input.expectedProjectName ?? null,
      })

      if (error) {
        if (error.code === INSUFFICIENT_PRIVILEGE) {
          return {
            ok: false,
            code: 'UNAUTHORIZED',
            message: 'Sem permissão para criar campanha neste workspace.',
          }
        }
        // Any other DB error (invalid input, connectivity) is an
        // infrastructure failure, not a domain rejection — propagate.
        throw new Error(`[campaign-create-repo] rpc failed: ${error.message}`)
      }

      if (!isRpcPayload(data)) {
        throw new Error('[campaign-create-repo] rpc returned an unexpected payload')
      }

      if (data.ok) {
        return { ok: true, code: data.code, campaign: data.campaign }
      }
      return { ok: false, code: data.code, message: data.message }
    },
  }
}

// Re-exported (not duplicated — Dev Notes: reuse, don't invent a second env
// resolution) from `campaign-economics-repo.ts`, which already implements the
// sinkra-hub Supabase env-namespacing fallback for the backend service-role
// client this repo also needs.
export { createBackendSupabaseClient } from './campaign-economics-repo.js'
