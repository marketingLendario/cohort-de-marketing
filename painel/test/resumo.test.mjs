import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { criarProjeto, slugDoNome, listarProjetos } from '../lib/projetos.mjs';
import { resumoProjeto } from '../lib/resumo.mjs';
import { CaminhoInvalido } from '../lib/paths.mjs';

const repoTemp = () => mkdtempSync(join(tmpdir(), 'painel-resumo-'));

test('slugDoNome tira acentos, espaços e símbolos', () => {
  assert.equal(slugDoNome('Clínica São João'), 'clinica-sao-joao');
  assert.equal(slugDoNome('  Loja  da Ana!! '), 'loja-da-ana');
  assert.equal(slugDoNome('!!!'), '');
});

test('criarProjeto cria a pasta do cliente e recusa duplicado e nome vazio', () => {
  const repo = repoTemp();
  assert.deepEqual(criarProjeto(repo, 'Clínica São João'), { slug: 'clinica-sao-joao' });
  assert.ok(existsSync(join(repo, 'projetos', 'clinica-sao-joao')));
  assert.deepEqual(listarProjetos(repo), [{ slug: 'clinica-sao-joao' }]);
  assert.throws(() => criarProjeto(repo, 'clinica sao joao'), CaminhoInvalido);
  assert.throws(() => criarProjeto(repo, '!!!'), CaminhoInvalido);
  assert.throws(() => criarProjeto(repo, 42), CaminhoInvalido);
});

function projeto() {
  const dir = mkdtempSync(join(tmpdir(), 'painel-proj-'));
  writeFileSync(join(dir, 'avatar.md'), '# Avatar');
  writeFileSync(join(dir, 'avatar.html'), '<h1>Avatar</h1>');
  writeFileSync(join(dir, 'offerbook.md'), '# Oferta');
  mkdirSync(join(dir, 'pagina'));
  writeFileSync(join(dir, 'pagina', 'index.html'), '<h1>Página</h1>');
  mkdirSync(join(dir, 'emails'));
  writeFileSync(join(dir, 'vsl.md'), '# VSL');
  writeFileSync(join(dir, 'index.html'), '<h1>Book</h1>');
  writeFileSync(join(dir, 'pendencias.md'), '- [ ] checkout-link\n- [x] pixel\n- [ ] rosto do especialista\n');
  return dir;
}

const runs = [
  { id: 'a', skill: 'avatar-funil', estado: 'concluido', criadoEm: '2026-11-01T10:00:00Z', custoUsd: 0.5 },
  { id: 'b', skill: 'offerbook', estado: 'erro', criadoEm: '2026-11-02T10:00:00Z', custoUsd: 0.25 },
  { id: 'c', skill: 'avatar-funil', estado: 'concluido', criadoEm: '2026-11-03T10:00:00Z', custoUsd: null },
];

test('resumoProjeto marca as etapas do funil pelo que existe na pasta', () => {
  const r = resumoProjeto(projeto(), runs);
  assert.equal(r.etapas.length, 11);
  const por = Object.fromEntries(r.etapas.map((e) => [e.chave, e]));
  assert.equal(por.avatar.feito, true);
  assert.equal(por.avatar.abrir, 'avatar.html');
  assert.equal(por.oferta.feito, true);
  assert.equal(por.oferta.abrir, 'offerbook.md');
  assert.equal(por.pagina.feito, true);
  assert.equal(por.pagina.abrir, 'pagina/index.html');
  assert.equal(por.emails.feito, false, 'pasta vazia não conta como feita');
  assert.equal(por.design.feito, false);
  assert.equal(r.feitas, 3);
  assert.deepEqual(r.proxima, { chave: 'design', nome: 'Identidade visual', skill: 'design-md' });
});

test('resumoProjeto traz peças extras, Book, pendências e números das execuções', () => {
  const r = resumoProjeto(projeto(), runs);
  assert.deepEqual(r.extras, [{ nome: 'VSL', abrir: 'vsl.md' }]);
  assert.equal(r.book, 'index.html');
  assert.deepEqual(r.pendencias, { abertas: 2, resolvidas: 1, abrir: 'pendencias.md' });
  assert.equal(r.execucoes.total, 3);
  assert.equal(r.execucoes.concluidas, 2);
  assert.equal(r.execucoes.custoUsd, 0.75);
  assert.equal(r.execucoes.ultima, '2026-11-03T10:00:00Z');
  assert.deepEqual(r.skillsUsadas, [
    { skill: 'avatar-funil', vezes: 2, ultima: '2026-11-03T10:00:00Z' },
    { skill: 'offerbook', vezes: 1, ultima: '2026-11-02T10:00:00Z' },
  ]);
});

test('resumoProjeto de cliente novo não quebra', () => {
  const r = resumoProjeto(mkdtempSync(join(tmpdir(), 'painel-vazio-')), []);
  assert.equal(r.feitas, 0);
  assert.equal(r.proxima.skill, 'avatar-funil');
  assert.equal(r.book, null);
  assert.equal(r.pendencias, null);
  assert.deepEqual(r.extras, []);
  assert.deepEqual(r.execucoes, { total: 0, concluidas: 0, custoUsd: 0, ultima: null });
});
