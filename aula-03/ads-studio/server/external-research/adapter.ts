import { spawn } from 'node:child_process'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertSnapshotIntegrity,
  EXTERNAL_RESEARCH_ADAPTER_VERSION,
  externalResearchRequestSchema,
  researchFingerprint,
  snapshotHash,
  type ExternalResearchCollectionResult,
  type ExternalResearchRequest,
  type ExternalResearchSkillId,
  type ExternalResearchSnapshot,
  type ExternalResearchSnapshotCore,
  type ExternalResearchSourceResult,
} from './contracts.js'

export interface ExternalResearchAdapter {
  collect(input: {
    skillId: ExternalResearchSkillId
    projectId: string
    request: unknown
    signal?: AbortSignal
    onLog?: (line: { level: 'info' | 'warn' | 'error'; message: string }) => void
  }): Promise<ExternalResearchCollectionResult>
}

type CollectorExecutor = (input: {
  request: ExternalResearchRequest
  signal?: AbortSignal
  env: NodeJS.ProcessEnv
}) => Promise<{ sources: ExternalResearchSourceResult[] }>

const COLLECTOR_ENV_ALLOWLIST = [
  'PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'LANG', 'LANGUAGE', 'TZ',
  'APIFY_API_TOKEN', 'APIFY_API_KEY', 'META_AD_LIBRARY_TOKEN',
] as const

export function sanitizeCollectorEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const allowed = new Set<string>(COLLECTOR_ENV_ALLOWLIST)
  return Object.fromEntries(Object.entries(env).filter(([key, value]) => allowed.has(key) && value !== undefined))
}

function redactCollectorFailure(message: string, env: NodeJS.ProcessEnv): string {
  let clean = message
  for (const key of ['APIFY_API_TOKEN', 'APIFY_API_KEY', 'META_AD_LIBRARY_TOKEN']) {
    const secret = env[key]
    if (secret) clean = clean.split(secret).join('[redacted]')
  }
  return clean.replace(/([?&](?:token|access_token)=)[^&\s]+/gi, '$1[redacted]').slice(0, 2_000)
}

function defaultCollectorExecutor(workerPath: string): CollectorExecutor {
  return ({ request, signal, env }) => new Promise((resolvePromise, reject) => {
    if (signal?.aborted) return reject(new Error('Coleta externa cancelada.'))
    const child = spawn(process.execPath, [workerPath], { env, stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => child.kill('SIGKILL'), 6 * 60_000)
    const onAbort = () => child.kill('SIGTERM')
    signal?.addEventListener('abort', onAbort, { once: true })
    child.stdout.on('data', (chunk: Buffer) => { if (stdout.length < 8_000_000) stdout += chunk.toString() })
    child.stderr.on('data', (chunk: Buffer) => { if (stderr.length < 64_000) stderr += chunk.toString() })
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      if (signal?.aborted) return reject(new Error('Coleta externa cancelada.'))
      if (code !== 0) return reject(new Error(`Subprocesso de coleta falhou (exit ${code}): ${stderr || 'sem detalhes'}`))
      try {
        resolvePromise(JSON.parse(stdout) as { sources: ExternalResearchSourceResult[] })
      } catch {
        reject(new Error('Subprocesso de coleta devolveu JSON inválido.'))
      }
    })
    child.stdin.end(JSON.stringify({ sources: request.sources }))
  })
}

function manualSource(request: ExternalResearchRequest): ExternalResearchSourceResult | null {
  const material = request.pastedMaterial?.trim()
  if (!material) return null
  const now = new Date().toISOString()
  return {
    sourceId: 'operator-material',
    provider: 'operator',
    kind: 'pasted-material',
    target: request.pastedSourceLabel?.trim() || 'Material fornecido pelo operador',
    status: 'completed',
    startedAt: now,
    completedAt: now,
    itemCount: 1,
    items: [{ sourceItemId: 'operator-material-1', url: null, publishedAt: null, author: null, text: material, metrics: {}, literal: material }],
    failure: null,
  }
}

async function waitForCache(path: string, signal?: AbortSignal): Promise<ExternalResearchSnapshot | null> {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (signal?.aborted) throw new Error('Coleta externa cancelada.')
    try {
      const snapshot = JSON.parse(await readFile(path, 'utf8')) as ExternalResearchSnapshot
      assertSnapshotIntegrity(snapshot)
      return snapshot
    } catch (error) {
      if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('hash divergente'))) throw error
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
  }
  return null
}

export class CachedExternalResearchAdapter implements ExternalResearchAdapter {
  private readonly runtimeRoot: string
  private readonly executeCollector: CollectorExecutor
  private readonly env: NodeJS.ProcessEnv

  constructor(options: {
    runtimeRoot: string
    env?: NodeJS.ProcessEnv
    workerPath?: string
    executeCollector?: CollectorExecutor
  }) {
    this.runtimeRoot = options.runtimeRoot
    this.env = options.env ?? process.env
    const defaultWorkerPath = fileURLToPath(new URL('./collector-worker.mjs', import.meta.url))
    this.executeCollector = options.executeCollector ?? defaultCollectorExecutor(options.workerPath ?? defaultWorkerPath)
  }

  async collect(input: Parameters<ExternalResearchAdapter['collect']>[0]): Promise<ExternalResearchCollectionResult> {
    const request = externalResearchRequestSchema.parse(input.request)
    const fingerprint = researchFingerprint({ skillId: input.skillId, projectId: input.projectId, request })
    const snapshotPath = resolve(this.runtimeRoot, input.projectId, `${fingerprint}.json`)
    const lockPath = `${snapshotPath}.lock`
    await mkdir(dirname(snapshotPath), { recursive: true })

    try {
      const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8')) as ExternalResearchSnapshot
      assertSnapshotIntegrity(snapshot)
      input.onLog?.({ level: 'info', message: `Snapshot externo reutilizado (${fingerprint.slice(0, 12)}); nenhuma nova chamada faturável.` })
      return { snapshot, cacheHit: true, snapshotPath }
    } catch (error) {
      if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('hash divergente'))) throw error
    }

    try {
      await mkdir(lockPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      const snapshot = await waitForCache(snapshotPath, input.signal)
      if (!snapshot) throw new Error('Outra coleta idêntica não concluiu dentro do limite.')
      input.onLog?.({ level: 'info', message: `Snapshot externo compartilhado (${fingerprint.slice(0, 12)}); cobrança duplicada evitada.` })
      return { snapshot, cacheHit: true, snapshotPath }
    }

    try {
      const operatorSource = manualSource(request)
      let networkSources: ExternalResearchSourceResult[] = []
      if (request.mode !== 'offline') {
        input.onLog?.({ level: 'info', message: `Coletando ${request.sources.length} fonte(s) externa(s) em subprocesso isolado.` })
        const collectorEnv = sanitizeCollectorEnv(this.env)
        try {
          networkSources = (await this.executeCollector({ request, signal: input.signal, env: collectorEnv })).sources
        } catch (error) {
          throw new Error(redactCollectorFailure(error instanceof Error ? error.message : String(error), collectorEnv))
        }
      }
      const sources = [...(operatorSource ? [operatorSource] : []), ...networkSources]
      const now = new Date().toISOString()
      const core: ExternalResearchSnapshotCore = {
        schemaVersion: '1.0.0',
        adapterVersion: EXTERNAL_RESEARCH_ADAPTER_VERSION,
        skillId: input.skillId,
        projectId: input.projectId,
        mode: request.mode,
        query: request.query?.trim() || null,
        fingerprint,
        collectedAt: now,
        frozenAt: now,
        sources,
        quota: {
          maxBillableCalls: request.maxBillableCalls,
          attemptedBillableCalls: request.mode === 'offline' ? 0 : request.sources.length,
          completedBillableCalls: networkSources.filter((source) => source.status === 'completed').length,
          maxItemsPerSource: Math.max(0, ...request.sources.map((source) => source.limit)),
        },
        failures: sources.filter((source) => source.status === 'failed').map((source) => ({ sourceId: source.sourceId, reason: source.failure ?? 'Falha sem detalhe.' })),
      }
      const snapshot: ExternalResearchSnapshot = { ...core, contentHash: snapshotHash(core) }
      const temporaryPath = `${snapshotPath}.${process.pid}.tmp`
      await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
      await rename(temporaryPath, snapshotPath)
      input.onLog?.({ level: snapshot.failures.length ? 'warn' : 'info', message: `Snapshot externo congelado (${fingerprint.slice(0, 12)}, ${sources.reduce((sum, source) => sum + source.itemCount, 0)} item(ns)).` })
      return { snapshot, cacheHit: false, snapshotPath }
    } finally {
      await rm(lockPath, { recursive: true, force: true })
    }
  }
}

export function createExternalResearchAdapterFromEnv(env: NodeJS.ProcessEnv = process.env): ExternalResearchAdapter {
  return new CachedExternalResearchAdapter({
    runtimeRoot: env.MARKETING_STUDIO_RESEARCH_ROOT ?? resolve(env.TMPDIR ?? '/tmp', 'marketing-studio-external-research'),
    env,
  })
}
