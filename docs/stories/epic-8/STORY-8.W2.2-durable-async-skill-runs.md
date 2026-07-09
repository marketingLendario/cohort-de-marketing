---
status: Draft
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
file_scope: shared
touched_paths:
  - "apps/academia-lendaria-ads-studio/server/jobs/**"
  - "apps/academia-lendaria-ads-studio/server/app.ts"
  - "apps/academia-lendaria-ads-studio/src/lib/skill-runtime.ts"
  - "apps/academia-lendaria-ads-studio/src/components/project-journey.tsx"
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

- `apps/academia-lendaria-ads-studio/server/jobs/**`
- `apps/academia-lendaria-ads-studio/server/app.ts`
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.ts`
- `apps/academia-lendaria-ads-studio/src/components/project-journey.tsx`

