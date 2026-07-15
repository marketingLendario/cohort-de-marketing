---
status: Blocked
story_id: "17.W2.2"
title: "Diagnóstico decisão versus resultado"
epic: 17
wave: "W2"
parent_epic: "docs/stories/epic-17/EPIC-17-AULA-04-DATA-FOUNDATION.md"
effort: 7h
deploy_type: none
appetite: 1d
hill_phase: uphill
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
  - "aula-04/templates/diagnostico-longitudinal.yaml"
  - "docs/stories/epic-17/STORY-17.W2.2-decision-outcome-diagnosis.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.2.md"
affected_paths:
  - ".claude/skills/diagnosticador/SKILL.md"
  - ".agents/skills/diagnosticador/SKILL.md"
  - "aula-04/templates/diagnostico-longitudinal.yaml"
  - "docs/stories/epic-17/STORY-17.W2.2-decision-outcome-diagnosis.md"
  - "docs/stories/epic-17/evidence/STORY-17.W2.2.md"
---

# STORY-17.W2.2 - Diagnóstico decisão versus resultado

## Status

Blocked — depende de 17.W2.1 `Done` e de seu contrato de saída aprovado.

## Dependências

- 17.W1.2
- 17.W2.1

## Objetivo

Estender `diagnosticador` para confrontar a decisão anterior com o resultado observado antes de sugerir nova alavanca.

## Critérios de aceite

- [ ] Diagnóstico referencia por ID a hipótese, alavanca, critério de sucesso, janela e reversão da decisão anterior; texto ausente falha fechado.
- [ ] Resultado é classificado deterministicamente como `sustentou`, `refutou`, `inconclusivo` ou `nao_mensuravel`, consumindo somente o contrato aprovado de 17.W2.1.
- [ ] Exatamente zero ou uma nova alavanca é proposta; ausência de evidência suficiente produz pendência e zero alavancas.
- [ ] Circuit breaker, reversão e decisão humana permanecem obrigatórios; nenhum comando mutante ou integração de plataforma é introduzido.
- [ ] Ausência, janela incompatível ou evidência estimada não gera narrativa conclusiva nem reescreve decisão histórica.

## Tasks

- [ ] Confirmar baseline e contratos consumidores.
- [ ] Definir fixtures e testes antes do código.
- [ ] Implementar dentro da File List aprovada.
- [ ] Registrar evidência sanitizada.
- [ ] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `.claude/skills/diagnosticador/SKILL.md`
- `.agents/skills/diagnosticador/SKILL.md`
- `aula-04/templates/diagnostico-longitudinal.yaml`
- `docs/stories/epic-17/STORY-17.W2.2-decision-outcome-diagnosis.md`
- `docs/stories/epic-17/evidence/STORY-17.W2.2.md`

A File List é uma allow-list inicial. Mudanças fora dela exigem rematerialização e validação de arquitetura.

## Validação

- Golden cases para quatro vereditos.
- Mirror parity.
- Teste de uma única alavanca e circuit breaker.

## Stop conditions adicionais

- 17.W2.1 não estiver `Done` com QG `PASS`.
- O diagnóstico precisar ler diretamente o ledger, API, checkout, caixa ou projeto privado em vez do contrato de leitura aprovado.

## Stop conditions

- Diagnóstico executar ação na plataforma.
- Modelo apagar decisão rejeitada ou inconclusiva.
