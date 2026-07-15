---
status: Ready
story_id: "17.W2.3"
title: "Reconciliação plataforma, checkout e caixa"
epic: 17
wave: "W2"
parent_epic: "docs/stories/epic-17/EPIC-17-AULA-04-DATA-FOUNDATION.md"
effort: 7h
deploy_type: none
appetite: 1d
hill_phase: uphill
confidence_level: know-how
involves_ui: false
task_mode: CRIAR
cli: codex
model: sonnet
executor: "@dev"
quality_gate: "@architect"
repo_target: "marketingLendario/cohort-de-marketing"
accountable: "Rafael Costa"
depends_on: ["17.W1.1", "17.W1.2"]
consumes_artifacts_of: ["17.W1.1", "17.W1.2"]
entity_input:
  entity_type: "SourceObservationSetV1"
  description: "Observações públicas minimizadas de plataforma, checkout e caixa, sem PII e com janela/moeda/proveniência explícitas."
  status_expected: "validated"
entity_output:
  entity_type: "SourceReconciliationV1"
  description: "Reconciliação determinística que expõe gaps comparáveis sem escolher uma fonte verdadeira."
  status_expected: "reviewable"
touched_paths:
  - "data/contracts/source-reconciliation.v1.schema.json"
  - "scripts/reconcile-aula-04-sources.mjs"
  - "scripts/reconcile-aula-04-sources.test.mjs"
  - "aula-04/templates/reconciliacao-fontes.yaml"
  - "aula-04/fixtures/reconciliation-match.json"
  - "aula-04/fixtures/reconciliation-mismatch.json"
  - "aula-04/fixtures/reconciliation-missing.json"
  - "docs/stories/epic-17/STORY-17.W2.3-platform-checkout-cash-reconciliation.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.3.md"
affected_paths:
  - "data/contracts/source-reconciliation.v1.schema.json"
  - "scripts/reconcile-aula-04-sources.mjs"
  - "scripts/reconcile-aula-04-sources.test.mjs"
  - "aula-04/templates/reconciliacao-fontes.yaml"
  - "aula-04/fixtures/reconciliation-match.json"
  - "aula-04/fixtures/reconciliation-mismatch.json"
  - "aula-04/fixtures/reconciliation-missing.json"
  - "docs/stories/epic-17/STORY-17.W2.3-platform-checkout-cash-reconciliation.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.3.md"
---

# STORY-17.W2.3 - Reconciliação plataforma, checkout e caixa

## Status

Ready

## Dependências

- 17.W1.1
- 17.W1.2

## Objetivo

Representar diferenças entre fontes de mídia, checkout e caixa sem escolher uma verdade por heurística.

## Critérios de aceite

- [ ] Cada fonte mantém valor ou ausência, timestamp RFC3339, moeda ISO 4217, janela literal, status de confirmação e referência estruturada de proveniência.
- [ ] Gap absoluto e relativo só existem quando moeda, janela, período e confirmação tornam o par comparável; caso contrário a saída explica a incompatibilidade sem cálculo.
- [ ] `cashConfirmed` nunca é inferido de evento da plataforma ou checkout e nenhuma fonte é eleita como verdade por prioridade/heurística.
- [ ] Fonte ausente permanece `nao_fornecido`, com valor nulo; zero é um valor somente quando fornecido explicitamente.
- [ ] Schema fechado, testes adversariais e scan impedem nome, email, telefone, documento, endereço, token ou payload de comprador no artefato público e nas mensagens de erro.

## Tasks

- [ ] Confirmar baseline e contratos consumidores.
- [ ] Definir fixtures e testes antes do código.
- [ ] Implementar dentro da File List aprovada.
- [ ] Registrar evidência sanitizada.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `data/contracts/source-reconciliation.v1.schema.json`
- `scripts/reconcile-aula-04-sources.mjs`
- `scripts/reconcile-aula-04-sources.test.mjs`
- `aula-04/templates/reconciliacao-fontes.yaml`
- `aula-04/fixtures/reconciliation-match.json`
- `aula-04/fixtures/reconciliation-mismatch.json`
- `aula-04/fixtures/reconciliation-missing.json`
- `docs/stories/epic-17/STORY-17.W2.3-platform-checkout-cash-reconciliation.md`
- `docs/stories/epic-17/evidence/STORY-17.W2.3.md`

A File List é uma allow-list inicial. Mudanças fora dela exigem atualização da story e nova validação de arquitetura.

## Dev Notes

- Baseline integrado: `d0bc5ed1aff114d616402e98b7ec17e25b7c2309`; pode executar em paralelo com 17.W2.1.
- A story recebe artefatos já minimizados por arquivo local; não conecta checkout, banco, Meta, caixa, Studio ou credenciais.
- Não copie dados pessoais para fixtures, logs, erros, evidência ou reconciliação.
- Nenhuma divergência autoriza escolher ou corrigir fonte automaticamente; o resultado permanece para revisão humana.

## Validação

- Fixtures de match, mismatch e fonte ausente.
- Teste de moeda/janela incompatível.
- Scan de PII.

## Stop conditions adicionais

- A fonte exigir payload bruto ou identificador de comprador para reconciliar.
- O cálculo exigir conversão de moeda, equivalência de janela ou escolha de fonte não declarada no contrato.

## Stop conditions

- Integração exigir armazenar dados pessoais de comprador.
- Reconciliação decidir automaticamente qual fonte está correta.
