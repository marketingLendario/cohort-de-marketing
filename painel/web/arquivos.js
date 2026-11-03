import { api, urlApi } from './api.js';
import { renderMarkdown } from './markdown.js';

const IMAGENS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

const extensao = (caminho) => (caminho.includes('.') ? caminho.split('.').pop().toLowerCase() : '');

export function criarArquivos({ arvore, visualizador, obterProjeto }) {
  let timer = null;

  function urlArquivo(slug, caminho) {
    return urlApi(`/api/projetos/${slug}/arquivo`, { path: caminho });
  }

  async function textoDe(slug, caminho) {
    const r = await fetch(urlArquivo(slug, caminho));
    if (!r.ok) throw new Error(`erro ${r.status}`);
    return r.text();
  }

  async function abrirArquivo(slug, caminho) {
    visualizador.replaceChildren();
    const titulo = document.createElement('div');
    titulo.className = 'pequeno';
    titulo.textContent = caminho;
    visualizador.append(titulo);
    const ext = extensao(caminho);
    try {
      if (ext === 'html') {
        const f = document.createElement('iframe');
        f.setAttribute('sandbox', 'allow-scripts');
        f.src = urlArquivo(slug, caminho);
        visualizador.append(f);
      } else if (IMAGENS.has(ext)) {
        const img = document.createElement('img');
        img.src = urlArquivo(slug, caminho);
        img.alt = caminho;
        visualizador.append(img);
      } else if (ext === 'pdf') {
        const a = document.createElement('a');
        a.href = urlArquivo(slug, caminho);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'Abrir PDF em nova aba';
        visualizador.append(a);
      } else if (ext === 'md') {
        const d = document.createElement('div');
        d.innerHTML = renderMarkdown(await textoDe(slug, caminho));
        visualizador.append(d);
      } else {
        let txt = await textoDe(slug, caminho);
        if (ext === 'json') {
          try { txt = JSON.stringify(JSON.parse(txt), null, 2); } catch { /* mostra cru */ }
        }
        const pre = document.createElement('pre');
        pre.textContent = txt;
        visualizador.append(pre);
      }
    } catch (e) {
      const erro = document.createElement('div');
      erro.className = 'msg erro';
      erro.textContent = e.message;
      visualizador.append(erro);
    }
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
        visualizador.replaceChildren();
        return;
      }
      try {
        const { itens } = await api(`/api/projetos/${slug}/arquivos`);
        desenhar(slug, itens);
      } catch (e) {
        arvore.textContent = e.message;
      }
    }, 300);
  }

  return { recarregar };
}
