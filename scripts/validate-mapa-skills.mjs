#!/usr/bin/env node
/** Wrapper: wiring + preview (substitui validação monolítica). */
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (script, extra = []) => {
  const r = spawnSync('node', [join(ROOT, 'scripts', script), ...extra], { stdio: 'inherit', cwd: ROOT });
  return r.status ?? 1;
};

let code = run('validate-mapa-wiring.mjs');
if (code === 0 && (process.argv.includes('--playwright') || process.argv.includes('--ui'))) {
  code = run('validate-mapa-preview.mjs');
}
process.exit(code);