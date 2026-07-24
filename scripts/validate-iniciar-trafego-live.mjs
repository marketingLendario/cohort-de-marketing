#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { hashPanelContent } from './lib/iniciar-trafego-gates.mjs';
import { compareReadbackToHandoff } from './lib/iniciar-trafego/readback-compare.mjs';
import { readbackTrafficStart, syncTrafficStart } from './lib/iniciar-trafego/studio-sync-client.mjs';

const project = mkdtempSync(join(tmpdir(), 'traffic-live-'));
const suffix = Date.now().toString(36);
const panelContent = `insumos_a2:
  angulos:
    - nome: Live ${suffix}
projecao:
  ticket: 197
`;
const angle = {
  nome: `Live ${suffix}`,
  dor: 'Prova live isolada',
  nivel_consciencia: 'consciente_do_problema',
  locator: 'copy.md#live',
  sourceHash: 'a'.repeat(64),
};
const secondAngle = {
  ...angle,
  nome: `Live alternativa ${suffix}`,
  locator: 'copy.md#live-2',
};
const handoff = {
  schemaVersion: '1.0.0',
  sourceProjectId: `live-project-${suffix}`,
  sourceProjectSlug: 'live-project',
  proposalId: `live-proposal-${suffix}`,
  proposalHash: 'b'.repeat(64),
  panelPath: 'trafego/PAINEL-DA-SEMANA.yaml',
  panelHash: hashPanelContent(panelContent),
  panelContent,
  angles: [angle, secondAngle],
  insumosYaml: `insumos_a2:\n  source: live-${suffix}\n`,
  economics: { ticket: 197, margem_pct: 40 },
  publishedUrl: 'https://example.com/live',
  campaignPlan: { mode: 'direct_checkout', angle: angle.nome },
};

try {
  const receipt = await syncTrafficStart(handoff, project);
  assert.ok(receipt.receiptId);
  assert.ok(receipt.entities?.marketingProjectId);
  assert.ok(receipt.entityVersions);

  const expected = structuredClone(receipt);
  const readback = await readbackTrafficStart(receipt.receiptId);
  const expectedHandoff = {
    ...handoff,
    receiptArtifactId: receipt.entities.artifactIds[0],
    entityVersions: receipt.entityVersions,
  };
  const compared = compareReadbackToHandoff(expectedHandoff, readback, expected);
  assert.equal(compared.ok, true, compared.errors.join('; '));
  assert.notEqual(readback.panelContent, readback.insumosYaml);

  const replay = await syncTrafficStart(handoff, project);
  assert.equal(replay.receiptId, receipt.receiptId);
  assert.deepEqual(replay.entities, receipt.entities);
  assert.deepEqual(replay.entityVersions, receipt.entityVersions);

  const mutations = [
    (value) => { value.hashes.panelHash = '0'.repeat(64); },
    (value) => { value.publishedUrl = 'https://example.com/mutated'; },
    (value) => { value.economics.ticket = 999; },
    (value) => { value.sourceProjectId = 'mutated-project'; },
    (value) => { value.entityVersions.briefRevision += 1; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(readback);
    mutate(changed);
    assert.equal(compareReadbackToHandoff(expectedHandoff, changed, expected).ok, false);
  }

  console.log(JSON.stringify({
    validator: 'validate-iniciar-trafego-live',
    status: 'PASS',
    receiptId: receipt.receiptId,
    marketingProjectId: receipt.entities.marketingProjectId,
    idempotentReplay: true,
    mutationTests: mutations.length,
  }));
} finally {
  rmSync(project, { recursive: true, force: true });
}
