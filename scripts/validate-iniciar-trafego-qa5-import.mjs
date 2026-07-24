#!/usr/bin/env node
import { validateStudioHandoff, validateStudioReadback } from './lib/iniciar-trafego/contract-validate.mjs';
import { hashPanelContent } from './lib/iniciar-trafego-gates.mjs';

function fail(msg) {
  console.error(`validate-iniciar-trafego-qa5-import: FAIL — ${msg}`);
  process.exit(1);
}

const panelContent = `insumos_a2:
  angulos:
    - nome: "a1"
      dor: "d1"
    - nome: "a2"
      dor: "d2"
projecao:
  ticket: 97
  margem_pct: 40
`;

const handoff = {
  schemaVersion: '1.0.0',
  sourceProjectId: 'proj12345678',
  sourceProjectSlug: 'forja',
  proposalId: 'prop12345678',
  proposalHash: 'hash1234567890123456',
  panelPath: 'trafego/PAINEL-DA-SEMANA.yaml',
  panelHash: hashPanelContent(panelContent),
  panelContent,
  angles: [
    { nome: 'a1', dor: 'd1', nivel_consciencia: '3', locator: 'L1', sourceHash: 'src11111111' },
    { nome: 'a2', dor: 'd2', nivel_consciencia: '3', locator: 'L2', sourceHash: 'src22222222' },
  ],
  economics: { ticket: 97, margem_pct: 40 },
  publishedUrl: 'https://example.com/page',
  campaignPlan: { panelPath: 'trafego/PAINEL-DA-SEMANA.yaml', angles: [] },
};

const readback = {
  schemaVersion: '1.0.0',
  ok: true,
  receiptId: 'ts_proj12345678_prop12345678_hash12',
  proposalId: handoff.proposalId,
  sourceProjectId: handoff.sourceProjectId,
  sourceProjectSlug: 'forja',
  panelPath: handoff.panelPath,
  panelContent,
  angleCount: handoff.angles.length,
  publishedUrl: handoff.publishedUrl,
  insumosYaml: '',
  deepLink: 'http://127.0.0.1:5177/projects/mp-1?receipt=ts',
  entities: {
    marketingProjectId: 'mp-1',
    briefRevisionId: 'br-1',
    campaignId: 'c-1',
    campaignPlanRevisionId: 'cpr-1',
    unitEconomicsId: 'c-1',
    artifactIds: ['art-1'],
  },
  hashes: {
    proposalHash: 'hash1234567890123456',
    panelHash: hashPanelContent(panelContent),
    artifactHash: hashPanelContent(panelContent),
  },
  angles: handoff.angles,
  economics: { ticket: 97, margem_pct: 40 },
  campaignPlan: handoff.campaignPlan,
  entityVersions: { briefRevision: 1, campaignPlanRevision: 1 },
};

try {
  await import('./lib/iniciar-trafego/studio-sync-client.mjs');
  validateStudioHandoff(handoff);
  validateStudioReadback(readback);
} catch (e) {
  fail(e.message || String(e));
}

console.log('validate-iniciar-trafego-qa5-import: PASS');
