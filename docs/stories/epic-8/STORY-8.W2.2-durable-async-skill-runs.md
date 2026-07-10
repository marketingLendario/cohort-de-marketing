---
status: Done
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

### Recuperação de quality gate (QA batch 1) — arquivos adicionais

Correção dos 2 P2 bloqueantes + 2 P3 do gate `.aiox/waves/epic-8-wave-2/qa-batch-1.yaml`.
Alguns tocam arquivos originalmente da W2.1 — o próprio gate (QA-W2B1-02) recomendou
resolver a persistência do skill run cruzando a costura W2.1/W2.2; ownership ampliado
para esta recuperação:

- `apps/academia-lendaria-ads-studio/server/jobs/supabase-skill-job-store.ts` (MODIFY — guard atômico de `startRetry`, QA-W2B1-01)
- `apps/academia-lendaria-ads-studio/server/jobs/supabase-skill-job-store.test.ts` (ADD — regressão do guard de retry)
- `apps/academia-lendaria-ads-studio/server/local-runner-security.ts` (MODIFY — allowlist de env do Codex, QA-W2B1-04; `resolveTenantWorkspaceId`/`WorkspaceMismatchError`, QA-W2B1-03)
- `apps/academia-lendaria-ads-studio/server/app.ts` (MODIFY — `resolveWorkspaceId` derivado do projeto + rejeição de mismatch, QA-W2B1-03)
- `apps/academia-lendaria-ads-studio/server/__tests__/local-skill-runner.test.ts` (MODIFY — allowlist de env, tenant e endpoint de mismatch)
- `apps/academia-lendaria-ads-studio/src/lib/project-repository.ts` (MODIFY — `skillHash` no `UpdateSkillRunInput`/`skillRunUpdate`, QA-W2B1-02) — *W2.1 seam*
- `apps/academia-lendaria-ads-studio/src/stores/project-store.ts` (MODIFY — `upsertSkillRun` no cache, QA-W2B1-02) — *W2.1 seam*
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.ts` (MODIFY — `persistSkillRunStart`/`persistSkillRunUpdate` no controller/hook, QA-W2B1-02) — *W2.1 seam*
- `apps/academia-lendaria-ads-studio/src/hooks/use-project-workspace.test.ts` (MODIFY — round-trip real-mode do skill run) — *W2.1 seam*
- `apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.tsx` (MODIFY — actions do skill run no contexto + `useOptionalProjectWorkspaceActions` + `ProjectWorkspaceActionsProvider`, QA-W2B1-02) — *W2.1 seam*
- `apps/academia-lendaria-ads-studio/src/components/project-hydration-boundary.test.tsx` (MODIFY — fixture do mock do hook) — *W2.1 seam*
- `apps/academia-lendaria-ads-studio/src/components/project-journey.tsx` (MODIFY — persistência durável do run + compensação + guard in-flight de retry, QA-W2B1-01/02)
- `apps/academia-lendaria-ads-studio/src/components/project-journey.test.tsx` (MODIFY — guard in-flight + round-trip real-mode)

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

### Recuperação de quality gate (QA batch 1)

Gate `.aiox/waves/epic-8-wave-2/qa-batch-1.yaml` retornou **BLOCK** com 2 P2 + 2 P3.
Correção end-to-end (sem tocar o design visual), executor **@dev** em worktree isolada:

- **QA-W2B1-01 (P2 — retry double-submit / duplicação de Codex).** `startRetry` do
  adapter Supabase virou um **compare-and-swap de estado terminal**: o UPDATE carrega
  `.in('status', ['succeeded','failed','cancelled'])` (mesma forma de `cancel()`/`claim()`),
  então dois retries concorrentes que leem o job ainda terminal produzem exatamente UM
  vencedor (agenda 1 run) — o perdedor bate em zero linhas, devolve `undefined` e o
  endpoint responde 409 sem despachar um segundo filho. Teste de regressão novo
  (`supabase-skill-job-store.test.ts`) com fake fiel do cliente Supabase provando o guard.
  Defense-in-depth na UI: `ProjectJourney.retryRun` ganhou **guard in-flight duro**
  (`retryInFlightRef`, síncrono contra double-click) + botão Repetir desabilitado durante o
  retry — dois cliques emitem só um POST.
- **QA-W2B1-02 (P2 — AC6 retomada após reload não entregue em modo real).** O skill run
  passa a ter um **pointer durável no `skill_runs` via `ProjectRepository`**, reusando o
  `ProjectWorkspaceController`/`ProjectHydrationBoundary`: `persistSkillRunStart`
  (status `running`, `input_snapshot` com o `jobId`) após o 202, e `persistSkillRunUpdate`
  para cada transição relevante (needs_review com proposta + `skillHash` real, failed/
  cancelled, retry running). O cache Zustand só recebe o run via `upsertSkillRun` **após**
  sucesso do repository (id autoritativo do banco). Modo demo permanece local; os testes
  que renderizam `ProjectJourney` fora da boundary continuam via um **seam opcional**
  (`useOptionalProjectWorkspaceActions` → `null` → cache), sem enfraquecer a persistência
  real. **Compensação (saga):** se o job de backend já é durável mas a criação do pointer
  de domínio falha, a UI cancela o job de backend e mostra erro acionável — sem órfão
  rodando. `UpdateSkillRunInput`/`skillRunUpdate` estendidos com `skillHash`. Round-trip
  real provado num store/controller novo (jobId, status terminal, proposta e skillHash) +
  persistência/reattach no nível do `ProjectJourney`.
- **QA-W2B1-03 (P3 — confiança no workspace do cliente).** `resolveWorkspaceId` (app.ts)
  agora **deriva o workspace do projeto** e delega a `resolveTenantWorkspaceId`: um
  `workspace_id` do cliente divergente do derivado é **rejeitado (400)** antes de qualquer
  escrita service-role; sem DB (fallback dev, sem writer service-role) mantém o
  comportamento anterior. Derivação injetável (`deriveProjectWorkspaceId`) para teste de
  endpoint + teste unitário do decisor puro.
- **QA-W2B1-04 (P3 — env leak herdado).** `sanitizeCodexEnv` trocou a **denylist de 2
  chaves** por uma **allowlist operacional mínima** (PATH/HOME, locale via prefixo `LC_`,
  temporários, `CODEX_HOME`/XDG; escape hatch `CODEX_ENV_ALLOWLIST` para o operador). O
  filho Codex não herda mais `SUPABASE_SERVICE_ROLE_KEY`, `LOCAL_SKILL_RUNNER_TOKEN`,
  `APIFY_TOKEN`, chaves OpenAI/Codex nem segredos arbitrários — testes provam o corte.

**Gates re-executados (worktree, verdes):** `npm test` (25 arquivos / 176 testes) ·
`npm run lint` · `npm run typecheck` · `npm run build` · `npm run build:server` ·
`npm run lint:db` · `npm run test:db` (Files=3, Tests=15) · `git diff --check` limpo.

### Riscos residuais (recuperação)

- **Decisão de revisão (`approveProposal`/`rejectProposal`) segue cache-only.** A transição
  done/cancelled da revisão humana e a materialização de artefatos aprovados são escopo da
  **STORY-8.W2.3** (aprovação de artefato em duas fases); persistir só o status do run aqui
  criaria inconsistência com os artefatos não persistidos. Após reload pós-aprovação o run
  ainda aparece como `needs_review` até a W2.3 fechar essa costura.
- **`resolveTenantWorkspaceId` no fallback sem DB** ainda confia no `provided` — aceitável
  porque nesse caminho não há writer service-role (RLS-bypassing) a proteger; a proteção
  real vale exatamente onde o Supabase backend existe.

## QA Gate Final

- **Veredito:** SHIP no re-gate independente de `602f44c`; nenhum P0, P1 ou P2 remanescente.
- **Achados fechados:** retry concorrente com CAS + 409 para o perdedor; pointer durável do
  `skill_run` em modo real; retomada após nova hidratação; compensação de job órfão; tenant
  derivado e fail-closed; allowlist do ambiente do Codex CLI.
- **Evidência:** `npm test` (25 arquivos / 176 testes), lint, typecheck, app build, server build,
  DB lint, pgTAP (3 arquivos / 15 testes) e `git diff --check` verdes.
- **Próxima costura:** aprovação/rejeição e materialização persistentes pertencem à 8.W2.3.

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
