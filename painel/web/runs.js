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

export function criarVisaoRun({ cabecalho, log, form, aoMudar, aoArquivosMudarem }) {
  let fonte = null;
  let meta = null;
  const campo = form.querySelector('textarea');

  function fechar() {
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

  async function atualizarMeta() {
    if (!meta) return;
    meta = await api(`/api/runs/${meta.id}`);
    desenharCabecalho();
    aoMudar();
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
        atualizarMeta();
        break;
      case 'texto': {
        const d = el('div', 'msg');
        d.innerHTML = renderMarkdown(ev.texto);
        log.append(d);
        break;
      }
      case 'ferramenta':
        log.append(el('div', 'ferramenta', `${ev.nome} ${resumoEntrada(ev.entrada)}`.trim()));
        if (ESCREVEM_ARQUIVOS.has(ev.nome)) aoArquivosMudarem();
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
        aoArquivosMudarem();
        break;
      default:
        return;
    }
    log.scrollTop = log.scrollHeight;
  }

  async function abrir(id) {
    fechar();
    meta = await api(`/api/runs/${id}`);
    desenharCabecalho();
    fonte = new EventSource(urlApi(`/api/runs/${id}/events`));
    fonte.onmessage = (m) => tratar(JSON.parse(m.data));
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
