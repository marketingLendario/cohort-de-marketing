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

function contractArtifacts(skillId: ExternalResearchSkillId, artifactType: string): SkillProposal['artifacts'] {
  const markdown = (path: string) => ({ artifactType, title: path, path, format: 'markdown' as const, content: `# ${skillId}\n` })
  const owner = (path: string) => ({
    artifactType, title: path, path, format: 'html' as const,
    content: '<!doctype html><html><body><main><h1>Documento</h1><a href="index.html">Voltar ao Book</a></main></body></html>',
  })
  const index = (path: string, href: string) => ({
    artifactType, title: path, path, format: 'html' as const,
    content: `<!doctype html><html><body><main><h1>Índice</h1><a href="${href}">Abrir item</a></main></body></html>`,
  })
  if (skillId === 'avatar-funil') return [markdown('relatorio-avatar.md'), owner('relatorio-avatar.html')]
  if (skillId === 'espiao-do-concorrente') return [
    index('espiao/index.html', 'dossie-fixture.html'),
    markdown('espiao/dossie-fixture.md'),
    owner('espiao/dossie-fixture.html'),
  ]
  if (skillId === 'trend-hunting') return [
    index('trends/index.html', 'trends-fixture.html'),
    markdown('trends/briefing-media-buyer.md'),
    markdown('trends/trends-fixture.md'),
    owner('trends/trends-fixture.html'),
    markdown('trends/variacoes-teste-fixture.md'),
    owner('trends/variacoes-teste-fixture.html'),
  ]
  return [
    markdown('conteudo/roteiros.md'),
    owner('conteudo/roteiros.html'),
    {
      artifactType, title: 'carrossel/lote.html', path: 'carrossel/lote.html', format: 'html' as const,
      content: '<!doctype html><html><body><section data-carousel-slide style="width:1080px;height:1350px">Slide fixture</section></body></html>',
    },
  ]
}

describe.each(cases)('external research panel/CLI parity — $skillId', ({ skillId, artifactType }) => {
  it('reuses one frozen collection and emits the same authoritative manifest on both surfaces', async () => {
    const executeCollector = vi.fn(async () => ({ sources: [collectedSource(skillId)] }))
    const adapter = new CachedExternalResearchAdapter({ runtimeRoot, executeCollector })
    const execute = vi.fn(async ({ outputPath }: { outputPath: string }) => {
      await writeFile(outputPath, JSON.stringify({
        summary: `${skillId} concluída com fonte literal.`,
        resultMarkdown: `# ${skillId}`,
        artifacts: contractArtifacts(skillId, artifactType),
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
    expect(panel.proposal.artifacts.map((artifact) => artifact.artifactType)).toContain(artifactType)
    expect(panel.proposal.artifacts.at(-1)?.artifactType).toBe('researchSnapshot')
    expect(cli.proposal.artifacts.map((artifact) => artifact.artifactType)).toContain(artifactType)
    expect(cli.proposal.artifacts.at(-1)?.artifactType).toBe('researchSnapshot')
    expect(panel.proposal.fields).toEqual(cli.proposal.fields)
  })
})
