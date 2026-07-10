begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

select has_table(
  'private'::name,
  'local_bootstrap_state'::name,
  'estado durável do bootstrap existe fora da API pública'
);

set local role service_role;

select ok(
  (public.claim_local_bootstrap(
    '90000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000001'
  )->>'claimed')::boolean,
  'primeiro processo adquire o claim'
);

select is(
  (public.claim_local_bootstrap(
    '90000000-0000-0000-0000-000000000002',
    '91000000-0000-0000-0000-000000000002'
  )->>'claimed')::boolean,
  false,
  'segundo processo não atravessa o lease ativo'
);

reset role;
update private.local_bootstrap_state set lease_expires_at = now() - interval '1 second';
set local role service_role;

select is(
  public.claim_local_bootstrap(
    '90000000-0000-0000-0000-000000000002',
    '91000000-0000-0000-0000-000000000002'
  )->>'claimToken',
  '91000000-0000-0000-0000-000000000001',
  'retomada preserva o claim anterior para reconciliar recursos órfãos'
);

select ok(
  public.renew_local_bootstrap('90000000-0000-0000-0000-000000000002'),
  'owner atual renova o lease durante operações externas'
);

select ok(
  not public.record_local_bootstrap_progress(
    '90000000-0000-0000-0000-000000000001',
    '92000000-0000-0000-0000-000000000009',
    null
  ),
  'owner expirado não altera o claim retomado'
);

select ok(
  public.record_local_bootstrap_progress(
    '90000000-0000-0000-0000-000000000002',
    '92000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000001'
  ),
  'progresso só é gravado pelo claim proprietário'
);

select ok(
  public.complete_local_bootstrap('90000000-0000-0000-0000-000000000002'),
  'claim proprietário conclui o bootstrap'
);

select is(
  (public.claim_local_bootstrap(
    '90000000-0000-0000-0000-000000000003',
    '91000000-0000-0000-0000-000000000003'
  )->>'claimed')::boolean,
  false,
  'bootstrap completo permanece fechado de forma durável'
);

select * from finish();
rollback;
