#!/usr/bin/env node
/**
 * Gera entregáveis COMPLETOS — 25 skills — academia-fit
 * Uso: node scripts/gerar-completo-academia-fit.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateAllFiles } from './lib/academia-fit-full-content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJ = join(ROOT, 'projetos/academia-fit');

function loadColeta() {
  const dir = join(PROJ, 'coleta-apify-2026-07');
  const read = (f) => {
    const p = join(dir, f);
    if (!existsSync(p)) return [];
    try {
      return JSON.parse(readFileSync(p, 'utf8')).filter(
        (x) => (x.caption && x.ownerUsername) || x.text
      );
    } catch {
      return [];
    }
  };
  return {
    instagram: read('instagram-posts.json'),
    tiktokPerfis: read('tiktok-perfis.json'),
    tiktokHashtags: read('tiktok-hashtags.json'),
  };
}

mkdirSync(PROJ, { recursive: true });
const coleta = loadColeta();
const files = generateAllFiles({ coleta, date: '07/07/2026' });

let n = 0;
for (const [rel, content] of Object.entries(files)) {
  const dest = join(PROJ, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content, 'utf8');
  n++;
}

console.log(`✓ ${n} arquivos em ${PROJ}`);