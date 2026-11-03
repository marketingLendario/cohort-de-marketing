import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fake-claude.mjs');

export function criarRepo() {
  const repoRoot = mkdtempSync(join(tmpdir(), 'painel-repo-'));
  const skill = join(repoRoot, '.claude', 'skills', 'avatar-funil');
  mkdirSync(skill, { recursive: true });
  writeFileSync(join(skill, 'SKILL.md'),
    '---\nname: avatar-funil\ndescription: Avatar de teste\n---\n');
  mkdirSync(join(repoRoot, 'projetos', 'demo'), { recursive: true });
  return repoRoot;
}

export async function esperar(cond, ms = 5000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    const v = await cond();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('timeout esperando condicao');
}

export function novoManager(RunManager, repoRoot) {
  return new RunManager({ repoRoot, claudeBin: process.execPath, claudeBaseArgs: [FAKE] });
}
