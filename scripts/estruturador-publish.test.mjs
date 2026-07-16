/**
 * scripts/estruturador-publish.test.mjs — guardrails do kit v2 (morno/quente) e
 * retrocompatibilidade do frio, tudo SEM rede (fetcher de públicos mockado).
 * Roda com: node --test scripts/estruturador-publish.test.mjs
 *
 * Importar o script NÃO dispara o CLI: main() só roda quando executado direto
 * (guarda import.meta.url === process.argv[1] no final do módulo).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validarPlano, montarTargeting, validarPublicosAoVivo } from './estruturador-publish.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const fx = (nome) => JSON.parse(readFileSync(join(HERE, 'fixtures', nome), 'utf8'));

const TEST_ENV = { META_PIXEL_ID: '111', META_FACEBOOK_PAGE_ID: '222' };
const HOJE = new Date('2026-07-15T00:00:00Z');
const TU_FRESCO = Math.floor(HOJE.getTime() / 1000) - 10 * 86_400;   // fresco (< 90d)
const TU_VELHO = Math.floor(HOJE.getTime() / 1000) - 200 * 86_400;   // velho (> 90d)

// Fetcher mockado: id → público. Espelha os casos reais da conta (plano v2).
const REGISTRY = {
  '900000000000001': { id: '900000000000001', name: 'Vídeo View 3s - Distribuição', subtype: 'ENGAGEMENT', approximate_count_lower_bound: 215600, approximate_count_upper_bound: 253700, operation_status: { code: 200 }, delivery_status: { code: 200 }, time_updated: TU_FRESCO },
  '900000000000009': { id: '900000000000009', name: 'Compradores 180d', subtype: 'CUSTOM', approximate_count_lower_bound: 5000, approximate_count_upper_bound: 5000, operation_status: { code: 200 }, delivery_status: { code: 200 }, time_updated: TU_FRESCO },
  '900000000000002': { id: '900000000000002', name: 'Vídeo View - populando', subtype: 'ENGAGEMENT', approximate_count_lower_bound: 3800, approximate_count_upper_bound: 4400, operation_status: { code: 441, description: 'This audience is too small' }, delivery_status: { code: 200 }, time_updated: TU_FRESCO },
  '900000000000003': { id: '900000000000003', name: '[SA] InitiateCheckout 30D menos Purchase', subtype: 'WEBSITE', approximate_count_lower_bound: 20, approximate_count_upper_bound: 20, operation_status: { code: 200 }, delivery_status: { code: 200 }, time_updated: TU_FRESCO },
};
const fetcherMock = async (id) =>
  (REGISTRY[id] ? { ok: true, data: REGISTRY[id] } : { ok: false, code: 100, message: 'público não existe' });

// --------------------------------------------- 7 recusas (gate do epic)

// 4 recusas locais (validarPlano, sem rede)

test('recusa local: quente sem exclusão', () => {
  const { erros } = validarPlano(fx('campanha-recusa-quente-sem-exclusao.json'), TEST_ENV);
  assert.ok(erros.some((e) => /quente".*exige exclusoes/.test(e)), erros.join(' | '));
});

test('recusa local: frio com custom_audiences', () => {
  const { erros } = validarPlano(fx('campanha-recusa-frio-com-custom.json'), TEST_ENV);
  assert.ok(erros.some((e) => /custom_audiences só valem para/.test(e)), erros.join(' | '));
});

test('recusa local: interesse guarda-chuva junto de retargeting', () => {
  const { erros } = validarPlano(fx('campanha-recusa-interesse-retargeting.json'), TEST_ENV);
  assert.ok(erros.some((e) => /interesse_guarda_chuva não vale em morno\/quente/.test(e)), erros.join(' | '));
});

test('recusa local: verba acima do teto R$100 em morno/quente', () => {
  const { erros } = validarPlano(fx('campanha-recusa-verba-acima-teto.json'), TEST_ENV);
  assert.ok(erros.some((e) => /teto de R\$100\/dia/.test(e)), erros.join(' | '));
});

// 3 recusas ao vivo (fetcher mockado; plano em si é válido)

test('recusa ao vivo: público inexistente na conta', async () => {
  const { plano: p, erros } = validarPlano(fx('campanha-recusa-publico-inexistente.json'), TEST_ENV);
  assert.equal(erros.length, 0, `plano deveria ser válido: ${erros.join(' | ')}`);
  const { erros: live } = await validarPublicosAoVivo(p.publico, fetcherMock, HOJE);
  assert.ok(live.some((e) => /não existe nesta conta/.test(e)), live.join(' | '));
});

test('recusa ao vivo: operation_status != 200', async () => {
  const { plano: p, erros } = validarPlano(fx('campanha-recusa-op-nao-200.json'), TEST_ENV);
  assert.equal(erros.length, 0, `plano deveria ser válido: ${erros.join(' | ')}`);
  const { erros: live } = await validarPublicosAoVivo(p.publico, fetcherMock, HOJE);
  assert.ok(live.some((e) => /operation_status 441/.test(e)), live.join(' | '));
});

test('recusa ao vivo: bound 20 (contagem oculta pela Meta)', async () => {
  const { plano: p, erros } = validarPlano(fx('campanha-recusa-bound-oculto.json'), TEST_ENV);
  assert.equal(erros.length, 0, `plano deveria ser válido: ${erros.join(' | ')}`);
  const { erros: live } = await validarPublicosAoVivo(p.publico, fetcherMock, HOJE);
  assert.ok(live.some((e) => /oculta pela Meta/.test(e)), live.join(' | '));
});

// ------------------------------------------------- 2 aceitações

test('aceita: morno válido — hard audience, sem exclusão, sem flexible_spec', async () => {
  const { plano: p, erros } = validarPlano(fx('campanha-morno-valido.json'), TEST_ENV);
  assert.equal(erros.length, 0, erros.join(' | '));
  const { erros: live, warnings } = await validarPublicosAoVivo(p.publico, fetcherMock, HOJE);
  assert.equal(live.length, 0, live.join(' | '));
  assert.equal(warnings.length, 0, warnings.join(' | '));
  const t = montarTargeting(p);
  assert.equal(t.targeting_automation.advantage_audience, 0);
  assert.deepEqual(t.custom_audiences, [{ id: '900000000000001' }]);
  assert.equal(t.excluded_custom_audiences, undefined);
  assert.equal(t.flexible_spec, undefined);
});

test('aceita: quente válido — custom + excluded + advantage 0, sem flexible_spec', async () => {
  const { plano: p, erros } = validarPlano(fx('campanha-quente-valido.json'), TEST_ENV);
  assert.equal(erros.length, 0, erros.join(' | '));
  const { erros: live } = await validarPublicosAoVivo(p.publico, fetcherMock, HOJE);
  assert.equal(live.length, 0, live.join(' | '));
  const t = montarTargeting(p);
  assert.equal(t.targeting_automation.advantage_audience, 0);
  assert.deepEqual(t.custom_audiences, [{ id: '900000000000001' }]);
  assert.deepEqual(t.excluded_custom_audiences, [{ id: '900000000000009' }]);
  assert.equal(t.flexible_spec, undefined);
});

// ------------------------------------------ retrocompatibilidade v1

test('retrocompat: v1 sem bloco publico → aceito e targeting idêntico ao v1', () => {
  const { plano: p, erros } = validarPlano(fx('campanha-v1-frio.json'), TEST_ENV);
  assert.equal(erros.length, 0, erros.join(' | '));
  assert.equal(p.publico.tipo, 'frio');
  const t = montarTargeting(p);
  // objeto que o código v1 gerava, literalmente
  assert.deepEqual(t, {
    geo_locations: { countries: ['BR'] },
    targeting_automation: { advantage_audience: 1 },
  });
});

test('retrocompat: frio + interesse guarda-chuva mantém flexible_spec do v1', () => {
  const plano = { ...fx('campanha-v1-frio.json'), interesse_guarda_chuva: { id: '6003', name: 'Fitness' } };
  const { plano: p, erros } = validarPlano(plano, TEST_ENV);
  assert.equal(erros.length, 0, erros.join(' | '));
  const t = montarTargeting(p);
  assert.deepEqual(t, {
    geo_locations: { countries: ['BR'] },
    targeting_automation: { advantage_audience: 1 },
    flexible_spec: [{ interests: [{ id: '6003', name: 'Fitness' }] }],
  });
});

// ------------------------------------------- guardrails extras

test('validação ao vivo: público velho > 90d é warning, não recusa', async () => {
  const publico = {
    tipo: 'quente',
    custom_audiences: [{ id: 'x1', name: 'Lista antiga' }],
    exclusoes: [{ id: 'x2', name: 'Compradores' }],
  };
  const fetcher = async (id) => ({
    ok: true,
    data: { id, name: `Aud ${id}`, subtype: 'CUSTOM', approximate_count_lower_bound: 5000, approximate_count_upper_bound: 5000, operation_status: { code: 200 }, delivery_status: { code: 200 }, time_updated: TU_VELHO },
  });
  const { erros, warnings } = await validarPublicosAoVivo(publico, fetcher, HOJE);
  assert.equal(erros.length, 0, erros.join(' | '));
  assert.equal(warnings.length, 2);
  assert.ok(warnings.every((w) => /segue elegível/.test(w)));
});

test('validação ao vivo: frio não toca a rede', async () => {
  let chamou = false;
  const fetcher = async () => { chamou = true; return { ok: true, data: {} }; };
  const r = await validarPublicosAoVivo({ tipo: 'frio', custom_audiences: [], exclusoes: [] }, fetcher, HOJE);
  assert.equal(r.erros.length, 0);
  assert.equal(r.warnings.length, 0);
  assert.equal(chamou, false, 'frio não deve chamar o fetcher');
});

test('recusa local: mais de 3 públicos incluídos', () => {
  const plano = fx('campanha-morno-valido.json');
  plano.publico.custom_audiences = ['a', 'b', 'c', 'd'].map((n) => ({ id: `id-${n}`, name: `Público ${n}` }));
  const { erros } = validarPlano(plano, TEST_ENV);
  assert.ok(erros.some((e) => /máximo 3 incluídos/.test(e)), erros.join(' | '));
});

test('recusa local: nome morno/quente sem a temperatura no nome', () => {
  const plano = fx('campanha-morno-valido.json');
  plano.nome = '[COHORT1]_projeto-fit_2026-07-15';
  const { erros } = validarPlano(plano, TEST_ENV);
  assert.ok(erros.some((e) => /precisa carregar a temperatura/.test(e)), erros.join(' | '));
});

test('piso R$20 e teto R$200 do frio seguem inalterados (guardrail v1)', () => {
  const base = fx('campanha-v1-frio.json');
  const abaixoDoPiso = validarPlano({ ...base, verba_diaria_reais: 15 }, TEST_ENV);
  assert.ok(abaixoDoPiso.erros.some((e) => /abaixo do piso de R\$20/.test(e)));
  const acimaDoTeto = validarPlano({ ...base, verba_diaria_reais: 250 }, TEST_ENV);
  assert.ok(acimaDoTeto.erros.some((e) => /teto de segurança de R\$200/.test(e)));
  // R$150 é válido no frio (só estoura o teto de morno/quente)
  const frioAlto = validarPlano({ ...base, verba_diaria_reais: 150 }, TEST_ENV);
  assert.equal(frioAlto.erros.length, 0, frioAlto.erros.join(' | '));
});
