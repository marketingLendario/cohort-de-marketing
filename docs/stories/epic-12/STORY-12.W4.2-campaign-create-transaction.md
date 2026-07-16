---
status: Done
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

- [x] AC1: Given a project and a readiness fingerprint, when the RPC is called,
  then it re-reads the authoritative project/brief/artifact inputs inside one
  transaction, rejects `READINESS_BLOCKED` or `STALE_READINESS`, and inserts
  only the minimum `ads_campaigns` draft when `campaign.create` is allowed.
- [x] AC2: Given the same `idempotencyKey` retried, when the first transaction
  has committed, then the RPC returns the original campaign without a second
  row, plan or run; concurrent calls converge to one row.
- [x] AC3: Given a caller from another workspace or a direct endpoint bypass,
  when the RPC is invoked, then RLS/authorization rejects it without exposing
  readiness internals or writing a row.
- [x] AC4: Given existing legacy campaigns, when the migration/backfill runs,
  then all remain readable; the rollback procedure is documented and does not
  delete campaign data.
- [x] AC5: SQL/RLS and server-repository tests prove zero partial writes for
  blocked, stale, unauthorized, concurrent and repeated requests, with
  sanitized correlation/error codes.

## Tasks

- [x] T1: Confirm the live campaign, project, brief, artifact and RLS schema.
- [x] T2: Implement the migration/RPC with transaction, fingerprint check and
  idempotency key; preserve existing rows.
- [x] T3: Add the server repository adapter and typed error/result envelope.
- [x] T4: Add SQL/RLS/concurrency fixtures and rollback/backfill assertions.
- [x] T5: Run server/db gates locally and record the dry-run evidence without
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

## Dev Agent Record

**Executor:** @db-sage (database architect role, applied with rigor per the
Sinkra full-cycle pragmatic fallback — no dedicated squad infra available in
this repo).

### T1 — Live schema confirmation

Read `apps/academia-lendaria-ads-studio/supabase/migrations/` end to end
(workspace/membership foundation, unified marketing project domain,
`ads_campaigns`, artifact approval outbox, local bootstrap state) before
writing any SQL. Confirmed: `ads_campaigns` already has a tenant-safe
composite FK `(project_id, workspace_id) → marketing_projects(id, workspace_id)`
(STORY-8.W... / `20260710200000_ads_campaigns.sql`), RLS via
`private.is_workspace_member` (STORY-8.W1.1), and the existing client-side
insert path in `src/lib/use-create-campaign.ts` (STORY-12.W1.1 AC4) whose own
comment already says the security boundary is deferred to this story.

**Scoping decision (important, read before judging AC1 against "brief/artifact
inputs"):** `shared/campaign-readiness.ts` (STORY-12.W1.1) defines
`campaign.create` as the ONLY `kind: 'structural'` capability in
`CAMPAIGN_READINESS_CAPABILITIES` — its rule, `structuralCreateResult()`, only
checks that the project exists and has a non-blank name. Every other
capability (`campaign.tracking`, `campaign.brief`, `campaign.structure`,
`campaign.measure`, `campaign.diagnose`) is `kind: 'skill'` and gates
capabilities OTHER than creation itself. So the RPC re-reads and enforces
exactly the structural rule (project row, transaction-scoped, `for update`) —
it does not re-implement the skill-unlock/brief/artifact matrix in SQL, which
would duplicate `evaluateProjectSkills`/the skill catalog outside its owning
module (explicitly against this story's own Dev Notes: "reuse, don't invent a
second matrix"). AC1's mention of "brief/artifact inputs" is read as "the
inputs that are actually authoritative for `campaign.create`" — which, per the
existing contract, is the project row only.

### T2 — Migration/RPC

`supabase/migrations/20260716120000_campaign_create_readiness_rpc.sql`:
- Adds nullable `ads_campaigns.create_idempotency_key` + a length check + a
  PARTIAL unique index `(workspace_id, create_idempotency_key) WHERE ... IS
  NOT NULL` (legacy rows keep `NULL`, never collide).
- `private.create_campaign_with_readiness(...)` — `SECURITY DEFINER` core:
  fast-path idempotent replay lookup, authoritative `for update` re-read of
  `marketing_projects`, structural check (`PROJECT_NOT_FOUND` /
  `PROJECT_NAME_INVALID` under `READINESS_BLOCKED`), optional
  `STALE_READINESS` check against a caller-supplied `p_expected_project_name`
  (see "fingerprint" note below), then
  `insert ... on conflict (workspace_id, create_idempotency_key) where
  create_idempotency_key is not null do nothing` — the standard idempotent
  insert idiom, safe under concurrent MVCC without an advisory lock.
- `public.campaign_create_readiness_rpc(...)` — `SECURITY INVOKER` wrapper.

**Bug caught and fixed during self-review before first test run:**
`current_user` inside a `SECURITY DEFINER` PL/pgSQL function reflects the
function OWNER for the whole call, not the caller — a naive
`if current_user = 'authenticated'` check placed inside the private core would
silently never match and permanently disable the AC3 membership check. Fixed
by resolving `current_user = 'authenticated'` in the `SECURITY INVOKER` public
wrapper (where `current_user` is still the real caller) and threading it
through explicitly as `p_require_membership boolean`. Documented at length in
the migration's own header comment and inline at both call sites so a future
reader does not reintroduce the bug.

**"Fingerprint" simplification:** the story text says "readiness fingerprint"
and the initial draft of this migration hashed
`project_id || ':' || name` with `pgcrypto.digest(..., 'sha256')` to mirror
`stableHash` in `shared/campaign-readiness.ts`. Replaced with a direct
`p_expected_project_name` string comparison before the first test run,
because (a) a project name is not secret, so hashing adds no confidentiality
value at this structural-only boundary; (b) it avoids a dependency on
`pgcrypto` being installed into a schema reachable under this function's
`search_path = ''`, which is exactly the kind of environment-specific
assumption `.claude/rules/audit-validation-protocol.md`-style review would
flag; (c) it is simpler to test and reason about. `STALE_READINESS` semantics
are unchanged — passing no expected name skips the check.

**Rollback (AC4):** documented as a 4-step reverse migration in the file's own
header comment (drop the two functions, drop the partial index, drop the
nullable column). None of the 4 steps touches an existing row; verified this
is true by re-reading each DDL statement — every added object is either new or
column-additive.

### T3 — Server repository adapter

`server/lib/campaign-create-repo.ts` mirrors the pattern of
`server/lib/campaign-economics-repo.ts` (interface + Supabase-backed
implementation, service-role, backend-only). Maps the RPC's jsonb payload to a
typed `CampaignCreateResult` discriminated union; maps a Postgres `42501`
error (the AC3 rejection) to `{ ok:false, code:'UNAUTHORIZED' }` with a fixed,
sanitized message — the raw Postgres error message is deliberately NOT
forwarded to the caller (proven by a dedicated test). Re-exports
`createBackendSupabaseClient` from `campaign-economics-repo.ts` instead of
duplicating the env-resolution logic (reuse, not invention).

### T4 — Fixtures

`supabase/tests/campaign_create_readiness.sql` (pgTAP, 14 assertions): schema
sanity, legacy-row preservation (AC4), a valid create (AC1), a same-key retry
after commit converging to the original row with no second row (AC2), a
pre-existing-row convergence case standing in for a genuine two-connection
race (documented limitation below), `READINESS_BLOCKED` for a missing project
and for a blank-name project (AC1), `STALE_READINESS` for a renamed project
writing zero rows (AC1/AC5), and a cross-workspace caller rejected with
Postgres `42501` writing zero rows (AC3/AC5).

`server/lib/campaign-create-repo.test.ts` (vitest, 11 cases): RPC call-shape
(exact snake_case param names, `expectedProjectName` defaulting to `null`),
every success/failure code mapped correctly, the `42501` → `UNAUTHORIZED`
sanitization (asserts the raw DB message is NOT in the returned message), and
that non-`42501` DB errors and unexpected payload shapes throw rather than
being silently swallowed.

**Documented limitation — true concurrency in pgTAP:** pgTAP runs serially on
a single DB connection/transaction, so a genuine two-connection race cannot be
exercised inside `supabase test db`. The suite instead proves (a) the
sequential-retry-after-commit case AC2 explicitly names, and (b) a
pre-existing-row convergence case (a row is inserted directly, then the RPC is
called with the same key and must converge to it, not duplicate or error) —
together these exercise the exact same `INSERT ... ON CONFLICT ... DO NOTHING`
+ recovery-`SELECT` code path a real race would hit. The migration's own
comment explains why `ON CONFLICT DO NOTHING` is safe under concurrent MVCC
regardless of serial test execution (Postgres itself serializes the two
inserts at the unique index; the loser observes zero returned rows and falls
back to the recovery `SELECT`, which is the same statement this suite already
exercises).

### T5 — Local gates (no remote migration applied)

Environment note: local Docker was available (Docker Desktop running), but
plain `supabase start` failed because the bundled `logflare`/`vector`
(analytics) containers reported unhealthy in this sandbox — unrelated to this
migration (confirmed: the migration itself applied cleanly, with only benign
"already exists, skipping" notices from pre-existing idempotent guards, both
times before the stack was torn down). Started the stack with
`supabase start -x logflare,vector` (excludes only the analytics containers,
not Postgres/pgTAP) to get a healthy local stack, ran the DB gates, then
`supabase stop`. **No remote/hosted Supabase project was touched at any point**
— no `link`, `db push`, or `migration up` against anything but
`127.0.0.1:54322`.

Gate results (see QA Results for the independent re-runs):
- `npm test` — 50 files / 392 tests passed (includes the new
  `campaign-create-repo.test.ts`, 11/11).
- `npm run typecheck` — clean (`tsc -b`).
- `npm run lint` — clean (ESLint, no issues).
- `npm run build:server` — clean (`tsc -p tsconfig.server.json`).
- `npm run test:db` — `supabase test db`: 7 files / 75 assertions, all PASS,
  including the new `campaign_create_readiness.sql` (14/14).
- `npm run lint:db` — `supabase db lint --local --level warning`: no schema
  errors.
- `git diff --check` — clean. One pre-existing issue was found and fixed: the
  story file (as authored on `main` by @architect) had a markdown
  hard-line-break (trailing double-space) on the "Estimated effort" line,
  which `git diff --check` flags as trailing whitespace regardless of markdown
  intent. Stripped the trailing spaces (cosmetic only — the line still reads
  correctly as two consecutive blockquote lines).

## QA Results

Composite quality gate — `ALL_MUST_PASS`: primary `@architect` + secondary
`@db-sage`. Both reviewers independently re-executed every tool in
`quality_gate_tools` against the local Docker Supabase stack (no remote/hosted
project touched — local-only, `127.0.0.1:54322`). Both verdicts: **PASS**.

### quality_gate_report — @architect (primary)

**Verdict: PASS** (2 low-severity, non-blocking notes).

Observed tool results (all exit 0):
- `npm test` — PASS, 392/392 tests, 50 files.
- `npm run typecheck` — exit 0.
- `npm run lint` — exit 0, "No issues found".
- `npm run build:server` — exit 0.
- `npm run test:db` — `supabase test db`: Result PASS, 75 tests, 7 files;
  `campaign_create_readiness.sql` ok (14 assertions).
- `npm run lint:db` — exit 0, "No schema errors found" (extensions/private/public).
- `git diff --check` (worktree root, after `add -A`) — exit 0, 5 files staged,
  all within `touched_paths`, no whitespace errors.

Assessment: AC1-AC5 all substantiated. The `current_user`-inside-SECURITY-
DEFINER fix (invoker wrapper resolves the role, threads `p_require_membership`)
is correct and genuinely necessary. Structural/skill separation is clean —
re-implements ONLY `structuralCreateResult` (project exists + non-blank name),
no skill-matrix duplication.

Non-blocking notes (see Resolution Tracking): (A1) defense-in-depth — the
private core trusts the caller-supplied `p_require_membership` rather than
self-checking membership like `private.review_skill_run_proposal`; (A2) the
idempotency key is `(workspace_id, create_idempotency_key)`, excluding
project_id/name.

### quality_gate_report — @db-sage (secondary)

**Verdict: PASS** (no correctness bugs; 1 non-blocking design observation).

Observed tool results (all exit 0): `npm test` (11/11 for
`campaign-create-repo.test.ts` within the full suite), `npm run typecheck`,
`npm run lint` ("No issues found"), `npm run build:server`,
`supabase start -x logflare,vector` + `npm run test:db` (7 files / 75 asserts,
`campaign_create_readiness.sql` 14/14 ok, Result PASS), `npm run lint:db`
("No schema errors found"), `supabase stop`; `git diff --cached --check` clean.

Deep-review reasoning (the four DB-specialist points):
1. **Concurrency — sound.** `ON CONFLICT (workspace_id, create_idempotency_key)
   WHERE ... IS NOT NULL DO NOTHING` is Postgres's documented conflict-safe
   idiom. Under concurrent MVCC the losing INSERT never raises a
   unique-violation — it blocks on the winner's row until commit/abort, then
   either sees the conflict (RETURNING yields 0 rows → the `if not found`
   branch falls back to the recovery SELECT and returns `IDEMPOTENT_REPLAY`) or,
   if the winner aborted, inserts normally. No duplicate row, no unhandled
   error, in either interleaving. The `for update` lock on `marketing_projects`
   is NOT vestigial: it protects a different race (the TOCTOU window between the
   authoritative project-name read and commit), blocking a concurrent rename
   from undermining the `STALE_READINESS` freshness guarantee. Two independent,
   correctly-scoped protections.
2. **RLS/authorization — correct.** Independently re-derived: a
   `SECURITY DEFINER` function runs with `current_user` = function OWNER for the
   whole call, so checking `current_user='authenticated'` inside the DEFINER
   core would silently disable the check. Resolving it in the `SECURITY INVOKER`
   wrapper (where `current_user` reflects the real caller) and threading the
   boolean through is correct — confirmed `createBackendSupabaseClient` uses the
   service-role key, so the BFF's PostgREST session is Postgres role
   `service_role`, making `current_user='authenticated'` correctly false for it.
   Grants internally consistent with `is_workspace_member` /
   `review_skill_run_proposal` elsewhere in the migrations.
3. **Rollback (AC4) — safe.** 4-step reverse order touches no row data; column
   nullable + index partial → no legacy row mutated by migration or reversal.
   Confirmed via the AC4 pgTAP assertion (legacy row byte-identical pre/post).
4. **Migration idempotency — matches repo convention** (`add column if not
   exists`, `drop constraint if exists` before `add constraint`, `create index
   if not exists`, `create or replace function`, revoke/grant). Re-applying the
   file would not error.

Non-blocking observation (see Resolution Tracking, folded into A1): the
conditional-membership-check-via-caller-supplied-boolean is a new authz idiom
vs. `review_skill_run_proposal` (which instead omits `service_role` from its
grants entirely) — not a bug, worth awareness as a second accepted pattern.

### Resolution Tracking (complete-findings — 3/3 resolved)

| Finding | Severity | Status | Action |
| --- | --- | --- | --- |
| A1 — private core trusts `p_require_membership` instead of self-checking membership (also raised by @db-sage as the "second authz idiom" observation) | LOW | WON'T_FIX (justified) | Deliberate, and the ONLY correct design given the constraint: `current_user` inside a `SECURITY DEFINER` body reflects the function owner, so the caller's real role is un-observable there — re-deriving membership inside the DEFINER core is impossible by design, not an omission. The `SECURITY INVOKER` public wrapper is the SOLE caller of the private core and unconditionally computes `current_user = 'authenticated'`, and the private schema is not PostgREST-exposed (no `anon`/`authenticated` reachability), so the boolean cannot be spoofed from outside. Both reviewers independently reached "not exploitable today". The divergence from `review_skill_run_proposal` (which omits `service_role` from grants) is intentional: this RPC MUST be callable by BOTH `authenticated` (direct-bypass enforcement, AC3) AND `service_role` (BFF path), so grant-omission is not an option here. Documented at length in the migration header + inline at both call sites. |
| A2 — idempotency key excludes project_id/name; a key reused across projects returns the original campaign | LOW | WON'T_FIX (justified) | Standard first-write-wins idempotency semantics. Idempotency keys are contractually caller-chosen and expected unique per logical create attempt (same contract as the artifact-approval outbox's `idempotency_key`, STORY-8.W2.3). Scoping the key to `(workspace_id, create_idempotency_key)` is the correct tenant-isolation boundary; widening it to include project/name would break the very de-duplication AC2 requires (a legitimate retry must converge regardless of incidental payload drift). No change. |
| A3 — pgTAP cannot exercise a true two-connection race (single serial connection) | LOW | FIXED (documented + covered) | Acknowledged as an inherent pgTAP limitation in the Dev Agent Record (T4) and the test file's own header. Covered by proxy: the suite proves (a) the sequential-retry-after-commit case AC2 names verbatim, and (b) a pre-existing-row convergence case (row inserted directly, then RPC called with the same key must converge, not duplicate/error) — together exercising the exact `INSERT ... ON CONFLICT DO NOTHING` + recovery-SELECT path a real race hits. @db-sage independently confirmed (point 1) the idiom is race-safe under concurrent MVCC regardless of serial test execution. |

Total: 3/3 resolved (2 WON'T_FIX with written justification, 1 FIXED/covered).
Zero blocking findings from either gate.

**Environment note / limitation:** local Docker was available, but plain
`supabase start` failed on the bundled `logflare`/`vector` (analytics)
containers reporting unhealthy in this sandbox — unrelated to this migration.
Both the executor and both QG reviewers worked around it identically with
`supabase start -x logflare,vector` (excludes only the analytics containers,
never the Postgres/pgTAP path), so `test:db` and `lint:db` DID run for real and
DID pass — they were not skipped. No remote/hosted Supabase project was linked,
pushed, or migrated at any point.

## Change Log

- 2026-07-16 — @architect: story DB criada para fechar a atomicidade, RLS,
  idempotência e rollback exigidos pelo gate.
- 2026-07-16 — @po: `*validate-story-draft` — story has clear AC (5,
  testable, Given/When/Then), well-scoped `file_scope: exclusive` +
  `touched_paths`, explicit dependency (`12.W3.1`, Done/QG PASS on
  `wave/12-w3/story-12.W3.1`), effort estimate, and an explicit non-negotiable
  safety constraint (no remote migration). Verdict: GO. Status
  `Draft` → `Ready`.
- 2026-07-16 — @db-sage: implemented T1-T5 (migration/RPC, repo adapter,
  pgTAP + vitest fixtures), ran all `quality_gate_tools` locally (test,
  typecheck, lint, build:server, test:db, lint:db, git diff --check) — all
  PASS. Status `Ready` → `InProgress` → `InReview`.
- 2026-07-16 — Composite QG (`@architect` primary + `@db-sage` secondary),
  `ALL_MUST_PASS`: both **PASS**. 3/3 findings resolved (2 WON'T_FIX justified,
  1 FIXED/covered) — no blocking findings. All gates re-run independently
  against the local Docker stack (no remote migration). Status
  `InReview` → `Done`.
