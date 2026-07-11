import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { validatePilotPackage } from './validate-pilot-manifest.mjs';

const MANIFEST_PATH = join(process.cwd(), 'data/pilots/academia-lendaria-project.manifest.json');
const BRIEF_PATH = join(process.cwd(), 'data/pilots/academia-lendaria-project-brief.json');

function withTempFiles(mutator) {
  const dir = mkdtempSync(join(tmpdir(), 'academia-lendaria-pilot-'));
  try {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    const brief = JSON.parse(readFileSync(BRIEF_PATH, 'utf8'));
    mutator({ manifest, brief });
    const manifestPath = join(dir, 'manifest.json');
    const briefPath = join(dir, 'brief.json');
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    writeFileSync(briefPath, `${JSON.stringify(brief, null, 2)}\n`);
    return validatePilotPackage({ manifestPath, briefPath });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('pacote canônico passa na validação', () => {
  const result = validatePilotPackage({ manifestPath: MANIFEST_PATH, briefPath: BRIEF_PATH });
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('copy real da Aula 3 está congelada com path e hash autoritativos', () => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const copy = manifest.artifactManifest.find((artifact) => artifact.artifactType === 'copy');
  assert.equal(copy?.sourceId, 'src-copy-a3');
  assert.match(copy?.path ?? '', /aula3-live-copy-corpo\.md$/);
  assert.equal(copy?.sha256, 'b9eb1031bfe999091806ee6eb9f6b7a2be987f17f6b9c58eb2100ee505b07214');
});

test('detecta fonte ausente', () => {
  const result = withTempFiles(({ manifest }) => {
    manifest.sources[0].path = join(tmpdir(), 'fonte-que-nao-existe.md');
  });
  assert.equal(result.ok, false);
  assert(result.errors.some((error) => error.code === 'missing_source'));
});

test('detecta hash divergente', () => {
  const result = withTempFiles(({ manifest }) => {
    manifest.sources[0].sha256 = '0'.repeat(64);
  });
  assert.equal(result.ok, false);
  assert(result.errors.some((error) => error.code === 'hash_mismatch'));
});

test('detecta campo inventado no project brief', () => {
  const result = withTempFiles(({ brief }) => {
    brief.brand = { logoAsset: 'inventado-sem-fonte' };
  });
  assert.equal(result.ok, false);
  assert(result.errors.some((error) => error.code === 'invented_field'));
});
