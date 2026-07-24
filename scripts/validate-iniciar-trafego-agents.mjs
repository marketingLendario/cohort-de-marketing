#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd());
const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8');
if (!agents.includes('iniciar-trafego')) {
  console.error('AGENTS.md missing iniciar-trafego');
  process.exit(1);
}
console.log('OK: AGENTS.md lists iniciar-trafego');
