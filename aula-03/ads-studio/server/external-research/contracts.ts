import { createHash } from 'node:crypto'
import { z } from 'zod'

export const EXTERNAL_RESEARCH_SKILLS = [
  'avatar-funil',
  'espiao-do-concorrente',
  'trend-hunting',
  'conteudo-funil',
] as const

export const EXTERNAL_RESEARCH_ADAPTER_VERSION = '1.0.2'

export type ExternalResearchSkillId = (typeof EXTERNAL_RESEARCH_SKILLS)[number]

export const externalResearchSourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/i),
  provider: z.enum(['apify', 'meta', 'public-url']),
  kind: z.enum([
    'google-search',
    'instagram-profile',
    'instagram-hashtag',
    'tiktok-profile',
    'tiktok-hashtag',
    'meta-ad-library',
    'public-url',
  ]),
  target: z.string().trim().min(1).max(2_000),
  limit: z.number().int().min(1).max(30).default(10),
}).strict()

export const externalResearchRequestSchema = z.object({
  mode: z.enum(['network', 'offline', 'hybrid']),
  query: z.string().trim().max(1_000).optional(),
  pastedMaterial: z.string().max(128_000).optional(),
  pastedSourceLabel: z.string().trim().max(200).optional(),
  sources: z.array(externalResearchSourceSchema).max(8).default([]),
  maxBillableCalls: z.number().int().min(0).max(8).default(4),
}).strict().superRefine((value, context) => {
  if (value.mode === 'offline' && !value.pastedMaterial?.trim()) {
    context.addIssue({ code: 'custom', path: ['pastedMaterial'], message: 'O modo offline exige material colado.' })
  }
  if (value.mode === 'network' && value.sources.length === 0) {
    context.addIssue({ code: 'custom', path: ['sources'], message: 'O modo rede exige ao menos uma fonte.' })
  }
  if (value.mode === 'hybrid' && (!value.pastedMaterial?.trim() || value.sources.length === 0)) {
    context.addIssue({ code: 'custom', path: ['mode'], message: 'O modo híbrido exige material colado e ao menos uma fonte.' })
  }
  if (value.sources.length > value.maxBillableCalls) {
    context.addIssue({ code: 'custom', path: ['maxBillableCalls'], message: 'As fontes excedem o teto de chamadas faturáveis.' })
  }
  for (const source of value.sources) {
    if (source.provider === 'apify' && !source.kind.startsWith('instagram-') && !source.kind.startsWith('tiktok-') && source.kind !== 'google-search') {
      context.addIssue({ code: 'custom', path: ['sources'], message: `${source.id} não é uma fonte Apify permitida.` })
    }
    if (source.provider === 'meta' && source.kind !== 'meta-ad-library') {
      context.addIssue({ code: 'custom', path: ['sources'], message: `${source.id} não é uma fonte Meta permitida.` })
    }
    if (source.provider === 'public-url' && source.kind !== 'public-url') {
      context.addIssue({ code: 'custom', path: ['sources'], message: `${source.id} não é uma URL pública permitida.` })
    }
  }
})

export type ExternalResearchRequest = z.infer<typeof externalResearchRequestSchema>
export type ExternalResearchSource = z.infer<typeof externalResearchSourceSchema>

export interface ExternalResearchItem {
  sourceItemId: string
  url: string | null
  publishedAt: string | null
  author: string | null
  text: string
  metrics: Record<string, number | string | null>
  literal: unknown
}

export interface ExternalResearchSourceResult {
  sourceId: string
  provider: ExternalResearchSource['provider'] | 'operator'
  kind: ExternalResearchSource['kind'] | 'pasted-material'
  target: string
  status: 'completed' | 'failed'
  startedAt: string
  completedAt: string
  itemCount: number
  items: ExternalResearchItem[]
  failure: string | null
}

export interface ExternalResearchSnapshotCore {
  schemaVersion: '1.0.0'
  adapterVersion: string
  skillId: ExternalResearchSkillId
  projectId: string
  mode: ExternalResearchRequest['mode']
  query: string | null
  fingerprint: string
  collectedAt: string
  frozenAt: string
  sources: ExternalResearchSourceResult[]
  quota: {
    maxBillableCalls: number
    attemptedBillableCalls: number
    completedBillableCalls: number
    maxItemsPerSource: number
  }
  failures: Array<{ sourceId: string; reason: string }>
}

export interface ExternalResearchSnapshot extends ExternalResearchSnapshotCore {
  contentHash: string
}

export interface ExternalResearchCollectionResult {
  snapshot: ExternalResearchSnapshot
  cacheHit: boolean
  snapshotPath: string
}

export function isExternalResearchSkill(skillId: string): skillId is ExternalResearchSkillId {
  return (EXTERNAL_RESEARCH_SKILLS as readonly string[]).includes(skillId)
}

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

export function researchFingerprint(input: {
  skillId: ExternalResearchSkillId
  projectId: string
  request: ExternalResearchRequest
}): string {
  return createHash('sha256').update(stableJson({ adapterVersion: EXTERNAL_RESEARCH_ADAPTER_VERSION, ...input })).digest('hex')
}

export function snapshotHash(snapshot: ExternalResearchSnapshotCore): string {
  return createHash('sha256').update(stableJson(snapshot)).digest('hex')
}

export function assertSnapshotIntegrity(snapshot: ExternalResearchSnapshot): void {
  const { contentHash, ...core } = snapshot
  if (snapshotHash(core) !== contentHash) throw new Error('Snapshot de pesquisa externa corrompido: hash divergente.')
}
