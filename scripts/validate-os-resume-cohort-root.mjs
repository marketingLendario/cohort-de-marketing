#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const win32 = readFileSync(join(ROOT, 'scripts/lib/iniciar-studio/platform/win32.mjs'), 'utf8');
const darwin = readFileSync(join(ROOT, 'scripts/lib/iniciar-studio/platform/darwin.mjs'), 'utf8');

function fail(msg) {
  console.error(`validate-os-resume-cohort-root: FAIL — ${msg}`);
  process.exit(1);
}

if (!win32.includes('resolveCohortRoot')) fail('win32.mjs deve usar resolveCohortRoot');
if (!darwin.includes('resolveCohortRoot')) fail('darwin.mjs deve usar resolveCohortRoot');
if (win32.includes('scripts/iniciar-studio.mjs ensure --purpose=traffic-sync --project="${root}')) {
  fail('win32 nao deve apontar entrypoint para projectRoot');
}
if (!/schtasks \/Delete/.test(win32)) fail('win32 deve autoremover tarefa apos ensure');
if (!win32.includes('cohortRoot')) fail('manifest win32 deve registrar cohortRoot');
if (!darwin.includes('cohortRoot')) fail('manifest darwin deve registrar cohortRoot');
if (darwin.includes("join(root, 'scripts/iniciar-studio.mjs')")) fail('darwin nao deve usar projectRoot como entrypoint');

console.log('validate-os-resume-cohort-root: PASS');
