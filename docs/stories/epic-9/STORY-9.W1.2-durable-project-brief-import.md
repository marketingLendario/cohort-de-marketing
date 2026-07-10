---
status: Ready
story_id: "9.W1.2"
title: "Importação durável do briefing"
epic: 9
wave: "W1"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: none
appetite: 2d
hill_phase: figuring_out
confidence_level: high
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: []
consumes_artifacts_of: []
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts"
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts"
  - "apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-briefing.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-briefing.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/lib/project-domain.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/project-domain.test.ts"
  - "docs/stories/epic-9/STORY-9.W1.2-durable-project-brief-import.md"
---

# STORY-9.W1.2 - Importação durável do briefing

## User Story

**Como** operador autenticado
**Quero** importar um `project-brief.json` para o projeto real
**Para** reaproveitar o contexto anterior sem depender do cache do navegador.

## Acceptance Criteria

1. Modo real importa via controller/repository; `importLegacyBrief` local permanece apenas no demo.
2. O migrador valida `0.1.0 -> 1.0.0`, preservando zero, false, unknown e not_applicable.
3. Slug duplicado ou revisão concorrente produz conflito tratável sem sobrescrever dados.
4. Projeto e primeira revisão só entram no cache após persistência bem-sucedida.
5. O projeto importado reaparece após reload, logout/login e novo controller.
6. Erros de schema mostram campos inválidos sem descartar o arquivo original.
7. Testes cobrem sucesso, migração, conflito, falha parcial e round-trip.

## Tasks

- [ ] Adicionar ação `importProjectBrief` ao controller e ao contexto.
- [ ] Portar o handler real do formulário para a ação persistente.
- [ ] Preservar o caminho demo explicitamente.
- [ ] Implementar mensagens de conflito e validação.
- [ ] Cobrir round-trip e regressões de tipos de valor.

## File List

- A preencher durante a implementação.
