-- STORY-8.W1.1 — gap comprovado do repository do domínio unificado.
--
-- O contrato do `ProjectRepository` expõe `updatedAt` e o consome ao reabrir um
-- projeto em outra sessão (gate 2 do EPIC-8). O schema base define `updated_at`
-- com `default now()`, mas isso só carimba o INSERT — um UPDATE do repository
-- (renomear projeto, mudar estado de artefato, avançar skill run) deixaria o
-- timestamp preso no valor de criação. Este trigger de auto-touch fecha esse gap
-- para todas as tabelas mutáveis do domínio.
--
-- Idempotente: `create extension if not exists`, `drop trigger if exists` +
-- `create trigger`. Reexecução é no-op. As tabelas append-only
-- (`ads_weekly_panel_events`, `human_decisions`) não têm `updated_at` e ficam de
-- fora por design.

create extension if not exists moddatetime with schema extensions;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'marketing_projects',
    'project_brief_revisions',
    'project_artifacts',
    'skill_runs',
    'campaign_plan_revisions',
    'ads_weekly_panels'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', target_table);
    execute format(
      'create trigger set_updated_at before update on public.%I '
      || 'for each row execute function extensions.moddatetime(updated_at)',
      target_table
    );
  end loop;
end;
$$;
