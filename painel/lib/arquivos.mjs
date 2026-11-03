import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { resolveInside, CaminhoInvalido } from './paths.mjs';

const IGNORAR = new Set(['.painel', '.git', 'node_modules']);
const MAX_BYTES = 5 * 1024 * 1024;
const MIME = {
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export function listarArquivos(dir, { maxProfundidade = 6, maxItens = 2000 } = {}) {
  const itens = [];
  const andar = (abs, rel, nivel) => {
    if (nivel > maxProfundidade) return;
    const entradas = readdirSync(abs, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const d of entradas) {
      if (itens.length >= maxItens) return;
      if (IGNORAR.has(d.name) || d.isSymbolicLink()) continue;
      const r = rel ? `${rel}/${d.name}` : d.name;
      if (d.isDirectory()) {
        itens.push({ path: r, tipo: 'dir' });
        andar(join(abs, d.name), r, nivel + 1);
      } else if (d.isFile()) {
        itens.push({ path: r, tipo: 'arquivo', tamanho: statSync(join(abs, d.name)).size });
      }
    }
  };
  andar(dir, '', 0);
  return itens;
}

export function lerArquivo(dir, rel) {
  if (typeof rel !== 'string' || rel.split('/').some((p) => IGNORAR.has(p))) {
    throw new CaminhoInvalido('caminho nao permitido');
  }
  const abs = resolveInside(dir, rel);
  const st = statSync(abs);
  if (!st.isFile()) throw new CaminhoInvalido('nao e arquivo');
  if (st.size > MAX_BYTES) throw new CaminhoInvalido('arquivo grande demais');
  return {
    conteudo: readFileSync(abs),
    mime: MIME[extname(abs).toLowerCase()] ?? 'application/octet-stream',
  };
}
