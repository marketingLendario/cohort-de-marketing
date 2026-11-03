import { api, urlApi } from './api.js';
import { renderMarkdown } from './markdown.js';

const IMAGENS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

const extensao = (caminho) => (caminho.includes('.') ? caminho.split('.').pop().toLowerCase() : '');

export function criarArquivos({ arvore, visualizador, obterProjeto }) {
  let timer = null;
  let seq = 0;
  let aberto = null; // { slug, caminho } do arquivo no visualizador

  function limparVisualizador() {
    seq++;
    aberto = null;
    visualizador.replaceChildren();
  }

  function urlArquivo(slug, caminho) {
    return urlApi(`/api/projetos/${slug}/arquivo`, { path: caminho });
  }

  async function textoDe(slug, caminho) {
    const r = await fetch(urlArquivo(slug, caminho));
    if (!r.ok) throw new Error(`Não foi possível concluir a operação (${r.status})`);
    return r.text();
  }

  async function abrirArquivo(slug, caminho) {
    const minha = ++seq;
    aberto = { slug, caminho };
    const titulo = document.createElement('div');
    titulo.className = 'pequeno';
    titulo.textContent = caminho;
    const corpo = document.createDocumentFragment();
    visualizador.replaceChildren(titulo);
    const ext = extensao(caminho);
    try {
      if (ext === 'html') {
        const f = document.createElement('iframe');
        f.setAttribute('sandbox', 'allow-scripts');
        f.src = urlArquivo(slug, caminho);
        corpo.append(f);
      } else if (IMAGENS.has(ext)) {
        const img = document.createElement('img');
        img.src = urlArquivo(slug, caminho);
        img.alt = caminho;
        corpo.append(img);
      } else if (ext === 'pdf') {
        const a = document.createElement('a');
        a.href = urlArquivo(slug, caminho);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'Abrir PDF em nova aba';
        corpo.append(a);
      } else if (ext === 'md') {
        const d = document.createElement('div');
        const md = await textoDe(slug, caminho);
        if (minha !== seq) return;
        d.innerHTML = renderMarkdown(md);
        corpo.append(d);
      } else {
        let txt = await textoDe(slug, caminho);
        if (minha !== seq) return;
        if (ext === 'json') {
          try { txt = JSON.stringify(JSON.parse(txt), null, 2); } catch { /* mostra cru */ }
        }
        const pre = document.createElement('pre');
        pre.textContent = txt;
        corpo.append(pre);
      }
    } catch (e) {
      if (minha !== seq) return;
      const erro = document.createElement('div');
      erro.className = 'msg erro';
      erro.textContent = e.message;
      corpo.append(erro);
    }
    if (minha !== seq) return;
    visualizador.append(corpo);
  }

  function desenhar(slug, itens) {
    arvore.replaceChildren();
    if (itens.length === 0) {
      const vazio = document.createElement('li');
      vazio.className = 'pequeno';
      vazio.textContent = 'Nenhum arquivo ainda.';
      arvore.append(vazio);
      return;
    }
    for (const item of itens) {
      const nivel = item.path.split('/').length - 1;
      const nome = item.path.split('/').pop();
      const li = document.createElement('li');
      li.style.paddingLeft = `${nivel * 12}px`;
      if (item.tipo === 'dir') {
        li.className = 'dir';
        li.textContent = `${nome}/`;
      } else {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = nome;
        b.title = item.path;
        b.onclick = () => abrirArquivo(slug, item.path);
        li.append(b);
      }
      arvore.append(li);
    }
  }

  function recarregar() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const slug = obterProjeto();
      if (!slug) {
        arvore.replaceChildren();
        limparVisualizador();
        return;
      }
      if (aberto && aberto.slug !== slug) limparVisualizador();
      try {
        const { itens } = await api(`/api/projetos/${slug}/arquivos`);
        if (obterProjeto() !== slug) return;
        if (aberto && !itens.some((i) => i.tipo !== 'dir' && i.path === aberto.caminho)) limparVisualizador();
        desenhar(slug, itens);
      } catch (e) {
        if (obterProjeto() !== slug) return;
        arvore.textContent = e.message;
      }
    }, 300);
  }

  return { recarregar };
}
