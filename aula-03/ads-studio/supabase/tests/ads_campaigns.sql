begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id)
values ('11000000-0000-0000-0000-000000000001');

insert into public.workspaces (id, name)
values
  ('21000000-0000-0000-0000-000000000001', 'Workspace A'),
  ('21000000-0000-0000-0000-000000000002', 'Workspace B');

insert into public.workspace_members (workspace_id, user_id)
values ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001');

insert into public.marketing_projects (id, workspace_id, slug, name)
values
  ('31000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'project-a', 'Project A'),
  ('31000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000002', 'project-b', 'Project B');

insert into public.ads_campaigns (workspace_id, project_id, name)
values ('21000000-0000-0000-0000-000000000002', '31000000-0000-0000-0000-000000000002', 'Campaign B');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);

select has_table('public', 'ads_campaigns', 'ads_campaigns table is present');

select is(
  (select count(*)::integer from pg_constraint where conname = 'ads_campaigns_project_id_fkey'),
  0,
  'legacy single-column project FK is absent'
);

select is(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conname = 'ads_campaigns_project_workspace_fkey'
  ),
  'FOREIGN KEY (project_id, workspace_id) REFERENCES marketing_projects(id, workspace_id) ON DELETE CASCADE',
  'campaign project FK is tenant-safe and composite'
);

select lives_ok(
  $$ insert into public.ads_campaigns (workspace_id, project_id, name)
     values ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'Campaign A') $$,
  'member can create a draft in its own project'
);

select results_eq(
  $$ select name from public.ads_campaigns order by name $$,
  $$ values ('Campaign A'::text) $$,
  'RLS only exposes campaigns from the active workspace'
);

select throws_ok(
  $$ insert into public.ads_campaigns (workspace_id, project_id, name)
     values ('21000000-0000-0000-0000-000000000002', '31000000-0000-0000-0000-000000000002', 'Forbidden') $$,
  '42501',
  'new row violates row-level security policy for table "ads_campaigns"',
  'RLS rejects writes to another workspace'
);

select throws_ok(
  $$ insert into public.ads_campaigns (workspace_id, project_id, name)
     values ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000002', 'Cross tenant') $$,
  '23503',
  'insert or update on table "ads_campaigns" violates foreign key constraint "ads_campaigns_project_workspace_fkey"',
  'composite FK rejects a project from another workspace'
);

select * from finish();
rollback;
