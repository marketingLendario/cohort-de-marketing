import { api } from './api.js';

const ROTULO = {
  na_fila: 'na fila', executando: 'executando', aguardando_resposta: 'aguardando você',
  concluido: 'concluído', erro: 'erro', cancelado: 'cancelado',
};

export function criarListaRuns({ lista, obterProjeto, aoAbrir }) {
  let seq = 0;
  let ultimo = null;
  async function carregar() {
    const minha = ++seq;
    const projeto = obterProjeto();
    if (projeto !== ultimo) { lista.replaceChildren(); ultimo = projeto; }
    if (!projeto) { lista.replaceChildren(); return; }
    try {
      const { runs } = await api(`/api/projetos/${projeto}/runs`);
      if (minha !== seq) return;
      const frag = document.createDocumentFragment();
      for (const r of runs) {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = `/${r.skill} · ${ROTULO[r.estado] ?? r.estado}`;
        b.title = new Date(r.criadoEm).toLocaleString('pt-BR');
        b.onclick = () => aoAbrir(r.id);
        li.append(b);
        frag.append(li);
      }
      lista.replaceChildren(frag);
    } catch (e) {
      if (minha === seq) lista.textContent = e.message;
    }
  }
  return { carregar };
}
