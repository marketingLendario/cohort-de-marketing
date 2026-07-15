---
status: Ready
story_id: "17.W1.1"
title: "Validadores dos contratos de campanha e semana"
epic: 17
wave: "W1"
parent_epic: "docs/stories/epic-17/EPIC-17-AULA-04-DATA-FOUNDATION.md"
effort: 6h
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
depends_on: ["16.W1.1"]
consumes_artifacts_of: ["16.W1.1"]
entity_input:
  entity_type: "Aula04ContractBaseline"
  description: "CampaignPlan v1, WeeklyPanel v1 e ProjectBrief v1 congelado pela Story 16.W1.1."
  status_expected: "project-brief-v1-frozen"
entity_output:
  entity_type: "Aula04ExecutableContracts"
  description: "Schemas fechados, fixtures versionadas e validador CLI determinístico para campanha e semana."
  status_expected: "validated"
touched_paths:
  - "data/contracts/campaign-plan.v1.schema.json"
  - "data/contracts/weekly-panel.v1.schema.json"
  - "data/contracts/fixtures/aula-04/campaign-plan.valid.json"
  - "data/contracts/fixtures/aula-04/campaign-plan.additional-property.invalid.json"
  - "data/contracts/fixtures/aula-04/weekly-panel.valid.json"
  - "data/contracts/fixtures/aula-04/weekly-panel.invalid-transition.json"
  - "data/contracts/fixtures/aula-04/weekly-panel.metric-not-provided.valid.json"
  - "scripts/validate-aula-04-contracts.mjs"
  - "scripts/validate-aula-04-contracts.test.mjs"
  - "docs/stories/epic-17/STORY-17.W1.1-data-contract-validators.md"
  - "docs/stories/epic-17/evidence/STORY-17.W1.1.md"
affected_paths:
  - "data/contracts/campaign-plan.v1.schema.json"
  - "data/contracts/weekly-panel.v1.schema.json"
  - "data/contracts/fixtures/aula-04/campaign-plan.valid.json"
  - "data/contracts/fixtures/aula-04/campaign-plan.additional-property.invalid.json"
  - "data/contracts/fixtures/aula-04/weekly-panel.valid.json"
  - "data/contracts/fixtures/aula-04/weekly-panel.invalid-transition.json"
  - "data/contracts/fixtures/aula-04/weekly-panel.metric-not-provided.valid.json"
  - "scripts/validate-aula-04-contracts.mjs"
  - "scripts/validate-aula-04-contracts.test.mjs"
  - "docs/stories/epic-17/STORY-17.W1.1-data-contract-validators.md"
  - "docs/stories/epic-17/evidence/STORY-17.W1.1.md"
---

# STORY-17.W1.1 - Validadores dos contratos de campanha e semana

> **Depends On:** 16.W1.1
> **Estimated Effort:** 6h

## Story

**As a / Como** mantenedor dos contratos públicos da Aula 4

**I want / Quero** validar CampaignPlan e WeeklyPanel por uma CLI determinística

**so that / Para que** dados inválidos falhem fechado sem completar métricas nem depender do Studio privado.

## Status

Ready

## Dependências

- 16.W1.1

## Acceptance Criteria

- [ ] AC1: Os schemas usam JSON Schema draft 2020-12, fecham propriedades extras no envelope e nos objetos sob seu controle e rejeitam estados fora do vocabulário canônico.
- [ ] AC2: A CLI valida transições de `WeeklyPanel.status` contra uma tabela explícita; a fixture `weekly-panel.invalid-transition.json` falha com erro estável e não altera o arquivo de entrada.
- [ ] AC3: As cinco fixtures declaradas na File List cobrem CampaignPlan válido, propriedade extra, WeeklyPanel válido, transição inválida e métrica `nao_fornecido` sem valor inventado.
- [ ] AC4: `node scripts/validate-aula-04-contracts.mjs <arquivo>` emite JSON determinístico com contrato, versão, arquivo, validade e erros ordenados; usa exit code `0` para válido, `1` para contrato inválido e `2` para uso ou I/O inválido.
- [ ] AC5: Versão desconhecida falha fechado com indicação de migração explícita; testes comparam o input antes/depois e provam que validação não infere, preenche nem normaliza qualquer métrica.

## Tasks

- [ ] Confirmar o baseline integrado, a conclusão de 16.W1.1 e a ausência de PR cobrindo este escopo.
- [ ] Congelar fixtures, tabela de transições, envelope de saída e exit codes em testes antes da implementação.
- [ ] Endurecer os dois schemas e implementar a CLI somente dentro da File List aprovada.
- [ ] Rodar fixtures válidas e inválidas, testes de imutabilidade e snapshots de erro.
- [ ] Registrar evidência sanitizada; atualizar checkboxes e a File List real sem editar o epic state fora do fan-in.

## File List

- `data/contracts/campaign-plan.v1.schema.json`
- `data/contracts/weekly-panel.v1.schema.json`
- `data/contracts/fixtures/aula-04/campaign-plan.valid.json`
- `data/contracts/fixtures/aula-04/campaign-plan.additional-property.invalid.json`
- `data/contracts/fixtures/aula-04/weekly-panel.valid.json`
- `data/contracts/fixtures/aula-04/weekly-panel.invalid-transition.json`
- `data/contracts/fixtures/aula-04/weekly-panel.metric-not-provided.valid.json`
- `scripts/validate-aula-04-contracts.mjs`
- `scripts/validate-aula-04-contracts.test.mjs`
- `docs/stories/epic-17/STORY-17.W1.1-data-contract-validators.md`
- `docs/stories/epic-17/evidence/STORY-17.W1.1.md`

A File List é uma allow-list inicial. Criação, alteração ou renomeação fora dela exige atualização da story e nova validação de arquitetura.

## Dev Notes

- Baseline integrado: `f989ce6`. A story só pode ser despachada com `16.W1.1` em `Done` e seu ProjectBrief v1 presente no baseline de execução.
- `campaign-plan.v1.schema.json` ainda permite conteúdo arbitrário em `structure`; `weekly-panel.v1.schema.json` ainda permite `payload` arbitrário e deixa atribuição e premissa opcionais. Feche apenas estruturas conhecidas e preserve extensibilidade por mecanismo versionado explícito.
- Validação de transição exige o estado anterior como input explícito da CLI ou fixture; não deve ser simulada como propriedade isolada do schema.
- Ordene erros por caminho e keyword antes de serializar JSON, garantindo snapshots reproduzíveis.
- O escopo documental é exclusivo desta story e de sua evidência; `epic-17-state.json` pertence ao fan-in.
- `deploy_type: none`: a prova é local, por testes Node e execução da CLI.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["node:test", "json-schema", "cli-snapshots"]
repo_target: "marketingLendario/cohort-de-marketing"
model: "sonnet"
```

## Validação

- `node --test scripts/validate-aula-04-contracts.test.mjs`
- Execução da CLI para todas as fixtures com verificação de stdout e exit code.
- Comparação byte a byte dos inputs antes e depois da validação.

## Stop Conditions

- O schema precisar duplicar ou reinterpretar o ProjectBrief v1.
- A validação alterar, completar ou inferir dados do operador.
- A solução exigir contrato, ID, path ou serviço privado do Studio.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-14 | @po | Contrato enriquecido e validado para execução na PUB-17 W1. |
