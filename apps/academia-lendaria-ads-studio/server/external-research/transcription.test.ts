import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EngineUnavailableError,
  TranscriptionCancelledError,
  createLocalWhisperRunner,
  redactTranscriptionFailure,
  transcribeMedia,
  type TranscriptionEngineRunner,
} from './transcription.js'

interface FakeChild extends EventEmitter {
  stdout: EventEmitter
  stderr: EventEmitter
  kill: (signal: NodeJS.Signals) => boolean
  killedSignals: NodeJS.Signals[]
}

function fakeChild(): FakeChild {
  const child = new EventEmitter() as FakeChild
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  child.killedSignals = []
  child.kill = vi.fn((signal: NodeJS.Signals) => {
    child.killedSignals.push(signal)
    return true
  }) as unknown as FakeChild['kill']
  return child
}

const SHA = 'a'.repeat(64)

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('transcribeMedia — honest contract', () => {
  it('returns the engine transcript verbatim on success', async () => {
    const runEngine: TranscriptionEngineRunner = async () => ({ transcript: 'Olá, isto é o áudio real.', language: 'pt' })
    const manifest = await transcribeMedia({ mediaPath: '/tmp/media', mediaSha256: SHA, runEngine })
    expect(manifest).toMatchObject({
      status: 'transcribed',
      engine: 'whisper-cli',
      language: 'pt',
      transcript: 'Olá, isto é o áudio real.',
      failure: null,
      mediaSha256: SHA,
    })
    expect(manifest.charCount).toBe('Olá, isto é o áudio real.'.length)
  })

  it('falls back to the operator-pasted transcript when the engine is absent, and records the literal failure', async () => {
    const runEngine: TranscriptionEngineRunner = async () => {
      throw new EngineUnavailableError('Executável de transcrição ausente no PATH para o motor whisper-cli.')
    }
    const manifest = await transcribeMedia({
      mediaPath: '/tmp/media',
      mediaSha256: SHA,
      pastedTranscript: '  Transcrição colada pelo operador.  ',
      runEngine,
    })
    expect(manifest.status).toBe('pasted')
    expect(manifest.engine).toBe('operator-paste')
    expect(manifest.transcript).toBe('Transcrição colada pelo operador.')
    expect(manifest.failure).toContain('ausente no PATH')
  })

  it('records a literal failure (no invented text) when the engine is absent and nothing is pasted', async () => {
    const runEngine: TranscriptionEngineRunner = async () => {
      throw new EngineUnavailableError('binário whisper não encontrado')
    }
    const manifest = await transcribeMedia({ mediaPath: '/tmp/media', mediaSha256: SHA, runEngine })
    expect(manifest.status).toBe('failed')
    expect(manifest.engine).toBeNull()
    expect(manifest.transcript).toBeNull()
    expect(manifest.charCount).toBe(0)
    expect(manifest.failure).toContain('binário whisper não encontrado')
  })

  it('never invents text: an empty engine result degrades to failed', async () => {
    const runEngine: TranscriptionEngineRunner = async () => ({ transcript: '   ', language: null })
    const manifest = await transcribeMedia({ mediaPath: '/tmp/media', mediaSha256: SHA, runEngine })
    expect(manifest.status).toBe('failed')
    expect(manifest.transcript).toBeNull()
  })

  it('redacts absolute paths and secrets from the failure surfaced in the manifest', async () => {
    const runEngine: TranscriptionEngineRunner = async ({ mediaPath }) => {
      throw new Error(`falha ao abrir ${mediaPath}; log em /Users/rafael/segredo/whisper.log token=abc123secretvalue`)
    }
    const manifest = await transcribeMedia({ mediaPath: '/tmp/runtime/media.mp4', mediaSha256: SHA, runEngine })
    expect(manifest.status).toBe('failed')
    expect(manifest.failure).toContain('[mídia]')
    expect(manifest.failure).toContain('[caminho]')
    expect(manifest.failure).not.toContain('/Users/rafael/segredo')
    expect(manifest.failure).not.toContain('abc123secretvalue')
    expect(manifest.failure).not.toContain('/tmp/runtime/media.mp4')
  })
})

describe('redactTranscriptionFailure', () => {
  it('scrubs home paths and access tokens', () => {
    const cleaned = redactTranscriptionFailure('erro em /home/ana/dados/x.wav ?access_token=zzzsecret', {})
    expect(cleaned).toContain('[caminho]')
    expect(cleaned).toContain('[redacted]')
    expect(cleaned).not.toContain('zzzsecret')
  })
})

describe('transcribeMedia — cancellation', () => {
  it('throws immediately if the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const runEngine = vi.fn<TranscriptionEngineRunner>(async () => ({ transcript: 'x', language: null }))
    await expect(
      transcribeMedia({ mediaPath: '/tmp/media', mediaSha256: SHA, signal: controller.signal, runEngine }),
    ).rejects.toBeInstanceOf(TranscriptionCancelledError)
    expect(runEngine).not.toHaveBeenCalled()
  })

  it('propagates cancellation as an error even when a pasted transcript exists (no silent fallback)', async () => {
    const controller = new AbortController()
    const runEngine: TranscriptionEngineRunner = async () => {
      controller.abort()
      throw new TranscriptionCancelledError()
    }
    await expect(
      transcribeMedia({
        mediaPath: '/tmp/media',
        mediaSha256: SHA,
        pastedTranscript: 'colado',
        signal: controller.signal,
        runEngine,
      }),
    ).rejects.toBeInstanceOf(TranscriptionCancelledError)
  })
})

describe('createLocalWhisperRunner — subprocess lifecycle', () => {
  it('escalates SIGTERM then SIGKILL on cancellation and rejects as cancelled', async () => {
    vi.useFakeTimers()
    const child = fakeChild()
    const spawnImpl = vi.fn(() => child)
    const removeOutDir = vi.fn(async () => {})
    const runEngine = createLocalWhisperRunner({
      spawnImpl: spawnImpl as never,
      resolveExecutable: async () => '/fake/whisper-cli',
      createOutDir: async () => '/tmp/out',
      removeOutDir,
      killGraceMs: 200,
    })
    const controller = new AbortController()
    const promise = transcribeMedia({ mediaPath: '/tmp/m', mediaSha256: SHA, runEngine, signal: controller.signal })

    await vi.advanceTimersByTimeAsync(0)
    expect(spawnImpl).toHaveBeenCalledOnce()

    controller.abort()
    expect(child.killedSignals).toContain('SIGTERM')

    await vi.advanceTimersByTimeAsync(200)
    expect(child.killedSignals).toContain('SIGKILL')

    child.emit('close', null)
    await expect(promise).rejects.toBeInstanceOf(TranscriptionCancelledError)
    expect(removeOutDir).toHaveBeenCalledWith('/tmp/out')
  })

  it('kills the subprocess on timeout and surfaces a literal timeout failure', async () => {
    vi.useFakeTimers()
    const child = fakeChild()
    const spawnImpl = vi.fn(() => child)
    const removeOutDir = vi.fn(async () => {})
    const runEngine = createLocalWhisperRunner({
      spawnImpl: spawnImpl as never,
      resolveExecutable: async () => '/fake/whisper-cli',
      createOutDir: async () => '/tmp/out',
      removeOutDir,
      killGraceMs: 100,
    })
    const promise = transcribeMedia({ mediaPath: '/tmp/m', mediaSha256: SHA, runEngine, timeoutMs: 1_000 })

    await vi.advanceTimersByTimeAsync(0)
    expect(spawnImpl).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(1_000)
    expect(child.killedSignals).toContain('SIGTERM')

    child.emit('close', null)
    const manifest = await promise
    expect(manifest.status).toBe('failed')
    expect(manifest.failure).toContain('timeout')
    expect(removeOutDir).toHaveBeenCalledWith('/tmp/out')
  })

  it('reads the engine stdout transcript on a clean exit', async () => {
    const child = fakeChild()
    const spawnImpl = vi.fn(() => child)
    const removeOutDir = vi.fn(async () => {})
    const runEngine = createLocalWhisperRunner({
      spawnImpl: spawnImpl as never,
      resolveExecutable: async () => '/fake/whisper-cli',
      createOutDir: async () => '/tmp/out',
      removeOutDir,
    })
    const promise = transcribeMedia({ mediaPath: '/tmp/m', mediaSha256: SHA, runEngine })

    await vi.waitFor(() => expect(spawnImpl).toHaveBeenCalledOnce())
    child.stdout.emit('data', Buffer.from('Transcrição vinda do stdout do motor.'))
    child.emit('close', 0)

    const manifest = await promise
    expect(manifest.status).toBe('transcribed')
    expect(manifest.transcript).toBe('Transcrição vinda do stdout do motor.')
    expect(removeOutDir).toHaveBeenCalledWith('/tmp/out')
  })

  it('invokes the official OpenAI Whisper CLI with bounded local settings', async () => {
    const child = fakeChild()
    const spawnImpl = vi.fn(() => child)
    const removeOutDir = vi.fn(async () => {})
    const runEngine = createLocalWhisperRunner({
      spawnImpl: spawnImpl as never,
      resolveExecutable: async () => '/fake/whisper',
      createOutDir: async () => '/tmp/out',
      removeOutDir,
    })
    const promise = transcribeMedia({
      mediaPath: '/tmp/m.flac',
      mediaSha256: SHA,
      engine: 'openai-whisper',
      runEngine,
      language: 'pt',
    })

    await vi.waitFor(() => expect(spawnImpl).toHaveBeenCalledOnce())
    const spawnCall = spawnImpl.mock.calls[0] as unknown as [string, string[], { env: NodeJS.ProcessEnv }]
    expect(spawnCall[1]).toEqual([
      '/tmp/m.flac',
      '--output_dir', '/tmp/out',
      '--output_format', 'txt',
      '--model', 'base',
      '--device', 'cpu',
      '--fp16', 'False',
      '--verbose', 'False',
      '--language', 'pt',
    ])
    const childEnv = spawnCall[2].env
    expect(childEnv).not.toHaveProperty('OPENAI_API_KEY')
    expect(childEnv).not.toHaveProperty('LOCAL_SKILL_RUNNER_TOKEN')
    expect(Object.keys(childEnv)).toEqual(expect.arrayContaining(['PATH', 'HOME']))
    child.stdout.emit('data', Buffer.from('Transcrição oficial.'))
    child.emit('close', 0)

    const manifest = await promise
    expect(manifest).toMatchObject({ status: 'transcribed', engine: 'openai-whisper' })
    expect(removeOutDir).toHaveBeenCalledWith('/tmp/out')
  })

  it('reports an unavailable engine when the executable cannot be resolved', async () => {
    const runner = createLocalWhisperRunner({
      resolveExecutable: async () => {
        throw new EngineUnavailableError('sem binário')
      },
    })
    await expect(
      runner({ mediaPath: '/tmp/m', engine: 'whisper-cli', language: null, timeoutMs: 1_000 }),
    ).rejects.toBeInstanceOf(EngineUnavailableError)
  })
})
