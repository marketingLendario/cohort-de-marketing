import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { TRAFFIC_PILOT } from './fixtures/traffic-pilot/fixture.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const evidenceDir = resolve(appRoot, 'design-qa-evidence/epic-10');
const studioUrl = process.env.MARKETING_STUDIO_URL ?? 'http://127.0.0.1:5177';
const campaignUrl = `${studioUrl}/projects/${TRAFFIC_PILOT.projectId}/campaigns/${TRAFFIC_PILOT.campaignId}/creatives`;
const fieldViewer = {
  email: TRAFFIC_PILOT.email,
  password: TRAFFIC_PILOT.password,
};

const evidence = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  fixture: {
    projectId: TRAFFIC_PILOT.projectId,
    campaignId: TRAFFIC_PILOT.campaignId,
    projectSlug: TRAFFIC_PILOT.projectSlug,
  },
  scenarios: [],
};

async function authenticate(page) {
  await page.goto(studioUrl, { waitUntil: 'domcontentloaded' });
  const loginForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Entrar', exact: true }) });
  const email = loginForm.getByLabel('E-mail');
  await loginForm.waitFor({ state: 'visible', timeout: 30_000 });
  await email.fill(fieldViewer.email);
  await loginForm.getByLabel('Senha').fill(fieldViewer.password);
  await loginForm.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForFunction(
    () => Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token')),
    undefined,
    { timeout: 10_000 },
  );
  await page.locator('main').waitFor({ state: 'visible' });
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
  const authBeforeNavigation = await page.evaluate(() => ({
    sessionPersisted: Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token')),
  }));
  await page.goto(campaignUrl, { waitUntil: 'networkidle' });
  await page.getByText('Pacote aprovado', { exact: true }).waitFor({ timeout: 30_000 }).catch(async (error) => {
    const body = (await page.locator('body').innerText()).slice(0, 1_500).replaceAll(fieldViewer.email, '[fixture-email]');
    const authAfterNavigation = await page.evaluate(() => ({
      sessionPersisted: Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token')),
    }));
    throw new Error(`${name}: estado aprovado não hidratou em ${page.url()}\nauthBefore=${JSON.stringify(authBeforeNavigation)} authAfter=${JSON.stringify(authAfterNavigation)}\n${body}\n${error.message}`);
  });
  await page.locator('.cms-factory-card img').first().waitFor({ state: 'visible' });

  const state = await page.evaluate(() => ({
    approved: document.body.innerText.toLocaleLowerCase('pt-BR').includes('pacote aprovado'),
    imageCount: document.querySelectorAll('.cms-factory-card img').length,
    images: [...document.querySelectorAll('.cms-factory-card img')].map((image) => ({
      alt: image.alt,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    })),
    hasCta: [...document.querySelectorAll('.cms-factory-card')].every((card) => /CTA/i.test(card.innerText)),
    hasLinkDescription: [...document.querySelectorAll('.cms-factory-card')].every((card) => /LINK/i.test(card.innerText)),
    statusLabelVisible: document.body.innerText.includes('Pronto para subida'),
    internalStatusVisible: document.body.innerText.includes('not_ready'),
    nextStageEnabled: [...document.querySelectorAll('button')].some((button) => /próxim|avanç/i.test(button.textContent ?? '') && !button.disabled),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));

  if (!state.approved) throw new Error(`${name}: pacote não persistiu como aprovado`);
  if (state.imageCount < 2) throw new Error(`${name}: esperava ao menos 2 criativos, recebeu ${state.imageCount}`);
  if (state.images.some((image) => !image.complete || image.naturalWidth !== 1080 || image.naturalHeight !== 1350)) {
    throw new Error(`${name}: imagem ausente ou fora de 1080x1350`);
  }
  if (!state.hasCta || !state.hasLinkDescription) throw new Error(`${name}: CTA ou descrição de link ausente`);
  if (!state.statusLabelVisible || state.internalStatusVisible) throw new Error(`${name}: status interno vazou na interface`);
  if (!state.nextStageEnabled) throw new Error(`${name}: próximo estágio continua bloqueado após aprovação`);
  if (state.horizontalOverflow) throw new Error(`${name}: overflow horizontal detectado`);
  if (consoleErrors.length || requestFailures.length) {
    throw new Error(`${name}: erros no navegador: ${[...consoleErrors, ...requestFailures].join(' | ')}`);
  }

  const screenshot = `creative-factory-${name}-fresh-context.png`;
  await page.screenshot({ path: resolve(evidenceDir, screenshot), fullPage: true });
  evidence.scenarios.push({ name, viewport, screenshot, ...state, consoleErrors, requestFailures });
  await context.close();
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  await validateViewport(browser, 'desktop', { width: 1440, height: 1000 });
  await validateViewport(browser, 'mobile', { width: 390, height: 844 });
  await writeFile(resolve(evidenceDir, 'creative-factory-field-validation.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
