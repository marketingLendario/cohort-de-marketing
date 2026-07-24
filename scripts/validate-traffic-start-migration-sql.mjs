#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const STUDIO = process.env.AIOX_STUDIO_ROOT
  || join(process.cwd(), '../academia-lendaria-ads-studio');
const migrationPath = join(
  STUDIO,
  'apps/academia-lendaria-ads-studio/supabase/migrations/20260723170000_traffic_start_tenant_readback_v2.sql',
);
const schemaPath = join(
  STUDIO,
  'apps/academia-lendaria-ads-studio/supabase/migrations/20260717140000_ads_unit_economics.sql',
);

function fail(msg) {
  console.error(`validate-traffic-start-migration-sql: FAIL — ${msg}`);
  process.exit(1);
}

if (!existsSync(migrationPath)) fail(`migration ausente: ${migrationPath}`);
if (!existsSync(schemaPath)) fail(`schema ausente: ${schemaPath}`);

const migration = readFileSync(migrationPath, 'utf8');
const schema = readFileSync(schemaPath, 'utf8');

if (!schema.includes('campaign_id uuid primary key')) {
  fail('schema ads_unit_economics deve usar campaign_id como PK');
}
if (!schema.includes('computed_at timestamptz')) {
  fail('schema ads_unit_economics deve expor computed_at');
}
const ueBlock = migration.slice(migration.indexOf('insert into public.ads_unit_economics'));
if (ueBlock.includes('updated_at = now()')) {
  fail('UPSERT ads_unit_economics referencia updated_at inexistente');
}
if (migration.includes('returning id into v_ue_id')) {
  fail('migration usa returning id em ads_unit_economics');
}
if (!migration.includes('returning campaign_id into v_ue_id')) {
  fail('migration deve retornar campaign_id do UPSERT de ads_unit_economics');
}
if (!migration.includes('computed_at = now()')) {
  fail('migration deve atualizar computed_at no UPSERT de ads_unit_economics');
}
if (migration.includes('v_ue.id')) {
  fail('readback ainda referencia v_ue.id');
}
if (!migration.includes('v_ue.campaign_id')) {
  fail('readback deve usar v_ue.campaign_id');
}

console.log('validate-traffic-start-migration-sql: PASS');
