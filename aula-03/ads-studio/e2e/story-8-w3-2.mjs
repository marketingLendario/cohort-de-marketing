import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5177';
const evidenceDir = process.env.E2E_EVIDENCE_DIR ?? '/tmp/story-8-w3-2-evidence';
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const consoleErrors = [];
const failedRequests = [];
const badResponses = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('requestfailed', (request) => {
  const errorText = request.failure()?.errorText ?? '';
  if (!errorText.includes('ERR_ABORTED')) failedRequests.push(`${request.method()} ${request.url()} ${errorText}`);
});
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) badResponses.push(`${response.status()} ${response.url()}`);
});

async function settle() {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(150);
}

async function signInIfNeeded() {
  if (await page.getByLabel('E-mail').isVisible().catch(() => false)) {
    await page.getByLabel('E-mail').fill('demo@academialendaria.local');
    await page.getByLabel('Senha').fill('adsfactory');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.getByTestId('dashboard').waitFor();
  }
}

async function assertNoVisibleOverlaps(label) {
  const conflicts = await page.evaluate(() => {
    const elements = [...document.querySelectorAll('[data-testid], .asx-page-head, .asx-monitor-queue > article, .al-btn')]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
    const result = [];
    for (let index = 0; index < elements.length; index += 1) {
      for (let next = index + 1; next < elements.length; next += 1) {
        const left = elements[index];
        const right = elements[next];
        if (left.contains(right) || right.contains(left)) continue;
        const leftRect = left.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        const overlapWidth = Math.min(leftRect.right, rightRect.right) - Math.max(leftRect.left, rightRect.left);
        const overlapHeight = Math.min(leftRect.bottom, rightRect.bottom) - Math.max(leftRect.top, rightRect.top);
        if (overlapWidth > 1 && overlapHeight > 1) {
          result.push(`${left.getAttribute('data-testid') ?? left.tagName} x ${right.getAttribute('data-testid') ?? right.tagName}`);
        }
      }
    }
    return result;
  });
  assert.deepEqual(conflicts, [], `${label}: ${conflicts.join(', ')}`);
}

try {
  await page.goto(`${baseURL}/dashboard`);
  await signInIfNeeded();
  await settle();
  await page.getByTestId('unified-cutover-bridge').waitFor();
  await page.getByTestId('monitor-alerts-empty').waitFor();
  assert.equal(await page.getByText(/Epic 5|Story 5\.2|placeholder/i).count(), 0, 'future placeholder copy leaked into dashboard');
  await page.screenshot({ path: `${evidenceDir}/dashboard-desktop.png`, fullPage: true });
  await assertNoVisibleOverlaps('dashboard desktop');

  const bridgeHref = await page.getByTestId('unified-cutover-bridge').getByRole('link', { name: 'Abrir projetos' }).getAttribute('href');
  assert.match(bridgeHref ?? '', /^\/projects\/demo-project-academia-lendaria\/overview\?campaignId=demo-campaign-001$/);
  await page.getByRole('link', { name: 'Abrir projetos' }).click();
  await page.getByText('Próximo passo do projeto').waitFor();
  await page.goBack();
  await page.getByTestId('unified-cutover-bridge').waitFor();

  await page.evaluate(() => {
    const key = 'cohort-marketing-studio.project-state';
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{"state":{}}');
    persisted.state.weeklyPanels = [{
      schemaVersion: '1.0.0',
      id: 'week-demo-campaign-001-2026-07-06',
      projectId: 'demo-project-academia-lendaria',
      campaignId: 'demo-campaign-001',
      weekStart: '2026-07-06',
      revision: 2,
      status: 'diagnosed',
      metrics: [{ name: 'CTR', value: 0.8, seal: 'Real', source: 'Meta Ads', attributionWindow: null, premise: null, confirmedByHuman: true }],
      reader: { literalOnly: true, sampleSufficientForCpa: false, note: 'Leitura confirmada.' },
      diagnosis: {
        hypothesis: 'O CTR está abaixo do sinal esperado.',
        singleLever: 'Revisar o primeiro hook',
        successCriterion: 'Confirmar melhora do CTR na próxima leitura.',
        reversalCriterion: 'Reverter se a próxima leitura não confirmar melhora.',
        circuitBreakerTriggered: false,
      },
      decision: { status: 'pending' },
      events: [],
    }];
    localStorage.setItem(key, JSON.stringify(persisted));
  });
  await page.reload();
  await page.getByTestId('monitor-alert-card').waitFor();
  const alertCard = page.getByTestId('monitor-alert-card');
  assert.equal(await alertCard.getByText('Campanha demo - Máquina de Receita').count(), 1);
  assert.equal(await alertCard.getByText('O CTR está abaixo do sinal esperado.').count(), 1);
  assert.equal(await page.getByRole('link', { name: 'Revisar no painel semanal' }).count(), 1);
  await page.screenshot({ path: `${evidenceDir}/dashboard-alert-desktop.png`, fullPage: true });
  await assertNoVisibleOverlaps('dashboard alert desktop');

  await page.evaluate(() => {
    const key = 'cohort-marketing-studio.project-state';
    const persisted = JSON.parse(localStorage.getItem(key) ?? '{"state":{}}');
    persisted.state.weeklyPanels[0].diagnosis = {
      hypothesis: '',
      singleLever: '',
      successCriterion: '',
      reversalCriterion: '',
    };
    localStorage.setItem(key, JSON.stringify(persisted));
  });
  await page.goto(`${baseURL}/dashboard?campaignId=does-not-exist`);
  await page.getByTestId('unified-cutover-bridge').waitFor();
  const unknownCampaignHref = await page.getByTestId('unified-cutover-bridge').getByRole('link', { name: 'Abrir projetos' }).getAttribute('href');
  assert.equal(unknownCampaignHref, '/projects?legacyCampaignId=does-not-exist');
  assert.equal(await page.getByTestId('monitor-alert-card').count(), 0, 'incomplete diagnosis produced an alert');
  await page.getByTestId('monitor-alerts-empty').waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/projects`);
  await page.getByText('Seus projetos').waitFor();
  await settle();
  await page.reload();
  await page.getByText('Seus projetos').waitFor();
  await page.screenshot({ path: `${evidenceDir}/projects-mobile.png`, fullPage: true });
  await assertNoVisibleOverlaps('projects mobile');

  await page.goto(`${baseURL}/dashboard?campaignId=demo-campaign-001`);
  await page.getByTestId('unified-cutover-bridge').waitFor();
  const contextualHref = await page.getByTestId('unified-cutover-bridge').getByRole('link', { name: 'Abrir projetos' }).getAttribute('href');
  assert.match(contextualHref ?? '', /^\/projects\/demo-project-academia-lendaria\/overview\?campaignId=demo-campaign-001$/);
  await page.getByRole('link', { name: 'Abrir projetos' }).click();
  await page.getByText('Próximo passo do projeto').waitFor();
  await page.goBack();
  await page.getByTestId('unified-cutover-bridge').waitFor();

  for (const step of ['1', '2', '3', '4', '5', '6', '7', '8']) {
    await page.goto(`${baseURL}/campaigns/demo-campaign-001/${step}`);
    await page.getByTestId('legacy-cutover-bridge').waitFor();
    const href = await page.getByTestId('legacy-cutover-bridge').getByRole('link').getAttribute('href');
    assert.match(href ?? '', new RegExp(`^/projects/demo-project-academia-lendaria/campaigns/demo-campaign-001/`));
    assert.equal(await page.getByText(/Impacto .* budget|Fila de aprovação humana/i).count(), 0, 'legacy monitor fabricated surface leaked');
    assert.equal(await page.getByRole('button', { name: /Publicar pausado|Publicar campanha/i }).count(), 0, 'legacy Meta mutation control leaked');
    if (step === '8') {
      await page.screenshot({ path: `${evidenceDir}/legacy-step-8-mobile.png`, fullPage: true });
      await assertNoVisibleOverlaps('legacy step 8 mobile');
    }
  }

  await page.goto(`${baseURL}/campaigns/demo-campaign-001/9`);
  await page.getByRole('heading', { name: 'Passo de campanha inválido' }).waitFor();
  await page.getByRole('link', { name: 'Abrir projetos' }).waitFor();

  await page.goto(`${baseURL}/campaigns/not-a-real-campaign/8`);
  await page.getByTestId('legacy-cutover-bridge').waitFor();
  const fallbackHref = await page.getByTestId('legacy-cutover-bridge').getByRole('link').getAttribute('href');
  assert.match(fallbackHref ?? '', /^\/projects\?legacyCampaignId=not-a-real-campaign&legacyStep=8$/);
  await page.reload();
  await page.getByTestId('legacy-cutover-bridge').waitFor();

  assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join('\n')}`);
  assert.deepEqual(failedRequests, [], `failed requests: ${failedRequests.join('\n')}`);
  assert.deepEqual(badResponses, [], `bad responses: ${badResponses.join('\n')}`);
  console.log(`Story 8.W3.2 Playwright PASS. Evidence: ${evidenceDir}`);
} finally {
  await browser.close();
}
