#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { buildArtifactIndex, ArtifactIndexError } from './project-artifact-index.mjs';
import { resolveArtifactBindings } from './lib/iniciar-trafego/artifact-resolution.mjs';

const temp = mkdtempSync(join(tmpdir(), 'iniciar-trafego-bindings-'));
const allowed = join(temp, 'fontes');
const project = join(allowed, 'projeto-externo');
const outside = join(temp, 'fora', 'outro-projeto');

function write(relativePath, content = '# fixture\n') {
  const target = join(project, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, 'utf8');
}

const rules = {
  schemaVersion: '1.0.0',
  artifactIndex: {
    schemaVersion: 'artifact-index-v1',
    confirmationRequiredByDefault: false,
  },
  artifactGlobs: {
    avatar: ['avatar.md', 'relatorio-avatar.md', 'pesquisa-avatar-*/relatorio-avatar.md'],
    offerbook: ['offerbook.md', 'offerbook-*.md'],
    copy: ['copy.md'],
  },
};

try {
  write('avatar.md', '# avatar exato\n');
  write('relatorio-avatar.md', '# avatar alternativo\n');
  write('pesquisa-avatar-a/relatorio-avatar.md', '# avatar aninhado\n');
  write('offerbook.md', '# offerbook canônico\n');
  write('offerbook-projeto.md', '# offerbook variante\n');
  write('briefing-offerbook.md', '# briefing não final\n');
  write('copy.md', '# copy\n');

  const before = readFileSync(join(project, 'offerbook-projeto.md'), 'utf8');
  const resolution = resolveArtifactBindings(project);
  assert.equal(resolution.bindings.avatar.path, 'avatar.md');
  assert.equal(resolution.bindings.offerbook.path, 'offerbook.md');
  assert.equal(resolution.bindings.offerbook.rule, 'offerbook.md');
  assert.equal(resolution.bindings.offerbook.status, 'bound');
  assert.equal(resolution.bindings.offerbook.sha256.length, 64);
  assert.equal(resolution.bindings.offerbook.sizeBytes > 0, true);
  assert.equal(resolution.artifactIndex.entries.length >= 3, true);
  assert.equal(readFileSync(join(project, 'offerbook-projeto.md'), 'utf8'), before);
  assert.equal(existsSync(join(project, 'trafego')), false);

  const index = await buildArtifactIndex({
    projectRoot: project,
    rules,
    allowedRoots: [allowed],
  });
  assert.equal(index.entries.some((entry) => entry.path === 'offerbook.md'), true);

  mkdirSync(outside, { recursive: true });
  await assert.rejects(
    buildArtifactIndex({ projectRoot: outside, rules, allowedRoots: [allowed] }),
    (error) => error instanceof ArtifactIndexError && error.code === 'PROJECT_ROOT_OUTSIDE_ALLOWED',
  );

  rmSync(join(project, 'avatar.md'));
  rmSync(join(project, 'relatorio-avatar.md'));
  write('pesquisa-avatar-b/relatorio-avatar.md', '# segundo avatar aninhado\n');
  const ambiguous = resolveArtifactBindings(project);
  assert.equal(ambiguous.bindings.avatar.status, 'ambiguous');
  assert.equal(ambiguous.bindings.avatar.code, 'AMBIGUOUS_ARTIFACT');
  assert.deepEqual(ambiguous.bindings.avatar.matches, [
    'pesquisa-avatar-a/relatorio-avatar.md',
    'pesquisa-avatar-b/relatorio-avatar.md',
  ]);

  console.log('validate-iniciar-trafego-artifact-bindings: PASS (allowlist + precedence + ambiguity + no-copy)');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
