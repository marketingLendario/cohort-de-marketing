#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const STUDIO = process.env.AIOX_STUDIO_ROOT || join(ROOT, '../academia-lendaria-ads-studio');

function fail(msg) {
  console.error(`validate-iniciar-trafego-studio: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function readStudio(rel) {
  return readFileSync(join(STUDIO, rel), 'utf8');
}

const required = [
  '.claude/skills/iniciar-studio/SKILL.md',
  '.agents/skills/iniciar-studio/SKILL.md',
  'scripts/iniciar-studio.mjs',
  'scripts/lib/iniciar-studio/coordinator.mjs',
  'data/studio-distribution.json',
  'data/contracts/iniciar-trafego/sync-intent.v1.schema.json',
  'data/contracts/iniciar-trafego/studio-domain-readback.v1.schema.json',
  'data/contracts/iniciar-studio/index.json',
  'data/auto-rules/iniciar-trafego-iniciar-studio.rules.yaml',
];

for (const rel of required) {
  if (!existsSync(join(ROOT, rel))) fail(`arquivo ausente: ${rel}`);
}
ok('artefatos cohort iniciar-studio presentes');

const connection = read('scripts/lib/iniciar-trafego/studio-connection.mjs');
if (!connection.includes("healthPath: '/healthz'")) fail('healthPath ainda nao alinhado em /healthz');
ok('healthPath /healthz');

const trafego = read('scripts/iniciar-trafego.mjs');
if (!trafego.includes('buildStagedPanelContent(project, ROOT, record)')) fail('staging canonico ausente');
if (!trafego.includes('writeCanonicalPanel(project, handoff.panelPath, staged.content)')) fail('writeCanonicalPanel ausente');
const readbackCallIdx = trafego.indexOf('readback = await readbackTrafficStart');
const panelIdx = trafego.indexOf('panelPath = writeCanonicalPanel');
if (readbackCallIdx === -1 || panelIdx === -1 || panelIdx < readbackCallIdx) {
  fail('painel ainda promovido antes do readback verificado');
}
ok('painel promovido apos sync/readback');

const skill = read('.claude/skills/iniciar-trafego/SKILL.md');
if (/digite.*\/iniciar-studio|rode.*\/iniciar-studio/i.test(skill)) {
  fail('skill iniciar-trafego instrui aluno a rodar /iniciar-studio');
}
ok('skill iniciar-trafego sem segundo comando ao aluno');

const launcher = readStudio('scripts/marketing-studio.mjs');
if (!launcher.includes("profile: 'traffic-sync'") && !launcher.includes('profile === \'traffic-sync\'')) {
  fail('marketing-studio sem profile traffic-sync');
}
ok('launcher com profile traffic-sync');

const migration = join(STUDIO, 'apps/academia-lendaria-ads-studio/supabase/migrations/20260724010000_traffic_start_source_identity.sql');
if (!existsSync(migration)) fail('migration aditiva de identidade ausente');
ok('migration aditiva de identidade presente');

const platformIndex = read('scripts/lib/iniciar-studio/platform/index.mjs');
if (platformIndex.includes('./platform/win32.mjs')) {
  fail('platform/index.mjs ainda importa ./platform/* (path duplicado)');
}
ok('platform adapters importaveis');

const readbackCompare = read('scripts/lib/iniciar-trafego/readback-compare.mjs');
if (!readbackCompare.includes('compareReadbackToHandoff')) {
  fail('readback-compare ausente');
}
ok('readback comparativo presente');

const studioContracts = JSON.parse(read('data/contracts/iniciar-studio/index.json'));
if (studioContracts.contracts.length !== 7) {
  fail(`iniciar-studio registry esperava 7 contratos, tem ${studioContracts.contracts.length}`);
}
ok('7 contratos iniciar-studio registrados');

const catalog = read('data/skill-catalog.json');
if (!catalog.includes('"id": "iniciar-studio"')) fail('catalog sem iniciar-studio');
ok('catalog registra iniciar-studio');

console.log('validate-iniciar-trafego-studio: PASS');
