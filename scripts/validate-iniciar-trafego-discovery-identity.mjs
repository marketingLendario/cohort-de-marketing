#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  candidateIdForRoot,
  discoverProjects,
  portable,
  resolveProjectFromArgs,
  scanErrorNote,
} from './lib/iniciar-trafego/project-discovery.mjs';
import {
  findProjectIdCollisions,
  loadRegistry,
  registerProject,
  resolveRegisteredRoot,
} from './lib/iniciar-trafego/project-registry.mjs';
import { ensureManifest, readManifest, writeManifest } from './lib/iniciar-trafego/project-context.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'iniciar-trafego-discovery-'));

function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function write(path, content = '# fixture\n') {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

function fixtureProject(root, markers = ['funil.md']) {
  mkdirSync(root, { recursive: true });
  for (const marker of markers) write(join(root, marker));
}

function config(cohortRoot) {
  write(
    join(cohortRoot, 'data/iniciar-trafego/project-discovery.json'),
    `${JSON.stringify({
      schemaVersion: '1.0.0',
      scanRoots: ['projetos', 'espalhados'],
      excludeDirNames: ['.git', '.aiox', '_interno', 'node_modules', 'fixtures', 'templates', 'examples'],
      excludePathSegments: ['mapa-skills-samples/academia-fit'],
      maxDepth: 3,
      sampleRoots: ['mapa-skills-samples'],
    }, null, 2)}\n`,
  );
}

try {
  config(temp);
  const one = join(temp, 'projetos', 'mesmo-slug');
  const two = join(temp, 'espalhados', 'nivel-1', 'mesmo-slug');
  const incomplete = join(temp, 'espalhados', 'incompleto');
  const ignored = join(temp, 'fixtures', 'fake');
  fixtureProject(one, ['funil.md', 'copy.md']);
  fixtureProject(two, ['offerbook-outro.md']);
  fixtureProject(incomplete, ['copy.md']);
  fixtureProject(ignored, ['funil.md']);

  const before = existsSync(join(temp, '.aiox'));
  const discovered = discoverProjects({ cohortRoot: temp });
  assert.equal(before, false);
  assert.equal(existsSync(join(temp, '.aiox')), false, 'discover não pode escrever estado');
  assert.equal(discovered.candidates.filter((item) => !item.excluded).length, 3);
  assert.equal(discovered.candidates.some((item) => item.root === ignored), false);
  assert.equal(discovered.candidates.find((item) => item.root === incomplete)?.completeness > 0, true);
  assert.notEqual(candidateIdForRoot(one), candidateIdForRoot(two));
  assert.equal(portable('C:\\Projetos\\Projeto Com Espaço').includes('Projeto Com Espaço'), true);
  assert.equal(portable('/Users/aluno/Projeto Com Espaço').includes('/Users/aluno/Projeto Com Espaço'), true);
  assert.equal(scanErrorNote(one, { code: 'EACCES', message: 'negado' }).code, 'PERMISSION_DENIED');
  assert.equal(scanErrorNote(one, { code: 'EPERM', message: 'negado' }).code, 'PERMISSION_DENIED');

  const selection = resolveProjectFromArgs({
    cohortRoot: temp,
    cwd: temp,
    registry: { projects: {} },
  });
  assert.equal(selection.mode, 'select');
  assert.equal(selection.choices.length, 3);
  assert.deepEqual(selection.choices.map((choice) => choice.number), [1, 2, 3]);

  const explicit = resolveProjectFromArgs({
    cohortRoot: temp,
    cwd: temp,
    project: one,
    registry: { projects: {} },
  });
  assert.equal(explicit.mode, 'explicit');
  assert.equal(explicit.root, resolve(one));

  const ancestor = resolveProjectFromArgs({
    cohortRoot: temp,
    cwd: join(one, 'subdir', 'deeper'),
    registry: { projects: {} },
  });
  assert.equal(ancestor.mode, 'cwd-ancestor');
  assert.equal(ancestor.root, resolve(one));

  const manifestOne = ensureManifest(one, 'mesmo-slug');
  const manifestTwo = ensureManifest(two, 'mesmo-slug');
  assert.notEqual(manifestOne.projectId, manifestTwo.projectId);
  const entryOne = registerProject(temp, one);
  const entryTwo = registerProject(temp, two);
  assert.equal(entryOne.slug, entryTwo.slug);
  assert.deepEqual(entryTwo.slugCollisionWith, [entryOne.projectId]);
  assert.equal(resolveRegisteredRoot(temp, entryOne.projectId).projectRoot, resolve(one));

  const clone = join(temp, 'espalhados', 'clone');
  cpSync(one, clone, { recursive: true });
  const collisions = findProjectIdCollisions(temp, [
    { root: one },
    { root: clone },
  ]);
  assert.equal(collisions.length, 1);
  assert.throws(
    () => registerProject(temp, clone),
    (error) => error.code === 'PROJECT_ID_COLLISION',
  );

  const moved = join(temp, 'espalhados', 'movido');
  renameSync(two, moved);
  assert.throws(
    () => resolveRegisteredRoot(temp, manifestTwo.projectId, {
      candidates: [{ root: moved }],
    }),
    (error) => error.code === 'PROJECT_MOVED' && error.currentRoot === moved,
  );

  const legacy = discovered.candidates.find((item) => item.root === incomplete);
  assert.equal(legacy.legacyImportPlan.atomic, true);
  assert.equal(legacy.legacyImportPlan.preserveOriginals, true);
  assert.equal(legacy.legacyImportPlan.requiresManualMove, false);
  assert.equal(legacy.legacyImportPlan.operations.every((operation) => !operation.copy && !operation.deleteSource), true);

  const escapeTarget = mkdtempSync(join(tmpdir(), 'iniciar-trafego-escape-'));
  fixtureProject(escapeTarget, ['funil.md']);
  try {
    symlinkSync(escapeTarget, join(temp, 'espalhados', 'escape-link'), 'junction');
    const withEscape = discoverProjects({ cohortRoot: temp });
    const escaped = withEscape.candidates.find((item) => item.exclusionReason === 'symlink-escape');
    assert.equal(escaped?.errorCode, 'SYMLINK_ESCAPE');
  } finally {
    rmSync(escapeTarget, { recursive: true, force: true });
  }

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const candidateSchema = json(join(ROOT, 'data/contracts/iniciar-trafego/project-candidate.v1.schema.json'));
  const registrySchema = json(join(ROOT, 'data/contracts/iniciar-trafego/project-registry.v1.schema.json'));
  const validateCandidate = ajv.compile(candidateSchema);
  const validateRegistry = ajv.compile(registrySchema);
  for (const candidate of discovered.candidates) {
    assert.equal(validateCandidate(candidate), true, JSON.stringify(validateCandidate.errors));
  }
  const registry = loadRegistry(temp);
  assert.equal(validateRegistry(registry), true, JSON.stringify(validateRegistry.errors));

  const real = discoverProjects({ cohortRoot: ROOT });
  assert.deepEqual(
    real.candidates.filter((item) => !item.excluded).map((item) => item.slug).sort(),
    ['forja', 'no-azul'],
  );

  console.log('validate-iniciar-trafego-discovery-identity: PASS (discovery + identity + registry + legacy)');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
