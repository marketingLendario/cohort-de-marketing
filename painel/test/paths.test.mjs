import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveInside, CaminhoInvalido } from '../lib/paths.mjs';

function fixture() {
  const raiz = mkdtempSync(join(tmpdir(), 'painel-paths-'));
  const base = join(raiz, 'base');
  const fora = join(raiz, 'fora');
  mkdirSync(base);
  mkdirSync(fora);
  writeFileSync(join(base, 'ok.txt'), 'ok');
  writeFileSync(join(fora, 'segredo.txt'), 'x');
  return { base, fora };
}

test('aceita arquivo dentro da base', () => {
  const { base } = fixture();
  assert.ok(resolveInside(base, 'ok.txt').endsWith('ok.txt'));
});

test('aceita caminho inexistente dentro da base', () => {
  const { base } = fixture();
  assert.ok(resolveInside(base, 'novo/arquivo.md').endsWith('arquivo.md'));
});

test('rejeita ..', () => {
  const { base } = fixture();
  assert.throws(() => resolveInside(base, '../fora/segredo.txt'), CaminhoInvalido);
});

test('rejeita caminho absoluto', () => {
  const { base, fora } = fixture();
  assert.throws(() => resolveInside(base, join(fora, 'segredo.txt')), CaminhoInvalido);
});

test('rejeita byte nulo', () => {
  const { base } = fixture();
  assert.throws(() => resolveInside(base, 'ok.txt\0.png'), CaminhoInvalido);
});

test('rejeita symlink que escapa da base', () => {
  const { base, fora } = fixture();
  symlinkSync(fora, join(base, 'atalho'));
  assert.throws(() => resolveInside(base, 'atalho/segredo.txt'), CaminhoInvalido);
});
