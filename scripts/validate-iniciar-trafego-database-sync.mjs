#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const STUDIO = resolve(process.env.AIOX_STUDIO_ROOT || join(ROOT, '../academia-lendaria-ads-studio'));
const MIGRATION = join(
  STUDIO,
  'apps/academia-lendaria-ads-studio/supabase/migrations/20260724010000_traffic_start_source_identity.sql',
);

function fail(message) {
  console.error(`validate-iniciar-trafego-database-sync: FAIL — ${message}`);
  process.exit(1);
}

function requireAll(text, patterns, label) {
  for (const pattern of patterns) {
    if (!pattern.test(text)) fail(`${label}: padrão ausente ${pattern}`);
  }
}

if (process.argv.includes('--self-test')) {
  const missing = [/alpha/, /beta/].filter((pattern) => !pattern.test('alpha'));
  if (missing.length !== 1 || missing[0].source !== 'beta') fail('self-test do detector de padrões falhou');
  console.log('validate-iniciar-trafego-database-sync: SELF-TEST PASS');
  process.exit(0);
}

if (!existsSync(MIGRATION)) fail(`migration aditiva ausente: ${MIGRATION}`);
const sql = readFileSync(MIGRATION, 'utf8');
requireAll(sql, [
  /add column if not exists source_project_id text/,
  /on public\.marketing_projects \(workspace_id, source_project_id\)/,
  /drop constraint if exists marketing_projects_workspace_id_slug_key/,
  /on public\.traffic_start_receipts \(source_project_id, proposal_id, proposal_hash\)/,
  /where source_project_id = p_handoff->>'sourceProjectId'[\s\S]+proposal_id = p_handoff->>'proposalId'[\s\S]+proposal_hash = p_handoff->>'proposalHash'/,
  /v_deep_link := 'http:\/\/127\.0\.0\.1:5177\/projects\/' \|\| v_project_id::text/,
  /'panelHash', v_panel_hash/,
  /'artifactHash', v_artifact_hash/,
  /'entityVersions', v_versions/,
], 'migration');

const core = sql.split('create or replace function private.traffic_start_sync_core')[1]?.split('revoke all on function')[0] || '';
const tables = [...core.matchAll(/insert into public\.([a-z_]+)/g)].map((match) => match[1]);
const expectedTables = [
  'marketing_projects',
  'project_brief_revisions',
  'ads_campaigns',
  'campaign_plan_revisions',
  'ads_unit_economics',
  'project_artifacts',
  'traffic_start_receipts',
];
if (JSON.stringify(tables) !== JSON.stringify(expectedTables)) {
  fail(`transação não escreve exatamente as sete relações: ${tables.join(', ')}`);
}
requireAll(core, [
  /'insumosYaml', coalesce\(p_handoff->>'insumosYaml', ''\)/,
  /'iniciar-trafego', v_panel_content/,
  /'entities', v_entities/,
  /'entityVersions', v_versions/,
], 'sync core');

const schema = JSON.parse(readFileSync(
  join(ROOT, 'data/contracts/iniciar-trafego/studio-readback.v1.schema.json'),
  'utf8',
));
for (const field of [
  'proposalId',
  'sourceProjectId',
  'sourceProjectSlug',
  'panelPath',
  'panelContent',
  'angleCount',
  'publishedUrl',
  'insumosYaml',
  'deepLink',
  'entities',
  'hashes',
  'angles',
  'economics',
  'campaignPlan',
  'entityVersions',
]) {
  if (!schema.required?.includes(field)) fail(`schema readback não exige ${field}`);
}

const client = readFileSync(join(ROOT, 'scripts/lib/iniciar-trafego/studio-sync-client.mjs'), 'utf8');
if (client.indexOf('validateStudioReadback(body)') > client.lastIndexOf('return body')) {
  fail('schema deve ser validado antes de retornar o readback');
}
const flow = readFileSync(join(ROOT, 'scripts/iniciar-trafego.mjs'), 'utf8');
const readbackAt = flow.indexOf('readback = await readbackTrafficStart');
const compareAt = flow.indexOf('const cmp = compareReadbackToHandoff');
const writeAt = flow.indexOf('panelPath = writeCanonicalPanel');
if (!(readbackAt >= 0 && compareAt > readbackAt && writeAt > compareAt)) {
  fail('painel deve ser promovido somente após readback e comparação');
}
if (/readback\?\.entities\?\.artifactIds/.test(flow)) {
  fail('observado ainda alimenta o expected de artifactIds');
}

const test = spawnSync(
  process.execPath,
  ['--test', 'scripts/lib/iniciar-trafego/readback-compare.test.mjs'],
  { cwd: ROOT, encoding: 'utf8' },
);
if (test.status !== 0) fail(`mutation tests falharam:\n${test.stdout}\n${test.stderr}`);

console.log('validate-iniciar-trafego-database-sync: PASS (migration + schema + mutation matrix + promotion order)');
