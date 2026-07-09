/**
 * Ads Studio job records — the persisted shape behind the `jobs.*` tRPC contract.
 *
 * In production these map to `publish_jobs` / `skill_jobs` + `publish_job_items`
 * (arch §6.3). The skeleton models the SAME shape in memory (see `store.ts`) so
 * the tRPC contract, the L0-L3 dispatcher and the worker can all be wired and
 * tested before the `ads-*` job types and the DB tables land (AC6: "esqueleto +
 * L0/L1 funcionando; L2/L3 ganham job types nos épicos seguintes").
 *
 * STORY-AL-ADS-1.3 (AC2, AC8).
 */

/** Job types per arch §6.2 `jobs.enqueue`. */
export type AdsJobType =
  | 'factory'
  | 'audit'
  | 'funnel'
  | 'hooks'
  | 'structure'
  | 'publish'

/** Job lifecycle states (arch §6.1). `pending` aliases `queued` at the contract edge. */
export type AdsJobStatus = 'pending' | 'running' | 'done' | 'partial' | 'failed'

/** Per-item state — the unit of granular retry (arch §6.3, FR28 AC5). */
export type AdsJobItemStatus = 'pending' | 'running' | 'ok' | 'failed'

/** A retryable sub-item of a job (one ad/creative, one factory piece, ...). */
export interface AdsJobItem {
  id: string
  /** Step this item belongs to (campaign create, adset create, creative+ad, ...). */
  stepId: string
  status: AdsJobItemStatus
  attempts: number
  /** Treatable failure reason surfaced to the UI (NFR9). Present when `failed`. */
  error?: string
}

/** A high-level step of a job, optionally containing N retryable items. */
export interface AdsJobStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'failed'
}

/** A treatable error envelope (AC2 + NFR9 — never a mute error). */
export interface AdsJobError {
  /** Human/UI reason. */
  reason: string
  /** `true` → capability indisponível (degradation), UI shows a dedicated state. */
  capabilityUnavailable: boolean
}

/** The persisted job record — returned (projected) by `jobs.get`. */
export interface AdsJobRecord {
  jobId: string
  type: AdsJobType
  campaignId: string
  spoke: string
  /** Routing layer resolved by the dispatcher (L0-L3). */
  layer: 'L0' | 'L1' | 'L2' | 'L3'
  status: AdsJobStatus
  steps: AdsJobStep[]
  items: AdsJobItem[]
  log: string[]
  error?: AdsJobError
  createdAt: string
  updatedAt: string
}

/** Opaque, JSON-shaped enqueue payload (per-type schema arrives with `ads-*`). */
export type AdsJobPayload = Record<string, unknown>

/** Input of `jobs.enqueue` (arch §6.2). */
export interface EnqueueInput {
  type: AdsJobType
  campaignId: string
  spoke: string
  payload: AdsJobPayload
}

/** Projection returned by `jobs.get` (arch §6.2 — status/steps/items/log). */
export interface JobView {
  jobId: string
  status: AdsJobStatus
  layer: 'L0' | 'L1' | 'L2' | 'L3'
  steps: AdsJobStep[]
  items: AdsJobItem[]
  log: string[]
  error?: AdsJobError
}
