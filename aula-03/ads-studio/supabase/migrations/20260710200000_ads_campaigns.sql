-- Campaign root used by both the legacy wizard and the unified project flow.
-- The project FK stays nullable while legacy campaigns are being reconciled.

alter table public.marketing_projects
  drop constraint if exists marketing_projects_id_workspace_key;
alter table public.marketing_projects
  add constraint marketing_projects_id_workspace_key unique (id, workspace_id);

create table if not exists public.ads_campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid,
  name text not null check (length(btrim(name)) > 0),
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'approved', 'live', 'paused', 'archived')),
  step_current integer not null default 1 check (step_current between 1 and 8),
  created_at timestamptz not null default now(),
  constraint ads_campaigns_project_workspace_fkey
    foreign key (project_id, workspace_id)
    references public.marketing_projects(id, workspace_id)
    on delete cascade
);

-- Upgrade path: older installations may already have ads_campaigns with the
-- single-column project FK added by the unified-domain migration. Preserve a
-- legacy campaign but detach an invalid cross-workspace project link before
-- replacing that FK with the tenant-safe composite constraint.
update public.ads_campaigns as campaign
set project_id = null
where campaign.project_id is not null
  and not exists (
    select 1
    from public.marketing_projects as project
    where project.id = campaign.project_id
      and project.workspace_id = campaign.workspace_id
  );

alter table public.ads_campaigns
  drop constraint if exists ads_campaigns_project_id_fkey;
alter table public.ads_campaigns
  drop constraint if exists ads_campaigns_project_workspace_fkey;
alter table public.ads_campaigns
  add constraint ads_campaigns_project_workspace_fkey
  foreign key (project_id, workspace_id)
  references public.marketing_projects(id, workspace_id)
  on delete cascade;

create index if not exists ads_campaigns_workspace_created_idx
  on public.ads_campaigns(workspace_id, created_at desc);
create index if not exists ads_campaigns_project_id_idx
  on public.ads_campaigns(project_id);

alter table public.ads_campaigns enable row level security;

drop policy if exists "workspace members manage ads campaigns" on public.ads_campaigns;
create policy "workspace members manage ads campaigns"
on public.ads_campaigns for all to authenticated
using ((select private.is_workspace_member(workspace_id)))
with check ((select private.is_workspace_member(workspace_id)));

grant select, insert, update, delete on public.ads_campaigns to authenticated;
grant select, insert, update, delete on public.ads_campaigns to service_role;
