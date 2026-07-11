-- An elicitation continuation creates a fresh durable run. Superseding the
-- prior needs_review checkpoint must be atomic and tenant-safe, while terminal
-- approval remains BFF-only.
create or replace function private.supersede_skill_run_checkpoint(
  p_workspace_id uuid,
  p_parent_run_id uuid,
  p_continuation_run_id uuid
)
returns setof public.skill_runs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_workspace_member(p_workspace_id)) then
    raise exception 'workspace membership required to supersede skill_run checkpoint'
      using errcode = '42501';
  end if;
  if p_parent_run_id = p_continuation_run_id then
    raise exception 'continuation run must differ from parent run'
      using errcode = '23514';
  end if;

  return query
    update public.skill_runs as parent
       set status = 'cancelled',
           error = format('Continuação registrada no run %s.', p_continuation_run_id),
           updated_at = now()
     where parent.id = p_parent_run_id
       and parent.workspace_id = p_workspace_id
       and parent.status = 'needs_review'
       and exists (
         select 1
           from public.skill_runs as continuation
          where continuation.id = p_continuation_run_id
            and continuation.workspace_id = parent.workspace_id
            and continuation.project_id = parent.project_id
            and continuation.skill_id = parent.skill_id
            and continuation.input_snapshot ->> 'elicitationParentRunId' = parent.id::text
       )
    returning parent.*;

  if not found then
    raise exception 'checkpoint is stale or continuation linkage is invalid'
      using errcode = '40001';
  end if;
end;
$$;

revoke all on function private.supersede_skill_run_checkpoint(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function private.supersede_skill_run_checkpoint(uuid, uuid, uuid) to authenticated;

create or replace function public.supersede_skill_run_checkpoint(
  p_workspace_id uuid,
  p_parent_run_id uuid,
  p_continuation_run_id uuid
)
returns setof public.skill_runs
language sql
security invoker
set search_path = ''
as $$
  select * from private.supersede_skill_run_checkpoint(
    p_workspace_id,
    p_parent_run_id,
    p_continuation_run_id
  );
$$;

revoke all on function public.supersede_skill_run_checkpoint(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.supersede_skill_run_checkpoint(uuid, uuid, uuid) to authenticated;
