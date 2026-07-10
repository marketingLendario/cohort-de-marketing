---
status: Ready
story_id: "8.W2.3"
title: "Aprovação em duas fases: DB e filesystem"
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
depends_on: ["8.W1.3", "8.W2.1", "8.W2.2"]
consumes_artifacts_of: ["8.W1.3", "8.W2.1", "8.W2.2"]
file_scope: shared
touched_paths:
  - "apps/academia-lendaria-ads-studio/server/artifact-approval.ts"
  - "apps/academia-lendaria-ads-studio/server/artifact-approval.test.ts"
  - "apps/academia-lendaria-ads-studio/server/app.ts"
  - "apps/academia-lendaria-ads-studio/supabase/migrations/*artifact-approval*"
  - "apps/academia-lendaria-ads-studio/supabase/tests/artifact_approval.sql"
  - "apps/academia-lendaria-ads-studio/src/lib/artifact-approval.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/artifact-approval.test.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-repository.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts"
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts"
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts"
  - "apps/academia-lendaria-ads-studio/src/stores/project-store.ts"
  - "apps/academia-lendaria-ads-studio/src/stores/project-store.test.ts"
  - "apps/academia-lendaria-ads-studio/src/components/project-journey.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-artifacts.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/artifact-approval-review.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/artifact-approval-review.test.tsx"
---

# STORY-8.W2.3 - Aprovação em duas fases: DB e filesystem

## User Story

**Como** revisor humano
**Quero** comparar, editar, aprovar ou rejeitar uma proposta antes da escrita
**Para** manter o filesystem e o banco coerentes e auditáveis.

## Acceptance Criteria

1. UI mostra diff, arquivos afetados, warnings e invalidações antes de aprovar.
2. Aprovação chama endpoint idempotente com expected hash/revision.
3. Fluxo usa outbox/compensação: DB e filesystem não ficam silenciosamente divergentes.
4. Sucesso materializa arquivo, metadado, evento e status `done` com o mesmo hash.
5. Rejeição/cancelamento não escreve arquivos; edição gera nova proposta/revisão.
6. Testes injetam falha antes/depois do rename e provam retry/repair determinístico.
7. Aprovação e rejeição persistem a revisão humana do `skill_run`; após reload, `done` ou
   `cancelled` reaparece igual e nunca volta indevidamente para `needs_review`.

## Tasks

- [ ] Criar contrato e endpoint de approval.
- [ ] Implementar outbox/compensação e idempotência.
- [ ] Construir UI de diff e impactos.
- [ ] Integrar status, invalidation e audit event.
- [ ] Persistir approve/reject no repository e provar reidratação em nova sessão.
- [ ] Cobrir failure injection e repair.

## File List

- `apps/academia-lendaria-ads-studio/server/artifact-approval.ts`
- `apps/academia-lendaria-ads-studio/server/artifact-approval.test.ts`
- `apps/academia-lendaria-ads-studio/server/app.ts`
- `apps/academia-lendaria-ads-studio/supabase/migrations/*artifact-approval*`
- `apps/academia-lendaria-ads-studio/supabase/tests/artifact_approval.sql`
- `apps/academia-lendaria-ads-studio/src/lib/artifact-approval.ts`
- `apps/academia-lendaria-ads-studio/src/lib/artifact-approval.test.ts`
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.ts`
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.test.ts`
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts`
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts`
- `apps/academia-lendaria-ads-studio/src/stores/project-store.ts`
- `apps/academia-lendaria-ads-studio/src/stores/project-store.test.ts`
- `apps/academia-lendaria-ads-studio/src/components/project-journey.tsx`
- `apps/academia-lendaria-ads-studio/src/components/project-artifacts.tsx`
- `apps/academia-lendaria-ads-studio/src/components/artifact-approval-review.tsx`
- `apps/academia-lendaria-ads-studio/src/components/artifact-approval-review.test.tsx`
