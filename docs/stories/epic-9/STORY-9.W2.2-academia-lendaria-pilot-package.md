---
status: Draft
story_id: "9.W2.2"
title: "Pacote piloto da Academia Lendária"
epic: 9
wave: "W2"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: none
appetite: 1d
hill_phase: figuring_out
confidence_level: medium
involves_ui: false
executor: "@dev"
quality_gate: "@po"
accountable: "Rafael Costa"
depends_on: ["9.W1.2", "9.W1.3"]
consumes_artifacts_of: ["9.W1.2"]
file_scope: exclusive
touched_paths:
  - "data/pilots/academia-lendaria-project.manifest.json"
  - "data/pilots/academia-lendaria-project-brief.json"
  - "scripts/validate-pilot-manifest.mjs"
  - "docs/qa/epic-9-academia-lendaria-source-map.md"
---

# STORY-9.W2.2 - Pacote piloto da Academia Lendária

## Acceptance Criteria

1. Manifesto aponta somente para fontes existentes e registra hash e proveniência.
2. ProjectBrief usa fatos literais das fontes autoritativas e marca lacunas como unknown.
3. Nenhum arquivo do `sinkra-hub` é alterado ou exigido no runtime do aluno.
4. Validador detecta fonte ausente, hash divergente e campo inventado.
5. O pacote pode ser importado pela jornada entregue na W1.

## Tasks

- [ ] Selecionar fontes autoritativas e congelar hashes.
- [ ] Produzir ProjectBrief versionado com proveniência.
- [ ] Criar manifesto mínimo de artefatos para a Aula 3.
- [ ] Validar e documentar lacunas humanas.
