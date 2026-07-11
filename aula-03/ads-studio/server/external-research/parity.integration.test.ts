import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { CachedExternalResearchAdapter } from './adapter.js'
import { CodexCliLocalSkillRunner, type SkillProposal } from '../local-skill-runner.js'
import type { ExternalResearchSkillId, ExternalResearchSourceResult } from './contracts.js'

const cases: Array<{ skillId: ExternalResearchSkillId; artifactType: string }> = [
  { skillId: 'avatar-funil', artifactType: 'avatar' },
  { skillId: 'espiao-do-concorrente', artifactType: 'competitorDossier' },
  { skillId: 'trend-hunting', artifactType: 'trendReport' },
  { skillId: 'conteudo-funil', artifactType: 'content' },
]

const runtimeRoot = await mkdtemp(resolve(tmpdir(), 'external-research-parity-'))

afterAll(async () => {
  await rm(runtimeRoot, { recursive: true, force: true })
})

function collectedSource(skillId: string): ExternalResearchSourceResult {
  return {
    sourceId: 'fixture-source',
    provider: 'apify',
    kind: 'google-search',
    target: `fonte literal ${skillId}`,
    status: 'completed',
    startedAt: '2026-07-11T12:00:00.000Z',
    completedAt: '2026-07-11T12:00:01.000Z',
    itemCount: 1,
    items: [{
      sourceItemId: `${skillId}-1`,
      url: `https://fixture.local/${skillId}`,
      publishedAt: '2026-07-10T12:00:00.000Z',
      author: 'Fonte pública fixture',
      text: `Trecho literal coletado para ${skillId}.`,
      metrics: { views: 100 },
      literal: { text: `Trecho literal coletado para ${skillId}.`, views: 100 },
    }],
    failure: null,
  }
}

describe.each(cases)('external research panel/CLI parity — $skillId', ({ skillId, artifactType }) => {
  it('reuses one frozen collection and emits the same authoritative manifest on both surfaces', async () => {
    const executeCollector = vi.fn(async () => ({ sources: [collectedSource(skillId)] }))
    const adapter = new CachedExternalResearchAdapter({ runtimeRoot, executeCollector })
    const execute = vi.fn(async ({ outputPath }: { outputPath: string }) => {
      await writeFile(outputPath, JSON.stringify({
        summary: `${skillId} concluída com fonte literal.`,
        resultMarkdown: `# ${skillId}`,
        artifacts: [{ artifactType, title: skillId, path: `${skillId}.md`, format: 'markdown', content: `# ${skillId}` }],
        fields: [],
        questions: [],
        warnings: [],
      } satisfies SkillProposal))
    })
    const runner = new CodexCliLocalSkillRunner({
      repoRoot: new URL('../../../../', import.meta.url).pathname,
      execute,
      externalResearch: adapter,
    })
    const request = {
      mode: 'network',
      query: `fonte literal ${skillId}`,
      sources: [{ id: 'fixture-source', provider: 'apify', kind: 'google-search', target: `fonte literal ${skillId}`, limit: 3 }],
      maxBillableCalls: 1,
    }
    const input = { projectId: `parity-${skillId}`, brief: {}, context: { externalResearch: request } }
    const panel = await runner.run(skillId, input)
    const cli = await runner.run(skillId, input)

    expect(executeCollector).toHaveBeenCalledOnce()
    expect(execute).toHaveBeenCalledTimes(2)
    const panelSnapshot = panel.proposal.artifacts.find((artifact) => artifact.artifactType === 'researchSnapshot')
    const cliSnapshot = cli.proposal.artifacts.find((artifact) => artifact.artifactType === 'researchSnapshot')
    expect(panelSnapshot?.content).toBe(cliSnapshot?.content)
    expect(JSON.parse(panelSnapshot?.content ?? '{}')).toMatchObject({
      skillId,
      quota: { attemptedBillableCalls: 1, completedBillableCalls: 1 },
      failures: [],
    })
    expect(panel.proposal.artifacts.map((artifact) => artifact.artifactType)).toEqual([artifactType, 'researchSnapshot'])
    expect(cli.proposal.artifacts.map((artifact) => artifact.artifactType)).toEqual([artifactType, 'researchSnapshot'])
    expect(panel.proposal.fields).toEqual(cli.proposal.fields)
  })
})
