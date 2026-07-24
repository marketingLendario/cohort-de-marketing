#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const checks = [
  { file: 'scripts/iniciar-trafego.mjs', states: ['STAGING', 'STUDIO_VERIFYING'] },
  { file: 'scripts/lib/iniciar-studio/coordinator.mjs', states: ['ENSURING_STUDIO', 'STUDIO_RUNTIME_READY'] },
];

function fail(msg) {
  console.error(`validate-iniciar-trafego-lifecycle-qa4: FAIL — ${msg}`);
  process.exit(1);
}

for (const { file, states } of checks) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  for (const state of states) {
    if (!text.includes(`'${state}'`) && !text.includes(`"${state}"`)) {
      fail(`${file} nao emite estado ${state}`);
    }
  }
}

console.log('validate-iniciar-trafego-lifecycle-qa4: PASS');
