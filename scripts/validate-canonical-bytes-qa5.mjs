#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashPanelContent, writeCanonicalPanel } from './lib/iniciar-trafego-gates.mjs';
import { compareReadbackToHandoff } from './lib/iniciar-trafego/readback-compare.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

function fail(msg) {
  console.error(`validate-canonical-bytes-qa5: FAIL — ${msg}`);
  process.exit(1);
}

const trafego = readFileSync(join(process.cwd(), 'scripts/iniciar-trafego.mjs'), 'utf8');
if (!trafego.includes('panelContent: staged.content')) fail('handoff deve incluir panelContent');
if (!trafego.includes('writeCanonicalPanel')) fail('approve deve gravar bytes canonicos');
if (!trafego.includes('finalPanelHash !== panelHash')) fail('approve deve fail-closed panelHash final');

const content = 'canonical:\n  bytes: true\n';
const hash = hashPanelContent(content);
const dir = mkdtempSync(join(tmpdir(), 'qa5-panel-'));
try {
  const path = writeCanonicalPanel(dir, 'trafego/PAINEL-DA-SEMANA.yaml', content);
  const written = readFileSync(path, 'utf8');
  if (hashPanelContent(written) !== hash) fail('writeCanonicalPanel alterou hash');

  const handoff = {
    panelHash: hash,
    panelContent: content,
    campaignPlan: { panelPath: 'trafego/PAINEL-DA-SEMANA.yaml' },
    entityVersions: { briefRevision: 1 },
  };
  const readback = {
    ok: true,
    schemaVersion: '1.0.0',
    receiptId: 'r1',
    sourceProjectSlug: 'x',
    deepLink: 'http://127.0.0.1:5177/projects/x',
    entities: {
      marketingProjectId: '1',
      briefRevisionId: '2',
      campaignId: '3',
      campaignPlanRevisionId: '4',
      unitEconomicsId: '3',
      artifactIds: ['5'],
    },
    hashes: { proposalHash: 'p', panelHash: hash, artifactHash: hash },
    panelContent: content,
    angles: [],
    economics: { ticket: 1, margem_pct: 1 },
    campaignPlan: handoff.campaignPlan,
    entityVersions: handoff.entityVersions,
  };
  assert.equal(compareReadbackToHandoff(handoff, readback).ok, true);
  const bad = structuredClone(readback);
  bad.hashes.artifactHash = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
  assert.equal(compareReadbackToHandoff(handoff, bad).ok, false);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log('validate-canonical-bytes-qa5: PASS');
