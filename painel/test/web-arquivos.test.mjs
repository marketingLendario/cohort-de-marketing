import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { No, instalarAmbiente, esperar, tick } from './fake-dom.mjs';

const amb = instalarAmbiente();
const { criarArquivos } = await import('../web/arquivos.js');

const pend = (re) => amb.pedidos.filter((p) => re.test(p.url));
const lista = (...caminhos) => ({ itens: caminhos.map((path) => ({ path, tipo: 'file' })) });

// fetch de texto controlado à mão (o do fake-dom só devolve json).
function textoPendente() {
  const texto = [];
  const base = globalThis.fetch;
  globalThis.fetch = (url, op) => {
    if (!/\/arquivo\?/.test(url)) return base(url, op);
    return new Promise((resolve, reject) => {
      texto.push({
        url,
        responder: (t) => resolve({ ok: true, text: async () => t }),
        falhar: (status) => resolve({ ok: false, status, text: async () => '' }),
        reject,
      });
    });
  };
  return { texto, restaurar: () => { globalThis.fetch = base; } };
}

function montar(projeto = 'p1') {
  const arvore = new No('ul');
  const visualizador = new No('div');
  const estado = { projeto };
  const arq = criarArquivos({ arvore, visualizador, obterProjeto: () => estado.projeto });
  return { arvore, visualizador, estado, arq };
}

async function carregarArvore(ctx, itens, slug = 'p1') {
  ctx.arq.recarregar();
  await esperar(320);
  pend(new RegExp(`projetos/${slug}/arquivos`)).at(-1).responder(itens);
  await tick();
}

const botao = (arvore, nome) => arvore.children.map((li) => li.children[0]).find((b) => b?.textContent === nome);

beforeEach(() => { amb.pedidos.length = 0; });

test('clicar B enquanto A carrega mostra só B, mesmo se A responder depois', async () => {
  const f = textoPendente();
  try {
    const ctx = montar();
    await carregarArvore(ctx, lista('a.txt', 'b.txt'));
    botao(ctx.arvore, 'a.txt').onclick();
    botao(ctx.arvore, 'b.txt').onclick();
    const [pa, pb] = f.texto;
    pb.responder('conteudo B');
    await tick();
    pa.responder('conteudo A');
    await tick(); await tick();
    assert.ok(ctx.visualizador.textContent.includes('conteudo B'));
    assert.ok(!ctx.visualizador.textContent.includes('conteudo A'));
    assert.equal(ctx.visualizador.children.length, 2);
  } finally { f.restaurar(); }
});

test('erro atrasado de A não aparece sob o conteúdo de B', async () => {
  const f = textoPendente();
  try {
    const ctx = montar();
    await carregarArvore(ctx, lista('a.txt', 'b.txt'));
    botao(ctx.arvore, 'a.txt').onclick();
    botao(ctx.arvore, 'b.txt').onclick();
    f.texto[1].responder('conteudo B');
    await tick();
    f.texto[0].falhar(500);
    await tick(); await tick();
    assert.ok(!ctx.visualizador.textContent.includes('erro 500'));
    assert.ok(ctx.visualizador.textContent.includes('conteudo B'));
  } finally { f.restaurar(); }
});

test('trocar de projeto limpa o visualizador', async () => {
  const f = textoPendente();
  try {
    const ctx = montar('p1');
    await carregarArvore(ctx, lista('a.txt'));
    botao(ctx.arvore, 'a.txt').onclick();
    f.texto[0].responder('conteudo A');
    await tick(); await tick();
    assert.ok(ctx.visualizador.textContent.includes('conteudo A'));
    ctx.estado.projeto = 'p2';
    ctx.arq.recarregar();
    await esperar(320);
    assert.equal(ctx.visualizador.children.length, 0);
  } finally { f.restaurar(); }
});

test('arquivo aberto que sumiu da listagem limpa o visualizador', async () => {
  const f = textoPendente();
  try {
    const ctx = montar();
    await carregarArvore(ctx, lista('a.txt'));
    botao(ctx.arvore, 'a.txt').onclick();
    f.texto[0].responder('conteudo A');
    await tick(); await tick();
    await carregarArvore(ctx, lista('outro.txt'));
    assert.equal(ctx.visualizador.children.length, 0);
  } finally { f.restaurar(); }
});

test('listagem atrasada do projeto antigo não sobrescreve a árvore do novo', async () => {
  const ctx = montar('p1');
  ctx.arq.recarregar();
  await esperar(320);
  const velha = pend(/projetos\/p1\/arquivos/)[0];
  ctx.estado.projeto = 'p2';
  ctx.arq.recarregar();
  await esperar(320);
  pend(/projetos\/p2\/arquivos/)[0].responder(lista('novo.txt'));
  await tick();
  velha.responder(lista('velho.txt'));
  await tick();
  assert.ok(botao(ctx.arvore, 'novo.txt'));
  assert.ok(!botao(ctx.arvore, 'velho.txt'));
});
