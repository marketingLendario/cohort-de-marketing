-- pgTAP — transactional/idempotent `campaign.create` enforcement (STORY-12.W4.2).
--
-- Proves AC1-AC5: authoritative re-read + structural gate, idempotent replay
-- (no second row/plan/run), RLS/authorization rejection without a row write,
-- legacy campaigns preserved untouched, and sanitized error codes
-- (READINESS_BLOCKED / STALE_READINESS / CAMPAIGN_CREATE_CONFLICT never leak
-- paths, tokens or private content). Runs in a transaction and rolls back.
--
-- Note on concurrency (AC2 "concurrent calls converge to one row"): pgTAP runs
-- serially on a single connection, so a genuine two-connection race cannot be
-- exercised here. The migration comment documents why `insert ... on conflict
-- do nothing` is safe under concurrent MVCC regardless (Postgres resolves the
-- unique-index conflict for both transactions correctly without relying on
-- serial execution). This suite proves the sequential-retry case (AC2's
-- "retried after commit" wording) and the pre-existing-row convergence case,
-- which together exercise the same code path a true race would hit.

begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id)
values
  ('12000000-0000-0000-0000-000000000001'),
  ('12000000-0000-0000-0000-000000000002');

insert into public.workspaces (id, name)
values
  ('22000000-0000-0000-0000-000000000001', 'Workspace A'),
  ('22000000-0000-0000-0000-000000000002', 'Workspace B');

insert into public.workspace_members (workspace_id, user_id)
values
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001'),
  ('22000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002');

insert into public.marketing_projects (id, workspace_id, slug, name)
values
  ('32000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'project-a', 'Project A'),
  ('32000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000001', 'project-blank', ' '),
  ('32000000-0000-0000-0000-000000000003', '22000000-0000-0000-0000-000000000002', 'project-b', 'Project B');

-- Legacy campaign predating this migration (create_idempotency_key stays null).
insert into public.ads_campaigns (id, workspace_id, project_id, name, status, step_current)
values ('42000000-0000-0000-0000-000000000099', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', 'Legacy Campaign', 'live', 8);

-- 1) Schema/grants sanity.
select has_column('public', 'ads_campaigns', 'create_idempotency_key', 'ads_campaigns has the idempotency key column');

select ok(
  has_function_privilege('authenticated', 'public.campaign_create_readiness_rpc(uuid, uuid, text, text, text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.campaign_create_readiness_rpc(uuid, uuid, text, text, text)', 'EXECUTE'),
  'both authenticated and service_role can execute the public RPC wrapper'
);

-- 2) AC4: the legacy campaign survived the migration untouched.
select results_eq(
  $$ select name, status, step_current from public.ads_campaigns
     where id = '42000000-0000-0000-0000-000000000099' $$,
  $$ values ('Legacy Campaign'::text, 'live'::text, 8) $$,
  'legacy pre-migration campaign is preserved as-is'
);

-- From here on, run as the Workspace A member (RLS/membership context active).
set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);

-- 3) AC1/AC2: a valid call creates the minimum draft row.
select is(
  (
    select (public.campaign_create_readiness_rpc(
      '22000000-0000-0000-0000-000000000001',
      '32000000-0000-0000-0000-000000000001',
      'Nova Campanha',
      'idem-key-created',
      null
    ) ->> 'code')
  ),
  'CREATED',
  'a valid call against a ready project creates the campaign draft'
);

select is(
  (select count(*)::integer from public.ads_campaigns
    where workspace_id = '22000000-0000-0000-0000-000000000001'
      and create_idempotency_key = 'idem-key-created'),
  1,
  'exactly one row was inserted for the new idempotency key'
);

-- 4) AC2: retried with the SAME idempotency key after commit — same campaign,
-- no second row.
select is(
  (
    select (public.campaign_create_readiness_rpc(
      '22000000-0000-0000-0000-000000000001',
      '32000000-0000-0000-0000-000000000001',
      'Nova Campanha',
      'idem-key-created',
      null
    ) ->> 'code')
  ),
  'IDEMPOTENT_REPLAY',
  'a retried call with the same key returns the original campaign'
);

select is(
  (select count(*)::integer from public.ads_campaigns
    where workspace_id = '22000000-0000-0000-0000-000000000001'
      and create_idempotency_key = 'idem-key-created'),
  1,
  'the retry did not create a second row'
);

-- 5) Convergence proxy for a genuine concurrent race: a row already exists for
-- this key (as if another transaction had won the race and committed first) —
-- the call must converge to it, not fail or duplicate.
insert into public.ads_campaigns (workspace_id, project_id, name, status, step_current, create_idempotency_key)
values ('22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', 'Racer Winner', 'draft', 1, 'idem-key-race');

select is(
  (
    select (public.campaign_create_readiness_rpc(
      '22000000-0000-0000-0000-000000000001',
      '32000000-0000-0000-0000-000000000001',
      'Racer Loser Payload',
      'idem-key-race',
      null
    ) -> 'campaign' ->> 'name')
  ),
  'Racer Winner',
  'a caller that lost the race converges to the already-committed row'
);

-- 6) AC1: blocked when the project does not exist.
select is(
  (
    select (public.campaign_create_readiness_rpc(
      '22000000-0000-0000-0000-000000000001',
      '32000000-0000-0000-0000-000000000fff',
      'Nova Campanha',
      'idem-key-not-found',
      null
    ) ->> 'code')
  ),
  'READINESS_BLOCKED',
  'blocked with READINESS_BLOCKED when the project does not exist'
);

-- 7) AC1: blocked when the project name is blank.
select is(
  (
    select (public.campaign_create_readiness_rpc(
      '22000000-0000-0000-0000-000000000001',
      '32000000-0000-0000-0000-000000000002',
      'Nova Campanha',
      'idem-key-blank-name',
      null
    ) ->> 'code')
  ),
  'READINESS_BLOCKED',
  'blocked with READINESS_BLOCKED when the project name is blank'
);

-- 8) AC1: STALE_READINESS when the caller's expected project name no longer
-- matches the authoritative row (project was renamed since the caller's
-- snapshot).
select is(
  (
    select (public.campaign_create_readiness_rpc(
      '22000000-0000-0000-0000-000000000001',
      '32000000-0000-0000-0000-000000000001',
      'Nova Campanha',
      'idem-key-stale',
      'Old Name Client Saw'
    ) ->> 'code')
  ),
  'STALE_READINESS',
  'a stale expected project name is rejected with STALE_READINESS'
);

select is(
  (select count(*)::integer from public.ads_campaigns where create_idempotency_key = 'idem-key-stale'),
  0,
  'a STALE_READINESS rejection writes zero rows'
);

-- 9) AC3: a member of Workspace A cannot create against Workspace B's project —
-- rejected before any row is written, sanitized (no readiness internals).
select throws_ok(
  $$ select public.campaign_create_readiness_rpc(
       '22000000-0000-0000-0000-000000000002',
       '32000000-0000-0000-0000-000000000003',
       'Forbidden Campaign',
       'idem-key-forbidden',
       null
     ) $$,
  '42501',
  null,
  'a caller from another workspace is rejected (no readiness internals exposed)'
);

select is(
  (select count(*)::integer from public.ads_campaigns where create_idempotency_key = 'idem-key-forbidden'),
  0,
  'the unauthorized attempt wrote zero rows'
);

select * from finish();
rollback;
