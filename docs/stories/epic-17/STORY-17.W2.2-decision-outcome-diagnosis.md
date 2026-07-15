---
status: Done
story_id: "17.W2.2"
title: "Diagnóstico decisão versus resultado"
epic: 17
wave: "W2"
parent_epic: "docs/stories/epic-17/EPIC-17-AULA-04-DATA-FOUNDATION.md"
effort: 7h
deploy_type: none
appetite: 1d
hill_phase: done
confidence_level: know-how
involves_ui: false
task_mode: MODIFICAR
cli: codex
model: sonnet
executor: "@dev"
quality_gate: "@architect"
repo_target: "marketingLendario/cohort-de-marketing"
accountable: "Rafael Costa"
depends_on: ["17.W1.2", "17.W2.1"]
consumes_artifacts_of: ["17.W1.2", "17.W2.1"]
entity_input:
  entity_type: "HistoricalMetricsReadingV1"
  description: "Leitura histórica aprovada pela Story 17.W2.1, além de decisão humana referenciada no ledger."
  status_expected: "reviewable"
entity_output:
  entity_type: "DecisionOutcomeDiagnosisV1"
  description: "Veredito longitudinal rastreável com uma única alavanca proposta e circuit breaker preservado."
  status_expected: "pending_human_decision"
touched_paths:
  - ".claude/skills/diagnosticador/SKILL.md"
  - ".agents/skills/diagnosticador/SKILL.md"
  - "data/contracts/decision-outcome-diagnosis.v1.schema.json"
  - "scripts/diagnose-aula-04-decision.mjs"
  - "scripts/diagnose-aula-04-decision.test.mjs"
  - "aula-04/fixtures/diagnosis-sustained.json"
  - "aula-04/fixtures/diagnosis-refuted.json"
  - "aula-04/fixtures/diagnosis-inconclusive.json"
  - "aula-04/fixtures/diagnosis-not-measurable.json"
  - "aula-04/templates/diagnostico-longitudinal.yaml"
  - "docs/stories/epic-17/STORY-17.W2.2-decision-outcome-diagnosis.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.2.md"
affected_paths:
  - ".claude/skills/diagnosticador/SKILL.md"
  - ".agents/skills/diagnosticador/SKILL.md"
  - "data/contracts/decision-outcome-diagnosis.v1.schema.json"
  - "scripts/diagnose-aula-04-decision.mjs"
  - "scripts/diagnose-aula-04-decision.test.mjs"
  - "aula-04/fixtures/diagnosis-sustained.json"
  - "aula-04/fixtures/diagnosis-refuted.json"
  - "aula-04/fixtures/diagnosis-inconclusive.json"
  - "aula-04/fixtures/diagnosis-not-measurable.json"
  - "aula-04/templates/diagnostico-longitudinal.yaml"
  - "docs/stories/epic-17/STORY-17.W2.2-decision-outcome-diagnosis.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.2.md"
---

# STORY-17.W2.2 - Diagnóstico decisão versus resultado

## Status

Done — QG3 rodada 2 aprovado; fan-in permanece reservado a `@devops`.

## Dependências

- 17.W1.2
- 17.W2.1

## Objetivo

Estender `diagnosticador` para confrontar a decisão anterior com o resultado observado antes de sugerir nova alavanca.

## Critérios de aceite

- [x] Diagnóstico referencia por ID a hipótese, alavanca, critério de sucesso, janela e reversão da decisão anterior; texto ausente falha fechado.
- [x] Resultado é classificado deterministicamente como `sustentou`, `refutou`, `inconclusivo` ou `nao_mensuravel`, consumindo somente o contrato aprovado de 17.W2.1.
- [x] Exatamente zero ou uma nova alavanca é proposta; ausência de evidência suficiente produz pendência e zero alavancas.
- [x] Circuit breaker, reversão e decisão humana permanecem obrigatórios; nenhum comando mutante ou integração de plataforma é introduzido.
- [x] Ausência, janela incompatível ou evidência estimada não gera narrativa conclusiva nem reescreve decisão histórica.

## Tasks

- [x] Confirmar baseline e contratos consumidores.
- [x] Definir fixtures e testes antes do código.
- [x] Implementar dentro da File List aprovada.
- [x] Registrar evidência sanitizada.
- [x] Atualizar checkboxes e File List real; state JSON permanece reservado ao fan-in `@devops`.

## File List proposta

- `.claude/skills/diagnosticador/SKILL.md`
- `.agents/skills/diagnosticador/SKILL.md`
- `data/contracts/decision-outcome-diagnosis.v1.schema.json`
- `scripts/diagnose-aula-04-decision.mjs`
- `scripts/diagnose-aula-04-decision.test.mjs`
- `aula-04/fixtures/diagnosis-sustained.json`
- `aula-04/fixtures/diagnosis-refuted.json`
- `aula-04/fixtures/diagnosis-inconclusive.json`
- `aula-04/fixtures/diagnosis-not-measurable.json`
- `aula-04/templates/diagnostico-longitudinal.yaml`
- `docs/stories/epic-17/STORY-17.W2.2-decision-outcome-diagnosis.md`
- `docs/stories/epic-17/evidence/STORY-17.W2.2.md`

A File List é uma allow-list inicial. Mudanças fora dela exigem rematerialização e validação de arquitetura.

## Dev Notes

- Baseline integrada: `1c4f84ab0644312877838797d8c4477a9914b3ae`; 17.W1.2 e 17.W2.1 estão `Done` com QG aprovado. 17.W2.3 também está `Done` e fornece `SourceReconciliationV1` como evidência opcional estritamente validada.
- O CLI recebe um bundle local fechado contendo a decisão anterior estruturada e `HistoricalMetricsReading 1.0.0`. `SourceReconciliation 1.0.0` é obrigatório somente para `revenue`, `orders`, `refunds`, `fees` e `net_revenue`; para `cpa`, `roas`, `spend` e `ctr`, deve ser omitido e o output registra `sourceReconciliation: null`. O CLI não abre WeeklyLedger, WeeklyPanel bruto, Studio, API, checkout, caixa, credencial ou projeto privado.
- Critérios usam operadores e limiares decimais explícitos; hipótese, alavanca, janela, sucesso, reversão, circuit breaker e decisão humana são preservados por IDs tipados. Texto livre é obrigatório no input para impedir decisão vazia, mas nunca é republicado no diagnóstico.
- O veredito usa somente códigos determinísticos. Evidência ausente, estimada, incompatível, insuficiente ou não reconciliada nunca produz conclusão causal.
- Uma eventual nova alavanca precisa estar pré-autorizada na decisão anterior e só pode ser referenciada; o CLI não executa mutação.
- `deploy_type: none`: toda prova é local, determinística e read-only.

## Validação

- Golden cases para quatro vereditos.
- Mirror parity.
- Teste de uma única alavanca e circuit breaker.

## Dev Agent Record

```yaml
agent_model: "GPT-5 Codex"
completion_notes:
  - "Preflight confirmou baseline 1c4f84a, 17.W1.2/17.W2.1 Done, W2.3 disponível e nenhum PR aberto cobrindo 17.W2.2."
  - "A File List foi rematerializada no commit 2d20738 antes de criar CLI, schema, testes ou fixtures."
  - "TDD RED no commit 2f96359 congelou sete grupos e quatro goldens; 7/7 falharam pela ausência do CLI."
  - "RED adicional 864f862 fechou projectId, campaignId, weeklyPanelId e sourceRef contra PII/credencial republicável."
  - "O commit a803b45 implementa request fechado, comparação decimal exata, quatro vereditos, provenance-only output e zero/uma alavanca pré-autorizada."
  - "QG3 rodada 1 identificou o acoplamento impossível entre métricas de tráfego W2.1 e a reconciliação financeira W2.3."
  - "RED 3b43af2 congelou CPA, ROAS, spend e CTR mensuráveis/não mensuráveis, além dos guards de reconciliação financeira ausente, nula ou incompatível."
  - "GREEN 59019d3 tornou SourceReconciliation condicional: obrigatório para métricas financeiras, omitido no request e null no output para métricas de tráfego, sempre com proveniência W2.1."
  - "Testes focais 10/10, adjacentes 70/70 e gate Node completo controlado 152/152 passaram; mirrors são byte a byte idênticos."
  - "Story movida para InReview; QG, fechamento, epic-state, merge, push e deploy permanecem fora da autoridade do executor."
file_list:
  - ".claude/skills/diagnosticador/SKILL.md"
  - ".agents/skills/diagnosticador/SKILL.md"
  - "data/contracts/decision-outcome-diagnosis.v1.schema.json"
  - "scripts/diagnose-aula-04-decision.mjs"
  - "scripts/diagnose-aula-04-decision.test.mjs"
  - "aula-04/fixtures/diagnosis-sustained.json"
  - "aula-04/fixtures/diagnosis-refuted.json"
  - "aula-04/fixtures/diagnosis-inconclusive.json"
  - "aula-04/fixtures/diagnosis-not-measurable.json"
  - "aula-04/templates/diagnostico-longitudinal.yaml"
  - "docs/stories/epic-17/STORY-17.W2.2-decision-outcome-diagnosis.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.2.md"
```

## QA Results

```yaml
quality_gate_report:
  story_id: "17.W2.2"
  round: 1
  verdict: "FAIL"
  score: 84
  confidence: 0.98
  blockers:
    - "O diagnóstico declara cpa, roas, spend e ctr, mas exige SourceReconciliationV1 para todo request; esse contrato aceita apenas métricas financeiras, tornando leituras W2.1 não financeiras contratualmente impossíveis até mesmo para nao_mensuravel."
  required_remediation:
    - "Permitir diagnóstico não financeiro sem exigir uma reconciliação impossível, com reason code determinístico e testes para cpa, roas, spend e ctr, ou restringir explicitamente o domínio inteiro às métricas financeiras."
  reviewed_by: "@architect"
  reviewed_at: "2026-07-15"
  reviewed_head: "cdbe081370d92bcd5589f52ce8b1311931c0b25d"

remediation_handoff:
  status: "ready_for_qg_round_2"
  red_commit: "3b43af2"
  green_commit: "59019d3"
  focal_tests: "10/10"
  adjacent_tests: "70/70"
  full_node_tests: "152/152"
  requested_reviewer: "@architect"

quality_gate_round_2:
  verdict: "PASS"
  score: 98
  confidence: 0.99
  blockers: []
  probes:
    focused: "10/10"
    full_node: "152/152"
    diff_check: "PASS"
    mirror_parity: "PASS"
  conclusion: "Métricas financeiras exigem SourceReconciliationV1 válida; CPA, ROAS, spend e CTR consomem somente a proveniência W2.1 e produzem null explícito, sem reconciliação sintética ou narrativa causal."
  reviewed_by: "@architect"
  reviewed_at: "2026-07-15"
  reviewed_head: "e0c31d00799112dc14c32f297028c00aaf7e3f0b"
```

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @dev | Escopo rematerializado sobre a baseline integrada, com dependências e PR coverage confirmados. |
| 2026-07-15 | @dev | RED congelou quatro goldens, estados adversariais, precisão, proveniência, PII e fronteira read-only. |
| 2026-07-15 | @dev | Implementação determinística concluída; 149/149 testes Node verdes e story movida para `InReview`. |
| 2026-07-15 | @architect | QG3 rodada 1 falhou: métricas não financeiras de W2.1 não atravessam a reconciliação financeira obrigatória de W2.3. |
| 2026-07-15 | @dev | Remediação preservou CPA/ROAS/spend/CTR com proveniência W2.1, reconciliação condicional e 152/152 testes Node verdes; retorna a InReview para QG3 rodada 2. |
| 2026-07-15 | @architect | QG3 rodada 2 aprovado com 98/100; blocker contratual fechado e story movida para `Done`. |

## Stop conditions adicionais

- 17.W2.1 não estiver `Done` com QG `PASS`.
- O diagnóstico precisar ler diretamente o ledger, API, checkout, caixa ou projeto privado em vez do contrato de leitura aprovado.

## Stop conditions

- Diagnóstico executar ação na plataforma.
- Modelo apagar decisão rejeitada ou inconclusiva.
