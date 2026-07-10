---
status: Ready
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

- [ ] Substituir JobStore process-local por adapter durável.
- [ ] Implementar worker assíncrono e lifecycle do processo.
- [ ] Ligar SSE real e fallback polling.
- [ ] Implementar cancel/retry/recovery.
- [ ] Integrar UI e testes de retomada.

## File List

- `apps/academia-lendaria-ads-studio/server/jobs/types.ts`
- `apps/academia-lendaria-ads-studio/server/jobs/store.ts`
- `apps/academia-lendaria-ads-studio/server/jobs/events.ts`
- `apps/academia-lendaria-ads-studio/server/jobs/supabase-skill-job-store.ts`
- `apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.ts`
- `apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.test.ts`
- `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts`
- `apps/academia-lendaria-ads-studio/server/app.ts`
- `apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts`
- `apps/academia-lendaria-ads-studio/supabase/migrations/*skill-run-jobs*`
- `apps/academia-lendaria-ads-studio/supabase/tests/skill_run_jobs.sql`
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.ts`
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.test.ts`
- `apps/academia-lendaria-ads-studio/src/components/project-journey.tsx`
- `apps/academia-lendaria-ads-studio/src/components/project-journey.test.tsx`

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
