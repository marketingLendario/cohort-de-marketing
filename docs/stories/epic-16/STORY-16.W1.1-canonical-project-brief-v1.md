---
story_id: "16.W1.1"
epic_id: "16"
wave: "W1"
status: Done
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: ["node:test", "json-schema"]
repo_target: "cohort-de-marketing"
depends_on: []
effort: "6h"
deploy_type: "none"
accountable: "rafaelcosta"
appetite: "1d"
hill_phase: "done"
confidence_level: "know-how"
task_mode: "CRIAR"
involves_ui: false
---

# STORY-16.W1.1 - Contrato canônico ProjectBrief v1

## Status

Done

## Dependências

- Gate 0

## Objetivo

Congelar um único contrato versionado para projeto, com envelope persistente e migração explícita do documento standalone 0.1.0.

## Critérios de aceite

- [x] O schema v1 define identidade, revisão, status, dados e proveniência sem duplicar a semântica dos 120 campos.
- [x] A migração 0.1.0 para v1 é determinística, idempotente e preserva `not_applicable`, `pending_confirmation` e origem de campo.
- [x] Versão desconhecida, campo crítico inválido e downgrade implícito falham fechado.
- [x] Fixtures válidas, inválidas e de migração cobrem o contrato.
- [x] O contrato público não contém IDs, paths ou defaults específicos do Studio privado.

## Tasks

- [x] Confirmar baseline e ausência de PR cobrindo o escopo.
- [x] Congelar contrato e testes antes da implementação.
- [x] Implementar somente dentro da File List aprovada.
- [x] Rodar validações incrementais e registrar evidências sanitizadas.
- [x] Atualizar checkboxes, File List real e state JSON.

## File List proposta

- `data/project-brief.schema.json`
- `data/contracts/project-brief.v1.schema.json`
- `scripts/migrate-project-brief.mjs`
- `scripts/validate-project-brief-rules.mjs`
- `scripts/package.json`
- `scripts/package-lock.json`
- `data/contracts/fixtures/project-brief/**`
- `docs/stories/epic-16/**`

A File List é uma allow-list inicial. Criação ou alteração fora dela exige
atualização da story e nova validação de arquitetura.

Ampliação aprovada no remediation do QG Round 1: `scripts/package.json` e
`scripts/package-lock.json` passam a fazer parte da allow-list para fixar AJV
2020 e `ajv-formats`, eliminando dependência transitória de `npx`.

## Validação

- Testes Node da migração e fixtures.
- Validação JSON Schema draft 2020-12.
- Comparação semântica antes/depois da migração.

## Stop conditions

- Perda de campo ou estado válido do contrato 0.1.0.
- Necessidade de acoplar o schema público a uma tabela privada.

## Dev Agent Record

### Implementação

- O contrato v1 reutiliza os 120 campos do schema 0.1.0 por `$ref` e move a
  proveniência para `fieldSources`, sem manter `fieldMeta` duplicado em `data`.
- A migração deriva identidade e timestamps do próprio documento, aceita
  reprocessamento de documento/resultado v1 como no-op e não altera o input.
- Versões desconhecidas, downgrade solicitado, slug/status/proveniência
  críticos inválidos e envelope v1 inconsistente falham fechado.
- Legacy, v1 gerado e caminho idempotente passam pela mesma instância AJV
  draft 2020-12 com `ajv-formats`, `additionalProperties` e formatos ativos.
- `fieldMeta` e `fieldSources` aceitam somente dot-paths extraídos dos 120
  campos canônicos; referências de artefato são IDs redistribuíveis, nunca
  paths absolutos ou privados.
- `sourcePath` relativo do 0.1.0 permanece compatível e é normalizado para
  separadores POSIX em `sourceArtifactId`; traversal, absolutos Unix/Windows,
  URI e referências sensíveis continuam bloqueados pelo mesmo formato AJV.
- O formato legado aceita `\\` somente na entrada da migração; o formato v1
  exige `/`, impedindo que o caminho idempotente preserve uma segunda
  representação da mesma proveniência.
- A busca de PRs abertos por `ProjectBrief`, `project brief` e `16.W1.1`
  retornou lista vazia antes da implementação.

### Evidências de validação

- Contrato congelado primeiro no commit `f2ff135`; execução inicial: 1 teste
  passou e 5 falharam, confirmando as lacunas do baseline.
- `node --check scripts/migrate-project-brief.mjs`: PASS.
- `node --test data/contracts/fixtures/project-brief/project-brief-contract.test.mjs`:
  PASS, 19/19 após o remediation QG Round 3.
- `npm ci --prefix scripts --ignore-scripts`: PASS a partir do lockfile.
- `node scripts/validate-project-brief-rules.mjs`: PASS, 120 campos, 31 skills
  e ambos schemas AJV 2020 compilados.
- `npm audit --prefix scripts --audit-level=moderate`: PASS, 0 vulnerabilidades.
- Casos negativos cobertos: `startingPoint`, `awarenessLevel`, `exactPrice`,
  propriedade adicional, timestamp, `sourceArtifactId` numérico, dot-path
  privado e path absoluto.
- Compatibilidade R2 coberta com fixture relativa, equivalência POSIX/Windows
  e negativos separados para traversal, absolutos Unix/Windows, URI, segredo,
  privado e valor não-string.
- Regressão R3 prova que `sourceArtifactId` POSIX passa no no-op v1 e a mesma
  referência com backslashes falha no formato `portable-artifact-reference`.
- `git diff --check`: PASS.

### Commits locais

- `f2ff135` - `test: freeze ProjectBrief v1 contract [Story 16.W1.1]`
- `5011ca6` - `feat: harden ProjectBrief v1 migration [Story 16.W1.1]`
- `f619e6e` - `docs: hand off ProjectBrief v1 for review [Story 16.W1.1]`
- `b10b94c` - `fix: enforce AJV ProjectBrief validation [Story 16.W1.1]`
- `a369e64` - `docs: record ProjectBrief QG remediation [Story 16.W1.1]`
- `fa971fd` - `fix: normalize portable artifact references [Story 16.W1.1]`
- `9811423` - `docs: record ProjectBrief Round 2 remediation [Story 16.W1.1]`
- `bb75b99` - `fix: canonicalize v1 artifact references [Story 16.W1.1]`
- `7026f38` - `docs: record ProjectBrief Round 3 remediation [Story 16.W1.1]`

## File List real

- `data/contracts/project-brief.v1.schema.json`
- `data/contracts/fixtures/project-brief/legacy-0.1.0.valid.json`
- `data/contracts/fixtures/project-brief/migrated-1.0.0.valid.json`
- `data/contracts/fixtures/project-brief/project-brief-1.0.0.valid.json`
- `data/contracts/fixtures/project-brief/relative-source-path.valid.json`
- `data/contracts/fixtures/project-brief/unknown-version.invalid.json`
- `data/contracts/fixtures/project-brief/critical-field.invalid.json`
- `data/contracts/fixtures/project-brief/project-brief-contract.test.mjs`
- `data/project-brief.schema.json`
- `scripts/migrate-project-brief.mjs`
- `scripts/validate-project-brief-rules.mjs`
- `scripts/package.json`
- `scripts/package-lock.json`
- `docs/stories/epic-16/epic-16-state.json`
- `docs/stories/epic-16/STORY-16.W1.1-canonical-project-brief-v1.md`

Delta QG-005-R3 confirmado dentro da File List existente:

- `data/project-brief.schema.json`
- `scripts/migrate-project-brief.mjs`
- `data/contracts/fixtures/project-brief/project-brief-contract.test.mjs`

## QA prep

- Revisar de forma independente a semântica de identidade pública
  (`standalone`, `project-{slug}` e revisão) e a política de idempotência.
- Reexecutar Node tests e AJV draft 2020-12; validar especialmente que
  `fieldMeta` não reaparece em `data` e que origem/confirmation não se perdem.
- Revalidar os findings QG-001 a QG-003 contra o commit `b10b94c`, incluindo
  o caminho idempotente e todos os casos negativos enumerados nas evidências.
- No Round 3, revisar `fa971fd` contra QG-003-R2 e confirmar que a normalização
  altera apenas separadores, sem reduzir a validação dos dot-paths canônicos.
- No Round 4, revisar `bb75b99` contra QG-005-R3: Windows deve continuar aceito
  no legado, enquanto backslash deve falhar no `sourceArtifactId` v1.
- Antes do gate final, o executor manteve o status `InReview`; o encerramento
  como `Done` foi registrado somente após o PASS independente da rodada 4.

## QA Results

- Quality Gate independente: PASS.
- Rodada final: 4.
- Score: 100/100.
- Findings bloqueantes: nenhum.
- ACs verificados: 5/5 PASS.
- Evidências: 19/19 testes de contrato, AJV 2020 strict, 120 campos e 31
  skills validados, audit com 0 vulnerabilidades e adversarial probes de
  normalização legacy/v1 aprovados.
- Decisão: story apta a fechar e seguir para fan-in local.

## Change Log

- 2026-07-14: contrato e fixtures congelados, migração v1 endurecida,
  validações registradas e story encaminhada para revisão independente.
- 2026-07-14: QG Round 1 remediado com validação AJV única, dependências
  versionadas, dot-paths canônicos, referências portáveis e regressões exatas.
- 2026-07-14: QG Round 2 remediado preservando `sourcePath` relativo legítimo,
  com normalização determinística e rejeições de segurança separadamente testadas.
- 2026-07-14: QG Round 3 remediado separando o formato legado do formato v1,
  que agora possui uma única representação canônica POSIX de proveniência.
- 2026-07-14: QG Round 4 aprovado com score 100, todos os ACs satisfeitos e
  nenhum finding; story formalmente encerrada como `Done`.
