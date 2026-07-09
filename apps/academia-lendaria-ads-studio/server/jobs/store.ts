/**
 * In-memory JobStore — the skeleton persistence behind `jobs.*`.
 *
 * PRODUCTION (epics 2-5): this is replaced by `publish_jobs` / `skill_jobs` +
 * `publish_job_items` in Supabase (RLS by `workspace_id`/spoke) and the Redis
 * progress buffer of `@sinkra/job-stream`. The interface below is what the tRPC
 * router and the worker depend on, so swapping the backing store is a localized
 * change. (AC2/AC8 — skeleton; arch §6.3.)
 */
import { randomUUID } from 'node:crypto'
import type {
  AdsJobError,
  AdsJobItem,
  AdsJobRecord,
  AdsJobStep,
  EnqueueInput,
  JobView,
} from './types.js'

export interface JobStore {
  create(input: EnqueueInput, layer: AdsJobRecord['layer']): AdsJobRecord
  get(jobId: string): AdsJobRecord | undefined
  view(jobId: string): JobView | undefined
  setStatus(jobId: string, status: AdsJobRecord['status'], error?: AdsJobError): void
  setLayer(jobId: string, layer: AdsJobRecord['layer']): void
  upsertStep(jobId: string, step: AdsJobStep): void
  upsertItem(jobId: string, item: AdsJobItem): void
  appendLog(jobId: string, line: string): void
}

function nowIso(): string {
  return new Date().toISOString()
}

function project(record: AdsJobRecord): JobView {
  return {
    jobId: record.jobId,
    status: record.status,
    layer: record.layer,
    steps: record.steps,
    items: record.items,
    log: record.log,
    error: record.error,
  }
}

/**
 * Process-local store. Adequate for the skeleton and unit tests; a single worker
 * process in the MVP container (deploy-topology §1: BFF + worker coabit one
 * Fastify process) reads/writes the same instance. Multi-replica deployment
 * MUST move this to Supabase + Redis before scaling out.
 */
export function createInMemoryJobStore(): JobStore {
  const jobs = new Map<string, AdsJobRecord>()

  return {
    create(input, layer) {
      const jobId = randomUUID()
      const ts = nowIso()
      const record: AdsJobRecord = {
        jobId,
        type: input.type,
        campaignId: input.campaignId,
        spoke: input.spoke,
        layer,
        status: 'pending',
        steps: [],
        items: [],
        log: [],
        createdAt: ts,
        updatedAt: ts,
      }
      jobs.set(jobId, record)
      return record
    },

    get(jobId) {
      return jobs.get(jobId)
    },

    view(jobId) {
      const record = jobs.get(jobId)
      return record ? project(record) : undefined
    },

    setStatus(jobId, status, error) {
      const record = jobs.get(jobId)
      if (!record) return
      record.status = status
      if (error) record.error = error
      record.updatedAt = nowIso()
    },

    setLayer(jobId, layer) {
      const record = jobs.get(jobId)
      if (!record) return
      record.layer = layer
      record.updatedAt = nowIso()
    },

    upsertStep(jobId, step) {
      const record = jobs.get(jobId)
      if (!record) return
      const idx = record.steps.findIndex((s) => s.id === step.id)
      if (idx >= 0) record.steps[idx] = step
      else record.steps.push(step)
      record.updatedAt = nowIso()
    },

    upsertItem(jobId, item) {
      const record = jobs.get(jobId)
      if (!record) return
      const idx = record.items.findIndex((i) => i.id === item.id)
      if (idx >= 0) record.items[idx] = item
      else record.items.push(item)
      record.updatedAt = nowIso()
    },

    appendLog(jobId, line) {
      const record = jobs.get(jobId)
      if (!record) return
      record.log.push(line)
      record.updatedAt = nowIso()
    },
  }
}
