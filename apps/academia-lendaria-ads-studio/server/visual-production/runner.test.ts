import { describe, expect, it, vi } from 'vitest'
import { VisualProductionLocalRunner } from './runner.js'
import type { LocalSkillRunner, LocalSkillRunInput, LocalSkillRunResult } from '../local-skill-runner.js'

function result(skillId: string, artifacts: LocalSkillRunResult['proposal']['artifacts'] = []): LocalSkillRunResult {
  return {
    skillId,
    skillHash: `${skillId}-hash`,
    model: `${skillId}-model`,
    proposal: {
      summary: `${skillId} concluída.`, resultMarkdown: `# ${skillId}`, artifacts,
      fields: [], questions: [], warnings: [],
    },
  }
}

function input(): LocalSkillRunInput {
  return {
    projectId: 'project-1', brief: { project: { name: 'Teste' } },
    context: {
      visualProduction: {
        formats: ['feed', 'story', 'square'], archetypes: ['dark_editorial'], variants: 1,
        items: [{ id: 'piece-1', title: 'Pare de improvisar', description: 'Uma legenda completa e verificável.' }],
        cta: 'Saiba mais', personas: [], likenessAuthorizations: [],
      },
    },
  }
}

describe('VisualProductionLocalRunner', () => {
  it('executa a skill canônica antes da fábrica e preserva os dois artefatos', async () => {
    const order: string[] = []
    const canonical: LocalSkillRunner = { run: vi.fn(async (skillId) => {
      order.push(`canonical:${skillId}`)
      return result(skillId, [{ artifactType: 'adCreativeBatch', title: 'Roteiros', path: 'roteiros.md', format: 'markdown', content: '# Roteiros' }])
    }) }
    const creative: LocalSkillRunner = { run: vi.fn(async (skillId, creativeInput) => {
      order.push(`creative:${skillId}`)
      expect(creativeInput.context?.creativeFactory).toMatchObject({
        productionSkillId: 'criativos-funil', formats: ['feed', 'story', 'square'],
      })
      return result(skillId, [{
        artifactType: 'creativeFactoryBatch', title: 'Lote', path: 'manifest.json', format: 'json',
        content: JSON.stringify({ items: [{ id: 'piece-1' }] }),
      }])
    }) }

    const output = await new VisualProductionLocalRunner(canonical, creative).run('criativos-funil', input(), { jobId: 'job-1' })

    expect(order).toEqual(['canonical:criativos-funil', 'creative:ads-creative-factory'])
    expect(output.proposal.artifacts).toHaveLength(2)
    expect(output.proposal.summary).toContain('1 peça(s) visual(is)')
    expect(output.skillHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('força o arquétipo de mockup no adaptador de produto', async () => {
    const canonical: LocalSkillRunner = { run: async (skillId) => result(skillId) }
    const creative: LocalSkillRunner = { run: vi.fn(async (skillId, creativeInput) => {
      expect(creativeInput.context?.creativeFactory).toMatchObject({
        productionSkillId: 'mockup-produto-funil', archetypes: ['mockup_product'],
      })
      return result(skillId, [{
        artifactType: 'creativeFactoryBatch', title: 'Lote', path: 'manifest.json', format: 'json', content: '{"items":[]}',
      }])
    }) }

    const output = await new VisualProductionLocalRunner(canonical, creative).run('mockup-produto-funil', input())
    expect(output.proposal.artifacts.at(-1)).toMatchObject({ title: 'Galeria de mockups' })
  })

  it('não gera imagens enquanto a skill canônica ainda pede dados', async () => {
    const checkpoint = result('criativos-funil')
    checkpoint.proposal.questions = ['Qual é o produto?']
    const creative: LocalSkillRunner = { run: vi.fn() }

    const output = await new VisualProductionLocalRunner({ run: async () => checkpoint }, creative).run('criativos-funil', input())

    expect(output).toBe(checkpoint)
    expect(creative.run).not.toHaveBeenCalled()
  })
})
