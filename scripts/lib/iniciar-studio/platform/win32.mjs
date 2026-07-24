import { createHash } from 'node:crypto';

import { spawn, spawnSync } from 'node:child_process';

import { mkdirSync, readFileSync, unlinkSync, writeFileSync, existsSync } from 'node:fs';

import { join, resolve } from 'node:path';

import { aioxDir } from '../../iniciar-trafego/project-context.mjs';

import { readInstallIntent } from '../install-intent-store.mjs';

import { resolveCohortRoot } from '../discovery.mjs';



const RESUME_FILE = 'os-resume-task.json';



function taskName(projectRoot) {

  return `AIOX-IniciarStudio-${createHash('sha256').update(resolve(projectRoot)).digest('hex').slice(0, 8)}`;

}



function resumePath(projectRoot) {

  mkdirSync(aioxDir(projectRoot), { recursive: true });

  return join(aioxDir(projectRoot), RESUME_FILE);

}



function buildEnsureTr(projectRoot, taskNameValue) {
  const cohortRoot = resolveCohortRoot();
  const projectAbsolute = resolve(projectRoot);
  const cmdPath = join(aioxDir(projectRoot), 'resume-traffic.cmd');
  mkdirSync(aioxDir(projectRoot), { recursive: true });
  const lines = [
    '@echo off',
    `cd /d "${cohortRoot}"`,
    `node scripts/iniciar-trafego.mjs resume --project="${projectAbsolute}" --execute`,
    'if errorlevel 1 exit /b %errorlevel%',
    `schtasks /Delete /F /TN "${taskNameValue}"`,
  ];
  writeFileSync(cmdPath, `${lines.join('\r\n')}\r\n`, 'utf8');
  return `cmd /c "${cmdPath.replace(/\\/g, '/')}"`;
}



function installScheduledTask(projectRoot, manifest) {

  const tn = taskName(projectRoot);

  const cohortRoot = resolveCohortRoot();

  const entry = join(cohortRoot, 'scripts/iniciar-trafego.mjs');

  if (!existsSync(entry)) {

    const err = new Error(`Entrypoint cohort ausente: ${entry}`);

    err.code = 'COHORT_ENTRYPOINT_MISSING';

    throw err;

  }

  const tr = buildEnsureTr(projectRoot, tn);

  const create = spawnSync('schtasks', ['/Create', '/F', '/TN', tn, '/TR', tr, '/SC', 'ONLOGON', '/RL', 'LIMITED'], {

    encoding: 'utf8',

    windowsHide: true,

  });

  manifest.scheduledTaskName = tn;

  manifest.cohortRoot = cohortRoot;

  manifest.entrypoint = entry;

  manifest.projectRoot = resolve(projectRoot);

  manifest.schtasksExit = create.status;

  manifest.schtasksStdout = (create.stdout || '').trim();

  manifest.schtasksStderr = (create.stderr || '').trim();

  if (create.status !== 0) {

    const err = new Error(`schtasks /Create falhou (${create.status}): ${manifest.schtasksStderr || manifest.schtasksStdout}`);

    err.code = 'SCHTASKS_FAILED';

    throw err;

  }

  return tn;

}



export async function registerResumeIntent(projectRoot, lease = {}) {

  const intent = readInstallIntent(projectRoot);

  const cohortRoot = resolveCohortRoot();

  const entry = join(cohortRoot, 'scripts/iniciar-trafego.mjs');

  const manifest = {

    schemaVersion: '1.0.0',

    mechanism: 'ScheduledTask',

    platform: 'win32',

    purpose: lease.purpose || intent?.purpose || 'traffic-sync',

    cohortRoot,

    entrypoint: entry,

    projectRoot: resolve(projectRoot),

    command: buildEnsureTr(projectRoot, taskName(projectRoot)),

    createdAt: new Date().toISOString(),

  };

  const path = resumePath(projectRoot);

  if (process.platform === 'win32' && lease.testOnly !== true) {

    installScheduledTask(projectRoot, manifest);

  }

  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return { ok: true, mechanism: 'ScheduledTask', path, manifest, testOnly: lease.testOnly === true };

}



export async function removeResumeIntent(projectRoot) {

  const path = resumePath(projectRoot);

  const existing = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;

  if (existing?.scheduledTaskName && process.platform === 'win32') {

    spawnSync('schtasks', ['/Delete', '/F', '/TN', existing.scheduledTaskName], { encoding: 'utf8', windowsHide: true });

  }

  if (existsSync(path)) unlinkSync(path);

  return { ok: true, removed: true, path };

}



export async function openDeepLink(url) {

  await new Promise((resolvePromise, reject) => {

    spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', windowsHide: true })

      .on('error', reject)

      .on('exit', () => resolvePromise());

  });

  return { ok: true, url };

}



export function readResumeTask(projectRoot) {

  const path = resumePath(projectRoot);

  if (!existsSync(path)) return null;

  return JSON.parse(readFileSync(path, 'utf8'));

}


