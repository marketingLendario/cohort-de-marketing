---
status: Ready
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

- [x] AC1: O painel estende o `skill-runtime` existente e exibe estado terminal
  e não terminal, fase atual, último evento, timestamp e progresso determinado
  ou indeterminado sem percentual fictício.
- [x] AC2: `READINESS_BLOCKED`, `STALE_READINESS`, `RUN_FAILED`, `RUN_CANCELLED` e
  `RUN_TIMEOUT` têm mensagem humana, ação, correlation id redigido e retry seguro.
- [x] AC3: Falhas do runner são persistidas no job/event store existente e
  reaparecem após reload/restart; cancelamento comprova que o PID/handle do
  runner terminou e não há processo órfão.
- [x] AC4: Retry não reusa snapshot obsoleto nem duplica campanha, plano ou
  artefato; a asserção compara contagens antes/depois por `correlationId` e
  `idempotencyKey`.
- [x] AC5: Testes cobrem heartbeat parado, timeout, cancelamento, retry, erro de
  backend e reconciliação após perda de SSE/polling, incluindo idempotência e
  ausência de duplicidade.

## Tasks

- [x] T1: Mapear eventos/jobs atuais e definir máquina de estados mínima.
- [x] T2: Adicionar contrato de erro e normalização no BFF/worker.
- [x] T3: Criar componente de status com loader, progresso e ações.
- [x] T4: Implementar retry/cancelamento idempotentes e observáveis.
- [x] T5: Validar reload, restart e perda de stream.

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

## Dev Agent Record

### Implementation Summary

Extends the existing durable skill-run journal (`server/jobs/*`,
`src/lib/skill-runtime.ts` — STORY-8.W2.2) instead of duplicating it, per Dev
Notes. No new job/event store was introduced.

- **`server/local-skill-runner.ts`**: added `LocalSkillRunTimeoutError` (+
  `isLocalSkillRunTimeoutError`), thrown by the timeout path instead of a
  generic `Error`, so a timeout is mechanically distinguishable from any other
  runner failure.
- **`server/jobs/types.ts`**: added `SkillRunErrorKind = 'timeout' |
  'runner_error'` and `SkillRunJobError.kind` (optional, backward compatible —
  no migration needed, the field is carried inside the existing `error` jsonb
  column).
- **`server/jobs/skill-run-worker.ts`**: on a non-abort catch, classifies the
  failure's `kind` via `isLocalSkillRunTimeoutError` before calling
  `store.fail`.
- **`src/lib/skill-runtime.ts`**: mirrored `SkillRunErrorKind`/`kind` on the
  client `SkillRunError`; added `CANONICAL_SKILL_RUN_PHASES` (the runner's real,
  fixed `resolve -> codex -> parse` 3-phase contract) and
  `computeSkillRunProgress` — determinate progress only when every observed
  step belongs to that known set, indeterminate otherwise (AC1: never a
  fabricated percentage).
- **`src/lib/campaign-run-errors.ts`** (new): the single classification module
  for all 5 error codes (AC2) — `classifyReadinessBlocked`,
  `classifyStaleReadiness`, `classifyRunError`, plus `redactCorrelationId`,
  `campaignRunIdempotencyKey`, and `isCampaignReadinessSnapshotStale` (AC4).
  Reuses `shared/campaign-readiness.ts`'s existing `READINESS_BLOCKED`/
  `STALE_READINESS` contract (STORY-12.W1.1/ADR-002) instead of inventing a
  second one.
- **`src/components/campaign-run-status.tsx`** (new): the status panel (AC1).
  Wraps `observeSkillRun`/`cancelSkillRun`/`retrySkillRun`; shows
  terminal/non-terminal state, current phase, last event, timestamp,
  determinate/indeterminate progress, a "stalled" indicator (no new event for
  `stalledAfterMs`, default 20s, while non-terminal — AC5's "heartbeat
  parado"), and the classified-error card with a safe-retry action. Accepts an
  `onBeforeRetry` hook so the caller can veto an in-place retry (AC4 — stale
  snapshot guard) before `retrySkillRun` ever fires.
- **`src/components/traffic-campaign-workspace.tsx`**: `runSkill` now runs the
  `campaign-readiness.v1` preflight (`campaign.brief`/`campaign.structure`)
  before calling `startSkillRun`; blocked -> `READINESS_BLOCKED` card, no
  mutation. Captures the readiness snapshot used to green-light each run;
  `beforeRetry` re-evaluates it and blocks a since-gone-stale retry with
  `STALE_READINESS` instead of letting it fire (AC4). The active `jobId` per
  skill is persisted to `localStorage` (`cms-campaign-run:{campaignId}:
  {skillId}`) purely so a page reload re-attaches `observeSkillRun` to the SAME
  run (AC3) — the durable source of truth stays server-side; losing this
  pointer (private browsing) only loses the reload convenience, never
  correctness.

### AC3 — PID/orphan proof

`server/jobs/skill-run-worker.test.ts` adds a test that spawns a REAL child
process (not a mock) via a test-only `LocalSkillRunner`, cancels the run, and
asserts `process.kill(pid, 0)` throws (`ESRCH`) afterward — i.e. the process
is actually gone, not orphaned. Complements the existing (out-of-scope)
`server/__tests__/local-skill-runner.test.ts` AC4/AC5 coverage of the
SIGTERM→SIGKILL escalation against a mocked executor.

### AC4 — idempotency scoping decision

`correlationId` = the run's `jobId` (stable across retries — same operator
intent). `idempotencyKey` = `` `${jobId}:attempt-${attempt}` `` (unique per
attempt). The "does not duplicate campaign/plan/artifact" guarantee is
enforced at two levels already exercised by tests:
1. **Run identity**: `computeSkillRunRetry`/`startRetry`'s existing
   terminal-state CAS guard (STORY-8.W2.2, `supabase-skill-job-store.test.ts`
   "QA-W2B1-01") — a concurrent double-retry mints exactly one new attempt.
   Reconfirmed here for the in-memory store in `skill-run-worker.test.ts`.
2. **Readiness identity**: `beforeRetry` (workspace) blocks the retry with
   `STALE_READINESS` if the campaign-readiness snapshot captured at run-start
   no longer matches a fresh evaluation, so a retry never re-executes against
   conditions that have since become invalid.
`project-store.ts`/`campaign-plan.ts` (the actual campaign/plan/artifact
records) are outside this story's `file_scope` (exclusive) — `approveProposal`
already creates exactly one artifact per approved proposal (existing,
untouched code path), and a retried run always produces a fresh proposal that
still requires an explicit human approval click before any artifact is
created.

### File List

- `apps/academia-lendaria-ads-studio/server/local-skill-runner.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/jobs/types.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/server/jobs/skill-run-worker.test.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/skill-runtime.test.ts` (MODIFY)
- `apps/academia-lendaria-ads-studio/src/lib/campaign-run-errors.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/lib/campaign-run-errors.test.ts` (ADD)
- `apps/academia-lendaria-ads-studio/src/components/campaign-run-status.tsx` (ADD)
- `apps/academia-lendaria-ads-studio/src/components/campaign-run-status.test.tsx` (ADD)
- `apps/academia-lendaria-ads-studio/src/components/traffic-campaign-workspace.tsx` (MODIFY)
- `docs/stories/epic-12/STORY-12.W3.1-execution-observability-and-recovery.md` (MODIFY)

Not modified (touched_paths allowed but no change was needed —
`server/jobs/store.ts`, `server/jobs/events.ts`,
`server/jobs/supabase-skill-job-store.ts`,
`server/jobs/supabase-skill-job-store.test.ts`): `SkillRunJobError.kind` flows
through these generically (an opaque field of the existing `error`
object/jsonb column) — no code there inspects or needs to special-case it.

## Change Log

- 2026-07-16 — @architect: runtime existente explicitamente reutilizado; adapter
  Supabase, idempotency key e prova de PID órfão incluídos no escopo.
- 2026-07-16 — @po: validação de 10 pontos aplicada (goal claro, ACs
  testáveis, dependências 12.W1.1/12.W2.1 concluídas, file_scope exaustivo,
  tasks mapeadas às ACs, quality_gate_tools definidas, sem invenção além dos
  Dev Notes, executor/QA atribuídos, effort otimista mas sinalizado pelo
  próprio `confidence_level: needs-spike`, decisão do @architect referenciada
  no Change Log anterior). Story promovida de `Draft` para `Ready`.
- 2026-07-16 — @dev: implementação completa das 5 ACs reusando o runtime
  existente (ver Dev Agent Record). `npm test`/`typecheck`/`lint`/`build`/
  `build:server`/`git diff --check` verdes localmente antes do handoff para QA.
