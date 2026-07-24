#!/usr/bin/env node
import { discoverProjects } from './lib/iniciar-trafego/project-discovery.mjs';

const result = discoverProjects();
const operational = result.candidates.filter((c) => !c.excluded);
const slugs = operational.map((c) => c.slug).sort();

if (slugs.join(',') !== 'forja,no-azul') {
  console.error(`validate-iniciar-trafego-project-discovery: FAIL — esperava forja,no-azul; recebeu ${slugs.join(',')}`);
  process.exit(1);
}

const sample = result.candidates.find((c) => c.slug === 'academia-fit' || c.exclusionReason);
if (result.candidates.some((c) => c.rootRelative?.includes('mapa-skills-samples') && !c.excluded)) {
  console.error('validate-iniciar-trafego-project-discovery: FAIL — sample nao excluido');
  process.exit(1);
}

console.log('validate-iniciar-trafego-project-discovery: PASS (forja + no-azul; samples excluidos)');
process.exit(0);
