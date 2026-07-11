import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { TRAFFIC_PILOT } from './fixtures/traffic-pilot/fixture.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const evidenceDir = resolve(appRoot, 'design-qa-evidence/epic-11');
const studioUrl = process.env.MARKETING_STUDIO_URL ?? 'http://127.0.0.1:5177';
const journeyUrl = `${studioUrl}/projects/${TRAFFIC_PILOT.projectId}/journey`;

const evidence = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  matrix: { total: 31, fullE2E: 9, partial: 6, proposalOnly: 16 },
  scenarios: [],
};

async function authenticate(page) {
  await page.goto(studioUrl, { waitUntil: 'domcontentloaded' });
  const loginForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Entrar', exact: true }) });
  await loginForm.waitFor({ state: 'visible', timeout: 30_000 });
  await loginForm.getByLabel('E-mail').fill(TRAFFIC_PILOT.email);
  await loginForm.getByLabel('Senha').fill(TRAFFIC_PILOT.password);
  await loginForm.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForFunction(
    () => Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token')),
    undefined,
    { timeout: 10_000 },
  );
}

async function validateViewport(browser, name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const requestFailures = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? 'request failed';
    if (!failure.includes('ERR_ABORTED')) requestFailures.push(`${request.method()} ${new URL(request.url()).pathname}: ${failure}`);
  });

  await authenticate(page);
  await page.goto(journeyUrl, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /Mapa do trabalho/i }).waitFor({ timeout: 30_000 });

  const skillNodes = page.locator('.cms-skill-node');
  const skillCount = await skillNodes.count();
  if (skillCount !== 31) throw new Error(`${name}: esperava 31 skills, recebeu ${skillCount}`);

  await page.getByRole('button', { name: /offerbook/i }).click();
  await page.getByText('Painel e CLI validados', { exact: true }).waitFor();
  const offerbook = {
    parity: await page.getByText('Painel e CLI validados', { exact: true }).isVisible(),
    gapAbsent: (await page.getByText('Para equivalência completa', { exact: true }).count()) === 0,
  };
  const proposalScreenshot = `parity-contract-${name}-proposal.png`;
  await page.screenshot({ path: resolve(evidenceDir, proposalScreenshot), fullPage: true });

  await page.getByRole('button', { name: /zelador/i }).click();
  await page.getByText('Painel e CLI validados', { exact: true }).waitFor();
  const zelador = {
    parity: await page.getByText('Painel e CLI validados', { exact: true }).isVisible(),
    gapAbsent: (await page.getByText('Para equivalência completa', { exact: true }).count()) === 0,
  };

  const layout = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    overlappingDetail: (() => {
      const detail = document.querySelector('.cms-skill-detail');
      if (!detail) return true;
      const rect = detail.getBoundingClientRect();
      return rect.width <= 0 || rect.right > document.documentElement.clientWidth + 1;
    })(),
  }));

  if (!offerbook.parity || !offerbook.gapAbsent || !zelador.parity || !zelador.gapAbsent) {
    throw new Error(`${name}: contrato visual de paridade divergente`);
  }
  if (layout.horizontalOverflow || layout.overlappingDetail) throw new Error(`${name}: layout de paridade inválido`);
  if (consoleErrors.length || requestFailures.length) throw new Error(`${name}: erros no navegador`);

  const fullScreenshot = `parity-contract-${name}-full.png`;
  await page.screenshot({ path: resolve(evidenceDir, fullScreenshot), fullPage: true });
  evidence.scenarios.push({ name, viewport, screenshots: { proposal: proposalScreenshot, full: fullScreenshot }, skillCount, offerbook, zelador, layout, consoleErrors, requestFailures });
  await context.close();
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  await validateViewport(browser, 'desktop', { width: 1440, height: 1000 });
  await validateViewport(browser, 'mobile', { width: 390, height: 844 });
  await writeFile(resolve(evidenceDir, 'parity-contract.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
