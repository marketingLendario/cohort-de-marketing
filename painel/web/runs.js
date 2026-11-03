import { api, urlApi } from './api.js';
import { renderMarkdown } from './markdown.js';

const ROTULO = {
  na_fila: 'Na fila', executando: 'Executando', aguardando_resposta: 'Aguardando você',
  concluido: 'Concluído', erro: 'Erro', cancelado: 'Cancelado',
};
const PODE_RESPONDER = new Set(['aguardando_resposta', 'concluido', 'erro']);
const ESCREVEM_ARQUIVOS = new Set(['Write', 'Edit', 'Bash']);

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto != null) e.textContent = texto;
  return e;
}

function resumoEntrada(entrada) {
  const v = entrada?.file_path ?? entrada?.command ?? entrada?.pattern ?? entrada?.url ?? '';
  return String(v).slice(0, 100);
}

export function criarVisaoRun({ cabecalho, log, form, aoMudar, aoArquivosMudarem, atrasoMs = 200 }) {
  let fonte = null;
  let meta = null;
  // geracao invalida qualquer trabalho assíncrono iniciado antes de fechar()/abrir().
  let geracao = 0;
  let seqMeta = 0;
  let timerMeta = null;
  let timerArquivos = null;
  const campo = form.querySelector('textarea');

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
    log.replaceChildren();
    form.hidden = true;
  }

  function desenharCabecalho() {
    cabecalho.replaceChildren();
    if (!meta) return;
    cabecalho.append(el('strong', '', `/${meta.skill}`),
      el('span', `estado ${meta.estado}`, ROTULO[meta.estado] ?? meta.estado));
    if (meta.estado === 'executando' || meta.estado === 'na_fila') {
      const b = el('button', '', 'Cancelar');
      b.type = 'button';
      b.onclick = () => api(`/api/runs/${meta.id}/cancelar`, { metodo: 'POST', corpo: {} })
        .catch((e) => alert(e.message));
      cabecalho.append(b);
    }
    form.hidden = !(PODE_RESPONDER.has(meta.estado) && meta.sessionId);
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

  async function enviar(texto) {
    try {
      await api(`/api/runs/${meta.id}/resposta`, { metodo: 'POST', corpo: { texto } });
    } catch (e) {
      alert(e.message);
    }
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
        b.onclick = () => enviar(o.label);
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
        break;
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
    log.scrollTop = log.scrollHeight;
  }

  async function abrir(id) {
    fechar();
    const minha = geracao;
    const novo = await api(`/api/runs/${id}`);
    if (minha !== geracao) return;
    meta = novo;
    desenharCabecalho();
    fonte?.close();
    fonte = new EventSource(urlApi(`/api/runs/${id}/events`));
    fonte.onmessage = (m) => {
      if (minha === geracao) tratar(JSON.parse(m.data));
    };
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = campo.value.trim();
    if (!texto || !meta) return;
    campo.value = '';
    enviar(texto);
  });

  return { abrir, fechar };
}
