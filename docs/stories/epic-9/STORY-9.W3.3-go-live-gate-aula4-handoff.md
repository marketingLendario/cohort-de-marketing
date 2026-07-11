---
status: Done
story_id: "9.W3.3"
title: "Gate de go-live e handoff para Aula 4"
epic: 9
wave: "W3"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: local
appetite: 1d
hill_phase: downhill
confidence_level: high
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

1. W1 e W2 estão Done; a evidência proxy autorizada da W3 e a decisão do accountable estão anexadas.
2. Zero blockers de primeiro acesso, persistência, segurança ou retomada permanecem abertos.
3. Quality gates completos passam sobre o baseline final.
4. Go-live recebe verdict SHIP, HOLD ou KILL com critérios objetivos.
5. Handoff da Aula 4 lista contratos reaproveitáveis, dados ausentes e nenhuma automação Meta implícita.

## Tasks

- [x] Consolidar gates e riscos residuais.
- [x] Emitir verdict de go-live.
- [x] Fechar estado do epic.
- [x] Produzir handoff limitado para a Aula 4.

## Verdict

**SHIP** para uso local da Aula 3. Zero blockers abertos. A primeira execução de
um aluno real será observada como monitoramento pós-ship e pode reabrir o gate se
revelar perda de estado, exposição de dado ou ação externa indevida.

## Evidence

- `docs/qa/epic-9-go-live-gate.md`
- `.aiox/waves/epic-9-wave-3/qa-gate.yaml`
- `docs/qa/epic-9-field-usability.md`
- `/tmp/story-9-w2-real-project-evidence/run.json`
- `apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/evidence/run.json`

## File List

| Arquivo | Operação |
|---|---|
| `docs/qa/epic-9-go-live-gate.md` | ADD |
| `.aiox/waves/epic-9-wave-3/qa-gate.yaml` | ADD |
| `docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md` | MODIFY |
| `docs/stories/epic-9/epic-9-state.json` | MODIFY |
| `docs/stories/epic-9/STORY-9.W3.3-go-live-gate-aula4-handoff.md` | MODIFY |

## QA Record

319 testes Vitest, 61 pgTAP, 8 testes do launcher, typecheck, lint, builds,
launcher E2E, onboarding limpo, ciclo real ampliado, piloto de tráfego, regressão
legada e 12 capturas visuais passaram no baseline final.
