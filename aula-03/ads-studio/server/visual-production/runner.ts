import { createHash } from 'node:crypto'
import { z } from 'zod'
import type {
  LocalSkillRunner,
  LocalSkillRunInput,
  LocalSkillRunOptions,
  LocalSkillRunResult,
} from '../local-skill-runner.js'
import {
  CREATIVE_FACTORY_SKILL_ID,
  creativeArchetypeSchema,
  creativeFormatSchema,
  likenessAuthorizationSchema,
} from '../creative-factory/runner.js'

export const VISUAL_PRODUCTION_SKILLS = ['criativos-funil', 'mockup-produto-funil'] as const
export type VisualProductionSkillId = (typeof VISUAL_PRODUCTION_SKILLS)[number]

export const visualProductionContextSchema = z.object({
  formats: z.array(creativeFormatSchema).min(1).max(3),
  archetypes: z.array(creativeArchetypeSchema).min(1).max(4).default(['dark_editorial']),
  variants: z.number().int().min(1).max(3).default(1),
  items: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]{1,120}$/i),
    title: z.string().trim().min(1).max(240),
    description: z.string().trim().min(1).max(4_000),
  }).strict()).min(1).max(6),
  cta: z.string().trim().min(1).max(80).default('Saiba mais'),
  linkDescription: z.string().trim().max(180).optional(),
  personas: z.array(z.enum(['alan-nicolas', 'fran-martins', 'erica-souza', 'rafael-costa', 'bruno-gentil'])).max(5).default([]),
  likenessAuthorizations: z.array(likenessAuthorizationSchema).max(5).default([]),
}).strict()

export function isVisualProductionSkill(skillId: string): skillId is VisualProductionSkillId {
  return (VISUAL_PRODUCTION_SKILLS as readonly string[]).includes(skillId)
}

function combinedHash(left: string, right: string): string {
  return createHash('sha256').update(`${left}:${right}`).digest('hex')
}

export class VisualProductionLocalRunner implements LocalSkillRunner {
  private readonly canonicalRunner: LocalSkillRunner
  private readonly creativeRunner: LocalSkillRunner

  constructor(canonicalRunner: LocalSkillRunner, creativeRunner: LocalSkillRunner) {
    this.canonicalRunner = canonicalRunner
    this.creativeRunner = creativeRunner
  }

  async run(skillId: string, input: LocalSkillRunInput, options: LocalSkillRunOptions = {}): Promise<LocalSkillRunResult> {
    if (!isVisualProductionSkill(skillId)) throw new Error(`Adapter visual não atende ${skillId}.`)
    const context = visualProductionContextSchema.parse(input.context?.visualProduction)
    const canonical = await this.canonicalRunner.run(skillId, input, options)
    if (canonical.proposal.questions.length > 0) return canonical

    const archetypes = skillId === 'mockup-produto-funil' ? ['mockup_product'] as const : context.archetypes
    const creative = await this.creativeRunner.run(CREATIVE_FACTORY_SKILL_ID, {
      ...input,
      context: {
        ...input.context,
        creativeFactory: {
          campaignId: `${skillId}-${input.projectId}`.slice(0, 120),
          productionSkillId: skillId,
          formats: context.formats,
          archetypes,
          variants: context.variants,
          personas: context.personas,
          likenessAuthorizations: context.likenessAuthorizations,
          cta: context.cta,
          linkDescription: context.linkDescription,
          finalists: context.items.map((item) => ({
            id: item.id,
            hook: item.title,
            copy: item.description,
            format: context.formats.includes('story') ? 'reels-9x16' : 'feed',
          })),
        },
      },
    }, options)
    const batch = creative.proposal.artifacts.find((artifact) => artifact.artifactType === 'creativeFactoryBatch')
    if (!batch) throw new Error('A produção visual não devolveu manifesto binário revisável.')
    const manifest = JSON.parse(batch.content) as { items?: unknown[] }
    const count = Array.isArray(manifest.items) ? manifest.items.length : 0
    return {
      skillId,
      skillHash: combinedHash(canonical.skillHash, creative.skillHash),
      model: `${canonical.model}+${creative.model}`,
      proposal: {
        ...canonical.proposal,
        summary: `${canonical.proposal.summary} ${count} peça(s) visual(is) pronta(s) para seleção.`,
        resultMarkdown: `${canonical.proposal.resultMarkdown}\n\n## Produção visual\n\n${count} peça(s) PNG passaram pelo pipeline e aguardam seleção humana.`,
        artifacts: [
          ...canonical.proposal.artifacts,
          { ...batch, title: skillId === 'mockup-produto-funil' ? 'Galeria de mockups' : 'Galeria de criativos' },
        ],
        fields: [...canonical.proposal.fields, ...creative.proposal.fields],
        questions: [],
        warnings: [...canonical.proposal.warnings, ...creative.proposal.warnings],
      },
    }
  }
}
