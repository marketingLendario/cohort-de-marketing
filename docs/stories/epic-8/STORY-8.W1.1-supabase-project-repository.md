---
status: InReview
story_id: "8.W1.1"
title: "Repository Supabase do domínio unificado"
epic: 8
wave: "W1"
parent_epic: "docs/stories/epic-8/EPIC-8-PERSISTENCIA-RUNTIME-OPERACIONAL.md"
deploy_type: none
appetite: 1d
hill_phase: figuring_out
confidence_level: high
involves_ui: false
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: []
consumes_artifacts_of: []
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/src/lib/project-repository.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts"
  - "apps/academia-lendaria-ads-studio/supabase/migrations/*project-repository*"
  - "apps/academia-lendaria-ads-studio/supabase/tests/project_repository.sql"
---

# STORY-8.W1.1 - Repository Supabase do domínio unificado

## User Story

**Como** operador autenticado do Marketing Studio
**Quero** que o domínio unificado tenha um repository Supabase versionado
**Para** reabrir projetos, revisões e semanas sem depender do navegador original.

## Acceptance Criteria

1. Existe interface `ProjectRepository` para projetos, brief revisions, artefatos, skill runs, campaign plans e weekly panels.
2. A implementação Supabase converte explicitamente `snake_case <-> camelCase` e nunca usa `service_role` no frontend.
3. Escritas versionadas usam optimistic concurrency; conflito retorna erro tipado e não sobrescreve revisão concorrente.
4. Queries sempre carregam `workspace_id` e dependem da RLS, sem filtro de segurança reimplementado no cliente.
5. Migrations adicionais são idempotentes e `supabase db lint --local --level warning` passa.
6. Testes cobrem CRUD, conflito de revisão e isolamento RLS positivo/negativo.

## Tasks

- [x] Definir interface e erros tipados do repository.
- [x] Implementar adapter Supabase e mapeadores de domínio.
- [x] Adicionar migration somente para gaps comprovados.
- [x] Cobrir repository com testes unitários e pgTAP.
- [x] Rodar typecheck, lint, testes e gates Supabase.

## File List

- `apps/academia-lendaria-ads-studio/src/lib/project-repository.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/supabase/migrations/20260709230000_project-repository-updated-at.sql` (ADD)
- `apps/academia-lendaria-ads-studio/supabase/tests/project_repository.sql` (ADD)

## Dev Agent Record

**Executor:** @dev (child SDC story-8.W1.1, worktree isolada) · **Modo:** yolo/autônomo

### Abordagem
- O schema das 8 tabelas do domínio + RLS (`private.is_workspace_member`) já
  existia (migration `20260709225123_unified_marketing_project_domain.sql`). O
  trabalho foi a camada de repository que consome esse schema sob a RLS.
- `project-repository.ts`: interface `ProjectRepository` para os 6 grupos de
  entidade (projetos, revisões de briefing, artefatos, skill runs, planos de
  campanha, painéis semanais), erros tipados (`RepositoryError`,
  `RevisionConflictError`, `RepositoryForbiddenError`), mappers `snake_case ↔
  camelCase` explícitos e um factory injetável (`createSupabaseProjectRepository`).
- Cliente RLS-aware `@/lib/supabase` (anon key + JWT do usuário); `service_role`
  nunca aparece (AC2). Toda query filtra `workspace_id` e o isolamento vem da RLS,
  não reimplementado no cliente (AC4).

### Decisões
- **OCC (AC3):** escrita versionada insere o `revision` esperado contra os
  `unique(..., revision)` do schema; colisão concorrente → Postgres `23505` →
  `RevisionConflictError` tipado, sem sobrescrever a revisão concorrente.
- **Migration (gap comprovado, AC5):** o schema base carimba `updated_at` só no
  INSERT (`default now()`). O contrato `updatedAt` do repository é lido ao reabrir
  sessão (gate 2 do EPIC-8), então um UPDATE precisava renovar o timestamp.
  Migration `20260709230000` adiciona trigger `moddatetime` idempotente às 6
  tabelas mutáveis. Único gap comprovado — nenhuma migration especulativa.
- **Sentinelas de tipo:** `active_brief_revision_id`/`path` são nullable no DB mas
  não-nulos no domínio (`project-domain.ts`, fora do ownership) — mapeados para
  `''` de forma documentada, sem tocar os tipos de domínio.

### Gates executados
- `vitest run` (suíte completa): 18 arquivos / 81 testes — PASS (16 novos em
  `project-repository.test.ts`).
- `tsc -b` (typecheck): PASS.
- `eslint`: PASS (arquivos da story).
- `supabase db lint --local --level warning`: No schema errors found.
- `supabase test db` (pgTAP): 10 testes / PASS (6 novos em
  `project_repository.sql` cobrindo CRUD, conflito de revisão e RLS +/-).

### Riscos residuais
- Adapter validado via mappers puros + fake client + pgTAP contra RLS real; não há
  teste de integração ponta-a-ponta rodando o adapter TS contra o Supabase local
  (fica para W2.1 — hidratação da UI via repository).
- `.env` local (gitignored) foi criado a partir de `.env.example` para os testes de
  cliente rodarem na worktree fresca — não versionado, não é deliverable.

