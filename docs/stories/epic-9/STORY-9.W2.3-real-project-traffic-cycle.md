---
status: Done
story_id: "9.W2.3"
title: "Ciclo operacional da Aula 3 em projeto real"
epic: 9
wave: "W2"
parent_epic: "docs/stories/epic-9/EPIC-9-GO-LIVE-AULA-3.md"
deploy_type: local
appetite: 2d
hill_phase: downhill
confidence_level: high
involves_ui: true
executor: "@qa"
quality_gate: "@po"
accountable: "Rafael Costa"
depends_on: ["9.W2.1", "9.W2.2"]
consumes_artifacts_of: ["9.W2.1", "9.W2.2"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/e2e/story-9-w2-real-project.mjs"
  - "apps/academia-lendaria-ads-studio/supabase/migrations/20260710200000_ads_campaigns.sql"
  - "apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts"
  - "apps/academia-lendaria-ads-studio/supabase/tests/ads_campaigns.sql"
  - "data/pilots/academia-lendaria-project.manifest.json"
  - "data/pilots/academia-lendaria-project-brief.json"
  - "scripts/validate-pilot-manifest.test.mjs"
  - "docs/qa/epic-9-academia-lendaria-source-map.md"
  - "docs/qa/epic-9-real-project-pilot.md"
  - "docs/stories/epic-9/epic-9-state.json"
  - ".aiox/waves/epic-9-wave-2/qa-gate.yaml"
  - "docs/stories/epic-9/STORY-9.W2.3-real-project-traffic-cycle.md"
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

- [x] Importar projeto e reconciliar artefatos.
- [x] Executar preparação e operação semanal.
- [x] Registrar decisões e limites humanos.
- [x] Validar restart, desktop e mobile.

## File List

| Arquivo | Operação |
|---------|----------|
| `apps/academia-lendaria-ads-studio/e2e/story-9-w2-real-project.mjs` | ADD |
| `apps/academia-lendaria-ads-studio/supabase/migrations/20260710200000_ads_campaigns.sql` | ADD |
| `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts` | MODIFY |
| `apps/academia-lendaria-ads-studio/supabase/tests/ads_campaigns.sql` | ADD |
| `data/pilots/academia-lendaria-project.manifest.json` | MODIFY |
| `data/pilots/academia-lendaria-project-brief.json` | MODIFY |
| `scripts/validate-pilot-manifest.test.mjs` | MODIFY |
| `docs/qa/epic-9-academia-lendaria-source-map.md` | MODIFY |
| `docs/qa/epic-9-real-project-pilot.md` | ADD |
| `.aiox/waves/epic-9-wave-2/qa-gate.yaml` | ADD |
| `docs/stories/epic-9/epic-9-state.json` | MODIFY |
| `docs/stories/epic-9/STORY-9.W2.3-real-project-traffic-cycle.md` | MODIFY |

## Dev Agent Record

### Implementação

- Runner novo em `apps/academia-lendaria-ads-studio/e2e/story-9-w2-real-project.mjs`, combinando:
  - preflight do launcher oficial e ciclo isolado de Supabase da W1;
  - jornada de revisão/aprovação/reconciliação do `traffic-squad.spec.ts`;
  - intake W2.1 com o pacote `data/pilots/academia-lendaria-project-brief.json` e os hashes do manifesto real.
- O script remove `OPENAI_API_KEY` e `CODEX_API_KEY` do ambiente, copia as fontes congeladas do pacote real para `projetos/maquina-de-receita-com-ia/`, abre o Studio via `scripts/marketing-studio.mjs`, importa o briefing, roda o intake local, cria uma campanha draft pela UI e prova reload/logout-login/restart.
- As provas de negócio/segurança já codificadas no runner incluem:
  - bloqueio de prontidão e recusa honesta do Zelador;
  - execução local via Codex CLI das cinco skills;
  - reconciliação de artefatos materializados por hash no filesystem;
  - fail-closed para métricas ausentes (`CTR`, `CPM`, `alcance`, `frequência`);
  - verificação explícita de ausência de requests Meta/Facebook e de logs de handoff mutativo.

### Estado final

- `node e2e/story-9-w2-real-project.mjs` — PASS.
- As 5 skills terminaram em `done`; hashes do filesystem e banco coincidiram.
- A campanha criada pela interface permaneceu `draft`, sem requests Meta/Facebook.
- Reload, logout/login e restart reidrataram o histórico completo.
- Desktop e mobile passaram sem erros, overflow ou sobreposição visível.

## QA Gate

**Veredito:** PASS em 2026-07-10.

- AC1–AC6 possuem evidência operacional no relatório `docs/qa/epic-9-real-project-pilot.md`.
- O gate da wave está em `.aiox/waves/epic-9-wave-2/qa-gate.yaml`.

## Change Log

| Data | Agente | Mudança |
|---|---|---|
| 2026-07-10 | @qa | Implementado o runner E2E real da Story 9.W2.3 e registrado o bloqueio factual do ambiente (Docker/Supabase) antes da execução completa dos gates. |
| 2026-07-10 | @qa | Runner executado pelo orquestrador com Docker local; AC1–AC6 aprovados e Wave 2 encerrada. |
