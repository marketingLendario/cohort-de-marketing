import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VisualProductionReview } from '@/components/visual-production-review'
import type { SkillProposal } from '@/lib/skill-runtime'

const manifest = {
  schemaVersion: '1.0.0', batchId: 'batch-1', projectId: 'project-1', campaignId: 'campaign-1',
  productionSkillId: 'criativos-funil', status: 'ready_for_review', createdAt: '2026-07-11T12:00:00.000Z',
  items: [
    {
      id: 'ready-1', status: 'ready', archetype: 'dark_editorial', headline: 'Peça aprovada', caption: 'Legenda pronta',
      linkDescription: 'Conheça', cta: 'Saiba mais', promptSanitized: 'brand=test', promptSha256: 'a'.repeat(64), gate: {}, review: {},
      assets: [{ id: 'asset-ready', format: 'feed', width: 1080, height: 1350, sha256: 'b'.repeat(64), bytes: 100 }],
    },
    {
      id: 'flagged-1', status: 'flagged', archetype: 'light_clean', headline: 'Peça sinalizada', caption: 'Legenda',
      linkDescription: 'Conheça', cta: 'Saiba mais', promptSanitized: 'brand=test', promptSha256: 'c'.repeat(64), gate: {}, review: {},
      assets: [{ id: 'asset-flagged', format: 'story', width: 1080, height: 1920, sha256: 'd'.repeat(64), bytes: 100 }],
    },
  ],
} as const

const proposal: SkillProposal = {
  summary: 'Produção pronta', resultMarkdown: '# Produção', fields: [], questions: [], warnings: [],
  artifacts: [{ artifactType: 'creativeFactoryBatch', title: 'Galeria', path: 'manifest.json', format: 'json', content: JSON.stringify(manifest) }],
}

afterEach(() => vi.unstubAllGlobals())

describe('VisualProductionReview', () => {
  it('bloqueia itens sinalizados e só promove a seleção humana', async () => {
    const response = { batchId: 'batch-1', artifactPath: 'criativos/banners/manifest.json', artifactContent: '{}', artifactHash: 'hash', promotedAssets: [] }
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/promote')) return new Response(JSON.stringify(response), { status: 200, headers: { 'content-type': 'application/json' } })
      if (url.endsWith('/plan')) return new Response(JSON.stringify({ skillRunId: 'run-1', projectSlug: 'teste', proposalHash: 'proposal-hash', proposalRevision: 1, fresh: true, files: [], warnings: [] }), { status: 200, headers: { 'content-type': 'application/json' } })
      void init
      return new Response(JSON.stringify({ id: 'approval-1', state: 'done', outcome: 'unchanged' }), { status: 200, headers: { 'content-type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetchMock)
    const onPromoted = vi.fn()
    render(<VisualProductionReview proposal={proposal} projectId="project-1" skillRunId="run-1" artifactType="creatives" artifactTitle="Criativos aprovados" onPromoted={onPromoted} />)

    expect(screen.getByText('criativos-funil')).toBeInTheDocument()
    expect(screen.getByText('feed 1080×1350')).toBeInTheDocument()
    expect(screen.getByText('story 1080×1920')).toBeInTheDocument()
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[1]).toBeDisabled()
    expect(screen.getByRole('button', { name: /Promover 0/ })).toBeDisabled()

    fireEvent.click(checkboxes[0]!)
    fireEvent.click(screen.getByRole('button', { name: /Promover 1/ }))

    await waitFor(() => expect(onPromoted).toHaveBeenCalledWith(response))
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ projectId: 'project-1', selectedItemIds: ['ready-1'] })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(JSON.parse(String(fetchMock.mock.calls[2]![1]?.body))).toMatchObject({ skillRunId: 'run-1', decision: 'approve', expectedProposalHash: 'proposal-hash' })
  })
})
