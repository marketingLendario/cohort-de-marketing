-- The durable runner journal is backend-owned. Workspace members may observe
-- their jobs through RLS, but only the service-role worker can mutate them.

revoke insert, update, delete on public.skill_run_jobs from authenticated;

drop policy if exists "workspace members manage skill run jobs" on public.skill_run_jobs;
drop policy if exists "workspace members read skill run jobs" on public.skill_run_jobs;
create policy "workspace members read skill run jobs"
  on public.skill_run_jobs for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

grant select on public.skill_run_jobs to authenticated;
grant select, insert, update, delete on public.skill_run_jobs to service_role;
