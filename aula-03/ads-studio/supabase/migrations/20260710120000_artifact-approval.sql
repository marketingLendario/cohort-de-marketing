-- Two-phase artifact approval — outbox/compensation journal (STORY-8.W2.3).
--
-- The BFF approval saga is the single authority that keeps the FILESYSTEM (the
-- canonical `projetos/{slug}/...` artifact written by the W1.3 materializer) and
-- the DATABASE (artifact metadata + skill_run decision + audit event) from
-- silently diverging. `public.artifact_approval_outbox` records every human
-- decision as a durable row with a DETERMINISTIC state machine so a crash on
-- either side of the atomic rename is repairable without duplicating the write:
--
--   approve: pending -> materializing -> materialized -> recording -> done
--   reject:  pending -> rejected
--   any step failure: state stays at the last completed checkpoint + error set,
--                     and `repair` resumes it idempotently (materialize is a
--                     no-op on an identical hash; the artifact/skill_run writes
--                     are upserts).
--
-- `idempotency_key` makes a replayed decision return the SAME row instead of a
-- second side effect (`unique (workspace_id, idempotency_key)`). `proposal_hash`
-- is the SAME SHA-256 recorded across filesystem (materializer), DB (artifact
-- `content_hash` + this row) and the audit event — the cross-surface integrity
-- anchor.
--
-- Idempotent DDL (`create ... if not exists`, `add column if not exists`,
-- `drop policy if exists`). RLS reuses `private.is_workspace_member`
-- (STORY-8.W1.1): a decision is only ever visible to members of its workspace.

-- Proposal integrity fields on the run being reviewed. `proposal_revision` is
-- bumped when the reviewer EDITS a proposal (a new revision + hash invalidates a
-- stale approval that still carries the old expected hash). `proposal_hash` is
-- the canonical hash of the accepted proposal, recorded at decision time.
alter table public.skill_runs add column if not exists proposal_hash text;
alter table public.skill_runs
  add column if not exists proposal_revision integer not null default 1;
alter table public.skill_runs
  drop constraint if exists skill_runs_proposal_revision_check;
alter table public.skill_runs
  add constraint skill_runs_proposal_revision_check check (proposal_revision > 0);

-- Composite parent keys make the tenant/project relationship part of the
-- database identity, not an application convention. The UUID primary keys are
-- retained, while these indexes let the outbox reference the same workspace
-- and project tuple deterministically.
create unique index if not exists marketing_projects_id_workspace_uidx
  on public.marketing_projects (id, workspace_id);
create unique index if not exists skill_runs_id_workspace_project_uidx
  on public.skill_runs (id, workspace_id, project_id);

-- The original schema only constrained skill_runs.project_id. Before replacing
-- it, fail loudly if legacy rows already mix a workspace with a project from
-- another workspace. No row is repaired or reattributed by this migration.
do $$
declare
  inconsistent_rows bigint;
begin
  select count(*)
    into inconsistent_rows
    from public.skill_runs as sr
    left join public.marketing_projects as mp
      on mp.id = sr.project_id
     and mp.workspace_id = sr.workspace_id
   where mp.id is null;

  if inconsistent_rows > 0 then
    raise exception
      'cannot add skill_runs_project_workspace_fkey: % legacy skill_run row(s) have a project/workspace mismatch',
      inconsistent_rows
      using errcode = '23503',
            hint = 'Repair the inconsistent rows explicitly before applying this migration.';
  end if;
end;
$$;

alter table public.skill_runs
  drop constraint if exists skill_runs_project_id_fkey;
alter table public.skill_runs
  drop constraint if exists skill_runs_project_workspace_fkey;
alter table public.skill_runs
  add constraint skill_runs_project_workspace_fkey
  foreign key (project_id, workspace_id)
  references public.marketing_projects (id, workspace_id)
  on delete cascade;

create table if not exists public.artifact_approval_outbox (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  skill_run_id uuid not null,
  -- Client-supplied stable key for a single decision (e.g. run:hash:decision).
  -- A replay with the same key returns the same row — no duplicate materialize.
  idempotency_key text not null,
  decision text not null check (decision in ('approve', 'reject')),
  -- SHA-256 recorded identically on the filesystem, the artifact row and the
  -- audit event: the cross-surface integrity anchor.
  proposal_hash text not null,
  proposal_revision integer not null default 1 check (proposal_revision > 0),
  -- Deterministic saga state — the repair entry-point reads this to resume.
  state text not null default 'pending'
    check (state in ('pending', 'materializing', 'materialized', 'recording', 'done', 'rejected', 'failed')),
  -- Aggregate materializer outcome once resolved (per-file detail lives in the audit event).
  outcome text check (outcome in ('written', 'unchanged', 'conflict', 'rejected')),
  -- The immutable planned artifacts of this decision (id, path, format, content,
  -- content hash). Captured at decision time so a repair re-materializes the
  -- exact bytes the human approved, independent of any later edit to the run.
  plan jsonb not null default '[]'::jsonb,
  -- Serializable audit event (the same shape the materializer emits, plus decision).
  audit_event jsonb,
  error text,
  attempt integer not null default 0 check (attempt >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Idempotency: one decision per key per workspace.
  unique (workspace_id, idempotency_key)
);

-- Decision history per run (newest first).
create index if not exists artifact_approval_outbox_run_idx
  on public.artifact_approval_outbox (skill_run_id, created_at desc);

-- There can be only one approval decision for a run revision, regardless of
-- which idempotency key a caller invents. The service reads this identity before
-- resuming and translates races into a clean semantic conflict/replay.
create unique index if not exists artifact_approval_outbox_semantic_uidx
  on public.artifact_approval_outbox (workspace_id, skill_run_id, proposal_revision);

alter table public.artifact_approval_outbox
  drop constraint if exists artifact_approval_outbox_project_id_fkey;
alter table public.artifact_approval_outbox
  drop constraint if exists artifact_approval_outbox_skill_run_id_fkey;
alter table public.artifact_approval_outbox
  drop constraint if exists artifact_approval_outbox_project_workspace_fkey;
alter table public.artifact_approval_outbox
  drop constraint if exists artifact_approval_outbox_skill_run_workspace_project_fkey;
alter table public.artifact_approval_outbox
  add constraint artifact_approval_outbox_project_workspace_fkey
  foreign key (project_id, workspace_id)
  references public.marketing_projects (id, workspace_id)
  on delete cascade;
alter table public.artifact_approval_outbox
  add constraint artifact_approval_outbox_skill_run_workspace_project_fkey
  foreign key (skill_run_id, workspace_id, project_id)
  references public.skill_runs (id, workspace_id, project_id)
  on delete cascade;

-- Repair scan: rows stuck mid-saga (a crash before/after the atomic rename).
create index if not exists artifact_approval_outbox_repair_idx
  on public.artifact_approval_outbox (state)
  where state in ('pending', 'materializing', 'materialized', 'recording');

alter table public.artifact_approval_outbox enable row level security;

drop policy if exists "workspace members manage artifact approvals" on public.artifact_approval_outbox;
-- The browser uses the BFF and never needs a direct outbox surface. No client
-- role receives a policy or table privilege; only the service-role client used
-- by the BFF can write/read the saga journal. This also prevents forged state,
-- audit payloads and cross-tenant references through PostgREST.
revoke all on public.artifact_approval_outbox from public, anon, authenticated;
grant all on public.artifact_approval_outbox to service_role;

-- `skill_runs` is the durable authority for the approval decision. The browser
-- may create a run and report the non-terminal runtime transitions, but it must
-- never forge the terminal approval or mutate the proposal identity directly.
-- Keep SELECT and the minimum runtime columns; the BFF uses service_role and is
-- not constrained by these authenticated grants.
revoke all on public.skill_runs from authenticated;
grant select on public.skill_runs to authenticated;
grant insert (workspace_id, project_id, skill_id, skill_hash, status, input_snapshot, proposal, error)
  on public.skill_runs to authenticated;
grant update (status, proposal, error, skill_hash) on public.skill_runs to authenticated;
grant select, insert, update, delete on public.skill_runs to service_role;

create or replace function private.guard_authenticated_skill_run_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status = 'done' or new.proposal_hash is not null or new.proposal_revision <> 1 then
      raise exception 'authenticated cannot create a terminal or reviewed skill_run directly'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.status = 'done' then
    raise exception 'authenticated cannot set skill_run status to done directly'
      using errcode = '42501';
  end if;
  if new.proposal_hash is distinct from old.proposal_hash then
    raise exception 'authenticated cannot change skill_run proposal_hash directly'
      using errcode = '42501';
  end if;
  if new.proposal_revision is distinct from old.proposal_revision then
    raise exception 'authenticated cannot change skill_run proposal_revision directly'
      using errcode = '42501';
  end if;
  if old.status = 'needs_review' and new.proposal is distinct from old.proposal then
    raise exception 'authenticated must use the proposal review RPC while needs_review'
      using errcode = '42501';
  end if;
  if new.status is distinct from old.status and not (
    (old.status = 'queued' and new.status in ('running', 'failed', 'cancelled')) or
    (old.status = 'running' and new.status in ('needs_review', 'failed', 'cancelled')) or
    (old.status = 'failed' and new.status = 'running')
  ) then
    raise exception 'authenticated cannot perform this skill_run status transition'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_authenticated_skill_run_mutation on public.skill_runs;
create trigger guard_authenticated_skill_run_mutation
before insert or update on public.skill_runs
for each row execute function private.guard_authenticated_skill_run_mutation();

-- Human proposal edits use a private SECURITY DEFINER RPC. It is deliberately
-- outside exposed schemas, checks the JWT membership itself, and performs the
-- revision bump and expected-revision CAS in one statement. The terminal
-- approve/reject transition remains service_role-only in the BFF saga.
create or replace function private.review_skill_run_proposal(
  p_workspace_id uuid,
  p_skill_run_id uuid,
  p_expected_revision integer,
  p_proposal jsonb,
  p_proposal_hash text
)
returns setof public.skill_runs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_workspace_member(p_workspace_id)) then
    raise exception 'workspace membership required for proposal review'
      using errcode = '42501';
  end if;
  if p_expected_revision <= 0 or p_proposal_hash is null or p_proposal_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid proposal revision or hash'
      using errcode = '23514';
  end if;

  return query
    update public.skill_runs as sr
       set proposal = p_proposal,
           proposal_hash = p_proposal_hash,
           proposal_revision = sr.proposal_revision + 1,
           updated_at = now()
     where sr.id = p_skill_run_id
       and sr.workspace_id = p_workspace_id
       and sr.status = 'needs_review'
       and sr.proposal_revision = p_expected_revision
       and exists (
         select 1
           from public.marketing_projects as mp
          where mp.id = sr.project_id
            and mp.workspace_id = sr.workspace_id
       )
    returning sr.*;

  if not found then
    raise exception 'proposal revision is stale or skill_run is not reviewable'
      using errcode = '40001';
  end if;
end;
$$;

revoke all on function private.review_skill_run_proposal(uuid, uuid, integer, jsonb, text) from public, anon, authenticated;
grant execute on function private.review_skill_run_proposal(uuid, uuid, integer, jsonb, text) to authenticated;

-- PostgREST needs an exposed invoker wrapper for the browser repository. The
-- authorization and write still live in the private SECURITY DEFINER core;
-- this wrapper never receives or exposes service_role credentials.
create or replace function public.review_skill_run_proposal(
  p_workspace_id uuid,
  p_skill_run_id uuid,
  p_expected_revision integer,
  p_proposal jsonb,
  p_proposal_hash text
)
returns setof public.skill_runs
language sql
security invoker
set search_path = ''
as $$
  select * from private.review_skill_run_proposal(
    p_workspace_id,
    p_skill_run_id,
    p_expected_revision,
    p_proposal,
    p_proposal_hash
  );
$$;

revoke all on function public.review_skill_run_proposal(uuid, uuid, integer, jsonb, text) from public, anon, authenticated;
grant execute on function public.review_skill_run_proposal(uuid, uuid, integer, jsonb, text) to authenticated;
