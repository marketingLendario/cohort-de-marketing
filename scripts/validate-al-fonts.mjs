#!/usr/bin/env node
/** Falha se woff2 self-hosted não existirem (rodar vendor-al-fonts antes). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FONTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/al/fonts');

const REQUIRED = [
  'jetbrains-mono.woff2',
  'newsreader-latin-300-normal.woff2',
  'newsreader-latin-400-normal.woff2',
  'newsreader-latin-300-italic.woff2',
  'newsreader-latin-400-italic.woff2',
  'hanken-grotesk-latin-400-normal.woff2',
  'hanken-grotesk-latin-500-normal.woff2',
  'hanken-grotesk-latin-600-normal.woff2',
  'hanken-grotesk-latin-700-normal.woff2',
  'hanken-grotesk-latin-800-normal.woff2',
];

let fail = 0;
for (const name of REQUIRED) {
  const p = path.join(FONTS_DIR, name);
  if (!fs.existsSync(p) || fs.statSync(p).size < 500) {
    console.error(`✗ missing: assets/al/fonts/${name}`);
    fail++;
  } else {
    console.log(`✓ ${name}`);
  }
}

if (fail) {
  console.error('\nHALT: node scripts/vendor-al-fonts.mjs');
  process.exit(1);
}
console.log('\nOK: al-fonts');