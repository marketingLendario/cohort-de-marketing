---
status: Draft
story_id: "8.W3.1"
title: "E2E real do Squad de Tráfego"
epic: 8
wave: "W3"
parent_epic: "docs/stories/epic-8/EPIC-8-PERSISTENCIA-RUNTIME-OPERACIONAL.md"
deploy_type: none
appetite: 2d
hill_phase: figuring_out
confidence_level: medium
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
accountable: "Rafael Costa"
depends_on: ["8.W2.3"]
consumes_artifacts_of: ["8.W2.3"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/e2e/traffic-squad.spec.ts"
  - "apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/**"
  - "apps/academia-lendaria-ads-studio/scripts/traffic-pilot-report.mjs"
  - "docs/qa/epic-8-traffic-pilot.md"
---

# STORY-8.W3.1 - E2E real do Squad de Tráfego

## User Story

**Como** aluno da Aula 3
**Quero** operar o squad completo pela interface
**Para** sair do briefing até uma decisão semanal sem usar comandos técnicos.

## Acceptance Criteria

1. Fixture real cria projeto e campanha sem depender do estado demo embutido.
2. Zelador, Briefista e Estruturador executam, revisam e materializam artefatos.
3. Métricas com selos Real/Estimado/Não fornecido passam pelo Leitor sem cálculo inventado.
4. Diagnosticador retorna uma alavanca com critérios de sucesso e reversão; humano decide.
5. Reload entre etapas prova retomada DB/filesystem e hashes reconciliados.
6. Relatório registra tempos, lacunas, recusas, arquivos e evidência visual desktop/mobile.

## Tasks

- [ ] Montar fixture e seed determinístico.
- [ ] Automatizar sequência das cinco skills.
- [ ] Testar reload, retry e recusas honestas.
- [ ] Validar hashes DB/filesystem.
- [ ] Publicar relatório de piloto e screenshots.

## File List

- `apps/academia-lendaria-ads-studio/e2e/traffic-squad.spec.ts`
- `apps/academia-lendaria-ads-studio/e2e/fixtures/traffic-pilot/**`
- `apps/academia-lendaria-ads-studio/scripts/traffic-pilot-report.mjs`
- `docs/qa/epic-8-traffic-pilot.md`

