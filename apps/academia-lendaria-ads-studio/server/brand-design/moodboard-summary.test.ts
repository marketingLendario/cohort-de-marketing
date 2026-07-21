import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { deflateSync, crc32 } from 'node:zlib'
import { afterEach, describe, expect, it } from 'vitest'
import {
  decodeBase64Image,
  detectImageFormat,
  extractPalette,
  loadConfinedImageBytes,
  MoodboardLimitError,
  MoodboardMimeError,
  MoodboardSecurityError,
  readImageDimensions,
  resolveImageBytes,
  summarizeImageBytes,
} from './moodboard-summary.js'

const roots: string[] = []

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(resolve(tmpdir(), 'brand-moodboard-test-'))
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

/** PNG truecolor (colorType 2, 8-bit) a partir de pixels [r,g,b]. */
function makePng(width: number, height: number, pixels: Array<[number, number, number]>): Uint8Array {
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
      const [r, g, b] = pixels[y * width + x]!
      raw[position] = r
      raw[position + 1] = g
      raw[position + 2] = b
      position += 3
    }
  }
  return new Uint8Array(
    Buffer.concat([
      signature,
      pngChunk('IHDR', ihdr),
      pngChunk('IDAT', deflateSync(raw)),
      pngChunk('IEND', Buffer.alloc(0)),
    ]),
  )
}

/** JPEG sintético: cabeçalho + SOF0 com dimensões (não decodável, só validável). */
function makeJpeg(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
  ])
}

/** WebP lossless (VP8L) com dimensões declaradas. */
function makeWebpVp8l(width: number, height: number): Uint8Array {
  const w = width - 1
  const h = height - 1
  const b1 = w & 0xff
  const b2 = ((w >> 8) & 0x3f) | ((h & 0x3) << 6)
  const b3 = (h >> 2) & 0xff
  const b4 = (h >> 10) & 0x0f
  const vp8l = Buffer.from([0x2f, b1, b2, b3, b4, 0, 0, 0])
  const fourcc = Buffer.from('VP8L', 'ascii')
  const size = Buffer.alloc(4)
  size.writeUInt32LE(vp8l.length, 0)
  const body = Buffer.concat([fourcc, size, vp8l])
  const header = Buffer.alloc(12)
  header.write('RIFF', 0, 'ascii')
  header.write('WEBP', 8, 'ascii')
  header.writeUInt32LE(4 + body.length, 4)
  return new Uint8Array(Buffer.concat([header, body]))
}

const redBluePixels: Array<[number, number, number]> = [
  ...Array.from({ length: 12 }, () => [200, 30, 30] as [number, number, number]),
  ...Array.from({ length: 4 }, () => [30, 30, 200] as [number, number, number]),
]

describe('moodboard image format detection & dimensions', () => {
  it('detecta PNG/JPEG/WebP por magic bytes e recusa outros', () => {
    expect(detectImageFormat(makePng(2, 2, Array(4).fill([0, 0, 0])))).toBe('image/png')
    expect(detectImageFormat(makeJpeg(640, 480))).toBe('image/jpeg')
    expect(detectImageFormat(makeWebpVp8l(5, 7))).toBe('image/webp')
    expect(detectImageFormat(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBeNull() // %PDF
    expect(detectImageFormat(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBeNull() // GIF
  })

  it('lê dimensões corretas de cada formato', () => {
    expect(readImageDimensions(makePng(9, 3, Array(27).fill([1, 2, 3])), 'image/png')).toEqual({ width: 9, height: 3 })
    expect(readImageDimensions(makeJpeg(640, 480), 'image/jpeg')).toEqual({ width: 640, height: 480 })
    expect(readImageDimensions(makeWebpVp8l(5, 7), 'image/webp')).toEqual({ width: 5, height: 7 })
  })
})

describe('moodboard palette extraction (local, no invention)', () => {
  it('decodifica PNG e devolve a paleta dominante com cor real', () => {
    const summary = summarizeImageBytes({ bytes: makePng(4, 4, redBluePixels), ordinal: 1, origin: 'inline' })
    expect(summary.mimeType).toBe('image/png')
    expect(summary.width).toBe(4)
    expect(summary.height).toBe(4)
    expect(summary.paletteStatus).toBe('decoded')
    expect(summary.palette.length).toBeGreaterThan(0)
    const top = summary.palette[0]!
    const r = parseInt(top.hex.slice(1, 3), 16)
    const g = parseInt(top.hex.slice(3, 5), 16)
    const b = parseInt(top.hex.slice(5, 7), 16)
    expect(r).toBeGreaterThan(150)
    expect(g).toBeLessThan(90)
    expect(b).toBeLessThan(90)
    expect(top.weight).toBeGreaterThan(0.6)
  })

  it('valida JPEG mas NÃO inventa paleta sem decoder', () => {
    const result = extractPalette(makeJpeg(64, 48), 'image/jpeg')
    expect(result.status).toBe('unavailable-without-decoder')
    expect(result.palette).toEqual([])
    expect(result.note).toContain('image/jpeg')
  })

  it('valida WebP mas NÃO inventa paleta sem decoder', () => {
    const summary = summarizeImageBytes({ bytes: makeWebpVp8l(5, 7), ordinal: 2, origin: 'inline' })
    expect(summary.mimeType).toBe('image/webp')
    expect(summary.paletteStatus).toBe('unavailable-without-decoder')
    expect(summary.palette).toEqual([])
    expect(summary.paletteNote).toBeTruthy()
  })
})

describe('moodboard public summary invariants', () => {
  it('produz resumo content-addressed sem bytes, path ou PII', () => {
    const png = makePng(4, 4, redBluePixels)
    const summary = summarizeImageBytes({ bytes: png, ordinal: 3, origin: 'inline' })
    expect(summary.imageId).toMatch(/^img_[0-9a-f]{16}$/)
    expect(summary.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(summary.byteSize).toBe(png.byteLength)
    const serialized = JSON.stringify(summary)
    // Sem caminho absoluto de filesystem (mimeType "image/png" tem barra legítima).
    expect(serialized).not.toMatch(/\/(?:Users|home|tmp|var|private|root)\b/)
    expect(Object.keys(summary)).not.toContain('bytes')
    expect(Object.keys(summary)).not.toContain('localPath')
  })

  it('base64 e bytes inline produzem o mesmo sha256', () => {
    const png = makePng(2, 2, Array(4).fill([10, 20, 30]))
    const base64 = Buffer.from(png).toString('base64')
    expect(decodeBase64Image(base64)).toEqual(png)
    const inline = summarizeImageBytes({ bytes: png, ordinal: 1, origin: 'inline' })
    const fromB64 = summarizeImageBytes({ bytes: decodeBase64Image(`data:image/png;base64,${base64}`), ordinal: 1, origin: 'base64' })
    expect(fromB64.sha256).toBe(inline.sha256)
  })

  it('recusa formato não permitido e imagem acima do teto', () => {
    expect(() => summarizeImageBytes({ bytes: new Uint8Array([1, 2, 3, 4, 5]), ordinal: 1, origin: 'inline' })).toThrow(
      MoodboardMimeError,
    )
    expect(() =>
      summarizeImageBytes({ bytes: makePng(2, 2, Array(4).fill([0, 0, 0])), ordinal: 1, origin: 'inline', maxBytes: 8 }),
    ).toThrow(MoodboardLimitError)
  })
})

describe('moodboard confined path loading (fail-closed)', () => {
  it('carrega arquivo dentro da raiz confinada', async () => {
    const root = await tempRoot()
    const png = makePng(2, 2, Array(4).fill([5, 5, 5]))
    await writeFile(resolve(root, 'ref.png'), png)
    const bytes = await loadConfinedImageBytes('ref.png', root)
    expect(new Uint8Array(bytes)).toEqual(png)
  })

  it('barra path traversal para fora da raiz', async () => {
    const base = await tempRoot()
    const root = resolve(base, 'confined')
    await mkdir(root)
    await writeFile(resolve(base, 'secret.png'), makePng(2, 2, Array(4).fill([9, 9, 9])))
    await expect(loadConfinedImageBytes('../secret.png', root)).rejects.toBeInstanceOf(MoodboardSecurityError)
  })

  it('barra symlink apontando para fora da raiz', async () => {
    const base = await tempRoot()
    const root = resolve(base, 'confined')
    await mkdir(root)
    await writeFile(resolve(base, 'outside.png'), makePng(2, 2, Array(4).fill([1, 1, 1])))
    await symlink(resolve(base, 'outside.png'), resolve(root, 'link.png'))
    await expect(loadConfinedImageBytes('link.png', root)).rejects.toBeInstanceOf(MoodboardSecurityError)
  })

  it('resolveImageBytes exige confinementRoot para variante path', async () => {
    await expect(resolveImageBytes({ kind: 'path', path: 'x.png' }, { maxBytes: 1024 })).rejects.toBeInstanceOf(
      MoodboardSecurityError,
    )
  })
})
