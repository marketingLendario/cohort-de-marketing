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
 *   POST/GET /trpc/*          → `jobs.*` contract (arch §6.2)
 *   GET      /jobs/:id/stream → SSE progress channel `job:{jobId}`
 *                               (`step|item|log|done|error`) — deploy-topology §1.4
 *   GET      /health, /healthz
 *
 * STORY-AL-ADS-1.3 (AC8, AC9).
 */
import Fastify from 'fastify'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './trpc/router.js'
import { makeCreateContext } from './trpc/context.js'
import { createInMemoryJobStore, type JobStore } from './jobs/store.js'
import {
  createBackendSupabaseClient,
  createSupabaseCampaignRepo,
  type CampaignEconomicsRepo,
} from './lib/campaign-economics-repo.js'
import { getBffHealth } from './index.js'
import { getWorkerHealth } from './worker/index.js'
import { createLocalSkillRunnerFromEnv, type LocalSkillRunner } from './local-skill-runner.js'
import { z } from 'zod'

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
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const store = options.store ?? createInMemoryJobStore()
  const campaignRepo =
    options.campaignRepo !== undefined
      ? options.campaignRepo
      : (() => {
          const client = createBackendSupabaseClient()
          return client ? createSupabaseCampaignRepo(client) : null
        })()
  const skillRunner = options.skillRunner !== undefined ? options.skillRunner : createLocalSkillRunnerFromEnv()

  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL || 'info' },
  })

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
    projectId: z.string().min(1),
    brief: z.record(z.unknown()),
    context: z.record(z.unknown()).optional(),
    operatorInput: z.string().max(20_000).optional(),
  })

  app.post('/api/local/skills/:skillId/run', async (req, reply) => {
    if (!skillRunner) {
      return reply.status(503).send({
        code: 'LOCAL_SKILL_RUNNER_DISABLED',
        message: 'Runner local desabilitado. Defina LOCAL_SKILL_RUNNER_ENABLED=true e mantenha o Codex CLI autenticado.',
      })
    }
    const parsed = localSkillRunSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ code: 'INVALID_SKILL_INPUT', issues: parsed.error.issues })
    }
    const { skillId } = req.params as { skillId: string }
    try {
      const result = await skillRunner.run(skillId, parsed.data)
      return reply.status(200).send(result)
    } catch (error) {
      req.log.error(error, `local skill ${skillId} failed`)
      return reply.status(500).send({
        code: 'LOCAL_SKILL_RUN_FAILED',
        message: error instanceof Error ? error.message : 'Falha inesperada no runner local.',
      })
    }
  })

  // --- SSE progress channel (preferred transport — deploy-topology §1.4) ---
  // Skeleton: opens the stream and replays the current job projection as a
  // snapshot event, then keeps the connection open for the worker to push
  // `step|item|log|done|error` (the live pub/sub bridge over `@sinkra/job-stream`
  // is wired when the `ads-*` job types land). Polling `jobs.get` is the fallback.
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
    // Initial snapshot so a late subscriber sees current state (NFR9 — no mute).
    reply.raw.write(`event: snapshot\ndata: ${JSON.stringify(view)}\n\n`)
    // Keep-alive comment; the live event bridge is attached in epics 2-5.
    const keepAlive = setInterval(() => {
      reply.raw.write(`: keep-alive\n\n`)
    }, 15_000)
    req.raw.on('close', () => clearInterval(keepAlive))
  })

  return app
}
