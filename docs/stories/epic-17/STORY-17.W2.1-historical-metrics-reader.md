---
status: Done
story_id: "17.W2.1"
title: "Leitura histórica sem invenção"
epic: 17
wave: "W2"
parent_epic: "docs/stories/epic-17/EPIC-17-AULA-04-DATA-FOUNDATION.md"
effort: 7h
deploy_type: none
appetite: 1d
hill_phase: done
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
  - "scripts/build-weekly-ledger.mjs"
  - "scripts/build-weekly-ledger.test.mjs"
  - "data/contracts/weekly-ledger.v1.schema.json"
  - "aula-04/fixtures/ledger-three-weeks.expected.json"
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
  - "scripts/build-weekly-ledger.mjs"
  - "scripts/build-weekly-ledger.test.mjs"
  - "data/contracts/weekly-ledger.v1.schema.json"
  - "aula-04/fixtures/ledger-three-weeks.expected.json"
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

Done

## Dependências

- 17.W1.2

## Acceptance Criteria

- [x] AC1: O CLI aceita apenas um `weekly-ledger.v1` válido, exige seleção explícita de `projectId` e `campaignId` e emite envelope versionado em ordem `weekStart`, `revision`, nome de métrica; ledger, seleção ou JSON inválidos falham fechado com exit code não zero e sem valores no erro.
- [x] AC2: Cada observação preserva literalmente `value` ou `null`, `seal`, `sourceRef`, `premiseRef`, `attributionWindow`, `confirmedByHuman`, `cashConfirmed`, `weekStart`, `revision`, `weeklyPanelId` e `canonicalHash`; nenhuma métrica, fonte, premissa ou revisão é inferida.
- [x] AC3: A saída separa séries `Real`, `Estimado` e `nao_fornecido`. Valores ausentes nunca viram zero, e métricas ausentes em uma semana permanecem `nao_fornecido` somente quando há um slot nominal já observado no ledger selecionado.
- [x] AC4: Comparação só fica `comparable` quando as observações selecionadas têm o mesmo nome, a mesma janela literal não nula e valores numéricos confirmados. Janela divergente/nula, selo ausente, valor ausente ou falta de confirmação humana gera estado explícito, aviso e `requiresHumanDecision: true`, sem delta, agregação ou tendência.
- [x] AC5: CPA, ROAS e qualquer tendência são apenas ecoados como observações quando existem no ledger; nunca são derivados. A saída de uma única semana usa o mesmo contrato e retorna comparação `insufficient_history`, preservando compatibilidade de leitura da Aula 3.
- [x] AC6: A skill canônica e seu espelho documentam o modo histórico, o comando, o contrato não-inferir e a fronteira pública; mirror parity e golden outputs cobrem semanas compatíveis, incompatíveis, ausências e uma única semana.
- [x] AC7: WeeklyLedger `1.1.0` preserva o `canonicalHash` do WeeklyPanel e acrescenta digest SHA-256 versionado da projeção completa; builder e reader recomputam a mesma representação canônica e rejeitam valor, fonte ou hash adulterado.
- [x] AC8: Histórico suficiente exige ao menos dois `weekStart` distintos, independentemente da quantidade de revisões, e lexemas inteiros/decimais fora da faixa segura são rejeitados antes de `JSON.parse` sem arredondamento.

## Tasks

- [x] Confirmar baseline `d0bc5ed`, 17.W1.2 `Done`, contrato WeeklyLedger v1 e ausência de PR cobrindo o escopo.
- [x] Congelar por TDD RED o envelope, ordenação, proveniência, estados ausentes e matriz de compatibilidade antes do código.
- [x] Implementar reader e modo histórico da skill somente dentro da File List aprovada.
- [x] Executar testes focais, adjacentes do ledger/validators, mirror parity e golden outputs.
- [x] Registrar evidência sanitizada; atualizar checkboxes e File List real sem editar o epic state fora do fan-in.

## File List

- `.claude/skills/leitor-de-metricas/SKILL.md`
- `.agents/skills/leitor-de-metricas/SKILL.md`
- `scripts/read-aula-04-history.mjs`
- `scripts/read-aula-04-history.test.mjs`
- `scripts/build-weekly-ledger.mjs`
- `scripts/build-weekly-ledger.test.mjs`
- `data/contracts/weekly-ledger.v1.schema.json`
- `aula-04/fixtures/ledger-three-weeks.expected.json`
- `aula-04/templates/leitura-historica.yaml`
- `aula-04/fixtures/history-compatible.ledger.json`
- `aula-04/fixtures/history-incompatible.ledger.json`
- `aula-04/fixtures/history-missing.ledger.json`
- `docs/stories/epic-17/STORY-17.W2.1-historical-metrics-reader.md`
- `docs/stories/epic-17/evidence/STORY-17.W2.1.md`

A File List é uma allow-list inicial. Criação, alteração ou renomeação fora dela exige atualização da story e nova validação de arquitetura.

## Dev Notes

- Baseline integrado: `d0bc5ed1aff114d616402e98b7ec17e25b7c2309`; W1 está concluída e esta story pode executar em paralelo com 17.W2.3.
- O reader consome o `WeeklyLedgerV1` persistido na versão `1.1.0`; não abre WeeklyPanel bruto, projeto privado, Studio, API, credencial ou export de plataforma.
- `canonicalHash` continua sendo o hash de proveniência do WeeklyPanel completo. `projectionDigest` é SHA-256 sobre a entrada persistida sem o próprio digest, serializada por chaves recursivamente ordenadas conforme `projectionDigestVersion: 1.0.0`.
- Ledgers `1.0.0` não recebem integridade retroativa: devem ser reconstruídos a partir dos WeeklyPanels validados para produzir `1.1.0`.
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
completion_notes:
  - "Preflight confirmou baseline d0bc5ed, 17.W1.2 Done e nenhum PR aberto cobrindo o escopo."
  - "Materialização W2 foi isolada no commit 9e9fa73; W2.1 e W2.3 estão Ready em paralelo e W2.2 segue bloqueada."
  - "TDD RED no commit bcc67c9 congelou envelope, fixtures, compatibilidade, ausências, single-week e erros sanitizados; 8/8 testes falharam pela ausência do reader."
  - "O commit d3b7842 implementa validação AJV 2020-12 e semântica do índice, projeção read-only, agrupamento por selo e estados sem cálculo derivado."
  - "Testes focais 8/8, adjacentes 37/37 e suíte Node completa 76/76 passaram; mirrors têm SHA-256 idêntico."
  - "Story movida para InReview; epic state permanece reservado ao fan-in após QG independente."
  - "QG1 reprovou o HEAD 0bbb009 com FAIL 58 por integridade não verificável, revisões contadas como semanas e rounding numérico."
  - "A allow-list foi expandida no commit 647e66e antes de tocar builder/schema; RED Round2 no commit 0aaf771 reproduziu 14 falhas."
  - "O commit ad63a79 versiona WeeklyLedger 1.1.0, preserva canonicalHash, adiciona digest recomputável, conta semanas distintas e bloqueia números inseguros antes do parse."
  - "Remediação passou em 35/35 testes focais e 82/82 testes Node completos; story permanece InReview para QG2 independente."
  - "QG2 reprovou o HEAD d689f81 com FAIL 88 porque JSON.stringify tratava apenas a ordem das chaves dos objetos do index como semântica."
  - "RED Round3 no commit d26301b reproduziu a falsa rejeição no builder e reader; o commit 975571b compartilha canonicalSerialize para igualdade estrutural preservando a ordem dos arrays."
  - "Round3 passou em 37/37 testes focais e 127/127 no gate completo controlado; story permanece InReview para QG3 independente."
  - "QG3 independente aprovou o HEAD b2389ae com PASS 100/100, confiança 0.99 e zero blockers."
  - "Story fechada como Done e hill phase done; epic-state e desbloqueio de W2.2 permanecem reservados ao fan-in @devops."
file_list:
  - ".claude/skills/leitor-de-metricas/SKILL.md"
  - ".agents/skills/leitor-de-metricas/SKILL.md"
  - "scripts/read-aula-04-history.mjs"
  - "scripts/read-aula-04-history.test.mjs"
  - "scripts/build-weekly-ledger.mjs"
  - "scripts/build-weekly-ledger.test.mjs"
  - "data/contracts/weekly-ledger.v1.schema.json"
  - "aula-04/fixtures/ledger-three-weeks.expected.json"
  - "aula-04/templates/leitura-historica.yaml"
  - "aula-04/fixtures/history-compatible.ledger.json"
  - "aula-04/fixtures/history-incompatible.ledger.json"
  - "aula-04/fixtures/history-missing.ledger.json"
  - "docs/stories/epic-17/STORY-17.W2.1-historical-metrics-reader.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.1.md"
```

## QA Results

```yaml
quality_gate_report:
  story_id: "17.W2.1"
  verdict: "PASS"
  score: 100
  confidence: 0.99
  blocking_findings: 0
  rounds:
    - round: 1
      verdict: "FAIL"
      score: 58
      blocking_findings:
        - "A projeção persistida não tinha digest recomputável; valor ou sourceRef adulterado passava na leitura."
        - "Múltiplas revisões da mesma semana eram contadas como histórico suficiente."
        - "Lexemas numéricos fora da faixa JSON segura podiam ser arredondados antes da saída."
    - round: 2
      verdict: "FAIL"
      score: 88
      reviewed_head: "d689f81"
      blocking_findings:
        - "A ordem das chaves de objetos do index era tratada como semântica por JSON.stringify."
    - round: 3
      verdict: "PASS"
      score: 100
      confidence: 0.99
      blocking_findings: 0
      reviewed_head: "b2389ae"
  remediation:
    status: "COMPLETE"
    round2_implementation_head: "ad63a79"
    round3:
      red_head: "d26301b"
      implementation_head: "975571b"
      focal_tests: "37/37"
      full_gate_tests: "127/127"
  reviewed_by: "@architect"
  reviewed_at: "2026-07-15"
  reviewed_head: "b2389ae"
```

## Stop conditions

- A skill precisar acessar credencial, API, projeto privado ou Studio.
- A comparação remover selo, proveniência, janela, revisão ou ausência explícita.
- O resultado depender de inferir catálogo de métricas, valor, delta, taxa ou tendência.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @po | Contrato W2.1 materializado na baseline `d0bc5ed`; story pronta para execução paralela com 17.W2.3. |
| 2026-07-15 | @dev | TDD RED, implementação fail-closed e documentação da skill concluídos; 76/76 testes Node verdes e story movida para `InReview`. |
| 2026-07-15 | @architect | QG1 `FAIL 58`: digest de projeção ausente, contagem por revisão e arredondamento de lexema numérico bloquearam o fan-in. |
| 2026-07-15 | @dev | File List expandida antes da remediação para versionar WeeklyLedger, builder, schema e fixture esperada. |
| 2026-07-15 | @dev | Round2 RED/GREEN concluído com digest versionado, semanas distintas e lexer numérico seguro; story mantida em `InReview` para QG2. |
| 2026-07-15 | @architect | QG2 `FAIL 88`: igualdade via `JSON.stringify` rejeitava index semanticamente idêntico com chaves reordenadas. |
| 2026-07-15 | @dev | Round3 usa canonicalização compartilhada para objetos e preserva arrays posicionais; 37/37 focais e 127/127 completos verdes. |
| 2026-07-15 | @architect | QG3 `PASS 100`: confiança 0.99, zero blockers e todos os probes focais/completos verdes no HEAD `b2389ae`. |
| 2026-07-15 | @po | Story fechada como `Done`, hill phase `done`; epic-state e desbloqueio de W2.2 reservados ao fan-in `@devops`. |
