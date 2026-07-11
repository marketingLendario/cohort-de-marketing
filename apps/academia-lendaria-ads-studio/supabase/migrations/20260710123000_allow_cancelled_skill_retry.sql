-- A cancelled human-reviewed run can be retried through the local runner.
-- The browser only mirrors this non-terminal transition; the BFF remains the
-- authority for the durable job and terminal approval state.
create or replace function private.guard_authenticated_skill_run_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status = 'done' or new.proposal_hash is not null or new.proposal_revision <> 1 then
      raise exception 'authenticated cannot create a terminal or reviewed skill_run directly'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.status = 'done' then
    raise exception 'authenticated cannot set skill_run status to done directly'
      using errcode = '42501';
  end if;
  if new.proposal_hash is distinct from old.proposal_hash then
    raise exception 'authenticated cannot change skill_run proposal_hash directly'
      using errcode = '42501';
  end if;
  if new.proposal_revision is distinct from old.proposal_revision then
    raise exception 'authenticated cannot change skill_run proposal_revision directly'
      using errcode = '42501';
  end if;
  if old.status = 'needs_review' and new.proposal is distinct from old.proposal then
    raise exception 'authenticated must use the proposal review RPC while needs_review'
      using errcode = '42501';
  end if;
  if new.status is distinct from old.status and not (
    (old.status = 'queued' and new.status in ('running', 'failed', 'cancelled')) or
    (old.status = 'running' and new.status in ('needs_review', 'failed', 'cancelled')) or
    (old.status in ('failed', 'cancelled') and new.status = 'running')
  ) then
    raise exception 'authenticated cannot perform this skill_run status transition'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
