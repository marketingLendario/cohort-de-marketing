---
status: Ready
story_id: "9.W3.1"
title: "Evidência de usabilidade e métricas do piloto"
epic: 9
wave: "W3"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: none
appetite: 1d
hill_phase: figuring_out
confidence_level: low
involves_ui: false
executor: "@analyst"
quality_gate: "@po"
accountable: "Rafael Costa"
depends_on: ["9.W2.3"]
consumes_artifacts_of: ["9.W2.3"]
file_scope: exclusive
touched_paths:
  - "docs/qa/epic-9-field-usability.md"
  - "data/pilots/epic-9-field-observation.schema.json"
---

# STORY-9.W3.1 - Evidência de usabilidade e métricas do piloto

## Acceptance Criteria

1. Pelo menos um operador-alvo executa o roteiro sem assistência de desenvolvimento.
2. Registro contém tempos, hesitações, bloqueios, recuperações e resultado por etapa.
3. Nenhuma PII, senha, token ou conteúdo privado entra na evidência.
4. Achados são separados em blocker, correção pré-go-live e backlog.
5. Métricas não são convertidas em promessa antes do reality-check.

## Tasks

- [ ] Preparar roteiro e consentimento de observação.
- [ ] Observar execução e registrar evidência estruturada.
- [ ] Classificar achados e recomendar gate.
