import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import {
  ArtifactIndexError,
  buildArtifactIndex,
  confirmArtifact,
  isPortableArtifactPath,
  matchesArtifactGlob,
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
const execFileAsync = promisify(execFile);

async function fixture(t) {
  const sandbox = await mkdtemp(path.join(os.tmpdir(), 'artifact-index-'));
  const projectRoot = path.join(sandbox, 'projetos', 'demo-seguro');
  await mkdir(projectRoot, { recursive: true });
  t.after(() => rm(sandbox, { recursive: true, force: true }));
  return { sandbox, projectRoot };
}

test('indexa apenas globs declarados, com metadados reproduziveis e sem bytes brutos', async (t) => {
  const { sandbox, projectRoot } = await fixture(t);
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
  assert.doesNotMatch(JSON.stringify(first), /conteudo privado|fora-do-contrato/);
  assert.ok(!JSON.stringify(first).includes(sandbox));
  assert.deepEqual(validateArtifactIndex(first, RULES), first);
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

test('recusa assinatura forte de credencial no path relativo sem ecoar o filename', async (t) => {
  const { projectRoot } = await fixture(t);
  const sensitiveName = `dossie-ghp_${'a'.repeat(24)}.md`;
  await writeFile(path.join(projectRoot, sensitiveName), 'conteudo benigno');
  await assert.rejects(
    buildArtifactIndex({
      projectRoot,
      rules: { ...RULES, artifactGlobs: { dossier: ['dossie-*.md'] } },
    }),
    (error) => {
      assert.ok(error instanceof ArtifactIndexError);
      assert.equal(error.code, 'SENSITIVE_PATH');
      assert.ok(!error.message.includes(sensitiveName));
      return true;
    },
  );
});

test('confirmacao explicita altera somente a entrada alvo', async (t) => {
  const { projectRoot } = await fixture(t);
  await writeFile(path.join(projectRoot, 'project-brief.json'), '{}');
  await writeFile(path.join(projectRoot, 'avatar.md'), 'avatar');
  const pending = await buildArtifactIndex({ projectRoot, rules: RULES });

  const confirmed = confirmArtifact(pending, { artifactType: 'avatar', path: 'avatar.md' }, RULES);
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
      () => confirmArtifact(index, { artifactType: 'avatar', path: candidate }, RULES),
      (error) => error instanceof ArtifactIndexError && ['INVALID_CONFIRMATION', 'ARTIFACT_NOT_FOUND'].includes(error.code),
    );
  }
});

test('CLI serializa somente o contrato validado e aceita confirmacao exata', async (t) => {
  const { sandbox, projectRoot } = await fixture(t);
  const rulesPath = path.join(sandbox, 'rules.json');
  await writeFile(path.join(projectRoot, 'avatar.md'), 'avatar privado');
  await writeFile(rulesPath, JSON.stringify(RULES));

  const { stdout, stderr } = await execFileAsync(process.execPath, [
    new URL('./project-artifact-index.mjs', import.meta.url).pathname,
    '--project', projectRoot,
    '--rules', rulesPath,
    '--confirm', 'avatar:avatar.md',
  ]);
  const index = validateArtifactIndex(JSON.parse(stdout), RULES);
  assert.equal(stderr, '');
  assert.equal(index.entries[0].confirmationStatus, 'confirmed');
  assert.ok(!stdout.includes(projectRoot));
  assert.doesNotMatch(stdout, /avatar privado/);
});

test('matcher glob segmentado e deterministico cobre a matriz usada pelo Node e browser', () => {
  const matrix = [
    ['avatar.md', 'avatar.md', true],
    ['relatorio-avatar.md', '*.md', true],
    ['nested/avatar.md', 'nested/*.md', true],
    ['nested/deep/avatar.md', 'nested/*.md', false],
    ['nested/deep/avatar.md', 'nested/**/*.md', true],
    ['nested/avatar.md', 'nested/**/*.md', true],
    ['assets/a/final/banner.png', 'assets/*/final/*.png', true],
    ['assets/a/draft/banner.png', 'assets/*/final/*.png', false],
    ['a/b/c.md', '**/*.md', true],
    ['avatar.md', '**/*.md', true],
    ['avatar.md', '../*.md', false],
    ['avatar.md', '/tmp/*.md', false],
    ['file.md', '**', false],
  ];
  for (const [candidate, pattern, expected] of matrix) {
    assert.equal(matchesArtifactGlob(candidate, pattern), expected, `${candidate} :: ${pattern}`);
  }
});

test('path portatil rejeita NUL e controles com a mesma matriz do browser', () => {
  const matrix = [
    ['avatar.md', true],
    ['nested/avatar.md', true],
    ['avatar\0.md', false],
    ['avatar\n.md', false],
    ['avatar\t.md', false],
    [`avatar${String.fromCharCode(0x1f)}.md`, false],
    [`avatar${String.fromCharCode(0x7f)}.md`, false],
    [`avatar${String.fromCharCode(0x85)}.md`, false],
  ];
  for (const [candidate, expected] of matrix) assert.equal(isPortableArtifactPath(candidate), expected);
});

test('validator vincula path, provenance, unicidade e policy as regras canonicas', async (t) => {
  const { projectRoot } = await fixture(t);
  await writeFile(path.join(projectRoot, 'avatar.md'), 'avatar');
  const valid = await buildArtifactIndex({ projectRoot, rules: RULES });

  const mismatchedPath = structuredClone(valid);
  mismatchedPath.entries[0].path = 'nested/avatar.md';
  assert.throws(
    () => validateArtifactIndex(mismatchedPath, RULES),
    (error) => error instanceof ArtifactIndexError && error.code === 'INVALID_INDEX',
  );

  const mismatchedPattern = structuredClone(valid);
  mismatchedPattern.entries[0].origin.patterns = ['nested/avatar.md'];
  assert.throws(
    () => validateArtifactIndex(mismatchedPattern, RULES),
    (error) => error instanceof ArtifactIndexError && error.code === 'INVALID_INDEX',
  );

  const partiallyMismatched = structuredClone(valid);
  partiallyMismatched.entries[0].origin.patterns = ['avatar.md', 'nested/avatar.md'];
  assert.throws(
    () => validateArtifactIndex(partiallyMismatched, RULES),
    (error) => error instanceof ArtifactIndexError && error.code === 'INVALID_INDEX',
  );

  const mismatchedPolicy = structuredClone(valid);
  mismatchedPolicy.rules.confirmationRequiredByDefault = false;
  assert.throws(
    () => validateArtifactIndex(mismatchedPolicy, RULES),
    (error) => error instanceof ArtifactIndexError && error.code === 'INVALID_INDEX',
  );

  const wrongVersion = structuredClone(valid);
  wrongVersion.schemaVersion = 'artifact-index-v999';
  assert.throws(() => validateArtifactIndex(wrongVersion, RULES), ArtifactIndexError);

  const additionalProperty = { ...structuredClone(valid), rawContent: 'nao permitido' };
  assert.throws(() => validateArtifactIndex(additionalProperty, RULES), ArtifactIndexError);

  const sharedPathRules = {
    ...RULES,
    artifactGlobs: { first: ['shared.md'], second: ['shared.md'] },
  };
  const duplicate = {
    schemaVersion: 'artifact-index-v1',
    project: { slug: 'demo-seguro' },
    rules: { schemaVersion: 'test', confirmationRequiredByDefault: true },
    entries: ['first', 'second'].map((artifactType) => ({
      artifactType,
      path: 'shared.md',
      sha256: 'a'.repeat(64),
      sizeBytes: 1,
      origin: { kind: 'declared_glob', rule: `artifactGlobs.${artifactType}`, patterns: ['shared.md'] },
      confirmationStatus: 'pending_confirmation',
      satisfiesCriticalRequirement: false,
    })),
    summary: { total: 2, confirmed: 0, pendingConfirmation: 2 },
  };
  assert.throws(
    () => validateArtifactIndex(duplicate, sharedPathRules),
    (error) => error instanceof ArtifactIndexError && error.code === 'INVALID_INDEX',
  );
});

test('globstar terminal e rejeitado por matcher, rules, validator e builder', async (t) => {
  const { projectRoot } = await fixture(t);
  await writeFile(path.join(projectRoot, 'file.md'), 'fabricated');
  const terminalRules = {
    ...RULES,
    artifactGlobs: { fabricated: ['**'] },
  };
  assert.equal(matchesArtifactGlob('file.md', '**'), false);
  await assert.rejects(
    buildArtifactIndex({ projectRoot, rules: terminalRules }),
    (error) => error instanceof ArtifactIndexError && error.code === 'INVALID_GLOB',
  );
  const fabricated = {
    schemaVersion: 'artifact-index-v1',
    project: { slug: 'demo-seguro' },
    rules: { schemaVersion: 'test', confirmationRequiredByDefault: true },
    entries: [{
      artifactType: 'fabricated',
      path: 'file.md',
      sha256: 'c'.repeat(64),
      sizeBytes: 10,
      origin: { kind: 'declared_glob', rule: 'artifactGlobs.fabricated', patterns: ['**'] },
      confirmationStatus: 'pending_confirmation',
      satisfiesCriticalRequirement: false,
    }],
    summary: { total: 1, confirmed: 0, pendingConfirmation: 1 },
  };
  assert.throws(
    () => validateArtifactIndex(fabricated, terminalRules),
    (error) => error instanceof ArtifactIndexError && error.code === 'INVALID_GLOB',
  );
});

test('validator aplica sanitizacao a toda provenance sem ecoar assinatura', async (t) => {
  const { projectRoot } = await fixture(t);
  await writeFile(path.join(projectRoot, 'avatar.md'), 'avatar');
  const valid = await buildArtifactIndex({ projectRoot, rules: RULES });
  const signature = `ghp_${'z'.repeat(24)}`;
  for (const mutate of [
    (entry) => { entry.origin.kind = signature; },
    (entry) => { entry.origin.rule = signature; },
    (entry) => { entry.origin.patterns = [signature]; },
  ]) {
    const tampered = structuredClone(valid);
    mutate(tampered.entries[0]);
    assert.throws(
      () => validateArtifactIndex(tampered, RULES),
      (error) => error instanceof ArtifactIndexError && !error.message.includes(signature),
    );
  }
});

test('briefings distribuidos permanecem identicos e declaram consumo de ArtifactIndex v1', async () => {
  const primary = await readFile(new URL('../briefing.html', import.meta.url), 'utf8');
  const distributed = await readFile(new URL('../aula-03/materiais/briefing.html', import.meta.url), 'utf8');
  const sharedContract = await readFile(new URL('../skill-surface-contract.js', import.meta.url), 'utf8');
  assert.equal(primary, distributed);
  assert.match(primary, /skill-surface-contract\.js/);
  assert.match(sharedContract, /artifact-index-v1/);
  assert.match(primary, /import-artifact-index/);
});

test('smoke HTTP importa o mesmo ArtifactIndex nas duas copias sem pageerror', { timeout: 45_000 }, async (t) => {
  const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      const relative = pathname === '/' ? 'briefing.html' : pathname.slice(1);
      const candidate = path.resolve(webRoot, relative);
      if (!candidate.startsWith(`${webRoot}${path.sep}`)) {
        response.writeHead(403).end();
        return;
      }
      const info = await stat(candidate);
      const target = info.isDirectory() ? path.join(candidate, 'index.html') : candidate;
      const bytes = await readFile(target);
      const contentType = target.endsWith('.html')
        ? 'text/html; charset=utf-8'
        : target.endsWith('.json') ? 'application/json'
          : target.endsWith('.js') ? 'text/javascript; charset=utf-8'
            : target.endsWith('.mjs') ? 'application/javascript; charset=utf-8'
              : 'application/octet-stream';
      response.writeHead(200, { 'content-type': contentType }).end(bytes);
    } catch {
      response.writeHead(404).end('not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const port = server.address().port;
  const validDocument = JSON.parse(await readFile(
    new URL('../data/contracts/fixtures/project-brief/project-brief-1.0.0.valid.json', import.meta.url),
    'utf8',
  ));
  const index = {
    schemaVersion: 'artifact-index-v1',
    project: { slug: 'acme-labs' },
    rules: { schemaVersion: '0.1.0', confirmationRequiredByDefault: true },
    entries: [{
      artifactType: 'avatar',
      path: 'avatar.md',
      sha256: 'a'.repeat(64),
      sizeBytes: 12,
      origin: { kind: 'declared_glob', rule: 'artifactGlobs.avatar', patterns: ['avatar.md'] },
      confirmationStatus: 'confirmed',
      satisfiesCriticalRequirement: true,
    }],
    summary: { total: 1, confirmed: 1, pendingConfirmation: 0 },
  };

  async function openPage(pathname, saved = null) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') route.continue();
      else route.abort();
    });
    if (saved) {
      await page.addInitScript((payload) => {
        localStorage.setItem('cohort.projectBrief.activeProject.v1', payload.document.projectId);
        localStorage.setItem(`cohort.projectBrief.v1:${encodeURIComponent(payload.document.projectId)}`, JSON.stringify(payload));
      }, saved);
    }
    await page.goto(`http://127.0.0.1:${port}${pathname}`, { waitUntil: 'load' });
    return { page, errors };
  }

  const matcherMatrix = [
    ['avatar.md', 'avatar.md'],
    ['nested/avatar.md', 'nested/*.md'],
    ['nested/deep/avatar.md', 'nested/*.md'],
    ['nested/deep/avatar.md', 'nested/**/*.md'],
    ['avatar.md', '**/*.md'],
    ['file.md', '**'],
  ];
  const portableMatrix = [
    'avatar.md',
    'nested/avatar.md',
    'avatar\0.md',
    'avatar\n.md',
    'avatar\t.md',
    `avatar${String.fromCharCode(0x1f)}.md`,
    `avatar${String.fromCharCode(0x7f)}.md`,
    `avatar${String.fromCharCode(0x85)}.md`,
  ];

  const duplicatePath = {
    schemaVersion: 'artifact-index-v1',
    project: { slug: 'acme-labs' },
    rules: { schemaVersion: '0.1.0', confirmationRequiredByDefault: true },
    entries: ['trafficTrackingAudit', 'trafficCreativeBattery'].map((artifactType) => ({
      artifactType,
      path: 'PAINEL-DA-SEMANA.yaml',
      sha256: 'b'.repeat(64),
      sizeBytes: 10,
      origin: { kind: 'declared_glob', rule: `artifactGlobs.${artifactType}`, patterns: ['PAINEL-DA-SEMANA.yaml'] },
      confirmationStatus: 'confirmed',
      satisfiesCriticalRequirement: true,
    })),
    summary: { total: 2, confirmed: 2, pendingConfirmation: 0 },
  };

  const invalidIndexes = [
    { label: 'schema v999', value: { ...structuredClone(index), schemaVersion: 'artifact-index-v999' } },
    { label: 'additional property', value: { ...structuredClone(index), rawContent: 'nao permitido' } },
    {
      label: 'path sem casar provenance',
      value: (() => {
        const value = structuredClone(index);
        value.entries[0].path = 'relatorio-avatar.md';
        return value;
      })(),
    },
    {
      label: 'pattern canonico sem casar path',
      value: (() => {
        const value = structuredClone(index);
        value.entries[0].origin.patterns = ['relatorio-avatar.md'];
        return value;
      })(),
    },
    {
      label: 'provenance parcialmente falsa',
      value: (() => {
        const value = structuredClone(index);
        value.entries[0].origin.patterns = ['avatar.md', 'relatorio-avatar.md'];
        return value;
      })(),
    },
    {
      label: 'path com NUL',
      value: (() => {
        const value = structuredClone(index);
        value.entries[0].path = 'avatar\0.md';
        return value;
      })(),
    },
    {
      label: 'policy divergente',
      value: (() => {
        const value = structuredClone(index);
        value.rules.confirmationRequiredByDefault = false;
        return value;
      })(),
    },
    { label: 'path global duplicado', value: duplicatePath },
  ];

  for (const pathname of ['/briefing.html', '/aula-03/materiais/briefing.html']) {
    const { page, errors } = await openPage(pathname);
    const browserMatches = await page.evaluate((matrix) => matrix.map(([candidate, pattern]) => matchesArtifactGlob(candidate, pattern)), matcherMatrix);
    assert.deepEqual(browserMatches, matcherMatrix.map(([candidate, pattern]) => matchesArtifactGlob(candidate, pattern)));
    const browserPortable = await page.evaluate((matrix) => matrix.map((candidate) => isPortableArtifactPath(candidate)), portableMatrix);
    assert.deepEqual(browserPortable, portableMatrix.map((candidate) => isPortableArtifactPath(candidate)));
    await page.locator('#import-artifact-index-file').setInputFiles({
      name: 'artifact-index.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(index)),
    });
    await page.waitForFunction(() => document.querySelector('#import-status')?.textContent?.includes('ArtifactIndex v1 importado'));
    await page.locator('[data-step="review"]').click();
    assert.equal(await page.locator('[data-artifact="avatar"] input').isChecked(), true);
    assert.deepEqual(errors, []);
    await page.close();

    const validSaved = {
      document: validDocument,
      artifacts: { avatar: false },
      artifactIndex: index,
      ui: { activeStep: 'review' },
    };
    const validReload = await openPage(pathname, validSaved);
    await validReload.page.locator('[data-step="review"]').click();
    assert.equal(await validReload.page.locator('[data-artifact="avatar"] input').isChecked(), true);
    assert.deepEqual(validReload.errors, []);
    await validReload.page.close();

    for (const tamper of invalidIndexes) {
      const saved = {
        document: validDocument,
        artifacts: { avatar: true, offerbook: true },
        artifactIndex: tamper.value,
        ui: { activeStep: 'review' },
      };
      const invalidReload = await openPage(pathname, saved);
      await invalidReload.page.locator('[data-step="review"]').click();
      assert.equal(
        await invalidReload.page.locator('[data-artifact="avatar"] input').isChecked(),
        false,
        `${pathname}: ${tamper.label}`,
      );
      assert.equal(
        await invalidReload.page.locator('[data-artifact="offerbook"] input').isChecked(),
        false,
        `${pathname}: ${tamper.label}`,
      );
      assert.match(await invalidReload.page.locator('#import-status').textContent(), /índice salvo recusado/i);
      await invalidReload.page.locator('[data-step="project"]').click();
      assert.equal(await invalidReload.page.locator('[data-path="project.name"]').inputValue(), 'Acme Labs');
      const preserved = await invalidReload.page.evaluate(() => (
        localStorage.getItem('cohort.projectBrief.v1:project-acme-labs')
      ));
      assert.equal(preserved, JSON.stringify(saved), `${pathname}: ${tamper.label} alterou storage rejeitado`);
      assert.deepEqual(invalidReload.errors, []);
      await invalidReload.page.close();
    }
  }
});
