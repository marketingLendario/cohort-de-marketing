import { api } from './api.js';

const ROTULO = {
  na_fila: 'na fila', executando: 'executando', aguardando_resposta: 'aguardando você',
  concluido: 'concluído', erro: 'erro', cancelado: 'cancelado',
};

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto != null) e.textContent = texto;
  return e;
}

function rotuloDia(data) {
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return 'Hoje';
  if (data.toDateString() === ontem.toDateString()) return 'Ontem';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Linha do tempo do cliente, da execução mais antiga para a mais recente.
export function criarHistorico({ lista, obterProjeto, obterAberto, aoAbrir }) {
  let seq = 0;

  async function carregar() {
    const minha = ++seq;
    const projeto = obterProjeto();
    if (!projeto) { lista.replaceChildren(); return; }
    try {
      const { runs } = await api(`/api/projetos/${projeto}/runs`);
      if (minha !== seq) return;
      desenhar([...runs].sort((a, b) => String(a.criadoEm).localeCompare(String(b.criadoEm))));
    } catch (e) {
      if (minha === seq) lista.replaceChildren(el('li', 'vazio', e.message));
    }
  }

  function desenhar(runs) {
    if (runs.length === 0) {
      lista.replaceChildren(el('li', 'vazio', 'Nenhuma skill rodou para este cliente ainda. O que você fizer aparece aqui, em ordem.'));
      return;
    }
    const frag = document.createDocumentFragment();
    let diaAtual = null;
    const aberto = obterAberto();
    for (const r of runs) {
      const data = new Date(r.criadoEm);
      const dia = rotuloDia(data);
      if (dia !== diaAtual) { frag.append(el('li', 'dia', dia)); diaAtual = dia; }
      const li = el('li', `item-tempo${r.id === aberto ? ' ativo' : ''}`);
      const b = el('button');
      b.type = 'button';
      const ponto = el('span', `ponto ${r.estado}`);
      ponto.setAttribute('aria-hidden', 'true');
      const custo = r.custoUsd ? ` · US$ ${Number(r.custoUsd).toFixed(2)}` : '';
      b.append(ponto,
        el('span', 'nome', `/${r.skill}`),
        el('span', 'hora', data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
        el('span', 'detalhe', `${ROTULO[r.estado] ?? r.estado}${custo}`));
      b.onclick = () => aoAbrir(r.id);
      li.append(b);
      frag.append(li);
    }
    lista.replaceChildren(frag);
    lista.scrollTop = lista.scrollHeight;
  }

  return { carregar };
}
