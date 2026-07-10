begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

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

select lives_ok(
  $$ update public.skill_run_jobs
       set status = 'running', lease_owner = 'worker-1', lease_expires_at = now() + interval '30 seconds'
     where id = '40000000-0000-0000-0000-000000000001' $$,
  'workspace member can claim (update) a job in its workspace'
);

select is(
  (select status from public.skill_run_jobs where id = '40000000-0000-0000-0000-000000000001'),
  'running',
  'the claimed job persisted its running status'
);

select throws_ok(
  $$ insert into public.skill_run_jobs (workspace_id, project_id, skill_id)
     values ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'offerbook') $$,
  '42501',
  'new row violates row-level security policy for table "skill_run_jobs"',
  'RLS rejects writes to another workspace'
);

select * from finish();
rollback;
