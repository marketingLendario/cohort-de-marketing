import { describe, expect, it } from 'vitest'
import { createInMemorySkillRunJobStore, type SkillRunJobStore } from './store.js'
import { createSkillRunEventBus, type SkillRunEvent } from './events.js'
import { createSkillRunWorker } from './skill-run-worker.js'
import {
  LocalSkillRunAbortError,
  type LocalSkillRunInput,
  type LocalSkillRunner,
  type LocalSkillRunResult,
} from '../local-skill-runner.js'

const INPUT: LocalSkillRunInput = { projectId: 'project-1', brief: { project: { slug: 'demo' } } }

function proposalResult(skillId: string): LocalSkillRunResult {
  return {
    skillId,
    skillHash: 'hash-1',
    model: 'test-model',
    proposal: { summary: 'ok', resultMarkdown: '# r', artifacts: [], fields: [], questions: [], warnings: [] },
  }
}

/** Runner that succeeds after emitting one step + one log. */
function successRunner(): LocalSkillRunner {
  return {
    async run(skillId, _input, options) {
      options?.onStep?.({ id: 'codex', label: 'Executar Codex CLI', status: 'running' })
      options?.onLog?.({ level: 'info', message: 'rodando' })
      options?.onStep?.({ id: 'codex', label: 'Executar Codex CLI', status: 'done' })
      return proposalResult(skillId)
    },
  }
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 5))
}

function collect(store: SkillRunJobStore) {
  const bus = createSkillRunEventBus()
  const events: SkillRunEvent[] = []
  const worker = createSkillRunWorker({ store, runner: successRunner(), bus, ownerId: 'worker-a', leaseMs: 30_000 })
  return { bus, events, worker }
}

describe('skill-run worker', () => {
  it('runs a job to success, persisting the proposal and emitting done (AC1/AC3)', async () => {
    const store = createInMemorySkillRunJobStore()
    const bus = createSkillRunEventBus()
    const events: SkillRunEvent[] = []
    const job = await store.create({ workspaceId: 'ws-1', projectId: 'project-1', skillId: 'offerbook', input: INPUT })
    bus.subscribe(job.jobId, (event) => events.push(event))
    const worker = createSkillRunWorker({ store, runner: successRunner(), bus, ownerId: 'worker-a', leaseMs: 30_000 })

    await worker.run(job.jobId)

    const record = await store.get(job.jobId)
    expect(record?.status).toBe('succeeded')
    expect(record?.proposal?.summary).toBe('ok')
    expect(record?.skillHash).toBe('hash-1')
    expect(record?.steps.find((step) => step.id === 'codex')?.status).toBe('done')
    expect(record?.attempts).toHaveLength(1)
    expect(record?.attempts[0]?.status).toBe('succeeded')
    expect(record?.leaseOwner).toBeNull()
    expect(events.some((event) => event.type === 'progress')).toBe(true)
    expect(events.some((event) => event.type === 'done')).toBe(true)
  })

  it('cancels an in-flight run, aborting the child and recording terminal (AC4)', async () => {
    const store = createInMemorySkillRunJobStore()
    const bus = createSkillRunEventBus()
    const events: SkillRunEvent[] = []
    // Runner that hangs until its AbortSignal fires.
    const abortableRunner: LocalSkillRunner = {
      run(_skillId, _input, options) {
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new LocalSkillRunAbortError()))
        })
      },
    }
    const job = await store.create({ workspaceId: 'ws-1', projectId: 'project-1', skillId: 'offerbook', input: INPUT })
    bus.subscribe(job.jobId, (event) => events.push(event))
    const worker = createSkillRunWorker({ store, runner: abortableRunner, bus, ownerId: 'worker-a', leaseMs: 30_000 })

    const running = worker.run(job.jobId)
    await tick()
    expect(worker.isRunning(job.jobId)).toBe(true)
    const result = await worker.cancel(job.jobId)
    await running

    expect(result.ok).toBe(true)
    const record = await store.get(job.jobId)
    expect(record?.status).toBe('cancelled')
    expect(record?.attempts.at(-1)?.status).toBe('cancelled')
    expect(events.some((event) => event.type === 'error' && event.payload.status === 'cancelled')).toBe(true)
  })

  it('cancels a queued job that never started (AC4)', async () => {
    const store = createInMemorySkillRunJobStore()
    const { bus, worker } = collect(store)
    void bus
    const job = await store.create({ workspaceId: 'ws-1', projectId: 'project-1', skillId: 'offerbook', input: INPUT })
    const result = await worker.cancel(job.jobId)
    expect(result.ok).toBe(true)
    const record = await store.get(job.jobId)
    expect(record?.status).toBe('cancelled')
  })

  it('retry creates a new auditable attempt after failure (AC4)', async () => {
    const store = createInMemorySkillRunJobStore()
    const bus = createSkillRunEventBus()
    let attempt = 0
    const flakyRunner: LocalSkillRunner = {
      async run(skillId) {
        attempt += 1
        if (attempt === 1) throw new Error('primeira tentativa falhou')
        return proposalResult(skillId)
      },
    }
    const job = await store.create({ workspaceId: 'ws-1', projectId: 'project-1', skillId: 'offerbook', input: INPUT })
    const worker = createSkillRunWorker({ store, runner: flakyRunner, bus, ownerId: 'worker-a', leaseMs: 30_000 })

    await worker.run(job.jobId)
    expect((await store.get(job.jobId))?.status).toBe('failed')

    const retried = await store.startRetry(job.jobId)
    expect(retried?.attempt).toBe(2)
    await worker.run(job.jobId)

    const record = await store.get(job.jobId)
    expect(record?.status).toBe('succeeded')
    expect(record?.attempt).toBe(2)
    // Attempt audit: attempt #1 failed, attempt #2 succeeded.
    expect(record?.attempts.map((a) => a.status)).toEqual(['failed', 'succeeded'])
  })

  it('recovery reclaims an expired lease as a fresh attempt without duplicating (AC5)', async () => {
    let clock = Date.parse('2026-07-09T12:00:00.000Z')
    const store = createInMemorySkillRunJobStore({ now: () => new Date(clock).toISOString() })
    const job = await store.create({ workspaceId: 'ws-1', projectId: 'project-1', skillId: 'offerbook', input: INPUT })

    // Worker A claims and then "crashes" (never completes).
    const claimedA = await store.claim(job.jobId, 'worker-a', 30_000)
    expect(claimedA?.status).toBe('running')
    expect(claimedA?.attempt).toBe(1)

    // Before expiry, another worker cannot steal the lease.
    clock += 10_000
    expect(await store.claim(job.jobId, 'worker-b', 30_000)).toBeUndefined()
    expect(await store.findRecoverable()).toHaveLength(0)

    // After expiry, recovery surfaces it and worker B reclaims a NEW attempt.
    clock += 40_000
    const recoverable = await store.findRecoverable()
    expect(recoverable).toHaveLength(1)
    const claimedB = await store.claim(job.jobId, 'worker-b', 30_000)
    expect(claimedB?.attempt).toBe(2)
    // The crashed attempt is audited as lease_expired; no duplicate proposal exists.
    expect(claimedB?.attempts[0]).toMatchObject({ attempt: 1, status: 'failed', reason: 'lease_expired' })
    expect(claimedB?.attempts[1]).toMatchObject({ attempt: 2, status: 'running' })
    expect(claimedB?.proposal).toBeNull()
  })
})
