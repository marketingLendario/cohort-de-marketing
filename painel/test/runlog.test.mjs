import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
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

test('id inválido não toca o disco', () => {
  const dir = dirTemp();
  assert.equal(lerMeta(dir, '../../etc/passwd'), null);
  assert.deepEqual(lerEventos(dir, '../../etc/passwd'), []);
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
