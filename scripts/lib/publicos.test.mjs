/**
 * scripts/lib/publicos.test.mjs — cobre classificação e elegibilidade sem rede.
 * Roda com: node --test scripts/lib/publicos.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classificarPublico,
  avaliarElegibilidade,
  dataAtualizacao,
  PISO_TAMANHO,
  DIAS_FRESCOR,
} from './publicos.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, '..', 'fixtures', 'publicos-amostra.json');
const { data: amostra } = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const HOJE = new Date('2026-07-15T00:00:00Z');

// Indexa a fixture por id para os testes ficarem legíveis.
const porId = Object.fromEntries(amostra.map((a) => [a.id, a]));
const ENGAGEMENT_SAUDAVEL = porId['1000000000000001'];
const ENGAGEMENT_OP441 = porId['1000000000000002'];
const WEBSITE_BOUND20 = porId['1000000000000003'];
const CUSTOM_LISTA_VELHA = porId['1000000000000004'];
const CUSTOM_LISTA_RECENTE = porId['1000000000000005'];
const LOOKALIKE = porId['1000000000000006'];
const WEBSITE_TOPO = porId['1000000000000007'];

test('fixture tem os 7 casos esperados', () => {
  assert.equal(amostra.length, 7);
  for (const a of amostra) assert.ok(a.id && a.subtype, 'cada público precisa de id e subtype');
});

test('classificação: ENGAGEMENT → morno', () => {
  assert.equal(classificarPublico(ENGAGEMENT_SAUDAVEL).temperatura, 'morno');
  assert.equal(classificarPublico(ENGAGEMENT_OP441).temperatura, 'morno');
});

test('classificação: WEBSITE topo (PageView/visitantes) → morno', () => {
  const c = classificarPublico(WEBSITE_TOPO);
  assert.equal(c.temperatura, 'morno');
  assert.equal(c.posicao_funil, 'topo');
});

test('classificação: WEBSITE fundo (InitiateCheckout/checkout) → quente', () => {
  const c = classificarPublico(WEBSITE_BOUND20);
  assert.equal(c.temperatura, 'quente');
  assert.equal(c.posicao_funil, 'fundo');
});

test('classificação: CUSTOM (lista) → quente', () => {
  assert.equal(classificarPublico(CUSTOM_LISTA_VELHA).temperatura, 'quente');
  assert.equal(classificarPublico(CUSTOM_LISTA_RECENTE).temperatura, 'quente');
});

test('classificação: LOOKALIKE → nao_aplicavel', () => {
  assert.equal(classificarPublico(LOOKALIKE).temperatura, 'nao_aplicavel');
});

test('classificação: subtype desconhecido → nao_aplicavel (não inventa temperatura)', () => {
  assert.equal(classificarPublico({ subtype: 'OFFLINE_CONVERSION', name: 'x' }).temperatura, 'nao_aplicavel');
  assert.equal(classificarPublico({}).temperatura, 'nao_aplicavel');
});

test('elegibilidade: ENGAGEMENT ~215k saudável → elegível', () => {
  const r = avaliarElegibilidade(ENGAGEMENT_SAUDAVEL, HOJE);
  assert.equal(r.elegivel, true);
  assert.equal(r.motivo, null);
});

test('elegibilidade: operation_status 441 → inelegível com o código no motivo', () => {
  const r = avaliarElegibilidade(ENGAGEMENT_OP441, HOJE);
  assert.equal(r.elegivel, false);
  assert.match(r.motivo, /operation_status 441/);
});

test('elegibilidade: bound 20 → inelegível como contagem oculta (não como piso genérico)', () => {
  const r = avaliarElegibilidade(WEBSITE_BOUND20, HOJE);
  assert.equal(r.elegivel, false);
  assert.match(r.motivo, /oculta pela Meta/);
  assert.match(r.motivo, /pequeno/);
});

test('elegibilidade: lista CSV > 90d → inelegível por envelhecimento, com a data', () => {
  const r = avaliarElegibilidade(CUSTOM_LISTA_VELHA, HOJE);
  assert.equal(r.elegivel, false);
  assert.equal(r.tipo_alerta, 'envelhecimento');
  assert.match(r.motivo, /200 dias/); // 2025-12-27 → 2026-07-15 = 200 dias
  assert.match(r.motivo, /2025-12-27/);
});

test('elegibilidade: lista CSV recente ~1000 → elegível', () => {
  const r = avaliarElegibilidade(CUSTOM_LISTA_RECENTE, HOJE);
  assert.equal(r.elegivel, true);
  assert.equal(r.motivo, null);
});

test('elegibilidade: piso genérico (< 1000, != 20) reporta tamanho, não "oculta"', () => {
  const pequeno = { ...ENGAGEMENT_SAUDAVEL, approximate_count_lower_bound: 500 };
  const r = avaliarElegibilidade(pequeno, HOJE);
  assert.equal(r.elegivel, false);
  assert.match(r.motivo, /abaixo do piso/);
  assert.doesNotMatch(r.motivo, /oculta/);
});

test('elegibilidade: delivery_status != 200 → inelegível', () => {
  const semEntrega = { ...ENGAGEMENT_SAUDAVEL, delivery_status: { code: 300, description: 'too small' } };
  const r = avaliarElegibilidade(semEntrega, HOJE);
  assert.equal(r.elegivel, false);
  assert.match(r.motivo, /delivery_status 300/);
});

test('elegibilidade: precedência — operação falha antes de contagem', () => {
  // op441 + bound 20 ao mesmo tempo: o motivo deve ser a operação (mais fundamental)
  const duplo = { ...WEBSITE_BOUND20, operation_status: { code: 441, description: 'too small' } };
  const r = avaliarElegibilidade(duplo, HOJE);
  assert.match(r.motivo, /operation_status 441/);
});

test('frescor: exatamente no limite de 90 dias ainda é elegível', () => {
  const noLimite = {
    ...CUSTOM_LISTA_RECENTE,
    time_updated: Math.floor(HOJE.getTime() / 1000) - DIAS_FRESCOR * 86_400,
  };
  assert.equal(avaliarElegibilidade(noLimite, HOJE).elegivel, true);
});

test('dataAtualizacao: epoch em segundos → YYYY-MM-DD; ausente → null', () => {
  assert.equal(dataAtualizacao(CUSTOM_LISTA_VELHA), '2025-12-27');
  assert.equal(dataAtualizacao({}), null);
});

test('sanidade: PISO_TAMANHO é 1000', () => {
  assert.equal(PISO_TAMANHO, 1000);
});
