import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { salvarMeta, lerMeta, anexarEvento, lerEventos, listarRuns } from '../lib/runlog.mjs';

const ID1 = '11111111-1111-1111-1111-111111111111';
const ID2 = '22222222-2222-2222-2222-222222222222';
const dirTemp = () => mkdtempSync(join(tmpdir(), 'painel-log-'));

test('meta salva e lida', () => {
  const dir = dirTemp();
  salvarMeta(dir, { id: ID1, skill: 'a', criadoEm: '2026-01-01T00:00:00Z' });
  assert.equal(lerMeta(dir, ID1).skill, 'a');
  assert.equal(lerMeta(dir, ID2), null);
});

test('eventos são anexados em ordem e linhas corrompidas são ignoradas', () => {
  const dir = dirTemp();
  salvarMeta(dir, { id: ID1, criadoEm: 'x' });
  anexarEvento(dir, ID1, { seq: 0, tipo: 'texto', texto: 'a' });
  anexarEvento(dir, ID1, { seq: 1, tipo: 'texto', texto: 'b' });
  assert.deepEqual(lerEventos(dir, ID1).map((e) => e.texto), ['a', 'b']);
});

test('leitura com id inválido ignora alvo de traversal existente', () => {
  const dir = dirTemp();
  mkdirSync(join(dir, '.painel', 'runs'), { recursive: true });
  // iscas fora de .painel/runs que um id com ../ alcançaria
  writeFileSync(join(dir, '.painel', 'x.meta.json'), JSON.stringify({ id: 'isca' }));
  writeFileSync(join(dir, '.painel', 'x.jsonl'), JSON.stringify({ seq: 0 }) + '\n');
  assert.equal(lerMeta(dir, '../x'), null);
  assert.deepEqual(lerEventos(dir, '../x'), []);
  assert.equal(lerMeta(dir, '../../etc/passwd'), null);
});

test('escrita com id inválido lança e não escreve fora da pasta', () => {
  const dir = dirTemp();
  for (const id of ['../x', '../../x', 'a/b', '', undefined, null, 42, 'x\0y']) {
    assert.throws(() => salvarMeta(dir, { id }), /id/i, `salvarMeta ${String(id)}`);
    assert.throws(() => anexarEvento(dir, id, { seq: 0 }), /id/i, `anexarEvento ${String(id)}`);
  }
  assert.throws(() => salvarMeta(dir, undefined));
  assert.equal(existsSync(join(dir, 'x.meta.json')), false);
  assert.equal(existsSync(join(dir, '.painel', 'x.meta.json')), false);
  assert.equal(existsSync(join(dir, '.painel', 'x.jsonl')), false);
  assert.equal(existsSync(join(dir, 'x.jsonl')), false);
  assert.equal(existsSync(join(dir, '.painel', 'runs', 'undefined.meta.json')), false);
  assert.deepEqual(readdirSync(dir).filter((f) => f !== '.painel'), []);
});

test('.painel ou .painel/runs como symlink para fora é rejeitado', () => {
  const dir = dirTemp();
  const fora = dirTemp();
  symlinkSync(fora, join(dir, '.painel'));
  assert.throws(() => salvarMeta(dir, { id: ID1 }));
  assert.throws(() => anexarEvento(dir, ID1, { seq: 0 }));
  assert.deepEqual(readdirSync(fora), []);
  assert.equal(lerMeta(dir, ID1), null);
  assert.deepEqual(lerEventos(dir, ID1), []);
  assert.deepEqual(listarRuns(dir), []);

  const dir2 = dirTemp();
  const fora2 = dirTemp();
  mkdirSync(join(dir2, '.painel'));
  symlinkSync(fora2, join(dir2, '.painel', 'runs'));
  assert.throws(() => salvarMeta(dir2, { id: ID1 }));
  assert.throws(() => anexarEvento(dir2, ID1, { seq: 0 }));
  assert.deepEqual(readdirSync(fora2), []);
});

test('listarRuns ordena do mais recente para o mais antigo', () => {
  const dir = dirTemp();
  salvarMeta(dir, { id: ID1, criadoEm: '2026-01-01T00:00:00Z' });
  salvarMeta(dir, { id: ID2, criadoEm: '2026-02-01T00:00:00Z' });
  assert.deepEqual(listarRuns(dir).map((m) => m.id), [ID2, ID1]);
});

test('listarRuns sem pasta devolve vazio', () => {
  assert.deepEqual(listarRuns(dirTemp()), []);
});
