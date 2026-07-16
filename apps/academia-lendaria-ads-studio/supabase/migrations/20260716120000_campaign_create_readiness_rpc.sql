-- Transactional, idempotent `campaign.create` enforcement (STORY-12.W4.2 / ADR-002).
--
-- Context: `src/lib/use-create-campaign.ts` (STORY-12.W1.1 AC4) already runs the
-- `campaign-readiness.v1` preflight client-side, but the Dev Notes of that story
-- are explicit that the client preflight is NOT the security boundary — "a
-- fronteira de segurança (transação atômica + re-leitura server-side) é
-- explicitamente da 12.W4.2/12.W4". This migration is that boundary.
--
-- `campaign.create` is the only STRUCTURAL capability in
-- `shared/campaign-readiness.ts` (`CAMPAIGN_READINESS_CAPABILITIES['campaign.create']
-- .kind === 'structural'`) — its rule is `structuralCreateResult()`: the project
-- must exist and have a non-blank name. No skill/brief/artifact evaluation gates
-- campaign creation itself (those gate the OTHER capabilities: tracking, brief,
-- structure, measure, diagnose). This RPC re-implements exactly that one
-- structural rule against a fresh, transaction-scoped read of
-- `marketing_projects` — it does not duplicate the skill-unlock matrix.
--
-- Idempotency & concurrency (AC2): `ads_campaigns` gains a nullable
-- `create_idempotency_key` column with a partial unique index
-- `(workspace_id, create_idempotency_key)`. The RPC uses the standard
-- `insert ... on conflict do nothing` idiom: whichever concurrent caller commits
-- first wins the row; every other caller (immediate retry, network-retry after a
-- successful commit, or a true race) observes zero rows from its own insert and
-- falls back to reading the row the winner created, returning it unchanged
-- (`IDEMPOTENT_REPLAY`). No advisory lock is required — Postgres' unique index
-- already serializes conflicting inserts safely under concurrent MVCC.
--
-- Staleness (AC1 — `STALE_READINESS`): the caller may optionally pass
-- `p_expected_project_name`, the project name it last observed (see
-- `server/lib/campaign-create-repo.ts`). The function compares it verbatim
-- against the name on the row it just re-read (`for update`, authoritative)
-- and rejects the call with `STALE_READINESS` on a mismatch — the project was
-- renamed/emptied between the caller's snapshot and this transaction. Passing
-- `null` skips the check (the caller declares no snapshot to compare against).
-- A project name is not secret data, so no hashing is needed at this
-- structural-only boundary (`campaign.create` never looks at brief/artifact
-- content) — direct comparison is simpler and avoids relying on any hashing
-- extension being available under this function's `search_path = ''`.
--
-- Authorization (AC3): the private core checks `private.is_workspace_member`
-- (STORY-8.W1.1 helper) whenever the call arrives as `authenticated` — i.e. a
-- direct PostgREST bypass of the app's own preflight, or a caller from another
-- workspace, is rejected with `42501` before any row is touched or read, and
-- before any readiness detail is computed. Calls made as `service_role` (the
-- BFF's own backend client, `server/lib/campaign-create-repo.ts`) are trusted —
-- the same trust boundary already used by `campaign-economics-repo.ts` and the
-- artifact approval outbox (backend is the authority, NFR10).
--
-- IMPORTANT implementation note: `current_user` inside a `SECURITY DEFINER`
-- function reflects the function OWNER, not the caller, for the whole duration
-- of the call — checking it inside the private core would silently never match
-- 'authenticated' and disable the membership check entirely. The actor's real
-- role can only be observed correctly in a `SECURITY INVOKER` context, so the
-- public wrapper below (invoker) resolves `current_user = 'authenticated'`
-- itself and passes the boolean through explicitly as `p_require_membership`.
--
-- Rollback procedure (AC4 — no data loss): this migration only ADDS a nullable
-- column, a partial unique index and two new functions. To roll back:
--   1. `drop function if exists public.campaign_create_readiness_rpc(uuid, uuid, text, text, text);`
--   2. `drop function if exists private.create_campaign_with_readiness(uuid, uuid, text, text, text, boolean);`
--   3. `drop index if exists public.ads_campaigns_create_idempotency_key_uidx;`
--   4. `alter table public.ads_campaigns drop column if exists create_idempotency_key;`
-- None of these steps deletes or mutates an existing `ads_campaigns` row —
-- legacy campaigns (created before this migration, `create_idempotency_key`
-- always null) are untouched by both the migration and the rollback.

alter table public.ads_campaigns
  add column if not exists create_idempotency_key text;

alter table public.ads_campaigns
  drop constraint if exists ads_campaigns_create_idempotency_key_length_check;
alter table public.ads_campaigns
  add constraint ads_campaigns_create_idempotency_key_length_check
  check (create_idempotency_key is null or length(create_idempotency_key) between 1 and 200);

-- Partial: legacy/non-idempotent rows (null key) never collide with each other
-- or with a new idempotent create.
create unique index if not exists ads_campaigns_create_idempotency_key_uidx
  on public.ads_campaigns (workspace_id, create_idempotency_key)
  where create_idempotency_key is not null;

create or replace function private.create_campaign_with_readiness(
  p_workspace_id uuid,
  p_project_id uuid,
  p_name text,
  p_idempotency_key text,
  p_expected_project_name text,
  p_require_membership boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project record;
  v_existing record;
  v_campaign record;
  v_clean_name text;
begin
  -- AC3: reject a foreign-workspace caller or a direct endpoint bypass before
  -- touching any table. `p_require_membership` is resolved by the invoker-level
  -- wrapper (see note above `current_user` is unreliable inside this
  -- SECURITY DEFINER body) — true for an `authenticated` caller, false for the
  -- trusted `service_role` backend path.
  if p_require_membership and not (select private.is_workspace_member(p_workspace_id)) then
    raise exception 'workspace membership required to create a campaign'
      using errcode = '42501';
  end if;

  if p_idempotency_key is null or length(btrim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required' using errcode = '22023';
  end if;

  v_clean_name := btrim(coalesce(p_name, ''));
  if v_clean_name = '' then
    raise exception 'campaign name is required' using errcode = '22023';
  end if;

  -- AC2 fast path: a prior committed call with this key already exists. Return
  -- the original row untouched — no second row, no re-evaluation of readiness.
  select * into v_existing
    from public.ads_campaigns
   where workspace_id = p_workspace_id
     and create_idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'ok', true,
      'code', 'IDEMPOTENT_REPLAY',
      'campaign', jsonb_build_object(
        'id', v_existing.id,
        'workspaceId', v_existing.workspace_id,
        'projectId', v_existing.project_id,
        'name', v_existing.name,
        'status', v_existing.status,
        'stepCurrent', v_existing.step_current,
        'createdAt', v_existing.created_at
      )
    );
  end if;

  -- AC1: authoritative, transaction-scoped re-read. `for update` serializes any
  -- concurrent caller targeting the SAME project alongside the unique-index
  -- protection below.
  select id, name into v_project
    from public.marketing_projects
   where id = p_project_id
     and workspace_id = p_workspace_id
   for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'READINESS_BLOCKED',
      'message', 'Criar campanha: bloqueado por 1 pendência(s).',
      'blockingCode', 'PROJECT_NOT_FOUND'
    );
  end if;

  if v_project.name is null or length(btrim(v_project.name)) = 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'READINESS_BLOCKED',
      'message', 'Criar campanha: bloqueado por 1 pendência(s).',
      'blockingCode', 'PROJECT_NAME_INVALID'
    );
  end if;

  if p_expected_project_name is not null and p_expected_project_name <> v_project.name then
    return jsonb_build_object(
      'ok', false,
      'code', 'STALE_READINESS',
      'message', 'O snapshot de prontidão ficou obsoleto — releia antes de executar.'
    );
  end if;

  insert into public.ads_campaigns (
    workspace_id, project_id, name, status, step_current, create_idempotency_key
  )
  values (
    p_workspace_id, p_project_id, v_clean_name, 'draft', 1, p_idempotency_key
  )
  -- The unique index is PARTIAL (`where create_idempotency_key is not null`);
  -- the predicate must be repeated here for Postgres to infer it as the
  -- conflict target (p_idempotency_key was already validated non-null above).
  on conflict (workspace_id, create_idempotency_key) where create_idempotency_key is not null do nothing
  returning * into v_campaign;

  if not found then
    -- Lost the race to a concurrent caller with the identical key that committed
    -- between our fast-path check and this insert. Its row is now visible.
    select * into v_existing
      from public.ads_campaigns
     where workspace_id = p_workspace_id
       and create_idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object(
        'ok', true,
        'code', 'IDEMPOTENT_REPLAY',
        'campaign', jsonb_build_object(
          'id', v_existing.id,
          'workspaceId', v_existing.workspace_id,
          'projectId', v_existing.project_id,
          'name', v_existing.name,
          'status', v_existing.status,
          'stepCurrent', v_existing.step_current,
          'createdAt', v_existing.created_at
        )
      );
    end if;
    return jsonb_build_object(
      'ok', false,
      'code', 'CAMPAIGN_CREATE_CONFLICT',
      'message', 'Uma campanha com esta chave de idempotência já existe.'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'CREATED',
    'campaign', jsonb_build_object(
      'id', v_campaign.id,
      'workspaceId', v_campaign.workspace_id,
      'projectId', v_campaign.project_id,
      'name', v_campaign.name,
      'status', v_campaign.status,
      'stepCurrent', v_campaign.step_current,
      'createdAt', v_campaign.created_at
    )
  );
end;
$$;

revoke all on function private.create_campaign_with_readiness(uuid, uuid, text, text, text, boolean) from public;
grant execute on function private.create_campaign_with_readiness(uuid, uuid, text, text, text, boolean) to authenticated, service_role;

-- PostgREST-exposed invoker wrapper (same shape as `public.review_skill_run_proposal`,
-- STORY-8.W2.3): the write itself lives in the private SECURITY DEFINER core
-- above. This wrapper stays SECURITY INVOKER specifically so `current_user`
-- here still reflects the real caller (see note above the private function) —
-- it resolves `p_require_membership` and forwards it, it does not perform the
-- write itself. Reachable by `authenticated` (so a direct client bypass of the
-- app's own preflight still lands on the same enforcement — AC3) and by
-- `service_role` (the BFF's trusted backend path,
-- `server/lib/campaign-create-repo.ts`).
create or replace function public.campaign_create_readiness_rpc(
  p_workspace_id uuid,
  p_project_id uuid,
  p_name text,
  p_idempotency_key text,
  p_expected_project_name text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.create_campaign_with_readiness(
    p_workspace_id,
    p_project_id,
    p_name,
    p_idempotency_key,
    p_expected_project_name,
    current_user = 'authenticated'
  );
end;
$$;

revoke all on function public.campaign_create_readiness_rpc(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.campaign_create_readiness_rpc(uuid, uuid, text, text, text) to authenticated, service_role;
