---
status: Ready
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

- [ ] Introduzir hook/controller de workspace.
- [ ] Migrar store para cache + repository.
- [ ] Implementar estados de hidratação e conflito.
- [ ] Isolar fixtures por flag explícita.
- [ ] Cobrir fluxos críticos e reload.

## File List

- `apps/academia-lendaria-ads-studio/src/stores/project-store.ts`
- `apps/academia-lendaria-ads-studio/src/stores/project-store.test.ts`
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts`
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts`
- `apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.tsx`
- `apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.test.tsx`
- `apps/academia-lendaria-ads-studio/src/components/authenticated-route.tsx`
- `apps/academia-lendaria-ads-studio/src/components/projects-home.tsx`

## Implementation Notes

- `useProjectStore` preserva a API consumida pelas telas, mas deixa de ser SOT:
  mutations reais passam pelo controller/repository e só então atualizam o cache.
- Em modo real o estado inicial é vazio e a boundary bloqueia os filhos até a
  hidratação terminar; fixtures entram exclusivamente com `VITE_DEMO_AUTH=true`.
- Autosave deve usar debounce com flush explícito, preservar `0`, `false` e
  `not_applicable`, e nunca resolver conflito sobrescrevendo silenciosamente.
- O teste de nova sessão deve criar um novo store/controller sobre o mesmo
  repository fake e provar round-trip de todas as coleções do projeto.
