/**
 * Skill-run worker — the async lifecycle owner of a durable Codex run.
 * STORY-8.W2.2 (AC1/AC4/AC5).
 *
 * The worker is the ONLY holder of the ephemeral process handle. Everything
 * durable lives in the {@link SkillRunJobStore}; the worker keeps just an
 * `AbortController` per in-flight job so a cancel can propagate to the Codex
 * child. It:
 *   - claims a job (lease) before executing — recovery-safe (AC5);
 *   - streams progress to the {@link SkillRunEventBus} AND persists it (AC3);
 *   - renews the lease on each step (heartbeat) so a live run is not reclaimed;
 *   - records a terminal state on success/failure/cancel (AC4);
 *   - never duplicates side effects: a reclaimed crashed run starts a fresh
 *     attempt and the proposal is only ever written by `store.complete` (AC5).
 *
 * Concurrency admission (the W1.2 429 boundary) and the queue pump live in
 * `app.ts` — the worker executes exactly one job per `run()` call.
 */
import type { LocalSkillRunner, LocalSkillRunStep } from '../local-skill-runner.js'
import { isLocalSkillRunAbortError } from '../local-skill-runner.js'
import type { SkillRunJobStore } from './store.js'
import type { SkillRunEventBus } from './events.js'
import { isSkillRunTerminal, type SkillRunJobError, type SkillRunStep } from './types.js'

export interface SkillRunWorkerDeps {
  store: SkillRunJobStore
  runner: LocalSkillRunner
  bus: SkillRunEventBus
  /** Stable id for this worker/process — the lease owner. */
  ownerId: string
  /** Lease duration in ms; renewed on every step. */
  leaseMs: number
  /** Injectable clock for deterministic tests. */
  now?: () => string
}

export interface SkillRunCancelResult {
  ok: boolean
  reason?: string
}

export interface SkillRunWorker {
  /**
   * Claim + execute the job to a terminal state. No-op (resolves immediately)
   * when the job is unclaimable (terminal, or lease held by another owner).
   */
  run(jobId: string): Promise<void>
  /** Cancel an in-flight run (abort child) or a still-queued job. */
  cancel(jobId: string): Promise<SkillRunCancelResult>
  /** True while this worker holds an active Codex child for the job. */
  isRunning(jobId: string): boolean
}

const CANCEL_REASON = 'Execução cancelada pelo operador.'

export function createSkillRunWorker(deps: SkillRunWorkerDeps): SkillRunWorker {
  const { store, runner, bus, ownerId, leaseMs } = deps
  const now = deps.now ?? (() => new Date().toISOString())
  const controllers = new Map<string, AbortController>()

  return {
    async run(jobId) {
      const claimed = await store.claim(jobId, ownerId, leaseMs)
      if (!claimed) return

      const controller = new AbortController()
      controllers.set(jobId, controller)
      // Serialize journal writes so every step/log is persisted before the
      // terminal transition (ordering matters for the snapshot projection).
      let writes: Promise<unknown> = Promise.resolve()

      // Announce the queued→running transition to already-connected subscribers.
      bus.publish(jobId, {
        type: 'progress',
        payload: { jobId, status: 'running', attempt: claimed.attempt, timestamp: now() },
      })

      const onStep = (step: LocalSkillRunStep) => {
        const full: SkillRunStep = {
          id: step.id,
          label: step.label,
          status: step.status,
          timestamp: now(),
        }
        writes = writes
          .then(() => store.recordStep(jobId, full))
          .then(() => store.renewLease(jobId, ownerId, leaseMs))
        bus.publish(jobId, {
          type: 'progress',
          payload: { jobId, status: 'running', attempt: claimed.attempt, step: full, timestamp: full.timestamp },
        })
      }

      const onLog = (line: { level: 'info' | 'warn' | 'error'; message: string }) => {
        const full = { level: line.level, message: line.message, timestamp: now() }
        writes = writes.then(() => store.recordLog(jobId, full))
        bus.publish(jobId, {
          type: 'progress',
          payload: { jobId, status: 'running', attempt: claimed.attempt, log: full, timestamp: full.timestamp },
        })
      }

      try {
        const result = await runner.run(claimed.skillId, claimed.input, {
          signal: controller.signal,
          onStep,
          onLog,
        })
        await writes
        await store.complete(jobId, {
          proposal: result.proposal,
          skillHash: result.skillHash,
          model: result.model,
        })
        bus.publish(jobId, {
          type: 'done',
          payload: {
            jobId,
            status: 'succeeded',
            proposal: result.proposal,
            skillHash: result.skillHash,
            model: result.model,
            timestamp: now(),
          },
        })
      } catch (error) {
        await writes.catch(() => undefined)
        if (isLocalSkillRunAbortError(error) || controller.signal.aborted) {
          await store.cancel(jobId, CANCEL_REASON)
          bus.publish(jobId, {
            type: 'error',
            payload: {
              jobId,
              status: 'cancelled',
              error: { reason: CANCEL_REASON, capabilityUnavailable: false },
              timestamp: now(),
            },
          })
        } else {
          const failure: SkillRunJobError = {
            reason: error instanceof Error ? error.message : 'Falha inesperada no runner local.',
            capabilityUnavailable: false,
          }
          await store.fail(jobId, failure)
          bus.publish(jobId, {
            type: 'error',
            payload: { jobId, status: 'failed', error: failure, timestamp: now() },
          })
        }
      } finally {
        controllers.delete(jobId)
      }
    },

    async cancel(jobId) {
      const controller = controllers.get(jobId)
      if (controller) {
        // In-flight: abort the child. `run()` records the terminal cancel state.
        controller.abort()
        return { ok: true }
      }
      const current = await store.get(jobId)
      if (!current) return { ok: false, reason: `run ${jobId} não encontrado` }
      if (isSkillRunTerminal(current.status)) {
        return { ok: false, reason: `run ${jobId} já está em estado terminal (${current.status})` }
      }
      // Queued but not yet executing on this worker: cancel durably.
      await store.cancel(jobId, CANCEL_REASON)
      bus.publish(jobId, {
        type: 'error',
        payload: {
          jobId,
          status: 'cancelled',
          error: { reason: CANCEL_REASON, capabilityUnavailable: false },
          timestamp: now(),
        },
      })
      return { ok: true }
    },

    isRunning(jobId) {
      return controllers.has(jobId)
    },
  }
}
