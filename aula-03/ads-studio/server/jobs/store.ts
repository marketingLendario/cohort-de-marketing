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
  LocalSkillRunInput,
  SkillProposal,
  SkillRunAttempt,
  SkillRunJobError,
  SkillRunJobRecord,
  SkillRunJobView,
  SkillRunLogLine,
  SkillRunStep,
} from './types.js'
import { isSkillRunTerminal, projectSkillRun } from './types.js'

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

// ---------------------------------------------------------------------------
// Skill-run job store — durable journal behind the LOCAL Codex runner.
// STORY-8.W2.2. The interface is what the worker + endpoint depend on; the
// in-memory implementation below is the durable FAKE for tests (no external
// credentials), and `supabase-skill-job-store.ts` is the production adapter.
// The pure transition helpers are exported so both stores stay byte-identical.
// ---------------------------------------------------------------------------

export interface CreateSkillRunJobInput {
  workspaceId: string
  projectId: string
  skillId: string
  input: LocalSkillRunInput
}

export interface SkillRunCompletion {
  proposal: SkillProposal
  skillHash: string
  model: string
}

export interface SkillRunJobStore {
  create(input: CreateSkillRunJobInput): Promise<SkillRunJobRecord>
  get(jobId: string): Promise<SkillRunJobRecord | undefined>
  view(jobId: string): Promise<SkillRunJobView | undefined>
  /**
   * Atomically claim a non-terminal job whose lease is free/expired. Pushes a
   * fresh `running` attempt; a crashed `running` job (expired lease) closes its
   * open attempt as `lease_expired` and starts a NEW attempt (no duplicate side
   * effect). Returns the claimed record, or undefined when unclaimable.
   */
  claim(jobId: string, owner: string, leaseMs: number): Promise<SkillRunJobRecord | undefined>
  /** Extend the lease while running (heartbeat). No-op if not owned by `owner`. */
  renewLease(jobId: string, owner: string, leaseMs: number): Promise<void>
  recordStep(jobId: string, step: SkillRunStep): Promise<void>
  recordLog(jobId: string, line: SkillRunLogLine): Promise<void>
  /** Terminal success — persists proposal + closes the open attempt + clears lease. */
  complete(jobId: string, completion: SkillRunCompletion): Promise<void>
  /** Terminal failure — persists error + closes the open attempt + clears lease. */
  fail(jobId: string, error: SkillRunJobError): Promise<void>
  /** Terminal cancel — works from queued OR running; clears lease. */
  cancel(jobId: string, reason?: string): Promise<SkillRunJobRecord | undefined>
  /** Retry a terminal job: increments attempt, resets to `queued`, audits the retry. */
  startRetry(jobId: string): Promise<SkillRunJobRecord | undefined>
  /** Recovery: non-terminal jobs whose lease is null/expired (reclaim candidates). */
  findRecoverable(): Promise<SkillRunJobRecord[]>
}

function cloneSkillRun(record: SkillRunJobRecord): SkillRunJobRecord {
  return {
    ...record,
    attempts: record.attempts.map((attempt) => ({ ...attempt })),
    steps: record.steps.map((step) => ({ ...step })),
    logs: record.logs.map((line) => ({ ...line })),
    input: { ...record.input },
  }
}

function leaseIsActive(record: SkillRunJobRecord, now: string): boolean {
  return (
    record.leaseOwner !== null &&
    record.leaseExpiresAt !== null &&
    record.leaseExpiresAt > now
  )
}

/** Pure claim transition. Returns the next record, or null when unclaimable. */
export function computeSkillRunClaim(
  record: SkillRunJobRecord,
  owner: string,
  leaseExpiresAt: string,
  now: string,
): SkillRunJobRecord | null {
  if (isSkillRunTerminal(record.status)) return null
  if (leaseIsActive(record, now) && record.leaseOwner !== owner) return null
  const next = cloneSkillRun(record)
  const open = next.attempts.find((attempt) => attempt.status === 'running')
  // Recovery of a crashed run: the open attempt died with the lease. Close it and
  // start a fresh attempt so the re-run cannot duplicate a partial side effect.
  if (next.status === 'running' && open) {
    open.status = 'failed'
    open.reason = 'lease_expired'
    open.endedAt = now
    next.attempt += 1
    next.steps = []
    next.proposal = null
    next.error = null
  }
  if (!next.attempts.some((attempt) => attempt.attempt === next.attempt && attempt.status === 'running')) {
    next.attempts.push({ attempt: next.attempt, status: 'running', startedAt: now })
  }
  next.status = 'running'
  next.leaseOwner = owner
  next.leaseExpiresAt = leaseExpiresAt
  next.updatedAt = now
  return next
}

function closeOpenAttempt(
  record: SkillRunJobRecord,
  status: SkillRunAttempt['status'],
  reason: string | undefined,
  now: string,
): void {
  const open = record.attempts.find((attempt) => attempt.status === 'running')
  if (open) {
    open.status = status
    open.reason = reason
    open.endedAt = now
  }
}

/** Pure retry transition. Returns the next record, or null when not terminal. */
export function computeSkillRunRetry(record: SkillRunJobRecord, now: string): SkillRunJobRecord | null {
  if (!isSkillRunTerminal(record.status)) return null
  const next = cloneSkillRun(record)
  next.attempt += 1
  next.status = 'queued'
  next.leaseOwner = null
  next.leaseExpiresAt = null
  next.proposal = null
  next.error = null
  next.steps = []
  next.logs.push({ level: 'info', message: `retry: nova tentativa #${next.attempt}`, timestamp: now })
  next.updatedAt = now
  return next
}

/** Pure terminal-success transition. */
export function computeSkillRunComplete(
  record: SkillRunJobRecord,
  completion: SkillRunCompletion,
  now: string,
): SkillRunJobRecord {
  const next = cloneSkillRun(record)
  closeOpenAttempt(next, 'succeeded', undefined, now)
  next.status = 'succeeded'
  next.proposal = completion.proposal
  next.skillHash = completion.skillHash
  next.model = completion.model
  next.error = null
  next.leaseOwner = null
  next.leaseExpiresAt = null
  next.updatedAt = now
  return next
}

/** Pure terminal-failure transition. */
export function computeSkillRunFail(
  record: SkillRunJobRecord,
  error: SkillRunJobError,
  now: string,
): SkillRunJobRecord {
  const next = cloneSkillRun(record)
  closeOpenAttempt(next, 'failed', error.reason, now)
  next.status = 'failed'
  next.error = error
  next.leaseOwner = null
  next.leaseExpiresAt = null
  next.updatedAt = now
  return next
}

/** Pure terminal-cancel transition. Returns null when already terminal (idempotent). */
export function computeSkillRunCancel(
  record: SkillRunJobRecord,
  reason: string | undefined,
  now: string,
): SkillRunJobRecord | null {
  if (isSkillRunTerminal(record.status)) return null
  const next = cloneSkillRun(record)
  closeOpenAttempt(next, 'cancelled', reason ?? 'cancelled', now)
  next.status = 'cancelled'
  next.error = null
  next.leaseOwner = null
  next.leaseExpiresAt = null
  next.updatedAt = now
  return next
}

export interface InMemorySkillRunJobStoreOptions {
  /** Injectable clock for deterministic tests. */
  now?: () => string
}

export function createInMemorySkillRunJobStore(
  options: InMemorySkillRunJobStoreOptions = {},
): SkillRunJobStore {
  const now = options.now ?? (() => new Date().toISOString())
  const jobs = new Map<string, SkillRunJobRecord>()

  function addMs(iso: string, ms: number): string {
    return new Date(new Date(iso).getTime() + ms).toISOString()
  }

  return {
    async create(input) {
      const ts = now()
      const record: SkillRunJobRecord = {
        jobId: randomUUID(),
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        skillId: input.skillId,
        skillHash: null,
        status: 'queued',
        attempt: 1,
        attempts: [],
        steps: [],
        logs: [],
        input: input.input,
        proposal: null,
        model: null,
        error: null,
        leaseOwner: null,
        leaseExpiresAt: null,
        createdAt: ts,
        updatedAt: ts,
      }
      jobs.set(record.jobId, record)
      return cloneSkillRun(record)
    },

    async get(jobId) {
      const record = jobs.get(jobId)
      return record ? cloneSkillRun(record) : undefined
    },

    async view(jobId) {
      const record = jobs.get(jobId)
      return record ? projectSkillRun(record) : undefined
    },

    async claim(jobId, owner, leaseMs) {
      const record = jobs.get(jobId)
      if (!record) return undefined
      const ts = now()
      const next = computeSkillRunClaim(record, owner, addMs(ts, leaseMs), ts)
      if (!next) return undefined
      jobs.set(jobId, next)
      return cloneSkillRun(next)
    },

    async renewLease(jobId, owner, leaseMs) {
      const record = jobs.get(jobId)
      if (!record || record.leaseOwner !== owner) return
      const ts = now()
      record.leaseExpiresAt = addMs(ts, leaseMs)
      record.updatedAt = ts
    },

    async recordStep(jobId, step) {
      const record = jobs.get(jobId)
      if (!record) return
      const idx = record.steps.findIndex((candidate) => candidate.id === step.id)
      if (idx >= 0) record.steps[idx] = step
      else record.steps.push(step)
      record.updatedAt = now()
    },

    async recordLog(jobId, line) {
      const record = jobs.get(jobId)
      if (!record) return
      record.logs.push(line)
      record.updatedAt = now()
    },

    async complete(jobId, completion) {
      const record = jobs.get(jobId)
      if (!record) return
      jobs.set(jobId, computeSkillRunComplete(record, completion, now()))
    },

    async fail(jobId, error) {
      const record = jobs.get(jobId)
      if (!record) return
      jobs.set(jobId, computeSkillRunFail(record, error, now()))
    },

    async cancel(jobId, reason) {
      const record = jobs.get(jobId)
      if (!record) return undefined
      const next = computeSkillRunCancel(record, reason, now())
      if (!next) return cloneSkillRun(record)
      jobs.set(jobId, next)
      return cloneSkillRun(next)
    },

    async startRetry(jobId) {
      const record = jobs.get(jobId)
      if (!record) return undefined
      const next = computeSkillRunRetry(record, now())
      if (!next) return undefined
      jobs.set(jobId, next)
      return cloneSkillRun(next)
    },

    async findRecoverable() {
      const ts = now()
      return [...jobs.values()]
        .filter((record) => !isSkillRunTerminal(record.status) && !leaseIsActive(record, ts))
        .map(cloneSkillRun)
    },
  }
}
