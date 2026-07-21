---
status: Draft
story_id: "12.W2.1"
title: "Gate de campanhas, navegação e ações inline"
epic: 12
wave: "W2"
parent_epic: "docs/stories/epic-12/EPIC-12-CAMPAIGNS-READINESS-GATE.md"
deploy_type: none
effort: "2h"
hill_phase: figuring_out
appetite: "3d"
confidence_level: needs-spike
task_mode: EXECUTAR
entity_input:
  entity_type: campaign-gate-ux
  status_expected: draft
entity_output:
  entity_type: campaign-gate-ux
  status_expected: ready
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check", "cd apps/academia-lendaria-ads-studio && npx playwright test e2e/campaign-readiness-gate.spec.ts --config=playwright.config.ts --project=desktop --project=mobile"]
accountable: "Pedro Valério"
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
depends_on: ["12.W1.1"]
consumes_artifacts_of: ["12.W1.1"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/src/components/unified-shell.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-overview.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-campaigns.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/campaign-readiness-panel.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/campaign-readiness-panel.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-campaigns.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/index.css"
  - "apps/academia-lendaria-ads-studio/e2e/campaign-readiness-gate.spec.ts"
  - "apps/academia-lendaria-ads-studio/playwright.config.ts"
  - "docs/stories/epic-12/STORY-12.W2.1-campaign-gate-ux.md"
---

> **Estimated effort:** 2h  
> **Depends on:** 12.W1.1

# STORY-12.W2.1 — Gate de campanhas, navegação e ações inline

## User Story

**As an operator preparing a project**, **I want** to see what Campaigns still
needs and fix it without being thrown between screens, **so that** I understand
the next step and do not trigger a broken creation.

## Story

**As an operator preparing a project**, **I want** to see what Campaigns still
needs and fix it without being thrown between screens, **so that** I understand
the next step and do not trigger a broken creation.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check", "cd apps/academia-lendaria-ads-studio && npx playwright test e2e/campaign-readiness-gate.spec.ts --config=playwright.config.ts --project=desktop --project=mobile"]
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
```

## Acceptance Criteria

- [ ] AC1: Campanhas permanece visível no shell; quando `campaign.create` está
  bloqueada, o link tem `aria-disabled`, não navega para wizard inválido e mostra
  título, contagem de bloqueadores e CTA de correção.
- [ ] AC2: Visão geral e jornada expõem o mesmo `inputFingerprint`, capability e
  `nextAction.target` para a mesma revisão; o teste falha se qualquer um divergir.
- [ ] AC3: O painel de readiness lista cada lacuna com fonte, impacto e ação inline
  ou âncora para o campo correto; concluir uma ação atualiza o painel sem exigir
  navegação manual de ida e volta.
- [ ] AC4: Projeto pronto exibe CTA de criação habilitado; projeto incompleto não
  habilita submit nem cria draft.
- [ ] AC5: Component tests cobrem loading, empty, blocked, ready, warning e erro;
  Playwright cobre foco/teclado e viewport 390px sem overflow horizontal.

## Tasks

- [ ] T1: Extrair componente/presenter do snapshot de readiness.
- [ ] T2: Integrar shell, overview e campanhas sem duplicar condicionais.
- [ ] T3: Adicionar ações inline e estados de loading/erro vazios.
- [ ] T4: Ajustar estilos ao tema escuro e aos controles nativos expandidos.
- [ ] T5: Cobrir desktop, mobile, foco e leitor de tela nos testes.

## File List

- `apps/academia-lendaria-ads-studio/src/components/unified-shell.tsx` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/components/project-overview.tsx` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/components/project-campaigns.tsx` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/components/campaign-readiness-panel.tsx` (ADD)
- `apps/academia-lendaria-ads-studio/src/components/campaign-readiness-panel.test.tsx` (ADD)
- `apps/academia-lendaria-ads-studio/src/components/project-campaigns.test.tsx` (MODIFY/ADD)
- `apps/academia-lendaria-ads-studio/src/index.css` (MODIFY)
- `apps/academia-lendaria-ads-studio/e2e/campaign-readiness-gate.spec.ts` (ADD/MODIFY)
- `apps/academia-lendaria-ads-studio/playwright.config.ts` (ADD; projetos chromium desktop/mobile)
- `docs/stories/epic-12/STORY-12.W2.1-campaign-gate-ux.md` (MODIFY lifecycle sections)

## Dev Notes

Não esconder a área e não usar texto genérico como “erro”. O componente deve
consumir o snapshot da W1 e navegar por identificadores lógicos de campo, nunca
por path absoluto ou regra hardcoded específica de uma skill.

## Change Log

- 2026-07-16 — @architect: AC2 tornou-se uma comparação determinística de
  fingerprint/capability/nextAction; Playwright e config foram incluídos no
  escopo executável.
