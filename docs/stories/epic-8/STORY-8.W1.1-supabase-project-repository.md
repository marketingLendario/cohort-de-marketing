---
status: Ready
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

- [ ] Definir interface e erros tipados do repository.
- [ ] Implementar adapter Supabase e mapeadores de domínio.
- [ ] Adicionar migration somente para gaps comprovados.
- [ ] Cobrir repository com testes unitários e pgTAP.
- [ ] Rodar typecheck, lint, testes e gates Supabase.

## File List

- `apps/academia-lendaria-ads-studio/src/lib/project-repository.ts`
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts`
- `apps/academia-lendaria-ads-studio/supabase/migrations/*project-repository*`
- `apps/academia-lendaria-ads-studio/supabase/tests/project_repository.sql`

