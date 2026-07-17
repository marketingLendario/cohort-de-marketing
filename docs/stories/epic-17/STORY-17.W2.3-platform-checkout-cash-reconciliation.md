---
status: Done
story_id: "17.W2.3"
title: "Reconciliação plataforma, checkout e caixa"
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

Done

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
  - "QG1 reprovou o HEAD eba476b com FAIL 78: reconciliationId, metric, window e provenanceRef.id ainda republicavam texto arbitrário permitido pelo charset genérico."
  - "O RED Round2 7a265cb cobre 32 mutações de input e todas as superfícies textuais republicadas; o caso reconciliationId:name reproduziu o vazamento."
  - "O GREEN Round2 82e6abf troca charsets genéricos por IDs opacos tipados, enums de métrica/janela/moeda/referência e aplica o guard textual recursivo também à saída."
  - "Round2 passou em 13/13 focais, matriz positiva 5 métricas x 8 janelas sem falsos positivos e gate Node adjacente controlado; story permanece InReview para QG2."
  - "QG2 reprovou o HEAD 7aa10e5 com FAIL 84: nonces hex exclusivamente numéricos de 11/14 dígitos ainda podiam transportar telefone, CPF ou CNPJ em reconciliationId e provenanceRef.id."
  - "O RED Round3 24fd5c3 reproduz telefone numérico de 11 dígitos aceito com exit 0 e cobre telefone, CPF e CNPJ nas duas superfícies, no input e no schema de saída."
  - "O GREEN Round3 92fbcc2 exige ao menos uma letra a-f em todo nonce opaco e adiciona ao guard recursivo sequências numéricas isoladas de 11/14 dígitos."
  - "Round3 passou em 14/14 focais, gate Node adjacente, seis casos numéricos novos de input e output e dois nonces numeric-shaped válidos sem falso positivo; story permanece InReview para QG3."
  - "QG3 reprovou o HEAD c6eacae com FAIL 82: o scan numérico global confundia valores monetários válidos de 11/14 dígitos com identificadores pessoais."
  - "O RED Round4 92a06f3 reproduz o falso positivo monetário e amplia a matriz para nonces válidos com letra a-f no início, meio e fim, em comprimentos 11/14."
  - "O GREEN Round4 1574f2c restringe o scan de 11/14 dígitos a reconciliationId/id; valores monetários permanecem sob o schema decimal e IDs sob os schemas opacos tipados."
  - "Round4 passou em 15/15 focais; o gate adjacente teve uma ocorrência transitória em teste de lock inalterado da baseline, reproduzida isoladamente, e o retry integral exato passou com exit 0. Story permanece InReview para QG4."
  - "QG4 independente aprovou o HEAD 2042ff4 com PASS 98/100, confiança alta e zero blockers."
  - "Story fechada como Done e hill phase done; epic-state, merge, push e fan-in permanecem reservados ao @devops."
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

```yaml
quality_gate_report:
  story_id: "17.W2.3"
  verdict: "PASS"
  score: 98
  confidence: high
  blocking_findings: 0
  rounds:
    - round: 1
      verdict: "FAIL"
      score: 78
      reviewed_head: "eba476b"
      blocking_findings:
        - "Campos textuais republicados aceitavam nomes, endereços e identificadores sensíveis sob charsets genéricos; scan heurístico não provava ausência de PII."
    - round: 2
      verdict: "FAIL"
      score: 84
      reviewed_head: "7aa10e5"
      blocking_findings:
        - "Nonces hex exclusivamente numéricos de 11/14 dígitos ainda aceitavam telefone, CPF ou CNPJ em reconciliationId e provenanceRef.id."
    - round: 3
      verdict: "FAIL"
      score: 82
      reviewed_head: "c6eacae"
      blocking_findings:
        - "O scan global de sequências numéricas de 11/14 dígitos rejeitava valores monetários válidos, apesar do contexto decimal tipado."
    - round: 4
      verdict: "PASS"
      score: 98
      confidence: high
      blocking_findings: 0
      reviewed_head: "2042ff4"
  remediation:
    status: "COMPLETE"
    red_head: "92a06f3"
    implementation_head: "1574f2c"
    focal_tests: "15/15"
    privacy_input_cases: 38
    privacy_output_cases: 14
    false_positive_cases: 48
  reviewed_by: "@architect"
  reviewed_at: "2026-07-15"
  reviewed_head: "2042ff4"
closure_acknowledgements:
  quality_gate: "@architect PASS 98/100, high confidence, zero blockers"
  executor: "@dev SDC_COMPLETE; AC, tasks, File List e evidência final conferidos"
  fan_in: "READY_FOR_DEVOPS; epic-state, merge, push e deploy não executados"
```

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @po | Story W2.3 validada como `Ready` sobre a baseline integrada da PUB-17 W2. |
| 2026-07-15 | @dev | TDD RED congelou contrato, fixtures e matriz adversarial antes do código. |
| 2026-07-15 | @dev | Implementação e evidência concluídas; 10/10 focais e gate Node adjacente verdes; status movido para `InReview`. |
| 2026-07-15 | @architect | QG1 `FAIL 78`: superfícies textuais permitiam republicação de PII sob charsets genéricos. |
| 2026-07-15 | @dev | Round2 RED/GREEN fecha todas as superfícies com allowlists positivas, 13/13 focais e matriz sem falsos positivos; story mantida em `InReview`. |
| 2026-07-15 | @architect | QG2 `FAIL 84`: nonces exclusivamente numéricos ainda comportavam telefone, CPF e CNPJ. |
| 2026-07-15 | @dev | Round3 RED/GREEN exige letra em nonce opaco, fecha sequências de 11/14 dígitos e passa 14/14 focais; story mantida em `InReview`. |
| 2026-07-15 | @architect | QG3 `FAIL 82`: scan numérico global gerava falso positivo em valores monetários válidos. |
| 2026-07-15 | @dev | Round4 RED/GREEN torna o guard numérico contextual, preserva IDs fail-closed e passa 15/15 focais; story mantida em `InReview`. |
| 2026-07-15 | @architect | QG4 `PASS 98/100`, confiança alta e zero blockers no HEAD `2042ff4`; story aceita. |
| 2026-07-15 | @dev | SDC fechado, story movida para `Done`, hill phase `done` e fan-in liberado exclusivamente para `@devops`. |
