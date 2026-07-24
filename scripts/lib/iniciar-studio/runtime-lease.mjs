import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { aioxDir, ensureRunDirs } from '../iniciar-trafego/project-context.mjs';

const FILE = 'studio-runtime-lease.json';

export function leasePath(projectRoot) {
  ensureRunDirs(projectRoot);
  return join(aioxDir(projectRoot), FILE);
}

export function createLease(projectRoot, data) {
  const lease = {
    schemaVersion: '1.0.0',
    leaseId: randomUUID(),
    createdAt: new Date().toISOString(),
    runtimePreexisting: false,
    ownsRuntime: true,
    ...data,
  };
  mkdirSync(aioxDir(projectRoot), { recursive: true });
  writeFileSync(leasePath(projectRoot), `${JSON.stringify(lease, null, 2)}\n`, 'utf8');
  return lease;
}

export function loadLease(projectRoot, leaseId) {
  const path = leasePath(projectRoot);
  if (!existsSync(path)) return null;
  const lease = JSON.parse(readFileSync(path, 'utf8'));
  if (leaseId && lease.leaseId !== leaseId) {
    throw new Error(`Lease ${leaseId} nao corresponde ao lease persistido`);
  }
  return lease;
}

export function clearLease(projectRoot) {
  const path = leasePath(projectRoot);
  if (existsSync(path)) writeFileSync(path, '{}', 'utf8');
}
