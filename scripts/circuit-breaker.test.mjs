/**
 * scripts/circuit-breaker.test.mjs — gatilho v1 intacto + saturação (Story 19.W3.1).
 * Roda com: node --test scripts/circuit-breaker.test.mjs
 *
 * Importar o script NÃO dispara o CLI (guarda import.meta.url === process.argv[1]).
 * Séries usadas como fixtures inline — sem rede.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { avaliarGatilhoV1, avaliarSaturacao } from './circuit-breaker.mjs';

// ------------------------------------------- gatilho v1 (stop condition: inalterado)

test('v1: aciona com gasto >= 2× CPA-alvo E 0 conversões E CTR < 0,5%', () => {
  const r = avaliarGatilhoV1({ gasto: 100, conversoes: 0, ctr: 0.3 }, 50);
  assert.deepEqual(
    { condGasto: r.condGasto, condConv: r.condConv, condCtr: r.condCtr, acionado: r.acionado },
    { condGasto: true, condConv: true, condCtr: true, acionado: true },
  );
});

test('v1: NÃO aciona com 1 conversão (mesmo gasto/CTR ruins)', () => {
  assert.equal(avaliarGatilhoV1({ gasto: 100, conversoes: 1, ctr: 0.3 }, 50).acionado, false);
});

test('v1: NÃO aciona com CTR >= 0,5%', () => {
  assert.equal(avaliarGatilhoV1({ gasto: 100, conversoes: 0, ctr: 0.8 }, 50).acionado, false);
});

test('v1: NÃO aciona abaixo de 2× o CPA-alvo', () => {
  assert.equal(avaliarGatilhoV1({ gasto: 90, conversoes: 0, ctr: 0.3 }, 50).acionado, false);
});

// ------------------------------------------------- saturação: só morno/quente

test('saturação: no frio nunca aplica nem aciona (default v1 puro)', () => {
  const r = avaliarSaturacao({ frequencia7d: 20, serieDiaria: [] }, 'frio');
  assert.equal(r.aplica, false);
  assert.equal(r.acionado, false);
  assert.equal(r.motivo, null);
});

test('saturação: quente com frequência >= 8 aciona com motivo saturacao_publico', () => {
  const r = avaliarSaturacao({ frequencia7d: 8.2, serieDiaria: [] }, 'quente');
  assert.equal(r.aplica, true);
  assert.equal(r.acionado, true);
  assert.equal(r.motivo, 'saturacao_publico');
  assert.equal(r.condicoes['frequência >= 8 em 7d'], true);
});

test('saturação: quente com frequência < 8 e série saudável não aciona', () => {
  const serie = [
    { date: '2026-07-09', impressions: 1000, spend: 20 },
    { date: '2026-07-10', impressions: 980, spend: 20 },
    { date: '2026-07-11', impressions: 1010, spend: 20 },
    { date: '2026-07-12', impressions: 990, spend: 20 },
    { date: '2026-07-13', impressions: 1005, spend: 20 },
    { date: '2026-07-14', impressions: 995, spend: 20 },
  ];
  const r = avaliarSaturacao({ frequencia7d: 3.5, serieDiaria: serie }, 'quente');
  assert.equal(r.acionado, false);
  assert.equal(r.motivo, null);
});

test('saturação: quente com impressões diárias caindo > 50% e verba constante aciona por estagnação', () => {
  const serie = [
    { date: '2026-07-09', impressions: 1000, spend: 20 },
    { date: '2026-07-10', impressions: 950, spend: 20 },
    { date: '2026-07-11', impressions: 900, spend: 20 },
    { date: '2026-07-12', impressions: 400, spend: 20 },
    { date: '2026-07-13', impressions: 350, spend: 20 },
    { date: '2026-07-14', impressions: 300, spend: 20 },
  ];
  const r = avaliarSaturacao({ frequencia7d: 4.0, serieDiaria: serie }, 'morno');
  assert.equal(r.acionado, true);
  assert.equal(r.motivo, 'saturacao_publico');
  assert.equal(r.estagnacao_nao_avaliavel, null);
  assert.ok(r.estagnacao.queda_impressoes > 0.5, JSON.stringify(r.estagnacao));
});

test('saturação: verba que variou torna a estagnação NÃO avaliável (honestidade)', () => {
  const serie = [
    { date: '2026-07-09', impressions: 1000, spend: 20 },
    { date: '2026-07-10', impressions: 900, spend: 20 },
    { date: '2026-07-11', impressions: 800, spend: 20 },
    { date: '2026-07-12', impressions: 400, spend: 40 },
    { date: '2026-07-13', impressions: 350, spend: 40 },
    { date: '2026-07-14', impressions: 300, spend: 40 },
  ];
  const r = avaliarSaturacao({ frequencia7d: 4.0, serieDiaria: serie }, 'quente');
  assert.equal(r.acionado, false, 'não pode culpar saturação quando a verba mudou');
  assert.match(r.estagnacao_nao_avaliavel, /verba variou/);
  assert.equal('entrega estagnada (impressões diárias caindo > 50% com verba constante)' in r.condicoes, false);
});

test('saturação: série diária curta (< 4 dias) cai só no ramo de frequência e documenta', () => {
  const serie = [
    { date: '2026-07-13', impressions: 1000, spend: 20 },
    { date: '2026-07-14', impressions: 300, spend: 20 },
  ];
  const r = avaliarSaturacao({ frequencia7d: 4.0, serieDiaria: serie }, 'quente');
  assert.equal(r.acionado, false);
  assert.match(r.estagnacao_nao_avaliavel, /insuficiente para avaliar estagnação/);
});
