import { createHash } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { createTrafficPilotFixture, TRAFFIC_PILOT } from './fixtures/traffic-pilot/fixture.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const evidenceDir = resolve(appRoot, 'design-qa-evidence/epic-10');
const studioUrl = process.env.MARKETING_STUDIO_URL ?? 'http://127.0.0.1:5177';
const campaignUrl = `${studioUrl}/projects/${TRAFFIC_PILOT.projectId}/campaigns/${TRAFFIC_PILOT.campaignId}/creatives`;
const curationUrl = `${studioUrl}/projects/${TRAFFIC_PILOT.projectId}/campaigns/${TRAFFIC_PILOT.campaignId}/curation`;
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
  generation: { executed: false, selectedItems: 0 },
  scenarios: [],
};

const designFixture = [
  '---',
  'name: Marca Fixture',
  'version: 1.0',
  'colors:',
  '  primary: "#c8a46b"',
  '  surface: "#101010"',
  '  text: "#f4f2ee"',
  '  text-muted: "#8a8a8a"',
  'typography:',
  '  display: Newsreader',
  '  body: Inter',
  '---',
  '# Design System - Marca Fixture',
  '',
].join('\n');

async function authenticate(page) {
  console.log('[creative-factory:e2e] autenticando fixture');
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
  console.log('[creative-factory:e2e] autenticação concluída');
}

async function ensureApprovedPackage(page, name) {
  const approved = page.getByText('Pacote aprovado', { exact: true });
  const generate = page.getByRole('button', { name: 'Gerar lote real', exact: true });
  const readyDeadline = Date.now() + 30_000;
  while (Date.now() < readyDeadline) {
    if (await approved.isVisible().catch(() => false)) return;
    if (await generate.isVisible().catch(() => false)) break;
    await page.waitForTimeout(250);
  }
  if (!await generate.isVisible().catch(() => false)) {
    const body = (await page.locator('body').innerText()).slice(0, 1_500).replaceAll(fieldViewer.email, '[fixture-email]');
    throw new Error(`${name}: nem pacote aprovado nem formulário de geração apareceram.\n${body}`);
  }
  if (name !== 'desktop') throw new Error(`${name}: pacote não foi preparado pela execução desktop.`);
  if (!await generate.isEnabled()) throw new Error('desktop: geração real está desabilitada; faltam finalistas ou configuração da campanha.');

  await generate.click();
  console.log('[creative-factory:e2e] lote real solicitado');
  const reviewHeading = page.getByRole('heading', { name: /criativos gerados/i });
  const failure = page.locator('.cms-campaign-stage .cms-inline-error').last();
  const deadline = Date.now() + 35 * 60_000;
  while (Date.now() < deadline) {
    if (await reviewHeading.isVisible().catch(() => false)) break;
    if (await failure.isVisible().catch(() => false)) {
      const diagnostic = (await failure.innerText()).trim();
      await page.screenshot({ path: resolve(evidenceDir, 'creative-factory-generation-error.png'), fullPage: true });
      throw new Error(`desktop: lote real falhou antes da revisão: ${diagnostic}`);
    }
    await page.waitForTimeout(500);
  }
  if (!await reviewHeading.isVisible().catch(() => false)) {
    await page.screenshot({ path: resolve(evidenceDir, 'creative-factory-generation-timeout.png'), fullPage: true });
    throw new Error('desktop: lote real não chegou à revisão dentro de 35 minutos.');
  }
  const selectable = page.locator('.cms-factory-select input[type="checkbox"]');
  const selectableCount = await selectable.count();
  let approvedByGate = 0;
  for (let index = 0; index < selectableCount; index += 1) {
    const candidate = selectable.nth(index);
    if (!await candidate.isEnabled()) continue;
    await candidate.check();
    approvedByGate += 1;
  }
  if (approvedByGate < 2) throw new Error(`desktop: esperava ao menos 2 itens aprovados pelo gate, recebeu ${approvedByGate} de ${selectableCount}.`);
  const promote = page.getByRole('button', { name: new RegExp(`Promover ${approvedByGate} selecionado`), exact: false });
  await promote.click();
  await page.getByText('Pacote aprovado', { exact: true }).waitFor({ timeout: 120_000 });
  const persistDeadline = Date.now() + 30_000;
  let persistedStatus = null;
  while (Date.now() < persistDeadline) {
    const result = await fixture.admin
      .from('campaign_plan_revisions')
      .select('data')
      .eq('campaign_id', TRAFFIC_PILOT.campaignId)
      .order('revision', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (result.error) throw new Error(`Falha consultando pacote persistido: ${result.error.message}`);
    persistedStatus = result.data?.data?.creativeFactory?.status ?? null;
    if (persistedStatus === 'approved') break;
    await page.waitForTimeout(250);
  }
  if (persistedStatus !== 'approved') {
    throw new Error(`desktop: pacote apareceu aprovado na UI, mas persistiu como ${persistedStatus ?? 'ausente'}.`);
  }
  evidence.generation = { executed: true, selectedItems: approvedByGate, blockedItems: selectableCount - approvedByGate };
}

async function ensureFinalists(page) {
  console.log('[creative-factory:e2e] preparando finalistas');
  await page.goto(curationUrl, { waitUntil: 'domcontentloaded' });
  const form = page.locator('.cms-finalist-form');
  await form.waitFor({ state: 'visible', timeout: 30_000 });
  for (const [hook, copy] of [
    ['Pare de recomeçar toda segunda-feira', 'Um processo claro transforma intenção em execução semanal verificável.'],
    ['A rotina que vira uma decisão por semana', 'Planeje, execute e revise sem prometer resultado garantido.'],
  ]) {
    if (await page.getByText(hook, { exact: true }).isVisible().catch(() => false)) continue;
    await form.getByLabel('Hook').fill(hook);
    await form.getByLabel('Copy').fill(copy);
    await form.getByRole('button', { name: 'Adicionar finalista', exact: true }).click();
    await page.getByText(hook, { exact: true }).waitFor();
  }
  const expectedHooks = ['Pare de recomeçar toda segunda-feira', 'A rotina que vira uma decisão por semana'];
  const persistDeadline = Date.now() + 30_000;
  let persistedHooks = [];
  while (Date.now() < persistDeadline) {
    const result = await fixture.admin
      .from('campaign_plan_revisions')
      .select('data')
      .eq('campaign_id', TRAFFIC_PILOT.campaignId)
      .order('revision', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (result.error) throw new Error(`Falha consultando curadoria persistida: ${result.error.message}`);
    persistedHooks = (result.data?.data?.finalists ?? []).map((item) => item.hook);
    if (expectedHooks.every((hook) => persistedHooks.includes(hook))) break;
    await page.waitForTimeout(250);
  }
  if (!expectedHooks.every((hook) => persistedHooks.includes(hook))) {
    throw new Error(`Curadoria não persistiu os dois finalistas: ${JSON.stringify(persistedHooks)}`);
  }
  console.log('[creative-factory:e2e] finalistas prontos');
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
  if (name === 'desktop') await ensureFinalists(page);
  console.log(`[creative-factory:e2e] abrindo fábrica em ${name}`);
  await page.goto(campaignUrl, { waitUntil: 'domcontentloaded' });
  await ensureApprovedPackage(page, name);
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
const fixture = await createTrafficPilotFixture();
await writeFile(resolve(fixture.projectRoot, 'DESIGN.md'), designFixture, 'utf8');
const designArtifact = await fixture.admin.from('project_artifacts').insert({
  id: '85000000-0000-0000-0000-000000000032',
  workspace_id: fixture.workspaceId,
  project_id: fixture.projectId,
  artifact_type: 'design',
  title: 'Design aprovado da fixture',
  path: 'DESIGN.md',
  format: 'markdown',
  state: 'confirmed',
  verification: 'confirmed',
  source: 'filesystem',
  content: designFixture,
  content_hash: createHash('sha256').update(designFixture).digest('hex'),
});
if (designArtifact.error) throw designArtifact.error;
const browser = await chromium.launch({ headless: true });

try {
  await validateViewport(browser, 'desktop', { width: 1440, height: 1000 });
  await validateViewport(browser, 'mobile', { width: 390, height: 844 });
  await writeFile(resolve(evidenceDir, 'creative-factory-field-validation.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
  await fixture.cleanup();
}
