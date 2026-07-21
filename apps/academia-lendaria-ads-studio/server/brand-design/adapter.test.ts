import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, sep } from 'node:path'
import { deflateSync, crc32 } from 'node:zlib'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CachedBrandDesignAdapter,
  sanitizeWorkerEnv,
  type UrlWorkerExecutor,
  type UrlWorkerRawSummary,
} from './adapter.js'
import { assertBrandDesignSnapshotIntegrity, buildBrandDesignGuard } from './contracts.js'
import { MoodboardSecurityError } from './moodboard-summary.js'

const roots: string[] = []

async function runtimeRoot(): Promise<string> {
  const root = await mkdtemp(resolve(tmpdir(), 'brand-adapter-test-'))
  roots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])) >>> 0, 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function makeRedPng(): Uint8Array {
  const width = 4
  const height = 4
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const raw = Buffer.alloc(height * (1 + width * 3))
  let position = 0
  for (let y = 0; y < height; y += 1) {
    raw[position] = 0
    position += 1
    for (let x = 0; x < width; x += 1) {
      raw[position] = 210
      raw[position + 1] = 40
      raw[position + 2] = 40
      position += 3
    }
  }
  return new Uint8Array(
    Buffer.concat([signature, pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))]),
  )
}

function rawUrlSummary(): UrlWorkerRawSummary {
  return {
    finalUrl: 'https://marca.com/sobre',
    title: 'Marca',
    byteSize: 4_096,
    truncated: false,
    redirectCount: 1,
    textSample: 'Identidade da marca.',
    cssSample: ':root{--brand:#ff0000}',
    rawColors: ['#FF0000', 'rgb(18, 18, 18)', 'not-a-color', 'hsl(210, 50%, 40%)'],
    rawFontFamilies: ['Inter', 'Inter', 'Archivo'],
  }
}

describe('brand design adapter — modo URL', () => {
  it('normaliza cores, congela snapshot íntegro e reusa o cache sem re-executar', async () => {
    let capturedEnv: NodeJS.ProcessEnv | undefined
    const executeUrlCollector = vi.fn<UrlWorkerExecutor>(async (call) => {
      capturedEnv = call.env
      return rawUrlSummary()
    })
    const adapter = new CachedBrandDesignAdapter({
      runtimeRoot: await runtimeRoot(),
      env: { PATH: '/usr/bin', OPENAI_API_KEY: 'secret-nunca-vaza' },
      executeUrlCollector,
      now: () => new Date('2026-07-11T12:00:00.000Z'),
    })
    const input = { projectId: 'projeto-1', request: { mode: 'url', url: 'https://marca.com/sobre' } }

    const first = await adapter.collect(input)
    const retry = await adapter.collect(input)

    expect(executeUrlCollector).toHaveBeenCalledOnce()
    expect(first.cacheHit).toBe(false)
    expect(retry.cacheHit).toBe(true)
    expect(retry.snapshot).toEqual(first.snapshot)

    expect(first.snapshot.mode).toBe('url')
    expect(first.snapshot.url?.colors).toContain('#ff0000')
    expect(first.snapshot.url?.colors).toContain('#121212')
    expect(first.snapshot.url?.colors).not.toContain('not-a-color')
    expect(first.snapshot.url?.fontFamilies).toEqual(['Inter', 'Archivo'])
    expect(() => assertBrandDesignSnapshotIntegrity(first.snapshot)).not.toThrow()

    // Env do coletor sem segredos.
    expect(capturedEnv?.OPENAI_API_KEY).toBeUndefined()
    expect(capturedEnv?.PATH).toBe('/usr/bin')
    expect(JSON.stringify(first.snapshot)).not.toContain('secret-nunca-vaza')
  })

  it('marca truncamento quando a página excede 1 MB', async () => {
    const adapter = new CachedBrandDesignAdapter({
      runtimeRoot: await runtimeRoot(),
      executeUrlCollector: async () => ({ ...rawUrlSummary(), truncated: true }),
    })
    const result = await adapter.collect({ projectId: 'p', request: { mode: 'url', url: 'https://marca.com/' } })
    expect(result.snapshot.url?.truncated).toBe(true)
    expect(result.snapshot.warnings.join(' ')).toContain('1 MB')
  })

  it('buildBrandDesignGuard injeta snapshot autoritativo com fingerprint e hash', async () => {
    const adapter = new CachedBrandDesignAdapter({
      runtimeRoot: await runtimeRoot(),
      executeUrlCollector: async () => rawUrlSummary(),
    })
    const { snapshot } = await adapter.collect({ projectId: 'p', request: { mode: 'url', url: 'https://marca.com/' } })
    const guard = buildBrandDesignGuard(snapshot)
    expect(guard).toContain('SNAPSHOT DE MARCA CONGELADO')
    expect(guard).toContain(snapshot.fingerprint)
    expect(guard).toContain(snapshot.contentHash)
    expect(guard).toContain('design-md')
  })
})

describe('brand design adapter — modo moodboard', () => {
  it('confina o cache mesmo quando projectId contém traversal', async () => {
    const root = await runtimeRoot()
    const adapter = new CachedBrandDesignAdapter({ runtimeRoot: root })
    const result = await adapter.collect({
      projectId: '../../escape',
      request: { mode: 'moodboard', images: [{ kind: 'inline', bytes: makeRedPng() }] },
    })

    expect(result.snapshotPath.startsWith(`${root}${sep}`)).toBe(true)
    expect(result.snapshotPath).not.toContain('..')
  })

  it('valida imagens inline, extrai paleta local e não vaza bytes/paths', async () => {
    const png = makeRedPng()
    const adapter = new CachedBrandDesignAdapter({ runtimeRoot: await runtimeRoot() })
    const result = await adapter.collect({
      projectId: 'projeto-1',
      request: { mode: 'moodboard', images: [{ kind: 'inline', bytes: png }] },
    })

    expect(result.snapshot.mode).toBe('moodboard')
    expect(result.snapshot.moodboard?.imageCount).toBe(1)
    expect(result.snapshot.moodboard?.decodedImageCount).toBe(1)
    const image = result.snapshot.moodboard!.images[0]!
    expect(image.paletteStatus).toBe('decoded')
    expect(image.palette.length).toBeGreaterThan(0)
    expect(image.imageId).toMatch(/^img_[0-9a-f]{16}$/)
    expect(result.snapshot.moodboard?.aggregatePalette.length).toBeGreaterThan(0)
    expect(() => assertBrandDesignSnapshotIntegrity(result.snapshot)).not.toThrow()

    // Snapshot público: sem bytes crus e sem o base64 da imagem.
    const serialized = JSON.stringify(result.snapshot)
    expect(serialized).not.toContain(Buffer.from(png).toString('base64').slice(0, 24))
    expect(serialized).not.toContain('"bytes"')
  })

  it('aceita caminho confinado e barra caminho sem confinementRoot', async () => {
    const root = await runtimeRoot()
    const confinement = resolve(root, 'assets')
    await mkdir(confinement)
    await writeFile(resolve(confinement, 'ref.png'), makeRedPng())
    const adapter = new CachedBrandDesignAdapter({ runtimeRoot: await runtimeRoot() })

    const ok = await adapter.collect({
      projectId: 'p',
      request: { mode: 'moodboard', images: [{ kind: 'path', path: 'ref.png' }], confinementRoot: confinement },
    })
    expect(ok.snapshot.moodboard?.images[0]!.paletteStatus).toBe('decoded')

    await expect(
      adapter.collect({ projectId: 'p', request: { mode: 'moodboard', images: [{ kind: 'path', path: 'ref.png' }] } }),
    ).rejects.toBeInstanceOf(MoodboardSecurityError)
  })
})

describe('brand design adapter — env allowlist', () => {
  it('sanitizeWorkerEnv mantém só variáveis não sensíveis', () => {
    expect(
      sanitizeWorkerEnv({ PATH: '/usr/bin', HOME: '/home/x', APIFY_API_TOKEN: 'x', OPENAI_API_KEY: 'y' }),
    ).toEqual({ PATH: '/usr/bin', HOME: '/home/x' })
  })
})
