---
status: Done
story_id: "16.W2.1"
title: "Descoberta segura de artefatos e proveniência"
epic: 16
wave: "W2"
parent_epic: "docs/stories/epic-16/EPIC-16-CANONICAL-PROJECT.md"
effort: 8h
deploy_type: none
appetite: 1d
hill_phase: done
confidence_level: know-how
involves_ui: true
task_mode: CRIAR
cli: codex
executor: "@dev"
quality_gate: "@architect"
model: "sonnet"
repo_target: "cohort-de-marketing"
accountable: "Rafael Costa"
depends_on: ["16.W1.1"]
consumes_artifacts_of: ["16.W1.1"]
entity_input:
  entity_type: "ProjectBrief"
  description: "ProjectBrief v1 validado e regras públicas de unlock da W1."
  status_expected: "canonical-v1"
entity_output:
  entity_type: "ArtifactIndex"
  description: "Índice reproduzível, confinado e sem conteúdo bruto dos artefatos do projeto."
  status_expected: "verified-or-pending-confirmation"
file_scope: shared
touched_paths:
  - "data/skill-unlock-rules.json"
  - "scripts/project-artifact-index.mjs"
  - "scripts/project-artifact-index.test.mjs"
  - "briefing.html"
  - "aula-03/materiais/briefing.html"
  - "docs/stories/epic-16/STORY-16.W2.1-artifact-discovery-provenance.md"
  - "docs/stories/epic-16/evidence/STORY-16.W2.1.md"
affected_paths:
  - "data/skill-unlock-rules.json"
  - "scripts/project-artifact-index.mjs"
  - "scripts/project-artifact-index.test.mjs"
  - "briefing.html"
  - "aula-03/materiais/briefing.html"
  - "docs/stories/epic-16/STORY-16.W2.1-artifact-discovery-provenance.md"
  - "docs/stories/epic-16/evidence/STORY-16.W2.1.md"
---

# STORY-16.W2.1 - Descoberta segura de artefatos e proveniência

> **Depends On:** `16.W1.1`
> **Estimated Effort:** 8h

## Status

Done

## Story

**As a / Como** operador que retoma um projeto local
**I want / Quero** descobrir artefatos por um indexador confinado e verificável
**so that / Para** usar evidência real de progresso sem expor conteúdo ou confiar em declarações manuais.

## Acceptance Criteria

- [x] AC1: Dado um `projetos/{slug}/` válido, o indexador lê exclusivamente os globs declarados em `skill-unlock-rules.json`; arquivo fora desses globs não aparece no resultado.
- [x] AC2: Cada entrada do índice contém tipo, path POSIX relativo ao projeto, SHA-256 do arquivo, tamanho em bytes, origem e estado de confirmação; duas execuções sem mudança geram saída semanticamente idêntica.
- [x] AC3: Path absoluto, traversal e symlink cujo destino escape de `projetos/{slug}/` falham fechado, com erro tipado que não ecoa conteúdo sensível.
- [x] AC4: Artefato apenas inferido permanece `pending_confirmation` e não satisfaz requisito crítico enquanto a regra declarar confirmação obrigatória; a confirmação explícita altera somente o estado da entrada correspondente.
- [x] AC5: O índice serializado não contém conteúdo bruto, credenciais ou paths absolutos; fixtures adversariais provam a recusa e as duas cópias do briefing consomem o mesmo contrato.

## Tasks

- [x] Confirmar o baseline `06e2b64`, a dependência `16.W1.1` como `Done` e ausência de PR cobrindo o escopo.
- [x] Congelar fixtures e testes para projeto válido, ausente, duplicado, traversal, path absoluto e symlink de escape.
- [x] Implementar o indexador e a integração do briefing somente dentro da File List aprovada.
- [x] Rodar testes unitários, reprodutibilidade, scan de conteúdo sensível e smoke HTTP das duas cópias.
- [x] Registrar evidência sanitizada, atualizar checkboxes, File List real e epic state no fan-in.

## File List proposta

- `data/skill-unlock-rules.json`
- `scripts/project-artifact-index.mjs`
- `scripts/project-artifact-index.test.mjs`
- `briefing.html`
- `aula-03/materiais/briefing.html`
- `docs/stories/epic-16/STORY-16.W2.1-artifact-discovery-provenance.md`
- `docs/stories/epic-16/evidence/STORY-16.W2.1.md`

A File List é a allow-list inicial e corresponde a `touched_paths` e
`affected_paths`. Criação ou alteração fora dela exige atualizar a story e
repetir a validação de arquitetura antes de implementar.

## Dev Notes

- Baseline integrado: `06e2b64`. O ProjectBrief v1 da `16.W1.1` já compõe a branch; não reaplique commits da W1.
- O helper CLI é a única superfície autorizada a ler o filesystem. O browser importa o índice validado e não recebe acesso irrestrito a diretórios.
- Normalize e compare paths antes de abrir arquivos; resolva symlinks e prove que o destino real permanece sob a raiz selecionada.
- Hash, tamanho e proveniência são metadados. Não armazene bytes, snippets, secrets ou paths da máquina na evidência.
- `data/skill-unlock-rules.json` é compartilhado com a `16.W2.3`; a sequência da wave impede escrita concorrente.
- `deploy_type: none`: não há publicação externa; o smoke local continua obrigatório.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
model: "sonnet"
quality_gate_tools: ["node:test", "filesystem-adversarial-fixtures", "http-smoke"]
repo_target: "cohort-de-marketing"
```

## Validação

- Fixtures de projeto válido, ausente, duplicado, traversal, absoluto e symlink de escape.
- SHA-256 e índice semanticamente estáveis em duas execuções.
- Teste que prova ausência de conteúdo bruto e paths absolutos no índice.
- Smoke HTTP nas duas cópias distribuídas do briefing.

## Stop Conditions

- Descoberta exigir varrer fora de `projetos/{slug}/`.
- Regra de unlock não distinguir existência de confirmação.
- Índice precisar persistir conteúdo bruto ou credencial.

## Dev Agent Record

### Implementação

- `scripts/project-artifact-index.mjs` é a única superfície nova com acesso ao
  filesystem. O CLI exige `--project projetos/{slug}` e `--rules`, normaliza
  cada path, resolve symlinks e falha fechado quando o destino real escapa.
- A expansão percorre somente os padrões versionados em `artifactGlobs`, sem
  glob ou dependência externa. Um path repetido no mesmo tipo é deduplicado;
  correspondência entre tipos distintos é recusada como ambígua.
- O `ArtifactIndex v1` contém somente slug, tipo, path POSIX relativo, SHA-256,
  tamanho, origem declarativa e confirmação. Não inclui timestamp, conteúdo ou
  path da máquina, portanto duas execuções estáveis são semanticamente iguais.
- Assinaturas fortes de credenciais também são recusadas em paths e patterns;
  a recusa usa código tipado sem ecoar o filename sensível.
- `artifactIndex.confirmationRequiredByDefault` torna descoberta inferida
  `pending_confirmation`. `--confirm tipo:path` altera somente a identidade
  exata e recalcula o resumo sem mutar o índice original.
- As duas cópias do briefing validam o contrato com chaveamento fechado,
  recusam paths não portáteis, regras divergentes e resumos inconsistentes, e
  derivam readiness somente de entradas `confirmed`.
- O matcher glob segmentado possui versão explícita e a mesma implementação no
  Node e nas duas cópias do browser. Cada `entry.path` precisa casar ao menos um
  pattern de origem canônico; paths são únicos globalmente, inclusive entre tipos.
- A gramática portátil recusa NUL e controles C0/C1 de forma idêntica nas duas
  runtimes. Todos os patterns declarados na provenance precisam casar o path.
- `**` terminal é rejeitado pelas rules, pelo matcher e pelo validator antes do
  discovery; nenhuma regra canônica depende dessa forma ambígua.
- A policy do índice precisa ser idêntica à policy carregada das unlock rules e
  toda a provenance passa pela verificação de referências sensíveis.
- `loadDraft()` revalida o ArtifactIndex persistido integralmente. Índice
  adulterado é removido, todos os desbloqueios são limpos e o ProjectBrief
  validado permanece disponível, sem propagar `pageerror`.
- Quando existe índice importado, a marcação manual fica bloqueada: o operador
  confirma pelo helper CLI e reimporta, preservando a proveniência.
- A busca por PRs abertos antes da implementação retornou lista vazia.

### Evidências de validação

- Test-first: commit `c1121f9`; a suíte falhou inicialmente com
  `ERR_MODULE_NOT_FOUND`, comprovando ausência do indexador no baseline.
- `node --test scripts/project-artifact-index.test.mjs`: PASS, 18/18.
- Casos adversariais: projeto ausente, raiz inválida, absoluto, traversal,
  duplicidade, ambiguidade entre tipos e symlink de escape.
- Reprodutibilidade e minimização: duas execuções idênticas; índice sem conteúdo
  bruto e sem raiz absoluta; CLI confirmado por processo filho.
- Smoke HTTP/Playwright: PASS nas duas URLs distribuídas, importação do mesmo
  índice, artefato confirmado refletido e zero `pageerror`.
- Reidratação Playwright: índice válido preserva confirmação; schema `v999`,
  propriedade adicional, path/pattern adulterado, policy divergente e path
  global duplicado limpam unlocks, preservam o ProjectBrief e regravam storage seguro.
- `node scripts/validate-project-brief-rules.mjs`: PASS, 120 campos, 31 skills e
  schemas AJV 2020 compilados.
- `node scripts/validate-skill-catalog.mjs`: PASS, 31 skills e 41 edges.
- `node scripts/validate-mapa-wiring.mjs`: PASS, 69/69 URLs válidas.
- `node scripts/validate-mapa-preview.mjs`: PASS, canvas e PDF, zero `pageerror`.
- `npm audit --prefix scripts`: PASS, 0 vulnerabilidades.
- `cmp -s briefing.html aula-03/materiais/briefing.html`: PASS.
- `git diff --check`: PASS.

### Commits locais

- `c1121f9` - `test: freeze artifact index contract [Story 16.W2.1]`
- `71fdf32` - `feat: add confined artifact index [Story 16.W2.1]`
- `722e851` - `docs: hand off artifact index for review [Story 16.W2.1]`
- `948e1df` - `test: reject credential signatures in artifact paths [Story 16.W2.1]`
- `66b3909` - `fix: sanitize artifact path metadata [Story 16.W2.1]`
- `9827ced` - `docs: record artifact path hardening [Story 16.W2.1]`
- `dcca6e7` - `test: reproduce artifact index provenance gaps [Story 16.W2.1]`
- `c5030e6` - `fix: bind artifact provenance to canonical rules [Story 16.W2.1]`
- `d4fd577` - `docs: record artifact index QG remediation [Story 16.W2.1]`
- `50f3f92` - `test: reproduce artifact matcher parity gaps [Story 16.W2.1]`
- `f99f4bc` - `fix: align artifact matcher semantics [Story 16.W2.1]`

## File List real

- `data/skill-unlock-rules.json`
- `scripts/project-artifact-index.mjs`
- `scripts/project-artifact-index.test.mjs`
- `briefing.html`
- `aula-03/materiais/briefing.html`
- `docs/stories/epic-16/STORY-16.W2.1-artifact-discovery-provenance.md`
- `docs/stories/epic-16/evidence/STORY-16.W2.1.md`
- `docs/stories/epic-16/epic-16-state.json`

## QA prep

- Reexecutar a matriz adversarial e inspecionar se nenhum erro tipado inclui o
  pattern, o path absoluto ou bytes do arquivo que provocou a recusa.
- Reprovar glob fora da raiz, symlink de arquivo e de diretório escapando e
  ambiguidade do mesmo path entre dois tipos.
- Comparar duas serializações, confirmar uma identidade e provar que todas as
  demais entradas permanecem byte a byte iguais.
- Importar índice válido e inválido nas duas URLs; pending não pode satisfazer
  requisito e marcação manual não pode substituir a confirmação do CLI.
- O executor mantém `InReview`; somente o PASS independente de `@architect`
  autoriza `Done` e fan-in da wave.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @po | Contrato enriquecido e validado para execução na PUB-16 W2. |
| 2026-07-15 | @dev | Indexador confinado, importação do ArtifactIndex e evidências encaminhados para arquitetura. |
| 2026-07-15 | @dev | Reprobe adicional passou a recusar assinaturas fortes de credenciais também nos paths serializados. |
| 2026-07-15 | @dev | QG Round 1 remediado com matcher espelhado, provenance canônica e reidratação fail-closed. |
| 2026-07-15 | @dev | QG Round 2 remediado com path portátil paritário, provenance integral e `**` terminal fail-closed. |
| 2026-07-15 | @architect | QG Round 3 PASS 100/100 — todos os ACs e probes aprovados; story encerrada como Done. |

## QA Results

### Round 1

- Quality Gate independente: FAIL.
- Score: 68/100.
- QG-001: o validator aceitava path que não casava o pattern de origem declarado.
- QG-002: policy e unicidade global não eram vinculadas às unlock rules correntes.
- QG-003: provenance não passava integralmente pela proteção de referências sensíveis.
- QG-004: `loadDraft()` confiava em `saved.artifactIndex` e `saved.artifacts` sem
  revalidação, permitindo desbloqueio após adulteração do storage.
- Remediation: matcher determinístico espelhado, vínculo canônico completo,
  path global único e reidratação fail-closed com 16 testes Node/Playwright.
- Estado: `InReview`, aguardando QG Round 2 independente de `@architect`.

### Round 2

- Quality Gate independente: FAIL.
- Score: 82/100.
- QG-001: browser não recusava NUL e controles com a mesma gramática do Node.
- QG-002: o validator exigia apenas um pattern de provenance compatível,
  permitindo outro pattern canônico, porém falso, na mesma entrada.
- QG-003: `**` terminal possuía interpretação divergente entre matcher e discovery.
- Remediation: matriz portátil compartilhada com C0/C1, `every()` para todos os
  patterns e rejeição explícita de `**` terminal em rules/matcher/validator/builder.
- Estado: `InReview`, aguardando QG Round 3 independente de `@architect`.

### Round 3

- Quality Gate independente: PASS.
- Score: 100/100.
- Findings bloqueantes: nenhum.
- 65/65 caracteres C0/C1 recusados em Node/browser; provenance integral,
  `**` terminal, persistence/tampering, confinement e idempotência aprovados.
- Todos os ACs e stop conditions: PASS; story encerrada como `Done`.
