/**
 * Supabase-backed skill-run job store — the DURABLE journal (STORY-8.W2.2, AC2).
 *
 * Backend-only (service-role, NFR10): the public host never reaches this code.
 * Rows live in `public.skill_run_jobs` (RLS by `workspace_id` — see the
 * migration + pgTAP test). The state transitions reuse the SAME pure helpers as
 * the in-memory fake (`store.ts`) so the two adapters stay byte-identical; only
 * the persistence + atomic-claim guard differ here.
 *
 * The claim is optimistic-atomic at the DB: the UPDATE carries a WHERE guard
 * (non-terminal AND lease free/expired/self) so two workers can never both win a
 * claim — the loser's UPDATE matches zero rows. This is what makes recovery
 * (AC5) safe without a duplicated side effect.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  LocalSkillRunInput,
  SkillProposal,
  SkillRunAttempt,
  SkillRunJobError,
  SkillRunJobRecord,
  SkillRunLogLine,
  SkillRunStep,
} from './types.js'
import { SKILL_RUN_TERMINAL_STATUSES, projectSkillRun } from './types.js'
import {
  computeSkillRunCancel,
  computeSkillRunClaim,
  computeSkillRunComplete,
  computeSkillRunFail,
  computeSkillRunRetry,
  type CreateSkillRunJobInput,
  type SkillRunCompletion,
  type SkillRunJobStore,
} from './store.js'

export const SKILL_RUN_JOBS_TABLE = 'skill_run_jobs'

/** The persisted row shape (snake_case) of `public.skill_run_jobs`. */
interface SkillRunJobRow {
  id: string
  workspace_id: string
  project_id: string
  skill_id: string
  skill_hash: string | null
  status: SkillRunJobRecord['status']
  attempt: number
  attempts: SkillRunAttempt[]
  steps: SkillRunStep[]
  logs: SkillRunLogLine[]
  input: LocalSkillRunInput
  proposal: SkillProposal | null
  model: string | null
  error: SkillRunJobError | null
  lease_owner: string | null
  lease_expires_at: string | null
  created_at: string
  updated_at: string
}

const SELECT_COLUMNS =
  'id, workspace_id, project_id, skill_id, skill_hash, status, attempt, attempts, steps, logs, input, proposal, model, error, lease_owner, lease_expires_at, created_at, updated_at'

function rowToRecord(row: SkillRunJobRow): SkillRunJobRecord {
  return {
    jobId: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    skillId: row.skill_id,
    skillHash: row.skill_hash,
    status: row.status,
    attempt: row.attempt,
    attempts: row.attempts ?? [],
    steps: row.steps ?? [],
    logs: row.logs ?? [],
    input: row.input,
    proposal: row.proposal,
    model: row.model,
    error: row.error,
    leaseOwner: row.lease_owner,
    leaseExpiresAt: row.lease_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Columns that a state transition may change — everything except identity/createdAt. */
function mutableColumns(record: SkillRunJobRecord): Partial<SkillRunJobRow> {
  return {
    skill_hash: record.skillHash,
    status: record.status,
    attempt: record.attempt,
    attempts: record.attempts,
    steps: record.steps,
    logs: record.logs,
    proposal: record.proposal,
    model: record.model,
    error: record.error,
    lease_owner: record.leaseOwner,
    lease_expires_at: record.leaseExpiresAt,
    updated_at: record.updatedAt,
  }
}

export interface SupabaseSkillRunJobStoreOptions {
  now?: () => string
}

export function createSupabaseSkillRunJobStore(
  client: SupabaseClient,
  options: SupabaseSkillRunJobStoreOptions = {},
): SkillRunJobStore {
  const now = options.now ?? (() => new Date().toISOString())
  const table = () => client.from(SKILL_RUN_JOBS_TABLE)

  function addMs(iso: string, ms: number): string {
    return new Date(new Date(iso).getTime() + ms).toISOString()
  }

  async function readRow(jobId: string): Promise<SkillRunJobRow | undefined> {
    const { data, error } = await table().select(SELECT_COLUMNS).eq('id', jobId).maybeSingle()
    if (error) throw new Error(`[skill-run-jobs] read failed: ${error.message}`)
    return (data as SkillRunJobRow | null) ?? undefined
  }

  /** Persist a computed transition (unguarded — update by id). */
  async function persist(next: SkillRunJobRecord): Promise<SkillRunJobRow | undefined> {
    const { data, error } = await table()
      .update(mutableColumns(next))
      .eq('id', next.jobId)
      .select(SELECT_COLUMNS)
      .maybeSingle()
    if (error) throw new Error(`[skill-run-jobs] write failed: ${error.message}`)
    return (data as SkillRunJobRow | null) ?? undefined
  }

  return {
    async create(input: CreateSkillRunJobInput) {
      const ts = now()
      const insertRow = {
        workspace_id: input.workspaceId,
        project_id: input.projectId,
        skill_id: input.skillId,
        status: 'queued' as const,
        attempt: 1,
        attempts: [] as SkillRunAttempt[],
        steps: [] as SkillRunStep[],
        logs: [] as SkillRunLogLine[],
        input: input.input,
        created_at: ts,
        updated_at: ts,
      }
      const { data, error } = await table().insert(insertRow).select(SELECT_COLUMNS).single()
      if (error) throw new Error(`[skill-run-jobs] create failed: ${error.message}`)
      return rowToRecord(data as SkillRunJobRow)
    },

    async get(jobId) {
      const row = await readRow(jobId)
      return row ? rowToRecord(row) : undefined
    },

    async view(jobId) {
      const row = await readRow(jobId)
      return row ? projectSkillRun(rowToRecord(row)) : undefined
    },

    async claim(jobId, owner, leaseMs) {
      const row = await readRow(jobId)
      if (!row) return undefined
      const ts = now()
      const next = computeSkillRunClaim(rowToRecord(row), owner, addMs(ts, leaseMs), ts)
      if (!next) return undefined
      // Atomic guard: only win if still non-terminal AND lease free/expired/self.
      // A concurrent winner makes this UPDATE match zero rows → claim fails (AC5).
      const { data, error } = await table()
        .update(mutableColumns(next))
        .eq('id', next.jobId)
        .in('status', ['queued', 'running'])
        .or(`lease_owner.is.null,lease_expires_at.lt.${ts},lease_owner.eq.${owner}`)
        .select(SELECT_COLUMNS)
        .maybeSingle()
      if (error) throw new Error(`[skill-run-jobs] claim failed: ${error.message}`)
      return data ? rowToRecord(data as SkillRunJobRow) : undefined
    },

    async renewLease(jobId, owner, leaseMs) {
      const ts = now()
      const { error } = await table()
        .update({ lease_expires_at: addMs(ts, leaseMs), updated_at: ts })
        .eq('id', jobId)
        .eq('lease_owner', owner)
      if (error) throw new Error(`[skill-run-jobs] lease renew failed: ${error.message}`)
    },

    async recordStep(jobId, step: SkillRunStep) {
      const row = await readRow(jobId)
      if (!row) return
      const record = rowToRecord(row)
      const steps = [...record.steps]
      const idx = steps.findIndex((candidate) => candidate.id === step.id)
      if (idx >= 0) steps[idx] = step
      else steps.push(step)
      const { error } = await table()
        .update({ steps, updated_at: now() })
        .eq('id', jobId)
      if (error) throw new Error(`[skill-run-jobs] step write failed: ${error.message}`)
    },

    async recordLog(jobId, line: SkillRunLogLine) {
      const row = await readRow(jobId)
      if (!row) return
      const logs = [...(row.logs ?? []), line]
      const { error } = await table()
        .update({ logs, updated_at: now() })
        .eq('id', jobId)
      if (error) throw new Error(`[skill-run-jobs] log write failed: ${error.message}`)
    },

    async complete(jobId, completion: SkillRunCompletion) {
      const row = await readRow(jobId)
      if (!row) return
      await persist(computeSkillRunComplete(rowToRecord(row), completion, now()))
    },

    async fail(jobId, error: SkillRunJobError) {
      const row = await readRow(jobId)
      if (!row) return
      await persist(computeSkillRunFail(rowToRecord(row), error, now()))
    },

    async cancel(jobId, reason) {
      const row = await readRow(jobId)
      if (!row) return undefined
      const record = rowToRecord(row)
      const next = computeSkillRunCancel(record, reason, now())
      if (!next) return record
      const { data, error } = await table()
        .update(mutableColumns(next))
        .eq('id', next.jobId)
        .in('status', ['queued', 'running'])
        .select(SELECT_COLUMNS)
        .maybeSingle()
      if (error) throw new Error(`[skill-run-jobs] cancel failed: ${error.message}`)
      return data ? rowToRecord(data as SkillRunJobRow) : record
    },

    async startRetry(jobId) {
      const row = await readRow(jobId)
      if (!row) return undefined
      const next = computeSkillRunRetry(rowToRecord(row), now())
      if (!next) return undefined
      // Atomic terminal-state compare-and-swap (QA-W2B1-01): only the retry that
      // observes the job STILL terminal flips it → queued. A concurrent second
      // retry (double-click / duplicate POST) races here: both read a terminal
      // row and both compute a fresh attempt, but only the first UPDATE matches
      // (WHERE status IN terminal); the loser's UPDATE hits zero rows → returns
      // undefined, so the endpoint replies 409 and never schedules a duplicate
      // Codex child. Same guard shape as cancel()/claim().
      const { data, error } = await table()
        .update(mutableColumns(next))
        .eq('id', next.jobId)
        .in('status', [...SKILL_RUN_TERMINAL_STATUSES])
        .select(SELECT_COLUMNS)
        .maybeSingle()
      if (error) throw new Error(`[skill-run-jobs] retry failed: ${error.message}`)
      return data ? rowToRecord(data as SkillRunJobRow) : undefined
    },

    async findRecoverable() {
      const ts = now()
      const { data, error } = await table()
        .select(SELECT_COLUMNS)
        .in('status', ['queued', 'running'])
        .or(`lease_owner.is.null,lease_expires_at.lt.${ts}`)
      if (error) throw new Error(`[skill-run-jobs] recovery scan failed: ${error.message}`)
      return ((data as SkillRunJobRow[] | null) ?? []).map(rowToRecord)
    },
  }
}
