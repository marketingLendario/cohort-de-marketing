import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { TRAFFIC_PILOT } from './fixtures/traffic-pilot/fixture.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const evidenceDir = resolve(appRoot, 'design-qa-evidence/epic-11/external-research-visual');
const studioUrl = process.env.MARKETING_STUDIO_URL ?? 'http://127.0.0.1:5177';
const journeyUrl = `${studioUrl}/projects/${TRAFFIC_PILOT.projectId}/journey`;
const skills = ['avatar-funil', 'espiao-do-concorrente', 'trend-hunting', 'conteudo-funil'];

async function authenticate(page) {
  await page.goto(studioUrl, { waitUntil: 'domcontentloaded' });
  const login = page.locator('form').filter({ has: page.getByRole('button', { name: 'Entrar', exact: true }) });
  await login.waitFor({ state: 'visible', timeout: 30_000 });
  await login.getByLabel('E-mail').fill(TRAFFIC_PILOT.email);
  await login.getByLabel('Senha').fill(TRAFFIC_PILOT.password);
  await login.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForFunction(() => Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token')), undefined, { timeout: 10_000 });
}

async function selectSkill(page, skillId) {
  await page.getByRole('button', { name: new RegExp(`^${skillId}`, 'i') }).click();
  await page.getByRole('heading', { name: skillId, exact: true }).waitFor();
  await page.getByRole('region', { name: 'Fontes da pesquisa' }).waitFor();
}

async function validateViewport(browser, name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const requestFailures = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? 'request failed';
    if (!failure.includes('ERR_ABORTED')) requestFailures.push(`${request.method()} ${request.url()}: ${failure}`);
  });

  await authenticate(page);
  await page.goto(journeyUrl, { waitUntil: 'networkidle' });
  const scenarios = [];
  for (const skillId of skills) {
    await selectSkill(page, skillId);
    const research = page.getByRole('region', { name: 'Fontes da pesquisa' });
    const modeGroup = research.getByRole('group', { name: 'Modo da pesquisa' });
    const modes = await modeGroup.getByRole('button').allTextContents();
    const sourceOptions = await research.getByRole('combobox', { name: 'Fonte' }).locator('option').allTextContents();
    if (modes.join('|') !== 'Rede|Material colado|Híbrido') throw new Error(`${skillId}/${name}: modos divergentes`);
    if (sourceOptions.length !== 7) throw new Error(`${skillId}/${name}: esperava 7 fontes`);

    await modeGroup.getByRole('button', { name: 'Material colado', exact: true }).click();
    const offline = {
      materialVisible: await research.getByRole('textbox', { name: 'Material literal' }).isVisible(),
      targetHidden: await research.getByRole('textbox', { name: 'Alvo' }).count() === 0,
    };
    await modeGroup.getByRole('button', { name: 'Híbrido', exact: true }).click();
    const hybrid = {
      materialVisible: await research.getByRole('textbox', { name: 'Material literal' }).isVisible(),
      targetVisible: await research.getByRole('textbox', { name: 'Alvo' }).isVisible(),
    };
    if (!offline.materialVisible || !offline.targetHidden || !hybrid.materialVisible || !hybrid.targetVisible) {
      throw new Error(`${skillId}/${name}: alternância de modo inválida`);
    }
    const screenshot = `${name}-${skillId}.png`;
    await page.screenshot({ path: resolve(evidenceDir, screenshot), fullPage: true });
    scenarios.push({ skillId, modes, sourceOptions, offline, hybrid, screenshot });
  }

  const layout = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    secretMarkersVisible: /APIFY_API_TOKEN|apify_api_|OPENAI_API_KEY/.test(document.body.innerText),
  }));
  if (layout.horizontalOverflow || layout.secretMarkersVisible || consoleErrors.length || requestFailures.length) {
    throw new Error(`${name}: gate visual ou de segredo falhou`);
  }
  await context.close();
  return { name, viewport, scenarios, layout, consoleErrors, requestFailures };
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const evidence = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    viewports: [
      await validateViewport(browser, 'desktop', { width: 1440, height: 1000 }),
      await validateViewport(browser, 'mobile', { width: 390, height: 844 }),
    ],
  };
  await writeFile(resolve(evidenceDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
