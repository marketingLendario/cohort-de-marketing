/**
 * scripts/leitor-metricas.test.mjs — régua por temperatura no Leitor (Story 19.W3.1).
 * Roda com: node --test scripts/leitor-metricas.test.mjs
 *
 * Importar o script NÃO dispara o CLI: main() só roda quando executado direto
 * (guarda import.meta.url === process.argv[1] no final do módulo). Os testes
 * exercitam só as funções puras de decisão — sem tocar a rede.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { reguaPorTipo, avaliarGatilhosFadiga } from './leitor-metricas.mjs';

// ------------------------------------------------- régua por temperatura

test('reguaPorTipo: frio = limiar de frequência 3,0 e sem observação de CPM', () => {
  const r = reguaPorTipo('frio');
  assert.equal(r.tipo, 'frio');
  assert.equal(r.freqAlerta, 3.0);
  assert.equal(r.cpmObservacao, null);
});

test('reguaPorTipo: morno = limiar 6,0; CPM ainda sem selo (só o quente ganha)', () => {
  const r = reguaPorTipo('morno');
  assert.equal(r.tipo, 'morno');
  assert.equal(r.freqAlerta, 6.0);
  assert.equal(r.cpmObservacao, null);
});

test('reguaPorTipo: quente = limiar 6,0 e CPM "esperado para retargeting"', () => {
  const r = reguaPorTipo('quente');
  assert.equal(r.freqAlerta, 6.0);
  assert.match(r.cpmObservacao, /esperado para retargeting/);
});

test('reguaPorTipo: valor ausente/desconhecido cai para frio (retrocompatível)', () => {
  assert.equal(reguaPorTipo(undefined).tipo, 'frio');
  assert.equal(reguaPorTipo('xyz').tipo, 'frio');
  assert.equal(reguaPorTipo('').tipo, 'frio');
});

// --------------------------- alerta de frequência: mesma série, réguas distintas

const METRICAS_FREQ_45 = { quedaPct: null, picoCtr: null, ctrRecente: null, freqMax: 4.5, idadeDias: 2 };

test('fadiga: frequência 4,5 dispara alerta no frio (limiar 3,0)', () => {
  const g = avaliarGatilhosFadiga(METRICAS_FREQ_45, reguaPorTipo('frio'));
  assert.ok(g.some((x) => /frequência 4\.5 > 3/.test(x)), g.join(' | '));
});

test('fadiga: mesma frequência 4,5 fica OK no quente (limiar 6,0)', () => {
  const g = avaliarGatilhosFadiga(METRICAS_FREQ_45, reguaPorTipo('quente'));
  assert.equal(g.length, 0, g.join(' | '));
});

test('fadiga: frequência 4,5 também fica OK no morno (limiar 6,0)', () => {
  const g = avaliarGatilhosFadiga(METRICAS_FREQ_45, reguaPorTipo('morno'));
  assert.equal(g.length, 0, g.join(' | '));
});

test('fadiga: frequência 7 dispara em qualquer régua', () => {
  const m = { ...METRICAS_FREQ_45, freqMax: 7 };
  assert.ok(avaliarGatilhosFadiga(m, reguaPorTipo('frio')).some((x) => /frequência 7/.test(x)));
  assert.ok(avaliarGatilhosFadiga(m, reguaPorTipo('quente')).some((x) => /frequência 7/.test(x)));
});

test('fadiga: régua NÃO mexe nos gatilhos de CTR e idade (contrato v1 intacto)', () => {
  const m = { quedaPct: 0.30, picoCtr: 2.0, ctrRecente: 1.4, freqMax: 1.0, idadeDias: 20 };
  const frio = avaliarGatilhosFadiga(m, reguaPorTipo('frio'));
  const quente = avaliarGatilhosFadiga(m, reguaPorTipo('quente'));
  assert.ok(frio.some((x) => /CTR caiu/.test(x)));
  assert.ok(frio.some((x) => /20 dias/.test(x)));
  assert.deepEqual(frio, quente, 'CTR e idade independem da temperatura');
});
