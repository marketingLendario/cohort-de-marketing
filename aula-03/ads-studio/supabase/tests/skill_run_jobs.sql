begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

select ok(
  has_table_privilege('service_role', 'public.skill_run_jobs', 'SELECT')
  and has_table_privilege('service_role', 'public.skill_run_jobs', 'INSERT')
  and has_table_privilege('service_role', 'public.skill_run_jobs', 'UPDATE')
  and has_table_privilege('service_role', 'public.skill_run_jobs', 'DELETE'),
  'service_role can use the durable skill-run journal'
);

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

insert into public.skill_run_jobs (id, workspace_id, project_id, skill_id, status)
values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'offerbook', 'queued'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'offerbook', 'queued');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select has_table('public', 'skill_run_jobs', 'skill_run_jobs table is present');

select results_eq(
  $$ select skill_id from public.skill_run_jobs order by skill_id $$,
  $$ values ('offerbook'::text) $$,
  'RLS only exposes skill-run jobs from the active membership'
);

select ok(
  not has_table_privilege('authenticated', 'public.skill_run_jobs', 'INSERT'),
  'authenticated users cannot forge durable jobs'
);

select ok(
  not has_table_privilege('authenticated', 'public.skill_run_jobs', 'UPDATE'),
  'authenticated users cannot claim or rewrite jobs'
);

select ok(
  not has_table_privilege('authenticated', 'public.skill_run_jobs', 'DELETE'),
  'authenticated users cannot delete job history'
);

select * from finish();
rollback;
