#!/usr/bin/env node
import { resolve } from 'node:path';
import { assessProject } from './lib/iniciar-trafego-gates.mjs';
import { resolveArtifactBindings } from './lib/iniciar-trafego/artifact-resolution.mjs';

const ROOT = process.cwd();
const forja = resolve(ROOT, 'projetos/forja');
const noAzul = resolve(ROOT, 'projetos/no-azul');

const forjaBindings = resolveArtifactBindings(forja);
const noAzulBindings = resolveArtifactBindings(noAzul);

if (forjaBindings.bindings.avatar?.status !== 'bound') {
  console.error('validate-iniciar-trafego-real-project-shapes: FAIL — Forja avatar nao bound');
  process.exit(1);
}
if (noAzulBindings.bindings.avatar?.status !== 'bound') {
  console.error('validate-iniciar-trafego-real-project-shapes: FAIL — No Azul avatar nao bound');
  process.exit(1);
}
if (noAzulBindings.bindings.offerbook?.status !== 'bound') {
  console.error('validate-iniciar-trafego-real-project-shapes: FAIL — No Azul offerbook nao bound');
  process.exit(1);
}

const forjaAssessment = assessProject(forja, ROOT);
const noAzulAssessment = assessProject(noAzul, ROOT);

if (forjaAssessment.conversionMode !== 'application_call') {
  console.error(`validate-iniciar-trafego-real-project-shapes: FAIL — Forja conversionMode=${forjaAssessment.conversionMode}`);
  process.exit(1);
}
if (noAzulAssessment.conversionMode !== 'direct_checkout') {
  console.error(`validate-iniciar-trafego-real-project-shapes: FAIL — No Azul conversionMode=${noAzulAssessment.conversionMode}`);
  process.exit(1);
}

if (forjaAssessment.publishedUrl.includes('fonts.googleapis.com')) {
  console.error('validate-iniciar-trafego-real-project-shapes: FAIL — Forja publishedUrl falso positivo fonts');
  process.exit(1);
}
if (forjaAssessment.pixelOk) {
  console.error('validate-iniciar-trafego-real-project-shapes: FAIL — Forja pixelOk falso positivo placeholder');
  process.exit(1);
}

console.log('validate-iniciar-trafego-real-project-shapes: PASS (bindings + conversionMode + anti-falso-positivo)');
process.exit(0);
