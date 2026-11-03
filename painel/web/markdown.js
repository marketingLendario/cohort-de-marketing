const esc = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function inline(texto) {
  // Placeholders (U+0000) protegem code spans e links do reprocessamento.
  const guardados = [];
  const guardar = (html) => `\u0000${guardados.push(html) - 1}\u0000`;
  const formatar = (t) => t
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  let s = esc(String(texto).replace(/\u0000/g, ''));
  s = s.replace(/`([^`]+)`/g, (_, c) => guardar(`<code>${c}</code>`));
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) =>
    guardar(`<a href="${u}" target="_blank" rel="noopener noreferrer">${formatar(t)}</a>`));
  s = formatar(s);
  const volta = /\u0000(\d+)\u0000/g;
  while (volta.test(s)) s = s.replace(volta, (_, n) => guardados[Number(n)]);
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
