---
status: Done
story_id: "16.W2.2"
title: "Briefing, mapa e status orientados por catálogo"
epic: 16
wave: "W2"
parent_epic: "docs/stories/epic-16/EPIC-16-CANONICAL-PROJECT.md"
effort: 8h
deploy_type: none
appetite: 1d
hill_phase: done
confidence_level: know-how
involves_ui: true
task_mode: REFATORAR
cli: codex
executor: "@dev"
quality_gate: "@qa"
model: "sonnet"
repo_target: "cohort-de-marketing"
accountable: "Rafael Costa"
depends_on: ["16.W1.1", "16.W2.1"]
consumes_artifacts_of: ["16.W1.1", "16.W2.1"]
entity_input:
  entity_type: "ArtifactIndex"
  description: "ProjectBrief v1, catálogo, regras de unlock e índice verificado da W2.1."
  status_expected: "verified-or-pending-confirmation"
entity_output:
  entity_type: "PublicSkillSurfaces"
  description: "Briefing, mapa e status derivados dos mesmos contratos públicos."
  status_expected: "catalog-driven"
file_scope: shared
touched_paths:
  - "briefing.html"
  - "mapa-skills.html"
  - "mapa-skills-artifacts.js"
  - "aula-03/materiais/briefing.html"
  - "aula-03/materiais/mapa-skills.html"
  - "aula-03/materiais/mapa-skills-artifacts.js"
  - "data/skill-catalog.json"
  - "data/skill-unlock-rules.json"
  - "scripts/validate-mapa-wiring.mjs"
  - "scripts/validate-skill-catalog.mjs"
  - "scripts/skill-surface-data-driven.test.mjs"
  - "scripts/project-artifact-index.mjs"
  - "scripts/project-artifact-index.test.mjs"
  - "scripts/project-brief-io.test.mjs"
  - "skill-surface-contract.js"
  - "docs/stories/epic-16/STORY-16.W2.2-data-driven-briefing-map-status.md"
  - "docs/stories/epic-16/evidence/STORY-16.W2.2.md"
  - "docs/stories/epic-16/epic-16-state.json"
affected_paths:
  - "briefing.html"
  - "mapa-skills.html"
  - "mapa-skills-artifacts.js"
  - "aula-03/materiais/briefing.html"
  - "aula-03/materiais/mapa-skills.html"
  - "aula-03/materiais/mapa-skills-artifacts.js"
  - "data/skill-catalog.json"
  - "data/skill-unlock-rules.json"
  - "scripts/validate-mapa-wiring.mjs"
  - "scripts/validate-skill-catalog.mjs"
  - "scripts/skill-surface-data-driven.test.mjs"
  - "scripts/project-artifact-index.mjs"
  - "scripts/project-artifact-index.test.mjs"
  - "scripts/project-brief-io.test.mjs"
  - "skill-surface-contract.js"
  - "docs/stories/epic-16/STORY-16.W2.2-data-driven-briefing-map-status.md"
  - "docs/stories/epic-16/evidence/STORY-16.W2.2.md"
  - "docs/stories/epic-16/epic-16-state.json"
---

# STORY-16.W2.2 - Briefing, mapa e status orientados por catálogo

> **Depends On:** `16.W1.1`, `16.W2.1`
> **Estimated Effort:** 8h

## Story

**As a / Como** aluno que consulta o briefing e o mapa do mesmo projeto
**I want / Quero** que todas as superfícies derivem skills, dependências e estados dos contratos canônicos
**so that / Para** receber a mesma leitura de progresso sem contagens ou regras duplicadas no HTML.

## Acceptance Criteria

- [x] AC1: Briefing e mapa renderizam exatamente os IDs presentes em `skill-catalog.json`; inserir ou remover uma fixture de skill altera as superfícies sem editar literal de contagem no HTML.
- [x] AC2: Edges, requisitos, artefatos e estados exibidos são derivados de `skill-catalog.json`, `skill-unlock-rules.json`, ProjectBrief v1 e ArtifactIndex; fixture com divergência faz o validator falhar.
- [x] AC3: As cópias da raiz e de `aula-03/materiais/` permanecem byte a byte equivalentes para cada artefato distribuído alterado.
- [x] AC4: Catálogo ou regra ausente, malformada ou com referência órfã produz erro único, acionável e fail-closed; nenhuma superfície renderiza mapa parcial como válido.
- [x] AC5: O validator percorre todas as skills canônicas e falha quando qualquer ID, edge, requisito ou estado esperado não estiver representado; o browser smoke passa sem erro de console nas duas URLs.

## Tasks

- [x] Confirmar o fan-in da `16.W2.1` como `Done` e ausência de PR cobrindo o escopo.
- [x] Congelar testes para catálogo válido, skill ausente, edge órfã, regra inválida e paridade das cópias.
- [x] Remover literais e regras concorrentes das superfícies dentro da File List aprovada.
- [x] Rodar validators, testes de contrato, paridade byte a byte e browser smoke HTTP nas duas distribuições.
- [x] Registrar evidência sanitizada, atualizar checkboxes, File List real e epic state no fan-in.

## File List real

- `briefing.html`
- `mapa-skills.html`
- `mapa-skills-artifacts.js`
- `aula-03/materiais/briefing.html`
- `aula-03/materiais/mapa-skills.html`
- `aula-03/materiais/mapa-skills-artifacts.js`
- `skill-surface-contract.js`
- `scripts/project-artifact-index.mjs`
- `scripts/project-artifact-index.test.mjs`
- `scripts/project-brief-io.test.mjs`
- `scripts/skill-surface-data-driven.test.mjs`
- `scripts/validate-skill-catalog.mjs`
- `docs/stories/epic-16/STORY-16.W2.2-data-driven-briefing-map-status.md`
- `docs/stories/epic-16/evidence/STORY-16.W2.2.md`
- `docs/stories/epic-16/epic-16-state.json`

Todos os paths modificados pertencem à allow-list reconciliada, incluindo a
expansão do QG Round 1 para fatorar `skill-surface-contract.js` como única fonte
executável dos contratos do browser e do validator Node da W2.1. O
`epic-16-state.json` foi incluído na allow-list antes do handoff para materializar
a transição obrigatória `Ready` → `InReview`.

## Dev Agent Record

- Executor: `@dev` via `sinkra-full-cycle`, branch isolada `wave/16-w2/story-16.W2.2`.
- Test-first: commit RED `29c23ac`; implementação GREEN `dfa2819`.
- Entidade: `ArtifactIndex verified-or-pending-confirmation` → `PublicSkillSurfaces catalog-driven`.
- Validação inicial: 6/6 testes, catálogo 31/41, wiring 69/69, preview sem pageerror,
  browser smoke das quatro URLs sem erro e paridade byte a byte.
- QG Round 1: quatro blockers reproduzidos e corrigidos; contrato compartilhado
  valida versões exatas, 120 paths canônicos, ProjectBrief v1 e ArtifactIndex
  completo; storage rejeitado permanece byte a byte intacto.
- Regressão pós-fix: superfícies 9/9, ArtifactIndex 18/18, ProjectBrief schema
  19/19, ProjectBrief browser I/O 9/9, catálogo/wiring/preview/browser/paridade PASS.
- QG Round 2: o blocker de verdade vacuosa em `anyOf` foi reproduzido e
  corrigido. Regras oficiais + 32 fixtures adversariais, ambas as distribuições
  do mapa e a regressão consolidada de 56/56 casos passaram; a story permanece
  `InReview` para QG3 independente.
- QG Round 3: predicados aninhados foram separados da gramática de `matches`;
  `equals` aceita somente escalar direto e `in` somente escalares diretos. As
  três novas fixtures elevaram a matriz para 35, com 56/56 regressões e ambas as
  distribuições do mapa passando; a story permanece `InReview` para QG4.
- OCC/segurança: nenhum segredo ou conteúdo bruto de artefato exposto; referências
  inválidas e estado local malformado falham fechado.
- Evidência: `docs/stories/epic-16/evidence/STORY-16.W2.2.md`.

## QA Results

- Veredito independente: PASS.
- Rodada final: 4.
- Score: 100/100.
- Findings bloqueantes: nenhum.
- R1-R3 permaneceram fechados; predicados aninhados, estruturas profundas,
  objetos e `null` falham fechado, enquanto escalares válidos permanecem aceitos.
- Gates: 56/56 testes, 35 fixtures adversariais, catálogo 31/41, ProjectBrief
  120/31, wiring 69/69, quatro URLs e auditoria aprovados.
- AC1-AC5 e stop conditions: PASS; story encerrada como `Done`.

## Dev Notes

- A execução só inicia depois do fechamento da `16.W2.1`; consuma o ArtifactIndex entregue no fan-in, sem criar um segundo indexador no browser.
- Preserve as 31 skills e 41 edges do baseline como fixture de regressão, mas derive a quantidade corrente do catálogo em runtime e nos validators.
- `skill-catalog.json` define identidade e grafo; `skill-unlock-rules.json` define requisitos. O HTML não pode copiar essas estruturas como segunda fonte.
- Falha de fetch ou validação deve bloquear a interpretação do estado e explicar o artefato inválido sem expor ProjectBrief ou conteúdo local.
- Os arquivos de raiz e `aula-03/materiais/` são distribuições equivalentes, não implementações independentes.
- `deploy_type: none`: não há publicação externa; browser smoke local continua obrigatório.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@qa"
model: "sonnet"
quality_gate_tools: ["node:test", "catalog-validators", "playwright"]
repo_target: "cohort-de-marketing"
```

## Validação

- Validação estrutural da fixture atual de 31 skills e 41 edges.
- Casos negativos para skill ausente, edge órfã, regra inválida e fetch ausente.
- Paridade byte a byte dos artefatos distribuídos alterados.
- Browser smoke por HTTP local nas duas URLs, sem erro de console.

## Stop Conditions

- Mudança reduzir detalhe hoje disponível no mapa.
- Solução duplicar catálogo ou regras dentro do HTML.
- Superfície aceitar estado parcial como se fosse canônico.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-15 | @po | Contrato enriquecido e validado para execução sequencial na PUB-16 W2. |
| 2026-07-15 | @dev | Superfícies migradas para catálogo/regras/ProjectBrief/ArtifactIndex, testes e browser smoke concluídos; handoff em InReview. |
| 2026-07-15 | @dev | QG Round 1 remediado: validator único completo, ProjectBrief/120 refs, contagens runtime e storage rejeitado imutável; pronto para QG2. |
| 2026-07-15 | @dev | QG Round 2 remediado: grupos anyOf efetivos, predicados XOR e 32 fixtures adversariais; pronto para QG3. |
| 2026-07-15 | @dev | QG Round 3 remediado: equals/in restritos a escalares diretos e matriz ampliada para 35 fixtures; pronto para QG4. |
| 2026-07-15 | @qa | QG Round 4 PASS 100/100; zero findings bloqueantes e story encerrada como Done. |
