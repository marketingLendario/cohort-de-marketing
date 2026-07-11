import { isIP } from 'node:net'
import { lookup } from 'node:dns/promises'

const APIFY_API = 'https://api.apify.com/v2'
const META_API = 'https://graph.facebook.com/v21.0/ads_archive'

function cleanError(error) {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/(?:apify_api_|EAAG)[A-Za-z0-9_-]{12,}/g, '[redacted]')
    .replace(/([?&](?:token|access_token)=)[^&\s]+/gi, '$1[redacted]')
    .slice(0, 1_000)
}

function privateHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized.endsWith('.local')) return true
  if (isIP(normalized) === 4) {
    const [a, b] = normalized.split('.').map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
  }
  if (isIP(normalized) === 6) return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')
  return false
}

async function assertPublicUrl(raw) {
  const url = new URL(raw)
  if (url.protocol !== 'https:') throw new Error('Somente URLs HTTPS públicas são permitidas.')
  if (url.username || url.password || privateHostname(url.hostname)) throw new Error('URL privada ou autenticada não permitida.')
  const addresses = await lookup(url.hostname, { all: true, verbatim: true })
  if (addresses.length === 0 || addresses.some(({ address }) => privateHostname(address))) {
    throw new Error('URL resolveu para uma rede privada ou inválida.')
  }
  return url
}

function apifyDefinition(source) {
  const target = source.target.trim()
  if (source.kind === 'google-search') return {
    actor: 'apify~google-search-scraper',
    payload: { queries: target, maxPagesPerQuery: 1, resultsPerPage: source.limit, countryCode: 'br', includeUnfilteredResults: false },
  }
  if (source.kind === 'instagram-profile') {
    const username = target.includes('instagram.com/') ? target.split('instagram.com/')[1].split('/')[0] : target.replace(/^@/, '')
    return { actor: 'apify~instagram-post-scraper', payload: { username: [username], resultsLimit: source.limit, dataDetailLevel: 'basicData', onlyPostsNewerThan: '6 months' } }
  }
  if (source.kind === 'instagram-hashtag') return {
    actor: 'apify~instagram-scraper',
    payload: { directUrls: [`https://www.instagram.com/explore/tags/${target.replace(/^#/, '')}/`], resultsType: 'posts', resultsLimit: source.limit, searchLimit: 1 },
  }
  if (source.kind === 'tiktok-profile') return {
    actor: 'clockworks~free-tiktok-scraper',
    payload: { profiles: [target.replace(/^@/, '')], resultsPerPage: source.limit, shouldDownloadVideos: false, shouldDownloadCovers: false },
  }
  if (source.kind === 'tiktok-hashtag') return {
    actor: 'clockworks~free-tiktok-scraper',
    payload: { hashtags: [target.replace(/^#/, '')], resultsPerPage: source.limit, shouldDownloadVideos: false, shouldDownloadCovers: false },
  }
  throw new Error(`Fonte Apify não permitida: ${source.kind}`)
}

function normalizeItem(item, index) {
  const record = item && typeof item === 'object' ? item : { value: item }
  const text = record.caption ?? record.text ?? record.description ?? record.title ?? record.snippet ?? JSON.stringify(record)
  return {
    sourceItemId: String(record.id ?? record.postId ?? record.videoId ?? record.url ?? index + 1),
    url: typeof (record.url ?? record.postUrl ?? record.webVideoUrl) === 'string' ? (record.url ?? record.postUrl ?? record.webVideoUrl) : null,
    publishedAt: typeof (record.timestamp ?? record.createTimeISO ?? record.publishedAt) === 'string' ? (record.timestamp ?? record.createTimeISO ?? record.publishedAt) : null,
    author: typeof (record.ownerUsername ?? record.authorMeta?.name ?? record.channelName ?? record.page_name) === 'string' ? (record.ownerUsername ?? record.authorMeta?.name ?? record.channelName ?? record.page_name) : null,
    text: String(text).slice(0, 20_000),
    metrics: {
      views: record.videoViewCount ?? record.playCount ?? record.views ?? null,
      likes: record.likesCount ?? record.diggCount ?? record.likes ?? null,
      comments: record.commentsCount ?? record.commentCount ?? record.comments ?? null,
      shares: record.sharesCount ?? record.shareCount ?? record.shares ?? null,
    },
    literal: record,
  }
}

async function fetchJson(url, options, timeoutMs = 300_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, redirect: 'manual' })
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 400)}`)
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

async function collectApify(source) {
  const token = (process.env.APIFY_API_TOKEN ?? process.env.APIFY_API_KEY ?? '').trim()
  if (!token) throw new Error('APIFY_API_TOKEN não configurado no processo coletor.')
  const { actor, payload } = apifyDefinition(source)
  const url = `${APIFY_API}/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=280`
  const items = await fetchJson(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  if (!Array.isArray(items)) throw new Error('Apify não devolveu uma lista de itens.')
  return items.slice(0, source.limit).map(normalizeItem)
}

async function collectMeta(source) {
  const token = (process.env.META_AD_LIBRARY_TOKEN ?? '').trim()
  if (!token) throw new Error('META_AD_LIBRARY_TOKEN não configurado no processo coletor.')
  const params = new URLSearchParams({
    access_token: token,
    search_terms: source.target,
    ad_reached_countries: JSON.stringify(['BR']),
    ad_active_status: 'ACTIVE',
    fields: 'ad_creative_bodies,ad_creative_link_titles,ad_creative_link_descriptions,page_name,ad_delivery_start_time',
    limit: String(source.limit),
  })
  const payload = await fetchJson(`${META_API}?${params}`, { method: 'GET' }, 30_000)
  return (Array.isArray(payload.data) ? payload.data : []).slice(0, source.limit).map(normalizeItem)
}

async function collectPublicUrl(source) {
  let url = await assertPublicUrl(source.target)
  for (let redirect = 0; redirect < 4; redirect += 1) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000), headers: { accept: 'text/plain,text/html,application/json' } })
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      url = await assertPublicUrl(new URL(response.headers.get('location'), url).toString())
      continue
    }
    if (!response.ok) throw new Error(`HTTP ${response.status} ao coletar URL pública.`)
    const length = Number(response.headers.get('content-length') ?? 0)
    if (length > 1_000_000) throw new Error('Fonte pública excede o limite de 1 MB.')
    const text = (await response.text()).slice(0, 1_000_000)
    return [{ sourceItemId: url.toString(), url: url.toString(), publishedAt: null, author: null, text, metrics: {}, literal: text }]
  }
  throw new Error('Fonte pública excedeu o limite de redirecionamentos.')
}

async function collectSource(source) {
  const startedAt = new Date().toISOString()
  try {
    const items = source.provider === 'apify'
      ? await collectApify(source)
      : source.provider === 'meta'
        ? await collectMeta(source)
        : await collectPublicUrl(source)
    return { sourceId: source.id, provider: source.provider, kind: source.kind, target: source.target, status: 'completed', startedAt, completedAt: new Date().toISOString(), itemCount: items.length, items, failure: null }
  } catch (error) {
    return { sourceId: source.id, provider: source.provider, kind: source.kind, target: source.target, status: 'failed', startedAt, completedAt: new Date().toISOString(), itemCount: 0, items: [], failure: cleanError(error) }
  }
}

let input = ''
for await (const chunk of process.stdin) input += chunk
const request = JSON.parse(input)
const results = []
for (const source of request.sources ?? []) results.push(await collectSource(source))
process.stdout.write(JSON.stringify({ sources: results }))
