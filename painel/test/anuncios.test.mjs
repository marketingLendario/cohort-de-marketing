import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resumoAnuncios } from '../lib/anuncios.mjs';

const AMOSTRA = join(dirname(fileURLToPath(import.meta.url)), '..', '..',
  'mapa-skills-samples', 'academia-fit', 'dados-trafego');

function projetoComAmostra({ board = true, painel = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'painel-anuncios-'));
  mkdirSync(join(dir, 'dados-trafego'));
  copyFileSync(join(AMOSTRA, 'bundle.json'), join(dir, 'dados-trafego', 'bundle.json'));
  if (board) copyFileSync(join(AMOSTRA, 'board.json'), join(dir, 'dados-trafego', 'board.json'));
  if (painel) writeFileSync(join(dir, 'painel-trafego.html'), '<h1>Painel</h1>');
  return dir;
}

test('sem bundle, avisa que a conta ainda não foi analisada', () => {
  const r = resumoAnuncios(mkdtempSync(join(tmpdir(), 'painel-vazio-')));
  assert.deepEqual(r, { disponivel: false });
});

test('bundle ilegível vira aviso, não exceção', () => {
  const dir = mkdtempSync(join(tmpdir(), 'painel-ruim-'));
  mkdirSync(join(dir, 'dados-trafego'));
  writeFileSync(join(dir, 'dados-trafego', 'bundle.json'), '{ nao e json');
  const r = resumoAnuncios(dir);
  assert.equal(r.disponivel, false);
  assert.match(r.erro, /não foi possível ler/i);
});

test('totais, série diária e comparação saem do bundle', () => {
  const r = resumoAnuncios(projetoComAmostra());
  assert.equal(r.disponivel, true);
  assert.equal(r.modo, 'exemplo');
  assert.match(r.escopo, /Academia Fit/);
  assert.equal(r.serie.length, 30);
  assert.deepEqual(Object.keys(r.serie[0]), ['data', 'investimento', 'compras']);
  const soma = r.serie.reduce((s, d) => s + d.investimento, 0);
  assert.equal(r.totais.investimento, Math.round(soma * 100) / 100);
  assert.ok(r.totais.compras > 0);
  assert.equal(r.totais.custoPorCompra, Math.round((r.totais.investimento / r.totais.compras) * 100) / 100);
  assert.ok(r.totais.ctr > 0 && r.totais.ctr < 10);
  assert.equal(r.comparacao.rotulo, 'última quinzena vs. quinzena anterior');
  assert.equal(r.comparacao.deltas.spend, 90.2);
});

test('campanhas ordenadas por investimento, com custo por compra e ROAS', () => {
  const r = resumoAnuncios(projetoComAmostra());
  assert.equal(r.campanhas.length, 4);
  for (let i = 1; i < r.campanhas.length; i++) {
    assert.ok(r.campanhas[i - 1].investimento >= r.campanhas[i].investimento);
  }
  const c = r.campanhas.find((x) => x.nome === 'TOF · Frio · Advertorial');
  assert.equal(c.investimento, 1420);
  assert.equal(c.compras, 58);
  assert.equal(c.custoPorCompra, Math.round((1420 / 58) * 100) / 100);
  assert.equal(c.roas, 2.9);
  assert.equal(c.ativa, true);
});

test('funil, board de especialistas e painel completo quando existem', () => {
  const r = resumoAnuncios(projetoComAmostra());
  assert.deepEqual(r.funil.map((e) => e.nome), ['Impressões', 'Cliques no link', 'Landing page view', 'Checkout iniciado', 'Compra']);
  assert.ok(r.especialistas.length >= 1);
  assert.deepEqual(Object.keys(r.especialistas[0]), ['papel', 'titulo', 'alavanca']);
  assert.equal(r.painel, 'painel-trafego.html');
  const sem = resumoAnuncios(projetoComAmostra({ board: false, painel: false }));
  assert.deepEqual(sem.especialistas, []);
  assert.equal(sem.painel, null);
});
