-- pgTAP — repository Supabase do domínio unificado (STORY-8.W1.1).
--
-- Cobre (AC6): CRUD versionado, conflito de revisão (optimistic concurrency) e
-- isolamento RLS positivo/negativo. Também prova o gap de `updated_at` fechado
-- pela migration 20260709230000. Roda em transação e faz rollback ao final.

begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

-- Seed como superuser (antes de assumir o papel authenticated) — a RLS ainda
-- não se aplica aqui. `created_at`/`updated_at` propositalmente no passado para
-- provar que o trigger de auto-touch mexe no timestamp num UPDATE posterior.
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

insert into public.marketing_projects (id, workspace_id, slug, name, created_at, updated_at)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'project-a', 'Project A', '2020-01-01T00:00:00Z', '2020-01-01T00:00:00Z'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'project-b', 'Project B', '2020-01-01T00:00:00Z', '2020-01-01T00:00:00Z');

insert into public.project_brief_revisions (id, workspace_id, project_id, revision, status, data)
values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1, 'active', '{}'::jsonb);

-- A partir daqui, rodamos como o membro do Workspace A (RLS ativa).
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

-- 1) O trigger de auto-touch está instalado (gap fechado pela migration).
select has_trigger(
  'public'::name,
  'marketing_projects'::name,
  'set_updated_at'::name,
  'trigger set_updated_at instalado em marketing_projects'
);

-- 2) CRUD: o membro lê a revisão de briefing do seu workspace.
select results_eq(
  $$ select revision from public.project_brief_revisions
     where project_id = '30000000-0000-0000-0000-000000000001' $$,
  $$ values (1) $$,
  'membro lê a revisão de briefing do workspace ativo'
);

-- 3) OCC: uma escrita concorrente com a mesma revisão colide (unique_violation).
select throws_ok(
  $$ insert into public.project_brief_revisions (workspace_id, project_id, revision, status, data)
     values ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1, 'draft', '{}'::jsonb) $$,
  '23505',
  null,
  'revisão concorrente colide (optimistic concurrency, sem sobrescrever)'
);

-- 4) RLS negativo: escrever em outro workspace é rejeitado.
select throws_ok(
  $$ insert into public.marketing_projects (workspace_id, slug, name)
     values ('20000000-0000-0000-0000-000000000002', 'forbidden', 'Forbidden') $$,
  '42501',
  null,
  'RLS rejeita escrita em outro workspace'
);

-- 5) RLS positivo/isolamento: só o projeto do workspace ativo é visível.
select results_eq(
  $$ select name from public.marketing_projects order by name $$,
  $$ values ('Project A'::text) $$,
  'RLS expõe apenas projetos da associação ativa'
);

-- 6) O UPDATE dispara o trigger e renova updated_at (saindo do valor de 2020).
update public.marketing_projects
  set name = 'Project A v2'
  where id = '30000000-0000-0000-0000-000000000001';

select ok(
  (select updated_at > timestamptz '2020-01-01T00:00:00Z'
     from public.marketing_projects
     where id = '30000000-0000-0000-0000-000000000001'),
  'trigger renova updated_at no UPDATE'
);

select * from finish();
rollback;
