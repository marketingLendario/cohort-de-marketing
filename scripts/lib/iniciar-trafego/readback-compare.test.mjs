import test from 'node:test';
import assert from 'node:assert/strict';
import { compareReadbackToHandoff, compareAngles, ANGLE_FIELD_KEYS } from './readback-compare.mjs';

const canonicalAngle = {
  nome: 'Angulo principal',
  dor: 'Dor canonica',
  nivel_consciencia: '3',
  locator: 'L1',
  sourceHash: 'srcHash01',
};

const baseHandoff = {
  proposalId: 'prop-1',
  proposalHash: 'hash-prop-aaaaaaaa',
  sourceProjectId: 'proj-1',
  sourceProjectSlug: 'forja',
  panelPath: 'trafego/PAINEL-DA-SEMANA.yaml',
  panelHash: 'hash-panel-bbbbbbbbbbbbbbbb',
  panelContent: 'painel:\r\n  semana: 1\r\n',
  publishedUrl: 'https://example.com/page',
  angles: [canonicalAngle],
  insumosYaml: 'yaml: true',
  economics: { ticket: 97, margem_pct: 40 },
  receiptArtifactId: 'art-1',
  campaignPlan: { panelPath: 'trafego/PAINEL-DA-SEMANA.yaml', angles: [canonicalAngle] },
  entityVersions: { briefRevision: 1, campaignPlanRevision: 1 },
};

const baseReadback = {
  ok: true,
  schemaVersion: '1.0.0',
  receiptId: 'ts_proj-1_prop-1_hash-pr',
  proposalId: 'prop-1',
  sourceProjectId: 'proj-1',
  sourceProjectSlug: 'forja',
  panelPath: 'trafego/PAINEL-DA-SEMANA.yaml',
  angleCount: 1,
  publishedUrl: 'https://example.com/page',
  deepLink: 'http://127.0.0.1:5177/projects/mp-1?receipt=ts_proj-1',
  panelContent: 'painel:\n  semana: 1\n',
  angles: [structuredClone(canonicalAngle)],
  insumosYaml: 'yaml: true',
  economics: { ticket: 97, margem_pct: 40 },
  campaignPlan: { panelPath: 'trafego/PAINEL-DA-SEMANA.yaml', angles: [structuredClone(canonicalAngle)] },
  entityVersions: { briefRevision: 1, campaignPlanRevision: 1 },
  entities: {
    marketingProjectId: 'mp-1',
    briefRevisionId: 'br-1',
    campaignId: 'c-1',
    campaignPlanRevisionId: 'cpr-1',
    unitEconomicsId: 'c-1',
    artifactIds: ['art-1'],
  },
  hashes: {
    proposalHash: 'hash-prop-aaaaaaaa',
    panelHash: 'hash-panel-bbbbbbbbbbbbbbbb',
    artifactHash: 'hash-panel-bbbbbbbbbbbbbbbb',
  },
};

const baseReceipt = {
  receiptId: baseReadback.receiptId,
  deepLink: baseReadback.deepLink,
  entities: structuredClone(baseReadback.entities),
  entityVersions: structuredClone(baseReadback.entityVersions),
};

function setPath(target, path, value) {
  const parts = path.split('.');
  let cursor = target;
  for (const part of parts.slice(0, -1)) cursor = cursor[part];
  cursor[parts.at(-1)] = value;
}

test('compareReadbackToHandoff aceita dominio identico (shape canonica)', () => {
  const result = compareReadbackToHandoff(baseHandoff, baseReadback);
  assert.equal(result.ok, true, result.errors.join('; '));
});

test('compareReadbackToHandoff rejeita panelHash ausente', () => {
  const readback = structuredClone(baseReadback);
  delete readback.hashes.panelHash;
  const result = compareReadbackToHandoff(baseHandoff, readback);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /panelHash/);
});

test('compareReadbackToHandoff rejeita deepLink ausente', () => {
  const readback = structuredClone(baseReadback);
  delete readback.deepLink;
  const result = compareReadbackToHandoff(baseHandoff, readback);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /deepLink/);
});

test('compareReadbackToHandoff rejeita deepLink que nao aponta ao UUID real', () => {
  const readback = structuredClone(baseReadback);
  readback.deepLink = 'http://127.0.0.1:5177/projects/outro';
  const result = compareReadbackToHandoff(baseHandoff, readback);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /marketingProjectId/);
});

test('compareReadbackToHandoff normaliza CRLF sem alterar o conteudo', () => {
  const result = compareReadbackToHandoff(baseHandoff, baseReadback);
  assert.equal(result.ok, true, result.errors.join('; '));
});

for (const field of ['panelContent', 'insumosYaml']) {
  test(`compareReadbackToHandoff rejeita mutacao isolada em ${field}`, () => {
    const readback = structuredClone(baseReadback);
    readback[field] = `${readback[field]}\nmutado`;
    const result = compareReadbackToHandoff(baseHandoff, readback);
    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), new RegExp(field));
  });
}

test('compareReadbackToHandoff rejeita economics divergente', () => {
  const readback = structuredClone(baseReadback);
  readback.economics.margem_pct = 1;
  const result = compareReadbackToHandoff(baseHandoff, readback);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /economics/);
});

for (const key of ANGLE_FIELD_KEYS) {
  test(`compareAngles rejeita mutacao em ${key}`, () => {
    const handoffAngles = [structuredClone(canonicalAngle)];
    const readbackAngles = [structuredClone(canonicalAngle)];
    readbackAngles[0][key] = `${readbackAngles[0][key]}-mutado`;
    const err = compareAngles(handoffAngles, readbackAngles);
    assert.ok(err, `esperava erro para ${key}`);
    assert.match(err, new RegExp(key));
  });
}

for (const field of ['artifactHash', 'campaignPlan', 'entityVersions']) {
  test(`compareReadbackToHandoff rejeita omissao de ${field}`, () => {
    const readback = structuredClone(baseReadback);
    if (field === 'artifactHash') delete readback.hashes.artifactHash;
    else delete readback[field];
    const result = compareReadbackToHandoff(baseHandoff, readback);
    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), new RegExp(field.replace('Hash', 'Hash|artifactHash'), 'i'));
  });
}

for (const mutation of [
  ['receiptId', (value) => { value.receiptId = 'ts-outro'; }],
  ['deepLink', (value) => { value.deepLink = 'http://127.0.0.1:5177/projects/mp-outro'; }],
  ['marketingProjectId', (value) => { value.entities.marketingProjectId = 'mp-outro'; }],
  ['artifactIds', (value) => { value.entities.artifactIds = ['art-outro']; }],
  ['entityVersions', (value) => { value.entityVersions.briefRevision = 2; }],
]) {
  test(`compareReadbackToHandoff rejeita observado mutado em ${mutation[0]} contra receipt imutavel`, () => {
    const readback = structuredClone(baseReadback);
    mutation[1](readback);
    const result = compareReadbackToHandoff(baseHandoff, readback, baseReceipt);
    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), new RegExp(mutation[0], 'i'));
  });
}

for (const [path, value] of [
  ['ok', false],
  ['schemaVersion', '9.0.0'],
  ['proposalId', 'prop-outro'],
  ['sourceProjectId', 'proj-outro'],
  ['sourceProjectSlug', 'slug-outro'],
  ['panelPath', 'trafego/outro.yaml'],
  ['angleCount', 2],
  ['publishedUrl', 'https://example.com/outra'],
  ['hashes.proposalHash', 'hash-prop-mutado'],
  ['hashes.panelHash', 'hash-panel-mutado'],
  ['hashes.artifactHash', 'hash-artifact-mutado'],
  ['economics.ticket', 999],
  ['economics.margem_pct', 99],
]) {
  test(`compareReadbackToHandoff rejeita mutacao isolada em ${path}`, () => {
    const readback = structuredClone(baseReadback);
    setPath(readback, path, value);
    const result = compareReadbackToHandoff(baseHandoff, readback, baseReceipt);
    assert.equal(result.ok, false, `mutacao passou: ${path}`);
  });
}
