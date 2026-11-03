import { api, urlApi } from './api.js';
import { renderMarkdown } from './markdown.js';

const ROTULO = {
  na_fila: 'Na fila', executando: 'Executando', aguardando_resposta: 'Aguardando você',
  concluido: 'Concluído', erro: 'Erro', cancelado: 'Cancelado',
};
const PODE_RESPONDER = new Set(['aguardando_resposta', 'concluido', 'erro']);
const EM_ANDAMENTO = new Set(['na_fila', 'executando']);
const ESCREVEM_ARQUIVOS = new Set(['Write', 'Edit', 'Bash']);

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto != null) e.textContent = texto;
  return e;
}

function resumoEntrada(entrada) {
  const v = entrada?.file_path ?? entrada?.command ?? entrada?.pattern ?? entrada?.url ?? '';
  return String(v).slice(0, 120);
}

export function criarVisaoRun({ cabecalho, log, boasVindas, aoMudar, aoArquivosMudarem, aoEstado, atrasoMs = 200 }) {
  let fonte = null;
  let meta = null;
  // geracao invalida qualquer trabalho assíncrono iniciado antes de fechar()/abrir().
  let geracao = 0;
  let seqMeta = 0;
  let timerMeta = null;
  let timerArquivos = null;
  const digitando = el('div', 'digitando');
  digitando.append(el('i'), el('i'), el('i'));
  digitando.setAttribute('aria-label', 'A skill está trabalhando');

  function rolarParaFim() {
    log.scrollTop = log.scrollHeight;
  }

  function mostrarDigitando() {
    digitando.remove();
    if (meta && EM_ANDAMENTO.has(meta.estado)) log.append(digitando);
  }

  function fechar() {
    geracao++;
    clearTimeout(timerMeta);
    clearTimeout(timerArquivos);
    timerMeta = null;
    timerArquivos = null;
    fonte?.close();
    fonte = null;
    meta = null;
    cabecalho.replaceChildren();
    log.replaceChildren(boasVindas);
    aoEstado(null);
  }

  function desenharCabecalho() {
    cabecalho.replaceChildren();
    if (!meta) return;
    const data = new Date(meta.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    cabecalho.append(el('strong', '', `/${meta.skill}`),
      el('span', `estado ${meta.estado}`, ROTULO[meta.estado] ?? meta.estado),
      el('span', 'data', data));
    if (EM_ANDAMENTO.has(meta.estado)) {
      const b = el('button', 'botao-texto', 'Cancelar');
      b.type = 'button';
      b.onclick = () => api(`/api/runs/${meta.id}/cancelar`, { metodo: 'POST', corpo: {} })
        .catch((e) => alert(e.message));
      cabecalho.append(b);
    }
    mostrarDigitando();
    aoEstado(meta);
  }

  async function atualizarMeta(minha) {
    if (!meta || minha !== geracao) return;
    const seq = ++seqMeta;
    let novo;
    try {
      novo = await api(`/api/runs/${meta.id}`);
    } catch (e) {
      if (minha === geracao) log.append(el('div', 'msg erro', `Não consegui atualizar o estado: ${e.message}`));
      return;
    }
    if (minha !== geracao || seq !== seqMeta) return;
    meta = novo;
    desenharCabecalho();
    aoMudar();
  }

  // O servidor reenvia o histórico inteiro a cada conexão: junta rajadas em uma só atualização.
  function agendarMeta() {
    if (timerMeta) return;
    const minha = geracao;
    timerMeta = setTimeout(() => { timerMeta = null; atualizarMeta(minha); }, atrasoMs);
  }

  function agendarArquivos() {
    if (timerArquivos) return;
    timerArquivos = setTimeout(() => { timerArquivos = null; aoArquivosMudarem(); }, atrasoMs);
  }

  async function responder(texto) {
    if (!meta) return;
    await api(`/api/runs/${meta.id}/resposta`, { metodo: 'POST', corpo: { texto } });
  }

  function desenharPergunta(perguntas) {
    for (const p of perguntas) {
      const caixa = el('div', 'pergunta');
      caixa.append(el('strong', '', p.question ?? 'Escolha uma opção'));
      const opcoes = el('div', 'opcoes');
      for (const o of p.options ?? []) {
        const b = el('button', '', o.label);
        b.type = 'button';
        if (o.description) b.append(el('small', '', o.description));
        b.onclick = () => responder(o.label).catch((e) => alert(e.message));
        opcoes.append(b);
      }
      caixa.append(opcoes);
      log.append(caixa);
    }
  }

  function tratar(ev) {
    switch (ev.tipo) {
      case 'estado':
        agendarMeta();
        return;
      case 'texto': {
        const d = el('div', 'msg');
        d.innerHTML = renderMarkdown(ev.texto);
        log.append(d);
        break;
      }
      case 'ferramenta':
        log.append(el('div', 'ferramenta', `${ev.nome} ${resumoEntrada(ev.entrada)}`.trim()));
        if (ESCREVEM_ARQUIVOS.has(ev.nome)) agendarArquivos();
        break;
      case 'pergunta':
        desenharPergunta(ev.perguntas);
        break;
      case 'usuario':
        log.append(el('div', 'msg usuario', ev.texto));
        break;
      case 'erro':
        log.append(el('div', 'msg erro', ev.mensagem));
        break;
      case 'resultado':
        log.append(el('div', 'resultado',
          ev.custoUsd != null ? `Fim do turno · custo US$ ${ev.custoUsd.toFixed(2)}` : 'Fim do turno'));
        agendarArquivos();
        break;
      default:
        return;
    }
    mostrarDigitando();
    rolarParaFim();
  }

  function pedidoInicial() {
    const bolha = el('div', 'msg usuario');
    bolha.append(el('span', 'skill-usada', `/${meta.skill}`));
    bolha.append(document.createTextNode(meta.args?.trim() || 'Rodar a skill'));
    return bolha;
  }

  async function abrir(id) {
    fechar();
    const minha = geracao;
    const novo = await api(`/api/runs/${id}`);
    if (minha !== geracao) return;
    meta = novo;
    log.replaceChildren(pedidoInicial());
    desenharCabecalho();
    fonte?.close();
    fonte = new EventSource(urlApi(`/api/runs/${id}/events`));
    fonte.onmessage = (m) => {
      if (minha === geracao) tratar(JSON.parse(m.data));
    };
  }

  return {
    abrir,
    fechar,
    responder,
    idAberto: () => meta?.id ?? null,
    podeResponder: () => Boolean(meta && meta.sessionId && PODE_RESPONDER.has(meta.estado)),
  };
}
