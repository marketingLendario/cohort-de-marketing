const esc = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function inline(texto) {
  let s = esc(texto);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return s;
}

const ITEM = /^\s*[-*]\s+/;

export function renderMarkdown(src) {
  const linhas = String(src).replace(/\r\n/g, '\n').split('\n');
  const saida = [];
  let i = 0;
  while (i < linhas.length) {
    const l = linhas[i];
    if (l.startsWith('```')) {
      const bloco = [];
      i++;
      while (i < linhas.length && !linhas[i].startsWith('```')) bloco.push(linhas[i++]);
      i++;
      saida.push(`<pre><code>${esc(bloco.join('\n'))}</code></pre>`);
      continue;
    }
    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      saida.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      i++;
      continue;
    }
    if (ITEM.test(l)) {
      const itens = [];
      while (i < linhas.length && ITEM.test(linhas[i])) {
        itens.push(`<li>${inline(linhas[i++].replace(ITEM, ''))}</li>`);
      }
      saida.push(`<ul>${itens.join('')}</ul>`);
      continue;
    }
    if (!l.trim()) { i++; continue; }
    const par = [];
    while (i < linhas.length && linhas[i].trim() && !/^(#{1,6}\s|```|\s*[-*]\s+)/.test(linhas[i])) {
      par.push(linhas[i++]);
    }
    if (par.length === 0) { par.push(linhas[i++]); }
    saida.push(`<p>${inline(par.join(' '))}</p>`);
  }
  return saida.join('\n');
}
