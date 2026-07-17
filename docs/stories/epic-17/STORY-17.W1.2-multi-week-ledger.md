---
status: Done
story_id: "17.W1.2"
title: "Ledger multi-semana com proveniência"
epic: 17
wave: "W1"
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

Done

## Dependências

- 17.W1.1

## Acceptance Criteria

- [x] AC1: Cada entrada do `weekly-ledger.v1` referencia `projectId`, `campaignId`, `weekStart`, `revision`, `weeklyPanelId`, `schemaVersion` e o hash canônico do registro validado.
- [x] AC2: Toda métrica preserva valor ou ausência explícita, selo, referência estruturada de fonte, janela de atribuição, referência estruturada de premissa aplicável e confirmação humana; proveniência livre ou inválida falha fechado sem ecoar o valor.
- [x] AC3: Repetir a mesma identidade e hash é idempotente; a mesma identidade com hash diferente retorna conflito, exit code não zero e não modifica o ledger existente.
- [x] AC4: Revisão posterior é anexada sem sobrescrever a anterior, e a fixture de três semanas produz índice consultável por projeto, campanha e semana em ordem determinística.
- [x] AC5: A saída contém somente referências, metadados e métricas do contrato; testes provam que conteúdo bruto, decisões históricas e dados pessoais não são copiados nem reescritos.

## Tasks

- [x] Confirmar que 17.W1.1 está `Done`, seus validators passam e não existe PR cobrindo este escopo.
- [x] Congelar schema, serialização canônica, identidade, algoritmo de hash e fixtures antes da implementação.
- [x] Implementar builder append-only e índice de consulta somente dentro da File List aprovada.
- [x] Testar três semanas, nova revisão, replay idempotente, conflito e métrica sem proveniência.
- [x] Registrar evidência sanitizada; atualizar checkboxes e a File List real sem editar o epic state fora do fan-in.

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
- Serialize writers com lock cross-process identificado por owner/token desde a leitura até o rename; recupere somente locks mortos e stale, aplique CAS antes do rename e libere apenas o lock do próprio owner.
- `source` e `premise` de entrada devem ser referências `ref:<kind>:<id>` permitidas. O ledger projeta somente `{kind,id}` em `sourceRef`/`premiseRef`, nunca a string bruta.
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

## Dev Agent Record

```yaml
agent_model: "GPT-5 Codex"
completion_notes:
  - "Preflight confirmou baseline 85cad24, 17.W1.1 Done, validators verdes e nenhum PR aberto cobrindo o escopo."
  - "TDD RED congelou identidade composta, serialização JSON canônica, SHA-256, fixtures e envelopes de saída no commit 65c6b75."
  - "Builder valida WeeklyPanel v1 pelo contrato de W1.1, valida o ledger completo e só então faz rename atômico do temporário."
  - "Replay idempotente não toca o arquivo; conflito, lote inválido, ledger forjado e falha de I/O preservam o destino."
  - "QG1 reproduziu perda de updates com writers concorrentes e vazamento por source/premise livres; ambos foram congelados em RED no commit bf61b2a."
  - "O commit e3636f6 adiciona lock cross-process com owner/token, timeout, recuperação stale/crash, CAS com retry e projeção referencial minimizada."
  - "O commit fffec23 fecha premiseRef para kind assumption também na validação de ledger prévio e prova preservação byte a byte contra kind forjado."
  - "QG2 confirmou privacidade e concorrência normal, mas reproduziu 22/24 writers sobre lock stale e commit após troca de owner/token; veredito FAIL 64."
  - "O RED 4bf2f0b congela recovery concorrente, gap mkdir/owner, fencing antes do rename, replay, SIGKILL e symlink."
  - "O commit 2d354d5 substitui remoção cega por claim do owner em quarantine mais rmdir atômico, repete ENOENT e aplica fencing dev/ino, PID e token antes da leitura, CAS e rename."
  - "Executados 21/21 testes focais e 66/66 testes Node completos; recovery stale 24/24 passou em oito repetições adicionais e hijack abortou sem commit."
  - "QG3 independente aprovou o HEAD d27a101 com PASS 98/100, alta confiança e zero blockers; story fechada como Done sem alterar epic-state."
file_list:
  - "data/contracts/weekly-ledger.v1.schema.json"
  - "scripts/build-weekly-ledger.mjs"
  - "scripts/build-weekly-ledger.test.mjs"
  - "aula-04/fixtures/ledger-three-weeks.input.jsonl"
  - "aula-04/fixtures/ledger-three-weeks.expected.json"
  - "aula-04/fixtures/ledger-idempotent.input.jsonl"
  - "aula-04/fixtures/ledger-conflict.input.jsonl"
  - "docs/stories/epic-17/STORY-17.W1.2-multi-week-ledger.md"
  - "docs/stories/epic-17/evidence/STORY-17.W1.2.md"
```

## QA Results

```yaml
quality_gate_report:
  story_id: "17.W1.2"
  verdict: "PASS"
  score: 98
  confidence: high
  blocking_findings: 0
  rounds:
    - round: 1
      verdict: "FAIL"
      score: 52
      findings:
        - "Writers concorrentes perdiam updates."
        - "Source/premise livres permitiam copiar PII, decisão e conteúdo bruto."
    - round: 2
      verdict: "FAIL"
      score: 64
      findings:
        - "Recovery concorrente de lock stale removia locks recém-adquiridos."
        - "Owner antigo ainda commitava após troca de owner/token."
    - round: 3
      verdict: "PASS"
      score: 98
      confidence: high
      blocking_findings: 0
  reviewed_by: "@architect"
  reviewed_at: "2026-07-15"
  reviewed_head: "d27a1017d320552e263f3468b7ed907c548cb1f6"
```

## Stop Conditions

- O modelo exigir reescrever semanas ou decisões históricas.
- A chave de deduplicação depender apenas de filename.
- O ledger precisar incorporar conteúdo bruto ou dado pessoal para ser consultável.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-14 | @po | Contrato enriquecido e validado para execução na PUB-17 W1. |
| 2026-07-15 | @dev | TDD RED congelou schema, identidade composta, hash canônico, fixtures e garantias de imutabilidade. |
| 2026-07-15 | @dev | Desenvolvimento e evidências concluídos; story movida para `InReview` com 10/10 testes focais e 55/55 testes Node verdes. |
| 2026-07-15 | @architect | QG1 `FAIL 52`: concorrência perdia entradas e proveniência livre permitia PII/decisão/conteúdo bruto. |
| 2026-07-15 | @dev | Remediação RED/GREEN concluída com lock+CAS, recuperação de owner e referências minimizadas; story mantida `InReview` para QG2 independente. |
| 2026-07-15 | @architect | QG2 `FAIL 64`: recovery stale concorrente removia lock novo e owner antigo ainda commitava após hijack. |
| 2026-07-15 | @dev | Remediação Round3 concluída com quarantine+rmdir, retry de ENOENT e fencing de owner/token; story mantida `InReview` para QG3 independente. |
| 2026-07-15 | @architect | QG3 `PASS 98`: alta confiança, zero blockers e todos os probes de recovery, fencing, privacidade e regressão verdes no HEAD `d27a101`. |
| 2026-07-15 | @po | Story fechada como `Done`, hill phase `done`; atualização do epic state e fan-in reservados ao `@devops`. |
