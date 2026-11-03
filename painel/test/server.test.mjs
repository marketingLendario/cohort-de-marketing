import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { criarServidor, instalarEncerramento } from '../server.mjs';
import { RunManager } from '../lib/runner.mjs';
import { criarRepo, esperar, novoManager } from './helpers.mjs';

const TOKEN = 't'.repeat(48);
let servidor, base, porta, gerente;

before(async () => {
  const repo = criarRepo();
  mkdirSync(join(repo, 'projetos', 'demo', 'sub'), { recursive: true });
  mkdirSync(join(repo, 'projetos', 'demo', '.painel'), { recursive: true });
  writeFileSync(join(repo, 'projetos', 'demo', '.painel', 'segredo.json'), '{}');
  writeFileSync(join(repo, 'projetos', 'demo', 'sub', 'nota.md'), '# Oi');
  writeFileSync(join(repo, 'projetos', 'demo', 'avatar.html'), '<h1>x</h1>');
  gerente = novoManager(RunManager, repo);
  servidor = criarServidor({
    repoRoot: repo,
    runManager: gerente,
    token: TOKEN,
    diagnostico: async () => ({ claudeInstalado: true, versao: 'x', logado: true, problemas: [] }),
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  porta = servidor.address().port;
  base = `http://127.0.0.1:${porta}`;
});

after(() => {
  servidor.closeAllConnections();
  servidor.close();
});

async function chamar(caminho, { metodo = 'GET', corpo, headers = {}, token = TOKEN } = {}) {
  const r = await fetch(base + caminho, {
    method: metodo,
    headers: {
      ...(token ? { 'x-painel-token': token } : {}),
      ...(corpo !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  return r;
}

test('GET / entrega o html com o token injetado', async () => {
  const txt = await (await fetch(base + '/')).text();
  assert.ok(txt.includes(TOKEN));
  assert.ok(!txt.includes('{{TOKEN}}'));
});

test('estáticos: traversal e tipos não permitidos são recusados', async () => {
  const r1 = await fetch(base + '/..%2Fserver.mjs');
  assert.ok([400, 404].includes(r1.status));
  assert.equal((await fetch(base + '/%E0%A4%A')).status, 400);
  assert.equal((await fetch(base + '/nao-existe.js')).status, 404);
});

test('Host estranho é recusado (403)', async () => {
  const status = await new Promise((ok, ko) => {
    http.get({ host: '127.0.0.1', port: porta, path: '/', headers: { host: 'evil.com' } },
      (res) => { res.resume(); ok(res.statusCode); }).on('error', ko);
  });
  assert.equal(status, 403);
});

test('API sem token ou com token errado devolve 401', async () => {
  assert.equal((await chamar('/api/projetos', { token: null })).status, 401);
  assert.equal((await chamar('/api/projetos', { token: 'x'.repeat(48) })).status, 401);
});

test('listas de projetos, skills e diagnóstico', async () => {
  assert.deepEqual((await (await chamar('/api/projetos')).json()).projetos, [{ slug: 'demo' }]);
  assert.equal((await (await chamar('/api/skills')).json()).skills[0].name, 'avatar-funil');
  assert.equal((await (await chamar('/api/diagnostico')).json()).claudeInstalado, true);
});

test('árvore e leitura de arquivo; .. é recusado; html sai com CSP sandbox', async () => {
  const arv = await (await chamar('/api/projetos/demo/arquivos')).json();
  assert.ok(arv.itens.some((i) => i.path === 'sub/nota.md'));
  assert.ok(!arv.itens.some((i) => i.path.includes('.painel')));
  const md = await chamar('/api/projetos/demo/arquivo?path=sub/nota.md');
  assert.equal(await md.text(), '# Oi');
  assert.equal((await chamar('/api/projetos/demo/arquivo?path=../../x')).status, 400);
  assert.equal((await chamar('/api/projetos/demo/arquivo?path=.painel/segredo.json')).status, 400);
  assert.equal((await chamar('/api/projetos/demo/arquivo?path=nao-existe.md')).status, 404);
  const html = await chamar('/api/projetos/demo/arquivo?path=avatar.html');
  assert.match(html.headers.get('content-security-policy'), /sandbox/);
});

test('POST exige JSON e origem local', async () => {
  const semJson = await fetch(`${base}/api/runs`, {
    method: 'POST', headers: { 'x-painel-token': TOKEN, 'content-type': 'text/plain' }, body: '{}',
  });
  assert.equal(semJson.status, 415);
  const outraOrigem = await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'avatar-funil', projeto: 'demo' },
    headers: { origin: 'https://evil.com' },
  });
  assert.equal(outraOrigem.status, 403);
});

test('corpo JSON que não é objeto devolve 400, não 500', async () => {
  for (const bruto of ['null', '[]', '"x"', '{quebrado']) {
    const r = await fetch(`${base}/api/runs`, {
      method: 'POST',
      headers: { 'x-painel-token': TOKEN, 'content-type': 'application/json' },
      body: bruto,
    });
    assert.equal(r.status, 400, bruto);
  }
});

test('fluxo completo: iniciar, acompanhar por SSE e listar', async () => {
  const criado = await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'avatar-funil', projeto: 'demo', args: '' },
  });
  assert.equal(criado.status, 200);
  const { id } = await criado.json();

  await esperar(async () => (await (await chamar(`/api/runs/${id}`)).json()).estado === 'concluido');

  const sse = await fetch(`${base}/api/runs/${id}/events?token=${TOKEN}`);
  assert.match(sse.headers.get('content-type'), /text\/event-stream/);
  const leitor = sse.body.getReader();
  const dec = new TextDecoder();
  let txt = '';
  while (!txt.includes('"tipo":"resultado"')) {
    const { value, done } = await leitor.read();
    if (done) break;
    txt += dec.decode(value);
  }
  await leitor.cancel();
  assert.match(txt, /rodando \/avatar-funil/);

  const runs = await (await chamar('/api/projetos/demo/runs')).json();
  assert.equal(runs.runs[0].id, id);
});

test('erros de validação e run inexistente', async () => {
  const ruim = await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'nao-existe', projeto: 'demo' },
  });
  assert.equal(ruim.status, 400);
  assert.equal((await chamar('/api/runs/abc')).status, 404);
  assert.equal((await chamar('/api/runs/abc/cancelar', { metodo: 'POST', corpo: {} })).status, 404);
});

// ---- SSE: retomada, saneamento de `desde` e limpeza ----

async function lerSse(caminho, headers = {}) {
  const r = await fetch(base + caminho, { headers });
  const leitor = r.body.getReader();
  const dec = new TextDecoder();
  let txt = '';
  while (!txt.includes('"tipo":"resultado"')) {
    const { value, done } = await leitor.read();
    if (done) break;
    txt += dec.decode(value);
  }
  await leitor.cancel();
  return txt;
}
const idsDe = (txt) => [...txt.matchAll(/^id: (\d+)$/gm)].map((m) => Number(m[1]));

async function runConcluido() {
  const { id } = await (await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'avatar-funil', projeto: 'demo' },
  })).json();
  await esperar(async () => (await (await chamar(`/api/runs/${id}`)).json()).estado === 'concluido');
  return id;
}

test('SSE: ?desde=2 pula eventos e as linhas id: são seq+1', async () => {
  const id = await runConcluido();
  const todos = idsDe(await lerSse(`/api/runs/${id}/events?token=${TOKEN}`));
  assert.equal(todos[0], 1);
  const parcial = idsDe(await lerSse(`/api/runs/${id}/events?token=${TOKEN}&desde=2`));
  assert.equal(parcial[0], 3);
  assert.deepEqual(parcial, todos.slice(2));
});

test('SSE: Last-Event-ID retoma do evento seguinte', async () => {
  const id = await runConcluido();
  const parcial = idsDe(await lerSse(`/api/runs/${id}/events?token=${TOKEN}`, { 'last-event-id': '3' }));
  assert.equal(parcial[0], 4);
});

test('SSE: desde negativo, fracionário ou lixo devolve o histórico inteiro/saneado', async () => {
  const id = await runConcluido();
  const todos = idsDe(await lerSse(`/api/runs/${id}/events?token=${TOKEN}`));
  assert.deepEqual(idsDe(await lerSse(`/api/runs/${id}/events?token=${TOKEN}&desde=-5`)), todos);
  assert.deepEqual(idsDe(await lerSse(`/api/runs/${id}/events?token=${TOKEN}&desde=abc`)), todos);
  assert.deepEqual(idsDe(await lerSse(`/api/runs/${id}/events?token=${TOKEN}&desde=2.9`)), todos.slice(2));
});

test('SSE: ao desconectar o ouvinte é removido de um run vivo', async () => {
  const { id } = await (await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'avatar-funil', projeto: 'demo', args: '[lento]' },
  })).json();
  await esperar(async () => (await (await chamar(`/api/runs/${id}`)).json()).estado === 'executando');
  const ac = new AbortController();
  const r = await fetch(`${base}/api/runs/${id}/events?token=${TOKEN}`, { signal: ac.signal });
  const leitor = r.body.getReader();
  await leitor.read();
  assert.equal(gerente.totalOuvintes(id), 1);
  ac.abort();
  await esperar(() => gerente.totalOuvintes(id) === 0);
  await chamar(`/api/runs/${id}/cancelar`, { metodo: 'POST', corpo: {} });
  await esperar(async () => (await (await chamar(`/api/runs/${id}`)).json()).estado === 'cancelado');
});

// ---- caminhos felizes e guardas ----

test('POST com Origin da própria origem é aceito', async () => {
  const r = await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'nao-existe', projeto: 'demo' },
    headers: { origin: `http://127.0.0.1:${porta}` },
  });
  assert.equal(r.status, 400, 'passou pela guarda de origem e falhou só na validação da skill');
});

test('Host localhost:{porta} é aceito', async () => {
  const status = await new Promise((ok, ko) => {
    http.get({ host: '127.0.0.1', port: porta, path: '/', headers: { host: `localhost:${porta}` } },
      (res) => { res.resume(); ok(res.statusCode); }).on('error', ko);
  });
  assert.equal(status, 200);
});

test('corpo acima de 100 KB devolve 413', async () => {
  const r = await fetch(`${base}/api/runs`, {
    method: 'POST',
    headers: { 'x-painel-token': TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify({ skill: 'avatar-funil', projeto: 'demo', args: 'x'.repeat(101 * 1024) }),
  });
  assert.equal(r.status, 413);
});

test('método diferente de GET em estático devolve 405', async () => {
  const r = await fetch(base + '/', { method: 'POST', body: '{}' });
  assert.equal(r.status, 405);
});

test('resposta e cancelar funcionam num run vivo', async () => {
  const { id } = await (await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'avatar-funil', projeto: 'demo', args: '[pergunta]' },
  })).json();
  await esperar(async () => (await (await chamar(`/api/runs/${id}`)).json()).estado === 'aguardando_resposta');
  const resp = await chamar(`/api/runs/${id}/resposta`, { metodo: 'POST', corpo: { texto: 'A' } });
  assert.equal(resp.status, 200);
  await esperar(async () => (await (await chamar(`/api/runs/${id}`)).json()).estado === 'concluido');
  assert.equal((await chamar(`/api/runs/${id}/resposta`, { metodo: 'POST', corpo: { texto: '' } })).status, 400);

  const lento = await (await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'avatar-funil', projeto: 'demo', args: '[lento]' },
  })).json();
  await esperar(async () => (await (await chamar(`/api/runs/${lento.id}`)).json()).estado === 'executando');
  const canc = await chamar(`/api/runs/${lento.id}/cancelar`, { metodo: 'POST', corpo: {} });
  assert.equal(canc.status, 200);
  assert.deepEqual(await canc.json(), { ok: true });
  await esperar(async () => (await (await chamar(`/api/runs/${lento.id}`)).json()).estado === 'cancelado');
});

test('encerramento: SIGTERM cancela runs, fecha SSE e sai', async () => {
  const repo = criarRepo();
  mkdirSync(join(repo, 'projetos', 'demo'), { recursive: true });
  const m = novoManager(RunManager, repo);
  const srv = criarServidor({ repoRoot: repo, runManager: m, token: TOKEN, diagnostico: async () => ({}) });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  const url = `http://127.0.0.1:${srv.address().port}`;
  const h = { 'x-painel-token': TOKEN, 'content-type': 'application/json' };
  const { id } = await (await fetch(`${url}/api/runs`, {
    method: 'POST', headers: h, body: JSON.stringify({ skill: 'avatar-funil', projeto: 'demo', args: '[lento]' }),
  })).json();
  await esperar(() => existsSync(join(repo, 'fake-calls.jsonl')));
  const chamadas = readFileSync(join(repo, 'fake-calls.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const { pid } = chamadas[0];
  const sse = await fetch(`${url}/api/runs/${id}/events?token=${TOKEN}`);
  const leitor = sse.body.getReader();
  await leitor.read();

  const fakeProc = new EventEmitter();
  const saidas = [];
  const encerrou = new Promise((ok) => {
    instalarEncerramento({ servidor: srv, runManager: m, processo: fakeProc, sair: (c) => { saidas.push(c); ok(); } });
  });
  fakeProc.emit('SIGTERM');
  await encerrou;
  assert.deepEqual(saidas, [0]);
  assert.equal(m.obter(id).estado, 'cancelado');
  assert.throws(() => process.kill(pid, 0), 'o processo filho deve estar morto');
  let fechou = false;
  try {
    for (let i = 0; i < 20 && !fechou; i++) fechou = (await leitor.read()).done;
  } catch {
    fechou = true; // conexão derrubada pelo servidor
  }
  assert.equal(fechou, true, 'a conexão SSE deve ter sido fechada');
});

test('slug com outra caixa é rejeitado nas rotas de projeto', async () => {
  assert.equal((await chamar('/api/projetos/DEMO/arquivos')).status, 400);
  assert.equal((await chamar('/api/projetos/DEMO/arquivo?path=avatar.html')).status, 400);
  assert.equal((await chamar('/api/projetos/DEMO/runs')).status, 400);
  assert.equal((await chamar('/api/projetos/demo/arquivos')).status, 200);
});

test('erros da API saem em português acentuado', async () => {
  const msg = async (r) => (await r.json()).erro;
  assert.equal(await msg(await chamar('/api/nada')), 'rota não encontrada');
  assert.equal(await msg(await chamar('/api/runs/abc')), 'run não encontrado');
  assert.equal(await msg(await chamar('/api/projetos', { token: 'x' })), 'token inválido');
  assert.equal(await msg(await chamar('/api/projetos/demo/arquivo?path=%2E%2E%2Fx')), 'fora do diretório permitido');
  const mal = await fetch(`${base}/api/runs`, {
    method: 'POST', headers: { 'x-painel-token': TOKEN, 'content-type': 'application/json' }, body: '{',
  });
  assert.equal(await msg(mal), 'json inválido');
});

function falsoRunManager(encerrarTodos) {
  return { encerrarTodos };
}
function falsoServidor() {
  return { closeAllConnections() {}, close() {} };
}

test('encerramento: SIGHUP também encerra os runs e sai', async () => {
  const fakeProc = new EventEmitter();
  let chamadas = 0;
  const saidas = [];
  const fim = new Promise((ok) => {
    instalarEncerramento({
      servidor: falsoServidor(), runManager: falsoRunManager(async () => { chamadas++; }),
      processo: fakeProc, sair: (c) => { saidas.push(c); ok(); },
    });
  });
  fakeProc.emit('SIGHUP');
  await fim;
  assert.equal(chamadas, 1);
  assert.deepEqual(saidas, [0]);
});

test('encerramento: segundo sinal força a saída com código 1', async () => {
  const fakeProc = new EventEmitter();
  const saidas = [];
  const forcou = new Promise((ok) => {
    instalarEncerramento({
      servidor: falsoServidor(), runManager: falsoRunManager(() => new Promise(() => {})),
      processo: fakeProc, timeoutMs: 60000, sair: (c) => { saidas.push(c); ok(); },
    });
  });
  fakeProc.emit('SIGINT');
  assert.deepEqual(saidas, []);
  fakeProc.emit('SIGINT');
  await forcou;
  assert.deepEqual(saidas, [1]);
});

test('encerramento: encerrarTodos que trava não impede a saída (timeout)', async (t) => {
  t.mock.method(console, 'error', () => {});
  const fakeProc = new EventEmitter();
  const saidas = [];
  const fim = new Promise((ok) => {
    instalarEncerramento({
      servidor: falsoServidor(), runManager: falsoRunManager(() => new Promise(() => {})),
      processo: fakeProc, timeoutMs: 30, sair: (c) => { saidas.push(c); ok(); },
    });
  });
  fakeProc.emit('SIGTERM');
  await fim;
  assert.deepEqual(saidas, [0]);
});

test('POST /api/projetos cria cliente; duplicado e nome vazio dão 400', async () => {
  const criado = await chamar('/api/projetos', { metodo: 'POST', corpo: { nome: 'Loja da Ana' } });
  assert.equal(criado.status, 200);
  assert.deepEqual(await criado.json(), { slug: 'loja-da-ana' });
  const lista = await (await chamar('/api/projetos')).json();
  assert.ok(lista.projetos.some((p) => p.slug === 'loja-da-ana'));
  assert.equal((await chamar('/api/projetos', { metodo: 'POST', corpo: { nome: 'loja da ana' } })).status, 400);
  assert.equal((await chamar('/api/projetos', { metodo: 'POST', corpo: { nome: '' } })).status, 400);
});

test('GET /api/projetos/:slug/resumo devolve as etapas e as execuções do cliente', async () => {
  const r = await chamar('/api/projetos/demo/resumo');
  assert.equal(r.status, 200);
  const resumo = await r.json();
  assert.equal(resumo.etapas.length, 11);
  assert.equal(typeof resumo.execucoes.total, 'number');
  assert.equal((await chamar('/api/projetos/nao-existe/resumo')).status, 400);
});

test('GET /api/projetos/:slug/anuncios responde mesmo sem dados coletados', async () => {
  const r = await chamar('/api/projetos/demo/anuncios');
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { disponivel: false });
  assert.equal((await chamar('/api/projetos/nao-existe/anuncios')).status, 400);
});
