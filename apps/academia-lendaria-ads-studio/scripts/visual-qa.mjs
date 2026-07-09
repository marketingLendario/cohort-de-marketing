import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.VISUAL_QA_BASE_URL ?? 'http://127.0.0.1:5177';
const outputDirectory = process.env.VISUAL_QA_OUTPUT_DIR ?? '/tmp/cohort-marketing-visual-qa';
const projectId = 'demo-project-academia-lendaria';
const routes = [
  ['overview', `/projects/${projectId}/overview`, /Próximo passo do projeto/i],
  ['briefing', `/projects/${projectId}/briefing/project`, /do projeto/i],
  ['journey', `/projects/${projectId}/journey`, /Mapa do trabalho/i],
  ['artifacts', `/projects/${projectId}/artifacts`, /Artefatos do projeto/i],
  ['campaigns', `/projects/${projectId}/campaigns`, /Campanhas do projeto/i],
  ['weeks', `/projects/${projectId}/weeks`, /Painel da semana/i],
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { baseUrl, outputDirectory, viewports: {}, errors: [] };

async function assertNoViewportOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const rootOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll('body *')]
      .filter((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        if (style.position === 'fixed' || style.overflowX === 'auto' || style.overflowX === 'scroll') return false;
        return box.width > 0 && box.right > document.documentElement.clientWidth + 2;
      })
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: String(element.className).slice(0, 100),
        right: Math.round(element.getBoundingClientRect().right),
      }));
    return { rootOverflow, offenders };
  });
  if (overflow.rootOverflow > 2) {
    throw new Error(`${label}: overflow horizontal de ${overflow.rootOverflow}px (${JSON.stringify(overflow.offenders)})`);
  }
}

async function authenticate(page) {
  await page.goto(`${baseUrl}/projects`, { waitUntil: 'networkidle' });
  const email = page.getByLabel('E-mail');
  if (await email.isVisible()) {
    await email.fill('demo@academialendaria.local');
    await page.getByLabel('Senha').fill('adsfactory');
    await page.getByRole('button', { name: 'Entrar' }).click();
  }
  await page.getByRole('heading', { name: /Seus projetos/i }).waitFor();
}

async function validateViewport(name, viewport) {
  const context = await browser.newContext({ viewport, colorScheme: 'dark' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  await authenticate(page);
  const screenshots = [];
  for (const [slug, path, heading] of routes) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: heading }).first().waitFor();
    await page.locator('.asx-topbar').waitFor();

    if (name === 'desktop') {
      if (!(await page.locator('.cms-sidebar').isVisible())) throw new Error(`${slug}: sidebar desktop ausente`);
    } else {
      if (await page.locator('.cms-sidebar').isVisible()) throw new Error(`${slug}: sidebar desktop visível no mobile`);
      if (!(await page.locator('.cms-mobile-nav').isVisible())) throw new Error(`${slug}: navegação mobile ausente`);
    }

    await assertNoViewportOverflow(page, `${name}/${slug}`);
    const screenshot = resolve(outputDirectory, `${name}-${slug}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
    screenshots.push(screenshot);
  }

  if (name === 'desktop') {
    await page.goto(`${baseUrl}/projects/${projectId}/journey`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Grade' }).click();
    await page.getByPlaceholder('Buscar skill').fill('diagnosticador');
    await page.getByRole('button', { name: /Diagnosticador/i }).first().waitFor();

    await page.goto(`${baseUrl}/projects/${projectId}/weeks`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Nova semana/i }).click();
    await page.getByRole('heading', { name: 'Valores literais confirmados' }).waitFor();
  }

  if (errors.length) throw new Error(`${name}: erros no navegador: ${errors.join(' | ')}`);
  report.viewports[name] = { viewport, screenshots, routes: routes.length };
  await context.close();
}

try {
  await validateViewport('desktop', { width: 1440, height: 1000 });
  await validateViewport('mobile', { width: 390, height: 844 });
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
  throw error;
} finally {
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}
