import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { criarServidor } from '../server.mjs';
import { RunManager } from '../lib/runner.mjs';
import { criarRepo, esperar, novoManager } from './helpers.mjs';

const TOKEN = 't'.repeat(48);
let servidor, base, porta;

before(async () => {
  const repo = criarRepo();
  mkdirSync(join(repo, 'projetos', 'demo', 'sub'), { recursive: true });
  mkdirSync(join(repo, 'projetos', 'demo', '.painel'), { recursive: true });
  writeFileSync(join(repo, 'projetos', 'demo', '.painel', 'segredo.json'), '{}');
  writeFileSync(join(repo, 'projetos', 'demo', 'sub', 'nota.md'), '# Oi');
  writeFileSync(join(repo, 'projetos', 'demo', 'avatar.html'), '<h1>x</h1>');
  servidor = criarServidor({
    repoRoot: repo,
    runManager: novoManager(RunManager, repo),
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
