import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const RUN_DIR = '.aiox/iniciar-trafego';

export function aioxDir(projectRoot) {
  return join(projectRoot, RUN_DIR);
}

export function ensureRunDirs(projectRoot) {
  const base = aioxDir(projectRoot);
  for (const sub of ['proposals', 'approvals', 'receipts', 'backups']) {
    mkdirSync(join(base, sub), { recursive: true });
  }
  return base;
}

export function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function sha256File(path) {
  if (!existsSync(path)) return '';
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function newId(prefix) {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export function readManifest(projectRoot) {
  return readJson(join(projectRoot, 'project-manifest.json'));
}

export function writeManifest(projectRoot, manifest) {
  writeJson(join(projectRoot, 'project-manifest.json'), manifest);
}

export function ensureManifest(projectRoot, slugHint) {
  let m = readManifest(projectRoot);
  if (m?.projectId) return m;
  const slug = slugHint || projectRoot.split(/[/\\]/).pop();
  m = {
    schemaVersion: '1.0.0',
    projectId: newId('prj'),
    slug,
    name: slug,
    createdAt: new Date().toISOString(),
    source: 'iniciar-trafego',
  };
  writeManifest(projectRoot, m);
  return m;
}
