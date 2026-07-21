---
status: Draft
story_id: "12.W4.2"
title: "Criação transacional e idempotente de campanha"
epic: 12
wave: "W4"
parent_epic: "docs/stories/epic-12/EPIC-12-CAMPAIGNS-READINESS-GATE.md"
deploy_type: none
effort: "2h"
hill_phase: figuring_out
appetite: "5d"
confidence_level: high-risk
task_mode: EXECUTAR
entity_input:
  entity_type: campaign-create-transaction
  status_expected: draft
entity_output:
  entity_type: campaign-create-transaction
  status_expected: ready
involves_ui: false
executor: "@db-sage"
quality_gate: "@architect"
secondary_quality_gate: "@db-sage"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "npm --prefix apps/academia-lendaria-ads-studio run test:db", "npm --prefix apps/academia-lendaria-ads-studio run lint:db", "git diff --check"]
accountable: "Pedro Valério"
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
depends_on: ["12.W3.1"]
consumes_artifacts_of: ["12.W1.1", "12.W3.1"]
file_scope: exclusive
touched_paths:
  - "apps/academia-lendaria-ads-studio/supabase/migrations/20260716120000_campaign_create_readiness_rpc.sql"
  - "apps/academia-lendaria-ads-studio/supabase/tests/campaign_create_readiness.sql"
  - "apps/academia-lendaria-ads-studio/server/lib/campaign-create-repo.ts"
  - "apps/academia-lendaria-ads-studio/server/lib/campaign-create-repo.test.ts"
  - "docs/stories/epic-12/STORY-12.W4.2-campaign-create-transaction.md"
---

> **Estimated effort:** 2h  
> **Depends on:** 12.W3.1

# STORY-12.W4.2 — Criação transacional e idempotente de campanha

## User Story

**As an operator**, **I want** the server to enforce readiness and create a
campaign in one transaction, **so that** a client bypass, race or retry cannot
leave a partial or duplicated campaign.

## Story

**As an operator**, **I want** the server to enforce readiness and create a
campaign in one transaction, **so that** a client bypass, race or retry cannot
leave a partial or duplicated campaign.

## Executor Assignment

```yaml
executor: "@db-sage"
quality_gate: "@architect"
secondary_quality_gate: "@db-sage"
quality_gate_tools: ["npm --prefix apps/academia-lendaria-ads-studio test", "npm --prefix apps/academia-lendaria-ads-studio run typecheck", "npm --prefix apps/academia-lendaria-ads-studio run lint", "npm --prefix apps/academia-lendaria-ads-studio run build:server", "npm --prefix apps/academia-lendaria-ads-studio run test:db", "npm --prefix apps/academia-lendaria-ads-studio run lint:db", "git diff --check"]
repo_target: "/Users/rafaelcosta/Projects/cohort-de-marketing"
```

## Acceptance Criteria

- [ ] AC1: Given a project and a readiness fingerprint, when the RPC is called,
  then it re-reads the authoritative project/brief/artifact inputs inside one
  transaction, rejects `READINESS_BLOCKED` or `STALE_READINESS`, and inserts
  only the minimum `ads_campaigns` draft when `campaign.create` is allowed.
- [ ] AC2: Given the same `idempotencyKey` retried, when the first transaction
  has committed, then the RPC returns the original campaign without a second
  row, plan or run; concurrent calls converge to one row.
- [ ] AC3: Given a caller from another workspace or a direct endpoint bypass,
  when the RPC is invoked, then RLS/authorization rejects it without exposing
  readiness internals or writing a row.
- [ ] AC4: Given existing legacy campaigns, when the migration/backfill runs,
  then all remain readable; the rollback procedure is documented and does not
  delete campaign data.
- [ ] AC5: SQL/RLS and server-repository tests prove zero partial writes for
  blocked, stale, unauthorized, concurrent and repeated requests, with
  sanitized correlation/error codes.

## Tasks

- [ ] T1: Confirm the live campaign, project, brief, artifact and RLS schema.
- [ ] T2: Implement the migration/RPC with transaction, fingerprint check and
  idempotency key; preserve existing rows.
- [ ] T3: Add the server repository adapter and typed error/result envelope.
- [ ] T4: Add SQL/RLS/concurrency fixtures and rollback/backfill assertions.
- [ ] T5: Run server/db gates locally and record the dry-run evidence without
  applying a remote migration.

## File List

- `apps/academia-lendaria-ads-studio/supabase/migrations/20260716120000_campaign_create_readiness_rpc.sql` (ADD)
- `apps/academia-lendaria-ads-studio/supabase/tests/campaign_create_readiness.sql` (ADD)
- `apps/academia-lendaria-ads-studio/server/lib/campaign-create-repo.ts` (ADD)
- `apps/academia-lendaria-ads-studio/server/lib/campaign-create-repo.test.ts` (ADD)
- `docs/stories/epic-12/STORY-12.W4.2-campaign-create-transaction.md` (MODIFY lifecycle sections)

## Dev Notes

O RPC é a fronteira server-side da decisão; o payload do browser nunca é uma
prova de prontidão. A função deve retornar códigos serializáveis
(`READINESS_BLOCKED`, `STALE_READINESS`, `CAMPAIGN_CREATE_CONFLICT`) e não
paths, tokens ou conteúdo privado. A wave executa apenas migration lint/teste
local; aplicação remota exige uma decisão operacional separada.

## Change Log

- 2026-07-16 — @architect: story DB criada para fechar a atomicidade, RLS,
  idempotência e rollback exigidos pelo gate.
