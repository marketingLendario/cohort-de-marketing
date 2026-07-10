import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { createTrafficPilotFixture, TRAFFIC_PILOT } from './fixtures/traffic-pilot/fixture.mjs';
import { runtimePaths } from '../../../scripts/marketing-studio.mjs';

const execFileAsync = promisify(execFile);
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(appRoot, '../..');
const launcher = resolve(repoRoot, 'scripts/marketing-studio.mjs');
const webPort = Number(process.env.E2E_WEB_PORT) || 5188;
const bffPort = Number(process.env.E2E_BFF_PORT) || 3308;
const baseURL = `http://127.0.0.1:${webPort}`;
const evidenceDir = process.env.E2E_EVIDENCE_DIR ?? '/tmp/story-8-w3-3-evidence';
const launcherArgs = ['--web-port', String(webPort), '--bff-port', String(bffPort), '--no-browser'];
const sentinelRoot = resolve(repoRoot, 'projetos/story-8-w3-3-launcher-sentinel');

async function runLauncher(command, extra = []) {
  try {
    return await execFileAsync(process.execPath, [launcher, command, ...launcherArgs, ...extra], {
      cwd: repoRoot,
      env: { ...process.env, OPENAI_API_KEY: '', CODEX_API_KEY: '' },
      timeout: 12 * 60_000,
      maxBuffer: 4 * 1024 * 1024,
    });
  } catch (error) {
    const output = [error.stdout, error.stderr, error.message].filter(Boolean).join('\n');
    throw new Error(`Launcher ${command} falhou:\n${output}`);
  }
}

async function waitUntilUnavailable(url, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
    } catch {
      return;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  throw new Error(`Serviço continuou respondendo após shutdown: ${url}`);
}

async function supabaseIsRunning() {
  try {
    await execFileAsync('supabase', ['status', '-o', 'json'], { cwd: appRoot, timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}

await mkdir(evidenceDir, { recursive: true });
await runLauncher('stop');
if (process.env.E2E_CLEAN_INSTALL === 'true') {
  await rm(resolve(appRoot, 'node_modules'), { recursive: true, force: true });
}

let fixture;
let browser;
const supabaseInitiallyRunning = await supabaseIsRunning();
try {
  const paths = runtimePaths(repoRoot);
  await mkdir(paths.directory, { recursive: true });
  await writeFile(paths.state, JSON.stringify({
    repoRoot,
    web: { pid: 999_999_991 },
    bff: { pid: 999_999_992 },
    supabaseBin: 'supabase',
    supabaseStartedByLauncher: true,
  }));
  const started = await runLauncher('start');
  assert.match(started.stdout, /Marketing Studio aberto:/);
  assert.equal(started.stdout.includes('OPENAI_API_KEY'), false);
  assert.equal(started.stdout.includes('LOCAL_SKILL_RUNNER_TOKEN'), false);
  const currentState = JSON.parse(await readFile(paths.state, 'utf8'));
  assert.equal(
    currentState.supabaseStartedByLauncher,
    !supabaseInitiallyRunning,
    'ownership stale do Supabase foi herdado por uma nova sessão',
  );

  const readinessResponse = await fetch(`${baseURL}/api/local/readiness`);
  assert.equal(readinessResponse.status, 200);
  assert.equal(readinessResponse.headers.get('cache-control'), 'no-store');
  const readiness = await readinessResponse.json();
  assert.ok(['ready', 'degraded'].includes(readiness.status));
  assert.ok(readiness.checks.some((check) => check.id === 'codex' && check.status === 'ready'));
  assert.ok(readiness.checks.some((check) => check.id === 'web' && check.status === 'ready'));
  assert.equal(JSON.stringify(readiness).includes('token'), false);

  fixture = await createTrafficPilotFixture();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto(baseURL);
  await page.getByLabel('E-mail').fill(TRAFFIC_PILOT.email);
  await page.getByLabel('Senha').fill(TRAFFIC_PILOT.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('heading', { name: /Seus projetos/i }).waitFor();
  await page.getByRole('button', { name: new RegExp(TRAFFIC_PILOT.projectName) }).click();
  await page.getByRole('heading', { name: 'Próximo passo do projeto' }).waitFor();

  const readinessButton = page.getByRole('button', { name: /Ambiente (pronto|degradado)/i });
  await readinessButton.waitFor();
  await readinessButton.click();
  const panel = page.getByRole('dialog', { name: 'Diagnóstico do ambiente' });
  await panel.waitFor();
  await panel.getByText('Codex CLI').waitFor();
  await panel.getByText('Interface', { exact: true }).waitFor();
  await page.screenshot({ path: resolve(evidenceDir, 'readiness-desktop.png'), fullPage: true });

  await readinessButton.click();
  await page.setViewportSize({ width: 390, height: 844 });
  await readinessButton.click();
  await panel.waitFor();
  const panelBox = await panel.boundingBox();
  assert.ok(panelBox);
  assert.ok(panelBox.x >= 0 && panelBox.x + panelBox.width <= 390, `Painel móvel fora da viewport: ${JSON.stringify(panelBox)}`);
  assert.ok(panelBox.y >= 0 && panelBox.y + panelBox.height <= 844, `Painel móvel fora da viewport: ${JSON.stringify(panelBox)}`);
  await page.screenshot({ path: resolve(evidenceDir, 'readiness-mobile.png'), fullPage: true });
  assert.deepEqual(consoleErrors, [], `Erros no console: ${consoleErrors.join('\n')}`);

  const status = await runLauncher('status');
  assert.match(status.stdout, /Marketing Studio aberto:/);
  const idempotent = await runLauncher('start', ['--no-install']);
  assert.match(idempotent.stdout, /já está aberto/);

  await browser.close();
  browser = undefined;
  await mkdir(sentinelRoot, { recursive: true });
  await writeFile(resolve(sentinelRoot, 'preserved.txt'), 'não remover no shutdown\n');
  await fixture.cleanup();
  fixture = undefined;
  await runLauncher('stop');
  await waitUntilUnavailable(`${baseURL}/`);
  await waitUntilUnavailable(`http://127.0.0.1:${bffPort}/healthz`);
  await access(resolve(sentinelRoot, 'preserved.txt'));
  assert.equal(await supabaseIsRunning(), supabaseInitiallyRunning, 'shutdown alterou um Supabase que não pertencia à sessão');

  const restarted = await runLauncher('start', ['--no-install']);
  assert.match(restarted.stdout, /Marketing Studio aberto:/);
  const restartedReadiness = await fetch(`${baseURL}/api/local/readiness`);
  assert.equal(restartedReadiness.status, 200);
  await runLauncher('stop');
  await waitUntilUnavailable(`${baseURL}/`);
  assert.equal(await supabaseIsRunning(), supabaseInitiallyRunning, 'restart/shutdown não restaurou o estado inicial do Supabase');
  await rm(sentinelRoot, { recursive: true, force: true });

  console.log(`Story 8.W3.3 launcher PASS. Evidence: ${evidenceDir}`);
} finally {
  if (browser) await browser.close();
  if (fixture) await fixture.cleanup();
  await runLauncher('stop').catch(() => undefined);
  await rm(sentinelRoot, { recursive: true, force: true });
}
