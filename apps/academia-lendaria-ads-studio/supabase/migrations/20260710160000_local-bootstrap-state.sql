create schema if not exists private;

create table if not exists private.local_bootstrap_state (
  singleton boolean primary key default true check (singleton),
  status text not null default 'available' check (status in ('available', 'creating', 'complete')),
  claim_token uuid,
  owner_token uuid,
  user_id uuid,
  workspace_id uuid,
  lease_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

revoke all on private.local_bootstrap_state from public, anon, authenticated;

create or replace function public.get_local_bootstrap_state()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_state private.local_bootstrap_state%rowtype;
begin
  select * into current_state
    from private.local_bootstrap_state
    where singleton = true;
  if not found then return null; end if;
  return jsonb_strip_nulls(jsonb_build_object(
    'status', current_state.status,
    'claimToken', current_state.claim_token,
    'ownerToken', current_state.owner_token,
    'leaseExpiresAt', current_state.lease_expires_at
  ));
end;
$$;

create or replace function public.claim_local_bootstrap(
  p_desired_owner_token uuid,
  p_desired_claim_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_state private.local_bootstrap_state%rowtype;
  actual_claim_token uuid;
begin
  insert into private.local_bootstrap_state (singleton)
  values (true)
  on conflict (singleton) do nothing;

  select * into current_state
    from private.local_bootstrap_state
    where singleton = true
    for update;

  if current_state.status = 'complete' then
    return jsonb_build_object('claimed', false, 'reason', 'complete');
  end if;
  if current_state.status = 'creating' and current_state.lease_expires_at > now() then
    return jsonb_build_object('claimed', false, 'reason', 'busy');
  end if;

  actual_claim_token := case
    when current_state.status = 'creating' then current_state.claim_token
    else p_desired_claim_token
  end;

  update private.local_bootstrap_state
     set status = 'creating',
         claim_token = actual_claim_token,
         owner_token = p_desired_owner_token,
         user_id = null,
         workspace_id = null,
         lease_expires_at = now() + interval '60 seconds',
         updated_at = now()
   where singleton = true;

  return jsonb_strip_nulls(jsonb_build_object(
    'claimed', true,
    'claimToken', actual_claim_token,
    'ownerToken', p_desired_owner_token,
    'previousUserId', current_state.user_id,
    'previousWorkspaceId', current_state.workspace_id
  ));
end;
$$;

create or replace function public.record_local_bootstrap_progress(
  p_owner_token uuid,
  p_user_id uuid default null,
  p_workspace_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.local_bootstrap_state
     set user_id = coalesce(p_user_id, user_id),
         workspace_id = coalesce(p_workspace_id, workspace_id),
         lease_expires_at = now() + interval '60 seconds',
         updated_at = now()
   where singleton = true
     and status = 'creating'
     and owner_token = p_owner_token
     and lease_expires_at > now();
  return found;
end;
$$;

create or replace function public.renew_local_bootstrap(p_owner_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.local_bootstrap_state
     set lease_expires_at = now() + interval '60 seconds', updated_at = now()
   where singleton = true
     and status = 'creating'
     and owner_token = p_owner_token
     and lease_expires_at > now();
  return found;
end;
$$;

create or replace function public.complete_local_bootstrap(p_owner_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.local_bootstrap_state
     set status = 'complete', lease_expires_at = null, updated_at = now()
   where singleton = true
     and status = 'creating'
     and owner_token = p_owner_token
     and lease_expires_at > now();
  return found;
end;
$$;

create or replace function public.release_local_bootstrap(p_owner_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.local_bootstrap_state
     set status = 'available', claim_token = null, owner_token = null, user_id = null,
         workspace_id = null, lease_expires_at = null, updated_at = now()
   where singleton = true and status = 'creating' and owner_token = p_owner_token;
  return found;
end;
$$;

revoke all on function public.get_local_bootstrap_state() from public, anon, authenticated;
revoke all on function public.claim_local_bootstrap(uuid, uuid) from public, anon, authenticated;
revoke all on function public.record_local_bootstrap_progress(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.renew_local_bootstrap(uuid) from public, anon, authenticated;
revoke all on function public.complete_local_bootstrap(uuid) from public, anon, authenticated;
revoke all on function public.release_local_bootstrap(uuid) from public, anon, authenticated;

grant execute on function public.get_local_bootstrap_state() to service_role;
grant execute on function public.claim_local_bootstrap(uuid, uuid) to service_role;
grant execute on function public.record_local_bootstrap_progress(uuid, uuid, uuid) to service_role;
grant execute on function public.renew_local_bootstrap(uuid) to service_role;
grant execute on function public.complete_local_bootstrap(uuid) to service_role;
grant execute on function public.release_local_bootstrap(uuid) to service_role;
