import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

const execFileAsync = promisify(execFile);
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(appRoot, '../..');
const launcher = resolve(repoRoot, 'scripts/marketing-studio.mjs');
const launcherStatePath = resolve(
  tmpdir(),
  `marketing-studio-${createHash('sha256').update(repoRoot).digest('hex').slice(0, 12)}`,
  'state.json',
);
const webPort = Number(process.env.E2E_WEB_PORT) || 5193;
const bffPort = Number(process.env.E2E_BFF_PORT) || 3313;
const baseURL = `http://127.0.0.1:${webPort}`;
const evidenceDir = process.env.E2E_EVIDENCE_DIR ?? '/tmp/story-9-w1-onboarding-evidence';
const fixturePath = resolve(evidenceDir, 'project-brief-0.1.0.json');
const launcherArgs = ['--web-port', String(webPort), '--bff-port', String(bffPort), '--no-browser', '--no-install'];
const password = 'Story9W13!clean-install';
const evidence = {
  story: '9.W1.3',
  base: 'clean-local-supabase',
  startedAt: new Date().toISOString(),
  viewports: { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } },
  steps: [],
  visual: { desktop: '', mobile: '', consoleErrors: [], pageErrors: [], networkFailures: [], badResponses: [], overflows: [], overlaps: [] },
  guards: [
    'Launcher oficial scripts/marketing-studio.mjs usado com portas isoladas.',
    'OPENAI_API_KEY e CODEX_API_KEY removidas do ambiente do runner; autenticação depende do Codex CLI local.',
    'Nenhuma senha, service-role ou boundary token foi gravado na evidência.',
  ],
};

const brief = {
  schemaVersion: '0.1.0',
  meta: { createdAt: '2026-07-10T12:00:00.000Z', updatedAt: '2026-07-10T12:00:00.000Z', completionStatus: 'draft' },
  project: { slug: 'story-9-w1-3-projeto-importado', name: 'Projeto importado da Story 9.W1.3', ownerName: 'Operador da instalação limpa', voice: 'marca' },
  market: { niche: 'Educação em marketing', targetAudience: 'Operadores de aquisição', dominantPain: 'Falta de contexto persistido entre sessões' },
  offer: { name: 'Método de onboarding persistente', promise: 'Abrir o projeto certo com contexto verificável' },
  brand: { designMode: 'neutral' },
  funnel: { recommendedFormat: 'pagina-vendas' },
  channels: { primaryCtaUrl: 'https://example.local/oferta' },
  data: { dataSourceNotes: 'Dados fornecidos no briefing versionado da instalação limpa.' },
  integrations: { openRouterStatus: 'not_needed' },
  fieldMeta: {
    'project.name': { source: 'user', updatedAt: '2026-07-10T12:00:00.000Z' },
    'offer.name': { source: 'user', updatedAt: '2026-07-10T12:00:00.000Z' },
    'market.niche': { source: 'user', updatedAt: '2026-07-10T12:00:00.000Z' },
  },
  artifacts: { offerbook: true },
};

function safeOutput(value) {
  return String(value ?? '')
    .replaceAll(password, '[REDACTED]')
    .replace(/(?:x-local-runner-token|authorization|service-role|boundary)[^\n]*/gi, '[REDACTED]')
    .replace(/(?:OPENAI_API_KEY|CODEX_API_KEY)=[^\n]*/g, '[REDACTED]');
}

async function run(command, args, timeout = 12 * 60_000, cwd = repoRoot) {
  const env = { ...process.env, OPENAI_API_KEY: '', CODEX_API_KEY: '' };
  try {
    return await execFileAsync(command, args, { cwd, env, timeout, maxBuffer: 4 * 1024 * 1024 });
  } catch (error) {
    throw new Error(`${command} ${args.join(' ')} falhou: ${safeOutput([error.stdout, error.stderr, error.message].filter(Boolean).join('\n'))}`);
  }
}

async function launcherCommand(command) {
  return run(process.execPath, [launcher, command, ...launcherArgs]);
}

async function readLauncherState() {
  try {
    return JSON.parse(await readFile(launcherStatePath, 'utf8'));
  } catch {
    return null;
  }
}

async function serviceIsUp(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function serviceBecomesHealthy(url, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await serviceIsUp(url)) return true;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  return false;
}

async function waitFor(url, timeout = 30_000) {
  if (await serviceBecomesHealthy(url, timeout)) return;
  throw new Error(`Serviço não respondeu em ${url}`);
}

async function waitForBootstrapEmpty(timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      // Deliberately traverse the Vite `/api` proxy: it injects the ephemeral
      // boundary token server-side, exactly like the browser application.
      const response = await fetch(`${baseURL}/api/local/bootstrap/status`);
      if (response.ok && (await response.json()).status === 'empty') return;
    } catch {
      // The local gateway may still be reconnecting after `supabase db reset`.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error('Supabase não confirmou estado limpo para o primeiro acesso local.');
}

async function supabaseProjectId() {
  const config = await readFile(resolve(appRoot, 'supabase/config.toml'), 'utf8');
  const projectId = config.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
  assert.ok(projectId, 'project_id ausente em supabase/config.toml');
  return projectId;
}

async function supabaseContainerName() {
  return `supabase_db_${await supabaseProjectId()}`;
}

async function databaseIsRunning(containerName) {
  try {
    const result = await run('docker', ['inspect', '--format', '{{.State.Running}}', containerName], 10_000);
    return result.stdout.trim() === 'true';
  } catch {
    return false;
  }
}

async function requiredSupabaseServicesAreRunning(projectId) {
  const services = ['db', 'auth', 'rest', 'kong'];
  const states = await Promise.all(services.map((service) => databaseIsRunning(`supabase_${service}_${projectId}`)));
  return states.every(Boolean);
}

async function ensureRequiredSupabaseServices(projectId, timeout = 60_000) {
  const deadline = Date.now() + timeout;
  let startError;
  while (Date.now() < deadline) {
    if (await requiredSupabaseServicesAreRunning(projectId)) return;
    try {
      await run('supabase', ['start'], 5 * 60_000, appRoot);
      startError = undefined;
    } catch (caught) {
      startError = caught;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1_000));
  }
  if (startError) throw startError;
  throw new Error('Supabase não iniciou DB, Auth, REST e Kong dentro do prazo.');
}

async function waitForCleanDatabase(containerName, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const result = await run('docker', [
        'exec', containerName, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc',
        'select (select count(*) from auth.users),(select count(*) from public.workspaces),(select count(*) from public.workspace_members),(select count(*) from public.marketing_projects);',
      ], 10_000);
      if (result.stdout.trim() === '0|0|0|0') return true;
    } catch {
      // The database container may still be restarting after the reset.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  return false;
}

async function waitForText(page, text, timeout = 30_000) {
  await page.getByText(text, { exact: true }).first().waitFor({ state: 'visible', timeout });
}

async function assertFieldValue(page, label, expected) {
  const field = page.getByLabel(label).first();
  await field.waitFor({ state: 'visible' });
  assert.equal(await field.inputValue(), expected, `${label} não preservou o valor importado.`);
}

async function inspectLayout(page, label) {
  const result = await page.evaluate(() => {
    const widthOverflow = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0) > window.innerWidth + 1;
    const visible = [...document.querySelectorAll('h1, h2, button, a, input, textarea, select, [role="status"], .cms-next-action, .cms-brief-field')]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
    const overlaps = [];
    for (let index = 0; index < visible.length; index += 1) {
      for (let next = index + 1; next < visible.length; next += 1) {
        const left = visible[index];
        const right = visible[next];
        if (left.contains(right) || right.contains(left)) continue;
        const a = left.getBoundingClientRect();
        const b = right.getBoundingClientRect();
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) {
          overlaps.push(`${left.tagName}:${left.textContent?.trim().slice(0, 30)} x ${right.tagName}:${right.textContent?.trim().slice(0, 30)}`);
        }
      }
    }
    return { widthOverflow, overlaps };
  });
  if (result.widthOverflow) evidence.visual.overflows.push(label);
  if (result.overlaps.length) evidence.visual.overlaps.push({ label, conflicts: result.overlaps });
  assert.equal(result.widthOverflow, false, `${label}: overflow horizontal`);
  assert.deepEqual(result.overlaps, [], `${label}: sobreposição ${result.overlaps.join(', ')}`);
}

async function capture(page, path, label) {
  await inspectLayout(page, label);
  await page.screenshot({ path, fullPage: true });
}

function attachDiagnostics(page) {
  page.on('console', (message) => { if (message.type() === 'error') evidence.visual.consoleErrors.push(safeOutput(message.text())); });
  page.on('pageerror', (error) => evidence.visual.pageErrors.push(safeOutput(error.message)));
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? '';
    if (!failure.includes('ERR_ABORTED')) evidence.visual.networkFailures.push(safeOutput(`${request.method()} ${request.url()} ${failure}`));
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) evidence.visual.badResponses.push(safeOutput(`${response.status()} ${response.url()}`));
  });
}

await rm(evidenceDir, { recursive: true, force: true });
await mkdir(evidenceDir, { recursive: true });
await writeFile(fixturePath, `${JSON.stringify(brief, null, 2)}\n`, 'utf8');

let browser;
let context;
let supabaseStartedByTest = false;
let supabaseStartAttempted = false;
let databaseContainer;
let launcherRuntimeId;
let launcherStartAttempted = false;
try {
  // `status` reuses the launcher's command-line + repo-root ownership check,
  // so a stale PID reused by an unrelated process is not a false blocker.
  const previousLauncherStatus = await launcherCommand('status');
  assert.equal(
    /Marketing Studio aberto:/.test(previousLauncherStatus.stdout),
    false,
    'Existe uma sessão ativa do Marketing Studio neste worktree; encerre-a antes do E2E.',
  );

  databaseContainer = await supabaseContainerName();
  assert.equal(
    await databaseIsRunning(databaseContainer),
    false,
    'O Supabase compartilhado já está ativo; encerre os outros worktrees antes do E2E destrutivo.',
  );
  supabaseStartAttempted = true;
  let supabaseStartError;
  try {
    await run('supabase', ['start'], 5 * 60_000, appRoot);
  } catch (caught) {
    supabaseStartError = caught;
  }
  supabaseStartedByTest = await databaseIsRunning(databaseContainer);
  if (!supabaseStartedByTest) {
    throw supabaseStartError ?? new Error('Supabase não iniciou o container do banco.');
  }

  // Supabase may return 502 while Kong restarts even after applying the reset.
  // The database counts are the commit proof; an HTTP response is not.
  let resetError;
  let databaseClean = false;
  for (let attempt = 0; attempt < 3 && !databaseClean; attempt += 1) {
    try {
      await run('supabase', ['db', 'reset', '--local', '--yes'], 5 * 60_000, appRoot);
      resetError = undefined;
    } catch (caught) {
      resetError = caught;
    }
    databaseClean = await waitForCleanDatabase(databaseContainer, 10_000);
    if (!databaseClean) await new Promise((resolvePromise) => setTimeout(resolvePromise, 1_000));
  }
  if (!databaseClean) {
    if (resetError) throw resetError;
    throw new Error('Supabase terminou o reset sem zerar usuários, workspaces e membros.');
  }
  evidence.steps.push('Supabase local resetado sem usuários, workspaces ou projetos.');

  const projectId = databaseContainer.slice('supabase_db_'.length);
  await ensureRequiredSupabaseServices(projectId);
  const authHealthUrl = 'http://127.0.0.1:54321/auth/v1/health';
  if (!await serviceBecomesHealthy(authHealthUrl, 5_000)) {
    await run('docker', ['restart', `supabase_kong_${projectId}`], 60_000);
  }
  await waitFor(authHealthUrl);

  launcherStartAttempted = true;
  const started = await launcherCommand('start');
  assert.match(safeOutput(started.stdout), /Marketing Studio aberto:/);
  const ownedLauncher = await readLauncherState();
  assert.equal(ownedLauncher?.webPort, webPort);
  assert.equal(ownedLauncher?.bffPort, bffPort);
  assert.equal(typeof ownedLauncher?.runtimeId, 'string');
  launcherRuntimeId = ownedLauncher.runtimeId;
  await waitFor(`${baseURL}/healthz`);
  await waitFor(`http://127.0.0.1:${bffPort}/healthz`);
  await waitForBootstrapEmpty();

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ locale: 'pt-BR', viewport: evidence.viewports.desktop });
  let page = await context.newPage();
  attachDiagnostics(page);

  await page.goto(`${baseURL}/`);
  await page.getByRole('heading', { name: 'Seu primeiro acesso' }).waitFor();
  const firstRun = page.locator('.local-first-run');
  await firstRun.getByLabel('E-mail', { exact: true }).fill('operator-story-9-w1-3@example.local');
  await firstRun.getByLabel('Senha', { exact: true }).fill(password);
  await firstRun.getByLabel('Nome do seu negócio', { exact: true }).fill('Workspace da instalação limpa');
  await firstRun.getByRole('button', { name: 'Criar meu acesso', exact: true }).click();
  await page.getByRole('heading', { name: 'Seus projetos' }).waitFor();
  evidence.steps.push('Primeiro operador criado pela interface e autenticado pelo fluxo normal.');
  await capture(page, resolve(evidenceDir, 'projects-desktop.png'), 'projects desktop');

  await page.getByRole('button', { name: 'Novo projeto', exact: true }).click();
  await page.getByLabel('Nome do projeto', { exact: true }).fill('Projeto de entrada');
  await page.getByRole('button', { name: 'Criar e abrir', exact: true }).click();
  await page.getByRole('heading', { name: 'Próximo passo do projeto' }).waitFor();
  const entryProjectId = new URL(page.url()).pathname.split('/')[2];
  await page.getByRole('link', { name: 'Briefing', exact: true }).click();
  await page.getByRole('heading', { name: /projeto/i }).first().waitFor();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await page.getByRole('heading', { name: 'Próximo passo do projeto' }).waitFor();
  const importedProjectId = new URL(page.url()).pathname.split('/')[2];
  assert.match(importedProjectId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(importedProjectId, entryProjectId);
  evidence.steps.push('Briefing project-brief 0.1.0 importado, migrado e aberto como projeto persistido.');

  await page.goto(`${baseURL}/projects/${importedProjectId}/briefing/project`);
  await assertFieldValue(page, 'Nome do projeto', brief.project.name);
  await assertFieldValue(page, 'Slug do projeto', brief.project.slug);
  await waitForText(page, 'Importado');
  await page.goto(`${baseURL}/projects/${importedProjectId}/briefing/offer`);
  await assertFieldValue(page, 'Nome da oferta', brief.offer.name);
  assert.equal(await page.getByText('Importado', { exact: true }).count() > 0, true);
  await capture(page, resolve(evidenceDir, 'briefing-desktop.png'), 'briefing desktop');
  evidence.visual.desktop = 'briefing-desktop.png';
  evidence.steps.push('Dados principais, revisão 1 e proveniência Importado confirmados pela interface.');

  await page.reload();
  await assertFieldValue(page, 'Nome da oferta', brief.offer.name);
  await waitForText(page, 'Importado');
  evidence.steps.push('Reload preservou projeto, revisão 1 e proveniência.');

  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByLabel('E-mail', { exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Seu primeiro acesso' }).count(), 0);
  // `page.request` also uses the web origin, so the Vite proxy adds the
  // boundary token without exposing it to this script or its evidence.
  const secondBootstrap = await page.request.post(`${baseURL}/api/local/bootstrap`, {
    data: { email: 'second-owner@example.local', password: 'SecondOwner!not-recorded', workspaceName: 'Workspace indevido' },
  });
  assert.equal(secondBootstrap.status(), 409);
  const secondBootstrapBody = await secondBootstrap.json();
  assert.equal(secondBootstrapBody.code, 'LOCAL_BOOTSTRAP_CLOSED');
  assert.equal(JSON.stringify(secondBootstrapBody).includes('SecondOwner'), false);
  evidence.steps.push('Segundo bootstrap recusado com 409; a UI não ofereceu novo primeiro acesso e o owner permaneceu intacto.');

  await context.close();
  context = await browser.newContext({ locale: 'pt-BR', viewport: evidence.viewports.desktop });
  page = await context.newPage();
  attachDiagnostics(page);
  await page.goto(`${baseURL}/`);
  await page.getByLabel('E-mail', { exact: true }).fill('operator-story-9-w1-3@example.local');
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('heading', { name: 'Seus projetos' }).waitFor();
  await page.getByRole('button', { name: new RegExp(brief.project.name) }).click();
  await page.getByRole('heading', { name: 'Próximo passo do projeto' }).waitFor();
  await page.goto(`${baseURL}/projects/${importedProjectId}/briefing/offer`);
  await assertFieldValue(page, 'Nome da oferta', brief.offer.name);
  await waitForText(page, 'Importado');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar briefing', exact: true }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  assert.ok(downloadPath, 'Exportação da revisão ativa não produziu arquivo local.');
  const exportedBrief = JSON.parse(await readFile(downloadPath, 'utf8'));
  assert.equal(exportedBrief.revision, 1);
  assert.equal(exportedBrief.projectId, importedProjectId);
  assert.equal(exportedBrief.data.offer.name, brief.offer.name);
  evidence.steps.push('Nova sessão autenticada reidratou o mesmo projeto, revisão e proveniência.');

  await page.setViewportSize(evidence.viewports.mobile);
  await page.goto(`${baseURL}/projects/${importedProjectId}/briefing/offer`);
  await assertFieldValue(page, 'Nome da oferta', brief.offer.name);
  await capture(page, resolve(evidenceDir, 'briefing-mobile.png'), 'briefing mobile');
  evidence.visual.mobile = 'briefing-mobile.png';
  assert.deepEqual(evidence.visual.consoleErrors, [], `console errors: ${evidence.visual.consoleErrors.join('\n')}`);
  assert.deepEqual(evidence.visual.pageErrors, [], `page errors: ${evidence.visual.pageErrors.join('\n')}`);
  assert.deepEqual(evidence.visual.networkFailures, [], `network failures: ${evidence.visual.networkFailures.join('\n')}`);
  assert.deepEqual(evidence.visual.badResponses, [], `bad responses: ${evidence.visual.badResponses.join('\n')}`);

  const serialized = JSON.stringify(evidence);
  assert.equal(serialized.includes(password), false);
  assert.equal(serialized.includes('SecondOwner'), false);
  await writeFile(resolve(evidenceDir, 'run.json'), `${JSON.stringify({ ...evidence, finishedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
  console.log(`Story 9.W1.3 Playwright PASS. Evidence: ${evidenceDir}`);
} finally {
  if (context) await context.close().catch(() => undefined);
  if (browser) await browser.close();
  const currentLauncher = await readLauncherState();
  const ownsCompletedStart = launcherRuntimeId && currentLauncher?.runtimeId === launcherRuntimeId;
  const ownsPartialStart = launcherStartAttempted
    && !launcherRuntimeId
    && currentLauncher?.webPort === webPort
    && currentLauncher?.bffPort === bffPort;
  if (ownsCompletedStart || ownsPartialStart) {
    await launcherCommand('stop').catch(() => undefined);
  }
  if (supabaseStartAttempted) {
    const projectId = databaseContainer?.slice('supabase_db_'.length) ?? await supabaseProjectId();
    await run('supabase', ['stop', '--project-id', projectId, '--no-backup'], 3 * 60_000, appRoot);
    assert.equal(await databaseIsRunning(`supabase_db_${projectId}`), false, 'Teardown deixou o DB do E2E ativo.');
  }
  await rm(fixturePath, { force: true }).catch(() => undefined);
}
