/**
 * Intake LOCAL e determinístico das imagens do moodboard do `design-md`.
 *
 * Não faz rede. Aceita bytes, base64 ou um caminho **confinado** (o caminho real,
 * com symlinks resolvidos, precisa ficar sob `confinementRoot` — barra path
 * traversal e escape por symlink). Para cada imagem:
 *   - valida o formato por magic bytes (PNG/JPEG/WebP) e aplica o teto de bytes;
 *   - calcula `sha256`, `mimeType`, `byteSize` e dimensões (parse de header);
 *   - extrai a paleta dominante decodificando os pixels **localmente** — hoje só
 *     PNG tem decoder nativo (via `node:zlib`, com guarda anti-bomba). JPEG/WebP
 *     são validados mas a paleta fica `unavailable-without-decoder`: NÃO
 *     inventamos cores (No Invention).
 *
 * A saída é o `MoodboardImageSummary` PÚBLICO: sem bytes, sem caminho absoluto,
 * sem PII (a identidade é content-addressed pelo sha256).
 */
import { createHash } from 'node:crypto'
import { readFile, realpath, stat } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { inflateSync } from 'node:zlib'
import {
  BRAND_DESIGN_MAX_IMAGE_DIMENSION,
  BRAND_DESIGN_MAX_PALETTE_SWATCHES,
  MOODBOARD_MAX_IMAGE_BYTES,
  type BrandDesignPaletteSwatch,
  type MoodboardImageInput,
  type MoodboardImageOrigin,
  type MoodboardImageSummary,
  type MoodboardMime,
  type MoodboardPaletteStatus,
} from './contracts.js'

/** Orçamento de pixels decodificados por imagem (PNG). Acima disto: `unsupported`. */
export const PNG_DECODE_MAX_PIXELS = 6_000_000
/** Amostras de pixel usadas na quantização da paleta. */
const PALETTE_SAMPLE_TARGET = 40_000
/** Passo de quantização por canal (0..255). */
const PALETTE_QUANT_STEP = 24
/** Alpha mínimo para um pixel contar na paleta. */
const PALETTE_MIN_ALPHA = 8

export class MoodboardIntakeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MoodboardIntakeError'
  }
}
/** Violação de confinamento/segurança do caminho fornecido. */
export class MoodboardSecurityError extends MoodboardIntakeError {
  constructor(message: string) {
    super(message)
    this.name = 'MoodboardSecurityError'
  }
}
/** Imagem acima do teto de bytes. */
export class MoodboardLimitError extends MoodboardIntakeError {
  constructor(message: string) {
    super(message)
    this.name = 'MoodboardLimitError'
  }
}
/** Formato ausente ou fora da allowlist PNG/JPEG/WebP. */
export class MoodboardMimeError extends MoodboardIntakeError {
  constructor(message: string) {
    super(message)
    this.name = 'MoodboardMimeError'
  }
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function matchesAt(bytes: Uint8Array, offset: number, ascii: string): boolean {
  for (let i = 0; i < ascii.length; i += 1) {
    if (bytes[offset + i] !== ascii.charCodeAt(i)) return false
  }
  return true
}

/** Detecta o mime real por magic bytes. `null` = formato não permitido. */
export function detectImageFormat(bytes: Uint8Array): MoodboardMime | null {
  if (bytes.length >= 8 && PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 12 && matchesAt(bytes, 0, 'RIFF') && matchesAt(bytes, 8, 'WEBP')) return 'image/webp'
  return null
}

/** Decodifica base64 (aceita prefixo data URI). Nunca ecoa a string original. */
export function decodeBase64Image(data: string): Uint8Array {
  const stripped = data.replace(/^data:[^;,]*;base64,/i, '').trim()
  const buffer = Buffer.from(stripped, 'base64')
  if (buffer.length === 0) throw new MoodboardMimeError('Imagem base64 vazia ou inválida.')
  return new Uint8Array(buffer)
}

function isWithinRoot(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(root.endsWith(sep) ? root : `${root}${sep}`)
}

/**
 * Lê os bytes de uma imagem por caminho CONFINADO. O caminho real (symlinks
 * resolvidos) precisa ficar sob `confinementRoot`. Nunca devolve o caminho.
 */
export async function loadConfinedImageBytes(
  path: string,
  confinementRoot: string,
  maxBytes: number = MOODBOARD_MAX_IMAGE_BYTES,
): Promise<Uint8Array> {
  let rootReal: string
  try {
    rootReal = await realpath(confinementRoot)
  } catch {
    throw new MoodboardSecurityError('Diretório confinado do moodboard inacessível.')
  }
  let fileReal: string
  try {
    fileReal = await realpath(resolve(confinementRoot, path))
  } catch {
    throw new MoodboardSecurityError('Imagem do moodboard inexistente ou inacessível.')
  }
  if (!isWithinRoot(rootReal, fileReal)) {
    throw new MoodboardSecurityError('Imagem fora do diretório confinado do moodboard.')
  }
  const info = await stat(fileReal)
  if (!info.isFile()) throw new MoodboardSecurityError('Origem confinada não é um arquivo regular.')
  if (info.size > maxBytes) {
    throw new MoodboardLimitError(`Imagem tem ${info.size} bytes, acima do teto de ${maxBytes}.`)
  }
  return new Uint8Array(await readFile(fileReal))
}

/** Resolve os bytes de qualquer variante de entrada de imagem. */
export async function resolveImageBytes(
  input: MoodboardImageInput,
  options: { confinementRoot?: string; maxBytes: number },
): Promise<Uint8Array> {
  if (input.kind === 'inline') return input.bytes
  if (input.kind === 'base64') return decodeBase64Image(input.data)
  if (!options.confinementRoot) throw new MoodboardSecurityError('Imagem por caminho exige confinementRoot.')
  return loadConfinedImageBytes(input.path, options.confinementRoot, options.maxBytes)
}

/** Lê largura/altura sem decodificar pixels. Lança em header malformado. */
export function readImageDimensions(bytes: Uint8Array, mime: MoodboardMime): { width: number; height: number } {
  const dimensions =
    mime === 'image/png' ? pngDimensions(bytes) : mime === 'image/jpeg' ? jpegDimensions(bytes) : webpDimensions(bytes)
  const { width, height } = dimensions
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width > BRAND_DESIGN_MAX_IMAGE_DIMENSION ||
    height > BRAND_DESIGN_MAX_IMAGE_DIMENSION
  ) {
    throw new MoodboardMimeError('Dimensões da imagem inválidas ou fora dos limites.')
  }
  return { width, height }
}

function pngDimensions(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  // IHDR começa em 16 (8 assinatura + 4 length + 4 "IHDR").
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

function jpegDimensions(bytes: Uint8Array): { width: number; height: number } {
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = bytes[offset + 1]!
    offset += 2
    // Marcadores standalone (sem segmento de comprimento).
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) continue
    const segmentLength = (bytes[offset]! << 8) | bytes[offset + 1]!
    // SOF0..SOF15, exceto DHT (C4), JPG (C8) e DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = (bytes[offset + 3]! << 8) | bytes[offset + 4]!
      const width = (bytes[offset + 5]! << 8) | bytes[offset + 6]!
      return { width, height }
    }
    if (segmentLength < 2) break
    offset += segmentLength
  }
  throw new MoodboardMimeError('JPEG sem marcador de dimensões (SOF).')
}

function webpDimensions(bytes: Uint8Array): { width: number; height: number } {
  const fourcc = String.fromCharCode(bytes[12]!, bytes[13]!, bytes[14]!, bytes[15]!)
  if (fourcc === 'VP8 ') {
    if (!(bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a)) {
      throw new MoodboardMimeError('WebP lossy sem código de sincronização VP8.')
    }
    const width = ((bytes[26]! | (bytes[27]! << 8)) & 0x3fff)
    const height = ((bytes[28]! | (bytes[29]! << 8)) & 0x3fff)
    return { width, height }
  }
  if (fourcc === 'VP8L') {
    if (bytes[20] !== 0x2f) throw new MoodboardMimeError('WebP lossless sem assinatura VP8L.')
    const b1 = bytes[21]!
    const b2 = bytes[22]!
    const b3 = bytes[23]!
    const b4 = bytes[24]!
    const width = 1 + (((b2 & 0x3f) << 8) | b1)
    const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6))
    return { width, height }
  }
  if (fourcc === 'VP8X') {
    const width = 1 + (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16))
    const height = 1 + (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16))
    return { width, height }
  }
  throw new MoodboardMimeError(`WebP com container não suportado: ${fourcc}.`)
}

interface RawPngImage {
  width: number
  height: number
  bytesPerRow: number
  bytesPerPixel: number
  bitDepth: number
  colorType: number
  data: Buffer
  palette: Uint8Array | null
  transparency: Uint8Array | null
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

/**
 * Decodifica um PNG (não entrelaçado) para bytes desfiltrados. `null` quando a
 * variação não é suportada localmente. Guarda anti-bomba: limita a saída do
 * inflate ao tamanho exato esperado e o número de pixels ao orçamento.
 */
function decodePng(bytes: Uint8Array): RawPngImage | { unsupported: string } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 8
  let ihdr: { width: number; height: number; bitDepth: number; colorType: number; interlace: number } | null = null
  let palette: Uint8Array | null = null
  let transparency: Uint8Array | null = null
  const idatChunks: Uint8Array[] = []

  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(bytes[offset + 4]!, bytes[offset + 5]!, bytes[offset + 6]!, bytes[offset + 7]!)
    const dataStart = offset + 8
    if (dataStart + length > bytes.length) throw new MoodboardMimeError('PNG truncado.')
    if (type === 'IHDR') {
      const width = view.getUint32(dataStart)
      const height = view.getUint32(dataStart + 4)
      const bitDepth = bytes[dataStart + 8]!
      const colorType = bytes[dataStart + 9]!
      const compression = bytes[dataStart + 10]!
      const filter = bytes[dataStart + 11]!
      const interlace = bytes[dataStart + 12]!
      if (compression !== 0 || filter !== 0) throw new MoodboardMimeError('PNG com método de compressão/filtro inválido.')
      ihdr = { width, height, bitDepth, colorType, interlace }
    } else if (type === 'PLTE') {
      palette = bytes.slice(dataStart, dataStart + length)
    } else if (type === 'tRNS') {
      transparency = bytes.slice(dataStart, dataStart + length)
    } else if (type === 'IDAT') {
      idatChunks.push(bytes.slice(dataStart, dataStart + length))
    } else if (type === 'IEND') {
      break
    }
    offset = dataStart + length + 4 // pula CRC
  }

  if (!ihdr) throw new MoodboardMimeError('PNG sem IHDR.')
  if (ihdr.interlace !== 0) return { unsupported: 'PNG entrelaçado (Adam7) não é decodificável localmente.' }
  if (ihdr.width * ihdr.height > PNG_DECODE_MAX_PIXELS) {
    return { unsupported: 'Imagem grande demais para decodificação local da paleta.' }
  }

  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[ihdr.colorType]
  if (!channels) return { unsupported: `Tipo de cor PNG ${ihdr.colorType} não suportado.` }
  const supportedDepth = ihdr.colorType === 3 ? [1, 2, 4, 8] : [8, 16]
  if (!supportedDepth.includes(ihdr.bitDepth)) {
    return { unsupported: `Profundidade de bits ${ihdr.bitDepth} não suportada para este PNG.` }
  }
  if (ihdr.colorType === 3 && !palette) throw new MoodboardMimeError('PNG indexado sem PLTE.')

  const bitsPerPixel = channels * ihdr.bitDepth
  const bytesPerRow = Math.ceil((bitsPerPixel * ihdr.width) / 8)
  const bytesPerPixel = Math.max(1, Math.ceil(bitsPerPixel / 8))
  const expected = ihdr.height * (bytesPerRow + 1)

  const compressed = idatChunks.length === 1 ? idatChunks[0]! : Buffer.concat(idatChunks)
  let filtered: Buffer
  try {
    filtered = inflateSync(compressed, { maxOutputLength: expected })
  } catch {
    return { unsupported: 'Falha ao inflar os dados do PNG dentro do limite seguro.' }
  }
  if (filtered.length !== expected) throw new MoodboardMimeError('PNG com tamanho de dados inconsistente.')

  const out = Buffer.allocUnsafe(ihdr.height * bytesPerRow)
  let src = 0
  for (let row = 0; row < ihdr.height; row += 1) {
    const filterType = filtered[src]!
    src += 1
    const rowStart = row * bytesPerRow
    for (let i = 0; i < bytesPerRow; i += 1) {
      const raw = filtered[src]!
      src += 1
      const a = i >= bytesPerPixel ? out[rowStart + i - bytesPerPixel]! : 0
      const b = row > 0 ? out[rowStart - bytesPerRow + i]! : 0
      const c = row > 0 && i >= bytesPerPixel ? out[rowStart - bytesPerRow + i - bytesPerPixel]! : 0
      let value: number
      switch (filterType) {
        case 0: value = raw; break
        case 1: value = raw + a; break
        case 2: value = raw + b; break
        case 3: value = raw + ((a + b) >> 1); break
        case 4: value = raw + paeth(a, b, c); break
        default: throw new MoodboardMimeError(`Filtro PNG desconhecido: ${filterType}.`)
      }
      out[rowStart + i] = value & 0xff
    }
  }

  return {
    width: ihdr.width,
    height: ihdr.height,
    bytesPerRow,
    bytesPerPixel,
    bitDepth: ihdr.bitDepth,
    colorType: ihdr.colorType,
    data: out,
    palette,
    transparency,
  }
}

/** Amostra pixels do PNG desfiltrado e quantiza numa paleta dominante. */
function paletteFromPng(image: RawPngImage): BrandDesignPaletteSwatch[] {
  const total = image.width * image.height
  const step = Math.max(1, Math.floor(total / PALETTE_SAMPLE_TARGET))
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>()
  let counted = 0

  for (let index = 0; index < total; index += step) {
    const x = index % image.width
    const y = (index / image.width) | 0
    const pixel = readPixel(image, x, y)
    if (!pixel || pixel[3] < PALETTE_MIN_ALPHA) continue
    const [r, g, b] = pixel
    const key =
      (Math.round(r / PALETTE_QUANT_STEP) << 16) |
      (Math.round(g / PALETTE_QUANT_STEP) << 8) |
      Math.round(b / PALETTE_QUANT_STEP)
    const existing = buckets.get(key)
    if (existing) {
      existing.count += 1
      existing.r += r
      existing.g += g
      existing.b += b
    } else {
      buckets.set(key, { count: 1, r, g, b })
    }
    counted += 1
  }
  if (counted === 0) return []
  return [...buckets.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, BRAND_DESIGN_MAX_PALETTE_SWATCHES)
    .map((bucket) => ({
      hex: rgbToHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count),
      weight: roundWeight(bucket.count / counted),
    }))
}

/**
 * Lê o pixel (x,y) como RGBA 8-bit. Para PNG de 16 bits, lê o byte alto de cada
 * amostra (big-endian) — normaliza 16→8 sem multiplicação. `null` quando o
 * índice de paleta é inválido.
 */
function readPixel(image: RawPngImage, x: number, y: number): [number, number, number, number] | null {
  const { data, bytesPerRow, colorType, bitDepth } = image
  const rowStart = y * bytesPerRow
  const sampleBytes = bitDepth === 16 ? 2 : 1
  const readSample = (channel: number): number => data[rowStart + (x * channelCount(colorType) + channel) * sampleBytes]!
  if (colorType === 2) return [readSample(0), readSample(1), readSample(2), 255]
  if (colorType === 6) return [readSample(0), readSample(1), readSample(2), readSample(3)]
  if (colorType === 0) {
    const v = readSample(0)
    return [v, v, v, 255]
  }
  if (colorType === 4) {
    const v = readSample(0)
    return [v, v, v, readSample(1)]
  }
  // Indexado (colorType 3): índice sub-byte + PLTE (+ tRNS opcional).
  const palette = image.palette!
  const pixelsPerByte = 8 / bitDepth
  const byteIndex = rowStart + Math.floor(x / pixelsPerByte)
  const bitOffset = (x % pixelsPerByte) * bitDepth
  const index = (data[byteIndex]! >> (8 - bitDepth - bitOffset)) & ((1 << bitDepth) - 1)
  const base = index * 3
  if (base + 2 >= palette.length) return null
  const alpha = image.transparency && index < image.transparency.length ? image.transparency[index]! : 255
  return [palette[base]!, palette[base + 1]!, palette[base + 2]!, alpha]
}

function channelCount(colorType: number): number {
  return ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[colorType]!
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (value: number): string => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`
}

function roundWeight(value: number): number {
  return Math.round(value * 1_000) / 1_000
}

interface PaletteResult {
  status: MoodboardPaletteStatus
  palette: BrandDesignPaletteSwatch[]
  note: string | null
}

/** Extrai a paleta dominante local. Só PNG hoje; JPEG/WebP ficam sem invenção. */
export function extractPalette(bytes: Uint8Array, mime: MoodboardMime): PaletteResult {
  if (mime !== 'image/png') {
    return {
      status: 'unavailable-without-decoder',
      palette: [],
      note: `Paleta de ${mime} exige decoder local indisponível; nenhuma cor foi inventada.`,
    }
  }
  const decoded = decodePng(bytes)
  if ('unsupported' in decoded) return { status: 'unsupported', palette: [], note: decoded.unsupported }
  const palette = paletteFromPng(decoded)
  if (palette.length === 0) {
    return { status: 'unsupported', palette: [], note: 'Nenhum pixel opaco amostrado para compor a paleta.' }
  }
  return { status: 'decoded', palette, note: null }
}

/**
 * Constrói o resumo PÚBLICO de uma imagem a partir dos seus bytes já resolvidos.
 * Valida formato e teto de bytes; nunca inclui bytes, caminho ou PII na saída.
 */
export function summarizeImageBytes(input: {
  bytes: Uint8Array
  ordinal: number
  origin: MoodboardImageOrigin
  maxBytes?: number
}): MoodboardImageSummary {
  const maxBytes = input.maxBytes ?? MOODBOARD_MAX_IMAGE_BYTES
  if (input.bytes.length > maxBytes) {
    throw new MoodboardLimitError(`Imagem tem ${input.bytes.length} bytes, acima do teto de ${maxBytes}.`)
  }
  const mime = detectImageFormat(input.bytes)
  if (!mime) throw new MoodboardMimeError('Formato de imagem não permitido (aceitos: PNG, JPEG, WebP).')
  const { width, height } = readImageDimensions(input.bytes, mime)
  const sha256 = createHash('sha256').update(input.bytes).digest('hex')
  const paletteResult = extractPalette(input.bytes, mime)
  return {
    imageId: `img_${sha256.slice(0, 16)}`,
    ordinal: input.ordinal,
    origin: input.origin,
    mimeType: mime,
    byteSize: input.bytes.length,
    sha256,
    width,
    height,
    paletteStatus: paletteResult.status,
    palette: paletteResult.palette,
    paletteNote: paletteResult.note,
  }
}

/** Funde as paletas decodificadas (peso igual por imagem) numa paleta agregada. */
export function mergePalettes(lists: BrandDesignPaletteSwatch[][]): BrandDesignPaletteSwatch[] {
  const decoded = lists.filter((list) => list.length > 0)
  if (decoded.length === 0) return []
  const buckets = new Map<number, { weight: number; r: number; g: number; b: number }>()
  for (const list of decoded) {
    for (const swatch of list) {
      const r = parseInt(swatch.hex.slice(1, 3), 16)
      const g = parseInt(swatch.hex.slice(3, 5), 16)
      const b = parseInt(swatch.hex.slice(5, 7), 16)
      const key =
        (Math.round(r / PALETTE_QUANT_STEP) << 16) |
        (Math.round(g / PALETTE_QUANT_STEP) << 8) |
        Math.round(b / PALETTE_QUANT_STEP)
      const share = swatch.weight / decoded.length
      const existing = buckets.get(key)
      if (existing) {
        existing.weight += share
        existing.r += r * share
        existing.g += g * share
        existing.b += b * share
      } else {
        buckets.set(key, { weight: share, r: r * share, g: g * share, b: b * share })
      }
    }
  }
  return [...buckets.values()]
    .sort((left, right) => right.weight - left.weight)
    .slice(0, BRAND_DESIGN_MAX_PALETTE_SWATCHES)
    .map((bucket) => ({
      hex: rgbToHex(bucket.r / bucket.weight, bucket.g / bucket.weight, bucket.b / bucket.weight),
      weight: roundWeight(bucket.weight),
    }))
}
