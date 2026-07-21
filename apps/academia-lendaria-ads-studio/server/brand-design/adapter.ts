/**
 * Adapter real de `design-md` para os modos `url` e `moodboard`.
 *
 * Congela uma EVIDÊNCIA VISUAL AUTORITATIVA (`BrandDesignSnapshot`) e a devolve
 * pronta para injeção no Codex via `buildBrandDesignGuard`. Espelha os padrões do
 * `external-research`: subprocesso isolado para a rede (modo URL), cache imutável
 * content-addressed com lock, hash de integridade e nenhuma credencial vazando
 * para o coletor.
 *
 *   - URL       → spawna `url-worker.mjs` (SSRF fail-closed, 1 MB, texto/CSS
 *     sanitizados). O adapter normaliza os tokens crus de cor via `contracts`.
 *   - Moodboard → valida/decodifica localmente (sem rede) via `moodboard-summary`.
 *
 * O snapshot público nunca contém bytes, caminho absoluto nem PII.
 */
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertBrandDesignSnapshotIntegrity,
  BRAND_DESIGN_ADAPTER_VERSION,
  BRAND_DESIGN_SKILL_ID,
  BRAND_DESIGN_SNAPSHOT_SCHEMA_VERSION,
  brandDesignMoodboardFingerprint,
  brandDesignRequestSchema,
  brandDesignSnapshotHash,
  brandDesignUrlFingerprint,
  buildBrandDesignGuard,
  normalizeHexColor,
  type BrandDesignCollectionResult,
  type BrandDesignMoodboardRequest,
  type BrandDesignRequest,
  type BrandDesignSnapshot,
  type BrandDesignSnapshotCore,
  type BrandDesignUrlRequest,
  type BrandDesignUrlSummaryCore,
  type MoodboardImageSummary,
} from './contracts.js'
import {
  mergePalettes,
  resolveImageBytes,
  summarizeImageBytes,
} from './moodboard-summary.js'

export { buildBrandDesignGuard }

/** Resumo cru devolvido pelo `url-worker.mjs` (antes da normalização de cor). */
export interface UrlWorkerRawSummary {
  finalUrl: string
  title: string | null
  byteSize: number
  truncated: boolean
  redirectCount: number
  textSample: string
  cssSample: string
  rawColors: string[]
  rawFontFamilies: string[]
}

export type UrlWorkerExecutor = (input: {
  request: { action: 'fetch'; url: string; maxBytes: number }
  signal?: AbortSignal
  env: NodeJS.ProcessEnv
}) => Promise<UrlWorkerRawSummary>

export interface BrandDesignAdapter {
  collect(input: {
    projectId: string
    request: unknown
    signal?: AbortSignal
    onLog?: (line: { level: 'info' | 'warn' | 'error'; message: string }) => void
  }): Promise<BrandDesignCollectionResult>
}

const WORKER_ENV_ALLOWLIST = ['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'LANG', 'LANGUAGE', 'TZ'] as const

/** Env mínimo para o subprocesso da URL — nunca repassa segredos. */
export function sanitizeWorkerEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const allowed = new Set<string>(WORKER_ENV_ALLOWLIST)
  return Object.fromEntries(Object.entries(env).filter(([key, value]) => allowed.has(key) && value !== undefined))
}

function defaultUrlExecutor(workerPath: string): UrlWorkerExecutor {
  return ({ request, signal, env }) =>
    new Promise((resolvePromise, reject) => {
      if (signal?.aborted) return reject(new Error('Coleta de marca cancelada.'))
      const child = spawn(process.execPath, [workerPath], { env, stdio: ['pipe', 'pipe', 'pipe'] })
      let stdout = ''
      let stderr = ''
      const timer = setTimeout(() => child.kill('SIGKILL'), 90_000)
      const onAbort = () => child.kill('SIGTERM')
      signal?.addEventListener('abort', onAbort, { once: true })
      child.stdout.on('data', (chunk: Buffer) => {
        if (stdout.length < 4_000_000) stdout += chunk.toString()
      })
      child.stderr.on('data', (chunk: Buffer) => {
        if (stderr.length < 64_000) stderr += chunk.toString()
      })
      child.on('error', reject)
      child.on('close', (code) => {
        clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
        if (signal?.aborted) return reject(new Error('Coleta de marca cancelada.'))
        if (code !== 0) return reject(new Error(`Subprocesso de marca falhou (exit ${code}): ${stderr || 'sem detalhes'}`))
        let payload: { ok: boolean; summary?: UrlWorkerRawSummary; error?: string }
        try {
          payload = JSON.parse(stdout)
        } catch {
          return reject(new Error('Subprocesso de marca devolveu JSON inválido.'))
        }
        if (!payload.ok || !payload.summary) return reject(new Error(payload.error || 'Falha ao coletar a URL de referência.'))
        resolvePromise(payload.summary)
      })
      child.stdin.end(JSON.stringify(request))
    })
}

function dedupeCaseInsensitive(values: string[], cap: number): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (!value || seen.has(key)) continue
    seen.add(key)
    out.push(value)
    if (out.length >= cap) break
  }
  return out
}

function projectCacheKey(projectId: string): string {
  return createHash('sha256').update(projectId).digest('hex')
}

/** Converte o resumo cru do worker no core normalizado do snapshot de URL. */
function normalizeUrlSummary(raw: UrlWorkerRawSummary): BrandDesignUrlSummaryCore {
  const colors = dedupeCaseInsensitive(
    raw.rawColors.map((token) => normalizeHexColor(token)).filter((hex): hex is string => hex !== null),
    24,
  )
  return {
    finalUrl: raw.finalUrl,
    title: raw.title,
    byteSize: raw.byteSize,
    truncated: raw.truncated,
    redirectCount: raw.redirectCount,
    textSample: raw.textSample,
    cssSample: raw.cssSample,
    colors,
    fontFamilies: dedupeCaseInsensitive(raw.rawFontFamilies, 12),
  }
}

async function waitForCache(path: string, signal?: AbortSignal): Promise<BrandDesignSnapshot | null> {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (signal?.aborted) throw new Error('Coleta de marca cancelada.')
    try {
      const snapshot = JSON.parse(await readFile(path, 'utf8')) as BrandDesignSnapshot
      assertBrandDesignSnapshotIntegrity(snapshot)
      return snapshot
    } catch (error) {
      if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('hash divergente'))) throw error
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
  }
  return null
}

export class CachedBrandDesignAdapter implements BrandDesignAdapter {
  private readonly runtimeRoot: string
  private readonly executeUrlCollector: UrlWorkerExecutor
  private readonly env: NodeJS.ProcessEnv
  private readonly now: () => Date

  constructor(options: {
    runtimeRoot: string
    env?: NodeJS.ProcessEnv
    workerPath?: string
    executeUrlCollector?: UrlWorkerExecutor
    now?: () => Date
  }) {
    this.runtimeRoot = options.runtimeRoot
    this.env = options.env ?? process.env
    this.now = options.now ?? (() => new Date())
    const defaultWorkerPath = fileURLToPath(new URL('./url-worker.mjs', import.meta.url))
    this.executeUrlCollector = options.executeUrlCollector ?? defaultUrlExecutor(options.workerPath ?? defaultWorkerPath)
  }

  async collect(input: Parameters<BrandDesignAdapter['collect']>[0]): Promise<BrandDesignCollectionResult> {
    const request = brandDesignRequestSchema.parse(input.request)
    const fingerprint =
      request.mode === 'url'
        ? brandDesignUrlFingerprint({ projectId: input.projectId, url: request.url, maxBytes: request.maxBytes })
        : brandDesignMoodboardFingerprint({
            projectId: input.projectId,
            imageHashes: await this.hashMoodboardImages(request),
          })
    const snapshotPath = resolve(this.runtimeRoot, projectCacheKey(input.projectId), `${fingerprint}.json`)
    await mkdir(dirname(snapshotPath), { recursive: true })

    const cached = await this.readCache(snapshotPath)
    if (cached) {
      input.onLog?.({ level: 'info', message: `Snapshot de marca reutilizado (${fingerprint.slice(0, 12)}).` })
      return { snapshot: cached, cacheHit: true, snapshotPath }
    }

    const lockPath = `${snapshotPath}.lock`
    try {
      await mkdir(lockPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      const snapshot = await waitForCache(snapshotPath, input.signal)
      if (!snapshot) throw new Error('Outra coleta de marca idêntica não concluiu dentro do limite.')
      input.onLog?.({ level: 'info', message: `Snapshot de marca compartilhado (${fingerprint.slice(0, 12)}).` })
      return { snapshot, cacheHit: true, snapshotPath }
    }

    try {
      const core =
        request.mode === 'url'
          ? await this.buildUrlCore(request, input, fingerprint)
          : await this.buildMoodboardCore(request, input, fingerprint)
      const snapshot: BrandDesignSnapshot = { ...core, contentHash: brandDesignSnapshotHash(core) }
      const temporaryPath = `${snapshotPath}.${process.pid}.tmp`
      await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
      await rename(temporaryPath, snapshotPath)
      input.onLog?.({
        level: snapshot.warnings.length ? 'warn' : 'info',
        message: `Snapshot de marca congelado (${fingerprint.slice(0, 12)}, modo ${snapshot.mode}).`,
      })
      return { snapshot, cacheHit: false, snapshotPath }
    } finally {
      await rm(lockPath, { recursive: true, force: true })
    }
  }

  private async readCache(snapshotPath: string): Promise<BrandDesignSnapshot | null> {
    try {
      const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8')) as BrandDesignSnapshot
      assertBrandDesignSnapshotIntegrity(snapshot)
      return snapshot
    } catch (error) {
      if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('hash divergente'))) throw error
      return null
    }
  }

  private async hashMoodboardImages(request: BrandDesignMoodboardRequest): Promise<string[]> {
    const hashes: string[] = []
    for (const image of request.images) {
      const bytes = await resolveImageBytes(image, {
        confinementRoot: request.confinementRoot,
        maxBytes: request.maxImageBytes,
      })
      hashes.push(createHash('sha256').update(bytes).digest('hex'))
    }
    return hashes
  }

  private async buildUrlCore(
    request: BrandDesignUrlRequest,
    input: Parameters<BrandDesignAdapter['collect']>[0],
    fingerprint: string,
  ): Promise<BrandDesignSnapshotCore> {
    input.onLog?.({ level: 'info', message: 'Extraindo identidade de URL pública em subprocesso isolado.' })
    const raw = await this.executeUrlCollector({
      request: { action: 'fetch', url: request.url, maxBytes: request.maxBytes },
      signal: input.signal,
      env: sanitizeWorkerEnv(this.env),
    })
    const url = normalizeUrlSummary(raw)
    const warnings: string[] = []
    if (url.truncated) warnings.push('Página de referência truncada no teto de 1 MB.')
    if (url.colors.length === 0) warnings.push('Nenhuma cor heurística extraída do CSS da referência.')
    return this.frozenCore('url', input.projectId, fingerprint, { url, moodboard: null, warnings })
  }

  private async buildMoodboardCore(
    request: BrandDesignMoodboardRequest,
    input: Parameters<BrandDesignAdapter['collect']>[0],
    fingerprint: string,
  ): Promise<BrandDesignSnapshotCore> {
    input.onLog?.({ level: 'info', message: `Validando ${request.images.length} imagem(ns) do moodboard localmente.` })
    const images: MoodboardImageSummary[] = []
    for (let index = 0; index < request.images.length; index += 1) {
      if (input.signal?.aborted) throw new Error('Coleta de marca cancelada.')
      const image = request.images[index]!
      const bytes = await resolveImageBytes(image, {
        confinementRoot: request.confinementRoot,
        maxBytes: request.maxImageBytes,
      })
      images.push(
        summarizeImageBytes({ bytes, ordinal: index + 1, origin: image.kind, maxBytes: request.maxImageBytes }),
      )
    }
    const decoded = images.filter((image) => image.paletteStatus === 'decoded')
    const aggregatePalette = mergePalettes(decoded.map((image) => image.palette))
    const warnings: string[] = []
    if (decoded.length === 0) {
      warnings.push('Nenhuma imagem foi decodificada localmente; paleta dominante não disponível sem decoder.')
    }
    return this.frozenCore('moodboard', input.projectId, fingerprint, {
      url: null,
      moodboard: {
        imageCount: images.length,
        decodedImageCount: decoded.length,
        images,
        aggregatePalette,
      },
      warnings,
    })
  }

  private frozenCore(
    mode: BrandDesignRequest['mode'],
    projectId: string,
    fingerprint: string,
    parts: Pick<BrandDesignSnapshotCore, 'url' | 'moodboard' | 'warnings'>,
  ): BrandDesignSnapshotCore {
    const timestamp = this.now().toISOString()
    return {
      schemaVersion: BRAND_DESIGN_SNAPSHOT_SCHEMA_VERSION,
      adapterVersion: BRAND_DESIGN_ADAPTER_VERSION,
      skillId: BRAND_DESIGN_SKILL_ID,
      mode,
      projectId,
      fingerprint,
      collectedAt: timestamp,
      frozenAt: timestamp,
      ...parts,
    }
  }
}

export function createBrandDesignAdapterFromEnv(env: NodeJS.ProcessEnv = process.env): BrandDesignAdapter {
  return new CachedBrandDesignAdapter({
    runtimeRoot:
      env.MARKETING_STUDIO_BRAND_DESIGN_ROOT ?? resolve(env.TMPDIR ?? '/tmp', 'marketing-studio-brand-design'),
    env,
  })
}
