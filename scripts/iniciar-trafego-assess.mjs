#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const args = process.argv.slice(2).join(' ');
const projectArg = process.argv.find((a) => a.startsWith('--project='));
if (!projectArg) {
  console.error('Uso: node scripts/iniciar-trafego-assess.mjs --project=projetos/{slug}');
  process.exit(1);
}
const r = spawnSync(process.execPath, ['scripts/iniciar-trafego.mjs', 'start', ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
});
process.exit(r.status ?? 1);
