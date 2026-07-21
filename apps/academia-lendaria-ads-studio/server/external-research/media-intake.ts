/**
 * Intake local seguro de áudio/vídeo para as skills de conteúdo/criativo de funil
 * (`conteudo-funil`, `criativos-funil`).
 *
 * Aceita DUAS origens e nada além disso:
 *   - `url`  → uma URL HTTPS **pública**. Bloqueia SSRF (esquema, userinfo, host
 *     privado, resolução DNS para faixa privada) e revalida CADA salto de
 *     redirect manualmente. Baixa o corpo em streaming para o runtime local,
 *     com teto de bytes aplicado durante o download (não só via `content-length`).
 *   - `file` → um arquivo **confinado** fornecido pelo caller. O caminho real
 *     (com symlinks resolvidos) precisa ficar dentro de `confinementRoot`, o que
 *     impede path traversal e escape por symlink para fora da área do caller.
 *
 * Sempre valida mime contra uma allowlist de áudio/vídeo, calcula `sha256` e
 * `byteSize` por streaming e devolve um MANIFESTO PÚBLICO sanitizado: sem query
 * sensível, sem userinfo, sem caminho absoluto. O caminho absoluto no runtime é
 * devolvido à parte (`localPath`), estritamente para uso interno (alimentar a
 * transcrição) — nunca deve ser persistido nem exposto. Veja `transcription.ts`.
 */
import { createHash, randomBytes } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { constants as fsConstants } from 'node:fs'
import { mkdir, open, realpath, rename, rm } from 'node:fs/promises'
import { isIP } from 'node:net'
import { basename, extname, resolve, sep } from 'node:path'

export type MediaKind = 'audio' | 'video'
export type MediaOrigin = 'url' | 'file'

/** Teto padrão de tamanho da mídia (512 MiB) — vídeo bruto de criativo cabe aqui. */
export const DEFAULT_MEDIA_MAX_BYTES = 512 * 1024 * 1024

/** Máximo de saltos de redirect seguidos (cada um é revalidado como URL pública). */
export const DEFAULT_MEDIA_MAX_REDIRECTS = 3

/** Timeout padrão para a conexão HTTP inicial de cada salto (ms). */
export const DEFAULT_MEDIA_REQUEST_TIMEOUT_MS = 60_000

/**
 * Allowlist de mime types de áudio/vídeo aceitos. Estrita de propósito: um
 * `application/octet-stream` genérico é rejeitado — a mídia precisa se declarar.
 */
export const DEFAULT_ALLOWED_MEDIA_MIME_TYPES = [
  // Áudio
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/opus',
  'audio/flac',
  // Vídeo
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/mpeg',
  'video/x-msvideo',
  'video/x-ms-wmv',
] as const

const EXTENSION_MIME_MAP: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/opus',
  '.flac': 'audio/flac',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
  '.avi': 'video/x-msvideo',
  '.wmv': 'video/x-ms-wmv',
}

export class MediaIntakeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MediaIntakeError'
  }
}

/** Violação de segurança (SSRF/DNS/redirect/confinamento). */
export class MediaIntakeSecurityError extends MediaIntakeError {
  constructor(message: string) {
    super(message)
    this.name = 'MediaIntakeSecurityError'
  }
}

/** Mídia excede o teto de bytes configurado. */
export class MediaIntakeLimitError extends MediaIntakeError {
  constructor(message: string) {
    super(message)
    this.name = 'MediaIntakeLimitError'
  }
}

/** Mime ausente ou fora da allowlist de áudio/vídeo. */
export class MediaIntakeMimeError extends MediaIntakeError {
  constructor(message: string) {
    super(message)
    this.name = 'MediaIntakeMimeError'
  }
}

/** Intake cancelado via `AbortSignal`. */
export class MediaIntakeCancelledError extends MediaIntakeError {
  constructor(message = 'Intake de mídia cancelado.') {
    super(message)
    this.name = 'MediaIntakeCancelledError'
  }
}

/**
 * Manifesto PÚBLICO e sanitizado da mídia. Seguro para persistir/expor:
 *   - `sourceLabel` nunca contém query, userinfo ou caminho absoluto.
 *   - Não há caminho de runtime aqui (ver `MediaIntakeResult.localPath`).
 */
export interface MediaIntakeManifest {
  mediaId: string
  origin: MediaOrigin
  /** URL sem query/userinfo/fragment, ou apenas o nome-base do arquivo. */
  sourceLabel: string
  mimeType: string
  mediaKind: MediaKind
  byteSize: number
  sha256: string
  fetchedAt: string
}

export interface MediaIntakeResult {
  manifest: MediaIntakeManifest
  /**
   * Caminho absoluto da mídia no runtime local. USO INTERNO — alimentar a
   * transcrição e descartar. Nunca persista nem inclua em artefato público.
   */
  localPath: string
}

export type MediaIntakeInput =
  | { origin: 'url'; url: string }
  | { origin: 'file'; path: string; confinementRoot: string; declaredMimeType?: string }

export type MediaDnsLookup = (hostname: string) => Promise<Array<{ address: string; family: number }>>

export interface MediaIntakeOptions {
  /** Diretório onde a mídia baixada é materializada (content-addressed por sha256). */
  runtimeRoot: string
  maxBytes?: number
  maxRedirects?: number
  requestTimeoutMs?: number
  allowedMimeTypes?: readonly string[]
  fetchImpl?: typeof fetch
  dnsLookup?: MediaDnsLookup
  signal?: AbortSignal
  now?: () => Date
}

const defaultDnsLookup: MediaDnsLookup = (hostname) => lookup(hostname, { all: true, verbatim: true })

/**
 * `true` para hosts que não devem ser alcançáveis externamente: loopback,
 * link-local, faixas RFC1918/CGNAT e sufixos internos. Aceita tanto hostname
 * textual quanto IP literal (v4/v6).
 */
export function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '')
  if (!normalized) return true
  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal')
  ) {
    return true
  }
  if (isIP(normalized) === 4) {
    const octets = normalized.split('.').map(Number)
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true
    const [a, b] = octets
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64.0.0/10
      (a === 169 && b === 254) || // link-local
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224 // multicast/reservado
    )
  }
  if (isIP(normalized) === 6) {
    return (
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:') ||
      normalized.startsWith('::ffff:') // IPv4-mapeado: seria revalidado, mas barramos por precaução
    )
  }
  // Não é IP literal e não bate nenhum sufixo interno conhecido → tratado como público
  // (a resolução DNS subsequente ainda barra se apontar para faixa privada).
  return false
}

/**
 * Devolve o rótulo público da URL: `protocolo//host/caminho`, descartando
 * userinfo, query e fragment — onde tipicamente moram tokens/assinaturas.
 */
export function sanitizeUrlForManifest(raw: string | URL): string {
  const url = raw instanceof URL ? raw : new URL(raw)
  return `${url.protocol}//${url.host}${url.pathname}`
}

/**
 * Garante que `raw` é uma URL HTTPS pública e devolve o objeto `URL`. Bloqueia:
 * esquema não-HTTPS, credenciais embutidas, host privado e — o ponto central
 * anti-SSRF — resolução DNS para qualquer endereço de faixa privada.
 */
export async function assertPublicHttpsUrl(raw: string | URL, dnsLookup: MediaDnsLookup = defaultDnsLookup): Promise<URL> {
  let url: URL
  try {
    url = raw instanceof URL ? raw : new URL(raw)
  } catch {
    throw new MediaIntakeSecurityError('URL de mídia inválida.')
  }
  if (url.protocol !== 'https:') throw new MediaIntakeSecurityError('Somente URLs HTTPS públicas são aceitas.')
  if (url.username || url.password) throw new MediaIntakeSecurityError('URL com credenciais embutidas não é aceita.')
  if (isPrivateHostname(url.hostname)) throw new MediaIntakeSecurityError('URL aponta para host privado ou interno.')

  let addresses: Array<{ address: string; family: number }>
  try {
    addresses = await dnsLookup(url.hostname)
  } catch {
    throw new MediaIntakeSecurityError('Não foi possível resolver o host da URL de mídia.')
  }
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateHostname(address))) {
    throw new MediaIntakeSecurityError('URL resolveu para uma rede privada ou inválida.')
  }
  return url
}

function normalizeMime(raw: string): string {
  return raw.split(';')[0]?.trim().toLowerCase() ?? ''
}

function inferMimeFromExtension(path: string): string {
  return EXTENSION_MIME_MAP[extname(path).toLowerCase()] ?? ''
}

function resolveMediaKind(mime: string, allowed: readonly string[]): MediaKind {
  if (!mime) throw new MediaIntakeMimeError('Mime da mídia ausente; não é possível validar.')
  if (!allowed.includes(mime)) throw new MediaIntakeMimeError(`Mime não permitido para mídia de funil: ${mime}.`)
  return mime.startsWith('audio/') ? 'audio' : 'video'
}

function isWithinRoot(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(root.endsWith(sep) ? root : `${root}${sep}`)
}

function mediaIdFrom(sha256: string): string {
  return `media_${sha256.slice(0, 16)}`
}

/** Itera um corpo de resposta web ou um `Readable` do node de forma uniforme. */
async function* iterateChunks(source: AsyncIterable<Uint8Array> | null): AsyncGenerator<Uint8Array> {
  if (!source) return
  for await (const chunk of source) yield chunk
}

function combineSignals(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

async function streamToRuntime(
  body: AsyncIterable<Uint8Array> | null,
  options: { runtimeRoot: string; maxBytes: number; signal?: AbortSignal },
): Promise<{ sha256: string; byteSize: number; localPath: string }> {
  if (!body) throw new MediaIntakeError('Resposta de mídia sem corpo para download.')
  await mkdir(options.runtimeRoot, { recursive: true })
  const tempPath = resolve(options.runtimeRoot, `.intake-${randomBytes(8).toString('hex')}.part`)
  const hash = createHash('sha256')
  let byteSize = 0
  const handle = await open(tempPath, 'wx')
  try {
    for await (const chunk of iterateChunks(body)) {
      if (options.signal?.aborted) throw new MediaIntakeCancelledError()
      byteSize += chunk.length
      if (byteSize > options.maxBytes) {
        throw new MediaIntakeLimitError(`Mídia excede o teto de ${options.maxBytes} bytes durante o download.`)
      }
      hash.update(chunk)
      await handle.write(chunk)
    }
    await handle.close()
  } catch (error) {
    await handle.close().catch(() => {})
    await rm(tempPath, { force: true })
    throw error
  }
  const sha256 = hash.digest('hex')
  const finalPath = resolve(options.runtimeRoot, sha256)
  await rename(tempPath, finalPath)
  return { sha256, byteSize, localPath: finalPath }
}

async function intakeFromUrl(input: { url: string }, options: Required<MediaIntakeOptions>): Promise<MediaIntakeResult> {
  let current = await assertPublicHttpsUrl(input.url, options.dnsLookup)
  for (let hop = 0; hop <= options.maxRedirects; hop += 1) {
    if (options.signal?.aborted) throw new MediaIntakeCancelledError()
    const response = await options.fetchImpl(current, {
      method: 'GET',
      redirect: 'manual',
      signal: combineSignals(options.signal, options.requestTimeoutMs),
      headers: { accept: 'audio/*,video/*,application/octet-stream' },
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new MediaIntakeSecurityError('Redirect de mídia sem cabeçalho Location.')
      // Revalida CADA salto: um redirect para http:// ou rede privada é barrado aqui.
      current = await assertPublicHttpsUrl(new URL(location, current), options.dnsLookup)
      continue
    }
    if (!response.ok) throw new MediaIntakeError(`HTTP ${response.status} ao baixar a mídia pública.`)

    const mime = normalizeMime(response.headers.get('content-type') ?? '')
    const mediaKind = resolveMediaKind(mime, options.allowedMimeTypes)

    const declaredLength = Number(response.headers.get('content-length') ?? '')
    if (Number.isFinite(declaredLength) && declaredLength > options.maxBytes) {
      throw new MediaIntakeLimitError(`Mídia anuncia ${declaredLength} bytes, acima do teto de ${options.maxBytes}.`)
    }

    const { sha256, byteSize, localPath } = await streamToRuntime(response.body as AsyncIterable<Uint8Array> | null, {
      runtimeRoot: options.runtimeRoot,
      maxBytes: options.maxBytes,
      signal: options.signal,
    })

    return {
      manifest: {
        mediaId: mediaIdFrom(sha256),
        origin: 'url',
        sourceLabel: sanitizeUrlForManifest(current),
        mimeType: mime,
        mediaKind,
        byteSize,
        sha256,
        fetchedAt: options.now().toISOString(),
      },
      localPath,
    }
  }
  throw new MediaIntakeSecurityError('Mídia excedeu o limite de redirecionamentos.')
}

async function intakeFromFile(
  input: { path: string; confinementRoot: string; declaredMimeType?: string },
  options: Required<MediaIntakeOptions>,
): Promise<MediaIntakeResult> {
  let rootReal: string
  try {
    rootReal = await realpath(input.confinementRoot)
  } catch {
    throw new MediaIntakeSecurityError('Diretório confinado do caller inacessível.')
  }
  let fileReal: string
  try {
    fileReal = await realpath(input.path)
  } catch {
    throw new MediaIntakeSecurityError('Arquivo de mídia inexistente ou inacessível.')
  }
  // realpath resolve symlinks: um symlink apontando para fora do root é barrado.
  if (!isWithinRoot(rootReal, fileReal)) {
    throw new MediaIntakeSecurityError('Arquivo fora do diretório confinado do caller.')
  }
  const mime = normalizeMime(input.declaredMimeType ?? inferMimeFromExtension(fileReal))
  const mediaKind = resolveMediaKind(mime, options.allowedMimeTypes)
  const noFollow = (fsConstants as unknown as Record<string, number | undefined>).O_NOFOLLOW
  if (typeof noFollow !== 'number') {
    throw new MediaIntakeSecurityError('O runtime não suporta abertura segura de arquivos locais.')
  }
  let handle
  try {
    handle = await open(fileReal, fsConstants.O_RDONLY | noFollow)
  } catch {
    throw new MediaIntakeSecurityError('Arquivo de mídia mudou durante a validação ou não pode ser aberto com segurança.')
  }
  let copied: { sha256: string; byteSize: number; localPath: string }
  try {
    const info = await handle.stat()
    if (!info.isFile()) throw new MediaIntakeSecurityError('Origem confinada não é um arquivo regular.')
    if (info.size > options.maxBytes) {
      throw new MediaIntakeLimitError(`Mídia tem ${info.size} bytes, acima do teto de ${options.maxBytes}.`)
    }
    copied = await streamToRuntime(handle.createReadStream({ autoClose: false }), {
      runtimeRoot: options.runtimeRoot,
      maxBytes: options.maxBytes,
      signal: options.signal,
    })
  } finally {
    await handle.close().catch(() => {})
  }

  return {
    manifest: {
      mediaId: mediaIdFrom(copied.sha256),
      origin: 'file',
      sourceLabel: basename(fileReal),
      mimeType: mime,
      mediaKind,
      byteSize: copied.byteSize,
      sha256: copied.sha256,
      fetchedAt: options.now().toISOString(),
    },
    localPath: copied.localPath,
  }
}

/**
 * Ponto de entrada único. Materializa a mídia (URL pública ou arquivo confinado)
 * no runtime local e devolve `{ manifest, localPath }`. `manifest` é público e
 * sanitizado; `localPath` é interno e nunca deve ser exposto.
 */
export async function intakeMedia(input: MediaIntakeInput, options: MediaIntakeOptions): Promise<MediaIntakeResult> {
  if (options.signal?.aborted) throw new MediaIntakeCancelledError()
  const resolved: Required<MediaIntakeOptions> = {
    runtimeRoot: options.runtimeRoot,
    maxBytes: options.maxBytes ?? DEFAULT_MEDIA_MAX_BYTES,
    maxRedirects: options.maxRedirects ?? DEFAULT_MEDIA_MAX_REDIRECTS,
    requestTimeoutMs: options.requestTimeoutMs ?? DEFAULT_MEDIA_REQUEST_TIMEOUT_MS,
    allowedMimeTypes: options.allowedMimeTypes ?? DEFAULT_ALLOWED_MEDIA_MIME_TYPES,
    fetchImpl: options.fetchImpl ?? fetch,
    dnsLookup: options.dnsLookup ?? defaultDnsLookup,
    signal: options.signal as AbortSignal,
    now: options.now ?? (() => new Date()),
  }
  if (input.origin === 'url') return intakeFromUrl({ url: input.url }, resolved)
  return intakeFromFile(input, resolved)
}
