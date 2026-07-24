#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const text = readFileSync(join(ROOT, 'scripts/iniciar-trafego.mjs'), 'utf8');
if (!text.includes('finalPanelHash')) {
  console.error('validate-panel-hash-post-write-qa4: FAIL — finalPanelHash ausente');
  process.exit(1);
}
if (!text.includes('markPanelWritten(project, finalPanelHash)')) {
  console.error('validate-panel-hash-post-write-qa4: FAIL — markPanelWritten nao usa hash pos-write');
  process.exit(1);
}
console.log('validate-panel-hash-post-write-qa4: PASS');
