import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { detectStudio } from './discovery.mjs';
import { installOrUpdateStudio } from './installer.mjs';
import { writeInstallIntent } from './install-intent-store.mjs';
import { createLease, loadLease, clearLease } from './runtime-lease.mjs';
import { openDeepLink, registerResumeIntent, removeResumeIntent } from './platform/index.mjs';
import { studioConnectionConfig, studioHealthCheck } from '../iniciar-trafego/studio-connection.mjs';
import { transitionRunState } from '../iniciar-trafego/run-state.mjs';
import { aioxDir, readJson, writeJson } from '../iniciar-trafego/project-context.mjs';
import { ensureDockerAvailable } from './platform/dependencies.mjs';

function runNode(script, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => {
      resolvePromise({ code, stdout, stderr });
    });
  });
}

function studioRuntimePaths(studioRoot) {
  const id = createHash('sha256').update(resolve(studioRoot)).digest('hex').slice(0, 12);
  const directory = join(tmpdir(), `marketing-studio-${id}`);
  return {
    directory,
    state: join(directory, 'state.json'),
    readiness: join(directory, 'readiness.json'),
  };
}

/** Propaga token/readiness do launcher para o processo cohort (QA-P0-03). */
export function hydrateStudioConnectionEnv(studioRoot) {
  const paths = studioRuntimePaths(studioRoot);
  if (existsSync(paths.readiness)) {
    process.env.MARKETING_STUDIO_READINESS_FILE = paths.readiness;
  }
  if (existsSync(paths.state)) {
    try {
      const state = JSON.parse(readFileSync(paths.state, 'utf8'));
      const token = String(state?.localSkillRunnerToken || state?.token || '');
      if (token) {
        process.env.LOCAL_SKILL_RUNNER_TOKEN = token;
        process.env.LOCAL_RUNNER_TOKEN = token;
      }
      if (state?.bffPort) {
        process.env.MARKETING_STUDIO_BFF_PORT = String(state.bffPort);
        process.env.MARKETING_STUDIO_BFF_URL = `http://127.0.0.1:${state.bffPort}`;
      }
    } catch {
      /* ignore */
    }
  }
  return paths;
}

export async function ensureTrafficSyncRuntime(projectRoot, intent) {
  transitionRunState(projectRoot, { state: 'ENSURING_STUDIO', note: 'ensure Studio traffic-sync' });
  const intentPath = writeInstallIntent(projectRoot, intent);
  let studio = await detectStudio();
  const expectedRoot = studio.root;
  const existingHealth = studio.ok
    ? (hydrateStudioConnectionEnv(studio.root), await studioHealthCheck(studioConnectionConfig()).catch(() => ({ ok: false })))
    : { ok: false };

  const lease = createLease(projectRoot, {
    purpose: 'traffic-sync',
    studioRoot: expectedRoot,
    profile: 'traffic-sync',
    intentPath,
    runtimePreexisting: existingHealth.ok === true,
    ownsRuntime: existingHealth.ok !== true,
  });
  await registerResumeIntent(projectRoot, lease);
  if (!studio.ok) {
    if (!['STUDIO_NOT_INSTALLED', 'STUDIO_OUTDATED', 'STUDIO_CORRUPTED'].includes(studio.code)) {
      const error = new Error(studio.code || 'STUDIO_NOT_FOUND');
      error.code = studio.code;
      throw error;
    }
    await installOrUpdateStudio({ destination: expectedRoot });
    studio = await detectStudio();
    if (!studio.ok) throw new Error(studio.code || 'STUDIO_INSTALL_VERIFY_FAILED');
  }
  ensureDockerAvailable();

  const launcher = resolve(studio.root, 'scripts/marketing-studio.mjs');
  const args = ['start', '--profile=traffic-sync', '--no-browser', '--no-open', `--lease=${lease.leaseId}`];
  const result = await runNode(launcher, args, studio.root);
  if (result.code !== 0) {
    throw new Error(`Launcher traffic-sync falhou: ${result.stderr || result.stdout}`);
  }

  hydrateStudioConnectionEnv(studio.root);

  const config = studioConnectionConfig();
  const health = await studioHealthCheck(config);
  if (!health.ok) {
    throw new Error(`BFF indisponivel apos ensure (${config.bffUrl}${config.healthPath})`);
  }

  transitionRunState(projectRoot, { state: 'STUDIO_RUNTIME_READY', note: 'BFF health ok pos-ensure' });

  return {
    ok: true,
    leaseId: lease.leaseId,
    bffUrl: config.bffUrl,
    healthPath: config.healthPath,
    intentPath,
  };
}

export async function openProject(projectRoot, { leaseId, deepLink }) {
  const lease = loadLease(projectRoot, leaseId);
  if (!lease) throw new Error('Lease ausente — rode approve novamente');
  const parsed = new URL(deepLink);
  if (!/^https?:$/.test(parsed.protocol) || parsed.pathname === '/' || !parsed.pathname) {
    throw new Error('Deep link do projeto inválido — home genérica proibida');
  }
  const receiptPath = join(aioxDir(projectRoot), 'receipts', `open-${lease.leaseId}.json`);
  const previous = readJson(receiptPath);
  if (previous?.opened === true && previous?.deepLink === deepLink) {
    return { ok: true, deepLink, leaseId: lease.leaseId, openedOnce: true, receipt: previous };
  }

  const studio = await detectStudio();
  const launcher = resolve(studio.root, 'scripts/marketing-studio.mjs');
  const args = ['start', '--profile=open', '--no-open', `--deep-link=${deepLink}`];
  if (lease.leaseId) args.push(`--lease=${lease.leaseId}`);
  const result = await runNode(launcher, args, studio.root);
  if (result.code !== 0) {
    throw new Error(`Launcher open falhou: ${result.stderr || result.stdout}`);
  }

  await openDeepLink(deepLink);
  const receipt = {
    schemaVersion: '1.0.0',
    receiptId: `open-${lease.leaseId}`,
    leaseId: lease.leaseId,
    deepLink,
    opened: true,
    openedAt: new Date().toISOString(),
  };
  writeJson(receiptPath, receipt);
  return { ok: true, deepLink, leaseId: lease.leaseId, openedOnce: true, receipt };
}

export async function releaseRuntime(projectRoot, { leaseId }) {
  const lease = loadLease(projectRoot, leaseId);
  if (!lease) return { ok: true, released: false };

  const studio = await detectStudio();
  const launcher = resolve(studio.root, 'scripts/marketing-studio.mjs');
  if (lease.ownsRuntime === true) {
    await runNode(launcher, ['stop', `--lease=${lease.leaseId}`], studio.root);
  }
  await removeResumeIntent(projectRoot, lease);
  clearLease(projectRoot);
  return { ok: true, released: true, leaseId };
}

export function writeSyncIntentFile(projectRoot, intent) {
  const path = resolve(projectRoot, '.aiox', 'sync-intent.json');
  writeFileSync(path, `${JSON.stringify(intent, null, 2)}\n`, 'utf8');
  return path;
}
