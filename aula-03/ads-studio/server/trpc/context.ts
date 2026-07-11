/**
 * tRPC context for the Ads Studio BFF.
 *
 * The context carries BACKEND-ONLY collaborators (the job store; later the
 * Supabase client + Redis). Secrets used by skills (Meta tokens per spoke,
 * OpenAI/Slack keys) are NEVER placed here and NEVER reach the client — they are
 * resolved by the worker/adapter on the backend only (NFR10/AC4, arch §8).
 *
 * STORY-AL-ADS-1.3 (AC4, AC8).
 */
import type { FastifyRequest } from 'fastify'
import type { JobStore } from '../jobs/store.js'
import type { CampaignEconomicsRepo } from '../lib/campaign-economics-repo.js'

export interface TRPCContext {
  /** Backend-only job store (skeleton: in-memory; prod: Supabase + Redis). */
  store: JobStore
  /**
   * Backend-only campaign/economics repository — the Gate#1 enforcement seam
   * (STORY-AL-ADS-1.6, NFR5). Null when no DB credentials are configured (e.g.
   * the in-memory orchestration tests boot the BFF without DB); the
   * `campaign.*` procedures then report a treatable "capability unavailable".
   */
  campaignRepo: CampaignEconomicsRepo | null
  /** Active spoke/workspace from header (tenancy axis — ADR-DB-TENANCY-MODEL). */
  spoke: string | null
  /** Request id for tracing. */
  requestId: string
}

export interface CreateContextDeps {
  store: JobStore
  campaignRepo?: CampaignEconomicsRepo | null
}

/** Factory bound to concrete collaborators; returns the per-request builder. */
export function makeCreateContext(deps: CreateContextDeps) {
  return function createContext(req: FastifyRequest): TRPCContext {
    const spoke = (req.headers['x-spoke'] as string) || null
    const requestId =
      (req.headers['x-request-id'] as string) || crypto.randomUUID()
    return {
      store: deps.store,
      campaignRepo: deps.campaignRepo ?? null,
      spoke,
      requestId,
    }
  }
}
