---
status: Draft
story_id: "9.W3.3"
title: "Gate de go-live e handoff para Aula 4"
epic: 9
wave: "W3"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: local
appetite: 1d
hill_phase: downhill
confidence_level: medium
involves_ui: false
executor: "@qa"
quality_gate: "@po"
accountable: "Rafael Costa"
depends_on: ["9.W3.1", "9.W3.2"]
consumes_artifacts_of: ["9.W3.1", "9.W3.2"]
file_scope: exclusive
touched_paths:
  - "docs/qa/epic-9-go-live-gate.md"
  - "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
  - "docs/stories/epic-9/epic-9-state.json"
  - ".aiox/waves/epic-9-wave-3/qa-gate.yaml"
---

# STORY-9.W3.3 - Gate de go-live e handoff para Aula 4

## Acceptance Criteria

1. W1 e W2 estão Done e a evidência humana da W3 está anexada.
2. Zero blockers de primeiro acesso, persistência, segurança ou retomada permanecem abertos.
3. Quality gates completos passam sobre o baseline final.
4. Go-live recebe verdict SHIP, HOLD ou KILL com critérios objetivos.
5. Handoff da Aula 4 lista contratos reaproveitáveis, dados ausentes e nenhuma automação Meta implícita.

## Tasks

- [ ] Consolidar gates e riscos residuais.
- [ ] Emitir verdict de go-live.
- [ ] Fechar estado do epic ou registrar resume point exato.
- [ ] Produzir handoff limitado para a Aula 4.
