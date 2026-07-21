-- Keep the project-facing run consistent with the durable job journal even
-- when the browser disconnects or misses a terminal SSE frame.

create index if not exists skill_runs_job_id_idx
  on public.skill_runs ((input_snapshot ->> 'jobId'))
  where input_snapshot ? 'jobId';

create or replace function private.apply_skill_job_terminal_to_run(
  target_workspace_id uuid,
  target_project_id uuid,
  target_skill_id text,
  target_job_id uuid,
  target_status text,
  target_skill_hash text,
  target_proposal jsonb,
  target_error jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_status not in ('succeeded', 'failed', 'cancelled') then
    return;
  end if;

  update public.skill_runs
     set status = case target_status
       when 'succeeded' then 'needs_review'
       when 'cancelled' then 'cancelled'
       else 'failed'
     end,
         skill_hash = case
           when target_status = 'succeeded' and target_skill_hash is not null then target_skill_hash
           else skill_hash
         end,
         proposal = case
           when target_status = 'succeeded' and target_proposal is not null then target_proposal
           else proposal
         end,
         error = case
           when target_status = 'succeeded' then null
           else coalesce(target_error ->> 'reason', 'Execução local terminou sem diagnóstico.')
         end
   where workspace_id = target_workspace_id
     and project_id = target_project_id
     and skill_id = target_skill_id
     and input_snapshot ->> 'jobId' = target_job_id::text
     and status in ('queued', 'running', 'failed');
end;
$$;

create or replace function private.sync_skill_run_from_terminal_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.apply_skill_job_terminal_to_run(
    new.workspace_id, new.project_id, new.skill_id, new.id, new.status,
    new.skill_hash, new.proposal, new.error
  );
  return new;
end;
$$;

drop trigger if exists sync_skill_run_from_terminal_job on public.skill_run_jobs;
create trigger sync_skill_run_from_terminal_job
after insert or update of status, skill_hash, proposal, error on public.skill_run_jobs
for each row
when (new.status in ('succeeded', 'failed', 'cancelled'))
execute function private.sync_skill_run_from_terminal_job();

create or replace function private.sync_new_skill_run_from_existing_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_job public.skill_run_jobs%rowtype;
begin
  if new.input_snapshot ->> 'jobId' is null then
    return new;
  end if;

  select *
    into existing_job
    from public.skill_run_jobs
   where id::text = new.input_snapshot ->> 'jobId'
     and workspace_id = new.workspace_id
     and project_id = new.project_id
     and skill_id = new.skill_id
     and status in ('succeeded', 'failed', 'cancelled');

  if not found then
    return new;
  end if;

  new.status := case existing_job.status
    when 'succeeded' then 'needs_review'
    when 'cancelled' then 'cancelled'
    else 'failed'
  end;
  if existing_job.status = 'succeeded' then
    new.skill_hash := coalesce(existing_job.skill_hash, new.skill_hash);
    new.proposal := coalesce(existing_job.proposal, new.proposal);
    new.error := null;
  else
    new.error := coalesce(existing_job.error ->> 'reason', 'Execução local terminou sem diagnóstico.');
  end if;
  return new;
end;
$$;

drop trigger if exists sync_new_skill_run_from_existing_job on public.skill_runs;
create trigger sync_new_skill_run_from_existing_job
before insert on public.skill_runs
for each row
execute function private.sync_new_skill_run_from_existing_job();

revoke all on function private.apply_skill_job_terminal_to_run(uuid, uuid, text, uuid, text, text, jsonb, jsonb) from public;
revoke all on function private.sync_skill_run_from_terminal_job() from public;
revoke all on function private.sync_new_skill_run_from_existing_job() from public;
