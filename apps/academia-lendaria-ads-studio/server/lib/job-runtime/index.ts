/**
 * @sinkra/job-runtime — pure, infra-agnostic job primitives.
 *
 * Distilled from `apps/squad-engine` as part of STORY-AL-ADS-0c.4 (arch §2.2,
 * §9 — `@sinkra/job-runtime`). Scope (corrected by PoC 0c.4): granular per-item
 * retry + decoupled job/result types ONLY. The squad-engine's stateful
 * lifecycle stays in `@sinkra/node-lifecycle` (REUSE > CREATE); its queue
 * runtime is coupled to Inngest/Supabase and is NOT lifted here.
 */

export { retryGranular } from './retry.js'
export type { RetryOptions } from './retry.js'

export type {
  JobStatus,
  JobItem,
  JobItemResult,
  BatchResult,
} from './types.js'
