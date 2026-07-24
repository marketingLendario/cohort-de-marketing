#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { discoverProjects } from './lib/iniciar-trafego/project-discovery.mjs';
import { assessProject } from './lib/iniciar-trafego-gates.mjs';

const ROOT = process.cwd();
const discovery = discoverProjects({ cohortRoot: ROOT });
if (discovery.operationalCount !== 2) {
  console.error('validate-iniciar-trafego-prestudio-gates: FAIL — discover count');
  process.exit(1);
}

const forja = resolve(ROOT, 'projetos/forja');
const assessment = assessProject(forja, ROOT);
if (assessment.missingArtifacts.length === 0 && assessment.blocksProposal && assessment.critical.some((c) => c.id === 'guia-produto-e-checkout')) {
  console.error('validate-iniciar-trafego-prestudio-gates: FAIL — Forja ainda bloqueada por Hotmart global');
  process.exit(1);
}

const r = spawnSync(process.execPath, [resolve(ROOT, 'scripts/iniciar-trafego.mjs'), 'discover', '--json'], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (r.status !== 0) {
  console.error('validate-iniciar-trafego-prestudio-gates: FAIL — discover CLI');
  process.exit(1);
}

console.log('validate-iniciar-trafego-prestudio-gates: PASS');
process.exit(0);
