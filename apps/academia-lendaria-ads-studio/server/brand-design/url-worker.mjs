/**
 * Subprocesso isolado do modo `url` do `design-md`.
 *
 * Roda como processo separado (spawnado com o binário do Node) exatamente pelo
 * mesmo motivo do coletor de pesquisa externa: isolar a rede e a defesa SSRF do
 * runtime principal. Lê um pedido em JSON do stdin e escreve `{ ok, summary }`
 * (ou `{ ok:false, error }`) em JSON no stdout.
 *
 * Ações:
 *   - `fetch`   → baixa uma URL HTTPS **pública** com defesa SSRF fail-closed
 *     (esquema, userinfo, host privado, resolução DNS e CADA salto de redirect),
 *     teto de 1 MB aplicado durante o streaming, e extrai texto/CSS SANITIZADOS
 *     + tokens crus de cor/fonte.
 *   - `extract` → só extrai a partir de um HTML já em mãos (sem rede). É o mesmo
 *     caminho de sanitização, exercitado de forma determinística nos testes.
 *
 * A normalização de cor e a montagem do snapshot autoritativo ficam no adapter
 * (`contracts.ts`), para serem type-checked e testadas em TS.
 */
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { pathToFileURL } from 'node:url'

const URL_MAX_BYTES = 1_000_000
const URL_MAX_REDIRECTS = 4
const REQUEST_TIMEOUT_MS = 30_000
const TEXT_SAMPLE_MAX = 6_000
const CSS_SAMPLE_MAX = 8_000
const MAX_RAW_COLORS = 60
const MAX_RAW_FONTS = 20

function cleanError(error) {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 1_000)
}

/** `true` para hosts que não devem ser alcançáveis externamente. */
export function isPrivateHostname(hostname) {
  const normalized = String(hostname).trim().toLowerCase().replace(/^\[|\]$/g, '')
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
      normalized.startsWith('::ffff:') // IPv4-mapeado
    )
  }
  return false
}

/** URL pública sanitizada: protocolo//host/caminho, sem userinfo/query/fragment. */
export function sanitizeUrl(raw) {
  const url = raw instanceof URL ? raw : new URL(raw)
  return `${url.protocol}//${url.host}${url.pathname}`
}

/** Garante URL HTTPS pública e barra resolução DNS para faixa privada. */
export async function assertPublicHttpsUrl(raw, dnsLookup = lookup) {
  let url
  try {
    url = raw instanceof URL ? raw : new URL(raw)
  } catch {
    throw new Error('URL de referência inválida.')
  }
  if (url.protocol !== 'https:') throw new Error('Somente URLs HTTPS públicas são permitidas.')
  if (url.username || url.password) throw new Error('URL com credenciais embutidas não é permitida.')
  if (isPrivateHostname(url.hostname)) throw new Error('URL aponta para host privado ou interno.')
  let addresses
  try {
    addresses = await dnsLookup(url.hostname, { all: true, verbatim: true })
  } catch {
    throw new Error('Não foi possível resolver o host da URL de referência.')
  }
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateHostname(address))) {
    throw new Error('URL resolveu para uma rede privada ou inválida.')
  }
  return url
}

function decodeBasicEntities(text) {
  return text
    .replace(/&(?:amp);/gi, '&')
    .replace(/&(?:lt);/gi, '<')
    .replace(/&(?:gt);/gi, '>')
    .replace(/&(?:quot);/gi, '"')
    .replace(/&(?:#39|apos);/gi, "'")
    .replace(/&(?:nbsp);/gi, ' ')
}

function redactPii(text) {
  return text
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '[email]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[telefone]')
}

/** Extrai o texto visível sanitizado: sem script/style, sem tags, PII redigida. */
export function sanitizeText(html) {
  const withoutBlocks = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
  const stripped = withoutBlocks.replace(/<[^>]+>/g, ' ')
  const decoded = decodeBasicEntities(stripped)
  const collapsed = decoded.replace(/\s+/g, ' ').trim()
  return redactPii(collapsed).slice(0, TEXT_SAMPLE_MAX)
}

/** Extrai o CSS embutido (blocos <style> + estilos inline) sanitizado. */
export function extractCss(html) {
  const parts = []
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) parts.push(match[1] ?? '')
  for (const match of html.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)) parts.push(match[1] ?? '')
  for (const match of html.matchAll(/\sstyle\s*=\s*'([^']*)'/gi)) parts.push(match[1] ?? '')
  const css = parts.join('\n')
  const sanitized = css
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // comentários
    .replace(/@import[^;]+;/gi, ' ') // sem buscar folhas externas (superfície SSRF)
    .replace(/url\(\s*['"]?\s*(?:javascript|data|vbscript):[^)]*\)/gi, 'url()')
  return sanitized.replace(/\s+/g, ' ').trim().slice(0, CSS_SAMPLE_MAX)
}

function dedupeCap(values, cap) {
  const seen = new Set()
  const out = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(value)
    if (out.length >= cap) break
  }
  return out
}

/** Tokens de cor CRUS (hex/rgb/hsl) do CSS/estilo — a normalização é do adapter. */
export function extractColors(css) {
  const matches = [
    ...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g),
    ...css.matchAll(/rgba?\([^)]*\)/gi),
    ...css.matchAll(/hsla?\([^)]*\)/gi),
  ].map((match) => match[0].trim())
  return dedupeCap(matches, MAX_RAW_COLORS)
}

/** Famílias de fonte cruas declaradas em `font-family`/`@font-face`. */
export function extractFontFamilies(css) {
  const families = []
  for (const match of css.matchAll(/font-family\s*:\s*([^;{}]+)/gi)) {
    for (const token of (match[1] ?? '').split(',')) {
      const cleaned = token.replace(/["']/g, '').trim()
      if (cleaned && !/^(?:inherit|initial|unset|var\(|-)/i.test(cleaned)) families.push(cleaned)
    }
  }
  return dedupeCap(families, MAX_RAW_FONTS)
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!match) return null
  const title = decodeBasicEntities(match[1] ?? '').replace(/\s+/g, ' ').trim()
  return title ? title.slice(0, 300) : null
}

/** Monta o resumo cru (pré-normalização) a partir de um HTML já em mãos. */
export function buildUrlSummary(html, options) {
  const css = extractCss(html)
  return {
    finalUrl: options.finalUrl,
    title: extractTitle(html),
    byteSize: options.byteSize,
    truncated: options.truncated ?? false,
    redirectCount: options.redirectCount ?? 0,
    textSample: sanitizeText(html),
    cssSample: css,
    rawColors: extractColors(css),
    rawFontFamilies: extractFontFamilies(css),
  }
}

async function fetchPublicUrl(rawUrl, maxBytes) {
  let current = await assertPublicHttpsUrl(rawUrl)
  let redirectCount = 0
  for (let hop = 0; hop <= URL_MAX_REDIRECTS; hop += 1) {
    const response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { accept: 'text/html,application/xhtml+xml,text/plain' },
    })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new Error('Redirect sem cabeçalho Location.')
      // Revalida CADA salto: redirect para http:// ou rede privada é barrado aqui.
      current = await assertPublicHttpsUrl(new URL(location, current))
      redirectCount += 1
      continue
    }
    if (!response.ok) throw new Error(`HTTP ${response.status} ao coletar a URL de referência.`)
    const declared = Number(response.headers.get('content-length') ?? '')
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new Error('Fonte de referência anuncia tamanho acima de 1 MB.')
    }
    const chunks = []
    let received = 0
    let truncated = false
    if (response.body) {
      for await (const chunk of response.body) {
        const remaining = maxBytes - received
        if (chunk.length >= remaining) {
          chunks.push(chunk.subarray(0, remaining))
          received += remaining
          truncated = true
          break
        }
        chunks.push(chunk)
        received += chunk.length
      }
    }
    const html = Buffer.concat(chunks).toString('utf8')
    return buildUrlSummary(html, {
      finalUrl: sanitizeUrl(current),
      byteSize: received,
      truncated,
      redirectCount,
    })
  }
  throw new Error('URL de referência excedeu o limite de redirecionamentos.')
}

async function main() {
  let input = ''
  for await (const chunk of process.stdin) input += chunk
  try {
    const request = JSON.parse(input)
    if (request.action === 'extract') {
      const html = String(request.html ?? '')
      const summary = buildUrlSummary(html, {
        finalUrl: request.finalUrl ? sanitizeUrl(request.finalUrl) : 'https://exemplo.local/',
        byteSize: Buffer.byteLength(html),
        truncated: Boolean(request.truncated),
        redirectCount: Number(request.redirectCount ?? 0),
      })
      process.stdout.write(JSON.stringify({ ok: true, summary }))
      return
    }
    if (request.action === 'fetch') {
      const maxBytes = Math.min(Number(request.maxBytes ?? URL_MAX_BYTES) || URL_MAX_BYTES, URL_MAX_BYTES)
      const summary = await fetchPublicUrl(String(request.url ?? ''), maxBytes)
      process.stdout.write(JSON.stringify({ ok: true, summary }))
      return
    }
    process.stdout.write(JSON.stringify({ ok: false, error: 'Ação de worker desconhecida.' }))
  } catch (error) {
    process.stdout.write(JSON.stringify({ ok: false, error: cleanError(error) }))
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
