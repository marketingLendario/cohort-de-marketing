import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const repoRoot = resolve(appRoot, '../..');
const launcher = resolve(repoRoot, 'scripts/marketing-studio.mjs');
const launcherStatePath = resolve(
  tmpdir(),
  `marketing-studio-${createHash('sha256').update(repoRoot).digest('hex').slice(0, 12)}`,
  'state.json',
);
const webPort = Number(process.env.E2E_WEB_PORT) || 5194;
const bffPort = Number(process.env.E2E_BFF_PORT) || 3314;
const baseURL = `http://127.0.0.1:${webPort}`;
const evidenceDir = process.env.E2E_EVIDENCE_DIR ?? '/tmp/story-9-w2-real-project-evidence';
const briefPath = resolve(repoRoot, 'data/pilots/academia-lendaria-project-brief.json');
const manifestPath = resolve(repoRoot, 'data/pilots/academia-lendaria-project.manifest.json');
const sourceRoot = resolve(repoRoot, 'projetos', 'maquina-de-receita-com-ia');
const sourceSlug = 'maquina-de-receita-com-ia';
const sourceEvidencePath = resolve(evidenceDir, 'run.json');
const launcherArgs = ['--web-port', String(webPort), '--bff-port', String(bffPort), '--no-browser', '--no-install'];
const password = 'Story9W23!real-project';
const operatorEmail = 'operator-story-9-w2-3@example.local';
const campaignName = 'Ciclo real A3 · Story 9.W2.3';
process.env.CODEX_SKILL_TIMEOUT_MS = process.env.E2E_CODEX_SKILL_TIMEOUT_MS ?? '180000';

const evidence = {
  story: '9.W2.3',
  base: 'real-project-traffic-cycle',
  startedAt: new Date().toISOString(),
  projectSlug: sourceSlug,
  importedProjectId: '',
  viewports: { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } },
  packageUnknowns: [],
  intake: null,
  steps: [],
  reloads: [],
  refusals: [],
  retries: [],
  skills: [],
  curation: null,
  manualSubmission: null,
  metrics: null,
  humanDecision: null,
  weeklyOperation: null,
  noMetaMutation: { browserRequests: [], backendPublishRequests: [], jobLogMatches: [], campaignStatus: null },
  visual: {
    desktop: '',
    mobile: '',
    consoleErrors: [],
    pageErrors: [],
    networkFailures: [],
    badResponses: [],
    metaRequests: [],
    overflows: [],
    overlaps: [],
  },
  guards: [
    'Launcher oficial scripts/marketing-studio.mjs usado com portas isoladas.',
    'OPENAI_API_KEY e CODEX_API_KEY removidas do ambiente do runner e dos processos filhos.',
    'Supabase local resetado e encerrado dentro do mesmo ciclo do E2E.',
    'Nenhuma mutação Meta é permitida; a campanha deve permanecer draft.',
  ],
};

function safeOutput(value) {
  return String(value ?? '')
    .replaceAll(password, '[REDACTED]')
    .replaceAll(operatorEmail, '[REDACTED]')
    .replace(/(?:OPENAI_API_KEY|CODEX_API_KEY)=[^\n]*/g, '[REDACTED]')
    .replace(/(?:x-local-runner-token|authorization|service-role|boundary)[^\n]*/gi, '[REDACTED]');
}

async function run(command, args, timeout = 12 * 60_000, cwd = repoRoot) {
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  delete env.CODEX_API_KEY;
  try {
    return await execFileAsync(command, args, { cwd, env, timeout, maxBuffer: 8 * 1024 * 1024 });
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
      const response = await fetch(`${baseURL}/api/local/bootstrap/status`);
      if (response.ok && (await response.json()).status === 'empty') return;
    } catch {
      // Kong pode estar voltando após reset.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error('Supabase não confirmou estado limpo para o bootstrap local.');
}

async function supabaseProjectId() {
  const config = await readFile(resolve(appRoot, 'supabase/config.toml'), 'utf8');
  const projectId = config.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
  assert.ok(projectId, 'project_id ausente em supabase/config.toml');
  return projectId;
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
  throw new Error('Supabase não iniciou DB/Auth/REST/Kong dentro do prazo.');
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
      // O container pode estar reiniciando.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  return false;
}

async function localSupabaseConfig() {
  const raw = await run('supabase', ['status', '-o', 'json'], 30_000, appRoot);
  const status = JSON.parse(raw.stdout);
  return { url: status.API_URL, anonKey: status.ANON_KEY, serviceRoleKey: status.SERVICE_ROLE_KEY };
}

function attachDiagnostics(page) {
  page.on('console', (message) => {
    if (message.type() === 'error') evidence.visual.consoleErrors.push(safeOutput(message.text()));
  });
  page.on('pageerror', (error) => evidence.visual.pageErrors.push(safeOutput(error.message)));
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? '';
    if (!failure.includes('ERR_ABORTED')) evidence.visual.networkFailures.push(safeOutput(`${request.method()} ${request.url()} ${failure}`));
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) evidence.visual.badResponses.push(safeOutput(`${response.status()} ${response.url()}`));
  });
  page.on('request', (request) => {
    if (/facebook|meta/i.test(request.url())) {
      const line = `${request.method()} ${request.url()}`;
      evidence.visual.metaRequests.push(line);
      evidence.noMetaMutation.browserRequests.push(line);
    }
  });
}

async function inspectLayout(page, label) {
  const result = await page.evaluate(() => {
    const widthOverflow = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0) > window.innerWidth + 1;
    const visibleRect = (element) => {
      const initial = element.getBoundingClientRect();
      let left = Math.max(0, initial.left);
      let right = Math.min(window.innerWidth, initial.right);
      let top = Math.max(0, initial.top);
      let bottom = Math.min(window.innerHeight, initial.bottom);
      for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        const clipX = ['auto', 'hidden', 'scroll', 'clip'].includes(style.overflowX);
        const clipY = ['auto', 'hidden', 'scroll', 'clip'].includes(style.overflowY);
        if (!clipX && !clipY) continue;
        const clip = ancestor.getBoundingClientRect();
        if (clipX) {
          left = Math.max(left, clip.left);
          right = Math.min(right, clip.right);
        }
        if (clipY) {
          top = Math.max(top, clip.top);
          bottom = Math.min(bottom, clip.bottom);
        }
      }
      return right - left > 1 && bottom - top > 1 ? { left, right, top, bottom } : null;
    };
    const visible = [...document.querySelectorAll('h1, h2, button, a, input, textarea, select, [role="status"], .cms-next-action, .cms-brief-field')]
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && visibleRect(element) !== null;
      })
      .map((element) => ({ element, rect: visibleRect(element) }));
    const overlaps = [];
    for (let index = 0; index < visible.length; index += 1) {
      for (let next = index + 1; next < visible.length; next += 1) {
        const left = visible[index].element;
        const right = visible[next].element;
        if (left.contains(right) || right.contains(left)) continue;
        const a = visible[index].rect;
        const b = visible[next].rect;
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

async function waitForText(page, text, timeout = 30_000) {
  await page.getByText(text, { exact: true }).first().waitFor({ state: 'visible', timeout });
}

async function assertFieldValue(page, label, expected) {
  const field = page.getByLabel(label).first();
  await field.waitFor({ state: 'visible' });
  assert.equal(await field.inputValue(), expected, `${label} não preservou o valor esperado.`);
}

async function completeBlockedField(page, skillTitle, fieldLabel, value) {
  await selectSkill(page, skillTitle);
  const action = page.getByRole('link', { name: 'Completar briefing', exact: true });
  await action.waitFor({ state: 'visible' });
  await action.click();
  const field = page.getByLabel(fieldLabel).first();
  await field.waitFor({ state: 'visible' });
  await field.fill(String(value));
  await page.waitForTimeout(1_500);
  await page.getByRole('link', { name: 'Jornada', exact: true }).click();
  await page.getByRole('heading', { name: /Mapa do trabalho/i }).waitFor();
  evidence.steps.push(`${skillTitle} foi desbloqueado pelo operador ao confirmar ${fieldLabel}.`);
  await saveEvidence();
}

async function fillWeeklyMetric(page, name, value, source, seal = 'Real') {
  const row = page.locator('.cms-metric-row').filter({ has: page.getByText(name, { exact: true }) });
  await row.locator('select').selectOption(seal);
  await row.locator('input[type="number"]').fill(String(value));
  await row.locator('input.al-input:not([type="number"])').fill(source);
  await row.getByLabel('Sim', { exact: true }).check();
}

async function saveEvidence() {
  await mkdir(evidenceDir, { recursive: true });
  const sanitized = {
    ...evidence,
    refusals: evidence.refusals.map((refusal) => ({
      skillId: refusal.skillId,
      runId: refusal.runId,
      durationMs: refusal.durationMs,
      reason: refusal.reason,
      action: refusal.action,
    })),
    skills: evidence.skills.map(({ proposal, operatorInput, artifacts, job, ...skill }) => ({
      ...skill,
      operatorInputHash: createHash('sha256').update(operatorInput).digest('hex'),
      proposal: proposal && typeof proposal === 'object' ? {
        summaryHash: createHash('sha256').update(String(proposal.summary ?? '')).digest('hex'),
        artifactTypes: Array.isArray(proposal.artifacts) ? proposal.artifacts.map((artifact) => artifact.artifactType) : [],
        fieldKeys: Array.isArray(proposal.fields) ? proposal.fields.map((field) => field.key) : [],
      } : null,
      artifacts: artifacts.map((artifact) => ({
        id: artifact.id,
        path: artifact.path,
        artifactType: artifact.artifactType,
        contentHash: artifact.contentHash,
        filesystemHash: artifact.filesystemHash,
        state: artifact.state,
        verification: artifact.verification,
      })),
      job: job && typeof job === 'object' ? {
        id: job.id,
        status: job.status,
        attempt: job.attempt,
        model: job.model,
        skillId: job.skill_id,
      } : null,
    })),
    finishedAt: new Date().toISOString(),
  };
  await writeFile(sourceEvidencePath, `${JSON.stringify(sanitized, null, 2)}\n`, 'utf8');
}

async function copyPilotSources() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await rm(sourceRoot, { recursive: true, force: true });
  for (const artifact of manifest.artifactManifest) {
    const destination = artifact.artifactType === 'curriculum'
      ? resolve(sourceRoot, 'curriculum.yaml')
      : artifact.artifactType === 'offerbook'
        ? resolve(sourceRoot, 'offerbook.yaml')
      : artifact.artifactType === 'a3-prd'
          ? resolve(sourceRoot, 'artefatos', 'PRD-A3-trafego-v1.md')
          : artifact.artifactType === 'copy'
            ? resolve(sourceRoot, 'copy.md')
          : resolve(sourceRoot, 'artefatos', 'squad-trafego', 'README.md');
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(artifact.path, destination);
  }
  evidence.steps.push('Pacote real copiado para projetos/maquina-de-receita-com-ia a partir das fontes congeladas do manifesto.');
  evidence.packageUnknowns = manifest.unknowns.map((item) => item.path);
  return manifest;
}

async function selectSkill(page, title) {
  const heading = page.getByRole('heading', { name: title, exact: true });
  const node = page.getByRole('button', { name: new RegExp(`^${title}`) }).first();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await node.click({ force: true, timeout: 5_000 });
    await heading.waitFor({ state: 'visible', timeout: 1_000 }).catch(() => undefined);
    if (!(await heading.isVisible())) continue;
    await page.waitForTimeout(600);
    if (await heading.isVisible()) return;
  }
  throw new Error(`A seleção da skill ${title} não estabilizou.`);
}

async function waitReview(page) {
  await page.getByTestId('artifact-approval-review').waitFor({ state: 'visible', timeout: 10 * 60 * 1000 });
}

function normalizeText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function proposalStrings(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return proposalStrings(JSON.parse(trimmed));
      } catch {
        return [value];
      }
    }
    return [value];
  }
  if (Array.isArray(value)) return value.flatMap(proposalStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(proposalStrings);
  return [];
}

function diagnosticProposalStrings(proposal) {
  if (!proposal || typeof proposal !== 'object') return [];
  const { artifacts = [], ...proposalCopy } = proposal;
  const strings = proposalStrings(proposalCopy);
  for (const artifact of artifacts) {
    if (artifact?.artifactType !== 'trafficDiagnosis' || typeof artifact.content !== 'string') continue;
    try {
      const parsed = parseYaml(artifact.content);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.diagnosticador) {
        strings.push(...proposalStrings(parsed.diagnosticador));
        continue;
      }
    } catch {
      // Inspect malformed proposed artifacts as raw text.
    }
    strings.push(...proposalStrings(artifact.content));
  }
  return strings;
}

function unavailableMetricsFromStage(stage) {
  const artifact = stage.artifacts.find((candidate) => candidate.artifactType === 'trafficMetricReading');
  if (!artifact?.content) throw new Error('Leitor não produziu trafficMetricReading.');
  const parsed = JSON.parse(JSON.stringify(artifact.parsed));
  return (parsed.leitor?.sinais ?? [])
    .filter((signal) => signal.valor == null || normalizeText(signal.selo ?? '').replace(/[_-]+/g, ' ').includes('nao fornecido'))
    .map((signal) => signal.metrica)
    .filter(Boolean);
}

function derivedUnavailableMetrics(proposal, metrics) {
  const texts = diagnosticProposalStrings(proposal).map(normalizeText);
  const numeric = '(?:r\\$\\s*)?\\d+(?:[.,]\\d+)*(?:\\s*[%x])?';
  return metrics.filter((metric) => {
    const name = escapePattern(normalizeText(metric));
    const connector = '(?:[:=]|(?:e|foi|foram|ficou|fica|esta|estava|seria)\\s+(?:de\\s+)?|(?:de|em|para|abaixo\\s+de|acima\\s+de)\\s*|(?:(?:aproximad|calculad|derivad|estimad|equival|result)\\w*\\s+de)\\s*)';
    const metricThenValue = new RegExp(`\\b${name}\\b(?:\\s+(?:alvo|meta|do|da|no|na|gerenciador|valor|media|metrica)){0,4}\\s*${connector}\\s*${numeric}`, 'i');
    const valueThenMetric = new RegExp(`${numeric}\\s*(?:de|para|em|no|na)?\\s*\\b${name}\\b`, 'i');
    return texts.some((text) => metricThenValue.test(text) || valueThenMetric.test(text));
  });
}

async function reloadAndProve(page, label) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /Mapa do trabalho/i }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1_000);
  evidence.reloads.push({ label, at: new Date().toISOString(), url: page.url() });
  await saveEvidence();
}

async function queryLatest(admin, table, filters, orderColumn = 'created_at') {
  let query = admin.from(table).select('*');
  for (const [column, value] of filters) query = query.eq(column, value);
  const { data, error } = await query.order(orderColumn, { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`Falha lendo ${table}: ${error.message}`);
  return data;
}

async function queryAll(admin, table, filters, orderColumn = 'created_at') {
  let query = admin.from(table).select('*');
  for (const [column, value] of filters) query = query.eq(column, value);
  const { data, error } = await query.order(orderColumn, { ascending: true });
  if (error) throw new Error(`Falha lendo ${table}: ${error.message}`);
  return data ?? [];
}

async function waitForLatestSkillRun(admin, projectId, skillId, predicate, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await queryLatest(admin, 'skill_runs', [['project_id', projectId], ['skill_id', skillId]]);
    if (last && predicate(last)) return last;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Timeout aguardando skill_run ${skillId}: ${JSON.stringify(last)}`);
}

async function waitForLatestJob(admin, projectId, skillId, predicate, timeoutMs = 10 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await queryLatest(admin, 'skill_run_jobs', [['project_id', projectId], ['skill_id', skillId]]);
    if (last && predicate(last)) return last;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Timeout aguardando job ${skillId}: status=${last?.status ?? 'ausente'} attempt=${last?.attempt ?? 'n/a'}`);
}

async function approveCurrent(page, admin, projectId, projectSlug, title, operatorInput) {
  const skillId = title === 'Leitor de Metricas' ? 'leitor-de-metricas' : title.toLowerCase();
  const startedAt = Date.now();
  await selectSkill(page, title);
  await page.getByLabel('Contexto adicional').fill(operatorInput);
  await page.getByRole('button', { name: 'Executar skill', exact: true }).click();
  let terminalJob = await waitForLatestJob(
    admin,
    projectId,
    skillId,
    (job) => ['succeeded', 'failed', 'cancelled'].includes(job.status),
    4 * 60_000,
  );
  if (terminalJob.status === 'failed') {
    const previousAttempt = terminalJob.attempt;
    evidence.retries.push({ skillId, jobId: terminalJob.id, attempt: previousAttempt, reason: 'terminal_failure', retriedFromUi: true });
    await reloadAndProve(page, `${title} falhou e ficou disponível para retry`);
    await selectSkill(page, title);
    await page.getByRole('button', { name: 'Repetir', exact: true }).click();
    terminalJob = await waitForLatestJob(
      admin,
      projectId,
      skillId,
      (job) => job.attempt > previousAttempt && ['succeeded', 'failed', 'cancelled'].includes(job.status),
      4 * 60_000,
    );
  }
  assert.equal(terminalJob.status, 'succeeded', `${skillId} falhou: ${JSON.stringify(terminalJob.error)}`);
  await reloadAndProve(page, `${title} pronto para revisão`);
  await selectSkill(page, title);
  await waitReview(page);
  const review = page.getByTestId('artifact-approval-review');
  if (skillId === 'briefista') {
    await review.getByRole('button', { name: 'Editar', exact: true }).click();
    const editor = review.getByLabel('Editar proposta (gera nova revisão)');
    const panel = parseYaml(await editor.inputValue());
    const candidates = panel?.briefista?.bateria_gerada;
    assert.equal(Array.isArray(candidates) && candidates.length >= 2, true, 'Briefista não entregou candidatos suficientes para curadoria.');
    panel.briefista.finalistas_curados = candidates.slice(0, 2).map((candidate) => ({
      angulo: candidate.angulo,
      hook: candidate.hook,
      formato: candidate.formato,
    }));
    panel.briefista.curadoria = {
      ...panel.briefista.curadoria,
      status: 'aprovada_pelo_operador',
      quantidade_finalistas: 2,
    };
    await editor.fill(stringifyYaml(panel));
    await review.getByRole('button', { name: 'Salvar edição', exact: true }).click();
    evidence.steps.push('Operador editou o Painel da Semana e curou dois finalistas antes de aprovar o Briefista.');
  }
  await review.getByRole('button', { name: 'Aprovar', exact: true }).click();
  await review.waitFor({ state: 'hidden', timeout: 30_000 });
  const run = await waitForLatestSkillRun(admin, projectId, skillId, (candidate) => candidate.status === 'done');
  const approvals = await queryAll(admin, 'artifact_approval_outbox', [['skill_run_id', run.id]]);
  const artifacts = await queryAll(admin, 'project_artifacts', [['skill_run_id', run.id]]);
  assert.equal(
    new Set(artifacts.map((artifact) => `${artifact.path}:${artifact.artifact_type}`)).size,
    artifacts.length,
    `${skillId} persistiu artefatos canônicos duplicados.`,
  );
  const jobs = await queryAll(admin, 'skill_run_jobs', [['project_id', projectId]]);
  const reconciledArtifacts = await Promise.all(artifacts.map(async (artifact) => {
    const absolutePath = resolve(repoRoot, 'projetos', projectSlug, artifact.path);
    const content = await readFile(absolutePath, 'utf8');
    const filesystemHash = createHash('sha256').update(content, 'utf8').digest('hex');
    assert.equal(filesystemHash, artifact.content_hash, `Hash divergente em ${artifact.path}`);
    let parsed = null;
    if (artifact.format === 'yaml') {
      const yaml = await import('yaml');
      parsed = yaml.parse(content);
    }
    return {
      id: artifact.id,
      path: artifact.path,
      artifactType: artifact.artifact_type,
      contentHash: artifact.content_hash,
      filesystemHash,
      state: artifact.state,
      verification: artifact.verification,
      content,
      parsed,
    };
  }));
  const job = jobs.find((candidate) => candidate.id === (run.input_snapshot?.jobId ?? '')) ?? null;
  assert.ok(run.input_snapshot?.jobId, `${skillId} terminou sem jobId durável.`);
  assert.ok(job, `${skillId} terminou sem registro correspondente em skill_run_jobs.`);
  const record = {
    skillId,
    title,
    runId: run.id,
    jobId: run.input_snapshot?.jobId ?? null,
    status: run.status,
    durationMs: Date.now() - startedAt,
    proposalHash: run.proposal_hash,
    proposal: run.proposal,
    operatorInput,
    approvals: approvals.map((candidate) => ({
      id: candidate.id,
      decision: candidate.decision,
      state: candidate.state,
      outcome: candidate.outcome,
      proposalHash: candidate.proposal_hash,
    })),
    artifacts: reconciledArtifacts,
    job,
  };
  evidence.skills.push(record);
  evidence.noMetaMutation.jobLogMatches.push({
    skillId,
    logs: Array.isArray(job?.logs) ? job.logs.filter((line) => /meta-ads|facebook|publish|publicar/i.test(String(line))) : [],
  });
  await saveEvidence();
  return record;
}

let browser;
let context;
let admin;
let databaseContainer;
let launcherRuntimeId;
let supabaseStartAttempted = false;
let launcherStartAttempted = false;

try {
  await rm(evidenceDir, { recursive: true, force: true });
  await mkdir(evidenceDir, { recursive: true });

  const manifest = await copyPilotSources();
  const previousLauncherStatus = await launcherCommand('status');
  assert.equal(/Marketing Studio aberto:/.test(previousLauncherStatus.stdout), false, 'Existe uma sessão ativa do Marketing Studio neste worktree.');

  const projectId = await supabaseProjectId();
  databaseContainer = `supabase_db_${projectId}`;
  assert.equal(await databaseIsRunning(databaseContainer), false, 'O Supabase compartilhado já está ativo; encerre os outros worktrees antes do E2E destrutivo.');

  supabaseStartAttempted = true;
  let supabaseStartError;
  try {
    await run('supabase', ['start'], 5 * 60_000, appRoot);
  } catch (caught) {
    supabaseStartError = caught;
  }
  if (!await databaseIsRunning(databaseContainer)) {
    throw supabaseStartError ?? new Error('Supabase não iniciou o container do banco.');
  }

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
    throw new Error('Supabase terminou o reset sem zerar usuários, workspaces e projetos.');
  }
  evidence.steps.push('Supabase local resetado sem usuários, workspaces e projetos.');

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
  launcherRuntimeId = ownedLauncher?.runtimeId;
  await waitFor(`${baseURL}/healthz`);
  await waitFor(`http://127.0.0.1:${bffPort}/healthz`);
  await waitForBootstrapEmpty();

  const config = await localSupabaseConfig();
  admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } });

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ locale: 'pt-BR', viewport: evidence.viewports.desktop });
  let page = await context.newPage();
  attachDiagnostics(page);

  await page.goto(`${baseURL}/`);
  await page.getByRole('heading', { name: 'Seu primeiro acesso' }).waitFor();
  const firstRun = page.locator('.local-first-run');
  await firstRun.getByLabel('E-mail', { exact: true }).fill(operatorEmail);
  await firstRun.getByLabel('Senha', { exact: true }).fill(password);
  await firstRun.getByLabel('Nome do seu negócio', { exact: true }).fill('Workspace Story 9.W2.3');
  await firstRun.getByRole('button', { name: 'Criar meu acesso', exact: true }).click();
  await page.getByRole('heading', { name: 'Seus projetos' }).waitFor();
  evidence.steps.push('Operador local criado e autenticado pelo fluxo oficial.');

  await page.getByRole('button', { name: 'Novo projeto', exact: true }).click();
  await page.getByLabel('Nome do projeto', { exact: true }).fill('Projeto temporário');
  await page.getByRole('button', { name: 'Criar e abrir', exact: true }).click();
  await page.getByRole('heading', { name: 'Próximo passo do projeto' }).waitFor();
  const temporaryProjectId = new URL(page.url()).pathname.split('/')[2];
  await page.getByRole('link', { name: 'Briefing', exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(briefPath);
  await page.getByRole('heading', { name: 'Próximo passo do projeto' }).waitFor();
  const importedProjectId = new URL(page.url()).pathname.split('/')[2];
  assert.notEqual(importedProjectId, temporaryProjectId);
  evidence.importedProjectId = importedProjectId;
  evidence.steps.push('Pacote data/pilots/academia-lendaria-project-brief.json importado sem seed oculto.');

  const importedBrief = await queryLatest(admin, 'project_brief_revisions', [['project_id', importedProjectId]]);
  assert.equal(importedBrief?.data?.project?.slug, sourceSlug);
  assert.equal(importedBrief?.data?.channels?.primaryCtaUrl, 'unknown');
  assert.equal(importedBrief?.data?.integrations?.openRouterStatus, 'unknown');
  evidence.steps.push('Lacunas unknown do pacote real persistidas no briefing importado.');

  await page.goto(`${baseURL}/projects/${importedProjectId}/briefing/project`);
  await assertFieldValue(page, 'Nome do projeto', 'A Máquina de Receita com IA');
  await assertFieldValue(page, 'Slug do projeto', sourceSlug);
  await waitForText(page, 'Importado');
  await capture(page, resolve(evidenceDir, 'briefing-desktop.png'), 'briefing desktop');

  await page.goto(`${baseURL}/projects`);
  await page.getByRole('button', { name: 'Trazer materiais', exact: true }).click();
  await page.getByRole('heading', { name: 'Traga os materiais que você já tem' }).waitFor();
  await page.getByLabel('Adicionar ao projeto').selectOption(importedProjectId);
  await page.getByLabel('Pasta com seus materiais').selectOption(sourceSlug);
  await page.getByRole('button', { name: 'Revisar materiais', exact: true }).click();
  await page.getByText('Pronto para revisar').waitFor();
  await page.getByText(`${manifest.artifactManifest.length} material(is) encontrado(s)`).waitFor();
  await page.getByRole('button', { name: 'Adicionar materiais', exact: true }).click();
  await page.getByText('Materiais adicionados').waitFor({ timeout: 30_000 });

  const intakeArtifacts = await queryAll(admin, 'project_artifacts', [['project_id', importedProjectId]]);
  const intakeFilesystemArtifacts = intakeArtifacts.filter((artifact) => artifact.source === 'filesystem');
  assert.equal(intakeFilesystemArtifacts.length >= manifest.artifactManifest.length, true, 'O intake não registrou todos os artefatos esperados.');
  const expectedHashes = new Set(manifest.artifactManifest.map((artifact) => artifact.sha256));
  const observedHashes = new Set(intakeFilesystemArtifacts.map((artifact) => artifact.content_hash));
  for (const hash of expectedHashes) assert.equal(observedHashes.has(hash), true, `Hash de intake ausente: ${hash}`);
  evidence.intake = {
    sourceSlug,
    expectedHashes: [...expectedHashes],
    recordedArtifacts: intakeFilesystemArtifacts.map((artifact) => ({
      path: artifact.path,
      type: artifact.artifact_type,
      hash: artifact.content_hash,
      source: artifact.source,
    })),
  };
  evidence.steps.push(`Intake W2.1 reconciliou ${manifest.artifactManifest.length} artefatos reais do pacote no Supabase sem copiar seed oculto.`);

  await page.getByRole('button', { name: new RegExp('A Máquina de Receita com IA') }).click();
  await page.getByRole('link', { name: 'Campanhas', exact: true }).click();
  await page.getByRole('heading', { name: /Campanhas do projeto/i }).waitFor();
  await page.getByRole('button', { name: 'Nova campanha', exact: true }).click();
  await page.getByLabel('Nome da campanha', { exact: true }).fill(campaignName);
  await page.getByRole('button', { name: 'Criar campanha', exact: true }).click();
  await page.getByRole('heading', { name: /Operação de tráfego/i }).waitFor({ timeout: 30_000 });
  const campaignId = new URL(page.url()).pathname.split('/')[4];
  assert.match(campaignId, /^[0-9a-f-]{36}$/i, 'A UI não retornou um campaignId persistido.');
  const createdCampaign = await queryLatest(admin, 'ads_campaigns', [['id', campaignId]]);
  assert.equal(createdCampaign?.project_id, importedProjectId);
  assert.equal(createdCampaign?.status, 'draft');
  assert.equal(createdCampaign?.step_current, 1);
  evidence.steps.push('Campanha draft criada pela interface e persistida no Supabase.');
  await saveEvidence();

  await page.getByRole('link', { name: 'Jornada', exact: true }).click();
  await page.getByRole('heading', { name: /Mapa do trabalho/i }).waitFor();

  await selectSkill(page, 'Zelador');
  await page.getByRole('link', { name: 'Completar briefing', exact: true }).waitFor();
  assert.equal(await page.getByLabel('Contexto adicional').count(), 0, 'Zelador não bloqueou a execução com CTA desconhecido.');
  evidence.refusals.push({
    skillId: 'zelador',
    type: 'readiness_block',
    reason: 'channels.primaryCtaUrl permaneceu unknown após o intake.',
    action: 'Completar briefing',
  });
  await page.getByRole('link', { name: 'Completar briefing', exact: true }).click();
  const ctaField = page.getByLabel('URL do CTA principal').first();
  await ctaField.waitFor({ state: 'visible' });
  await ctaField.fill('https://academialendaria.com/maquina-de-receita-com-ia');
  await page.waitForTimeout(1_500);
  await page.getByRole('link', { name: 'Jornada', exact: true }).click();
  await page.getByRole('heading', { name: /Mapa do trabalho/i }).waitFor();
  evidence.steps.push('Gate do Zelador bloqueou CTA unknown; o operador completou a URL antes da execução.');
  await saveEvidence();

  const refusalStart = Date.now();
  await selectSkill(page, 'Zelador');
  await page.getByLabel('Contexto adicional').fill('Operador não confirmou BM, Pixel, CAPI, deduplicação nem domínio. Bloqueie sem inventar, registre criticidade e não libere campanha.');
  await page.getByRole('button', { name: 'Executar skill', exact: true }).click();
  await waitForLatestJob(admin, importedProjectId, 'zelador', (job) => job.status === 'succeeded');
  await reloadAndProve(page, 'Zelador crítico pronto para revisão');
  await selectSkill(page, 'Zelador');
  await waitReview(page);
  const refusalReview = page.getByTestId('artifact-approval-review');
  const refusalText = await refusalReview.innerText();
  await refusalReview.getByRole('button', { name: 'Rejeitar', exact: true }).click();
  await refusalReview.waitFor({ state: 'hidden', timeout: 30_000 });
  const refusedRun = await waitForLatestSkillRun(admin, importedProjectId, 'zelador', (candidate) => candidate.status === 'cancelled');
  evidence.refusals.push({
    skillId: 'zelador',
    runId: refusedRun.id,
    durationMs: Date.now() - refusalStart,
    reason: 'Lacunas operacionais bloqueadas sem invenção.',
    excerpt: refusalText.slice(0, 700),
  });
  await saveEvidence();

  await reloadAndProve(page, 'recusa do Zelador persistida');

  await approveCurrent(page, admin, importedProjectId, sourceSlug, 'Zelador', 'Confirmação literal do operador: BM ativo; conta de anúncios ativa; Pixel Helper mostra evento PageView e ViewContent; CAPI aparece como Ativo no Events Manager; uma Compra chegou com event_id deduplicado; domínio verificado; pagamento aprovado. Não publique, não pause e não altere a Meta.');
  await completeBlockedField(page, 'Briefista', 'Nivel de consciencia', 3);
  const briefistaStage = await approveCurrent(page, admin, importedProjectId, sourceSlug, 'Briefista', 'Use somente dois ângulos aprovados pelo operador para o projeto real: 1) “Pare de operar aquisição no escuro”; consciência do problema. 2) “A rotina semanal que transforma números em decisão”; consciente da solução. Se algum elemento do briefing estiver unknown, registre a lacuna e siga apenas com o que foi confirmado. Deixe a curadoria humana explícita.');
  await completeBlockedField(page, 'Estruturador', 'Preco exato', 4888);
  const estruturadorStage = await approveCurrent(page, admin, importedProjectId, sourceSlug, 'Estruturador', 'Curadoria humana aprovada para dois finalistas: A) Hook “Você chama de intuição o que é falta de leitura”; formato reels-9x16. B) Hook “Uma decisão por semana baseada nos números certos”; formato feed. Monte somente o default sagrado: Vendas, Conversão, público amplo/frio + Advantage+, posicionamento automático, R$30/dia por 7 dias. Não publique e mantenha qualquer submissão como ação exclusivamente humana.');
  const leitorStage = await approveCurrent(page, admin, importedProjectId, sourceSlug, 'Leitor de Metricas', 'O operador colou literalmente: gasto R$630; impressões 41.800; cliques no link 334; compras 12; CPA do gerenciador R$52,50; ROAS do gerenciador 3,1x. O módulo econômico L0 confirmou cac_break_even de R$660 e roas_break_even de 1,82x. Não forneceu CTR, alcance, frequência, CPM nem janela de atribuição. Registre ausentes como null + selo nao_fornecido; não calcule nada ausente. ROAS ficou Estimado porque o caixa não confirmou a venda.');
  const diagnosticStage = await approveCurrent(page, admin, importedProjectId, sourceSlug, 'Diagnosticador', 'Leia somente a leitura literal anterior. Retorne UMA alavanca com hipótese, critério de sucesso, critério de reversão e circuit breaker. Não calcule métricas ausentes, não invente CTR/CPM/alcance/frequência e deixe a decisão humana explícita.');

  const unavailableMetrics = unavailableMetricsFromStage(leitorStage);
  const normalizedUnavailableMetrics = unavailableMetrics.map(normalizeText);
  assert.equal(normalizedUnavailableMetrics.includes('ctr'), true);
  assert.equal(normalizedUnavailableMetrics.includes('cpm'), true);
  assert.equal(normalizedUnavailableMetrics.includes('alcance'), true);
  assert.equal(normalizedUnavailableMetrics.includes('frequencia'), true);
  assert.deepEqual(derivedUnavailableMetrics(diagnosticStage.proposal, unavailableMetrics), []);
  evidence.steps.push('Leitor e Diagnosticador provaram fail-closed para métricas ausentes: CTR, CPM, alcance e frequência não foram inventados.');

  evidence.curation = {
    source: 'briefista',
    approvedRunId: briefistaStage.runId,
    note: 'Curadoria humana registrada na aprovação da bateria e refinada no input do Estruturador.',
  };
  evidence.manualSubmission = {
    source: 'estruturador',
    approvedRunId: estruturadorStage.runId,
    status: 'pending_external_human_only',
    note: 'Subida manual permanece externa; nenhuma mutação Meta ocorreu e a decisão humana ficou explícita.',
  };
  evidence.metrics = {
    source: 'leitor-de-metricas',
    approvedRunId: leitorStage.runId,
    unavailableMetrics,
  };
  evidence.humanDecision = {
    source: 'diagnosticador',
    approvedRunId: diagnosticStage.runId,
    note: 'A alavanca final exigiu aprovação humana no outbox antes de materializar.',
  };

  await page.getByRole('link', { name: 'Operação semanal', exact: true }).click();
  await page.getByRole('heading', { name: /Painel da semana/i }).waitFor();
  await page.getByRole('button', { name: 'Nova semana', exact: true }).click();
  await fillWeeklyMetric(page, 'Gasto', 630, 'Meta Ads');
  await fillWeeklyMetric(page, 'Impressões', 41800, 'Meta Ads');
  await fillWeeklyMetric(page, 'Cliques no link', 334, 'Meta Ads');
  await fillWeeklyMetric(page, 'Compras', 12, 'Meta Ads');
  await fillWeeklyMetric(page, 'CPA', 52.5, 'Meta Ads');
  await fillWeeklyMetric(page, 'ROAS', 3.1, 'Meta Ads', 'Estimado');
  await page.getByRole('button', { name: 'Confirmar leitura literal', exact: true }).click();
  await page.getByText('reading_ready', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Rodar Diagnosticador', exact: true }).click();
  await page.getByRole('button', { name: 'Usar como diagnóstico', exact: true }).waitFor({ timeout: 10 * 60_000 });
  await page.getByRole('button', { name: 'Usar como diagnóstico', exact: true }).click();
  await page.getByText('diagnosed', { exact: true }).waitFor();
  await page.getByLabel('Ação/observação do operador').fill('Manter uma única mudança por sete dias e revisar o critério de sucesso na próxima segunda-feira.');
  await page.getByRole('button', { name: 'Aprovar alavanca', exact: true }).click();
  await page.getByText(/Decisão registrada:/).waitFor();
  await page.getByText('approved', { exact: true }).waitFor();
  await page.waitForTimeout(1_500);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /Painel da semana/i }).waitFor();
  await page.getByText('approved', { exact: true }).waitFor();

  const weeklyPanel = await queryLatest(admin, 'ads_weekly_panels', [['project_id', importedProjectId]]);
  assert.equal(weeklyPanel?.status, 'decided');
  assert.equal(weeklyPanel?.data?.decision?.status, 'approved');
  assert.deepEqual(
    weeklyPanel?.data?.events?.map((event) => event.type),
    ['literal_reading_confirmed', 'diagnosis_proposed', 'lever_approved'],
  );
  evidence.weeklyOperation = {
    panelId: weeklyPanel.id,
    campaignId: weeklyPanel.campaign_id,
    status: weeklyPanel.status,
    decision: weeklyPanel.data.decision.status,
    events: weeklyPanel.data.events.map((event) => event.type),
  };
  evidence.steps.push('Operação semanal concluída com leitura literal, diagnóstico, decisão humana e reidratação persistida.');
  await saveEvidence();

  await page.getByRole('link', { name: 'Jornada', exact: true }).click();
  await page.getByRole('heading', { name: /Mapa do trabalho/i }).waitFor();

  const skillRuns = await queryAll(admin, 'skill_runs', [['project_id', importedProjectId]]);
  assert.equal(skillRuns.filter((runRecord) => ['zelador', 'briefista', 'estruturador', 'leitor-de-metricas', 'diagnosticador'].includes(runRecord.skill_id) && runRecord.status === 'done').length >= 5, true);

  const campaigns = await queryAll(admin, 'ads_campaigns', [['project_id', importedProjectId]]);
  assert.equal(campaigns.length, 1, 'A campanha draft do ciclo não foi preservada de forma inequívoca.');
  assert.equal(campaigns.every((campaign) => campaign.status === 'draft'), true, 'Alguma campanha saiu de draft.');
  evidence.noMetaMutation.campaignStatus = campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name, status: campaign.status }));
  const runningLauncher = await readLauncherState();
  assert.ok(runningLauncher?.bff?.logPath, 'Launcher não expôs o log do BFF para auditar rotas mutativas.');
  const bffLog = await readFile(runningLauncher.bff.logPath, 'utf8');
  evidence.noMetaMutation.backendPublishRequests = bffLog
    .split('\n')
    .filter((line) => /"url":"[^"]*(?:jobs(?:\.|%2e)enqueue|publish|meta-ads)/i.test(line));
  assert.deepEqual(evidence.visual.metaRequests, [], 'Houve request browser para domínio Meta/Facebook.');
  assert.deepEqual(evidence.noMetaMutation.backendPublishRequests, [], 'O BFF recebeu uma rota de publicação/Meta durante o ciclo.');
  assert.equal(
    evidence.noMetaMutation.jobLogMatches.every((entry) => entry.logs.length === 0),
    true,
    'Logs dos jobs sugerem handoff mutativo para Meta.',
  );

  await reloadAndProve(page, 'todas as skills persistidas');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByLabel('E-mail', { exact: true }).waitFor();

  await context.close();
  context = await browser.newContext({ locale: 'pt-BR', viewport: evidence.viewports.desktop });
  page = await context.newPage();
  attachDiagnostics(page);
  await page.goto(`${baseURL}/`);
  await page.getByLabel('E-mail', { exact: true }).fill(operatorEmail);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('heading', { name: 'Seus projetos' }).waitFor();
  await page.getByRole('button', { name: new RegExp('A Máquina de Receita com IA') }).click();
  await page.getByRole('link', { name: 'Jornada', exact: true }).click();
  await page.getByRole('heading', { name: /Mapa do trabalho/i }).waitFor();
  await selectSkill(page, 'Diagnosticador');
  await page.locator('.cms-run-status strong').getByText('Concluída').waitFor({ timeout: 30_000 });
  evidence.steps.push('Logout/login em novo BrowserContext reidratou a jornada concluída.');

  await capture(page, resolve(evidenceDir, 'journey-desktop.png'), 'journey desktop');
  evidence.visual.desktop = resolve(evidenceDir, 'journey-desktop.png');

  const beforeRestart = launcherRuntimeId;
  await context.close();
  await launcherCommand('stop');
  const stoppedState = await readLauncherState();
  assert.equal(stoppedState, null);
  const restarted = await launcherCommand('start');
  assert.match(safeOutput(restarted.stdout), /Marketing Studio aberto:/);
  const restartedState = await readLauncherState();
  assert.notEqual(restartedState?.runtimeId, beforeRestart);
  launcherRuntimeId = restartedState?.runtimeId;
  await waitFor(`${baseURL}/healthz`);
  await waitFor(`http://127.0.0.1:${bffPort}/healthz`);

  context = await browser.newContext({ locale: 'pt-BR', viewport: evidence.viewports.mobile });
  page = await context.newPage();
  attachDiagnostics(page);
  await page.goto(`${baseURL}/`);
  await page.getByLabel('E-mail', { exact: true }).fill(operatorEmail);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('heading', { name: 'Seus projetos' }).waitFor();
  await page.getByRole('button', { name: new RegExp('A Máquina de Receita com IA') }).click();
  await page.getByRole('link', { name: 'Jornada', exact: true }).click();
  await page.getByRole('heading', { name: /Mapa do trabalho/i }).waitFor();
  await selectSkill(page, 'Diagnosticador');
  await page.locator('.cms-run-status strong').getByText('Concluída').waitFor({ timeout: 30_000 });
  await capture(page, resolve(evidenceDir, 'journey-mobile.png'), 'journey mobile');
  evidence.visual.mobile = resolve(evidenceDir, 'journey-mobile.png');
  evidence.steps.push('Restart do launcher oficial preservou autenticação, projeto, intake e histórico de skills.');

  assert.deepEqual(evidence.visual.consoleErrors, [], `console errors: ${evidence.visual.consoleErrors.join('\n')}`);
  assert.deepEqual(evidence.visual.pageErrors, [], `page errors: ${evidence.visual.pageErrors.join('\n')}`);
  assert.deepEqual(evidence.visual.networkFailures, [], `network failures: ${evidence.visual.networkFailures.join('\n')}`);
  assert.deepEqual(evidence.visual.badResponses, [], `bad responses: ${evidence.visual.badResponses.join('\n')}`);

  await saveEvidence();
  const serializedEvidence = await readFile(sourceEvidencePath, 'utf8');
  assert.equal(serializedEvidence.includes('/Users/'), false, 'A evidência não pode conter caminhos absolutos.');
  assert.equal(serializedEvidence.includes('"operatorInput":'), false, 'A evidência não pode persistir input bruto do operador.');
  assert.equal(serializedEvidence.includes(password), false, 'A evidência não pode persistir a senha do operador.');
  console.log(`Story 9.W2.3 Playwright PASS. Evidence: ${evidenceDir}`);
} finally {
  if (context) await context.close().catch(() => undefined);
  if (browser) await browser.close().catch(() => undefined);
  const currentLauncher = await readLauncherState();
  const ownsCompletedStart = launcherRuntimeId && currentLauncher?.runtimeId === launcherRuntimeId;
  const ownsPartialStart = launcherStartAttempted && !launcherRuntimeId && currentLauncher?.webPort === webPort && currentLauncher?.bffPort === bffPort;
  if (ownsCompletedStart || ownsPartialStart) {
    await launcherCommand('stop').catch(() => undefined);
  }
  if (supabaseStartAttempted) {
    const projectId = await supabaseProjectId().catch(() => null);
    if (projectId) {
      await run('supabase', ['stop', '--project-id', projectId, '--no-backup'], 3 * 60_000, appRoot).catch(() => undefined);
    }
  }
  await rm(sourceRoot, { recursive: true, force: true }).catch(() => undefined);
}
