create extension if not exists pgcrypto;
create schema if not exists private;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = $1 and user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspaces'
      and policyname = 'members read their workspaces'
  ) then
    create policy "members read their workspaces"
      on public.workspaces for select to authenticated
      using ((select private.is_workspace_member(id)));
  end if;
end;
$$;

create table if not exists public.marketing_projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  slug text not null,
  name text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  active_brief_revision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists public.project_brief_revisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  revision integer not null check (revision > 0),
  schema_version text not null default '1.0.0',
  status text not null check (status in ('draft', 'active', 'superseded')),
  data jsonb not null,
  field_sources jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, revision)
);

alter table public.marketing_projects
  drop constraint if exists marketing_projects_active_brief_revision_id_fkey;
alter table public.marketing_projects
  add constraint marketing_projects_active_brief_revision_id_fkey
  foreign key (active_brief_revision_id) references public.project_brief_revisions(id) on delete set null;

create table if not exists public.project_artifacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  artifact_type text not null,
  title text not null,
  path text,
  format text not null,
  state text not null check (state in ('real', 'example', 'proposal', 'confirmed', 'stale')),
  verification text not null check (verification in ('pending', 'confirmed', 'missing')),
  source text not null,
  content text,
  content_hash text,
  skill_run_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skill_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  skill_id text not null,
  skill_hash text not null,
  status text not null check (status in ('queued', 'running', 'needs_review', 'done', 'failed', 'cancelled')),
  input_snapshot jsonb not null default '{}'::jsonb,
  proposal jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_artifacts
  drop constraint if exists project_artifacts_skill_run_id_fkey;
alter table public.project_artifacts
  add constraint project_artifacts_skill_run_id_fkey
  foreign key (skill_run_id) references public.skill_runs(id) on delete set null;

create table if not exists public.campaign_plan_revisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  campaign_id uuid not null,
  revision integer not null check (revision > 0),
  schema_version text not null default '1.0.0',
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, revision)
);

create table if not exists public.ads_weekly_panels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  campaign_id uuid not null,
  week_start date not null,
  revision integer not null check (revision > 0),
  schema_version text not null default '1.0.0',
  status text not null check (status in ('draft', 'reading_ready', 'diagnosed', 'decided', 'closed')),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, week_start, revision)
);

create table if not exists public.ads_weekly_panel_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  panel_id uuid not null references public.ads_weekly_panels(id) on delete cascade,
  event_type text not null,
  actor_type text not null check (actor_type in ('human', 'system', 'skill')),
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.human_decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null references public.marketing_projects(id) on delete cascade,
  campaign_id uuid,
  panel_id uuid references public.ads_weekly_panels(id) on delete cascade,
  decision_type text not null,
  status text not null check (status in ('approved', 'rejected')),
  rationale text,
  decided_by uuid not null default auth.uid(),
  decided_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.ads_campaigns') is not null then
    alter table public.ads_campaigns add column if not exists project_id uuid;
    if not exists (
      select 1 from pg_constraint where conname = 'ads_campaigns_project_id_fkey'
    ) then
      alter table public.ads_campaigns
        add constraint ads_campaigns_project_id_fkey
        foreign key (project_id) references public.marketing_projects(id) on delete set null;
    end if;
    create index if not exists ads_campaigns_project_id_idx on public.ads_campaigns(project_id);
  end if;
end;
$$;

create index if not exists marketing_projects_workspace_idx on public.marketing_projects(workspace_id);
create index if not exists project_brief_revisions_project_idx on public.project_brief_revisions(project_id, revision desc);
create index if not exists project_artifacts_project_idx on public.project_artifacts(project_id, artifact_type);
create index if not exists skill_runs_project_idx on public.skill_runs(project_id, created_at desc);
create index if not exists campaign_plan_revisions_campaign_idx on public.campaign_plan_revisions(campaign_id, revision desc);
create index if not exists weekly_panels_campaign_idx on public.ads_weekly_panels(campaign_id, week_start desc);
create index if not exists weekly_panel_events_panel_idx on public.ads_weekly_panel_events(panel_id, created_at);

alter table public.marketing_projects enable row level security;
alter table public.project_brief_revisions enable row level security;
alter table public.project_artifacts enable row level security;
alter table public.skill_runs enable row level security;
alter table public.campaign_plan_revisions enable row level security;
alter table public.ads_weekly_panels enable row level security;
alter table public.ads_weekly_panel_events enable row level security;
alter table public.human_decisions enable row level security;

create policy "workspace members manage marketing projects"
on public.marketing_projects for all to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy "workspace members manage project brief revisions"
on public.project_brief_revisions for all to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy "workspace members manage project artifacts"
on public.project_artifacts for all to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy "workspace members manage skill runs"
on public.skill_runs for all to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy "workspace members manage campaign plan revisions"
on public.campaign_plan_revisions for all to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy "workspace members manage weekly panels"
on public.ads_weekly_panels for all to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy "workspace members manage weekly panel events"
on public.ads_weekly_panel_events for all to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

create policy "workspace members manage human decisions"
on public.human_decisions for all to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

grant select, insert, update, delete on public.marketing_projects to authenticated;
grant select, insert, update, delete on public.project_brief_revisions to authenticated;
grant select, insert, update, delete on public.project_artifacts to authenticated;
grant select, insert, update, delete on public.skill_runs to authenticated;
grant select, insert, update, delete on public.campaign_plan_revisions to authenticated;
grant select, insert, update, delete on public.ads_weekly_panels to authenticated;
grant select, insert, update, delete on public.ads_weekly_panel_events to authenticated;
grant select, insert, update, delete on public.human_decisions to authenticated;
