#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { buildCanonicalInput } from './lib/iniciar-trafego/semantic-bridge.mjs';

const ROOT = process.cwd();
const forjaRoot = resolve(ROOT, 'projetos/forja');
const noAzulRoot = resolve(ROOT, 'projetos/no-azul');
const forja = buildCanonicalInput(forjaRoot).canonical;
const noAzul = buildCanonicalInput(noAzulRoot).canonical;

assert.equal(forja.schemaVersion, '2.0.0');
assert.equal(forja.conversionMode, 'application_call');
assert.equal(forja.fields.awareness.value, 'consciente_do_problema');
assert.match(forja.fields.awareness.locator.value, /N[ií]vel\s*4/i);
assert.equal(noAzul.conversionMode, 'direct_checkout');
assert.equal(noAzul.economics.ticket, 147);
assert.equal(noAzul.economics.margem_pct, null);
assert.equal(noAzul.fields.marginPct, null);

for (const canonical of [forja, noAzul]) {
  for (const field of Object.values(canonical.fields)) {
    if (field === null) continue;
    assert.equal(typeof field.sourceArtifactId, 'string');
    assert.equal(field.sourceHash.length, 64);
    assert.equal(typeof field.sourcePath, 'string');
    assert.equal(typeof field.locator.value, 'string');
  }
}

const firstHash = Object.values(forja.sourceHashes)[0];
const receipt = {
  schemaVersion: '1.0.0',
  approved: true,
  fields: [{
    field: 'profile.summary',
    value: 'síntese aprovada',
    sourceArtifactId: forja.fields.avatar.sourceArtifactId,
    sourceHash: firstHash,
    locator: { type: 'text', value: 'trecho aprovado' },
  }],
};
const withReceipt = buildCanonicalInput(forjaRoot, { semanticReceipt: receipt }).canonical;
assert.equal(withReceipt.semanticReceipt.approved, true);
assert.equal(withReceipt.semanticReceipt.receiptHash.length, 64);
assert.throws(
  () => buildCanonicalInput(forjaRoot, {
    semanticReceipt: {
      ...receipt,
      fields: [{ ...receipt.fields[0], sourceHash: '0'.repeat(64) }],
    },
  }),
  /SEMANTIC_RECEIPT_STALE/,
);

const stale = buildCanonicalInput(forjaRoot, {
  previousCanonical: { sourceHashes: { ...forja.sourceHashes, copy: '0'.repeat(64) } },
}).canonical;
assert.equal(stale.stale, true);
assert.equal(stale.staleReason, 'SOURCE_HASH_CHANGED');

const schema = JSON.parse(readFileSync(
  resolve(ROOT, 'data/contracts/iniciar-trafego/canonical-traffic-input.v2.schema.json'),
  'utf8',
));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
assert.equal(validate(forja), true, JSON.stringify(validate.errors));
assert.equal(validate(noAzul), true, JSON.stringify(validate.errors));

console.log('validate-iniciar-trafego-semantic-bridge: PASS (A1-A2 + evidence + receipt + stale)');
