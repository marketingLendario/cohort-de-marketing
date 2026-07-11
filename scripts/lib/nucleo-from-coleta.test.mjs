#!/usr/bin/env node
import { readFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildAvatarFromColeta } from './nucleo-from-coleta.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../..');
const FIXTURE = join(HERE, 'fixtures/coleta-avatar.txt');
const coletaText = readFileSync(FIXTURE, 'utf8');
const anchor = 'https://www.google.com/search?q=site%3Areddit.com+emagrecimento+efeito+sanfona';

const tmp = join(HERE, '.test-out');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(join(tmp, 'pesquisa-avatar-2026-07'), { recursive: true });
import { writeFileSync } from 'fs';
writeFileSync(join(tmp, 'pesquisa-avatar-2026-07/coleta-roteiro.txt'), coletaText);

const result = buildAvatarFromColeta({
  proj: tmp,
  nicho: 'teste',
  date: '07/07/2026',
  coletaPath: join(tmp, 'pesquisa-avatar-2026-07/coleta-roteiro.txt'),
  tplPath: join(ROOT, '.claude/skills/avatar-funil/templates/relatorio.html'),
});

const md = result.files['relatorio-avatar.md'];
let failed = 0;
if (!md.includes(anchor)) {
  console.error('FALHOU: relatorio-avatar.md não contém URL do fixture');
  failed++;
} else console.log('✓ relatorio contém URL do fixture coleta');
if (!md.includes('reddit')) {
  console.error('FALHOU: relatorio não contém label reddit');
  failed++;
} else console.log('✓ relatorio contém label reddit');

process.exit(failed ? 1 : 0);