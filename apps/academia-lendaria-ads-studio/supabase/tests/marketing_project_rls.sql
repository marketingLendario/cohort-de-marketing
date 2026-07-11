begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id)
values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002');

insert into public.workspaces (id, name)
values
  ('20000000-0000-0000-0000-000000000001', 'Workspace A'),
  ('20000000-0000-0000-0000-000000000002', 'Workspace B');

insert into public.workspace_members (workspace_id, user_id)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');

insert into public.marketing_projects (id, workspace_id, slug, name)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'project-a', 'Project A'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'project-b', 'Project B');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select ok(
  private.is_workspace_member('20000000-0000-0000-0000-000000000001'),
  'member helper accepts the active workspace'
);

select ok(
  not private.is_workspace_member('20000000-0000-0000-0000-000000000002'),
  'member helper rejects another workspace'
);

select results_eq(
  $$ select name from public.marketing_projects order by name $$,
  $$ values ('Project A'::text) $$,
  'RLS only exposes projects from the active membership'
);

select throws_ok(
  $$ insert into public.marketing_projects (workspace_id, slug, name)
     values ('20000000-0000-0000-0000-000000000002', 'forbidden', 'Forbidden') $$,
  '42501',
  'new row violates row-level security policy for table "marketing_projects"',
  'RLS rejects writes to another workspace'
);

select * from finish();
rollback;
