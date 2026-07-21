begin;

create extension if not exists pgtap with schema extensions;
select plan(32);

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

insert into public.skill_runs (id, workspace_id, project_id, skill_id, skill_hash, status, input_snapshot)
values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'offerbook', 'skill-hash-a', 'needs_review', '{}'::jsonb),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'offerbook', 'skill-hash-b', 'needs_review', '{}'::jsonb),
  ('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'offerbook', 'skill-hash-c', 'running', '{}'::jsonb),
  ('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'offerbook', 'skill-hash-d', 'running', '{}'::jsonb),
  ('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'offerbook', 'skill-hash-e', 'running', '{}'::jsonb),
  ('50000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'offerbook', 'skill-hash-f', 'running', '{"elicitationParentRunId":"50000000-0000-0000-0000-000000000003"}'::jsonb);

insert into public.artifact_approval_outbox
  (id, workspace_id, project_id, skill_run_id, idempotency_key, decision, proposal_hash, state)
values
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'key-a', 'approve', 'hash-a', 'done'),
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'key-b', 'approve', 'hash-b', 'done');

select has_table('public', 'artifact_approval_outbox', 'artifact_approval_outbox table is present');

-- The browser has no direct read or write surface. This is intentionally a
-- privilege denial, not a workspace-membership policy that can be abused to
-- forge saga/audit state.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$ select id from public.artifact_approval_outbox $$,
  '42501',
  'permission denied for table artifact_approval_outbox',
  'authenticated cannot read the BFF-only outbox'
);

select throws_ok(
  $$ insert into public.artifact_approval_outbox
       (workspace_id, project_id, skill_run_id, idempotency_key, decision, proposal_hash, state)
     values
       ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'client-insert', 'reject', 'hash-a', 'rejected') $$,
  '42501',
  'permission denied for table artifact_approval_outbox',
  'authenticated cannot insert saga state'
);

select throws_ok(
  $$ update public.artifact_approval_outbox set state = 'failed' where id = '60000000-0000-0000-0000-000000000001' $$,
  '42501',
  'permission denied for table artifact_approval_outbox',
  'authenticated cannot update saga state'
);

select throws_ok(
  $$ delete from public.artifact_approval_outbox where id = '60000000-0000-0000-0000-000000000001' $$,
  '42501',
  'permission denied for table artifact_approval_outbox',
  'authenticated cannot delete audit/saga state'
);

select throws_ok(
  $$ update public.skill_runs
        set status = 'done'
      where id = '50000000-0000-0000-0000-000000000001' $$,
  '42501',
  'authenticated cannot set skill_run status to done directly',
  'authenticated cannot forge the terminal done status'
);

select throws_ok(
  $$ update public.skill_runs
        set proposal_hash = repeat('a', 64)
      where id = '50000000-0000-0000-0000-000000000001' $$,
  '42501',
  'permission denied for table skill_runs',
  'authenticated cannot write proposal_hash directly'
);

select throws_ok(
  $$ update public.skill_runs
        set proposal_revision = 2
      where id = '50000000-0000-0000-0000-000000000001' $$,
  '42501',
  'permission denied for table skill_runs',
  'authenticated cannot write proposal_revision directly'
);

select throws_ok(
  $$ update public.skill_runs
        set proposal = '{"edited_directly": true}'::jsonb
      where id = '50000000-0000-0000-0000-000000000001' $$,
  '42501',
  'authenticated must use the proposal review RPC while needs_review',
  'authenticated cannot edit a reviewable proposal without the CAS RPC'
);

select lives_ok(
  $$ insert into public.skill_runs
       (workspace_id, project_id, skill_id, skill_hash, status)
     values
       ('20000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        'offerbook', 'skill-hash-valid', 'running') $$,
  'authenticated can insert a run when project and workspace match'
);

select throws_ok(
  $$ insert into public.skill_runs
       (workspace_id, project_id, skill_id, skill_hash, status)
     values
       ('20000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000002',
        'offerbook', 'skill-hash-cross-tenant', 'running') $$,
  '23503',
  'insert or update on table "skill_runs" violates foreign key constraint "skill_runs_project_workspace_fkey"',
  'authenticated cannot mix a workspace with a project from another tenant'
);

select lives_ok(
  $$ update public.skill_runs set status = 'needs_review', proposal = '{"source":"runner"}'::jsonb
      where id = '50000000-0000-0000-0000-000000000003' $$,
  'authenticated can move running -> needs_review with the runner proposal'
);
select is(
  (select status from public.skill_runs where id = '50000000-0000-0000-0000-000000000003'),
  'needs_review',
  'running -> needs_review remains allowed'
);

select lives_ok(
  $$ update public.skill_runs set status = 'failed' where id = '50000000-0000-0000-0000-000000000004' $$,
  'authenticated can move running -> failed'
);
select lives_ok(
  $$ update public.skill_runs set status = 'cancelled' where id = '50000000-0000-0000-0000-000000000005' $$,
  'authenticated can move running -> cancelled'
);

select lives_ok(
  $$ select * from public.review_skill_run_proposal(
       '20000000-0000-0000-0000-000000000001',
       '50000000-0000-0000-0000-000000000003',
       1,
       '{"edited_via":"rpc"}'::jsonb,
       repeat('a', 64)
     ) $$,
  'authenticated can edit a reviewable proposal through the RPC'
);
select is(
  (select proposal_revision from public.skill_runs where id = '50000000-0000-0000-0000-000000000003'),
  2,
  'proposal RPC increments revision monotonically'
);
select is(
  (select proposal_hash from public.skill_runs where id = '50000000-0000-0000-0000-000000000003'),
  repeat('a', 64),
  'proposal RPC writes the canonical hash'
);
select is(
  (select proposal->>'edited_via' from public.skill_runs where id = '50000000-0000-0000-0000-000000000003'),
  'rpc',
  'proposal RPC writes the reviewed proposal payload'
);
select throws_ok(
  $$ select * from public.review_skill_run_proposal(
       '20000000-0000-0000-0000-000000000001',
       '50000000-0000-0000-0000-000000000003',
       1,
       '{"stale":true}'::jsonb,
       repeat('b', 64)
     ) $$,
  '40001',
  'proposal revision is stale or skill_run is not reviewable',
  'proposal RPC enforces the expected revision CAS'
);

select lives_ok(
  $$ select * from public.supersede_skill_run_checkpoint(
       '20000000-0000-0000-0000-000000000001',
       '50000000-0000-0000-0000-000000000003',
       '50000000-0000-0000-0000-000000000006'
     ) $$,
  'authenticated member can supersede a review checkpoint with its linked continuation'
);
select is(
  (select status from public.skill_runs where id = '50000000-0000-0000-0000-000000000003'),
  'cancelled',
  'supersede RPC marks only the parent checkpoint cancelled'
);
select ok(
  (select error from public.skill_runs where id = '50000000-0000-0000-0000-000000000003') like '%50000000-0000-0000-0000-000000000006%',
  'supersede RPC records the continuation identity'
);
select throws_ok(
  $$ select * from public.supersede_skill_run_checkpoint(
       '20000000-0000-0000-0000-000000000001',
       '50000000-0000-0000-0000-000000000001',
       '50000000-0000-0000-0000-000000000006'
     ) $$,
  '40001',
  'checkpoint is stale or continuation linkage is invalid',
  'supersede RPC rejects a continuation linked to a different parent'
);

reset role;
set local role anon;
select throws_ok(
  $$ insert into public.artifact_approval_outbox
       (workspace_id, project_id, skill_run_id, idempotency_key, decision, proposal_hash, state)
     values
       ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'anon-insert', 'reject', 'hash-a', 'rejected') $$,
  '42501',
  'permission denied for table artifact_approval_outbox',
  'anon cannot insert saga state'
);

-- The authorized BFF role can write, but composite FKs still reject forged
-- cross-tenant and cross-project references at the database boundary.
reset role;
set local role service_role;
select lives_ok(
  $$ insert into public.artifact_approval_outbox
       (workspace_id, project_id, skill_run_id, idempotency_key, decision, proposal_hash, proposal_revision, state)
     values
       ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'bff-key', 'reject', 'hash-a', 2, 'rejected') $$,
  'service_role can record an authorized BFF decision'
);

select throws_ok(
  $$ insert into public.artifact_approval_outbox
       (workspace_id, project_id, skill_run_id, idempotency_key, decision, proposal_hash, proposal_revision, state)
     values
       ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'mixed-project', 'approve', 'hash-a', 3, 'pending') $$,
  '23503',
  'insert or update on table "artifact_approval_outbox" violates foreign key constraint "artifact_approval_outbox_project_workspace_fkey"',
  'service_role cannot mix a project from another workspace'
);

select throws_ok(
  $$ insert into public.artifact_approval_outbox
       (workspace_id, project_id, skill_run_id, idempotency_key, decision, proposal_hash, proposal_revision, state)
     values
       ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'mixed-run', 'approve', 'hash-a', 4, 'pending') $$,
  '23503',
  'insert or update on table "artifact_approval_outbox" violates foreign key constraint "artifact_approval_outbox_skill_run_workspace_project_fkey"',
  'service_role cannot mix a run from another workspace/project'
);

select throws_ok(
  $$ insert into public.artifact_approval_outbox
       (workspace_id, project_id, skill_run_id, idempotency_key, decision, proposal_hash, state)
     values
       ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'alternate-key', 'approve', 'hash-a', 'done') $$,
  '23505',
  'duplicate key value violates unique constraint "artifact_approval_outbox_semantic_uidx"',
  'alternate idempotency keys cannot create a second decision for one run revision'
);

select throws_ok(
  $$ insert into public.artifact_approval_outbox
       (workspace_id, project_id, skill_run_id, idempotency_key, decision, proposal_hash, proposal_revision, state)
     values
       ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'bad-state', 'approve', 'hash-a', 5, 'teleported') $$,
  '23514',
  'new row for relation "artifact_approval_outbox" violates check constraint "artifact_approval_outbox_state_check"',
  'the saga state machine rejects an undeclared state'
);

select lives_ok(
  $$ update public.skill_runs
        set status = 'done', proposal_hash = repeat('c', 64), proposal_revision = 1
      where id = '50000000-0000-0000-0000-000000000001' $$,
  'service_role can perform the terminal saga update'
);
select is(
  (select status from public.skill_runs where id = '50000000-0000-0000-0000-000000000001'),
  'done',
  'service_role terminal status remains available to the BFF saga'
);

select * from finish();
rollback;
