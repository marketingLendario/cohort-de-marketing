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
const evidence = { schemaVersion: '1.0.0', surface: 'cli-to-panel', generatedAt: new Date().toISOString(), scenarios: [] };

async function selectSalesPage(page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.getByRole('button', { name: /^pagina-vendas-funil/i }).click();
    await page.getByRole('heading', { name: 'pagina-vendas-funil', exact: true }).waitFor({ timeout: 1_500 }).catch(() => undefined);
    if (await page.getByRole('heading', { name: 'pagina-vendas-funil', exact: true }).isVisible()) {
      await page.waitForTimeout(500);
      return;
    }
  }
  throw new Error('A seleção da página de vendas não estabilizou após a hidratação.');
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const scenario of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 } },
    { name: 'mobile', viewport: { width: 390, height: 844 } },
  ]) {
    const context = await browser.newContext({ viewport: scenario.viewport });
    const page = await context.newPage();
    const consoleErrors = [];
    const requestFailures = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('requestfailed', (request) => { if (!request.failure()?.errorText?.includes('ERR_ABORTED')) requestFailures.push(request.url()); });
    await page.goto(studioUrl, { waitUntil: 'domcontentloaded' });
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Entrar', exact: true }) });
    await form.getByLabel('E-mail').fill(TRAFFIC_PILOT.email);
    await form.getByLabel('Senha').fill(TRAFFIC_PILOT.password);
    await form.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForFunction(() => Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token')));
    await page.goto(journeyUrl, { waitUntil: 'networkidle' });
    await selectSalesPage(page);
    await page.locator('.cms-run-status strong').getByText('Concluída', { exact: true }).waitFor();
    await page.getByRole('link', { name: /Abrir artefatos/i }).click();
    await page.getByPlaceholder('Buscar artefato').fill('pagina/index.pdf');
    await page.getByText('pagina/index.pdf', { exact: true }).waitFor();
    const artifact = page.locator('.cms-artifact-row').filter({ has: page.getByText('pagina/index.pdf', { exact: true }) });
    const verified = await artifact.getByText('Verificado', { exact: true }).isVisible();
    const layout = await page.evaluate(() => ({ horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 }));
    if (!verified || layout.horizontalOverflow || consoleErrors.length || requestFailures.length) throw new Error(`${scenario.name}: handoff CLI-painel inválido`);
    const screenshot = `cli-panel-handoff-${scenario.name}.png`;
    await page.screenshot({ path: resolve(evidenceDir, screenshot), fullPage: true });
    evidence.scenarios.push({ ...scenario, screenshot, runStatus: 'done', artifact: 'pagina/index.pdf', verified, layout, consoleErrors, requestFailures });
    await context.close();
  }
  await writeFile(resolve(evidenceDir, 'cli-panel-handoff.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
