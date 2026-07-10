---
status: Draft
story_id: "9.W2.3"
title: "Ciclo operacional da Aula 3 em projeto real"
epic: 9
wave: "W2"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: local
appetite: 2d
hill_phase: figuring_out
confidence_level: medium
involves_ui: true
executor: "@qa"
quality_gate: "@po"
accountable: "Rafael Costa"
depends_on: ["9.W2.1", "9.W2.2"]
consumes_artifacts_of: ["9.W2.1", "9.W2.2"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/e2e/story-9-w2-real-project.mjs"
  - "docs/qa/epic-9-real-project-pilot.md"
  - "docs/stories/epic-9/epic-9-state.json"
  - ".aiox/waves/epic-9-wave-2/qa-gate.yaml"
---

# STORY-9.W2.3 - Ciclo operacional da Aula 3 em projeto real

## Acceptance Criteria

1. O pacote da Academia Lendária entra por briefing + intake, sem seed oculto.
2. As cinco skills executam com os insumos reais aprovados pelo operador.
3. Curadoria, subida manual, métricas e decisão humana ficam registradas.
4. Nenhuma ação Meta é executada e a campanha permanece draft até confirmação externa.
5. Reload, logout/login e restart do launcher preservam todo o estado.
6. Lacunas de dado geram bloqueio honesto, não conteúdo inventado.

## Tasks

- [ ] Importar projeto e reconciliar artefatos.
- [ ] Executar preparação e operação semanal.
- [ ] Registrar decisões e limites humanos.
- [ ] Validar restart, desktop e mobile.
