import { createHash } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { z } from 'zod'
import { intakeMedia, type MediaIntakeManifest } from './media-intake.js'
import { transcribeMedia, type TranscriptionManifest } from './transcription.js'

const sourceSchema = z.discriminatedUnion('origin', [
  z.object({ origin: z.literal('url'), url: z.string().url().max(4_000) }).strict(),
  z.object({
    origin: z.literal('file'),
    path: z.string().min(1).max(4_000),
    confinementRoot: z.string().min(1).max(4_000),
    declaredMimeType: z.string().max(120).optional(),
  }).strict(),
])

export const mediaIntakeRequestSchema = z.object({
  items: z.array(z.object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/i),
    role: z.enum(['voice', 'reference-content', 'competitor-ad']),
    source: sourceSchema,
    pastedTranscript: z.string().max(1_000_000).optional(),
    language: z.string().trim().min(2).max(20).default('pt'),
  }).strict()).min(1).max(6),
}).strict()

export interface MediaSnapshotItem {
  id: string
  role: 'voice' | 'reference-content' | 'competitor-ad'
  media: MediaIntakeManifest
  transcription: TranscriptionManifest
}

export interface MediaIntakeSnapshot {
  schemaVersion: '1.0.0'
  skillId: 'conteudo-funil' | 'criativos-funil'
  items: MediaSnapshotItem[]
  contentHash: string
}

export async function collectMediaIntake(input: {
  skillId: 'conteudo-funil' | 'criativos-funil'
  request: unknown
  runtimeRoot: string
  signal?: AbortSignal
}): Promise<MediaIntakeSnapshot> {
  const request = mediaIntakeRequestSchema.parse(input.request)
  const runRoot = resolve(input.runtimeRoot, `${input.skillId}-${createHash('sha256').update(JSON.stringify(request)).digest('hex').slice(0, 16)}`)
  const items: MediaSnapshotItem[] = []
  try {
    for (const item of request.items) {
      const media = await intakeMedia(item.source, { runtimeRoot: runRoot, signal: input.signal })
      const transcription = await transcribeMedia({
        mediaPath: media.localPath,
        mediaSha256: media.manifest.sha256,
        pastedTranscript: item.pastedTranscript,
        language: item.language,
        signal: input.signal,
      })
      items.push({ id: item.id, role: item.role, media: media.manifest, transcription })
    }
    const core = { schemaVersion: '1.0.0' as const, skillId: input.skillId, items }
    const contentHash = createHash('sha256').update(JSON.stringify(core)).digest('hex')
    return { ...core, contentHash }
  } finally {
    await rm(runRoot, { recursive: true, force: true })
  }
}
