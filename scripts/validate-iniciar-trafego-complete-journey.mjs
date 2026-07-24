#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsRoot = dirname(fileURLToPath(import.meta.url));
const cohortRoot = dirname(scriptsRoot);

const validators = [
  'validate-iniciar-trafego-schemas.mjs',
  'validate-iniciar-trafego-synthetic-topology.mjs',
  'validate-iniciar-trafego-discovery-identity.mjs',
  'validate-iniciar-trafego-artifact-bindings.mjs',
  'validate-iniciar-trafego-semantic-bridge.mjs',
  'validate-iniciar-trafego-conversion-gates.mjs',
  'validate-iniciar-trafego-proposal-lifecycle.mjs',
  'validate-iniciar-trafego-resume-matrix.mjs',
  'validate-iniciar-trafego-database-sync.mjs',
  'validate-iniciar-trafego-surfaces.mjs',
  'validate-iniciar-trafego-studio.mjs',
  'validate-iniciar-studio-runtime.mjs',
  'validate-iniciar-trafego-ready.mjs',
  'validate-iniciar-trafego-qa3-fixes.mjs',
];

const results = [];
for (const validator of validators) {
  const result = spawnSync(process.execPath, [join(scriptsRoot, validator)], {
    cwd: cohortRoot,
    encoding: 'utf8',
    timeout: 120_000,
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  results.push({ validator, status: result.status, output });
  console.log(`[${result.status === 0 ? 'PASS' : 'FAIL'}] ${validator}`);
}

const failed = results.filter((result) => result.status !== 0);
if (failed.length) {
  for (const result of failed) console.error(`\n--- ${result.validator}\n${result.output}`);
  console.error(`validate-iniciar-trafego-complete-journey: FAIL (${failed.length}/${validators.length})`);
  process.exit(1);
}

if (results.length !== validators.length) {
  console.error('validate-iniciar-trafego-complete-journey: FAIL — nem todos os subvalidadores foram executados');
  process.exit(1);
}
console.log(`validate-iniciar-trafego-complete-journey: PASS (${results.length}/${validators.length} executados)`);
