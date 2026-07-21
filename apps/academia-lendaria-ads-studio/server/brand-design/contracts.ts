/**
 * Contrato do adapter real de `design-md` para os modos `url` e `moodboard`.
 *
 * O adapter congela uma EVIDÊNCIA VISUAL AUTORITATIVA e determinística que é
 * injetada no Codex — o modelo consome só o snapshot congelado, nunca refaz a
 * coleta. Dois modos:
 *
 *   - `url`      → extração estática de uma URL HTTPS **pública**. O fetch roda
 *     num subprocesso isolado (`url-worker.mjs`) com defesa SSRF fail-closed
 *     (esquema, userinfo, host privado, resolução DNS e cada salto de redirect),
 *     teto de 1 MB aplicado durante o streaming e devolve texto/CSS SANITIZADOS
 *     mais os tokens de design heurísticos (cores, famílias de fonte).
 *   - `moodboard` → 1–5 imagens recebidas como bytes, base64 ou **caminhos
 *     confinados** (definidos aqui no contrato). Cada imagem é validada
 *     (PNG/JPEG/WebP por magic bytes), tem `sha256`, `mimeType`, `byteSize`,
 *     dimensões e paleta dominante calculada **localmente**. O snapshot público
 *     NUNCA contém bytes, caminho absoluto nem PII.
 *
 * A integridade é garantida por `contentHash` (SHA-256 do core canônico). Ver
 * `adapter.ts` (orquestração + cache imutável) e `moodboard-summary.ts`
 * (validação/paleta local).
 */
import { createHash } from 'node:crypto'
import { z } from 'zod'

export const BRAND_DESIGN_ADAPTER_VERSION = '1.0.0'
export const BRAND_DESIGN_SNAPSHOT_SCHEMA_VERSION = '1.0.0'
export const BRAND_DESIGN_SKILL_ID = 'design-md' as const

/** Teto rígido do corpo baixado no modo URL (1 MB), aplicado durante o download. */
export const BRAND_DESIGN_URL_MAX_BYTES = 1_000_000
/** Máximo de saltos de redirect no modo URL — cada um é revalidado como público. */
export const BRAND_DESIGN_URL_MAX_REDIRECTS = 4
/** Amostra de texto visível sanitizado no snapshot de URL. */
export const BRAND_DESIGN_URL_TEXT_SAMPLE_MAX = 6_000
/** Amostra de CSS sanitizado no snapshot de URL. */
export const BRAND_DESIGN_URL_CSS_SAMPLE_MAX = 8_000

export const MOODBOARD_MIN_IMAGES = 1
export const MOODBOARD_MAX_IMAGES = 5
/** Teto de bytes por imagem do moodboard (8 MiB). */
export const MOODBOARD_MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MOODBOARD_ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
/** Guarda anti-bomba: recusa decodificar imagens com dimensão acima disto. */
export const BRAND_DESIGN_MAX_IMAGE_DIMENSION = 12_000
/** Máximo de swatches por paleta (dominante e agregada). */
export const BRAND_DESIGN_MAX_PALETTE_SWATCHES = 8

export type BrandDesignMode = 'url' | 'moodboard'
export type MoodboardMime = (typeof MOODBOARD_ALLOWED_MIME_TYPES)[number]

/**
 * Variantes de entrada de imagem do moodboard. `inline` (bytes) e `base64` são
 * autocontidas; `path` é resolvida SOMENTE dentro de `confinementRoot` (o
 * caminho real, com symlinks resolvidos, precisa ficar sob a raiz confinada).
 */
export const moodboardImageInputSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('inline'), bytes: z.instanceof(Uint8Array) }).strict(),
  z.object({ kind: z.literal('base64'), data: z.string().min(1).max(16_000_000) }).strict(),
  z.object({ kind: z.literal('path'), path: z.string().trim().min(1).max(4_096) }).strict(),
])
export type MoodboardImageInput = z.infer<typeof moodboardImageInputSchema>
export type MoodboardImageOrigin = MoodboardImageInput['kind']

export const brandDesignUrlRequestSchema = z
  .object({
    mode: z.literal('url'),
    url: z.string().trim().min(1).max(2_048),
    maxBytes: z
      .number()
      .int()
      .min(1_024)
      .max(BRAND_DESIGN_URL_MAX_BYTES)
      .default(BRAND_DESIGN_URL_MAX_BYTES),
  })
  .strict()

export const brandDesignMoodboardRequestSchema = z
  .object({
    mode: z.literal('moodboard'),
    images: z.array(moodboardImageInputSchema).min(MOODBOARD_MIN_IMAGES).max(MOODBOARD_MAX_IMAGES),
    /** Raiz confinada obrigatória quando alguma imagem vier por `path`. */
    confinementRoot: z.string().trim().min(1).max(4_096).optional(),
    maxImageBytes: z
      .number()
      .int()
      .min(1_024)
      .max(MOODBOARD_MAX_IMAGE_BYTES)
      .default(MOODBOARD_MAX_IMAGE_BYTES),
  })
  .strict()

// zod v3 exige ZodObject puro nos membros do discriminatedUnion — a regra
// cruzada "path exige confinementRoot" é aplicada fail-closed no adapter.
export const brandDesignRequestSchema = z.discriminatedUnion('mode', [
  brandDesignUrlRequestSchema,
  brandDesignMoodboardRequestSchema,
])

export type BrandDesignUrlRequest = z.infer<typeof brandDesignUrlRequestSchema>
export type BrandDesignMoodboardRequest = z.infer<typeof brandDesignMoodboardRequestSchema>
export type BrandDesignRequest = z.infer<typeof brandDesignRequestSchema>

/** Cor dominante: hex `#rrggbb` minúsculo + peso aproximado (fração 0..1). */
export interface BrandDesignPaletteSwatch {
  hex: string
  weight: number
}

/**
 * Estado da paleta por imagem:
 *   - `decoded`                    → pixels decodificados localmente (PNG).
 *   - `unavailable-without-decoder`→ formato válido, mas sem decoder local
 *     (JPEG/WebP) — NÃO inventamos cores; a paleta fica vazia com motivo.
 *   - `unsupported`                → variação do formato não suportada localmente
 *     (ex.: PNG entrelaçado), também sem invenção.
 */
export type MoodboardPaletteStatus = 'decoded' | 'unavailable-without-decoder' | 'unsupported'

/**
 * Resumo PÚBLICO de uma imagem do moodboard. Seguro para persistir/expor:
 * sem bytes, sem caminho absoluto, sem PII. A identidade é content-addressed.
 */
export interface MoodboardImageSummary {
  imageId: string
  ordinal: number
  origin: MoodboardImageOrigin
  mimeType: MoodboardMime
  byteSize: number
  sha256: string
  width: number
  height: number
  paletteStatus: MoodboardPaletteStatus
  palette: BrandDesignPaletteSwatch[]
  paletteNote: string | null
}

export interface MoodboardSummaryCore {
  imageCount: number
  decodedImageCount: number
  images: MoodboardImageSummary[]
  aggregatePalette: BrandDesignPaletteSwatch[]
}

export interface BrandDesignUrlSummaryCore {
  /** URL final sanitizada: protocolo//host/caminho, sem userinfo/query/fragment. */
  finalUrl: string
  title: string | null
  byteSize: number
  truncated: boolean
  redirectCount: number
  /** Texto visível sanitizado (sem tags/scripts, PII redigida), capado. */
  textSample: string
  /** CSS embutido sanitizado (sem @import/url() perigosos), capado. */
  cssSample: string
  /** Cores heurísticas extraídas do CSS/estilo inline, normalizadas e dedup. */
  colors: string[]
  /** Famílias de fonte heurísticas extraídas do CSS, dedup. */
  fontFamilies: string[]
}

export interface BrandDesignSnapshotCore {
  schemaVersion: string
  adapterVersion: string
  skillId: typeof BRAND_DESIGN_SKILL_ID
  mode: BrandDesignMode
  projectId: string
  fingerprint: string
  collectedAt: string
  frozenAt: string
  url: BrandDesignUrlSummaryCore | null
  moodboard: MoodboardSummaryCore | null
  warnings: string[]
}

export interface BrandDesignSnapshot extends BrandDesignSnapshotCore {
  contentHash: string
}

export interface BrandDesignCollectionResult {
  snapshot: BrandDesignSnapshot
  cacheHit: boolean
  snapshotPath: string
}

/** Serialização canônica com chaves ordenadas — base estável do hash. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function brandDesignUrlFingerprint(input: {
  projectId: string
  url: string
  maxBytes: number
}): string {
  return createHash('sha256')
    .update(
      stableJson({
        adapterVersion: BRAND_DESIGN_ADAPTER_VERSION,
        skillId: BRAND_DESIGN_SKILL_ID,
        mode: 'url',
        ...input,
      }),
    )
    .digest('hex')
}

export function brandDesignMoodboardFingerprint(input: {
  projectId: string
  /** sha256 de cada imagem, na ordem recebida. */
  imageHashes: string[]
}): string {
  return createHash('sha256')
    .update(
      stableJson({
        adapterVersion: BRAND_DESIGN_ADAPTER_VERSION,
        skillId: BRAND_DESIGN_SKILL_ID,
        mode: 'moodboard',
        ...input,
      }),
    )
    .digest('hex')
}

export function brandDesignSnapshotHash(core: BrandDesignSnapshotCore): string {
  return createHash('sha256').update(stableJson(core)).digest('hex')
}

export function assertBrandDesignSnapshotIntegrity(snapshot: BrandDesignSnapshot): void {
  const { contentHash, ...core } = snapshot
  if (brandDesignSnapshotHash(core) !== contentHash) {
    throw new Error('Snapshot de marca corrompido: hash divergente.')
  }
}

/**
 * Normaliza uma cor CSS (hex 3/4/6/8, `rgb()/rgba()`, `hsl()/hsla()`) para
 * `#rrggbb` minúsculo. Descarta alpha (o design usa a cor sólida). `null` quando
 * não reconhece — nunca chuta.
 */
export function normalizeHexColor(raw: string): string | null {
  const value = raw.trim().toLowerCase()
  const hex = value.match(/^#([0-9a-f]{3,8})$/)
  if (hex) {
    const digits = hex[1]!
    if (digits.length === 3) return `#${digits.split('').map((d) => d + d).join('')}`
    if (digits.length === 4) return `#${digits.slice(0, 3).split('').map((d) => d + d).join('')}`
    if (digits.length === 6) return `#${digits}`
    if (digits.length === 8) return `#${digits.slice(0, 6)}`
    return null
  }
  const rgb = value.match(/^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)/)
  if (rgb) {
    const channel = (token: string): number | null => {
      const isPct = token.endsWith('%')
      const num = Number(isPct ? token.slice(0, -1) : token)
      if (!Number.isFinite(num)) return null
      const scaled = isPct ? (num / 100) * 255 : num
      return Math.max(0, Math.min(255, Math.round(scaled)))
    }
    const channels = [rgb[1]!, rgb[2]!, rgb[3]!].map(channel)
    if (channels.some((c) => c === null)) return null
    return toHex(channels as number[])
  }
  const hsl = value.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/)
  if (hsl) {
    const h = ((Number(hsl[1]) % 360) + 360) % 360
    const s = Math.max(0, Math.min(100, Number(hsl[2]))) / 100
    const l = Math.max(0, Math.min(100, Number(hsl[3]))) / 100
    if (![h, s, l].every(Number.isFinite)) return null
    return toHex(hslToRgb(h, s, l))
  }
  return null
}

function toHex(channels: number[]): string {
  return `#${channels.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')}`
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

/**
 * Bloco de guarda AUTORITATIVO injetado no Codex. Espelha o padrão do
 * `external-research`: o snapshot congelado é a única evidência visual válida;
 * o modelo não pode inventar cores/tokens nem afirmar que "acessou o site".
 */
export function buildBrandDesignGuard(snapshot: BrandDesignSnapshot): string {
  const lines = [
    'SNAPSHOT DE MARCA CONGELADO: use somente a evidência visual literal abaixo para autorar o DESIGN.md.',
    'Não invente cores, tipografia ou tokens fora deste snapshot; não afirme ter acessado o site ou as imagens além do que está registrado.',
    'Paleta marcada como indisponível continua indisponível — declare a lacuna em Known Gaps, não fabrique cores.',
    `Modo: ${snapshot.mode}. Fingerprint: ${snapshot.fingerprint}. Hash: ${snapshot.contentHash}.`,
    stableJson(snapshot),
  ]
  return lines.join('\n')
}
