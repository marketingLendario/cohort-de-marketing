#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareReadbackToHandoff } from './lib/iniciar-trafego/readback-compare.mjs';
import { buildStagedPanelContent, hashPanelContent } from './lib/iniciar-trafego-gates.mjs';

const ROOT = process.cwd();

function fail(msg) {
  console.error(`validate-iniciar-trafego-studio-journey: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

const required = [
  'scripts/iniciar-trafego.mjs',
  'scripts/iniciar-studio.mjs',
  'scripts/lib/iniciar-trafego/studio-sync-client.mjs',
  'scripts/lib/iniciar-trafego/readback-compare.mjs',
  'scripts/lib/iniciar-trafego/contract-validate.mjs',
  'scripts/lib/iniciar-studio/coordinator.mjs',
];

for (const rel of required) {
  if (!existsSync(join(ROOT, rel))) fail(`arquivo ausente: ${rel}`);
}
ok('artefatos de jornada presentes');

const syncClient = read('scripts/lib/iniciar-trafego/studio-sync-client.mjs');
if (!/const config = effectiveConfig\(\)/.test(syncClient) || !/ensureStudioReady/.test(syncClient)) {
  fail('syncTrafficStart não re-resolve config após ensure');
}
ok('token fresco após ensureStudioReady');

const trafego = read('scripts/iniciar-trafego.mjs');
if (!/buildStagedPanelContent/.test(trafego) || !/hashPanelContent/.test(trafego)) {
  fail('approve não faz staging de panelHash real');
}
if (!/beforePost/.test(trafego) || !/beforePost:\s*\(\)/.test(trafego)) {
  fail('approve não recheca STALE pos-ensure imediatamente antes do POST');
}
ok('panelHash staging + stale recheck pos-ensure');

const studioCli = read('scripts/iniciar-studio.mjs');
if (studioCli.includes('process.cwd()')) {
  fail('ensure ainda aceita fallback process.cwd() sem --project');
}
ok('ensure exige --project explicito');

const cmp = compareReadbackToHandoff(
  {
    proposalId: 'p1',
    proposalHash: 'hash123456789012',
    panelHash: 'panelhash1234567890',
    sourceProjectId: 'src-1',
    sourceProjectSlug: 'demo',
    publishedUrl: 'https://demo.example/v',
    panelPath: 'trafego/PAINEL-DA-SEMANA.yaml',
    angles: [{ nome: 'a1' }],
  },
  {
    ok: true,
    schemaVersion: '1.0.0',
    proposalId: 'wrong',
    sourceProjectId: 'src-1',
    sourceProjectSlug: 'demo',
    publishedUrl: 'https://demo.example/v',
    panelPath: 'trafego/PAINEL-DA-SEMANA.yaml',
    angleCount: 1,
    entities: {
      marketingProjectId: 'mp',
      briefRevisionId: 'br',
      campaignId: 'c',
      campaignPlanRevisionId: 'pr',
      unitEconomicsId: 'ue',
      artifactIds: ['art'],
    },
    hashes: { proposalHash: 'hash123456789012', panelHash: 'panelhash1234567890' },
  },
);
if (cmp.ok) fail('readback divergente de proposalId deveria falhar');
ok('readback-compare rejeita proposalId divergente');

console.log('validate-iniciar-trafego-studio-journey: PASS');
