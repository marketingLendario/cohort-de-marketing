create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members(user_id, workspace_id);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_members'
      and policyname = 'members read their workspace memberships'
  ) then
    create policy "members read their workspace memberships"
      on public.workspace_members for select to authenticated
      using (user_id = (select auth.uid()));
  end if;
end;
$$;

grant select on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
