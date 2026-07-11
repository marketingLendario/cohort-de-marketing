import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { createDocumentPackFixture, DOCUMENT_PACK_FIXTURE } from './fixtures/document-pack/fixture.mjs';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const repoRoot = resolve(appRoot, '..', '..');
const sourceRoot = resolve(repoRoot, 'projetos', 'academia-fit');
const evidenceDir = resolve(appRoot, 'design-qa-evidence', 'epic-11', 'visual-production-live');
const surface = 'cli';
const project = DOCUMENT_PACK_FIXTURE.surfaces[surface];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function localRunnerToken() {
  const { stdout: pidOutput } = await execFileAsync('lsof', ['-tiTCP:3002', '-sTCP:LISTEN']);
  const pid = pidOutput.trim().split('\n')[0];
  if (!pid) throw new Error('BFF não está escutando na porta 3002.');
  const { stdout } = await execFileAsync('ps', ['eww', '-p', pid, '-o', 'command='], { maxBuffer: 2_000_000 });
  const token = stdout.match(/(?:^|\s)LOCAL_SKILL_RUNNER_TOKEN=([^\s]+)/)?.[1];
  if (!token) throw new Error('O processo do BFF não expõe LOCAL_SKILL_RUNNER_TOKEN.');
  return token;
}

async function connectExistingFixture() {
  const { stdout } = await execFileAsync('supabase', ['status', '-o', 'json'], { cwd: appRoot, maxBuffer: 2_000_000 });
  const status = JSON.parse(stdout);
  const config = { url: status.API_URL, anonKey: status.ANON_KEY, serviceRoleKey: status.SERVICE_ROLE_KEY };
  const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } });
  return {
    ...DOCUMENT_PACK_FIXTURE,
    config,
    admin,
    projectRoot: (selectedSurface) => resolve(repoRoot, 'projetos', DOCUMENT_PACK_FIXTURE.surfaces[selectedSurface].slug),
    async runsFor(selectedSurface, skillId) {
      const { data, error } = await admin.from('skill_runs').select('*')
        .eq('project_id', DOCUMENT_PACK_FIXTURE.surfaces[selectedSurface].projectId)
        .eq('skill_id', skillId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(`Falha lendo runs ${selectedSurface}/${skillId}: ${error.message}`);
      return data ?? [];
    },
  };
}

async function latestReviewResult(fixture, skillId) {
  const { data, error } = await fixture.admin.from('skill_runs')
    .select('id, skill_id, skill_hash, proposal, input_snapshot, status')
    .eq('project_id', project.projectId)
    .eq('skill_id', skillId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.proposal) throw new Error(`Proposta final de ${skillId} indisponível: ${error?.message ?? 'sem proposta'}`);
  return {
    skillId,
    jobId: data.input_snapshot?.jobId,
    skillRunId: data.id,
    status: data.status,
    model: skillId === 'design-md' ? 'codex-cli-default' : 'codex-cli-default+codex-cli-image-gen',
    skillHash: data.skill_hash,
    proposal: data.proposal,
  };
}

async function seedProductionPrerequisites(fixture) {
  const additions = [
    { id: '85000000-0000-0000-0000-112000000101', artifactType: 'offerbook', title: 'Offerbook confirmado', path: 'offerbook.md' },
    { id: '85000000-0000-0000-0000-112000000102', artifactType: 'copy', title: 'Fundação de copy confirmada', path: 'copy.md' },
  ];
  for (const addition of additions) {
    const content = await readFile(resolve(sourceRoot, addition.path), 'utf8');
    await writeFile(resolve(fixture.projectRoot(surface), addition.path), content, 'utf8');
    const { error } = await fixture.admin.from('project_artifacts').insert({
      id: addition.id,
      workspace_id: fixture.workspaceId,
      project_id: project.projectId,
      artifact_type: addition.artifactType,
      title: addition.title,
      path: addition.path,
      format: 'markdown',
      state: 'confirmed',
      verification: 'confirmed',
      source: 'filesystem',
      content,
      content_hash: sha256(content),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`Falha criando pré-requisito ${addition.path}: ${error.message}`);
  }
}

async function contextArtifacts(fixture) {
  const { data, error } = await fixture.admin.from('project_artifacts')
    .select('artifact_type, title, path, format, content, verification')
    .eq('project_id', project.projectId)
    .eq('verification', 'confirmed')
    .order('path', { ascending: true });
  if (error) throw new Error(`Falha lendo contexto confirmado: ${error.message}`);
  return (data ?? []).filter((artifact) => typeof artifact.content === 'string' && artifact.format === 'markdown').map((artifact) => ({
    artifactType: artifact.artifact_type,
    title: artifact.title,
    path: artifact.path,
    content: artifact.content,
  }));
}

function continuation(skillId, result) {
  const answers = result.proposal.questions.map((question) => {
    const normalized = question.toLowerCase();
    if (skillId === 'design-md') return 'Use o DESIGN.md confirmado do projeto, sem alterar a direção. Aprovo esta identidade para gerar tokens e preview.';
    if (/aprova|aprovação/.test(normalized)) return 'Sim, aprovo explicitamente a copy, o roteiro e a direção visual desta amostra piloto para seguir ao gate visual. Isso não autoriza publicação.';
    if (/page_id|biblioteca de anúncios|concorrente/.test(normalized)) return 'Não existe page_id ou URL pública do concorrente nesta fixture. Trate o dossiê e o swipe confirmados como material offline fornecido; não afirme coleta ao vivo e mantenha publicação bloqueada.';
    if (/url pública|url exata|checkout|oferta/.test(normalized)) return 'Não existe URL pública verificável nesta fixture. Use somente produto, CTA, preço e garantia do offerbook confirmado, marque a URL como pendente e mantenha publicação bloqueada.';
    if (/tendênc/.test(normalized)) return 'seguir sem tendências';
    if (/rede|canal/.test(normalized)) return 'Meta Ads.';
    if (/formato/.test(normalized)) return 'Banner estático em 4:5, 9:16 e 1:1, mais um roteiro curto.';
    if (/escopo|quantidade|lote/.test(normalized)) return 'Uma peça piloto. Esta execução é a amostra para aprovação, sem lote adicional.';
    if (/voz/.test(normalized)) return 'Voz da marca registrada no offerbook e na copy confirmada.';
    if (/produto|item|mockup/.test(normalized)) return 'Método Consistência 90 em device mockup, usando somente offerbook e DESIGN.md confirmados.';
    return 'Use apenas os artefatos confirmados. Esta é uma peça piloto para revisão humana; marque qualquer fato ausente como pendente.';
  });
  return [
    `Continuação auditável de ${skillId}.`,
    ...result.proposal.questions.map((question, index) => `${index + 1}. ${question}\nResposta: ${answers[index]}`),
    'Não repita perguntas respondidas. Produza a proposta final se todos os gates estiverem satisfeitos.',
  ].join('\n\n');
}

async function runCliSkill({ fixture, token, skillId, context, operatorInput }) {
  let parentRunId;
  let currentInput = operatorInput;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const payload = {
      workspaceId: fixture.workspaceId,
      projectId: project.projectId,
      brief: fixture.briefFor(surface),
      context,
      operatorInput: currentInput,
      ...(parentRunId ? { elicitationParentRunId: parentRunId } : {}),
    };
    const inputPath = resolve(evidenceDir, `${skillId}-input-${attempt}.json`);
    const outputPath = resolve(evidenceDir, `${skillId}-result-${attempt}.json`);
    await writeFile(inputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    try {
      await execFileAsync('npm', ['run', 'skill:cli', '--', '--skill', skillId, '--input', inputPath, '--output', outputPath], {
        cwd: appRoot,
        timeout: 35 * 60_000,
        maxBuffer: 20_000_000,
        env: {
          ...process.env,
          MARKETING_STUDIO_BFF_URL: fixture.bffUrl,
          LOCAL_SKILL_RUNNER_TOKEN: token,
          VITE_SUPABASE_URL: fixture.config.url,
          VITE_SUPABASE_ANON_KEY: fixture.config.anonKey,
          MARKETING_STUDIO_EMAIL: fixture.email,
          MARKETING_STUDIO_PASSWORD: fixture.password,
        },
      });
    } catch (error) {
      if (error?.code !== 3) throw error;
    }
    const result = JSON.parse(await readFile(outputPath, 'utf8'));
    if (result.status !== 'needs_input') return result;
    parentRunId = result.skillRunId;
    currentInput = continuation(skillId, result);
  }
  throw new Error(`${skillId} não encerrou a elicitação em cinco rodadas.`);
}

function manifestOf(result) {
  const artifact = result.proposal.artifacts.find((candidate) => candidate.artifactType === 'creativeFactoryBatch');
  if (!artifact) throw new Error(`${result.skillId} não devolveu manifesto visual.`);
  return JSON.parse(artifact.content);
}

async function verifyManifest(manifest, token) {
  const expected = { feed: [1080, 1350], story: [1080, 1920], square: [1080, 1080] };
  if (!manifest.items.length) throw new Error('Manifesto visual vazio.');
  if (!manifest.items.some((item) => item.status === 'ready')) throw new Error(`${manifest.productionSkillId} não produziu item elegível para seleção humana.`);
  const assets = [];
  for (const item of manifest.items) {
    if (!/^[a-f0-9]{64}$/.test(item.promptSha256) || !item.promptSanitized) throw new Error(`Proveniência inválida em ${item.id}.`);
    for (const asset of item.assets) {
      const dimensions = expected[asset.format];
      if (!dimensions || asset.width !== dimensions[0] || asset.height !== dimensions[1]) throw new Error(`Dimensões inválidas em ${asset.id}.`);
      if (!/^[a-f0-9]{64}$/.test(asset.sha256)) throw new Error(`Hash inválido em ${asset.id}.`);
      const response = await fetch(`${DOCUMENT_PACK_FIXTURE.bffUrl}/api/local/creative-factory/batches/${manifest.batchId}/assets/${asset.id}`, {
        headers: { 'x-local-runner-token': token },
      });
      const body = Buffer.from(await response.arrayBuffer());
      if (!response.ok || body.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Asset PNG indisponível: ${asset.id}.`);
      if (sha256(body) !== asset.sha256) throw new Error(`Hash servido divergiu em ${asset.id}.`);
      assets.push({ ...asset, itemId: item.id });
    }
  }
  if (!['feed', 'story', 'square'].every((format) => assets.some((asset) => asset.format === format))) throw new Error('Cobertura dos três formatos incompleta.');
  return assets;
}

async function screenshotHtml(browser, html, prefix) {
  const checks = [];
  for (const scenario of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 } },
    { name: 'mobile', viewport: { width: 390, height: 844 } },
  ]) {
    const page = await browser.newPage({ viewport: scenario.viewport });
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setContent(html, { waitUntil: 'load' });
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (horizontalOverflow || errors.length) throw new Error(`${prefix}/${scenario.name} inválido: ${JSON.stringify({ horizontalOverflow, errors })}`);
    const screenshot = `${prefix}-${scenario.name}.png`;
    await page.screenshot({ path: resolve(evidenceDir, screenshot), fullPage: true });
    checks.push({ ...scenario, screenshot, horizontalOverflow, errors });
    await page.close();
  }
  return checks;
}

async function screenshotAssetGallery(browser, manifest, token, prefix) {
  const cards = manifest.items.flatMap((item) => item.assets.map((asset) => `<article><img src="${DOCUMENT_PACK_FIXTURE.bffUrl}/api/local/creative-factory/batches/${manifest.batchId}/assets/${asset.id}" alt="${asset.format}"><strong>${asset.format}</strong><span>${asset.width} × ${asset.height}</span></article>`)).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>*{box-sizing:border-box}body{margin:0;background:#f4f4f2;color:#171717;font:16px Arial;letter-spacing:0}.wrap{max-width:1160px;margin:auto;padding:28px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}article{background:#fff;border:1px solid #d8d8d4;border-radius:6px;overflow:hidden}img{display:block;width:100%;height:auto}strong,span{display:block;padding:10px 14px 0}span{padding-top:0;padding-bottom:14px;color:#555}@media(max-width:500px){.wrap{padding:14px}.grid{grid-template-columns:1fr}}</style></head><body><main class="wrap"><h1>${manifest.productionSkillId}</h1><div class="grid">${cards}</div></main></body></html>`;
  const context = await browser.newContext({ extraHTTPHeaders: { 'x-local-runner-token': token } });
  const checks = [];
  try {
    for (const scenario of [
      { name: 'desktop', viewport: { width: 1440, height: 1000 } },
      { name: 'mobile', viewport: { width: 390, height: 844 } },
    ]) {
      const page = await context.newPage();
      await page.setViewportSize(scenario.viewport);
      await page.setContent(html, { waitUntil: 'load' });
      await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
      const check = await page.evaluate(() => ({ horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1, imageCount: document.images.length }));
      if (check.horizontalOverflow || check.imageCount < 3) throw new Error(`Galeria ${prefix}/${scenario.name} inválida.`);
      const screenshot = `${prefix}-${scenario.name}.png`;
      await page.screenshot({ path: resolve(evidenceDir, screenshot), fullPage: true });
      checks.push({ ...scenario, screenshot, ...check });
      await page.close();
    }
  } finally {
    await context.close();
  }
  return checks;
}

async function waitForRunStatus(fixture, skillId, status, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const runs = await fixture.runsFor(surface, skillId);
    if (runs.at(-1)?.status === status) return runs.at(-1);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Run ${skillId} não chegou a ${status}.`);
}

async function reviewInPanel(page, fixture, skillId, prefix) {
  await page.goto(`${fixture.webUrl}/projects/${project.projectId}/journey`, { waitUntil: 'domcontentloaded' });
  const heading = page.getByRole('heading', { name: /Mapa do trabalho/i });
  await heading.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => undefined);
  if (!await heading.isVisible()) {
    const routeForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Entrar', exact: true }) });
    await routeForm.waitFor({ state: 'visible', timeout: 30_000 });
    await routeForm.getByLabel('E-mail').fill(fixture.email);
    await routeForm.getByLabel('Senha').fill(fixture.password);
    await routeForm.getByRole('button', { name: 'Entrar', exact: true }).click();
  }
  await heading.waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('.cms-skill-node').filter({ hasText: skillId }).first().click();
  const review = page.getByLabel('Revisão da produção visual');
  await review.waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('.cms-factory-media img').first().waitFor({ state: 'visible' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: resolve(evidenceDir, `${prefix}-panel-desktop.png`), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(evidenceDir, `${prefix}-panel-mobile.png`), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const enabled = review.locator('input[type="checkbox"]:not([disabled])').first();
  await enabled.check();
  await review.getByRole('button', { name: /Promover 1 selecionado/ }).click();
  await waitForRunStatus(fixture, skillId, 'done');
  return { desktop: `${prefix}-panel-desktop.png`, mobile: `${prefix}-panel-mobile.png` };
}

await mkdir(evidenceDir, { recursive: true });
const resume = process.env.VISUAL_PRODUCTION_RESUME === '1';
const fixture = resume ? await connectExistingFixture() : await createDocumentPackFixture();
if (!resume) await seedProductionPrerequisites(fixture);
const token = await localRunnerToken();
const artifacts = resume ? [] : await contextArtifacts(fixture);
const commonVisual = {
  formats: ['feed', 'story', 'square'],
  variants: 1,
  personas: [],
  likenessAuthorizations: [],
  cta: 'Saiba mais',
};

const design = resume ? await latestReviewResult(fixture, 'design-md') : await runCliSkill({
  fixture, token, skillId: 'design-md', context: { artifacts },
  operatorInput: 'Modo 1: use o DESIGN.md confirmado deste projeto. Eu confirmo e aprovo a identidade Academia Fit sem mudança de direção. Produza o DESIGN.md canônico para revisão, com frontmatter completo; o adapter validará tokens e preview.',
});
const creatives = resume ? await latestReviewResult(fixture, 'criativos-funil') : await runCliSkill({
  fixture, token, skillId: 'criativos-funil',
  context: { artifacts, visualProduction: { ...commonVisual, archetypes: ['dark_editorial'], items: [{ id: 'creative-pilot', title: 'Pare de recomeçar toda segunda-feira', description: 'Roteiro e banner piloto para Meta Ads, com voz acolhedora e direta, sem promessa clínica ou resultado garantido.' }] } },
  operatorInput: 'Meta Ads. Produza uma única amostra piloto: roteiro curto e banner estático nos formatos 4:5, 9:16 e 1:1. Use o dossiê, o swipe, o offerbook, a copy e o DESIGN.md confirmados. A direção dark editorial é a amostra escolhida para revisão humana. Não existe page_id de concorrente nem URL pública verificável nesta fixture: trate dossiê e swipe como material offline, marque URL como pendente e bloqueie publicação. Decisão explícita: seguir sem tendências. Não crie alegações factuais nem lote adicional.',
});
const mockups = resume ? await latestReviewResult(fixture, 'mockup-produto-funil') : await runCliSkill({
  fixture, token, skillId: 'mockup-produto-funil',
  context: { artifacts, visualProduction: { ...commonVisual, archetypes: ['mockup_product'], items: [{ id: 'mockup-pilot', title: 'Método Consistência 90', description: 'Device mockup do programa digital em notebook, exibindo uma área de membros sóbria baseada no offerbook e no DESIGN.md confirmados.' }] } },
  operatorInput: 'Estruture o prompt canônico de um device mockup para o Método Consistência 90, usando somente offerbook e DESIGN.md confirmados. A skill canônica entrega o prompt; o adapter do painel gera a imagem real em 4:5, 9:16 e 1:1 para revisão humana. Não publique.',
});

const designPreview = design.proposal.artifacts.find((artifact) => artifact.path === 'preview.html');
if (!designPreview || design.proposal.fields.find((field) => field.key === 'designPreviewValidated')?.value !== 'true') throw new Error('Preview validado de design ausente.');
const creativeManifest = manifestOf(creatives);
const mockupManifest = manifestOf(mockups);
if (creativeManifest.productionSkillId !== 'criativos-funil' || mockupManifest.productionSkillId !== 'mockup-produto-funil') throw new Error('Roteamento visual incorreto.');
const creativeAssets = await verifyManifest(creativeManifest, token);
const mockupAssets = await verifyManifest(mockupManifest, token);

const browser = await chromium.launch({ headless: true });
const evidence = {
  schemaVersion: '1.0.0', epic: '11', story: '11.W2.2', generatedAt: new Date().toISOString(),
  fixture: { workspaceId: fixture.workspaceId, projectId: project.projectId, projectSlug: project.slug },
  cli: {}, panel: {}, previews: {},
};
try {
  evidence.previews.design = await screenshotHtml(browser, designPreview.content, 'design-preview');
  evidence.previews.creatives = await screenshotAssetGallery(browser, creativeManifest, token, 'criativos-three-formats');
  evidence.previews.mockups = await screenshotAssetGallery(browser, mockupManifest, token, 'mockups-three-formats');

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(fixture.webUrl, { waitUntil: 'domcontentloaded' });
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Entrar', exact: true }) });
  await form.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);
  if (await form.isVisible()) {
    await form.getByLabel('E-mail').fill(fixture.email);
    await form.getByLabel('Senha').fill(fixture.password);
    await form.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL(/\/projects|\/dashboard/, { timeout: 30_000 });
  }

  if (design.status !== 'done') {
    await page.goto(`${fixture.webUrl}/projects/${project.projectId}/journey`, { waitUntil: 'networkidle' });
    await page.getByText('design-md', { exact: true }).first().click();
    await page.getByRole('button', { name: /Aprovar/ }).waitFor({ state: 'visible', timeout: 30_000 });
    await page.screenshot({ path: resolve(evidenceDir, 'design-panel-review-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: /Aprovar/ }).click();
    await waitForRunStatus(fixture, 'design-md', 'done');
  }
  evidence.panel.design = 'design-panel-review-desktop.png';
  evidence.panel.creatives = creatives.status === 'done'
    ? { desktop: 'criativos-panel-desktop.png', mobile: 'criativos-panel-mobile.png' }
    : await reviewInPanel(page, fixture, 'criativos-funil', 'criativos');
  evidence.panel.mockups = mockups.status === 'done'
    ? { desktop: 'mockups-panel-desktop.png', mobile: 'mockups-panel-mobile.png' }
    : await reviewInPanel(page, fixture, 'mockup-produto-funil', 'mockups');
  await page.close();
} finally {
  await browser.close();
}

for (const [name, result, manifest, assets] of [
  ['design', design, null, []], ['creatives', creatives, creativeManifest, creativeAssets], ['mockups', mockups, mockupManifest, mockupAssets],
]) {
  evidence.cli[name] = {
    skillId: result.skillId, jobId: result.jobId, skillRunId: result.skillRunId, model: result.model, skillHash: result.skillHash,
    artifactTypes: result.proposal.artifacts.map((artifact) => artifact.artifactType),
    ...(manifest ? { batchId: manifest.batchId, productionSkillId: manifest.productionSkillId, items: manifest.items.length, readyItems: manifest.items.filter((item) => item.status === 'ready').length, assets: assets.map(({ itemId, id, format, width, height, sha256: hash, bytes }) => ({ itemId, id, format, width, height, sha256: hash, bytes })) } : {}),
  };
}
evidence.promoted = {
  designPreview: await stat(resolve(fixture.projectRoot(surface), 'preview.html')).then((entry) => entry.size),
  creatives: await stat(resolve(fixture.projectRoot(surface), 'criativos', 'banners', creativeManifest.campaignId, creativeManifest.batchId, 'final', 'manifest.json')).then((entry) => entry.size),
  mockups: await stat(resolve(fixture.projectRoot(surface), 'mockups', 'factory', mockupManifest.campaignId, mockupManifest.batchId, 'final', 'manifest.json')).then((entry) => entry.size),
};
await writeFile(resolve(evidenceDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ ok: true, evidence: resolve(evidenceDir, 'evidence.json'), assets: creativeAssets.length + mockupAssets.length }, null, 2)}\n`);
