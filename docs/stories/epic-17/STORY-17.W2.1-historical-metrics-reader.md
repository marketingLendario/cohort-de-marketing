---
status: Ready
story_id: "17.W2.1"
title: "Leitura histórica sem invenção"
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
depends_on: ["17.W1.2"]
consumes_artifacts_of: ["17.W1.2"]
entity_input:
  entity_type: "WeeklyLedgerV1"
  description: "Ledger append-only validado e consultável produzido pela Story 17.W1.2."
  status_expected: "queryable"
entity_output:
  entity_type: "HistoricalMetricsReadingV1"
  description: "Leitura histórica determinística com valores confirmados, ausências, proveniência e compatibilidade de janelas explícitas."
  status_expected: "reviewable"
touched_paths:
  - ".claude/skills/leitor-de-metricas/SKILL.md"
  - ".agents/skills/leitor-de-metricas/SKILL.md"
  - "scripts/read-aula-04-history.mjs"
  - "scripts/read-aula-04-history.test.mjs"
  - "aula-04/templates/leitura-historica.yaml"
  - "aula-04/fixtures/history-compatible.ledger.json"
  - "aula-04/fixtures/history-incompatible.ledger.json"
  - "aula-04/fixtures/history-missing.ledger.json"
  - "docs/stories/epic-17/STORY-17.W2.1-historical-metrics-reader.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.1.md"
affected_paths:
  - ".claude/skills/leitor-de-metricas/SKILL.md"
  - ".agents/skills/leitor-de-metricas/SKILL.md"
  - "scripts/read-aula-04-history.mjs"
  - "scripts/read-aula-04-history.test.mjs"
  - "aula-04/templates/leitura-historica.yaml"
  - "aula-04/fixtures/history-compatible.ledger.json"
  - "aula-04/fixtures/history-incompatible.ledger.json"
  - "aula-04/fixtures/history-missing.ledger.json"
  - "docs/stories/epic-17/STORY-17.W2.1-historical-metrics-reader.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.1.md"
---

# STORY-17.W2.1 - Leitura histórica sem invenção

> **Depends On:** 17.W1.2
> **Estimated Effort:** 7h

## Story

**As a / Como** operador que revisa o desempenho de uma campanha ao longo do tempo

**I want / Quero** ler métricas confirmadas do WeeklyLedger em ordem determinística

**so that / Para que** eu compare semanas sem inventar números, apagar ausências ou misturar janelas incompatíveis.

## Status

Ready

## Dependências

- 17.W1.2

## Acceptance Criteria

- [ ] AC1: O CLI aceita apenas um `weekly-ledger.v1` válido, exige seleção explícita de `projectId` e `campaignId` e emite envelope versionado em ordem `weekStart`, `revision`, nome de métrica; ledger, seleção ou JSON inválidos falham fechado com exit code não zero e sem valores no erro.
- [ ] AC2: Cada observação preserva literalmente `value` ou `null`, `seal`, `sourceRef`, `premiseRef`, `attributionWindow`, `confirmedByHuman`, `cashConfirmed`, `weekStart`, `revision`, `weeklyPanelId` e `canonicalHash`; nenhuma métrica, fonte, premissa ou revisão é inferida.
- [ ] AC3: A saída separa séries `Real`, `Estimado` e `nao_fornecido`. Valores ausentes nunca viram zero, e métricas ausentes em uma semana permanecem `nao_fornecido` somente quando há um slot nominal já observado no ledger selecionado.
- [ ] AC4: Comparação só fica `comparable` quando as observações selecionadas têm o mesmo nome, a mesma janela literal não nula e valores numéricos confirmados. Janela divergente/nula, selo ausente, valor ausente ou falta de confirmação humana gera estado explícito, aviso e `requiresHumanDecision: true`, sem delta, agregação ou tendência.
- [ ] AC5: CPA, ROAS e qualquer tendência são apenas ecoados como observações quando existem no ledger; nunca são derivados. A saída de uma única semana usa o mesmo contrato e retorna comparação `insufficient_history`, preservando compatibilidade de leitura da Aula 3.
- [ ] AC6: A skill canônica e seu espelho documentam o modo histórico, o comando, o contrato não-inferir e a fronteira pública; mirror parity e golden outputs cobrem semanas compatíveis, incompatíveis, ausências e uma única semana.

## Tasks

- [ ] Confirmar baseline `d0bc5ed`, 17.W1.2 `Done`, contrato WeeklyLedger v1 e ausência de PR cobrindo o escopo.
- [ ] Congelar por TDD RED o envelope, ordenação, proveniência, estados ausentes e matriz de compatibilidade antes do código.
- [ ] Implementar reader e modo histórico da skill somente dentro da File List aprovada.
- [ ] Executar testes focais, adjacentes do ledger/validators, mirror parity e golden outputs.
- [ ] Registrar evidência sanitizada; atualizar checkboxes e File List real sem editar o epic state fora do fan-in.

## File List

- `.claude/skills/leitor-de-metricas/SKILL.md`
- `.agents/skills/leitor-de-metricas/SKILL.md`
- `scripts/read-aula-04-history.mjs`
- `scripts/read-aula-04-history.test.mjs`
- `aula-04/templates/leitura-historica.yaml`
- `aula-04/fixtures/history-compatible.ledger.json`
- `aula-04/fixtures/history-incompatible.ledger.json`
- `aula-04/fixtures/history-missing.ledger.json`
- `docs/stories/epic-17/STORY-17.W2.1-historical-metrics-reader.md`
- `docs/stories/epic-17/evidence/STORY-17.W2.1.md`

A File List é uma allow-list inicial. Criação, alteração ou renomeação fora dela exige atualização da story e nova validação de arquitetura.

## Dev Notes

- Baseline integrado: `d0bc5ed1aff114d616402e98b7ec17e25b7c2309`; W1 está concluída e esta story pode executar em paralelo com 17.W2.3.
- O reader consome o `WeeklyLedgerV1` persistido; não abre WeeklyPanel bruto, projeto privado, Studio, API, credencial ou export de plataforma.
- `sourceRef` e `premiseRef` são referências estruturadas já minimizadas por 17.W1.2. Nunca resolva essas referências nem copie artefatos apontados por elas.
- Não preencha lacunas com zero. Um slot ausente só pode ser materializado para um nome de métrica literalmente presente em outra entrada da seleção; nomes externos ou catálogo implícito são proibidos.
- Não use aritmética para produzir delta, média, taxa, tendência, CPA ou ROAS. A comparabilidade é somente um estado estrutural; a interpretação continua humana.
- A saída de erro deve identificar caminho/código seguro, nunca ecoar valor, conteúdo bruto, token ou credencial.
- `deploy_type: none`: toda prova é local e read-only.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["node:test", "json-schema", "golden-fixtures", "mirror-parity"]
repo_target: "marketingLendario/cohort-de-marketing"
model: "sonnet"
```

## Validação

- `node --test scripts/read-aula-04-history.test.mjs`
- `node --test scripts/build-weekly-ledger.test.mjs scripts/validate-aula-04-contracts.test.mjs`
- Fixtures de semanas compatíveis, incompatíveis, ausentes e leitura de uma única semana.
- Comparação byte a byte de `.claude/skills/leitor-de-metricas/SKILL.md` e `.agents/skills/leitor-de-metricas/SKILL.md`.
- Golden outputs sem números inventados, agregados ou derivados.

## Dev Agent Record

```yaml
agent_model: "GPT-5 Codex"
completion_notes: []
file_list: []
```

## QA Results

```yaml
quality_gate_report:
  story_id: "17.W2.1"
  verdict: "NOT_RUN"
```

## Stop conditions

- A skill precisar acessar credencial, API, projeto privado ou Studio.
- A comparação remover selo, proveniência, janela, revisão ou ausência explícita.
- O resultado depender de inferir catálogo de métricas, valor, delta, taxa ou tendência.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @po | Contrato W2.1 materializado na baseline `d0bc5ed`; story pronta para execução paralela com 17.W2.3. |
