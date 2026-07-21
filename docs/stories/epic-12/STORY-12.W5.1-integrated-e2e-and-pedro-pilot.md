---
status: Ready
story_id: "12.W5.1"
title: "E2E integrado, piloto de Pedro e release gate"
epic: 12
wave: "W5"
parent_epic: "docs/stories/epic-12/EPIC-12-CAMPAIGNS-READINESS-GATE.md"
deploy_type: local
effort: "2h"
hill_phase: figuring_out
appetite: "3d"
confidence_level: needs-spike
task_mode: VALIDAR
involves_ui: true
executor: "@qa"
quality_gate: "@po"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check", "npm --prefix apps/academia-lendaria-ads-studio run test:db", "npm --prefix apps/academia-lendaria-ads-studio run lint:db", "cd apps/academia-lendaria-ads-studio && npx playwright test e2e/campaign-readiness-gate.spec.ts --config=playwright.config.ts --project=desktop --project=mobile", "npm --prefix apps/academia-lendaria-ads-studio run evidence:privacy -- docs/qa/evidence/epic-12-campaign-readiness.json"]
accountable: "Pedro Valério"
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
depends_on: ["12.W4.1", "12.W4.2"]
consumes_artifacts_of: ["12.W4.1", "12.W4.2"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/e2e/campaign-readiness-gate.spec.ts"
  - "apps/academia-lendaria-ads-studio/e2e/fixtures/campaign-readiness/**"
  - "apps/academia-lendaria-ads-studio/docs/qa/epic-12-campaign-readiness.md"
  - "apps/academia-lendaria-ads-studio/docs/qa/epic-12-release-gate.yaml"
  - "apps/academia-lendaria-ads-studio/docs/qa/evidence/epic-12-campaign-readiness.json"
  - "apps/academia-lendaria-ads-studio/playwright.config.ts"
  - "docs/stories/epic-12/EPIC-12-CAMPAIGNS-READINESS-GATE.md"
  - "docs/stories/epic-12/epic-12-state.json"
  - "docs/stories/epic-12/STORY-12.W5.1-integrated-e2e-and-pedro-pilot.md"
---

> **Estimated effort:** 2h  
> **Depends on:** 12.W4.1, 12.W4.2

# STORY-12.W5.1 — E2E integrado, piloto de Pedro e release gate

## User Story

**As an operator named Pedro**, **I want** to prove the complete flow with an
incomplete and a ready project, **so that** Campaigns is released with evidence
that the block is understandable and the happy path still works.

## Story

**As an operator named Pedro**, **I want** to prove the complete flow with an
incomplete and a ready project, **so that** Campaigns is released with evidence
that the block is understandable and the happy path still works.

## Executor Assignment

```yaml
executor: "@qa"
quality_gate: "@po"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check", "npm --prefix apps/academia-lendaria-ads-studio run test:db", "npm --prefix apps/academia-lendaria-ads-studio run lint:db", "cd apps/academia-lendaria-ads-studio && npx playwright test e2e/campaign-readiness-gate.spec.ts --config=playwright.config.ts --project=desktop --project=mobile", "npm --prefix apps/academia-lendaria-ads-studio run evidence:privacy -- docs/qa/evidence/epic-12-campaign-readiness.json"]
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
```

## Acceptance Criteria

- [ ] AC1: E2E de projeto vazio mostra Campanhas bloqueada, checklist e ação inline;
  nenhuma linha de campanha é criada.
- [ ] AC2: E2E de projeto pronto cria draft válido, inicia execução e mostra fase,
  progresso/indeterminado, erro, retry/cancelamento e estado terminal.
- [ ] AC3: Snapshot obsoleto, reload, restart, perda de stream e rota legada são
  exercitados e recuperáveis.
- [ ] AC4: Playwright desktop/mobile (390px) passa sem overflow, foco perdido ou
  texto ilegível; `docs/qa/evidence/epic-12-campaign-readiness.json` passa o
  privacy gate e o trace/network assertion `meta-mutation-requests: []` não
  registra request Meta mutativo.
- [ ] AC5: O relatório sanitizado registra comandos, versões, hashes, vereditos e
  blockers residuais; o state da epic só fecha com todos os gates locais PASS.

## Tasks

- [ ] T1: Criar fixtures incompleta, warning e pronta com proveniência.
- [ ] T2: Implementar a matriz Playwright nova/legada e cenários de recovery.
- [ ] T3: Executar piloto supervisionado por Pedro e coletar evidência sanitizada.
- [ ] T4: Rodar testes completos, lint, typecheck, build e privacy gate com JSON.
- [ ] T5: Atualizar evidence/state e registrar decisão de release.

## File List

- `apps/academia-lendaria-ads-studio/e2e/campaign-readiness-gate.spec.ts` (ADD)
- `apps/academia-lendaria-ads-studio/e2e/fixtures/campaign-readiness/**` (ADD)
- `apps/academia-lendaria-ads-studio/docs/qa/epic-12-campaign-readiness.md` (ADD)
- `apps/academia-lendaria-ads-studio/docs/qa/epic-12-release-gate.yaml` (ADD)
- `apps/academia-lendaria-ads-studio/docs/qa/evidence/epic-12-campaign-readiness.json` (ADD; input do privacy gate)
- `apps/academia-lendaria-ads-studio/playwright.config.ts` (CONSUME; projetos desktop/mobile)
- `docs/stories/epic-12/EPIC-12-CAMPAIGNS-READINESS-GATE.md` (MODIFY lifecycle sections)
- `docs/stories/epic-12/epic-12-state.json` (MODIFY lifecycle sections)
- `docs/stories/epic-12/STORY-12.W5.1-integrated-e2e-and-pedro-pilot.md` (MODIFY lifecycle sections)

## Dev Notes

O piloto não publica nada na Meta. Se o ambiente externo estiver indisponível,
registrar o blocker e executar o gate local equivalente; nunca declarar PASS
remoto sem evidência.

## Change Log

- 2026-07-16 — @architect: release gate passou a exigir JSON sanitizado e
  assertion explícita de rede sem mutação Meta.
- 2026-07-16 — @po: *validate-story-draft (checklist 10 pontos) — verdict GO.
  Draft → Ready. Dependências 12.W4.1 (Done, QG PASS a015d37) e 12.W4.2 (Done,
  1e52717) verificadas.
