#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const STUDIO = process.env.AIOX_STUDIO_ROOT
  || join(process.cwd(), '../academia-lendaria-ads-studio');
const qa5Path = join(
  STUDIO,
  'apps/academia-lendaria-ads-studio/supabase/migrations/20260723200000_traffic_start_readback_qa5_fixes.sql',
);

function fail(msg) {
  console.error(`validate-traffic-start-migration-qa5: FAIL — ${msg}`);
  process.exit(1);
}

if (!existsSync(qa5Path)) fail(`migration QA5 ausente: ${qa5Path}`);
const sql = readFileSync(qa5Path, 'utf8');
if (!sql.includes("p_handoff->>'panelContent'")) fail('sync QA5 deve exigir panelContent');
if (!sql.includes('PANEL_HASH_MISMATCH')) fail('sync QA5 deve validar panelHash vs panelContent');
if (!sql.includes('extensions.digest')) fail('readback QA5 deve usar extensions.digest');
if (sql.includes("digest(coalesce(v_artifact.content")) fail('readback QA5 ainda usa digest() sem schema');
const artifactBlock = sql.split('insert into public.project_artifacts')[1] || '';
if (/coalesce\(p_handoff->>'insumosYaml'/.test(artifactBlock)) {
  fail('artifact QA5 nao deve persistir insumosYaml no lugar do painel');
}

console.log('validate-traffic-start-migration-qa5: PASS');
