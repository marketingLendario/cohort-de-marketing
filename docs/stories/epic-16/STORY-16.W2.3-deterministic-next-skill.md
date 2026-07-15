---
status: Done
story_id: "16.W2.3"
title: "Próxima skill determinística"
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
quality_gate: "@sinkra-chief"
model: "opus"
repo_target: "cohort-de-marketing"
accountable: "Rafael Costa"
depends_on: ["16.W2.1", "16.W2.2"]
consumes_artifacts_of: ["16.W2.1", "16.W2.2"]
entity_input:
  entity_type: "PublicSkillSurfaces"
  description: "ProjectBrief, ArtifactIndex, catálogo e regras canônicas reconciliados pela W2.2."
  status_expected: "catalog-driven"
entity_output:
  entity_type: "SkillReadinessDecision"
  description: "Único próximo passo determinístico, explicável e compartilhado por todas as superfícies."
  status_expected: "deterministic-and-explainable"
file_scope: shared
touched_paths:
  - "data/skill-unlock-rules.json"
  - "scripts/lib/skill-readiness.mjs"
  - "scripts/lib/skill-readiness.test.mjs"
  - "scripts/project-artifact-index.test.mjs"
  - "scripts/project-brief-io.test.mjs"
  - "scripts/skill-surface-data-driven.test.mjs"
  - "skill-surface-contract.js"
  - "briefing.html"
  - "mapa-skills.html"
  - "aula-03/materiais/briefing.html"
  - "aula-03/materiais/mapa-skills.html"
  - ".claude/skills/comecar/SKILL.md"
  - ".claude/skills/status-funil/SKILL.md"
  - ".agents/skills/comecar/SKILL.md"
  - ".agents/skills/status-funil/SKILL.md"
  - "docs/stories/epic-16/STORY-16.W2.3-deterministic-next-skill.md"
  - "docs/stories/epic-16/evidence/STORY-16.W2.3.md"
  - "docs/stories/epic-16/epic-16-state.json"
affected_paths:
  - "data/skill-unlock-rules.json"
  - "scripts/lib/skill-readiness.mjs"
  - "scripts/lib/skill-readiness.test.mjs"
  - "scripts/project-artifact-index.test.mjs"
  - "scripts/project-brief-io.test.mjs"
  - "scripts/skill-surface-data-driven.test.mjs"
  - "skill-surface-contract.js"
  - "briefing.html"
  - "mapa-skills.html"
  - "aula-03/materiais/briefing.html"
  - "aula-03/materiais/mapa-skills.html"
  - ".claude/skills/comecar/SKILL.md"
  - ".claude/skills/status-funil/SKILL.md"
  - ".agents/skills/comecar/SKILL.md"
  - ".agents/skills/status-funil/SKILL.md"
  - "docs/stories/epic-16/STORY-16.W2.3-deterministic-next-skill.md"
  - "docs/stories/epic-16/evidence/STORY-16.W2.3.md"
  - "docs/stories/epic-16/epic-16-state.json"
---

# STORY-16.W2.3 - Próxima skill determinística

> **Depends On:** `16.W2.1`, `16.W2.2`
> **Estimated Effort:** 8h

## Story

**As a / Como** aluno que concluiu parte do funil
**I want / Quero** receber um único próximo passo calculado pelas regras públicas
**so that / Para** retomar o projeto com a mesma recomendação em `comecar`, briefing, mapa e `status-funil`.

## Acceptance Criteria

- [x] AC1: O motor retorna exclusivamente `available`, `recommended`, `almost`, `blocked`, `not_applicable` ou `done`; estado desconhecido e regra malformada falham fechado.
- [x] AC2: Para a mesma entrada serializada, o motor retorna o mesmo estado e a mesma próxima skill; empate é resolvido por prioridade numérica declarada em `skill-unlock-rules.json`, nunca por ordem do objeto.
- [x] AC3: Cada decisão inclui skill escolhida ou ausência explícita, requisitos atendidos, requisitos ausentes, evidências consideradas e razão legível sem conteúdo sensível.
- [x] AC4: Golden fixtures provam que `comecar`, briefing, mapa e `status-funil` apresentam o mesmo próximo passo e a mesma razão para cada perfil e estado suportado.
- [x] AC5: Perfil e `not_applicable` alteram a rota conforme regra declarativa sem apagar artefatos existentes; invocação direta de uma skill continua autônoma e não é bloqueada pelo recomendador.
- [x] AC6: Os arquivos canônicos alterados em `.claude/skills/` e seus mirrors em `.agents/skills/` permanecem byte a byte equivalentes.

## Tasks

- [x] Confirmar os fan-ins de `16.W2.1` e `16.W2.2` como `Done` e ausência de PR cobrindo o escopo.
- [x] Congelar golden fixtures para todos os estados, perfis, empates, `not_applicable`, regra inválida e retomada parcial.
- [x] Implementar o motor puro e integrar as quatro superfícies somente dentro da File List aprovada.
- [x] Rodar table tests, golden matrix, smoke de retomada e paridade byte a byte dos mirrors.
- [x] Registrar evidência sanitizada, atualizar checkboxes, File List real e epic state no fan-in.

## File List

- `data/skill-unlock-rules.json`
- `scripts/lib/skill-readiness.mjs`
- `scripts/lib/skill-readiness.test.mjs`
- `scripts/project-artifact-index.test.mjs`
- `scripts/project-brief-io.test.mjs`
- `scripts/skill-surface-data-driven.test.mjs`
- `skill-surface-contract.js`
- `briefing.html`
- `mapa-skills.html`
- `aula-03/materiais/briefing.html`
- `aula-03/materiais/mapa-skills.html`
- `.claude/skills/comecar/SKILL.md`
- `.claude/skills/status-funil/SKILL.md`
- `.agents/skills/comecar/SKILL.md`
- `.agents/skills/status-funil/SKILL.md`
- `docs/stories/epic-16/STORY-16.W2.3-deterministic-next-skill.md`
- `docs/stories/epic-16/evidence/STORY-16.W2.3.md`
- `docs/stories/epic-16/epic-16-state.json`

A File List é a allow-list inicial e corresponde a `touched_paths` e
`affected_paths`. Criação ou alteração fora dela exige atualizar a story e
repetir a validação de arquitetura antes de implementar.

**Validação de arquitetura da expansão:** as cópias distribuídas da Aula 3 já
eram byte a byte equivalentes às superfícies raiz em `16.W2.2`. Como a nova
decisão é parte do contrato público dessas superfícies, os dois mirrors HTML
entram na allow-list para preservar essa invariável sem criar um segundo motor.
O QG1 também exigiu que versões e identificadores válidos viessem do contrato
público compartilhado; por isso `skill-surface-contract.js` entra na allow-list
como única fonte dos `contractRefs` consumidos pelo motor.
Os três harnesses HTTP existentes também entram na allow-list para servir
`.mjs` como `application/javascript`, condição necessária ao import ESM
same-origin exercitado nas regressões públicas.
No QG2, a File List foi reconfirmada antes da remediação Round 3: os quatro
`SKILL.md` canônico/mirror e `scripts/lib/skill-readiness.test.mjs` já fazem
parte explícita da allow-list. O probe executável passa a congelar também o
padrão de chamada documentado por essas duas skills.

## Dev Notes

- A execução só inicia depois dos fechamentos de `16.W2.1` e `16.W2.2`; use os contratos integrados e não derive estado por scraping das telas.
- Prioridade é dado versionado de `skill-unlock-rules.json`. O motor deve ordenar explicitamente e usar desempate documentado por ID somente se a prioridade declarada for igual.
- A decisão deve ser função pura de ProjectBrief, ArtifactIndex, catálogo e regras. Não use data atual, ordem de leitura do filesystem ou estado transitório do DOM.
- `comecar` e `status-funil` continuam skills canônicas em `.claude/skills/`; os arquivos em `.agents/skills/` são mirrors literais, nunca forks.
- O escopo toca o domínio sensível `.claude/`; por CHK-3, o quality gate obrigatório é `@sinkra-chief` e não pode ser substituído pelo executor.
- `deploy_type: none`: não há publicação externa; smoke local e mirror parity continuam obrigatórios.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@sinkra-chief"
model: "opus"
quality_gate_tools: ["node:test", "golden-fixtures", "mirror-parity", "browser-smoke"]
repo_target: "cohort-de-marketing"
```

## Validação

- Table tests para os seis estados, perfis, prioridades e empates.
- Golden fixtures com próxima skill e explicação idênticas nas quatro superfícies.
- Paridade byte a byte das duas skills canônicas e seus mirrors.
- Smoke de retomada de projeto parcialmente concluído e invocação direta.

## Dev Agent Record

- Executor: `@dev`
- Branch: `wave/16-w2/story-16.W2.3`
- Baseline: `4c8a605`
- RED: `cd276ac`
- Implementação: `3eafe74`
- RED da remediação QG1: `8f419cd`
- Remediação QG1: `e5e724b`
- RED da remediação QG2: `97f6189`
- Remediação QG2: `6d1f671`
- Live PR coverage: nenhum PR aberto no repositório no início da execução.
- Evidência detalhada: `docs/stories/epic-16/evidence/STORY-16.W2.3.md`
- Entity proof: `PublicSkillSurfaces` passou de escolha por ordem implícita para
  `SkillReadinessDecision` determinística, declarativa, explicável e compartilhada.
- OCC/segurança: decisão não serializa valores do ProjectBrief nem paths do
  ArtifactIndex; expõe apenas nomes de requisitos e contagens sanitizadas.
- Deploy: não aplicável (`deploy_type: none`).
- Fechamento: QG3 independente aprovado por `@sinkra-chief` no HEAD
  `afd654bc30612a3aa89847e30bd0c3350930035f`; fan-in liberado para `@devops`.

## QA Results

### Round 1

- Reviewer: `@sinkra-chief`
- Resultado: `FAIL 48`
- Bloqueios: versões/refs, sanitização, Blob sob CSP e desempate fora do contrato.
- Remediação: `8f419cd` e `e5e724b`.

### Round 2

- Reviewer: `@sinkra-chief`
- Resultado: `FAIL 82/100`
- Bloqueios: um P1 no call pattern documentado por `comecar` e `status-funil`.
- Remediação: `97f6189` e `6d1f671`.

### Round 3

- Reviewer: `@sinkra-chief`
- Resultado: `PASS 98/100`
- Confiança: alta
- Blocking findings: 0
- HEAD avaliado: `afd654bc30612a3aa89847e30bd0c3350930035f`
- Evidência: 58/58 na matriz principal, 9/9 no round-trip browser,
  golden/CSP nas quatro superfícies, probe executável dos quatro `SKILL.md`,
  validadores públicos, preview, audit e paridade aprovados.
- Decisão: story aceita como `Done`; nenhuma nova remediação necessária.

## Stop Conditions

- Prioridade precisar ser hardcoded fora das regras.
- Alteração quebrar a autonomia de uma skill chamada diretamente.
- Mirror em `.agents/skills/` divergir da fonte canônica em `.claude/skills/`.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @po | Contrato enriquecido, CHK-3 aplicado e story validada para execução sequencial na PUB-16 W2. |
| 2026-07-15 | @dev | Golden fixtures congeladas em RED no commit `cd276ac`. |
| 2026-07-15 | @dev | Motor, prioridades declarativas, quatro superfícies, mirrors e browser smoke implementados no commit `3eafe74`; story movida para `InReview`. |
| 2026-07-15 | @sinkra-chief | QG1 `FAIL 48`: versões/refs, sanitização, Blob sob CSP e desempate bloquearam o fechamento. |
| 2026-07-15 | @dev | QG1 remediado em `8f419cd`/`e5e724b`: contractRefs do SOT, fail-closed estrito, ESM same-origin sob CSP e empate somente por ID; devolvido para QG2. |
| 2026-07-15 | @sinkra-chief | QG2 `FAIL 82/100`: um P1 nas duas skills canônicas ainda documentava a chamada sem `contractRefs`. |
| 2026-07-15 | @dev | QG2 remediado em `97f6189`/`6d1f671`: call pattern completo nos quatro mirrors e probe executável contra o ruleset real; devolvido para QG3. |
| 2026-07-15 | @sinkra-chief | QG3 `PASS 98/100`, confiança alta e zero blockers no HEAD `afd654b`; story aceita. |
| 2026-07-15 | @dev | SDC fechado, story movida para `Done` e fan-in liberado para `@devops`. |
