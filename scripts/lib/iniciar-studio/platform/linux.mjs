import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { aioxDir } from '../../iniciar-trafego/project-context.mjs';
import { resolveCohortRoot } from '../discovery.mjs';

const RESUME_FILE = 'os-resume-task.json';

function unitName(projectRoot) {
  return `aiox-iniciar-trafego-${createHash('sha256').update(resolve(projectRoot)).digest('hex').slice(0, 8)}.service`;
}

function resumePath(projectRoot) {
  mkdirSync(aioxDir(projectRoot), { recursive: true });
  return join(aioxDir(projectRoot), RESUME_FILE);
}

function systemdEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export async function registerResumeIntent(projectRoot, lease = {}) {
  const cohortRoot = resolveCohortRoot();
  const entry = join(cohortRoot, 'scripts/iniciar-trafego.mjs');
  const name = unitName(projectRoot);
  const unitDir = join(homedir(), '.config', 'systemd', 'user');
  const unitPath = join(unitDir, name);
  mkdirSync(unitDir, { recursive: true });
  const unit = `[Unit]
Description=AIOX iniciar-trafego resume

[Service]
Type=oneshot
WorkingDirectory="${systemdEscape(cohortRoot)}"
ExecStart="${systemdEscape(process.execPath)}" "${systemdEscape(entry)}" resume "--project=${systemdEscape(resolve(projectRoot))}" --execute
RemainAfterExit=no

[Install]
WantedBy=default.target
`;
  writeFileSync(unitPath, unit, 'utf8');
  let enable = { status: null, stdout: '', stderr: '' };
  if (process.platform === 'linux') {
    spawnSync('systemctl', ['--user', 'daemon-reload'], { encoding: 'utf8' });
    enable = spawnSync('systemctl', ['--user', 'enable', '--now', name], { encoding: 'utf8' });
    if (enable.status !== 0) {
      const error = new Error(`systemd --user falhou (${enable.status}): ${(enable.stderr || enable.stdout || '').trim()}`);
      error.code = 'SYSTEMD_USER_FAILED';
      throw error;
    }
  }
  const manifest = {
    schemaVersion: '1.0.0',
    mechanism: 'systemd-user',
    platform: 'linux',
    purpose: lease.purpose ?? 'traffic-sync',
    projectRoot: resolve(projectRoot),
    cohortRoot,
    entrypoint: entry,
    unitName: name,
    unitPath,
    command: `${process.execPath} ${entry} resume --project="${resolve(projectRoot)}" --execute`,
    createdAt: new Date().toISOString(),
  };
  const path = resumePath(projectRoot);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { ok: true, mechanism: 'systemd-user', path, manifest };
}

export async function removeResumeIntent(projectRoot) {
  const path = resumePath(projectRoot);
  const existing = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  if (existing?.unitName && process.platform === 'linux') {
    spawnSync('systemctl', ['--user', 'disable', '--now', existing.unitName], { encoding: 'utf8' });
    spawnSync('systemctl', ['--user', 'daemon-reload'], { encoding: 'utf8' });
  }
  if (existing?.unitPath && existsSync(existing.unitPath)) unlinkSync(existing.unitPath);
  if (existsSync(path)) unlinkSync(path);
  return { ok: true, removed: true, path };
}

export async function openDeepLink(url) {
  await new Promise((resolvePromise, reject) => {
    spawn('xdg-open', [url], { stdio: 'ignore' }).on('error', reject).on('exit', () => resolvePromise());
  });
  return { ok: true, url };
}

export function readResumeTask(projectRoot) {
  const path = resumePath(projectRoot);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}
