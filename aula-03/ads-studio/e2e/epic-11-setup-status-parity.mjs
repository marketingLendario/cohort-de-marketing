import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5177';
const projectId = process.env.E2E_PROJECT_ID ?? '82000000-0000-0000-0000-000000000031';
const evidenceDir = resolve(appRoot, 'design-qa-evidence', 'epic-11', 'setup-status-parity');
const cliSetupPath = resolve(evidenceDir, '.cli-setup.json');
const cliStatusPath = resolve(evidenceDir, '.cli-status.json');
await mkdir(evidenceDir, { recursive: true });

async function runCli(args) {
  await execFileAsync('npx', ['tsx', 'server/skill-cli.ts', ...args], {
    cwd: appRoot,
    env: { ...process.env, MARKETING_STUDIO_BFF_URL: baseURL, LOCAL_SKILL_RUNNER_TOKEN: 'via-vite-proxy', OPENAI_API_KEY: '', CODEX_API_KEY: '' },
    timeout: 60_000,
  });
}

async function ensureDemoAccess() {
  const { stdout } = await execFileAsync('supabase', ['status', '-o', 'json'], { cwd: appRoot, maxBuffer: 2_000_000 });
  const local = JSON.parse(stdout);
  const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;
  let user = listed.data.users.find((candidate) => candidate.email === 'demo@academialendaria.local');
  if (user) {
    const updated = await admin.auth.admin.updateUserById(user.id, { password: 'adsfactory', email_confirm: true });
    if (updated.error) throw updated.error;
  } else {
    const created = await admin.auth.admin.createUser({ email: 'demo@academialendaria.local', password: 'adsfactory', email_confirm: true });
    if (created.error || !created.data.user) throw created.error ?? new Error('Usuário demo não foi criado.');
    user = created.data.user;
  }
  const project = await admin.from('marketing_projects').select('workspace_id').eq('id', projectId).single();
  if (project.error) throw project.error;
  const membership = await admin.from('workspace_members').upsert({ workspace_id: project.data.workspace_id, user_id: user.id, role: 'owner' }, { onConflict: 'workspace_id,user_id' });
  if (membership.error) throw membership.error;
}

function withoutTimestamp(value) {
  const clone = structuredClone(value);
  delete clone.checkedAt;
  return clone;
}

const setupResponse = await fetch(`${baseURL}/api/local/environment-bootstrap`);
assert.equal(setupResponse.status, 200);
const panelSetup = await setupResponse.json();
const statusResponse = await fetch(`${baseURL}/api/local/projects/${projectId}/status`);
assert.equal(statusResponse.status, 200);
const panelStatus = await statusResponse.json();

await runCli(['--setup', '--output', cliSetupPath]);
await runCli(['--status', projectId, '--output', cliStatusPath]);
const cliSetup = JSON.parse(await readFile(cliSetupPath, 'utf8'));
const cliStatus = JSON.parse(await readFile(cliStatusPath, 'utf8'));
assert.deepEqual(withoutTimestamp(cliSetup.result), withoutTimestamp(panelSetup));
assert.deepEqual(cliStatus.result, panelStatus);
assert.equal(panelStatus.readOnly, true);
await ensureDemoAccess();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const consoleErrors = [];
const failedRequests = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('requestfailed', (request) => {
  if (!request.failure()?.errorText.includes('ERR_ABORTED')) failedRequests.push(`${request.method()} ${new URL(request.url()).pathname}`);
});

await page.goto(`${baseURL}/projects/${projectId}/overview`);
await page.waitForTimeout(750);
if (await page.getByLabel('E-mail').isVisible().catch(() => false)) {
  await page.getByLabel('E-mail').fill('demo@academialendaria.local');
  await page.getByLabel('Senha').fill('adsfactory');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByLabel('E-mail').waitFor({ state: 'hidden' });
}
await page.goto(`${baseURL}/projects/${projectId}/overview`);
await page.getByRole('heading', { name: /Próximo passo do projeto/i }).waitFor();
await page.getByText(`${panelStatus.completed}/${panelStatus.total} peças no disco`, { exact: false }).waitFor();
const readinessLabel = panelSetup.status === 'ready' ? 'Tudo pronto para continuar' : panelSetup.status === 'blocked' ? 'Ação necessária para continuar' : 'Um item precisa de atenção';
await page.getByRole('button', { name: readinessLabel }).click();
await page.getByRole('dialog', { name: 'Estado do Marketing Studio' }).waitFor();
await page.screenshot({ path: resolve(evidenceDir, 'panel-desktop.png'), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: resolve(evidenceDir, 'panel-mobile.png'), fullPage: true });
const overflow = await page.evaluate(() => ({
  document: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  body: document.body.scrollWidth > document.body.clientWidth,
}));

const afterStatus = await (await fetch(`${baseURL}/api/local/projects/${projectId}/status`)).json();
assert.deepEqual(afterStatus.sourceHashes, panelStatus.sourceHashes);
assert.equal(overflow.document, false);
assert.equal(overflow.body, false);
assert.deepEqual(consoleErrors, []);
assert.deepEqual(failedRequests, []);

const evidence = {
  epic: '11', story: '11.W3.1', generatedAt: new Date().toISOString(),
  setup: {
    panelCliEquivalent: true, status: panelSetup.status, diagnosisHash: panelSetup.diagnosisHash,
    checks: panelSetup.checks.map(({ id, status, required }) => ({ id, status, required })),
    nextCommands: panelSetup.starts.map((start) => start.nextCommand),
  },
  projectStatus: {
    panelCliEquivalent: true, readOnly: true, completed: panelStatus.completed, total: panelStatus.total,
    nextCommand: panelStatus.nextCommand, divergenceCount: panelStatus.divergences.length,
    sourceHashesStable: true, sourceHashes: panelStatus.sourceHashes,
  },
  visual: { desktop: 'panel-desktop.png', mobile: 'panel-mobile.png', overflow, consoleErrors, failedRequests },
};
const serialized = JSON.stringify(evidence, null, 2);
for (const forbidden of ['/Users/', 'demo@academialendaria.local', 'adsfactory', 'APIFY_API_TOKEN', 'OPENAI_API_KEY', 'CODEX_API_KEY']) {
  assert.equal(serialized.includes(forbidden), false, `Evidência contém valor proibido: ${forbidden}`);
}
await writeFile(resolve(evidenceDir, 'evidence.json'), `${serialized}\n`, 'utf8');
await rm(cliSetupPath, { force: true });
await rm(cliStatusPath, { force: true });
await browser.close();
process.stdout.write(`${JSON.stringify({ ok: true, evidence: 'design-qa-evidence/epic-11/setup-status-parity/evidence.json' })}\n`);
