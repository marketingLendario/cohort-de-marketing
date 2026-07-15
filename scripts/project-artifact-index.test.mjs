import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ArtifactIndexError,
  buildArtifactIndex,
  confirmArtifact,
  validateArtifactIndex,
} from './project-artifact-index.mjs';

const RULES = {
  schemaVersion: 'test',
  artifactGlobs: {
    projectBrief: ['project-brief.json'],
    avatar: ['avatar.md', 'nested/avatar.md'],
    banners: ['assets/*/final/*.png'],
  },
  artifactIndex: {
    schemaVersion: 'artifact-index-v1',
    confirmationRequiredByDefault: true,
  },
};

async function fixture(t) {
  const sandbox = await mkdtemp(path.join(os.tmpdir(), 'artifact-index-'));
  const projectRoot = path.join(sandbox, 'projetos', 'demo-seguro');
  await mkdir(projectRoot, { recursive: true });
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  return { sandbox, projectRoot };
}

test('indexa apenas globs declarados, com metadados reproduziveis e sem bytes brutos', async (t) => {
  const { projectRoot } = await fixture(t);
  await mkdir(path.join(projectRoot, 'assets', 'batch-1', 'final'), { recursive: true });
  await writeFile(path.join(projectRoot, 'project-brief.json'), '{"safe":true}\n');
  await writeFile(path.join(projectRoot, 'avatar.md'), 'conteudo privado do avatar\n');
  await writeFile(path.join(projectRoot, 'assets', 'batch-1', 'final', 'banner.png'), 'PNG fixture');
  await writeFile(path.join(projectRoot, 'fora-do-contrato.txt'), 'nao indexar');

  const first = await buildArtifactIndex({ projectRoot, rules: RULES });
  const second = await buildArtifactIndex({ projectRoot, rules: RULES });

  assert.deepEqual(first, second);
  assert.deepEqual(first.entries.map((entry) => entry.path), [
    'assets/batch-1/final/banner.png',
    'avatar.md',
    'project-brief.json',
  ]);
  assert.ok(first.entries.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256)));
  assert.ok(first.entries.every((entry) => Number.isInteger(entry.sizeBytes)));
  assert.ok(first.entries.every((entry) => entry.confirmationStatus === 'pending_confirmation'));
  assert.ok(first.entries.every((entry) => entry.satisfiesCriticalRequirement === false));
  assert.doesNotMatch(JSON.stringify(first), /conteudo privado|fora-do-contrato|artifact-index-/);
  assert.deepEqual(validateArtifactIndex(first), first);
});

test('projeto ausente falha fechado com erro tipado e sanitizado', async () => {
  await assert.rejects(
    buildArtifactIndex({ projectRoot: '/definitely/missing/projetos/demo', rules: RULES }),
    (error) => {
      assert.ok(error instanceof ArtifactIndexError);
      assert.equal(error.code, 'PROJECT_NOT_FOUND');
      assert.doesNotMatch(error.message, /definitely|missing/);
      return true;
    },
  );
});

test('recusa path absoluto e traversal declarados nas regras', async (t) => {
  const { projectRoot } = await fixture(t);
  for (const invalidPattern of ['/etc/passwd', '../segredo.txt', 'nested/../../segredo.txt']) {
    await assert.rejects(
      buildArtifactIndex({
        projectRoot,
        rules: { ...RULES, artifactGlobs: { invalid: [invalidPattern] } },
      }),
      (error) => error instanceof ArtifactIndexError && error.code === 'INVALID_GLOB',
    );
  }
});

test('recusa raiz de projeto sem slug seguro', async (t) => {
  const { sandbox } = await fixture(t);
  const unsafeRoot = path.join(sandbox, 'fora-de-projetos', 'demo');
  await mkdir(unsafeRoot, { recursive: true });
  await assert.rejects(
    buildArtifactIndex({ projectRoot: unsafeRoot, rules: RULES }),
    (error) => error instanceof ArtifactIndexError && error.code === 'INVALID_PROJECT_ROOT',
  );
});

test('deduplica o mesmo arquivo encontrado por dois globs do mesmo tipo', async (t) => {
  const { projectRoot } = await fixture(t);
  await writeFile(path.join(projectRoot, 'avatar.md'), 'avatar');
  const rules = {
    ...RULES,
    artifactGlobs: { avatar: ['*.md', 'avatar.md'] },
  };
  const index = await buildArtifactIndex({ projectRoot, rules });
  assert.equal(index.entries.length, 1);
  assert.equal(index.entries[0].path, 'avatar.md');
  assert.deepEqual(index.entries[0].origin.patterns, ['*.md', 'avatar.md']);
});

test('falha quando o mesmo path e ambiguo entre dois tipos de artefato', async (t) => {
  const { projectRoot } = await fixture(t);
  await writeFile(path.join(projectRoot, 'avatar.md'), 'avatar');
  await assert.rejects(
    buildArtifactIndex({
      projectRoot,
      rules: { ...RULES, artifactGlobs: { avatar: ['avatar.md'], copy: ['*.md'] } },
    }),
    (error) => error instanceof ArtifactIndexError && error.code === 'AMBIGUOUS_ARTIFACT',
  );
});

test('symlink cujo destino escapa do projeto falha fechado', async (t) => {
  const { sandbox, projectRoot } = await fixture(t);
  const secret = path.join(sandbox, 'segredo.md');
  await writeFile(secret, 'token=nao-expor');
  await symlink(secret, path.join(projectRoot, 'avatar.md'));
  await assert.rejects(
    buildArtifactIndex({ projectRoot, rules: RULES }),
    (error) => {
      assert.ok(error instanceof ArtifactIndexError);
      assert.equal(error.code, 'PATH_ESCAPE');
      assert.doesNotMatch(error.message, /token|segredo/);
      return true;
    },
  );
});

test('confirmacao explicita altera somente a entrada alvo', async (t) => {
  const { projectRoot } = await fixture(t);
  await writeFile(path.join(projectRoot, 'project-brief.json'), '{}');
  await writeFile(path.join(projectRoot, 'avatar.md'), 'avatar');
  const pending = await buildArtifactIndex({ projectRoot, rules: RULES });

  const confirmed = confirmArtifact(pending, { artifactType: 'avatar', path: 'avatar.md' });
  assert.equal(confirmed.entries.find((entry) => entry.path === 'avatar.md').confirmationStatus, 'confirmed');
  assert.equal(confirmed.entries.find((entry) => entry.path === 'avatar.md').satisfiesCriticalRequirement, true);
  assert.equal(confirmed.entries.find((entry) => entry.path === 'project-brief.json').confirmationStatus, 'pending_confirmation');
  assert.equal(pending.entries.find((entry) => entry.path === 'avatar.md').confirmationStatus, 'pending_confirmation');
});

test('confirmacao recusa path absoluto, traversal e entrada inexistente', async (t) => {
  const { projectRoot } = await fixture(t);
  await writeFile(path.join(projectRoot, 'avatar.md'), 'avatar');
  const index = await buildArtifactIndex({ projectRoot, rules: RULES });

  for (const candidate of ['/avatar.md', '../avatar.md', 'nao-existe.md']) {
    assert.throws(
      () => confirmArtifact(index, { artifactType: 'avatar', path: candidate }),
      (error) => error instanceof ArtifactIndexError && ['INVALID_CONFIRMATION', 'ARTIFACT_NOT_FOUND'].includes(error.code),
    );
  }
});

test('briefings distribuidos permanecem identicos e declaram consumo de ArtifactIndex v1', async () => {
  const root = new URL('../', import.meta.url);
  const primary = await readFile(new URL('../briefing.html', import.meta.url), 'utf8');
  const distributed = await readFile(new URL('../aula-03/materiais/briefing.html', import.meta.url), 'utf8');
  assert.equal(primary, distributed);
  assert.match(primary, /artifact-index-v1/);
  assert.match(primary, /import-artifact-index/);
  assert.ok(root);
});
