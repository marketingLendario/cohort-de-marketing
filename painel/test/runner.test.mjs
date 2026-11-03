import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunManager, ErroRequisicao, montarPrompt } from '../lib/runner.mjs';
import { lerEventos } from '../lib/runlog.mjs';
import { projetoDir } from '../lib/projetos.mjs';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { criarRepo, esperar, novoManager, FAKE } from './helpers.mjs';

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

// ---- correcoes da revisao da Task 5 ----

const chamadas = (repo) => {
  const arq = join(repo, 'fake-calls.jsonl');
  if (!existsSync(arq)) return [];
  return readFileSync(arq, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
};
const vivo = (pid) => {
  try { process.kill(pid, 0); return true; } catch { return false; }
};

test('ouvinte que lança não derruba o run, é removido e a fila segue', async () => {
  const m = novoManager(RunManager, criarRepo());
  const a = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  let chamadasOuvinte = 0;
  m.assinar(a.id, () => { chamadasOuvinte++; throw new Error('socket fechado'); });
  const b = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  await esperar(() => estadoDe(m, a.id) === 'concluido');
  await esperar(() => estadoDe(m, b.id) === 'concluido');
  assert.equal(chamadasOuvinte, 1);
});

test('falha de escrita em disco não trava a fila do projeto', async () => {
  const repo = criarRepo();
  const m = novoManager(RunManager, repo);
  const a = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m, a.id) === 'executando');
  const runs = join(projetoDir(repo, 'demo'), '.painel', 'runs');
  rmSync(runs, { recursive: true, force: true });
  writeFileSync(runs, 'arquivo no lugar da pasta');
  const b = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  m.cancelar(a.id);
  await esperar(() => estadoDe(m, a.id) === 'cancelado');
  await esperar(() => estadoDe(m, b.id) === 'concluido');
});

test('resposta que começa com hífen vai como argumento posicional após "--"', async () => {
  const repo = criarRepo();
  const m = novoManager(RunManager, repo);
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[pergunta]' });
  await esperar(() => estadoDe(m, id) === 'aguardando_resposta');
  m.responder(id, '--dangerously-skip-permissions');
  await esperar(() => estadoDe(m, id) === 'concluido');
  const [primeira, segunda] = chamadas(repo).map((c) => c.argv);
  assert.ok(primeira.includes('--permission-mode'));
  assert.equal(primeira[primeira.indexOf('--permission-mode') + 1], 'acceptEdits');
  assert.ok(primeira.includes('--allowedTools'));
  assert.ok(!primeira.includes('--resume'));
  const sep = segunda.indexOf('--');
  assert.ok(sep >= 0);
  assert.deepEqual(segunda.slice(sep), ['--', '--dangerously-skip-permissions']);
  assert.equal(segunda[segunda.indexOf('--resume') + 1], 'sess-123');
  assert.equal(segunda.filter((a) => a === '--dangerously-skip-permissions').length, 1);
});

test('projetos diferentes executam em paralelo', async () => {
  const repo = criarRepo();
  mkdirSync(join(repo, 'projetos', 'outro'), { recursive: true });
  const m = novoManager(RunManager, repo);
  const a = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  const b = m.iniciar({ skill: 'avatar-funil', slug: 'outro', args: '[lento]' });
  await esperar(() => estadoDe(m, a.id) === 'executando' && estadoDe(m, b.id) === 'executando');
  m.cancelar(a.id);
  m.cancelar(b.id);
  await esperar(() => estadoDe(m, a.id) === 'cancelado' && estadoDe(m, b.id) === 'cancelado');
});

test('cancelar a assinatura interrompe a entrega de eventos', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m, id) === 'executando');
  const vistos = [];
  const parar = m.assinar(id, (e) => vistos.push(e));
  parar();
  m.cancelar(id);
  await esperar(() => estadoDe(m, id) === 'cancelado');
  assert.equal(vistos.length, 0);
});

test('cancelar realmente mata o processo (pid some)', async () => {
  const repo = criarRepo();
  const m = novoManager(RunManager, repo);
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => chamadas(repo).length === 1);
  const { pid } = chamadas(repo)[0];
  assert.ok(vivo(pid));
  m.cancelar(id);
  await esperar(() => estadoDe(m, id) === 'cancelado');
  await esperar(() => !vivo(pid));
});

test('cancelar mata também os subprocessos (grupo de processos)', async () => {
  const repo = criarRepo();
  const m = novoManager(RunManager, repo);
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[neto]' });
  await esperar(() => chamadas(repo).length === 1);
  const { neto } = chamadas(repo)[0];
  try {
    assert.ok(vivo(neto));
    m.cancelar(id);
    await esperar(() => estadoDe(m, id) === 'cancelado');
    await esperar(() => !vivo(neto), 3000);
  } finally {
    try { process.kill(neto, 'SIGKILL'); } catch { /* ja morto */ }
  }
});

test('claude que ignora SIGTERM é encerrado por SIGKILL e libera a fila', async () => {
  const repo = criarRepo();
  const m = new RunManager({
    repoRoot: repo, claudeBin: process.execPath, claudeBaseArgs: [FAKE], killGraceMs: 150,
  });
  const a = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[teimoso]' });
  await esperar(() => chamadas(repo).length === 1);
  const { pid } = chamadas(repo)[0];
  const b = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  m.cancelar(a.id);
  await esperar(() => estadoDe(m, a.id) === 'cancelado');
  assert.ok(!vivo(pid));
  await esperar(() => estadoDe(m, b.id) === 'concluido');
});

test('run recuperado do disco não deixa a fila do projeto presa', async () => {
  const repo = criarRepo();
  const m1 = novoManager(RunManager, repo);
  const { id } = m1.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m1, id) === 'executando');
  const m2 = novoManager(RunManager, repo);
  assert.equal(m2.obter(id).estado, 'erro');
  const novo = m2.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  await esperar(() => estadoDe(m2, novo.id) === 'concluido');
  m1.cancelar(id);
  await esperar(() => estadoDe(m1, id) === 'cancelado');
});

test('encerrarTodos cancela runs ativos e da fila e mata o processo', async () => {
  const repo = criarRepo();
  const m = novoManager(RunManager, repo);
  const a = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => chamadas(repo).length === 1);
  const { pid } = chamadas(repo)[0];
  const b = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  assert.equal(estadoDe(m, b.id), 'na_fila');
  await m.encerrarTodos();
  assert.ok(!vivo(pid));
  assert.equal(estadoDe(m, a.id), 'cancelado');
  assert.equal(estadoDe(m, b.id), 'cancelado');
  await new Promise((r) => setTimeout(r, 150));
  assert.equal(chamadas(repo).length, 1, 'nenhum novo processo deve nascer depois');
});

test('encerrarTodos sem runs ativos resolve de imediato', async () => {
  const m = novoManager(RunManager, criarRepo());
  await m.encerrarTodos();
});

test('totalOuvintes reflete assinaturas e cancelamentos', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  assert.equal(m.totalOuvintes(id), 0);
  const cancelar = m.assinar(id, () => {});
  assert.equal(m.totalOuvintes(id), 1);
  cancelar();
  assert.equal(m.totalOuvintes(id), 0);
  await esperar(() => estadoDe(m, id) === 'concluido');
});

test('slug com outra caixa não burla a fila nem o diretório do projeto', () => {
  const m = novoManager(RunManager, criarRepo());
  assert.throws(() => m.iniciar({ skill: 'avatar-funil', slug: 'DEMO' }),
    (e) => e instanceof ErroRequisicao && e.status === 400 && /projeto inválido/.test(e.message));
  assert.throws(() => m.listar('DEMO'), ErroRequisicao);
});

test('mensagens de erro do runner saem acentuadas', async () => {
  const m = novoManager(RunManager, criarRepo());
  assert.throws(() => m.cancelar('00000000-0000-0000-0000-000000000000'), /run não encontrado/);
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  await esperar(() => estadoDe(m, id) === 'concluido');
  assert.throws(() => m.cancelar(id), /run não está em andamento/);
  assert.throws(() => m.iniciar({ skill: 'avatar-funil', slug: '../x' }), /projeto inválido/);
});
