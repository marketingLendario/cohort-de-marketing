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
  ArtifactApprovalError,
  approvalRecordForBrowser,
  createArtifactApprovalService,
  createSupabaseApprovalRunGateway,
  createSupabaseArtifactApprovalStore,
  type ApprovalErrorCode,
  type ArtifactApprovalService,
} from './artifact-approval.js'
import { resolve as resolvePath } from 'node:path'
import {
  createBackendSupabaseClient,
  createSupabaseCampaignRepo,
  type CampaignEconomicsRepo,
} from './lib/campaign-economics-repo.js'
import { getBffHealth } from './index.js'
import { getWorkerHealth } from './worker/index.js'
import { createLocalSkillRunnerFromEnv, type LocalSkillRunner } from './local-skill-runner.js'
import { CreativeFactoryLocalRunner } from './creative-factory/runner.js'
import { RoutedLocalSkillRunner } from './routed-skill-runner.js'
import { createDocumentPackApprovalDeriver } from './document-pack/approval-deriver.js'
import {
  LOCAL_RUNNER_TOKEN_HEADER,
  WorkspaceMismatchError,
  authorizeLocalRunnerRequest,
  createConcurrencyLimiter,
  resolveLocalRunnerLimits,
  resolveLocalRunnerToken,
  resolveTenantWorkspaceId,
  type LocalRunnerLimits,
} from './local-runner-security.js'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { readReadinessSnapshot } from './readiness.js'
import {
  createLocalBootstrapService,
  createSupabaseLocalBootstrapStore,
  LocalBootstrapClosedError,
  localBootstrapInputSchema,
  type LocalBootstrapService,
} from './local-bootstrap.js'
import {
  createProjectIntakeService,
  createSupabaseProjectIntakeStore,
  ProjectIntakeError,
  type ProjectIntakeErrorCode,
  type ProjectIntakeService,
} from './project-intake.js'
import {
  createProjectStatusService,
  createSupabaseProjectStatusStore,
  ProjectStatusError,
  type ProjectStatusService,
} from './project-status/service.js'
import {
  createEnvironmentBootstrapService,
  EnvironmentBootstrapError,
  type EnvironmentBootstrapService,
} from './environment-bootstrap/service.js'
import {
  promoteCreativeFactoryBatch,
  readCreativeFactoryAsset,
  readCreativeFactoryManifest,
} from './creative-factory/storage.js'

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
  /**
   * Deriva o `workspace_id` autoritativo de um projeto (QA-W2B1-03). Injetável
   * para testes; por padrão consulta `marketing_projects` via Supabase backend
   * (ou `null` quando não há credenciais — fallback de dev sem writer service-role).
   */
  deriveProjectWorkspaceId?: (projectId: string) => Promise<string | null>
  /**
   * Serviço de aprovação de artefatos em duas fases (STORY-8.W2.3). Injetável
   * para testes; por padrão usa Supabase service-role + o materializador W1.3
   * quando há credenciais, senão fica `null` (capacidade desligada — NFR9).
   */
  artifactApprovalService?: ArtifactApprovalService | null
  /** Raiz do monorepo (para resolver `projetos/`). Default: env/`../..`. */
  cohortRepoRoot?: string
  /** Snapshot sanitizado produzido pelo launcher local (STORY-8.W3.3). */
  readinessFile?: string
  /** Bootstrap one-shot do operador local; injetável para testes. */
  localBootstrapService?: LocalBootstrapService | null
  /** Intake seguro de artefatos do filesystem; injetável para testes. */
  projectIntakeService?: ProjectIntakeService | null
  /** Status reconciliado e estritamente read-only do projeto. */
  projectStatusService?: ProjectStatusService | null
  /** Diagnóstico canônico do /comecar e recuperações com consentimento. */
  environmentBootstrapService?: EnvironmentBootstrapService | null
  /** Runtime root for generated creative batches (injectable in tests). */
  creativeFactoryRuntimeRoot?: string
  /** Authoritative project slug resolver used by binary promotion. */
  resolveProjectSlug?: (projectId: string) => Promise<string | null>
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const store = options.store ?? createInMemoryJobStore()
  const cohortRepoRoot = options.cohortRepoRoot ?? process.env.COHORT_REPO_ROOT ?? resolvePath(process.cwd(), '../..')
  const projectsRoot = resolvePath(cohortRepoRoot, 'projetos')
  const creativeFactoryRuntimeRoot = options.creativeFactoryRuntimeRoot ?? process.env.MARKETING_STUDIO_CREATIVE_ROOT
    ?? resolvePath(process.env.TMPDIR ?? '/tmp', 'marketing-studio-creative-factory')
  // Cliente Supabase backend compartilhado (service-role, NFR10) — usado pelo
  // Gate#1 e pelo journal durável de skill-runs. Null sem credenciais.
  const backendSupabase: SupabaseClient | null = createBackendSupabaseClient()
  const localBootstrapService: LocalBootstrapService | null =
    options.localBootstrapService !== undefined
      ? options.localBootstrapService
      : backendSupabase
        ? createLocalBootstrapService(createSupabaseLocalBootstrapStore(backendSupabase))
        : null
  const campaignRepo =
    options.campaignRepo !== undefined
      ? options.campaignRepo
      : backendSupabase
        ? createSupabaseCampaignRepo(backendSupabase)
        : null
  const genericSkillRunner = options.skillRunner !== undefined ? options.skillRunner : createLocalSkillRunnerFromEnv()
  const skillRunner = options.skillRunner !== undefined
    ? options.skillRunner
    : genericSkillRunner
      ? new RoutedLocalSkillRunner(
          genericSkillRunner,
          new CreativeFactoryLocalRunner({ repoRoot: cohortRepoRoot, runtimeRoot: creativeFactoryRuntimeRoot }),
        )
      : null

  // Journal durável do skill-run (AC2): Supabase em produção, fake in-memory
  // quando não há credenciais (o BFF ainda sobe — NFR9).
  const skillJobStore: SkillRunJobStore =
    options.skillJobStore ??
    (backendSupabase ? createSupabaseSkillRunJobStore(backendSupabase) : createInMemorySkillRunJobStore())
  const skillRunBus: SkillRunEventBus = options.skillRunEventBus ?? createSkillRunEventBus()
  const workerOwnerId = options.workerOwnerId ?? `bff-${randomUUID()}`

  // Aprovação de artefatos em duas fases (STORY-8.W2.3). A materialização é
  // backend-only (filesystem), então o BFF é a ÚNICA autoridade que mantém o
  // filesystem e o banco coerentes via a saga/outbox. Requer o backend Supabase
  // (service-role) para persistir o outbox/artefato/skill_run; sem credenciais a
  // capacidade fica desligada (o BFF ainda sobe — NFR9).
  const artifactApprovalService: ArtifactApprovalService | null =
    options.artifactApprovalService !== undefined
      ? options.artifactApprovalService
      : backendSupabase
        ? createArtifactApprovalService({
            store: createSupabaseArtifactApprovalStore(backendSupabase),
            runs: createSupabaseApprovalRunGateway(backendSupabase),
            projectsRoot,
            deriveArtifacts: createDocumentPackApprovalDeriver({ repoRoot: cohortRepoRoot, projectsRoot }),
          })
        : null
  const projectIntakeService: ProjectIntakeService | null =
    options.projectIntakeService !== undefined
      ? options.projectIntakeService
      : backendSupabase
        ? createProjectIntakeService({
            store: createSupabaseProjectIntakeStore(backendSupabase),
            projectsRoot,
          })
        : null
  const projectStatusService: ProjectStatusService | null =
    options.projectStatusService !== undefined
      ? options.projectStatusService
      : backendSupabase
        ? createProjectStatusService({
            store: createSupabaseProjectStatusStore(backendSupabase),
            projectsRoot,
          })
        : null
  const environmentBootstrapService = options.environmentBootstrapService !== undefined
    ? options.environmentBootstrapService
    : createEnvironmentBootstrapService({ repoRoot: cohortRepoRoot })

  // Boundary de segurança do runner local (STORY-8.W1.2). O TOKEN é o segredo do
  // boundary `/api/local/*` inteiro (runner + aprovação de artefatos), então é
  // resolvido sempre — o limiter/worker do Codex só quando o runner está ligado.
  const runnerLimits: LocalRunnerLimits = { ...resolveLocalRunnerLimits(), ...options.localRunnerLimits }
  let runnerToken: string | null = null
  let runnerLimiter: ReturnType<typeof createConcurrencyLimiter> | null = null
  let runnerTokenEphemeral = false
  let skillWorker: SkillRunWorker | null = null
  if (options.localRunnerToken && options.localRunnerToken.length > 0) {
    runnerToken = options.localRunnerToken
  } else {
    const resolved = resolveLocalRunnerToken()
    runnerToken = resolved.token
    runnerTokenEphemeral = resolved.ephemeral
  }
  if (skillRunner) {
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

  if (runnerTokenEphemeral && (skillRunner || artifactApprovalService)) {
    // Fail-closed: sem segredo compartilhado configurado o boundary local fica
    // efetivamente trancado (o proxy Vite não conhece o token efêmero). NÃO
    // logamos o valor (AC3).
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
  app.get('/api/local/readiness', async (_req, reply) => {
    reply.header('cache-control', 'no-store')
    return reply.status(200).send(
      await readReadinessSnapshot(options.readinessFile ?? process.env.MARKETING_STUDIO_READINESS_FILE),
    )
  })

  function isLoopbackRequest(req: FastifyRequest): boolean {
    const address = req.ip.replace(/^::ffff:/, '')
    return address === '127.0.0.1' || address === '::1'
  }

  function guardLocalBootstrapRequest(req: FastifyRequest, reply: FastifyReply): boolean {
    if (!isLoopbackRequest(req)) {
      reply.status(403).send({ code: 'LOCAL_BOOTSTRAP_LOOPBACK_ONLY', message: 'Este recurso só está disponível localmente.' })
      return false
    }
    if (!localBootstrapService || !runnerToken) {
      reply.status(503).send({ code: 'LOCAL_BOOTSTRAP_DISABLED', message: 'Primeiro acesso local indisponível.' })
      return false
    }
    const providedToken = req.headers[LOCAL_RUNNER_TOKEN_HEADER]
    const auth = authorizeLocalRunnerRequest(Array.isArray(providedToken) ? providedToken[0] : providedToken, runnerToken)
    if (!auth.ok) {
      reply.status(auth.status).send({ code: auth.code, message: auth.message })
      return false
    }
    return true
  }

  app.get('/api/local/bootstrap/status', async (req, reply) => {
    if (!guardLocalBootstrapRequest(req, reply)) return reply
    reply.header('cache-control', 'no-store')
    try {
      return reply.status(200).send(await localBootstrapService!.status())
    } catch {
      return reply.status(503).send({ code: 'LOCAL_BOOTSTRAP_UNAVAILABLE', message: 'Não foi possível consultar o primeiro acesso.' })
    }
  })

  app.post('/api/local/bootstrap', async (req, reply) => {
    if (!guardLocalBootstrapRequest(req, reply)) return reply
    const parsed = localBootstrapInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ code: 'INVALID_LOCAL_BOOTSTRAP_INPUT', issues: parsed.error.issues })
    }
    try {
      return reply.status(201).send(await localBootstrapService!.create(parsed.data))
    } catch (error) {
      if (error instanceof LocalBootstrapClosedError) {
        return reply.status(409).send({ code: 'LOCAL_BOOTSTRAP_CLOSED', message: error.message })
      }
      return reply.status(500).send({ code: 'LOCAL_BOOTSTRAP_FAILED', message: 'Não foi possível concluir o primeiro acesso.' })
    }
  })

  const localSkillRunSchema = z.object({
    // Opcional no boundary (compat com callers legados): derivado do projeto abaixo.
    workspaceId: z.string().min(1).optional(),
    projectId: z.string().min(1),
    brief: z.record(z.unknown()),
    context: z.record(z.unknown()).optional(),
    operatorInput: z.string().max(20_000).optional(),
  })

  // Derivação autoritativa do workspace do projeto (QA-W2B1-03): lê
  // `marketing_projects` via Supabase backend. Sem credenciais, resolve `null`
  // (fallback de dev in-memory, sem writer service-role a proteger).
  const deriveProjectWorkspaceId: (projectId: string) => Promise<string | null> =
    options.deriveProjectWorkspaceId ??
    (async (projectId: string) => {
      if (!backendSupabase) return null
      const { data, error } = await backendSupabase
        .from('marketing_projects')
        .select('workspace_id')
        .eq('id', projectId)
        .maybeSingle()
      if (error) {
        throw new Error(`[skill-run-jobs] project workspace lookup failed: ${error.message}`)
      }
      const workspaceId = data?.workspace_id as string | undefined
      if (!workspaceId) {
        throw new Error(`[skill-run-jobs] project ${projectId} has no authoritative workspace`)
      }
      return workspaceId
    })

  /**
   * Resolve o `workspace_id` (eixo RLS/tenant) para a escrita service-role no
   * journal durável. NUNCA confia num valor enviado pela UI contra o workspace
   * derivado do projeto: um `provided` divergente é rejeitado antes de qualquer
   * escrita (QA-W2B1-03). Sem DB, cai no fallback de dev (`provided`/`projectId`).
   */
  async function resolveWorkspaceId(projectId: string, provided?: string): Promise<string> {
    const derived = await deriveProjectWorkspaceId(projectId)
    return resolveTenantWorkspaceId(projectId, provided, derived)
  }

  const resolveProjectSlug = options.resolveProjectSlug ?? (async (projectId: string): Promise<string | null> => {
    if (!backendSupabase) return null
    const { data, error } = await backendSupabase
      .from('marketing_projects')
      .select('slug')
      .eq('id', projectId)
      .maybeSingle()
    if (error) throw new Error(`[creative-factory] project slug lookup failed: ${error.message}`)
    return typeof data?.slug === 'string' ? data.slug : null
  })

  /**
   * Boundary guard shared by every skill-run endpoint (STORY-8.W1.2 hardening
   * preserved): 503 when the capability is off, 401/403 on the token. The Vite
   * dev proxy injects the token server-side, so the browser (incl. EventSource)
   * never holds the secret (AC3/NFR10).
   */
  function guardSkillRunRequest(req: FastifyRequest, reply: FastifyReply): boolean {
    if (!isLoopbackRequest(req)) {
      reply.status(403).send({ code: 'LOCAL_SKILL_RUNNER_LOOPBACK_ONLY', message: 'Este recurso só está disponível localmente.' })
      return false
    }
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

  function guardCreativeFactoryRequest(req: FastifyRequest, reply: FastifyReply): boolean {
    if (!isLoopbackRequest(req)) {
      reply.status(403).send({ code: 'CREATIVE_FACTORY_LOOPBACK_ONLY', message: 'Este recurso só está disponível localmente.' })
      return false
    }
    if (!runnerToken) {
      reply.status(503).send({ code: 'CREATIVE_FACTORY_DISABLED', message: 'Creative Factory local desabilitada.' })
      return false
    }
    const providedToken = req.headers[LOCAL_RUNNER_TOKEN_HEADER]
    const auth = authorizeLocalRunnerRequest(Array.isArray(providedToken) ? providedToken[0] : providedToken, runnerToken)
    if (!auth.ok) {
      reply.status(auth.status).send({ code: auth.code, message: auth.message })
      return false
    }
    return true
  }

  /**
   * Boundary guard for the artifact-approval surface (STORY-8.W2.3). Same local
   * token (injected by the Vite proxy, never held by the browser) but does NOT
   * require the Codex runner — approval only needs the materializer + DB. 503
   * when the capability is off (no Supabase backend), 401/403 on the token.
   */
  function guardApprovalRequest(req: FastifyRequest, reply: FastifyReply): boolean {
    if (!isLoopbackRequest(req)) {
      reply.status(403).send({ code: 'ARTIFACT_APPROVAL_LOOPBACK_ONLY', message: 'Este recurso só está disponível localmente.' })
      return false
    }
    if (!artifactApprovalService || !runnerToken) {
      reply.status(503).send({
        code: 'ARTIFACT_APPROVAL_DISABLED',
        message: 'Aprovação de artefatos desabilitada (sem backend de persistência configurado).',
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

  /**
   * Boundary guard for filesystem intake (EPIC-9 / STORY-9.W2.1). Same local
   * token do boundary `/api/local/*`, sem exigir o runner Codex: a capacidade só
   * depende do backend service-role e do scanner confinado em `projetos/`.
   */
  function guardProjectIntakeRequest(req: FastifyRequest, reply: FastifyReply): boolean {
    if (!isLoopbackRequest(req)) {
      reply.status(403).send({ code: 'PROJECT_INTAKE_LOOPBACK_ONLY', message: 'Este recurso só está disponível localmente.' })
      return false
    }
    if (!projectIntakeService || !runnerToken) {
      reply.status(503).send({
        code: 'PROJECT_INTAKE_DISABLED',
        message: 'Intake local desabilitado (sem backend de persistência configurado).',
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

  function guardProjectStatusRequest(req: FastifyRequest, reply: FastifyReply): boolean {
    if (!isLoopbackRequest(req)) {
      reply.status(403).send({ code: 'PROJECT_STATUS_LOOPBACK_ONLY', message: 'Este recurso só está disponível localmente.' })
      return false
    }
    if (!projectStatusService || !runnerToken) {
      reply.status(503).send({ code: 'PROJECT_STATUS_DISABLED', message: 'Status local do projeto indisponível.' })
      return false
    }
    const providedToken = req.headers[LOCAL_RUNNER_TOKEN_HEADER]
    const auth = authorizeLocalRunnerRequest(Array.isArray(providedToken) ? providedToken[0] : providedToken, runnerToken)
    if (!auth.ok) {
      reply.status(auth.status).send({ code: auth.code, message: auth.message })
      return false
    }
    return true
  }

  function guardEnvironmentBootstrapRequest(req: FastifyRequest, reply: FastifyReply): boolean {
    if (!isLoopbackRequest(req)) {
      reply.status(403).send({ code: 'ENVIRONMENT_BOOTSTRAP_LOOPBACK_ONLY', message: 'Este recurso só está disponível localmente.' })
      return false
    }
    if (!environmentBootstrapService || !runnerToken) {
      reply.status(503).send({ code: 'ENVIRONMENT_BOOTSTRAP_DISABLED', message: 'Diagnóstico do ambiente indisponível.' })
      return false
    }
    const providedToken = req.headers[LOCAL_RUNNER_TOKEN_HEADER]
    const auth = authorizeLocalRunnerRequest(Array.isArray(providedToken) ? providedToken[0] : providedToken, runnerToken)
    if (!auth.ok) {
      reply.status(auth.status).send({ code: auth.code, message: auth.message })
      return false
    }
    return true
  }

  const approvalArtifactSchema = z.object({
    artifactType: z.string().min(1),
    title: z.string().min(1),
    path: z.string().min(1),
    format: z.enum(['markdown', 'json', 'yaml', 'html']),
    content: z.string(),
  })
  const approvalPlanSchema = z.object({
    skillRunId: z.string().min(1),
    artifacts: z.array(approvalArtifactSchema).min(1),
  })
  const approvalDecideSchema = z.object({
    skillRunId: z.string().min(1),
    decision: z.enum(['approve', 'reject']),
    expectedProposalHash: z.string().min(1),
    expectedProposalRevision: z.number().int().positive(),
    idempotencyKey: z.string().min(1).max(200),
    artifacts: z.array(approvalArtifactSchema).optional(),
  })
  const projectIntakePreviewSchema = z.object({
    projectId: z.string().min(1),
    sourceSlug: z.string().min(1),
  })
  const projectIntakeConfirmSchema = z.object({
    projectId: z.string().min(1),
    sourceSlug: z.string().min(1),
    expectedManifestHash: z.string().min(1),
  })

  // Treatable approval errors → HTTP: stale/conflict decisions are 409, a missing
  // run is 404, everything else surfaces as 500 (repairable outbox row persists).
  function approvalErrorStatus(code: ApprovalErrorCode): number {
    switch (code) {
      case 'run-not-found':
        return 404
      case 'not-reviewable':
      case 'stale':
      case 'hash-mismatch':
      case 'duplicate-path':
      case 'idempotency-conflict':
      case 'superseded':
        return 409
      case 'invalid-path':
        return 400
      default:
        return 500
    }
  }

  function projectIntakeErrorStatus(code: ProjectIntakeErrorCode): number {
    switch (code) {
      case 'project-not-found':
      case 'source-not-found':
        return 404
      case 'manifest-stale':
        return 409
      case 'path-traversal':
      case 'symlink-rejected':
      case 'secret-rejected':
      case 'allowlist-violation':
        return 400
      default:
        return 500
    }
  }

  // --- Filesystem intake (EPIC-9 / STORY-9.W2.1) ---------------------------
  app.get('/api/local/project-intake/sources', async (req, reply) => {
    if (!guardProjectIntakeRequest(req, reply)) return reply
    try {
      return reply.status(200).send(await projectIntakeService!.listSources())
    } catch (error) {
      if (error instanceof ProjectIntakeError) {
        return reply.status(projectIntakeErrorStatus(error.code)).send({ code: error.code, message: error.message })
      }
      req.log.error(error, 'project intake source listing failed')
      return reply.status(500).send({
        code: 'PROJECT_INTAKE_SOURCE_LIST_FAILED',
        message: error instanceof Error ? error.message : 'Falha ao listar diretórios para intake.',
      })
    }
  })

  app.post('/api/local/project-intake/preview', async (req, reply) => {
    if (!guardProjectIntakeRequest(req, reply)) return reply
    const parsed = projectIntakePreviewSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ code: 'INVALID_PROJECT_INTAKE_INPUT', issues: parsed.error.issues })
    }
    try {
      return reply.status(200).send(await projectIntakeService!.preview(parsed.data))
    } catch (error) {
      if (error instanceof ProjectIntakeError) {
        return reply.status(projectIntakeErrorStatus(error.code)).send({ code: error.code, message: error.message })
      }
      req.log.error(error, 'project intake preview failed')
      return reply.status(500).send({
        code: 'PROJECT_INTAKE_PREVIEW_FAILED',
        message: error instanceof Error ? error.message : 'Falha ao gerar o preview do intake.',
      })
    }
  })

  app.post('/api/local/project-intake/confirm', async (req, reply) => {
    if (!guardProjectIntakeRequest(req, reply)) return reply
    const parsed = projectIntakeConfirmSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ code: 'INVALID_PROJECT_INTAKE_INPUT', issues: parsed.error.issues })
    }
    try {
      return reply.status(200).send(await projectIntakeService!.confirm(parsed.data))
    } catch (error) {
      if (error instanceof ProjectIntakeError) {
        return reply.status(projectIntakeErrorStatus(error.code)).send({ code: error.code, message: error.message })
      }
      req.log.error(error, 'project intake confirmation failed')
      return reply.status(500).send({
        code: 'PROJECT_INTAKE_CONFIRM_FAILED',
        message: error instanceof Error ? error.message : 'Falha ao confirmar o intake do projeto.',
      })
    }
  })

  app.get('/api/local/projects/:projectId/status', async (req, reply) => {
    if (!guardProjectStatusRequest(req, reply)) return reply
    const parsed = z.object({ projectId: z.string().min(1) }).safeParse(req.params)
    if (!parsed.success) return reply.status(400).send({ code: 'INVALID_PROJECT_STATUS_INPUT', issues: parsed.error.issues })
    reply.header('cache-control', 'no-store')
    try {
      return reply.status(200).send(await projectStatusService!.read(parsed.data.projectId))
    } catch (error) {
      if (error instanceof ProjectStatusError) {
        return reply.status(error.code === 'project-not-found' ? 404 : 400).send({ code: error.code, message: error.message })
      }
      req.log.error(error, 'project status read failed')
      return reply.status(500).send({ code: 'PROJECT_STATUS_FAILED', message: 'Não foi possível reconciliar o status do projeto.' })
    }
  })

  app.get('/api/local/environment-bootstrap', async (req, reply) => {
    if (!guardEnvironmentBootstrapRequest(req, reply)) return reply
    reply.header('cache-control', 'no-store')
    return reply.status(200).send(await environmentBootstrapService!.diagnose())
  })

  app.post('/api/local/environment-bootstrap/recover', async (req, reply) => {
    if (!guardEnvironmentBootstrapRequest(req, reply)) return reply
    const parsed = z.object({ actionId: z.string().min(1), expectedDiagnosisHash: z.string().length(64), consent: z.literal(true), value: z.string().max(256).optional() }).safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ code: 'INVALID_ENVIRONMENT_RECOVERY_INPUT', issues: parsed.error.issues })
    try {
      return reply.status(200).send(await environmentBootstrapService!.recover(parsed.data))
    } catch (error) {
      if (error instanceof EnvironmentBootstrapError) {
        return reply.status(error.code === 'stale-diagnosis' ? 409 : 400).send({ code: error.code, message: error.message })
      }
      req.log.error(error, 'environment recovery failed')
      return reply.status(500).send({ code: 'ENVIRONMENT_RECOVERY_FAILED', message: 'Não foi possível aplicar a recuperação.' })
    }
  })

  // --- Phase 1: plan (read-only diff/affected/warnings — AC1) ---------------
  app.post('/api/local/artifact-approvals/plan', { bodyLimit: runnerLimits.bodyLimitBytes }, async (req, reply) => {
    if (!guardApprovalRequest(req, reply)) return reply
    const parsed = approvalPlanSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ code: 'INVALID_APPROVAL_INPUT', issues: parsed.error.issues })
    }
    try {
      const plan = await artifactApprovalService!.plan(parsed.data)
      return reply.status(200).send(plan)
    } catch (error) {
      if (error instanceof ArtifactApprovalError) {
        return reply.status(approvalErrorStatus(error.code)).send({ code: error.code, message: error.message })
      }
      req.log.error(error, 'artifact approval plan failed')
      return reply.status(500).send({
        code: 'ARTIFACT_APPROVAL_PLAN_FAILED',
        message: error instanceof Error ? error.message : 'Falha ao planejar a aprovação.',
      })
    }
  })

  // --- Phase 2: decide (idempotent outbox saga — AC2/AC3/AC4/AC5) -----------
  app.post('/api/local/artifact-approvals', { bodyLimit: runnerLimits.bodyLimitBytes }, async (req, reply) => {
    if (!guardApprovalRequest(req, reply)) return reply
    const parsed = approvalDecideSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ code: 'INVALID_APPROVAL_INPUT', issues: parsed.error.issues })
    }
    try {
      const record = await artifactApprovalService!.decide(parsed.data)
      return reply.status(200).send(approvalRecordForBrowser(record))
    } catch (error) {
      if (error instanceof ArtifactApprovalError) {
        return reply.status(approvalErrorStatus(error.code)).send({ code: error.code, message: error.message })
      }
      req.log.error(error, 'artifact approval decide failed')
      return reply.status(500).send({
        code: 'ARTIFACT_APPROVAL_DECIDE_FAILED',
        message: error instanceof Error ? error.message : 'Falha ao registrar a decisão de aprovação.',
      })
    }
  })

  // --- Deterministic repair of a stuck decision (AC3/AC6) -------------------
  app.post('/api/local/artifact-approvals/:id/repair', async (req, reply) => {
    if (!guardApprovalRequest(req, reply)) return reply
    const { id } = req.params as { id: string }
    try {
      const record = await artifactApprovalService!.repair(id)
      return reply.status(200).send(approvalRecordForBrowser(record))
    } catch (error) {
      if (error instanceof ArtifactApprovalError) {
        return reply.status(approvalErrorStatus(error.code)).send({ code: error.code, message: error.message })
      }
      req.log.error(error, 'artifact approval repair failed')
      return reply.status(500).send({
        code: 'ARTIFACT_APPROVAL_REPAIR_FAILED',
        message: error instanceof Error ? error.message : 'Falha ao reparar a decisão de aprovação.',
      })
    }
  })

  const creativeAssetParamsSchema = z.object({
    batchId: z.string().regex(/^[a-f0-9-]{16,64}$/i),
    assetId: z.string().regex(/^[a-z0-9-]{1,120}$/),
  }).strict()
  const creativePromotionSchema = z.object({
    projectId: z.string().min(1).max(200),
    selectedItemIds: z.array(z.string().regex(/^[a-z0-9-]{1,120}$/)).min(1).max(36),
  }).strict()

  function factoryJobId(batchId: string): string {
    return batchId.replace(/-a\d+$/, '')
  }

  app.get('/api/local/creative-factory/batches/:batchId/assets/:assetId', async (req, reply) => {
    if (!guardCreativeFactoryRequest(req, reply)) return reply
    const parsed = creativeAssetParamsSchema.safeParse(req.params)
    if (!parsed.success) return reply.status(400).send({ code: 'INVALID_CREATIVE_ASSET', issues: parsed.error.issues })
    try {
      const job = await skillJobStore.get(factoryJobId(parsed.data.batchId))
      if (!job || !['ads-creative-factory', 'criativos-funil', 'mockup-produto-funil'].includes(job.skillId) || job.status !== 'succeeded') {
        return reply.status(404).send({ code: 'CREATIVE_BATCH_NOT_FOUND', message: 'Lote criativo não encontrado.' })
      }
      const manifest = await readCreativeFactoryManifest(creativeFactoryRuntimeRoot, parsed.data.batchId)
      if (manifest.projectId !== job.projectId) throw new Error('Projeto do manifesto diverge do journal.')
      const asset = await readCreativeFactoryAsset({ runtimeRoot: creativeFactoryRuntimeRoot, ...parsed.data })
      reply.header('content-type', 'image/png')
      reply.header('cache-control', 'private, no-store')
      reply.header('etag', `"${asset.sha256}"`)
      return reply.status(200).send(asset.content)
    } catch (error) {
      req.log.warn(error, 'creative asset read rejected')
      return reply.status(404).send({ code: 'CREATIVE_ASSET_NOT_FOUND', message: 'Asset criativo indisponível ou inválido.' })
    }
  })

  app.post('/api/local/creative-factory/batches/:batchId/promote', { bodyLimit: runnerLimits.bodyLimitBytes }, async (req, reply) => {
    if (!guardCreativeFactoryRequest(req, reply)) return reply
    const batch = z.object({ batchId: z.string().regex(/^[a-f0-9-]{16,64}$/i) }).safeParse(req.params)
    const body = creativePromotionSchema.safeParse(req.body)
    if (!batch.success || !body.success) {
      return reply.status(400).send({ code: 'INVALID_CREATIVE_PROMOTION', issues: [...(!batch.success ? batch.error.issues : []), ...(!body.success ? body.error.issues : [])] })
    }
    try {
      const job = await skillJobStore.get(factoryJobId(batch.data.batchId))
      if (!job || !['ads-creative-factory', 'criativos-funil', 'mockup-produto-funil'].includes(job.skillId) || job.status !== 'succeeded') {
        return reply.status(404).send({ code: 'CREATIVE_BATCH_NOT_FOUND', message: 'Lote criativo não encontrado.' })
      }
      if (job.projectId !== body.data.projectId) {
        return reply.status(403).send({ code: 'CREATIVE_PROJECT_MISMATCH', message: 'O lote não pertence ao projeto informado.' })
      }
      const projectSlug = await resolveProjectSlug(body.data.projectId)
      if (!projectSlug) return reply.status(503).send({ code: 'CREATIVE_PROJECT_UNAVAILABLE', message: 'Projeto não possui slug autoritativo para promoção.' })
      const result = await promoteCreativeFactoryBatch({
        runtimeRoot: creativeFactoryRuntimeRoot,
        projectsRoot,
        projectSlug,
        batchId: batch.data.batchId,
        selectedItemIds: body.data.selectedItemIds,
      })
      return reply.status(200).send(result)
    } catch (error) {
      req.log.error(error, 'creative batch promotion failed')
      return reply.status(409).send({
        code: 'CREATIVE_PROMOTION_REJECTED',
        message: error instanceof Error ? error.message : 'Não foi possível promover o lote criativo.',
      })
    }
  })

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
      // Integridade de tenant (QA-W2B1-03): workspace informado ≠ workspace do
      // projeto. Rejeita ANTES de qualquer escrita service-role no journal.
      if (error instanceof WorkspaceMismatchError) {
        return reply.status(400).send({
          code: 'SKILL_RUN_WORKSPACE_MISMATCH',
          message: error.message,
        })
      }
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

  // --- Approval repair on boot (STORY-8.W2.3) — retoma decisões presas -------
  // Uma decisão que travou mid-saga (crash antes/depois do rename) é resumida
  // deterministicamente do estado persistido, sem duplicar a materialização.
  if (artifactApprovalService && options.recoverOnBoot !== false) {
    try {
      const repaired = await artifactApprovalService.repairAll()
      if (repaired.length > 0) {
        app.log.info(`[artifact-approval] reparando ${repaired.length} decisão(ões) presa(s) após boot`)
      }
    } catch (error) {
      app.log.error(error, '[artifact-approval] falha ao reparar decisões no boot')
    }
  }

  return app
}
