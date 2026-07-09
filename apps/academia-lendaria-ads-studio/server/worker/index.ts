/**
 * Dedicated Ads Studio worker — SKELETON.
 *
 * arch §2.2 (worker dedicado) + deploy-topology §1: the worker is CREATE of
 * *montage*, not CREATE of *foundation*. It REUSES the extracted libs:
 *   - `@sinkra/job-runtime`  → granular per-item retry (see `runner.ts`)
 *   - `@sinkra/job-stream`   → progress streaming (`step|item|log|done|error`)
 *   - `@sinkra/agent-host`   → skill/agent invocation in a controlled env
 *
 * In the MVP container (deploy-topology §1: "um container só"), this worker and
 * the BFF coabit the same Fastify process: the BFF enqueues, the worker (Inngest
 * functions registered at `/api/inngest`) consumes. The `ads-*` job types are
 * registered here in epics 2-5. This skeleton exposes the wiring surface and a
 * health probe so the topology is exercisable today.
 *
 * STORY-AL-ADS-1.3 (AC7).
 */
import { resolveModel, SYSTEM_DEFAULT_MODEL } from '../lib/agent-host/model-resolver.js'
import { jobChannel } from '../jobs/events.js'
import type { AdsJobType } from '../jobs/types.js'

export { runStep } from './runner.js'
export type { JobEventEmitter } from './runner.js'

/** Worker self-report — proves the libs are linked and the surface is wired. */
export interface WorkerHealth {
  surface: 'ads-studio-worker'
  boundary: 'ONLINE-controlled'
  /** Default model resolved via `@sinkra/agent-host` (proves the lib is linked). */
  defaultModel: string
  /** Job types this worker will register (the `ads-*` executors land in epics 2-5). */
  registeredJobTypes: AdsJobType[]
  /** Channel-name convention for progress streams. */
  channelExample: string
}

/**
 * Job types the worker is responsible for. The executor for each is registered
 * as an Inngest function (`ads-studio/<type>`) in epics 2-5; here the list is
 * the contract surface (AC6 — "job types `ads-*` vêm depois").
 */
export const WORKER_JOB_TYPES: AdsJobType[] = [
  'funnel',
  'hooks',
  'structure',
  'factory',
  'audit',
  'publish',
]

export function getWorkerHealth(): WorkerHealth {
  return {
    surface: 'ads-studio-worker',
    boundary: 'ONLINE-controlled',
    defaultModel: resolveModel({}) || SYSTEM_DEFAULT_MODEL,
    registeredJobTypes: WORKER_JOB_TYPES,
    channelExample: jobChannel('<jobId>'),
  }
}
