---
status: InReview
story_id: "8.W2.1"
title: "Hidratação e persistência da UI via repository"
epic: 8
wave: "W2"
parent_epic: "docs/stories/epic-8/EPIC-8-PERSISTENCIA-RUNTIME-OPERACIONAL.md"
deploy_type: none
appetite: 2d
hill_phase: figuring_out
confidence_level: medium
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: ["8.W1.1"]
consumes_artifacts_of: ["8.W1.1"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/src/stores/project-store.ts"
  - "apps/academia-lendaria-ads-studio/src/stores/project-store.test.ts"
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts"
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts"
  - "apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/authenticated-route.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/projects-home.tsx"
  - "apps/academia-lendaria-ads-studio/src/lib/project-repository.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts"
---

# STORY-8.W2.1 - Hidratação e persistência da UI via repository

## User Story

**Como** operador autenticado
**Quero** que a UI carregue e grave o projeto no Supabase
**Para** continuar o trabalho em outra sessão sem perder estado.

## Acceptance Criteria

1. Zustand passa a cache de UI; Supabase é SOT fora do modo demo.
2. Hidratação tem estados loading, empty, error, offline e conflict sem flash de fixture.
3. Autosave agrupa alterações, preserva zero/false/NA e resolve revision conflicts por conciliação explícita.
4. Fixtures só carregam quando `VITE_DEMO_AUTH=true`.
5. Projeto, briefing, artefatos, plans e weeks reabrem iguais após reload e nova sessão.
6. Component tests e E2E cobrem hidratação, autosave, conflito e isolamento demo/real.

## Tasks

- [x] Introduzir hook/controller de workspace.
- [x] Migrar store para cache + repository.
- [x] Implementar estados de hidratação e conflito.
- [x] Isolar fixtures por flag explícita.
- [x] Cobrir fluxos críticos e reload.

## File List

- `apps/academia-lendaria-ads-studio/src/stores/project-store.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/stores/project-store.test.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.tsx` (ADD)
- `apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.test.tsx` (ADD)
- `apps/academia-lendaria-ads-studio/src/components/authenticated-route.tsx` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/components/projects-home.tsx` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts` (MODIFY)

## Implementation Notes

- `useProjectStore` preserva a API consumida pelas telas, mas deixa de ser SOT:
  mutations reais passam pelo controller/repository e só então atualizam o cache.
- Em modo real o estado inicial é vazio e a boundary bloqueia os filhos até a
  hidratação terminar; fixtures entram exclusivamente com `VITE_DEMO_AUTH=true`.
- Autosave deve usar debounce com flush explícito, preservar `0`, `false` e
  `not_applicable`, e nunca resolver conflito sobrescrevendo silenciosamente.
- O teste de nova sessão deve criar um novo store/controller sobre o mesmo
  repository fake e provar round-trip de todas as coleções do projeto.

## Dev Agent Record

**Executor:** @dev (child SDC story-8.W2.1, worktree isolada, recuperação de freeze) · **Modo:** yolo/autônomo

### Abordagem

- `project-store.ts` virou uma **factory** (`createProjectStore({ demoEnabled })`)
  em vez de um único singleton: fixtures demo só entram na coleção inicial
  quando `demoEnabled` é verdadeiro (AC4); fora do demo o storage do
  `persist` é um `Storage` no-op (nunca `localStorage`, AC1). O singleton
  `useProjectStore` usa o mesmo default de `DEMO_AUTH_ENABLED`, duplicado
  localmente (`defaultDemoEnabled()`) para não criar import cíclico com
  `@/lib/demo-mode` (que já importa `DEMO_PROJECT_ID` deste arquivo).
- A store ganhou um estado `hydration` (`idle|loading|ready|empty|error|
  offline|conflict`) e uma API de cache pura: `replaceAll`/`clearAll`
  (hidratação em lote), `applyCreatedProject`/`applyBriefRevision`
  (mutations incrementais do controller) e `bindPersistence` — um sink
  opcional que o controller liga em modo real para que as mutations
  **legadas** (`updateBriefField`/`markFieldNotApplicable`, já consumidas por
  telas fora do ownership desta story, ex. `project-briefing.tsx`) também
  disparem autosave, sem exigir que essas telas mudem de API.
- `use-project-workspace.ts`: controller puro e injetável
  (`createProjectWorkspaceController`) + hook React (`useProjectWorkspace`).
  Hidrata via `ProjectRepository` (projetos, brief revisions, artefatos,
  skill runs, campaign plans e weekly panels por projeto), cria projeto real
  (`createProject` + `createBriefRevision(revision:1)` + `updateProject` com
  o pointer), e autosave dos campos do briefing debounced
  (`AUTOSAVE_DEBOUNCE_MS`) com `flush()` explícito para bypass em
  testes/reconciliação.
- `project-repository.ts`: dois métodos novos na interface e no adapter
  Supabase — `listCampaignPlanRevisionsForProject` e
  `listWeeklyPanelsForProject` — que listam por `workspace_id` + `project_id`
  (ambas as colunas já existem em `campaign_plan_revisions`/
  `ads_weekly_panels`, FK para `marketing_projects`), reusando os mappers e
  colunas existentes. Fecham o gap de discovery apontado na 1ª rodada desta
  story: hidratar essas duas coleções nunca precisou de um `campaignId`
  descoberto via `ads_campaigns` — o `project_id` já era coluna própria da
  tabela.
- `project-hydration-boundary.tsx`: bloqueia com telas dedicadas para
  `loading/idle`, `offline`, `error` e `conflict` (cada uma com ação de
  retomada); `ready` e `empty` liberam os filhos — workspace vazio é estado
  válido e quem decide a UI de "criar o 1º projeto" é a própria tela
  (`ProjectsHome`), não a boundary. Expõe `createProject` via Context
  (`useProjectWorkspaceActions`) para as telas dentro dela.
- `authenticated-route.tsx`: após sessão + spokes resolvidos, passa a
  envolver `children` com `<ProjectHydrationBoundary workspaceId={activeSpokeId}>`.
- `projects-home.tsx`: `submitProject` agora bifurca — modo demo cria local e
  síncrono via `useProjectStore.createProject` (caminho explícito, AC4); modo
  real usa `await useProjectWorkspaceActions().createProject(name)` (persiste
  no repository) **antes** de navegar (AC1/AC5).

### Decisões (ambíguo → mínimo compatível)

- **`resetDemo()` sempre repõe o fixture demo**, independente do
  `demoEnabled` da instância. É um utilitário explícito (não chamado em
  código de produção, só por testes de componente pré-existentes como
  `project-overview.test.tsx`) — decidi que o gate da AC4 vale para o *boot*
  automático da store, não para essa ação nomeada e explícita. Sem essa
  decisão, `project-overview.test.tsx` (fora do ownership desta story)
  quebraria.
- **`campaignPlans`/`weeklyPanels` agora hidratam via `ProjectRepository`**
  (correção de quality gate desta story). A 1ª rodada havia registrado como
  gap que `listCampaignPlanRevisions`/`listWeeklyPanels` exigem `campaignId`
  e que não haveria "discovery de campanhas do projeto" sem tocar
  `project-campaigns.tsx` (fora do `file_scope`). Essa premissa estava
  incorreta: `campaign_plan_revisions` e `ads_weekly_panels` já têm
  `project_id` como coluna própria (FK para `marketing_projects`, ver
  `20260709225123_unified_marketing_project_domain.sql`) — não é preciso
  descobrir `campaignId` para listar por projeto. `listCampaignPlanRevisionsForProject`/
  `listWeeklyPanelsForProject` (novos, adicionados a `project-repository.ts`,
  ownership ampliado desta recuperação) filtram direto por
  `workspace_id` + `project_id`, reusando `CAMPAIGN_PLAN_COLS`/
  `WEEKLY_PANEL_COLS` e os mappers existentes (RLS preservada, nenhuma
  query nova em `ads_campaigns`). `loadWorkspaceSnapshot` (em
  `use-project-workspace.ts`) chama os dois métodos por projeto e
  `replaceAll` já aceitava `campaignPlans`/`weeklyPanels` opcionais desde a
  1ª rodada — não foi preciso mudar o store.
- **Reconciliação de conflito usa `listBriefRevisions` + maior `revision`**,
  não `getActiveBrief` (`status='active'`). Motivo: a QA gate de 8.W1.1 já
  registrou como risco P3 que "a unicidade de uma única revisão `active` por
  projeto ainda depende da aplicação" — o repository não expõe forma de
  "superseder" a revisão anterior no banco (fora do ownership desta story).
  Se dependêssemos de `getActiveBrief` (`.maybeSingle()`), duas ou mais linhas
  com `status='active'` fariam a chamada falhar. O `revision` mais alto é a
  garantia real (índice único do OCC), então a reconciliação e o cache usam
  essa garantia em vez do campo `status` bruto da linha.
- **Autosave cobre só os campos do briefing** (`updateBriefField`/
  `markFieldNotApplicable`). Artefatos/skill runs/campaign plans continuam
  mutations locais de cache (a AC3 fala especificamente de autosave do
  briefing e de 0/false/NA nesses campos).

### Gates executados

- `npm test` (suíte completa do app, client+server): 21 arquivos / 140 testes
  — PASS (27 no store, 9 no hook de workspace — incluindo os 2 round-trips
  novos de campaign plans/weekly panels e skill runs —, 6 na boundary, 2
  novos no adapter do repository).
- `npm run typecheck` (`tsc -b`): PASS.
- `npm run lint` (`eslint .`): PASS (0 problemas).
- `npm run build` (`vite build`): PASS.
- `.env` local (gitignored) criado a partir de `.env.example` para os testes
  de cliente rodarem na worktree fresca — não versionado, não é deliverable
  (mesma nota já registrada em 8.W1.1).

### Correção de quality gate (recuperação desta story)

O commit original desta story foi aprovado no `npm test`/`typecheck`/`lint`/
`build`, mas o próprio Dev Agent Record admitia que `campaignPlans`/
`weeklyPanels` continuavam cache-only — a AC5 exige que "Projeto, briefing,
artefatos, plans e weeks reabrem iguais após reload e nova sessão", e "plans"/
"weeks" não faziam esse round-trip. Esta recuperação:

1. Adicionou `listCampaignPlanRevisionsForProject`/`listWeeklyPanelsForProject`
   ao `ProjectRepository` (interface + adapter Supabase), filtrando por
   `workspace_id` + `project_id` (colunas que já existiam nas duas tabelas).
2. Fez `loadWorkspaceSnapshot` (`use-project-workspace.ts`) hidratar as duas
   coleções por projeto e repassá-las ao `replaceAll` do store.
3. Provou o round-trip real: um novo teste em
   `use-project-workspace.test.ts` cria um plano de campanha e um painel
   semanal via `repository.createCampaignPlanRevision`/
   `createWeeklyPanelRevision`, derruba o controller/store da "sessão A" e
   hidrata um controller/store novo ("sessão B") sobre o mesmo repository
   fake — `storeB.getState().campaignPlans`/`weeklyPanels` chegam
   populados. O teste de round-trip pré-existente também passou a cobrir
   `skillRuns` (antes só projeto/briefing/artefatos).
4. Adicionou 2 testes de adapter em `project-repository.test.ts` provando que
   as novas queries filtram por `workspace_id` + `project_id` sem depender de
   `campaignId`.

AC5 agora está satisfeito para as 6 coleções do domínio unificado (projetos,
briefing, artefatos, skill runs, campaign plans, weekly panels).

### Riscos residuais

- P3 (herdado de 8.W1.1, não widened aqui): unicidade de revisão `active`
  ainda depende da aplicação — mitigado na reconciliação (ver decisão acima),
  mas uma auditoria/migration que resolva isso no schema deixaria o
  repository mais robusto para futuras stories.
- Autosave (AC3) continua cobrindo só os campos do briefing — mutations de
  artefatos/skill runs/campaign plans/weekly panels continuam locais de
  cache além do momento em que são gravados via `ProjectRepository`
  diretamente pelo chamador (a AC3 fala especificamente de autosave do
  briefing e de 0/false/NA nesses campos; as demais telas que escrevem essas
  coleções estão fora do ownership desta story).
- Não há E2E Playwright nesta story (AC6 menciona E2E); a cobertura entregue
  é de component/unit tests (store, hook/controller, boundary, repository).
  Nenhum arquivo de E2E estava no `touched_paths`/File List desta story.
