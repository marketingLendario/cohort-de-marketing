/**
 * Transcrição LOCAL de mídia de funil, sem nunca inventar texto.
 *
 * O motor é um executável local injetável (OpenAI Whisper, `whisper-cli` do
 * whisper.cpp ou `mlx-whisper`), rodado como subprocesso com timeout e cancelamento
 * (SIGTERM → SIGKILL escalonado). O contrato é honesto:
 *   - motor rodou e devolveu texto        → status `transcribed`
 *   - motor ausente/falho + transcript colado pelo operador → status `pasted`
 *     (a falha literal é registrada no manifesto — não é escondida)
 *   - motor ausente/falho + nada colado    → status `failed`, `transcript: null`
 *   - cancelamento explícito                → lança `TranscriptionCancelledError`
 *
 * Em NENHUM caminho o texto é fabricado: `transcript` só vem do motor real ou
 * do material colado pelo operador. Mensagens de falha são redigidas antes de
 * entrar no manifesto (sem caminho absoluto, sem segredo).
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { access, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'

export type TranscriptionEngine = 'whisper-cli' | 'mlx-whisper' | 'openai-whisper'
export type TranscriptionStatus = 'transcribed' | 'pasted' | 'failed'

/** Timeout padrão do motor de transcrição (20 min) — áudio longo é comum. */
export const DEFAULT_TRANSCRIPTION_TIMEOUT_MS = 20 * 60 * 1000

/** Janela entre SIGTERM e SIGKILL no kill escalonado (ms). */
export const DEFAULT_TRANSCRIPTION_KILL_GRACE_MS = 5_000

/** Teto de caracteres do transcript materializado no manifesto. */
export const DEFAULT_TRANSCRIPT_MAX_CHARS = 1_000_000

const STREAM_CAP_BYTES = 4 * 1024 * 1024
const TRANSCRIPTION_ENV_ALLOWLIST = [
  'PATH',
  'HOME',
  'TMPDIR',
  'TMP',
  'TEMP',
  'LANG',
  'LC_ALL',
  'XDG_CACHE_HOME',
] as const

/** Nomes de binário procurados no PATH para cada motor, na ordem de preferência. */
export const TRANSCRIPTION_ENGINE_CANDIDATES: Record<TranscriptionEngine, readonly string[]> = {
  'whisper-cli': ['whisper-cli', 'whisper.cpp', 'main'],
  'mlx-whisper': ['mlx_whisper', 'mlx-whisper'],
  'openai-whisper': ['whisper'],
}

const TRANSCRIPTION_ENGINE_ORDER: readonly TranscriptionEngine[] = [
  'openai-whisper',
  'mlx-whisper',
  'whisper-cli',
]

/** Cancelamento explícito: propaga como erro, não vira fallback silencioso. */
export class TranscriptionCancelledError extends Error {
  constructor(message = 'Transcrição cancelada.') {
    super(message)
    this.name = 'TranscriptionCancelledError'
  }
}

/** Executável do motor não encontrado/executável — dispara o fallback honesto. */
export class EngineUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineUnavailableError'
  }
}

export interface TranscriptionManifest {
  status: TranscriptionStatus
  engine: TranscriptionEngine | 'operator-paste' | null
  language: string | null
  /** Texto real do motor ou colado pelo operador; `null` quando não há nenhum. */
  transcript: string | null
  charCount: number
  /** Liga o transcript à mídia (`MediaIntakeManifest.sha256`). */
  mediaSha256: string
  /** Motivo literal e redigido da falha do motor; `null` quando transcreveu. */
  failure: string | null
  producedAt: string
}

/** Assinatura do executor do motor — injetável para teste. */
export type TranscriptionEngineRunner = (input: {
  mediaPath: string
  engine: TranscriptionEngine
  executablePath?: string
  language: string | null
  timeoutMs: number
  signal?: AbortSignal
}) => Promise<{ transcript: string; language: string | null }>

export interface TranscribeMediaInput {
  mediaPath: string
  mediaSha256: string
  engine?: TranscriptionEngine
  executablePath?: string
  language?: string
  /** Transcript colado pelo operador — usado só se o motor não entregar texto. */
  pastedTranscript?: string
  timeoutMs?: number
  signal?: AbortSignal
  runEngine?: TranscriptionEngineRunner
  now?: () => Date
}

/**
 * Redige a mensagem de falha antes de expô-la no manifesto: remove o caminho
 * da mídia, caminhos absolutos de home e tokens comuns.
 */
export function redactTranscriptionFailure(message: string, options: { mediaPath?: string } = {}): string {
  let clean = message
  if (options.mediaPath) clean = clean.split(options.mediaPath).join('[mídia]')
  clean = clean
    .replace(/\/Users\/[^/\s]+\/[^\s'"]*/g, '[caminho]')
    .replace(/\/home\/[^/\s]+\/[^\s'"]*/g, '[caminho]')
    .replace(/[A-Za-z]:\\Users\\[^\\\s]+\\[^\s'"]*/g, '[caminho]')
    .replace(/(?:sk-|apify_api_|ghp_|EAAG)[A-Za-z0-9_-]{8,}/g, '[redacted]')
    // Redige `chave=valor`/`chave: valor` sensível mesmo fora de uma query string.
    .replace(/\b((?:access_token|api[_-]?key|apikey|token|secret|password|passwd|pwd)\s*[=:]\s*)['"]?[^\s'"&]+/gi, '$1[redacted]')
  return clean.trim().slice(0, 1_000)
}

function capTranscript(raw: string): string {
  return raw.trim().slice(0, DEFAULT_TRANSCRIPT_MAX_CHARS)
}

async function isExecutableFile(candidate: string): Promise<boolean> {
  try {
    await access(candidate, fsConstants.X_OK)
    return true
  } catch {
    return false
  }
}

/** Resolve o executável do motor: caminho explícito ou varredura do PATH. */
async function defaultResolveExecutable(engine: TranscriptionEngine, executablePath?: string): Promise<string> {
  if (executablePath) {
    if (await isExecutableFile(executablePath)) return executablePath
    throw new EngineUnavailableError(`Executável de transcrição informado não é executável: ${executablePath}.`)
  }
  const pathDirs = (process.env.PATH ?? '').split(delimiter).filter(Boolean)
  for (const candidate of TRANSCRIPTION_ENGINE_CANDIDATES[engine]) {
    for (const dir of pathDirs) {
      const full = join(dir, candidate)
      if (await isExecutableFile(full)) return full
    }
  }
  throw new EngineUnavailableError(`Executável de transcrição ausente no PATH para o motor ${engine}.`)
}

function buildEngineArgs(engine: TranscriptionEngine, mediaPath: string, outDir: string, language: string | null): string[] {
  if (engine === 'whisper-cli') {
    return ['-f', mediaPath, '-otxt', '-of', join(outDir, 'transcript'), ...(language ? ['-l', language] : [])]
  }
  if (engine === 'openai-whisper') {
    return [
      mediaPath,
      '--output_dir', outDir,
      '--output_format', 'txt',
      '--model', 'base',
      '--device', 'cpu',
      '--fp16', 'False',
      '--verbose', 'False',
      ...(language ? ['--language', language] : []),
    ]
  }
  return [mediaPath, '--output-dir', outDir, '--output-format', 'txt', ...(language ? ['--language', language] : [])]
}

async function resolveAvailableTranscriptionEngine(): Promise<{ engine: TranscriptionEngine; executablePath: string }> {
  for (const engine of TRANSCRIPTION_ENGINE_ORDER) {
    try {
      return { engine, executablePath: await defaultResolveExecutable(engine) }
    } catch (error) {
      if (!(error instanceof EngineUnavailableError)) throw error
    }
  }
  throw new EngineUnavailableError('Nenhum motor local de transcrição compatível foi encontrado no PATH.')
}

async function readTranscriptFromDir(outDir: string): Promise<string> {
  const entries = await readdir(outDir)
  const txt = entries.find((entry) => entry.toLowerCase().endsWith('.txt'))
  if (!txt) throw new Error('Motor de transcrição não gerou arquivo de saída .txt.')
  return readFile(resolve(outDir, txt), 'utf8')
}

export interface LocalWhisperRunnerDeps {
  spawnImpl?: typeof spawn
  resolveExecutable?: (engine: TranscriptionEngine, executablePath?: string) => Promise<string>
  readOutput?: (outDir: string) => Promise<string>
  createOutDir?: () => Promise<string>
  removeOutDir?: (outDir: string) => Promise<void>
  killGraceMs?: number
}

/**
 * Constrói o executor real baseado em subprocesso. Aplica timeout e
 * cancelamento com kill escalonado (SIGTERM, depois SIGKILL após a janela de
 * graça). Todas as dependências são injetáveis para teste determinístico.
 */
export function createLocalWhisperRunner(deps: LocalWhisperRunnerDeps = {}): TranscriptionEngineRunner {
  const spawnImpl = deps.spawnImpl ?? spawn
  const resolveExecutable = deps.resolveExecutable ?? defaultResolveExecutable
  const readOutput = deps.readOutput ?? readTranscriptFromDir
  const createOutDir = deps.createOutDir ?? (() => mkdtemp(join(tmpdir(), 'whisper-out-')))
  const removeOutDir = deps.removeOutDir ?? ((outDir: string) => rm(outDir, { recursive: true, force: true }))
  const killGraceMs = deps.killGraceMs ?? DEFAULT_TRANSCRIPTION_KILL_GRACE_MS

  return async ({ mediaPath, engine, executablePath, language, timeoutMs, signal }) => {
    const exe = await resolveExecutable(engine, executablePath)
    const outDir = await createOutDir()
    if (signal?.aborted) {
      await removeOutDir(outDir)
      throw new TranscriptionCancelledError()
    }

    return new Promise((resolvePromise, reject) => {
      let child: ChildProcess
      try {
        const childEnv = Object.fromEntries(
          TRANSCRIPTION_ENV_ALLOWLIST.flatMap((key) => process.env[key] ? [[key, process.env[key]]] : []),
        )
        child = spawnImpl(exe, buildEngineArgs(engine, mediaPath, outDir, language), {
          stdio: ['ignore', 'pipe', 'pipe'],
          env: childEnv,
        }) as ChildProcess
      } catch (error) {
        void removeOutDir(outDir).then(() => reject(error), () => reject(error))
        return
      }
      let stdout = ''
      let stderr = ''
      let outcome: 'timeout' | 'cancel' | null = null
      let graceTimer: NodeJS.Timeout | undefined
      let settled = false

      const escalateKill = () => {
        child.kill('SIGTERM')
        graceTimer = setTimeout(() => child.kill('SIGKILL'), killGraceMs)
      }
      const killTimer = setTimeout(() => {
        outcome = 'timeout'
        escalateKill()
      }, timeoutMs)
      const onAbort = () => {
        outcome = 'cancel'
        escalateKill()
      }
      signal?.addEventListener('abort', onAbort, { once: true })

      const cleanup = () => {
        clearTimeout(killTimer)
        if (graceTimer) clearTimeout(graceTimer)
        signal?.removeEventListener('abort', onAbort)
      }

      const settle = (result: { transcript: string; language: string | null } | null, error?: unknown) => {
        if (settled) return
        settled = true
        cleanup()
        void removeOutDir(outDir).then(
          () => error ? reject(error) : resolvePromise(result!),
          (cleanupError) => reject(error ?? cleanupError),
        )
      }

      child.stdout?.on('data', (chunk: Buffer) => {
        if (stdout.length < STREAM_CAP_BYTES) stdout += chunk.toString()
      })
      child.stderr?.on('data', (chunk: Buffer) => {
        if (stderr.length < STREAM_CAP_BYTES) stderr += chunk.toString()
      })
      child.on('error', (error) => {
        settle(null, error)
      })
      child.on('close', (code) => {
        if (outcome === 'cancel' || signal?.aborted) return settle(null, new TranscriptionCancelledError())
        if (outcome === 'timeout') return settle(null, new Error(`Transcrição excedeu o timeout de ${timeoutMs} ms.`))
        if (code !== 0) return settle(null, new Error(`Motor de transcrição falhou (exit ${code}): ${stderr.slice(0, 500) || 'sem detalhes'}`))
        const inline = stdout.trim()
        if (inline) return settle({ transcript: inline, language })
        readOutput(outDir).then(
          (text) => settle({ transcript: text, language }),
          (error) => settle(null, error),
        )
      })
    })
  }
}

function failureManifest(
  input: TranscribeMediaInput,
  failure: string,
  now: () => Date,
): TranscriptionManifest {
  const pasted = input.pastedTranscript?.trim()
  const language = input.language ?? null
  if (pasted) {
    const transcript = capTranscript(pasted)
    return {
      status: 'pasted',
      engine: 'operator-paste',
      language,
      transcript,
      charCount: transcript.length,
      mediaSha256: input.mediaSha256,
      failure,
      producedAt: now().toISOString(),
    }
  }
  return {
    status: 'failed',
    engine: null,
    language,
    transcript: null,
    charCount: 0,
    mediaSha256: input.mediaSha256,
    failure,
    producedAt: now().toISOString(),
  }
}

/**
 * Transcreve a mídia com o motor local. Nunca inventa texto: em qualquer falha
 * do motor, cai para o transcript colado (se houver) ou registra a falha
 * literal. Cancelamento é propagado como `TranscriptionCancelledError`.
 */
export async function transcribeMedia(input: TranscribeMediaInput): Promise<TranscriptionManifest> {
  const now = input.now ?? (() => new Date())
  let engine = input.engine ?? 'whisper-cli'
  let executablePath = input.executablePath
  const timeoutMs = input.timeoutMs ?? DEFAULT_TRANSCRIPTION_TIMEOUT_MS
  const runEngine = input.runEngine ?? createLocalWhisperRunner()
  const language = input.language ?? null

  if (input.signal?.aborted) throw new TranscriptionCancelledError()

  try {
    // Injected runners keep the historical default for deterministic tests.
    // Real executions auto-detect whisper.cpp, MLX Whisper or OpenAI Whisper.
    if (!input.engine && !input.runEngine && !input.executablePath) {
      const available = await resolveAvailableTranscriptionEngine()
      engine = available.engine
      executablePath = available.executablePath
    }
    const result = await runEngine({
      mediaPath: input.mediaPath,
      engine,
      executablePath,
      language,
      timeoutMs,
      signal: input.signal,
    })
    const transcript = capTranscript(result.transcript)
    if (!transcript) {
      return failureManifest(input, 'Motor de transcrição não devolveu texto.', now)
    }
    return {
      status: 'transcribed',
      engine,
      language: result.language ?? language,
      transcript,
      charCount: transcript.length,
      mediaSha256: input.mediaSha256,
      failure: null,
      producedAt: now().toISOString(),
    }
  } catch (error) {
    if (error instanceof TranscriptionCancelledError) throw error
    if (input.signal?.aborted) throw new TranscriptionCancelledError()
    const failure = redactTranscriptionFailure(error instanceof Error ? error.message : String(error), {
      mediaPath: input.mediaPath,
    })
    return failureManifest(input, failure, now)
  }
}
