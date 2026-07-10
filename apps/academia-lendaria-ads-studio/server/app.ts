/**
 * Fastify app factory for the Ads Studio BFF (+ co-located worker surface).
 *
 * Mirrors the squad-engine topology (Fastify + `@trpc/server` fastify adapter,
 * REUSE — arch §9). In the MVP container (deploy-topology §1: "um container só")
 * the BFF, the SSE progress endpoint and the worker coabit one process.
 *
 * Boundary: this is ONLINE but it is the BFF/worker, NOT the public web host.
 * The Vercel frontend only speaks tRPC/SSE here (AC9); secrets stay backend-only
 * (AC4/NFR10). The public host never executes skills nor holds secrets.
 *
 * Endpoints:
 *   POST/GET /trpc/*                          → `jobs.*` contract (arch §6.2)
 *   GET      /jobs/:id/stream                 → ads SSE skeleton `job:{jobId}`
 *   POST     /api/local/skills/:id/run        → start durable async skill run → 202+jobId
 *   GET      /api/local/skill-runs/:jobId     → poll projection (fallback)
 *   GET      /api/local/skill-runs/:jobId/stream → SSE snapshot|progress|done|error
 *   POST     /api/local/skill-runs/:jobId/cancel → cancel (abort child)
 *   POST     /api/local/skill-runs/:jobId/retry  → new auditable attempt
 *   GET      /health, /healthz
 *
 * STORY-AL-ADS-1.3 (AC8, AC9). Durable async skill runs: STORY-8.W2.2.
 */
import Fastify from 'fastify'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './trpc/router.js'
import { makeCreateContext } from './trpc/context.js'
import { randomUUID } from 'node:crypto'
import {
  createInMemoryJobStore,
  createInMemorySkillRunJobStore,
  type JobStore,
  type SkillRunJobStore,
} from './jobs/store.js'
import { createSupabaseSkillRunJobStore } from './jobs/supabase-skill-job-store.js'
import { createSkillRunEventBus, type SkillRunEventBus } from './jobs/events.js'
import { createSkillRunWorker, type SkillRunWorker } from './jobs/skill-run-worker.js'
import {
  createBackendSupabaseClient,
  createSupabaseCampaignRepo,
  type CampaignEconomicsRepo,
} from './lib/campaign-economics-repo.js'
import { getBffHealth } from './index.js'
import { getWorkerHealth } from './worker/index.js'
import { createLocalSkillRunnerFromEnv, type LocalSkillRunner } from './local-skill-runner.js'
import {
  LOCAL_RUNNER_TOKEN_HEADER,
  authorizeLocalRunnerRequest,
  createConcurrencyLimiter,
  resolveLocalRunnerLimits,
  resolveLocalRunnerToken,
  type LocalRunnerLimits,
} from './local-runner-security.js'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface BuildAppOptions {
  /** Inject a store (tests); defaults to the in-memory skeleton store. */
  store?: JobStore
  /**
   * Inject the Gate#1 campaign/economics repo (STORY-AL-ADS-1.6). When omitted,
   * the BFF builds a Supabase-backed repo from env; if no DB credentials are
   * present it stays `null` and `campaign.*` procedures report a treatable
   * "capability unavailable" (the BFF still boots — NFR9, no mute).
   */
  campaignRepo?: CampaignEconomicsRepo | null
  /** CORS origin for the Vercel frontend. */
  corsOrigin?: string
  /** Runner LOCAL injetável. `null` mantém a capacidade explicitamente desligada. */
  skillRunner?: LocalSkillRunner | null
  /**
   * Segredo local do boundary do runner (AC2). Quando omitido, é resolvido do
   * ambiente (`LOCAL_SKILL_RUNNER_TOKEN`) ou gerado efêmero (fail-closed).
   */
  localRunnerToken?: string
  /** Override de limites operacionais do runner (AC5) — usado em testes. */
  localRunnerLimits?: Partial<LocalRunnerLimits>
  /**
   * Journal durável dos skill-runs (STORY-8.W2.2, AC2). Injetável para testes;
   * por padrão usa Supabase quando há credenciais, senão o fake in-memory durável
   * (mantém o BFF bootável sem DB — NFR9).
   */
  skillJobStore?: SkillRunJobStore
  /** Bus de progresso SSE injetável (testes). */
  skillRunEventBus?: SkillRunEventBus
  /** Id do owner do lease deste processo (recovery — AC5). */
  workerOwnerId?: string
  /** Duração do lease de recovery em ms. */
  skillRunLeaseMs?: number
  /** Recupera jobs não-terminais no boot (AC5). `false` desliga (testes). */
  recoverOnBoot?: boolean
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const store = options.store ?? createInMemoryJobStore()
  // Cliente Supabase backend compartilhado (service-role, NFR10) — usado pelo
  // Gate#1 e pelo journal durável de skill-runs. Null sem credenciais.
  const backendSupabase: SupabaseClient | null = createBackendSupabaseClient()
  const campaignRepo =
    options.campaignRepo !== undefined
      ? options.campaignRepo
      : backendSupabase
        ? createSupabaseCampaignRepo(backendSupabase)
        : null
  const skillRunner = options.skillRunner !== undefined ? options.skillRunner : createLocalSkillRunnerFromEnv()

  // Journal durável do skill-run (AC2): Supabase em produção, fake in-memory
  // quando não há credenciais (o BFF ainda sobe — NFR9).
  const skillJobStore: SkillRunJobStore =
    options.skillJobStore ??
    (backendSupabase ? createSupabaseSkillRunJobStore(backendSupabase) : createInMemorySkillRunJobStore())
  const skillRunBus: SkillRunEventBus = options.skillRunEventBus ?? createSkillRunEventBus()
  const workerOwnerId = options.workerOwnerId ?? `bff-${randomUUID()}`

  // Boundary de segurança do runner local (STORY-8.W1.2). Token e limiter só são
  // materializados quando o runner está ligado — capacidade desligada = sem custo.
  const runnerLimits: LocalRunnerLimits = { ...resolveLocalRunnerLimits(), ...options.localRunnerLimits }
  let runnerToken: string | null = null
  let runnerLimiter: ReturnType<typeof createConcurrencyLimiter> | null = null
  let runnerTokenEphemeral = false
  let skillWorker: SkillRunWorker | null = null
  if (skillRunner) {
    if (options.localRunnerToken && options.localRunnerToken.length > 0) {
      runnerToken = options.localRunnerToken
    } else {
      const resolved = resolveLocalRunnerToken()
      runnerToken = resolved.token
      runnerTokenEphemeral = resolved.ephemeral
    }
    runnerLimiter = createConcurrencyLimiter(runnerLimits.maxConcurrency)
    // Lease > timeout + kill grace: uma execução viva nunca é reivindicada por
    // recovery; só um lease genuinamente expirado (processo morto) é reclamado.
    const leaseMs = options.skillRunLeaseMs ?? runnerLimits.timeoutMs + runnerLimits.killGraceMs + 30_000
    skillWorker = createSkillRunWorker({
      store: skillJobStore,
      runner: skillRunner,
      bus: skillRunBus,
      ownerId: workerOwnerId,
      leaseMs,
    })
  }

  // Scheduler de concorrência (AC1/AC5): o limiter é a admissão fail-fast (429) do
  // POST — mantém o hardening W1.2 (máx N execuções Codex simultâneas). Jobs de
  // retry/recovery aguardam um slot numa fila leve, sem 429.
  const pendingQueue: string[] = []
  async function runHoldingSlot(jobId: string): Promise<void> {
    if (!skillWorker || !runnerLimiter) return
    try {
      await skillWorker.run(jobId)
    } finally {
      runnerLimiter.release()
      drainQueue()
    }
  }
  function drainQueue(): void {
    if (!runnerLimiter) return
    while (pendingQueue.length > 0 && runnerLimiter.tryAcquire()) {
      const next = pendingQueue.shift()!
      void runHoldingSlot(next)
    }
  }
  /** Dispatch a job: run now if a slot is free, else queue for the pump. */
  function scheduleRun(jobId: string): void {
    if (!runnerLimiter) return
    if (runnerLimiter.tryAcquire()) void runHoldingSlot(jobId)
    else pendingQueue.push(jobId)
  }

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      // Nunca registrar o segredo do boundary, mesmo se headers forem logados (AC3).
      redact: {
        paths: [`req.headers["${LOCAL_RUNNER_TOKEN_HEADER}"]`],
        censor: '[REDACTED]',
      },
    },
  })

  if (runnerTokenEphemeral) {
    // Fail-closed: sem segredo compartilhado configurado o runner fica efetivamente
    // trancado (o proxy Vite não conhece o token efêmero). NÃO logamos o valor (AC3).
    app.log.warn(
      'Runner local sem LOCAL_SKILL_RUNNER_TOKEN configurado — token efêmero gerado; ' +
        'configure o segredo local compartilhado com o proxy Vite para habilitar chamadas autorizadas.',
    )
  }

  await app.register(cors, {
    origin: options.corsOrigin || process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })

  const createContext = makeCreateContext({ store, campaignRepo })

  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext: ({ req }: { req: FastifyRequest }) => createContext(req),
    },
  })

  // --- Health ---
  app.get('/health', async (_req, reply) => {
    return reply.status(200).send({
      status: 'ok',
      bff: getBffHealth(),
      worker: getWorkerHealth(),
      uptime: process.uptime(),
    })
  })
  app.get('/healthz', async (_req, reply) => reply.status(200).send({ status: 'ok' }))

  const localSkillRunSchema = z.object({
    // Opcional no boundary (compat com callers legados): derivado do projeto abaixo.
    workspaceId: z.string().min(1).optional(),
    projectId: z.string().min(1),
    brief: z.record(z.unknown()),
    context: z.record(z.unknown()).optional(),
    operatorInput: z.string().max(20_000).optional(),
  })

  /**
   * Resolve o workspace_id (eixo RLS/tenant). Usa o valor enviado pela UI quando
   * presente; senão deriva de `marketing_projects` (Supabase) ou usa o projectId
   * como chave de tenant no fallback in-memory (dev sem DB).
   */
  async function resolveWorkspaceId(projectId: string, provided?: string): Promise<string> {
    if (provided) return provided
    if (backendSupabase) {
      const { data } = await backendSupabase
        .from('marketing_projects')
        .select('workspace_id')
        .eq('id', projectId)
        .maybeSingle()
      if (data?.workspace_id) return data.workspace_id as string
    }
    return projectId
  }

  /**
   * Boundary guard shared by every skill-run endpoint (STORY-8.W1.2 hardening
   * preserved): 503 when the capability is off, 401/403 on the token. The Vite
   * dev proxy injects the token server-side, so the browser (incl. EventSource)
   * never holds the secret (AC3/NFR10).
   */
  function guardSkillRunRequest(req: FastifyRequest, reply: FastifyReply): boolean {
    if (!skillRunner || !runnerToken || !runnerLimiter || !skillWorker) {
      reply.status(503).send({
        code: 'LOCAL_SKILL_RUNNER_DISABLED',
        message: 'Runner local desabilitado. Defina LOCAL_SKILL_RUNNER_ENABLED=true e mantenha o Codex CLI autenticado.',
      })
      return false
    }
    const providedToken = req.headers[LOCAL_RUNNER_TOKEN_HEADER]
    const auth = authorizeLocalRunnerRequest(
      Array.isArray(providedToken) ? providedToken[0] : providedToken,
      runnerToken,
    )
    if (!auth.ok) {
      reply.status(auth.status).send({ code: auth.code, message: auth.message })
      return false
    }
    return true
  }

  // --- Start a durable async skill run (AC1) -------------------------------
  // bodyLimit por rota (AC5): restringe só este endpoint, sem afetar o global.
  app.post('/api/local/skills/:skillId/run', { bodyLimit: runnerLimits.bodyLimitBytes }, async (req, reply) => {
    if (!guardSkillRunRequest(req, reply)) return reply
    const limiter = runnerLimiter!

    const parsed = localSkillRunSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ code: 'INVALID_SKILL_INPUT', issues: parsed.error.issues })
    }

    // Admissão fail-fast (AC5, hardening W1.2): 429 sem enfileirar quando o teto
    // de execuções Codex simultâneas está saturado. O slot fica retido durante a
    // execução longa em background e é liberado pelo scheduler ao terminar.
    if (!limiter.tryAcquire()) {
      return reply.status(429).send({
        code: 'LOCAL_SKILL_RUNNER_BUSY',
        message: `Limite de execuções simultâneas atingido (${limiter.max}). Tente novamente em instantes.`,
      })
    }

    const { skillId } = req.params as { skillId: string }
    const { workspaceId, projectId, brief, context, operatorInput } = parsed.data
    try {
      const resolvedWorkspaceId = await resolveWorkspaceId(projectId, workspaceId)
      // Persiste ANTES de executar (AC1): o job é durável e reidratável por jobId,
      // independente da conexão HTTP.
      const job = await skillJobStore.create({
        workspaceId: resolvedWorkspaceId,
        projectId,
        skillId,
        input: { projectId, brief, context, operatorInput },
      })
      // Dispara a execução longa segurando o slot já adquirido; responde 202 já.
      void runHoldingSlot(job.jobId)
      return reply.status(202).send({ jobId: job.jobId, status: job.status })
    } catch (error) {
      limiter.release()
      req.log.error(error, `failed to enqueue local skill ${skillId}`)
      return reply.status(500).send({
        code: 'LOCAL_SKILL_ENQUEUE_FAILED',
        message: error instanceof Error ? error.message : 'Falha ao registrar a execução da skill.',
      })
    }
  })

  // --- Poll projection (graceful-degradation fallback — AC3) ---------------
  app.get('/api/local/skill-runs/:jobId', async (req, reply) => {
    if (!guardSkillRunRequest(req, reply)) return reply
    const { jobId } = req.params as { jobId: string }
    const view = await skillJobStore.view(jobId)
    if (!view) {
      return reply.status(404).send({ code: 'SKILL_RUN_NOT_FOUND', message: `Run ${jobId} não encontrado.` })
    }
    return reply.status(200).send(view)
  })

  // --- SSE progress channel (preferred transport — AC3) --------------------
  app.get('/api/local/skill-runs/:jobId/stream', async (req, reply) => {
    if (!guardSkillRunRequest(req, reply)) return reply
    const { jobId } = req.params as { jobId: string }
    const view = await skillJobStore.view(jobId)
    if (!view) {
      return reply.status(404).send({ code: 'SKILL_RUN_NOT_FOUND', message: `Run ${jobId} não encontrado.` })
    }
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    })
    // Snapshot inicial (NFR9 — subscriber tardio vê o estado corrente); polling
    // lê a MESMA projeção.
    reply.raw.write(`event: snapshot\ndata: ${JSON.stringify({ type: 'snapshot', payload: view })}\n\n`)
    const unsubscribe = skillRunBus.subscribe(jobId, (event) => {
      reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
    })
    const keepAlive = setInterval(() => reply.raw.write(`: keep-alive\n\n`), 15_000)
    req.raw.on('close', () => {
      clearInterval(keepAlive)
      unsubscribe()
    })
    return reply
  })

  // --- Cancel (AC4) --------------------------------------------------------
  app.post('/api/local/skill-runs/:jobId/cancel', async (req, reply) => {
    if (!guardSkillRunRequest(req, reply)) return reply
    const { jobId } = req.params as { jobId: string }
    // Remove da fila de pump se ainda não despachado (evita rodar depois).
    const queuedIdx = pendingQueue.indexOf(jobId)
    if (queuedIdx >= 0) pendingQueue.splice(queuedIdx, 1)
    const result = await skillWorker!.cancel(jobId)
    if (!result.ok) {
      const notFound = result.reason?.includes('não encontrado')
      return reply.status(notFound ? 404 : 409).send({
        code: notFound ? 'SKILL_RUN_NOT_FOUND' : 'SKILL_RUN_CANCEL_REJECTED',
        message: result.reason ?? 'Não foi possível cancelar o run.',
      })
    }
    return reply.status(200).send({ ok: true })
  })

  // --- Retry (AC4) — cria uma tentativa auditável --------------------------
  app.post('/api/local/skill-runs/:jobId/retry', async (req, reply) => {
    if (!guardSkillRunRequest(req, reply)) return reply
    const { jobId } = req.params as { jobId: string }
    const retried = await skillJobStore.startRetry(jobId)
    if (!retried) {
      const existing = await skillJobStore.get(jobId)
      if (!existing) {
        return reply.status(404).send({ code: 'SKILL_RUN_NOT_FOUND', message: `Run ${jobId} não encontrado.` })
      }
      return reply.status(409).send({
        code: 'SKILL_RUN_RETRY_REJECTED',
        message: `Run ${jobId} não está em estado terminal (${existing.status}).`,
      })
    }
    scheduleRun(retried.jobId)
    return reply.status(202).send({ jobId: retried.jobId, attempt: retried.attempt, status: retried.status })
  })

  // --- Ads jobs SSE skeleton (arch §6.2 — separate job family) --------------
  // Snapshot da projeção corrente do job ads; a ponte pub/sub viva chega com os
  // `ads-*` job types. Polling `jobs.get` é o fallback.
  app.get('/jobs/:jobId/stream', async (req, reply) => {
    const { jobId } = req.params as { jobId: string }
    const view = store.view(jobId)
    if (!view) {
      return reply.status(404).send({ error: `job ${jobId} not found` })
    }
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    })
    reply.raw.write(`event: snapshot\ndata: ${JSON.stringify(view)}\n\n`)
    const keepAlive = setInterval(() => {
      reply.raw.write(`: keep-alive\n\n`)
    }, 15_000)
    req.raw.on('close', () => clearInterval(keepAlive))
    return reply
  })

  // --- Recovery on boot (AC5) — reivindica leases expirados sem duplicar -----
  if (skillWorker && options.recoverOnBoot !== false) {
    const recoverable = await skillJobStore.findRecoverable()
    if (recoverable.length > 0) {
      app.log.info(`[skill-run] recuperando ${recoverable.length} run(s) não-terminais após boot`)
      for (const job of recoverable) scheduleRun(job.jobId)
    }
  }

  return app
}
