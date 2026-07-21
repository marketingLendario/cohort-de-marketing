---
status: Draft
story_id: "12.W3.1"
title: "Execução observável, erros classificados e recovery"
epic: 12
wave: "W3"
parent_epic: "docs/stories/epic-12/EPIC-12-CAMPAIGNS-READINESS-GATE.md"
deploy_type: local
effort: "2h"
hill_phase: figuring_out
appetite: "3d"
confidence_level: needs-spike
task_mode: EXECUTAR
entity_input:
  entity_type: campaign-run-observability
  status_expected: draft
entity_output:
  entity_type: campaign-run-observability
  status_expected: ready
involves_ui: true
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check"]
accountable: "Pedro Valério"
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
depends_on: ["12.W1.1", "12.W2.1"]
consumes_artifacts_of: ["12.W1.1", "12.W2.1"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/src/components/traffic-campaign-workspace.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/campaign-run-status.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/campaign-run-status.test.tsx"
  - "apps/academia-lendaria-ads-studio/src/lib/skill-runtime.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/skill-runtime.test.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.test.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/types.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/store.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/events.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/supabase-skill-job-store.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/supabase-skill-job-store.test.ts"
  - "apps/academia-lendaria-ads-studio/server/local-skill-runner.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/campaign-run-errors.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/campaign-run-errors.test.ts"
  - "docs/stories/epic-12/STORY-12.W3.1-execution-observability-and-recovery.md"
---

> **Estimated effort:** 2h  
> **Depends on:** 12.W1.1, 12.W2.1

# STORY-12.W3.1 — Execução observável, erros classificados e recovery

## User Story

**As an operator**, **I want** to know whether a campaign is really running, its
current phase, and how to recover a failure, **so that** I do not wait forever or
repeat an unsafe execution.

## Story

**As an operator**, **I want** to know whether a campaign is really running, its
current phase, and how to recover a failure, **so that** I do not wait forever or
repeat an unsafe execution.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "git diff --check"]
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
```

## Acceptance Criteria

- [ ] AC1: O painel estende o `skill-runtime` existente e exibe estado terminal
  e não terminal, fase atual, último evento, timestamp e progresso determinado
  ou indeterminado sem percentual fictício.
- [ ] AC2: `READINESS_BLOCKED`, `STALE_READINESS`, `RUN_FAILED`, `RUN_CANCELLED` e
  `RUN_TIMEOUT` têm mensagem humana, ação, correlation id redigido e retry seguro.
- [ ] AC3: Falhas do runner são persistidas no job/event store existente e
  reaparecem após reload/restart; cancelamento comprova que o PID/handle do
  runner terminou e não há processo órfão.
- [ ] AC4: Retry não reusa snapshot obsoleto nem duplica campanha, plano ou
  artefato; a asserção compara contagens antes/depois por `correlationId` e
  `idempotencyKey`.
- [ ] AC5: Testes cobrem heartbeat parado, timeout, cancelamento, retry, erro de
  backend e reconciliação após perda de SSE/polling, incluindo idempotência e
  ausência de duplicidade.

## Tasks

- [ ] T1: Mapear eventos/jobs atuais e definir máquina de estados mínima.
- [ ] T2: Adicionar contrato de erro e normalização no BFF/worker.
- [ ] T3: Criar componente de status com loader, progresso e ações.
- [ ] T4: Implementar retry/cancelamento idempotentes e observáveis.
- [ ] T5: Validar reload, restart e perda de stream.

## File List

- `apps/academia-lendaria-ads-studio/src/components/traffic-campaign-workspace.tsx` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/components/campaign-run-status.tsx` (ADD)
- `apps/academia-lendaria-ads-studio/src/components/campaign-run-status.test.tsx` (ADD)
- `apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.test.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/jobs/types.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/jobs/store.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/jobs/events.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/jobs/supabase-skill-job-store.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/jobs/supabase-skill-job-store.test.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.test.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/campaign-run-errors.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/lib/campaign-run-errors.test.ts` (ADD)
- `docs/stories/epic-12/STORY-12.W3.1-execution-observability-and-recovery.md` (MODIFY lifecycle sections)

## Dev Notes

Reusar o journal/job store e os eventos já existentes. Loader é feedback de
estado, não uma promessa de ETA; previsão só aparece se houver uma medição
confiável. Nunca engolir erro do runner com uma string genérica.

## Change Log

- 2026-07-16 — @architect: runtime existente explicitamente reutilizado; adapter
  Supabase, idempotency key e prova de PID órfão incluídos no escopo.
