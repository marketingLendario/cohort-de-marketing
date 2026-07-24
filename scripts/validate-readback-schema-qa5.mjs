#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = process.cwd();
const schema = JSON.parse(readFileSync(join(ROOT, 'data/contracts/iniciar-trafego/studio-readback.v1.schema.json'), 'utf8'));
const handoffSchema = JSON.parse(readFileSync(join(ROOT, 'data/contracts/iniciar-trafego/studio-handoff.v1.schema.json'), 'utf8'));

function fail(msg) {
  console.error(`validate-readback-schema-qa5: FAIL — ${msg}`);
  process.exit(1);
}

const requiredReadback = schema.required || [];
for (const key of ['campaignPlan', 'entityVersions']) {
  if (!requiredReadback.includes(key)) fail(`readback schema deve exigir ${key}`);
}
if (!(schema.properties?.hashes?.required || []).includes('artifactHash')) {
  fail('hashes.artifactHash deve ser required');
}
if (!(handoffSchema.required || []).includes('panelContent')) {
  fail('handoff schema deve exigir panelContent');
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const incomplete = {
  schemaVersion: '1.0.0',
  ok: true,
  receiptId: 'r12345678',
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
  hashes: { proposalHash: 'hash1234567890', panelHash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
  angles: [],
  economics: { ticket: 1, margem_pct: 1 },
};
if (validate(incomplete)) fail('schema deve rejeitar readback sem artifactHash/campaignPlan/entityVersions');

console.log('validate-readback-schema-qa5: PASS');
