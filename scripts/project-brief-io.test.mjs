import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VALID_V1 = join(ROOT, 'data/contracts/fixtures/project-brief/project-brief-1.0.0.valid.json');
const LEGACY = join(ROOT, 'data/contracts/fixtures/project-brief/legacy-0.1.0.valid.json');
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
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

async function openBriefing(t, path = '/briefing.html') {
  const { server, origin } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  await context.route('**/*', async (route) => {
    if (route.request().url().startsWith(origin)) await route.continue();
    else await route.abort();
  });
  const page = await context.newPage();
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
  const input = join(tmpdir(), `project-brief-v1-${process.pid}.json`);
  await writeFile(input, JSON.stringify(fixture));

  await page.setInputFiles('#import-file', input);
  await page.locator('#import-status').filter({ hasText: 'ProjectBrief v1 importado' }).waitFor();
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
