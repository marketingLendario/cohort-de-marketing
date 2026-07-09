/**
 * L0-L3 dispatcher — routes an action by the NATURE of the operation.
 *
 * arch §2.2 (routing table) + §6.4 (screen → capability → layer). This is the
 * skeleton wiring of the four layers (AC6): L0/L1 are FUNCTIONAL, L2 is the
 * enqueue interface/stub, L3 is the guarded stub (not active). Every branch
 * returns a treatable outcome (AC5/NFR9) — a missing/unavailable capability is
 * a dedicated state, never a mute error.
 *
 * STORY-AL-ADS-1.3 (AC1, AC5, AC6).
 */
import type { JobStore } from '../jobs/store.js'
import type { AdsJobRecord, AdsJobType } from '../jobs/types.js'
import { enqueueAiJob } from './l2-ai-job.js'
import { isMetaAdsAdapterAvailable } from './l1-meta-ads.js'

export type Layer = 'L0' | 'L1' | 'L2' | 'L3'

/**
 * Static nature map (arch §6.4). The `publish` job is L1+L2 (adapter + AI
 * orchestration); we classify its routing entry as L1 because the adapter
 * `--check` gate runs first and the N-item create flow is owned by the publish
 * job type (epic 5). All other job types are L2 (AI/queue).
 */
const JOB_LAYER: Record<AdsJobType, Layer> = {
  funnel: 'L2',
  hooks: 'L2',
  structure: 'L2',
  factory: 'L2',
  audit: 'L2',
  publish: 'L1',
}

/** Resolve the routing layer for a job type (arch §2.2/§6.4). */
export function layerForType(type: AdsJobType): Layer {
  return JOB_LAYER[type]
}

export interface DispatchResult {
  layer: Layer
  /** `true` when the dispatch was accepted/handed off. */
  accepted: boolean
  /** Treatable reason (AC5/NFR9). Present when `accepted: false`. */
  reason?: string
  /** `true` → capability indisponível → UI degradation state. */
  capabilityUnavailable?: boolean
}

/**
 * Dispatch a created job record by its nature. Async operations (L2) do not
 * block the caller (NFR8/AC3): the dispatcher only ENQUEUES and returns; the
 * worker executes out of band.
 */
export function dispatch(store: JobStore, job: AdsJobRecord): DispatchResult {
  const layer = layerForType(job.type)
  store.setLayer(job.jobId, layer)

  switch (layer) {
    case 'L1': {
      // Publish path: the adapter gate must be present (graceful degradation if
      // not). The actual `--check`/create flow runs in the publish job type
      // (epic 5); here we verify the capability is reachable and hand off to the
      // queue (publish is also an N-item AI-orchestrated job).
      if (!isMetaAdsAdapterAvailable()) {
        const reason =
          'meta-ads adapter unavailable — publish capability is offline (treatable)'
        store.setStatus(job.jobId, 'failed', {
          reason,
          capabilityUnavailable: true,
        })
        store.appendLog(job.jobId, `[L1] ${reason}`)
        return { layer, accepted: false, reason, capabilityUnavailable: true }
      }
      const enq = enqueueAiJob(store, job)
      store.appendLog(job.jobId, '[L1→L2] publish adapter present; handed to queue')
      return { layer, accepted: enq.enqueued }
    }

    case 'L2': {
      const enq = enqueueAiJob(store, job)
      return { layer, accepted: enq.enqueued, reason: enq.reason }
    }

    case 'L0':
    case 'L3':
    default: {
      // No job type currently routes to L0 (synchronous gate — not a job) or L3
      // (guarded stub). Reachable only if JOB_LAYER changes; keep treatable.
      const reason = `layer ${layer} is not a job-dispatch target in the 1.3 skeleton`
      store.setStatus(job.jobId, 'failed', { reason, capabilityUnavailable: false })
      return { layer, accepted: false, reason }
    }
  }
}
