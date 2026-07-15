---
status: Ready
story_id: "17.W1.2"
title: "Ledger multi-semana com proveniência"
epic: 17
wave: "W1"
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
depends_on: ["17.W1.1"]
consumes_artifacts_of: ["17.W1.1"]
entity_input:
  entity_type: "Aula04ExecutableContracts"
  description: "CampaignPlan v1 e WeeklyPanel v1 aprovados pela Story 17.W1.1."
  status_expected: "validated"
entity_output:
  entity_type: "WeeklyLedgerV1"
  description: "Ledger append-only de três ou mais semanas com proveniência, idempotência e conflito fechado."
  status_expected: "queryable"
touched_paths:
  - "data/contracts/weekly-ledger.v1.schema.json"
  - "data/contracts/weekly-panel.v1.schema.json"
  - "scripts/build-weekly-ledger.mjs"
  - "scripts/build-weekly-ledger.test.mjs"
  - "aula-04/fixtures/ledger-three-weeks.input.jsonl"
  - "aula-04/fixtures/ledger-three-weeks.expected.json"
  - "aula-04/fixtures/ledger-idempotent.input.jsonl"
  - "aula-04/fixtures/ledger-conflict.input.jsonl"
  - "docs/stories/epic-17/STORY-17.W1.2-multi-week-ledger.md"
  - "docs/stories/epic-17/evidence/STORY-17.W1.2.md"
affected_paths:
  - "data/contracts/weekly-ledger.v1.schema.json"
  - "data/contracts/weekly-panel.v1.schema.json"
  - "scripts/build-weekly-ledger.mjs"
  - "scripts/build-weekly-ledger.test.mjs"
  - "aula-04/fixtures/ledger-three-weeks.input.jsonl"
  - "aula-04/fixtures/ledger-three-weeks.expected.json"
  - "aula-04/fixtures/ledger-idempotent.input.jsonl"
  - "aula-04/fixtures/ledger-conflict.input.jsonl"
  - "docs/stories/epic-17/STORY-17.W1.2-multi-week-ledger.md"
  - "docs/stories/epic-17/evidence/STORY-17.W1.2.md"
---

# STORY-17.W1.2 - Ledger multi-semana com proveniência

> **Depends On:** 17.W1.1
> **Estimated Effort:** 7h

## Story

**As a / Como** operador que acompanha uma campanha ao longo de várias semanas

**I want / Quero** consolidar revisões validadas em um ledger append-only

**so that / Para que** decisões e resultados sejam comparáveis sem reescrever evidência histórica nem carregar artefatos brutos.

## Status

Ready

## Dependências

- 17.W1.1

## Acceptance Criteria

- [ ] AC1: Cada entrada do `weekly-ledger.v1` referencia `projectId`, `campaignId`, `weekStart`, `revision`, `weeklyPanelId`, `schemaVersion` e o hash canônico do registro validado.
- [ ] AC2: Toda métrica preserva valor ou ausência explícita, selo, fonte, janela de atribuição, premissa aplicável e confirmação humana; métrica sem proveniência válida falha fechado.
- [ ] AC3: Repetir a mesma identidade e hash é idempotente; a mesma identidade com hash diferente retorna conflito, exit code não zero e não modifica o ledger existente.
- [ ] AC4: Revisão posterior é anexada sem sobrescrever a anterior, e a fixture de três semanas produz índice consultável por projeto, campanha e semana em ordem determinística.
- [ ] AC5: A saída contém somente referências, metadados e métricas do contrato; testes provam que conteúdo bruto, decisões históricas e dados pessoais não são copiados nem reescritos.

## Tasks

- [ ] Confirmar que 17.W1.1 está `Done`, seus validators passam e não existe PR cobrindo este escopo.
- [ ] Congelar schema, serialização canônica, identidade, algoritmo de hash e fixtures antes da implementação.
- [ ] Implementar builder append-only e índice de consulta somente dentro da File List aprovada.
- [ ] Testar três semanas, nova revisão, replay idempotente, conflito e métrica sem proveniência.
- [ ] Registrar evidência sanitizada; atualizar checkboxes e a File List real sem editar o epic state fora do fan-in.

## File List

- `data/contracts/weekly-ledger.v1.schema.json`
- `data/contracts/weekly-panel.v1.schema.json`
- `scripts/build-weekly-ledger.mjs`
- `scripts/build-weekly-ledger.test.mjs`
- `aula-04/fixtures/ledger-three-weeks.input.jsonl`
- `aula-04/fixtures/ledger-three-weeks.expected.json`
- `aula-04/fixtures/ledger-idempotent.input.jsonl`
- `aula-04/fixtures/ledger-conflict.input.jsonl`
- `docs/stories/epic-17/STORY-17.W1.2-multi-week-ledger.md`
- `docs/stories/epic-17/evidence/STORY-17.W1.2.md`

A File List é uma allow-list inicial. Criação, alteração ou renomeação fora dela exige atualização da story e nova validação de arquitetura.

## Dev Notes

- Baseline integrado: `f989ce6`. A story é o segundo grupo da W1 e só pode ser despachada depois do fan-in de `17.W1.1` com QG `PASS`.
- A identidade idempotente deve incluir projeto, campanha, semana e revisão. Filename nunca pode ser a única chave.
- Calcule o hash sobre representação canônica documentada do registro validado, não sobre bytes acidentais do arquivo de origem.
- Escreva em arquivo temporário e substitua o destino apenas depois de validar o conjunto completo; conflito ou I/O inválido preserva o ledger anterior.
- O ledger é um índice de fatos e referências; não copie criativos, prompts, PII ou documentos inteiros.
- O escopo documental é exclusivo desta story e de sua evidência; `epic-17-state.json` pertence ao fan-in.
- `deploy_type: none`: a prova é local, por testes Node e execução do builder.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["node:test", "json-schema", "idempotency-fixtures"]
repo_target: "marketingLendario/cohort-de-marketing"
model: "sonnet"
```

## Validação

- `node --test scripts/build-weekly-ledger.test.mjs`
- Execução do builder sobre as quatro fixtures declaradas.
- Comparação do ledger antes/depois de replay idempotente e conflito.

## Stop Conditions

- O modelo exigir reescrever semanas ou decisões históricas.
- A chave de deduplicação depender apenas de filename.
- O ledger precisar incorporar conteúdo bruto ou dado pessoal para ser consultável.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-14 | @po | Contrato enriquecido e validado para execução na PUB-17 W1. |
