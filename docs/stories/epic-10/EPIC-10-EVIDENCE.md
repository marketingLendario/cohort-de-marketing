# EPIC-10 - Evidências da Creative Factory real

## Veredito

`SHIP_LOCAL / NO_SHIP_PUBLIC`

O fluxo funcional está implementado e validado localmente. A publicação em um
repositório público permanece bloqueada até existir autorização escrita para
redistribuir o código privado e os assets, além dos textos OFL exatos das fontes.

## Execuções reais

| Prova | Job | Resultado |
|---|---|---|
| Lote operado pela UI | `5da51abf-2d0b-4fe6-beb5-53c0b80d198b` | tentativa 3 concluída; 2 peças aprovadas e promovidas |
| Cancelamento | `43d6913e-ea1d-4cb5-b105-30d1adfc4fd9` | cancelado; zero processos órfãos encontrados |
| Matriz 3 x 2 | `dba1a2e4-4a11-44ff-b6bc-37d33ce8a78f` | 3 arquétipos, feed e story, 6 PNGs, todos com gate aprovado |

As gerações usaram `codex-cli-image-gen` via sessão local do Codex. O ambiente
filho removeu chaves de API e usou sandbox `workspace-write`.

## Matriz visual

| Arquétipo | Formato | Dimensão | SHA-256 |
|---|---|---:|---|
| dark editorial | feed | 1080x1350 | `0cf891e0aa5f2548f48d048e4a8a4e5aba62f1b3f7bc00cdf908ddaf438e2e35` |
| dark editorial | story | 1080x1920 | `ddaee1c1265f21bf1972b68760ab830a1767de980b927b2d5b88c5416a33531c` |
| light clean | feed | 1080x1350 | `d750d24b2fd42f1943d9b6a4baca19116123d12c8bce095abbe804a43e7ea35f` |
| light clean | story | 1080x1920 | `cdb6dd3c40677f6955c12bf2a798a46c3e02db5cd060a1b54b9d8d1cf49f2fcd` |
| didactic compare | feed | 1080x1350 | `20af805337bd6b499f122ee2e71c09271e7c370524ff855949b965c59690f1a6` |
| didactic compare | story | 1080x1920 | `b83ea22ec3344bc209727501e81818e6917c3c0062868f9e7f69699e0176553b` |

Contato visual: [creative-factory-matrix-contact-sheet.png](../../../apps/academia-lendaria-ads-studio/design-qa-evidence/epic-10/creative-factory-matrix-contact-sheet.png).

## Pacote promovido

Lote `5da51abf-2d0b-4fe6-beb5-53c0b80d198b-a3`, materializado em
`projetos/story-8-w3-1-traffic-pilot/criativos/factory/`:

| Artefato | SHA-256 |
|---|---|
| PNG 1 | `cacc3ffc7adc60dd84641b3b18102bcb44b825a1c7acb887740e569a96a73497` |
| PNG 2 | `2fee3adbca1899a170c3f22de7e6bb35153f8e21e359a093ccd388aea2bd0cfe` |
| `manifest.json` | `7c0a6e9f3c3c345b2fac9ac25a0c09f2a68c8900c9fad1af68c8f14bd950afe9` |
| `legendas.md` | `9bab5873ba85c23aad7cfa12975cb89da8ec7b4411369c38b92411eccf7ef1ad` |

O manifesto público usa IDs opacos. Leitura de mídia revalida tamanho e hash e
rejeita symlink, traversal, arquivo adulterado e item sinalizado pelo gate.

## E2E e inspeção visual

- Playwright em BrowserContexts novos: desktop 1440x1000 e mobile 390x844.
- 4 imagens carregadas em cada viewport, todas 1080x1350.
- Pacote aprovado, CTA, descrição de link e próximo estágio confirmados.
- Zero erros de console, zero request failures e zero overflow horizontal.
- Reload e restart do launcher preservaram o lote e a promoção.
- O enum interno `not_ready` foi removido da interface após a inspeção visual.

Evidências: [resultado estruturado](../../../apps/academia-lendaria-ads-studio/design-qa-evidence/epic-10/creative-factory-field-validation.json), [desktop](../../../apps/academia-lendaria-ads-studio/design-qa-evidence/epic-10/creative-factory-desktop-fresh-context.png) e [mobile](../../../apps/academia-lendaria-ads-studio/design-qa-evidence/epic-10/creative-factory-mobile-fresh-context.png).

## Testes finais

- Vitest: 72 arquivos, 543 testes aprovados e 5 ignorados.
- Motor Python: 78 testes aprovados.
- pgTAP: 6 arquivos, 67 testes aprovados.
- Launcher: 9 testes aprovados.
- Readiness final: `pronto`, Node 22.16.0, Codex autenticado, BFF e interface ativos.
- ESLint, TypeScript, build Vite, catálogo 31/41, lint do banco e `git diff --check`: aprovados.
- Skill canônica e espelho: idênticos, sem symlinks, caches ou ponteiros Git LFS.

## Defeitos encontrados e corrigidos

1. IDs de hook com underscore eram recusados pelo adapter.
2. Diagnósticos aninhados do gate podiam expor paths absolutos.
3. Revisões antigas no cache venciam a revisão mais recente da campanha.
4. Selecionar três arquétipos ainda gerava apenas uma variante total.
5. O header mostrava o enum interno `not_ready` após a aprovação.
6. O E2E podia selecionar o formulário de primeiro acesso em vez do login.

## Ainda falta algo?

Sim, apenas para publicação pública:

1. Autorização escrita do owner do `sinkra-hub` para redistribuição do código.
2. Permissão de uso das marcas, fotos de pessoas e referências geradas.
3. Inclusão dos textos OFL 1.1 e notices exatos de cada família de fonte.

Até esses três itens existirem, não fazer commit, push ou merge da skill e de
seus assets para o repositório público.
