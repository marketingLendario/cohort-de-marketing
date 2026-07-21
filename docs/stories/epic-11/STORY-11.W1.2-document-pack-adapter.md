# STORY-11.W1.2 - Adapter de documentos versionados

## Status

Done

## Objetivo

Transformar propostas aprovadas em packs completos de arquivos, cobrindo
Markdown, HTML, PDF e DOCX quando o contrato da skill exigir, sem permitir que
o processo agentic escreva diretamente no projeto.

## Critérios de aceite

- [x] Schema de proposta declara arquivos derivados sem transportar binário no prompt.
- [x] O BFF renderiza PDF a partir do HTML aprovado em processo confinado.
- [x] O Offerbook gera DOCX pelo script canônico após aprovação.
- [x] Contratos seguem os outputs do catálogo e rejeitam path inseguro na validação.
- [x] Reexecução cria nova versão e preserva a versão anterior.
- [x] Manifesto do pack registra hash, formato, fonte e revisão da proposta.
- [x] Artifact DB e arquivos promovidos possuem os mesmos hashes.
- [x] Book do Funil é atualizado atomicamente com o pack aprovado.
- [x] Falha parcial não deixa pack nem Book em estado intermediário.
- [x] Página de vendas passa por gate semântico e visual de produção antes da promoção.
- [x] CLI possui run, checkpoint/continuação, retry auditável e aprovação em comando separado.
- [x] E2E valida `offerbook`, `copy-funil` e uma peça de funil no painel e CLI.

## Primeiro corte

1. `offerbook` como prova de Markdown + HTML + DOCX.
2. `copy-funil` como prova de versionamento e Book.
3. `pagina-vendas-funil` como prova de página HTML completa.

## Evidência de campo CLI

- O Offerbook recusou execução sem pesquisa de avatar e dossiê de concorrente.
- A página abriu cinco decisões humanas, vinculou uma continuação e preservou o checkpoint anterior.
- A primeira tentativa final foi reprovada pela ordem dos blocos; o retry no mesmo job/run passou na tentativa 2.
- A aprovação separada materializou 8 arquivos, incluindo PDF e snapshots imutáveis, com hashes DB/filesystem convergentes.

## Evidência de paridade painel/CLI

- Fixture isolada baseada nos insumos reais de `projetos/academia-fit` executou os dois caminhos em projetos gêmeos.
- `offerbook`: 10 arquivos confirmados por superfície, incluindo Markdown, HTML, DOCX, revisões imutáveis e Book do Funil.
- `copy-funil`: 8 arquivos confirmados por superfície, incluindo Markdown, HTML, PDF, revisões imutáveis e Book do Funil.
- `pagina-vendas-funil`: 8 arquivos confirmados por superfície, incluindo página, PDF, revisão imutável e Book do Funil.
- Todos os hashes gravados em `project_artifacts` convergiram com os bytes do filesystem de cada superfície.
- As páginas do painel e CLI passaram em desktop e mobile com 15 seções, formulário completo, zero overflow e zero erro de console.
- Retry corretivo reutilizou o mesmo job e recebeu o diagnóstico da tentativa anterior; painel passou na tentativa 2 e CLI na tentativa 3.

Arquivo canônico: `apps/academia-lendaria-ads-studio/design-qa-evidence/epic-11/document-pack-parity/evidence.json`.
