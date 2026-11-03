import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function lerFrontmatter(txt) {
  const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const o = {};
  for (const linha of m[1].split(/\r?\n/)) {
    const k = linha.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (k) o[k[1]] = k[2].trim();
  }
  return o;
}

export function listarSkills(repoRoot) {
  const base = join(repoRoot, '.claude', 'skills');
  if (!existsSync(base)) return [];
  const saida = [];
  for (const d of readdirSync(base, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith('_')) continue;
    const arq = join(base, d.name, 'SKILL.md');
    if (!existsSync(arq)) continue;
    const fm = lerFrontmatter(readFileSync(arq, 'utf8'));
    saida.push({ name: d.name, description: fm.description ?? '' });
  }
  return saida.sort((a, b) => a.name.localeCompare(b.name));
}
