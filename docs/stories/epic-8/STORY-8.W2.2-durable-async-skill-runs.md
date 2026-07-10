---
status: InReview
story_id: "8.W2.2"
title: "Runs duráveis, assíncronos e observáveis"
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
depends_on: ["8.W1.1", "8.W1.2"]
consumes_artifacts_of: ["8.W1.1", "8.W1.2"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/server/jobs/types.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/store.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/events.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/supabase-skill-job-store.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.ts"
  - "apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.test.ts"
  - "apps/academia-lendaria-ads-studio/server/local-skill-runner.ts"
  - "apps/academia-lendaria-ads-studio/server/app.ts"
  - "apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts"
  - "apps/academia-lendaria-ads-studio/supabase/migrations/*skill-run-jobs*"
  - "apps/academia-lendaria-ads-studio/supabase/tests/skill_run_jobs.sql"
  - "apps/academia-lendaria-ads-studio/src/lib/skill-runtime.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/skill-runtime.test.ts"
  - "apps/academia-lendaria-ads-studio/src/components/project-journey.tsx"
  - "apps/academia-lendaria-ads-studio/src/components/project-journey.test.tsx"
---

# STORY-8.W2.2 - Runs duráveis, assíncronos e observáveis

## User Story

**Como** aluno executando uma skill longa
**Quero** acompanhar, cancelar e retomar a execução
**Para** não ficar preso a uma requisição ou perder o resultado ao recarregar.

## Acceptance Criteria

1. POST de execução retorna `202 + jobId`; trabalho não permanece preso à conexão HTTP.
2. Job, steps, logs e proposta persistem no Supabase com workspace/project/run hash.
3. SSE entrega snapshot, progress, done/error; polling é fallback funcional.
4. Cancelamento encerra processo filho e registra estado terminal; retry cria tentativa auditável.
5. Reinício do BFF recupera jobs não terminais sem duplicar side effects.
6. UI mostra progresso, cancelamento, retry e retomada após reload, com testes de integração.

## Tasks

- [x] Substituir JobStore process-local por adapter durável.
- [x] Implementar worker assíncrono e lifecycle do processo.
- [x] Ligar SSE real e fallback polling.
- [x] Implementar cancel/retry/recovery.
- [x] Integrar UI e testes de retomada.

## File List

- `apps/academia-lendaria-ads-studio/server/jobs/types.ts` (MODIFY — skill-run job types + lease + projection)
- `apps/academia-lendaria-ads-studio/server/jobs/store.ts` (MODIFY — `SkillRunJobStore` + fake durável + transições puras)
- `apps/academia-lendaria-ads-studio/server/jobs/events.ts` (MODIFY — union snapshot/progress/done/error + bus in-process)
- `apps/academia-lendaria-ads-studio/server/jobs/supabase-skill-job-store.ts` (ADD — adapter durável Supabase, claim atômico)
- `apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.ts` (ADD — worker async, AbortSignal, cancel/retry/recovery)
- `apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts` (MODIFY — `AbortSignal` + progress + cleanup)
- `apps/academia-lendaria-ads-studio/server/app.ts` (MODIFY — 202+jobId, SSE, poll, cancel, retry, recovery on boot)
- `apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts` (MODIFY — contrato assíncrono + hardening W1.2)
- `apps/academia-lendaria-ads-studio/supabase/migrations/20260709231500_skill-run-jobs.sql` (ADD — tabela + RLS idempotente)
- `apps/academia-lendaria-ads-studio/supabase/tests/skill_run_jobs.sql` (ADD — pgTAP RLS + claim)
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.ts` (MODIFY — start/poll/stream/cancel/retry + compat `executeLocalSkill`)
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/components/project-journey.tsx` (MODIFY — progresso/cancelar/retry/retomada)
- `apps/academia-lendaria-ads-studio/src/components/project-journey.test.tsx` (ADD)

## Dev Agent Record

### Agent

@dev (Dex) — Sinkra Wave Execute child, Story 8.W2.2.

### Decisões-chave

- **Família de jobs separada:** o `JobStore` process-local existente (`AdsJobRecord`)
  serve a família ads/publish consumida por `jobs.router.ts`/`context.ts` (fora do
  ownership). Adicionei uma família paralela de **skill-run jobs** nos mesmos arquivos
  (`types.ts`/`store.ts`/`events.ts`), preservando o esqueleto ads intacto.
- **Concorrência = admissão fail-fast:** o limiter W1.2 vira admissão do POST (429 sem
  enfileirar) e o slot é retido durante a execução longa em background — mesma semântica
  de concorrência Codex, agora durável. Retry/recovery aguardam slot numa fila de pump.
- **Recovery sem side effect duplicado:** claim atômico via lease; um run `running` com
  lease expirado (BFF morto) fecha a tentativa como `lease_expired` e abre uma nova
  tentativa auditável. A proposta só é escrita por `store.complete` — nunca parcial.
- **Compat W2.1:** `project-store.ts`/`project-domain.ts` intocados. O `jobId` do backend
  vive dentro de `inputSnapshot` (campo existente), sobrevive ao reload persistido e a UI
  reata SSE/poll por `jobId` sem depender da conexão original. `executeLocalSkill` mantido
  como wrapper de compatibilidade sobre o pipeline durável (consumido por `project-weeks`
  e `traffic-campaign-workspace`, fora do ownership).
- **Hardening W1.2 preservado:** loopback, token constante, env sanitizado, bodyLimit por
  rota, concorrência e timeout/kill escalonado — o `AbortSignal` reusa o mesmo kill
  SIGTERM→SIGKILL e limpa temporários em cancel/timeout.

### Gates executados

- `npm test` — 137 passed (22 files)
- `npm run typecheck` — OK
- `npm run lint` — No issues found
- `npm run build` — OK
- `npm run build:server` — OK
- `npm run lint:db` — No schema errors found
- `npm run test:db` — PASS (skill_run_jobs pgTAP: 5/5)

### Nota de ambiente

`.env` (gitignored) criado localmente a partir de `.env.example` para os testes que
importam `@/lib/supabase` (fora do ownership) rodarem — sem esse arquivo o módulo falha
no load. Não é regressão desta story.

## Implementation Notes

- O endpoint local vira comando assíncrono: autentica, valida, persiste o run e
  responde `202` antes de executar o Codex CLI.
- Supabase é o journal durável; o processo mantém apenas handles efêmeros para
  cancelamento. SSE lê o journal e polling consulta a mesma projeção.
- Recovery reivindica apenas runs não terminais com lease expirado; cada attempt
  tem identificador próprio para evitar side effect duplicado.
- O runner deve aceitar `AbortSignal` e continuar removendo chaves OpenAI/Codex,
  temporários e processo filho no cancelamento/timeout.
- A UI deve manter compatibilidade com o cache da W2.1 e reidratar o run pelo
  `jobId`, sem depender da conexão HTTP original.
