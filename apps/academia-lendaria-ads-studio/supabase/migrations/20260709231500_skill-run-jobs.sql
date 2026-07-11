-- Durable async skill-run journal (STORY-8.W2.2, AC2/AC5).
--
-- Backs the LOCAL Codex runner: the BFF persists a job BEFORE executing (202 +
-- jobId), streams progress into `steps`/`logs`, and records the terminal
-- `proposal`/`error`. A recovery lease (`lease_owner`/`lease_expires_at`) lets a
-- restarted BFF reclaim a non-terminal run without duplicating side effects.
--
-- Idempotent: `create ... if not exists` + `drop policy if exists`. RLS reuses
-- `private.is_workspace_member` (STORY-8.W1.1) — a run is only ever visible to
-- members of its workspace.

create table if not exists public.skill_run_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  skill_id text not null,
  skill_hash text,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  attempt integer not null default 1 check (attempt > 0),
  attempts jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  logs jsonb not null default '[]'::jsonb,
  input jsonb not null default '{}'::jsonb,
  proposal jsonb,
  model text,
  error jsonb,
  lease_owner text,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projection lookups (per project, newest first).
create index if not exists skill_run_jobs_project_idx
  on public.skill_run_jobs (project_id, created_at desc);

-- Recovery scan: non-terminal jobs whose lease is free/expired.
create index if not exists skill_run_jobs_recovery_idx
  on public.skill_run_jobs (status, lease_expires_at)
  where status in ('queued', 'running');

alter table public.skill_run_jobs enable row level security;

drop policy if exists "workspace members manage skill run jobs" on public.skill_run_jobs;
create policy "workspace members manage skill run jobs"
  on public.skill_run_jobs for all to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));

grant select, insert, update, delete on public.skill_run_jobs to authenticated;
