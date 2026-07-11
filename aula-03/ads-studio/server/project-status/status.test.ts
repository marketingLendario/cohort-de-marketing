import { describe, expect, it } from 'vitest'
import type { BookDoFunilState } from '../document-pack/book-reconciler.js'
import { evaluateProjectStatus, parseProjectPendings, renderProjectStatusMarkdown } from './status.js'

const book: BookDoFunilState = {
  schemaVersion: '1.0.0',
  projectSlug: 'cliente-x',
  cards: [
    { id: 'avatar-funil', title: 'Avatar', phase: 'Pesquisa', status: 'feito', link: 'avatar.html', versions: [{ revision: 1, link: 'avatar.r1.html' }] },
    { id: 'offerbook', title: 'Offerbook', phase: 'Oferta e Fundação', status: 'feito', link: 'offerbook.html', versions: [{ revision: 1, link: 'offerbook.r1.html' }] },
  ],
  current: { completedSkillId: 'offerbook', nextCommand: '/design-md' },
}

describe('project status reconciliation', () => {
  it('aponta a primeira lacuna do filesystem e expõe drift entre as três fontes', () => {
    const status = evaluateProjectStatus({
      projectSlug: 'cliente-x',
      filesystemPaths: ['avatar.md', 'offerbook.md', 'criativos/banner.png'],
      artifacts: [
        { artifactType: 'avatar', path: 'avatar.md', verification: 'confirmed' },
        { artifactType: 'offerbook', path: 'offerbook.md', verification: 'confirmed' },
        { artifactType: 'design', path: 'DESIGN.md', verification: 'confirmed' },
      ],
      book,
    })

    expect(status.completed).toBe(2)
    expect(status.nextCommand).toBe('/design-md')
    expect(status.alternatives).toContainEqual({ id: 'creatives', path: 'criativos/', skillId: 'criativos-funil' })
    expect(status.divergences).toContainEqual({ pieceId: 'design', missing: ['filesystem', 'book'] })
    expect(renderProjectStatusMarkdown(status)).toContain('DESIGN.md <- você está aqui')
  })

  it('conta pendências por chave única e mantém duplicata aberta de forma conservadora', () => {
    const pending = parseProjectPendings('- [x] Checkout <!-- key: checkout-link -->\n- [ ] Pixel <!-- key: pixel-id -->\n- [ ] Checkout em outro arquivo <!-- key: checkout-link -->')
    expect(pending).toEqual([
      { key: 'checkout-link', resolved: false },
      { key: 'pixel-id', resolved: false },
    ])
  })

  it('fecha em CRO quando as onze peças existem', () => {
    const files = ['avatar.md', 'offerbook.md', 'DESIGN.md', 'funil.md', 'copy.md', 'pagina/index.html', 'emails/venda.html', 'conteudo/post.md', 'recuperacao.md', 'backend-funil.md', 'cro.md']
    const status = evaluateProjectStatus({ projectSlug: 'completo', filesystemPaths: files, artifacts: [], book: null })
    expect(status.completed).toBe(11)
    expect(status.nextCommand).toBe('/cro-funil')
  })

  it('respeita Perfil afiliado e o próximo formato prescrito no mapa', () => {
    const status = evaluateProjectStatus({
      projectSlug: 'afiliado-x', filesystemPaths: ['avatar.md', 'offerbook.md', 'DESIGN.md', 'funil.md'], artifacts: [], book: null,
      profileMarkdown: '**Situação de partida:** afiliado\n**Destino do fechamento:** reunião\n',
      funnelMarkdown: '| VSL | ← PRÓXIMO |',
    })
    expect(status.profile.affiliate).toBe(true)
    expect(status.total).toBe(10)
    expect(status.pieces.find((piece) => piece.id === 'backend')).toMatchObject({ applicable: false, converged: true })
    expect(status.nextCommand).toBe('/vsl-funil')
    expect(status.guidance).toContain('back-end próprio')
  })
})
