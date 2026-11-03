import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resolveInside, CaminhoInvalido } from './paths.mjs';

export const SLUG_RE = /^[a-z0-9][a-z0-9._-]*$/i;

export function listarProjetos(repoRoot) {
  const base = join(repoRoot, 'projetos');
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && SLUG_RE.test(d.name))
    .map((d) => ({ slug: d.name }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function projetoDir(repoRoot, slug) {
  const base = join(repoRoot, 'projetos');
  if (typeof slug !== 'string' || !SLUG_RE.test(slug) || !existsSync(base)) {
    throw new CaminhoInvalido('projeto inválido');
  }
  // Em sistemas de arquivos que ignoram maiúsculas (macOS), "DEMO" abriria "demo":
  // exigir o nome exato do diretório mantém um único slug canônico por projeto.
  if (!listarProjetos(repoRoot).some((p) => p.slug === slug)) {
    throw new CaminhoInvalido('projeto não encontrado');
  }
  const dir = resolveInside(base, slug);
  let st;
  try { st = statSync(dir); } catch { throw new CaminhoInvalido('projeto não encontrado'); }
  if (!st.isDirectory()) throw new CaminhoInvalido('projeto não encontrado');
  return dir;
}
