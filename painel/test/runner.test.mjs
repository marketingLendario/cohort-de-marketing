import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunManager, ErroRequisicao, montarPrompt } from '../lib/runner.mjs';
import { lerEventos } from '../lib/runlog.mjs';
import { projetoDir } from '../lib/projetos.mjs';
import { criarRepo, esperar, novoManager } from './helpers.mjs';

const estadoDe = (m, id) => m.obter(id)?.estado;
const textos = (m, id) => m.eventos(id).filter((e) => e.tipo === 'texto').map((e) => e.texto);

test('montarPrompt inclui skill, args e projeto ativo', () => {
  assert.equal(montarPrompt('avatar-funil', 'demo', 'nicho X'),
    '/avatar-funil nicho X\n\nProjeto ativo: projetos/demo');
  assert.equal(montarPrompt('avatar-funil', 'demo'),
    '/avatar-funil Projeto ativo: projetos/demo');
});

test('run simples chega a concluido e grava log em disco', async () => {
  const repo = criarRepo();
  const m = novoManager(RunManager, repo);
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  await esperar(() => estadoDe(m, id) === 'concluido');
  const meta = m.obter(id);
  assert.equal(meta.sessionId, 'sess-123');
  assert.equal(meta.custoUsd, 0.01);
  assert.ok(meta.finalizadoEm);
  assert.match(textos(m, id)[0], /rodando \/avatar-funil/);
  assert.equal(lerEventos(projetoDir(repo, 'demo'), id).length, m.eventos(id).length);
});

test('pergunta leva a aguardando_resposta; responder continua com --resume', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[pergunta]' });
  await esperar(() => estadoDe(m, id) === 'aguardando_resposta');
  assert.equal(m.obter(id).perguntaPendente[0].question, 'Qual nicho?');
  m.responder(id, 'B');
  await esperar(() => estadoDe(m, id) === 'concluido');
  assert.ok(textos(m, id).includes('retomado sess-123: B'));
  assert.equal(m.obter(id).perguntaPendente, null);
});

test('responder durante execução é recusado (409)', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m, id) === 'executando');
  await esperar(() => m.obter(id).sessionId);
  assert.throws(() => m.responder(id, 'oi'), (e) => e instanceof ErroRequisicao && e.status === 409);
  m.cancelar(id);
  await esperar(() => estadoDe(m, id) === 'cancelado');
});

test('falha do processo vira estado erro com a mensagem do stderr', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[erro]' });
  await esperar(() => estadoDe(m, id) === 'erro');
  assert.match(m.obter(id).erro, /falha simulada/);
});

test('binário inexistente vira erro, não exceção', async () => {
  const m = new RunManager({ repoRoot: criarRepo(), claudeBin: '/nao/existe/claude' });
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  await esperar(() => estadoDe(m, id) === 'erro');
  assert.ok(m.obter(id).erro);
});

test('cancelar mata o processo em execução', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m, id) === 'executando');
  m.cancelar(id);
  await esperar(() => estadoDe(m, id) === 'cancelado');
});

test('fila por projeto: segundo run espera o primeiro', async () => {
  const m = novoManager(RunManager, criarRepo());
  const a = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m, a.id) === 'executando');
  const b = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  assert.equal(estadoDe(m, b.id), 'na_fila');
  m.cancelar(a.id);
  await esperar(() => estadoDe(m, b.id) === 'concluido');
});

test('cancelar um run que está na fila', async () => {
  const m = novoManager(RunManager, criarRepo());
  const a = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m, a.id) === 'executando');
  const b = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  m.cancelar(b.id);
  assert.equal(estadoDe(m, b.id), 'cancelado');
  m.cancelar(a.id);
  await esperar(() => estadoDe(m, a.id) === 'cancelado');
});

test('validação: skill desconhecida e projeto inválido', () => {
  const m = novoManager(RunManager, criarRepo());
  assert.throws(() => m.iniciar({ skill: 'nao-existe', slug: 'demo' }), ErroRequisicao);
  assert.throws(() => m.iniciar({ skill: '../x', slug: 'demo' }), ErroRequisicao);
  assert.throws(() => m.iniciar({ skill: 'avatar-funil', slug: '../demo' }), ErroRequisicao);
});

test('assinar recebe eventos novos e cancela a assinatura', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  const vistos = [];
  const cancelar = m.assinar(id, (e) => vistos.push(e.tipo));
  await esperar(() => estadoDe(m, id) === 'concluido');
  cancelar();
  assert.ok(vistos.includes('resultado'));
});

test('recupera run do disco; run que estava executando vira erro', async () => {
  const repo = criarRepo();
  const m1 = novoManager(RunManager, repo);
  const { id } = m1.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m1, id) === 'executando');
  const m2 = novoManager(RunManager, repo);
  assert.equal(m2.obter(id).estado, 'erro');
  assert.match(m2.obter(id).erro, /reiniciado/);
  assert.ok(m2.eventos(id).length > 0);
  m1.cancelar(id);
  await esperar(() => estadoDe(m1, id) === 'cancelado');
});

test('listar devolve os runs do projeto', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  await esperar(() => estadoDe(m, id) === 'concluido');
  assert.deepEqual(m.listar('demo').map((r) => r.id), [id]);
});
