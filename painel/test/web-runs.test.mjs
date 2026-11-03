import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { No, instalarAmbiente, esperar, tick } from './fake-dom.mjs';

const amb = instalarAmbiente();
const { criarVisaoRun } = await import('../web/runs.js');
const { criarHistorico } = await import('../web/historico.js');

const pend = (re) => amb.pedidos.filter((p) => re.test(p.url));
const meta = (id, extra = {}) => ({ id, skill: `skill-${id}`, estado: 'executando', ...extra });

function montar(opcoes = {}) {
  const dom = { cabecalho: new No('div'), log: new No('div'), boasVindas: new No('div') };
  const chamadas = { mudar: 0, arquivos: 0 };
  const visao = criarVisaoRun({
    ...dom, atrasoMs: 5,
    aoMudar: () => { chamadas.mudar++; },
    aoArquivosMudarem: () => { chamadas.arquivos++; },
    aoEstado: () => {},
    ...opcoes,
  });
  return { ...dom, chamadas, visao };
}

beforeEach(() => { amb.fontes.length = 0; amb.pedidos.length = 0; });

test('abrir A e depois B rapidamente deixa só o stream de B aberto', async () => {
  const { visao, cabecalho, log } = montar();
  const a = visao.abrir('A');
  const b = visao.abrir('B');
  // respostas fora de ordem: B primeiro, A depois
  pend(/runs\/B\?/)[0].responder(meta('B'));
  await b;
  pend(/runs\/A\?/)[0].responder(meta('A'));
  await a;
  const abertas = amb.fontes.filter((f) => !f.fechada);
  assert.equal(abertas.length, 1);
  assert.match(abertas[0].url, /runs\/B\/events/);
  assert.match(cabecalho.textContent, /skill-B/);
  amb.fontes.forEach((f) => f.emitir({ tipo: 'texto', texto: 'do A' }));
  assert.ok(!log.textContent.includes('do A') || amb.fontes.every((f) => !/runs\/A/.test(f.url)));
});

test('abrir pendente não reabre stream depois de fechar()', async () => {
  const { visao, cabecalho } = montar();
  const a = visao.abrir('A');
  visao.fechar();
  pend(/runs\/A\?/)[0].responder(meta('A'));
  await a;
  assert.equal(amb.fontes.length, 0);
  assert.equal(cabecalho.children.length, 0);
});

test('resposta atrasada de atualizarMeta não ressuscita o run antigo', async () => {
  const { visao, cabecalho } = montar();
  const a = visao.abrir('A');
  pend(/runs\/A\?/)[0].responder(meta('A'));
  await a;
  amb.fontes[0].emitir({ tipo: 'estado' });
  await esperar(20);
  const velho = pend(/runs\/A\?/)[1];
  assert.ok(velho, 'atualização de A em voo');
  const b = visao.abrir('B');
  pend(/runs\/B\?/)[0].responder(meta('B'));
  await b;
  velho.responder(meta('A', { estado: 'concluido' }));
  await tick();
  assert.match(cabecalho.textContent, /skill-B/);
  assert.ok(!cabecalho.textContent.includes('skill-A'));
});

test('falha em atualizarMeta não gera rejeição não tratada e avisa no log', async () => {
  const rejeicoes = [];
  const ouvinte = (e) => rejeicoes.push(e);
  process.on('unhandledRejection', ouvinte);
  try {
    const { visao, log } = montar();
    const a = visao.abrir('A');
    pend(/runs\/A\?/)[0].responder(meta('A'));
    await a;
    amb.fontes[0].emitir({ tipo: 'estado' });
    await esperar(20);
    pend(/runs\/A\?/)[1].falhar(new Error('rede caiu'));
    await esperar(20);
    assert.deepEqual(rejeicoes, []);
    assert.match(log.textContent, /rede caiu/);
  } finally {
    process.off('unhandledRejection', ouvinte);
  }
});

test('replay do histórico coalesce atualizações de meta e recargas de arquivos', async () => {
  const { visao, chamadas } = montar();
  const a = visao.abrir('A');
  pend(/runs\/A\?/)[0].responder(meta('A'));
  await a;
  for (let i = 0; i < 40; i++) {
    amb.fontes[0].emitir({ tipo: 'estado' });
    amb.fontes[0].emitir({ tipo: 'ferramenta', nome: 'Write', entrada: { file_path: 'x.md' } });
    amb.fontes[0].emitir({ tipo: 'resultado' });
  }
  await esperar(30);
  const gets = pend(/runs\/A\?/);
  assert.equal(gets.length, 2, 'uma abertura + uma atualização');
  gets[1].responder(meta('A', { estado: 'concluido' }));
  await tick();
  assert.equal(chamadas.arquivos, 1);
  assert.equal(chamadas.mudar, 1);
});

test('histórico: chamadas sobrepostas não duplicam nem mostram resposta velha', async () => {
  const lista = new No('ol');
  const l = criarHistorico({ lista, obterProjeto: () => 'p', obterAberto: () => null, aoAbrir: () => {} });
  const um = l.carregar();
  const dois = l.carregar();
  const r = (skill) => ({ runs: [{ id: skill, skill, estado: 'concluido', criadoEm: 0 }] });
  const [p1, p2] = pend(/projetos\/p\/runs/);
  p2.responder(r('nova'));
  await dois;
  p1.responder(r('velha'));
  await um;
  assert.equal(lista.children.filter((c) => /item-tempo/.test(c.className)).length, 1);
  assert.match(lista.textContent, /nova/);
  assert.ok(!lista.textContent.includes('velha'));
});

test('histórico mostra as execuções da mais antiga para a mais recente', async () => {
  const lista = new No('ol');
  const l = criarHistorico({ lista, obterProjeto: () => 'p', obterAberto: () => 'b', aoAbrir: () => {} });
  const feito = l.carregar();
  pend(/projetos\/p\/runs/).at(-1).responder({ runs: [
    { id: 'b', skill: 'copy-funil', estado: 'concluido', criadoEm: '2026-11-02T10:00:00Z', custoUsd: 0.4 },
    { id: 'a', skill: 'avatar-funil', estado: 'concluido', criadoEm: '2026-11-01T10:00:00Z' },
  ] });
  await feito;
  const itens = lista.children.filter((c) => /item-tempo/.test(c.className));
  assert.deepEqual(itens.map((i) => /avatar/.test(i.textContent) ? 'a' : 'b'), ['a', 'b']);
  assert.match(itens[1].className, /ativo/);
  assert.match(itens[1].textContent, /US\$ 0\.40/);
});

test('ao abrir um run, a conversa começa pelo pedido com a skill e as instruções', async () => {
  const { visao, log } = montar();
  const a = visao.abrir('A');
  pend(/runs\/A\?/)[0].responder(meta('A', { args: 'nicho fitness', sessionId: 's', estado: 'concluido' }));
  await a;
  assert.match(log.children[0].textContent, /\/skill-A/);
  assert.match(log.children[0].textContent, /nicho fitness/);
  assert.equal(visao.podeResponder(), true);
  assert.equal(visao.idAberto(), 'A');
  visao.fechar();
  assert.equal(visao.podeResponder(), false);
});
