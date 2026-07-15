---
status: InReview
story_id: "17.W2.3"
title: "Reconciliação plataforma, checkout e caixa"
epic: 17
wave: "W2"
parent_epic: "docs/stories/epic-17/EPIC-17-AULA-04-DATA-FOUNDATION.md"
effort: 7h
deploy_type: none
appetite: 1d
hill_phase: executing
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

InReview

## Dependências

- 17.W1.1
- 17.W1.2

## Objetivo

Representar diferenças entre fontes de mídia, checkout e caixa sem escolher uma verdade por heurística.

## Critérios de aceite

- [x] Cada fonte mantém valor ou ausência, timestamp RFC3339, moeda ISO 4217, janela literal, status de confirmação e referência estruturada de proveniência.
- [x] Gap absoluto e relativo só existem quando moeda, janela, período e confirmação tornam o par comparável; caso contrário a saída explica a incompatibilidade sem cálculo.
- [x] `cashConfirmed` nunca é inferido de evento da plataforma ou checkout e nenhuma fonte é eleita como verdade por prioridade/heurística.
- [x] Fonte ausente permanece `nao_fornecido`, com valor nulo; zero é um valor somente quando fornecido explicitamente.
- [x] Schema fechado, testes adversariais e scan impedem nome, email, telefone, documento, endereço, token ou payload de comprador no artefato público e nas mensagens de erro.

## Tasks

- [x] Confirmar baseline e contratos consumidores.
- [x] Definir fixtures e testes antes do código.
- [x] Implementar dentro da File List aprovada.
- [x] Registrar evidência sanitizada.
- [x] Atualizar checkboxes e File List real; state JSON permanece reservado ao fan-in `@devops`.

## File List

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

## Dev Agent Record

```yaml
agent_model: "GPT-5 Codex"
completion_notes:
  - "Preflight confirmou baseline 7d3ec82, dependências 17.W1.1/17.W1.2 Done e nenhum PR aberto cobrindo o escopo."
  - "TDD RED no commit 2c51cd3 congelou três fixtures e dez grupos adversariais; 0/10 passaram antes da implementação existir."
  - "O commit 755f236 implementa contrato fechado draft 2020-12, CLI local sanitizada, ordem canônica e reconciliação simétrica sem fonte verdadeira."
  - "Aritmética decimal usa BigInt sobre strings, preserva gap absoluto exato e publica razão relativa reduzida além do valor arredondado declarado."
  - "O commit a10c954 endurece precisão relativa, ISO 4217, duplicatas, proveniência por fonte e scan de telefone/documento formatado."
  - "Testes focais 10/10 e gate Node adjacente passaram; input permanece byte a byte imutável e os três golden outputs são determinísticos."
  - "Story movida para InReview; QA independente, fechamento e epic-state permanecem fora da autoridade do executor."
file_list:
  - "data/contracts/source-reconciliation.v1.schema.json"
  - "scripts/reconcile-aula-04-sources.mjs"
  - "scripts/reconcile-aula-04-sources.test.mjs"
  - "aula-04/templates/reconciliacao-fontes.yaml"
  - "aula-04/fixtures/reconciliation-match.json"
  - "aula-04/fixtures/reconciliation-mismatch.json"
  - "aula-04/fixtures/reconciliation-missing.json"
  - "docs/stories/epic-17/STORY-17.W2.3-platform-checkout-cash-reconciliation.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.3.md"
```

## QA Results

Pendente de revisão independente pelo `@architect`.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @po | Story W2.3 validada como `Ready` sobre a baseline integrada da PUB-17 W2. |
| 2026-07-15 | @dev | TDD RED congelou contrato, fixtures e matriz adversarial antes do código. |
| 2026-07-15 | @dev | Implementação e evidência concluídas; 10/10 focais e gate Node adjacente verdes; status movido para `InReview`. |
