import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function tirarAspas(v) {
  const m = v.match(/^(["'])([\s\S]*)\1$/);
  return m ? m[2] : v;
}

export function lerFrontmatter(txt) {
  const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const o = {};
  const linhas = m[1].split(/\r?\n/);
  for (let i = 0; i < linhas.length; i++) {
    const k = linhas[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!k) continue;
    const v = k[2].trim();
    const bloco = v.match(/^([|>])[+-]?$/);
    if (bloco) {
      const corpo = [];
      while (i + 1 < linhas.length && (/^\s/.test(linhas[i + 1]) || linhas[i + 1] === '')) {
        corpo.push(linhas[++i].trim());
      }
      o[k[1]] = corpo.join(' ').replace(/\s+/g, ' ').trim();
    } else {
      const partes = [v];
      while (i + 1 < linhas.length && /^\s+\S/.test(linhas[i + 1])) partes.push(linhas[++i].trim());
      o[k[1]] = partes.length > 1 ? partes.join(' ').replace(/\s+/g, ' ').trim() : tirarAspas(v);
    }
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
