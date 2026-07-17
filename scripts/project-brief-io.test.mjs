import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { chromium } from 'playwright';
import { createProjectBriefValidators } from './migrate-project-brief.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VALID_V1 = join(ROOT, 'data/contracts/fixtures/project-brief/project-brief-1.0.0.valid.json');
const LEGACY = join(ROOT, 'data/contracts/fixtures/project-brief/legacy-0.1.0.valid.json');
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

async function startServer() {
  const server = createServer(async (request, response) => {
    const requested = new URL(request.url, 'http://127.0.0.1').pathname;
    const relative = requested === '/' ? 'briefing.html' : decodeURIComponent(requested.slice(1));
    const file = normalize(join(ROOT, relative));
    if (!file.startsWith(`${ROOT}/`)) {
      response.writeHead(403).end('forbidden');
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404).end('not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

async function openBriefing(t, path = '/briefing.html', seededStorage = null) {
  const { server, origin } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  await context.route('**/*', async (route) => {
    if (route.request().url().startsWith(origin)) await route.continue();
    else await route.abort();
  });
  const page = await context.newPage();
  if (seededStorage) {
    await page.addInitScript(({ activeProjectId, raw }) => {
      localStorage.setItem('cohort.projectBrief.activeProject.v1', activeProjectId);
      localStorage.setItem(`cohort.projectBrief.v1:${encodeURIComponent(activeProjectId)}`, raw);
    }, seededStorage);
  }
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#save-state').filter({ hasText: 'salvo' }).waitFor();
  t.after(async () => {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  });
  return { page, pageErrors };
}

async function downloadJson(page) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-json-btn').click();
  const download = await downloadPromise;
  const path = await download.path();
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readinessDecision(page) {
  await page.waitForFunction(() => window.__SKILL_SURFACE_STATUS?.status === 'ready');
  return page.evaluate(() => window.__SKILL_READINESS_DECISION);
}

function readinessRoute(decision) {
  return {
    state: decision.state,
    nextSkill: decision.nextSkill,
    reason: decision.reason,
  };
}

test('as duas copias distribuidas permanecem byte a byte iguais', async () => {
  const [rootCopy, lessonCopy] = await Promise.all([
    readFile(join(ROOT, 'briefing.html')),
    readFile(join(ROOT, 'aula-03/materiais/briefing.html')),
  ]);
  assert.deepEqual(rootCopy, lessonCopy);
});

test('ProjectBrief v1 faz round-trip JSON e Markdown sem perder metadados', async (t) => {
  const { page, pageErrors } = await openBriefing(t);
  const fixture = JSON.parse(await readFile(VALID_V1, 'utf8'));
  fixture.data.project.currentStage = 'trafego';
  fixture.fieldSources['offer.upsell.name'] = {
    source: 'user',
    confirmation: 'confirmed',
    updatedAt: '2026-06-02T15:20:00.000Z',
  };
  const input = join(tmpdir(), `project-brief-v1-${process.pid}.json`);
  await writeFile(input, JSON.stringify(fixture));

  await page.setInputFiles('#import-file', input);
  await page.locator('#import-status').filter({ hasText: 'ProjectBrief v1 importado' }).waitFor();
  assert.equal(await page.locator('#step-title').textContent(), 'Canais');
  await page.locator('[data-step="project"]').click();
  assert.equal(await page.locator('[data-path="project.name"]').inputValue(), 'Acme Labs');
  assert.equal(await page.locator('[data-path="project.currentStage"]').inputValue(), 'trafego');

  const exported = await downloadJson(page);
  assert.deepEqual(exported, fixture);

  const markdownPromise = page.waitForEvent('download');
  await page.locator('#export-markdown-btn').click();
  const markdownDownload = await markdownPromise;
  const markdown = await readFile(await markdownDownload.path(), 'utf8');
  assert.match(markdown, /^# Briefing Acme Labs/m);
  assert.match(markdown, /Nicho: educacao/);
  assert.doesNotMatch(markdown, /fieldSources|workspaceId|schemaVersion/);
  assert.deepEqual(pageErrors, []);
});

test('projeto novo mantém a mesma próxima skill após exportar e reimportar ProjectBrief v1', async (t) => {
  const fixture = JSON.parse(await readFile(VALID_V1, 'utf8'));
  const raw = JSON.stringify({
    document: fixture,
    artifactIndex: {
      schemaVersion: 'artifact-index-v1',
      project: { slug: fixture.data.project.slug },
      rules: { schemaVersion: '0.1.0', confirmationRequiredByDefault: true },
      entries: [],
      summary: { total: 0, confirmed: 0, pendingConfirmation: 0 },
    },
  });
  const { page, pageErrors } = await openBriefing(t, '/briefing.html', {
    activeProjectId: fixture.projectId,
    raw,
  });
  const before = await readinessDecision(page);
  const exported = await downloadJson(page);
  const input = join(tmpdir(), `project-brief-v1-roundtrip-${process.pid}.json`);
  await writeFile(input, JSON.stringify(exported));
  await page.setInputFiles('#import-file', input);
  await page.locator('#import-status').filter({ hasText: 'ProjectBrief v1 importado' }).waitFor();
  const after = await readinessDecision(page);

  assert.deepEqual(exported, fixture);
  assert.deepEqual(readinessRoute(after), readinessRoute(before));
  assert.match(after.nextSkill.command, /^\/[a-z0-9-]+$/);
  assert.deepEqual(pageErrors, []);
});

test('importacao 0.1.0 migra explicitamente e exporta v1 valido', async (t) => {
  const { page, pageErrors } = await openBriefing(t, '/aula-03/materiais/briefing.html');
  await page.setInputFiles('#import-file', LEGACY);
  await page.locator('#import-status').filter({ hasText: '0.1.0 migrado para ProjectBrief v1' }).waitFor();
  const exported = await downloadJson(page);
  assert.equal(exported.schemaVersion, '1.0.0');
  assert.equal(exported.data.schemaVersion, '0.1.0');
  assert.equal(exported.data.project.slug, 'acme-labs');
  assert.equal(exported.fieldSources['market.dominantPain'].confirmation, 'pending');
  assert.deepEqual(pageErrors, []);
});

test('migração legada preserva semântica e mantém a próxima skill ao reimportar v1', async (t) => {
  const legacy = JSON.parse(await readFile(LEGACY, 'utf8'));
  const { page, pageErrors } = await openBriefing(t, '/aula-03/materiais/briefing.html');
  await page.setInputFiles('#import-file', LEGACY);
  await page.locator('#import-status').filter({ hasText: '0.1.0 migrado para ProjectBrief v1' }).waitFor();
  const migratedDecision = await readinessDecision(page);
  const exported = await downloadJson(page);
  const input = join(tmpdir(), `project-brief-legacy-roundtrip-${process.pid}.json`);
  await writeFile(input, JSON.stringify(exported));
  await page.setInputFiles('#import-file', input);
  await page.locator('#import-status').filter({ hasText: 'ProjectBrief v1 importado' }).waitFor();
  const reimportedDecision = await readinessDecision(page);

  assert.equal(exported.data.project.name, legacy.project.name);
  assert.equal(exported.data.project.slug, legacy.project.slug);
  assert.equal(exported.data.market.niche, legacy.market.niche);
  assert.equal(exported.data.market.dominantPain, legacy.market.dominantPain);
  assert.deepEqual(exported.data.meta, legacy.meta);
  assert.equal(exported.fieldSources['project.name'].source, 'user');
  assert.equal(exported.fieldSources['market.niche'].sourceArtifactId, 'avatar-funil.md');
  assert.equal(exported.fieldSources['market.dominantPain'].confirmation, 'pending');
  assert.equal(exported.fieldSources['offer.guarantee'].confirmation, 'not_applicable');
  assert.deepEqual(readinessRoute(reimportedDecision), readinessRoute(migratedDecision));
  assert.deepEqual(pageErrors, []);
});

test('arquivo invalido preserva o rascunho e oferece recuperacao', async (t) => {
  const { page, pageErrors } = await openBriefing(t);
  await page.locator('[data-path="project.slug"]').fill('rascunho-seguro');
  await page.locator('[data-path="project.name"]').fill('Não perder');
  await page.waitForTimeout(800);

  const invalid = join(tmpdir(), `project-brief-invalid-${process.pid}.json`);
  await writeFile(invalid, JSON.stringify({ schemaVersion: '9.9.9', project: { slug: 'invasor' } }));
  await page.setInputFiles('#import-file', invalid);
  await page.locator('#import-status').filter({ hasText: 'Importação recusada' }).waitFor();

  assert.equal(await page.locator('[data-path="project.slug"]').inputValue(), 'rascunho-seguro');
  assert.equal(await page.locator('[data-path="project.name"]').inputValue(), 'Não perder');
  assert.match(await page.locator('#import-status').textContent(), /Revise o arquivo e tente novamente/);
  assert.deepEqual(pageErrors, []);
});

test('datas RFC3339 mantem conformidade de calendario entre browser e AJV', async (t) => {
  const { page, pageErrors } = await openBriefing(t);
  const fixture = JSON.parse(await readFile(VALID_V1, 'utf8'));
  const { validateV1 } = createProjectBriefValidators();
  const matrix = [
    '2024-02-29T23:59:59Z',
    '2026-06-02T15:30:00.123+03:30',
    '2023-02-29T12:00:00Z',
    '2026-13-01T12:00:00Z',
    '2026-04-31T12:00:00Z',
    '2026-06-02T25:00:00Z',
  ];

  for (const [index, dateTime] of matrix.entries()) {
    const candidate = structuredClone(fixture);
    candidate.updatedAt = dateTime;
    const input = join(tmpdir(), `project-brief-date-${process.pid}-${index}.json`);
    await writeFile(input, JSON.stringify(candidate));
    const ajvAccepted = validateV1(candidate);
    await page.setInputFiles('#import-file', input);
    await page.waitForFunction(() => /ProjectBrief v1 importado|Importação recusada/.test(document.querySelector('#import-status')?.textContent || ''));
    const status = await page.locator('#import-status').textContent();
    assert.equal(status.includes('ProjectBrief v1 importado'), ajvAccepted, `${dateTime} divergiu do AJV`);
  }
  assert.deepEqual(pageErrors, []);
});

test('credenciais em texto livre falham fechado antes de import e autosave', async (t) => {
  const { page, pageErrors } = await openBriefing(t);
  await page.locator('[data-path="project.slug"]').fill('draft-protegido');
  await page.locator('[data-path="project.name"]').fill('Conteúdo seguro');
  await page.waitForTimeout(800);
  const baselineStorage = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
  const baselineName = await page.locator('[data-path="project.name"]').inputValue();
  const fixture = JSON.parse(await readFile(VALID_V1, 'utf8'));
  const credentialSamples = [
    'api_key=sk-live-1234567890abcdefghijklmnop',
    'access_token: eyJhbGciOiJIUzI1NiJ9.payload.signature',
    'refresh_token=rt_1234567890abcdefghijklmnop',
    'secret = super-secret-value-1234567890',
    'token=tok_1234567890abcdefghijklmnop',
    'auth_token: auth_1234567890abcdefghijklmnop',
    'password=nao-e-uma-senha-real-1234567890',
    'senha: valor-ficticio-1234567890',
    'password=P@ssw0rd!2026',
    'senha: "Valor-ficticio!2026@quoted"',
    'token: parte1:parte2:parte3!2026',
    'api_key=abc.DEF-123_!@#$%^&*()',
    'token=YOUR_TOKEN_HERE-real',
    'access_token=<TOKEN>-real',
    'password=[REDACTED]but-real',
    'api_key="YOUR_API_KEY"-real',
    'Authorization: Bearer abcdefghijklmnopqrstuvwxyz.1234567890',
    'Authorization: Basic ZmljdGljaW86dmFsb3ItZGUtdGVzdGU=',
    'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz',
    'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
    'STRIPE_SECRET_KEY=sk_live_1234567890abcdefghijklmnop',
    '-----BEGIN PRIVATE KEY-----\nvalor-ficticio\n-----END PRIVATE KEY-----',
    'npm_1234567890abcdefghijklmnopqrstuvwxyz',
    'glpat-1234567890abcdefghijklmnop',
  ];

  for (const [index, credential] of credentialSamples.entries()) {
    const candidate = structuredClone(fixture);
    candidate.data.market.userResearchMaterials = `Material enviado\n${credential}`;
    const input = join(tmpdir(), `project-brief-credential-${process.pid}-${index}.json`);
    await writeFile(input, JSON.stringify(candidate));
    await page.setInputFiles('#import-file', input);
    await page.locator('#import-status').filter({ hasText: 'Importação recusada' }).waitFor();
    assert.match(await page.locator('#import-status').textContent(), /credencial/i);
    assert.equal(await page.locator('[data-path="project.name"]').inputValue(), baselineName);
    assert.equal(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), baselineStorage);
  }

  const surfaceRegressionSamples = [
    'password=P@ssw0rd!2026',
    'senha: "Valor-ficticio!2026@quoted"',
    'token: parte1:parte2:parte3!2026',
    'api_key=abc.DEF-123_!@#$%^&*()',
  ];
  for (const credential of surfaceRegressionSamples) {
    await page.locator('[data-path="project.name"]').fill(credential);
    await page.waitForTimeout(800);
    assert.match(await page.locator('#save-state').textContent(), /autosave recusado/i);
    assert.equal(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), baselineStorage);

    const unexpectedDownload = page.waitForEvent('download', { timeout: 750 }).then(() => true, () => false);
    await page.evaluate(() => exportJson());
    await page.locator('#import-status').filter({ hasText: 'Exportação recusada' }).waitFor();
    assert.equal(await unexpectedDownload, false);
    assert.equal(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), baselineStorage);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#save-state').filter({ hasText: 'salvo' }).waitFor();
    assert.equal(await page.locator('[data-path="project.name"]').inputValue(), baselineName);
    assert.equal(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), baselineStorage);
  }
  assert.deepEqual(pageErrors, []);
});

test('credencial rejeitada no índice salvo preserva o storage byte a byte e não libera artefatos', async (t) => {
  const document = JSON.parse(await readFile(VALID_V1, 'utf8'));
  const payload = {
    document,
    artifacts: {},
    artifactIndex: {
      schemaVersion: 'artifact-index-v1',
      project: { slug: document.data.project.slug },
      rules: { schemaVersion: '0.1.0', confirmationRequiredByDefault: true },
      entries: [{
        artifactType: 'avatar',
        path: 'token=tok_1234567890abcdefghijklmnop',
        sha256: 'a'.repeat(64),
        sizeBytes: 1,
        origin: { kind: 'declared_glob', rule: 'artifactGlobs.avatar', patterns: ['avatar.md'] },
        confirmationStatus: 'confirmed',
        satisfiesCriticalRequirement: true,
      }],
      summary: { total: 1, confirmed: 1, pendingConfirmation: 0 },
    },
    ui: { activeStep: 'review' },
  };
  const raw = JSON.stringify(payload);
  const { page, pageErrors } = await openBriefing(t, '/briefing.html', {
    activeProjectId: document.projectId,
    raw,
  });

  await page.locator('#import-status').filter({ hasText: 'storage original' }).waitFor();
  await page.locator('[data-step="review"]').click();
  assert.equal(await page.locator('[data-artifact="avatar"] input').isChecked(), false);
  assert.equal(await page.evaluate((projectId) => localStorage.getItem(
    `cohort.projectBrief.v1:${encodeURIComponent(projectId)}`,
  ), document.projectId), raw);
  assert.deepEqual(pageErrors, []);
});

test('politica de credenciais permite controles pedagogicos benignos', async (t) => {
  const { page, pageErrors } = await openBriefing(t);
  const fixture = JSON.parse(await readFile(VALID_V1, 'utf8'));
  const benignSamples = [
    'Este módulo explica o que é access_token sem exibir valor.',
    'Use um password manager e nunca cole sua senha no briefing.',
    'A variável api_key deve ficar no arquivo .env.',
    'Exemplo redigido: token=[REDACTED].',
    'Authorization: Bearer <TOKEN> é apenas a sintaxe documentada.',
    'Nunca publique uma PRIVATE KEY em materiais de aula.',
    'token=YOUR_TOKEN_HERE',
    'auth_token=SEU_TOKEN_AQUI',
    'api_key=YOUR_API_KEY',
    'token=example-token',
    'access_token=<TOKEN>',
    'password=[REDACTED]',
  ];

  for (const [index, content] of benignSamples.entries()) {
    const candidate = structuredClone(fixture);
    candidate.data.market.userResearchMaterials = content;
    const input = join(tmpdir(), `project-brief-benign-${process.pid}-${index}.json`);
    await writeFile(input, JSON.stringify(candidate));
    await page.setInputFiles('#import-file', input);
    await page.locator('#import-status').filter({ hasText: 'ProjectBrief v1 importado' }).waitFor();
  }
  await page.locator('[data-step="project"]').click();
  await page.locator('[data-path="project.name"]').fill('token=YOUR_TOKEN_HERE');
  await page.waitForTimeout(800);
  assert.match(await page.locator('#save-state').textContent(), /^ salvo$|salvo/i);
  const exported = await downloadJson(page);
  assert.equal(exported.data.project.name, 'token=YOUR_TOKEN_HERE');
  assert.deepEqual(pageErrors, []);
});

test('autosave usa chave por projeto e nao persiste tokens', async (t) => {
  const { page, pageErrors } = await openBriefing(t);
  const first = JSON.parse(await readFile(VALID_V1, 'utf8'));
  const second = structuredClone(first);
  second.id = 'project-beta:revision:1';
  second.projectId = 'project-beta';
  second.data.project.slug = 'beta';
  second.data.project.name = 'Beta';
  const firstPath = join(tmpdir(), `project-brief-first-${process.pid}.json`);
  const secondPath = join(tmpdir(), `project-brief-second-${process.pid}.json`);
  await writeFile(firstPath, JSON.stringify(first));
  await writeFile(secondPath, JSON.stringify(second));

  await page.setInputFiles('#import-file', firstPath);
  await page.locator('[data-path="project.name"]').fill('Acme alterado');
  await page.waitForTimeout(800);
  await page.setInputFiles('#import-file', secondPath);
  await page.locator('[data-path="project.name"]').fill('Beta alterado');
  await page.waitForTimeout(800);

  const saved = await page.evaluate(() => Object.entries(localStorage)
    .filter(([key]) => key.startsWith('cohort.projectBrief.v1:')));
  assert.equal(saved.length, 2);
  assert.ok(saved.some(([key, value]) => key.endsWith('project-acme-labs') && value.includes('Acme alterado')));
  assert.ok(saved.some(([key, value]) => key.endsWith('project-beta') && value.includes('Beta alterado')));
  assert.ok(saved.every(([, value]) => !/api[_-]?key|access[_-]?token|refresh[_-]?token|secret/i.test(value)));
  assert.deepEqual(pageErrors, []);
});
