# EPIC-11 - Paridade real entre Painel e CLI

## Status

Done

## Objetivo

Fazer cada skill canônica entregar pelo Marketing Studio o mesmo resultado
operacional que entrega quando executada diretamente pelo CLI, preservando
revisão humana, segurança, versionamento e os arquivos em `projetos/{slug}/`.

## Baseline histórico

- 31 skills canônicas disponíveis no CLI e catalogadas no painel.
- O ponto de partida da W3 tinha 12 skills em `full_e2e`, 19 em `partial` e 0 em `proposal_only`.

## Estado final medido

- 31 de 31 skills em `full_e2e`.
- 0 skills em `partial` e 0 em `proposal_only`.
- Painel e CLI usam os mesmos adapters, checkpoints, journal, gates de aprovação e materialização.
- O gate Playwright confirmou as 31 entradas em desktop e mobile, sem gap visível, overflow, erro de console ou request failure.
- A publicação pública da Creative Factory continua bloqueada pelos direitos de redistribuição registrados no Epic 10; isso não reduz a paridade funcional local.

A fonte de verdade desse baseline é `data/skill-execution-matrix.json`.

## Invariantes

1. O painel não pode chamar uma proposta textual de execução completa.
2. Chaves externas ficam em adapters determinísticos e nunca entram no prompt.
3. Arquivos só são promovidos após revisão humana explícita.
4. HTML, PDF, DOCX e imagens preservam versão, hash e proveniência.
5. Recriar nunca apaga uma versão aprovada.
6. Book do Funil, artifacts do projeto e filesystem precisam convergir.
7. Cada promoção para `full_e2e` exige prova em novo BrowserContext e CLI.

## Ondas

| Onda | Entrega | Skills principais |
|---|---|---|
| W1 | Contrato e adapter de documentos | offerbook e peças textuais do funil |
| W2 | Coleta externa e produção visual | pesquisa, conteúdo, criativos e mockups |
| W3 | Setup/status e matriz E2E completa | comecar, status-funil e regressão 31/31 |

## Stories

| Story | Entrega | Status |
|---|---|---|
| 11.W1.1 | Matriz canônica e UX honesta | Done |
| 11.W1.2 | Adapter de documentos versionados | Done |
| 11.W2.1 | Adapter de coleta externa | Done |
| 11.W2.2 | Adapter de produção visual | Done |
| 11.W3.1 | Setup/status e gate 31/31 | Done |

## Gate de conclusão

O epic só pode ficar `Done` quando as 31 entradas da matriz estiverem em
`full_e2e`, sem capability pendente, com os outputs declarados no catálogo
materializados e reconciliados entre banco e filesystem.

Gate satisfeito em 2026-07-12. A fonte autoritativa é `data/skill-execution-matrix.json`.
