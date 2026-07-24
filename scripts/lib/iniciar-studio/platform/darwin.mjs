import { createHash } from 'node:crypto';

import { spawn, spawnSync } from 'node:child_process';

import { homedir } from 'node:os';

import { mkdirSync, readFileSync, unlinkSync, writeFileSync, existsSync } from 'node:fs';

import { join, resolve } from 'node:path';

import { aioxDir } from '../../iniciar-trafego/project-context.mjs';

import { readInstallIntent } from '../install-intent-store.mjs';

import { resolveCohortRoot } from '../discovery.mjs';



const RESUME_FILE = 'os-resume-task.json';

function xml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}



function agentLabel(projectRoot) {

  return `com.aiox.iniciar-studio.${createHash('sha256').update(resolve(projectRoot)).digest('hex').slice(0, 8)}`;

}



function resumePath(projectRoot) {

  mkdirSync(aioxDir(projectRoot), { recursive: true });

  return join(aioxDir(projectRoot), RESUME_FILE);

}



function installLaunchAgent(projectRoot, manifest) {

  const label = agentLabel(projectRoot);

  const cohortRoot = resolveCohortRoot();

  const entry = join(cohortRoot, 'scripts/iniciar-trafego.mjs');

  if (!existsSync(entry)) {

    const err = new Error(`Entrypoint cohort ausente: ${entry}`);

    err.code = 'COHORT_ENTRYPOINT_MISSING';

    throw err;

  }

  const proj = resolve(projectRoot);

  const plistPath = join(homedir(), 'Library', 'LaunchAgents', `${label}.plist`);

  mkdirSync(join(homedir(), 'Library', 'LaunchAgents'), { recursive: true });

  const plist = `<?xml version="1.0" encoding="UTF-8"?>

<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">

<plist version="1.0"><dict>

  <key>Label</key><string>${xml(label)}</string>

  <key>ProgramArguments</key>

  <array>

    <string>${xml(process.execPath)}</string>

    <string>${xml(entry)}</string>

    <string>resume</string>

    <string>--project=${xml(proj)}</string>

    <string>--execute</string>

  </array>

  <key>WorkingDirectory</key><string>${xml(cohortRoot)}</string>

  <key>RunAtLoad</key><true/>

  <key>StandardOutPath</key><string>${xml(join(aioxDir(projectRoot), 'launchagent.out.log'))}</string>

  <key>StandardErrorPath</key><string>${xml(join(aioxDir(projectRoot), 'launchagent.err.log'))}</string>

</dict></plist>`;

  writeFileSync(plistPath, plist, 'utf8');

  spawnSync('launchctl', ['bootout', `gui/${process.getuid?.() ?? 501}`, plistPath], { encoding: 'utf8' });

  const load = spawnSync('launchctl', ['bootstrap', `gui/${process.getuid?.() ?? 501}`, plistPath], { encoding: 'utf8' });

  manifest.launchAgentLabel = label;

  manifest.launchAgentPlist = plistPath;

  manifest.cohortRoot = cohortRoot;

  manifest.entrypoint = entry;

  manifest.projectRoot = proj;

  manifest.launchctlExit = load.status;

  if (load.status !== 0) {

    const err = new Error(`launchctl bootstrap falhou (${load.status}): ${(load.stderr || load.stdout || '').trim()}`);

    err.code = 'LAUNCHCTL_FAILED';

    throw err;

  }

  return label;

}



export async function registerResumeIntent(projectRoot, lease = {}) {

  const intent = readInstallIntent(projectRoot);

  const cohortRoot = resolveCohortRoot();

  const entry = join(cohortRoot, 'scripts/iniciar-trafego.mjs');

  const manifest = {

    schemaVersion: '1.0.0',

    mechanism: 'LaunchAgent',

    platform: 'darwin',

    purpose: lease.purpose || intent?.purpose || 'traffic-sync',

    cohortRoot,

    entrypoint: entry,

    projectRoot: resolve(projectRoot),

    command: `node ${entry} resume --project=${resolve(projectRoot)} --execute`,

    createdAt: new Date().toISOString(),

  };

  const path = resumePath(projectRoot);

  if (process.platform === 'darwin') {

    installLaunchAgent(projectRoot, manifest);

  }

  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return { ok: true, mechanism: 'LaunchAgent', path, manifest };

}



export async function removeResumeIntent(projectRoot) {

  const path = resumePath(projectRoot);

  const existing = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;

  if (existing?.launchAgentPlist && process.platform === 'darwin') {

    spawnSync('launchctl', ['bootout', `gui/${process.getuid?.() ?? 501}`, existing.launchAgentPlist], { encoding: 'utf8' });

    if (existsSync(existing.launchAgentPlist)) unlinkSync(existing.launchAgentPlist);

  }

  if (existsSync(path)) unlinkSync(path);

  return { ok: true, removed: true, path };

}



export async function openDeepLink(url) {

  await new Promise((resolvePromise, reject) => {

    spawn('open', [url], { stdio: 'ignore' }).on('error', reject).on('exit', () => resolvePromise());

  });

  return { ok: true, url };

}



export function readResumeTask(projectRoot) {

  const path = resumePath(projectRoot);

  if (!existsSync(path)) return null;

  return JSON.parse(readFileSync(path, 'utf8'));

}


