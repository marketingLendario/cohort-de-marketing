import { describe, expect, it, vi } from 'vitest'
import type { SkillProposal } from '../local-skill-runner.js'
import { createDocumentPackApprovalDeriver } from './approval-deriver.js'
import { assertDocumentPackProposal, loadDocumentPackContract, type DocumentPackContract } from './contracts.js'
import { validSalesPageFixture } from './sales-page-fixture.js'

const repoRoot = new URL('../../../../', import.meta.url).pathname
const contractIds = [
  'avatar-funil', 'espiao-do-concorrente', 'trend-hunting',
  'offerbook', 'copy-funil', 'pagina-vendas-funil', 'metodo-funil', 'vsl-funil', 'advertorial-funil',
  'lancamento-funil', 'webinario-funil', 'quiz-funil', 'email-funil', 'whatsapp-funil',
  'conteudo-funil', 'recuperacao-funil', 'backend-funil', 'cro-funil', 'swipe-file', 'bonus-funil',
]

function content(path: string, profile?: string) {
  if (path === 'pagina/index.html') return validSalesPageFixture()
  if (path === 'carrossel/lote.html') return '<!doctype html><html><head><style>.slide{width:1080px;height:1350px}</style></head><body><main><div class="slide" data-carousel-slide>1</div><div class="slide" data-carousel-slide>2</div><div class="slide" data-carousel-slide>3</div></main></body></html>'
  if (profile === 'owner-document-v1') return '<!doctype html><html><body><main><h1>Documento</h1><a href="index.html">Voltar ao Book</a></main></body></html>'
  if (profile === 'collection-index-v1') return '<!doctype html><html><body><main><h1>Índice</h1><a href="item.html">Abrir item</a></main></body></html>'
  if (profile === 'message-copy-v1') return '<!doctype html><html><body><main><h1>Mensagem</h1><p data-copy-text>Texto final</p><button>Copiar</button></main><script>navigator.clipboard.writeText(document.querySelector("p").textContent)</script></body></html>'
  if (profile === 'video-script-v1') return '<!doctype html><html><body><main><h1>Roteiro</h1><article data-video-script>Fala aprovada</article><a href="pagina.html">Voltar para a página</a></main></body></html>'
  if (profile === 'quiz-app-v1') return '<!doctype html><html><body><main><h1>Quiz</h1><form><input name="q"><button type="submit">Ver resultado</button></form><output></output></main><script>localStorage.setItem("q","1");localStorage.getItem("q")</script></body></html>'
  if (profile === 'lead-page-v1') return '<!doctype html><html><head><meta name="viewport" content="width=device-width"></head><body><main><h1>Página</h1><form><input name="email"><button type="submit">Quero participar</button></form></main></body></html>'
  return path.endsWith('.html') ? '<!doctype html><html><body><main>Conteúdo aprovado</main></body></html>' : '# Conteúdo aprovado\n'
}

function fixtureProposal(contract: DocumentPackContract): SkillProposal {
  const artifacts: SkillProposal['artifacts'] = [
    ...contract.requiredTextOutputs,
    ...(contract.optionalTextOutputs ?? []),
  ].map((output) => ({
    artifactType: contract.skillId, title: output.path, path: output.path, format: output.format, content: content(output.path, output.validationProfile),
  }))
  for (const collection of contract.requiredCollections ?? []) {
    for (let index = 1; index <= collection.minItems; index += 1) {
      const path = collection.pathPattern.replaceAll('*', `item-${index}`)
      artifacts.push({ artifactType: contract.skillId, title: path, path, format: collection.format, content: content(path, collection.validationProfile) })
    }
  }
  return { summary: 'Pack completo', resultMarkdown: '# Pack', artifacts, fields: [], questions: [], warnings: [] }
}

describe('document pack v2 catalog', () => {
  it('keeps all 20 contracts executable, versioned and Book-addressable', async () => {
    const render = vi.fn(async ({ output }: { output: { format: 'pdf' | 'docx' } }) => ({
      content: Buffer.from(output.format === 'pdf' ? '%PDF-fixture' : 'PK\u0003\u0004fixture'),
      contentHash: 'hash',
      mimeType: output.format === 'pdf' ? 'application/pdf' as const : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' as const,
    }))
    const renderCarousel = vi.fn(async ({ batchSlug }: { html: string; batchSlug: string }) => ({
      manifest: {
        schemaVersion: '1.0.0' as const, batchSlug, slideCount: 1, totalBytes: 4,
        slides: [{ index: 1, path: 'slides/slide-01.png', sha256: 'png', bytes: 4, width: 1080, height: 1350 }],
        gallery: { path: 'index.html', sha256: 'html', bytes: 13 },
        archive: { path: `${batchSlug}.zip`, sha256: 'zip', bytes: 4 },
      },
      files: [
        { path: 'slides/slide-01.png', content: Buffer.from('png!'), sha256: 'png', bytes: 4 },
        { path: 'index.html', content: Buffer.from('<main></main>'), sha256: 'html', bytes: 13 },
        { path: `${batchSlug}.zip`, content: Buffer.from('zip!'), sha256: 'zip', bytes: 4 },
      ],
    }))
    const derive = createDocumentPackApprovalDeriver({ repoRoot, render, renderCarousel })
    for (const skillId of contractIds) {
      const contract = await loadDocumentPackContract(repoRoot, skillId)
      expect(contract, skillId).not.toBeNull()
      const proposal = fixtureProposal(contract!)
      expect(() => assertDocumentPackProposal(contract!, proposal), skillId).not.toThrow()
      const result = await derive({ skillId, projectSlug: `fixture-${skillId}`, skillRunId: `run-${skillId}`, proposalRevision: 2, artifacts: proposal.artifacts })
      expect(result.some((artifact) => artifact.path === contract!.bookEntry.path || artifact.path === 'index.html'), skillId).toBe(true)
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'book-do-funil.json' }),
        expect.objectContaining({ path: 'index.html' }),
      ]))
      for (const output of contract!.derivedOutputs) expect(result.some((artifact) => artifact.path === output.path), `${skillId}:${output.path}`).toBe(true)
    }
    expect(render).toHaveBeenCalled()
  })
})
