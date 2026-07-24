import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { aioxDir, ensureRunDirs } from '../iniciar-trafego/project-context.mjs';

const FILE = 'studio-install-intent.json';

export function intentPath(projectRoot) {
  ensureRunDirs(projectRoot);
  return join(aioxDir(projectRoot), FILE);
}

export function writeInstallIntent(projectRoot, intent) {
  const path = intentPath(projectRoot);
  mkdirSync(aioxDir(projectRoot), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ ...intent, updatedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');
  return path;
}

export function readInstallIntent(projectRoot) {
  const path = intentPath(projectRoot);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}
