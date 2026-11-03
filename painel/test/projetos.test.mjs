import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listarProjetos, projetoDir } from '../lib/projetos.mjs';
import { listarArquivos, lerArquivo } from '../lib/arquivos.mjs';
import { listarSkills } from '../lib/skills.mjs';
import { CaminhoInvalido } from '../lib/paths.mjs';

function repo() {
  const r = mkdtempSync(join(tmpdir(), 'painel-proj-'));
  mkdirSync(join(r, 'projetos', 'beta', 'sub'), { recursive: true });
  mkdirSync(join(r, 'projetos', 'alfa', '.painel'), { recursive: true });
  writeFileSync(join(r, 'projetos', 'beta', 'sub', 'nota.md'), '# Oi');
  writeFileSync(join(r, 'projetos', 'beta', 'dados.json'), '{"a":1}');
  writeFileSync(join(r, 'projetos', 'alfa', '.painel', 'meta.json'), '{}');
  writeFileSync(join(r, 'projetos', 'solto.txt'), 'nao e projeto');
  mkdirSync(join(r, '.claude', 'skills', 'avatar-funil'), { recursive: true });
  mkdirSync(join(r, '.claude', 'skills', '_shared'), { recursive: true });
  writeFileSync(join(r, '.claude', 'skills', 'avatar-funil', 'SKILL.md'),
    '---\nname: avatar-funil\ndescription: Faz pesquisa de avatar\n---\n# corpo');
  return r;
}

test('listarProjetos devolve só diretórios, ordenados', () => {
  assert.deepEqual(listarProjetos(repo()), [{ slug: 'alfa' }, { slug: 'beta' }]);
});

test('listarProjetos sem pasta projetos devolve vazio', () => {
  assert.deepEqual(listarProjetos(mkdtempSync(join(tmpdir(), 'painel-vazio-'))), []);
});

test('projetoDir valida slug e existência', () => {
  const r = repo();
  assert.ok(projetoDir(r, 'beta').endsWith('beta'));
  assert.throws(() => projetoDir(r, '../x'), CaminhoInvalido);
  assert.throws(() => projetoDir(r, 'nao-existe'), CaminhoInvalido);
});

test('listarArquivos usa paths relativos e ignora .painel', () => {
  const r = repo();
  const caminhos = listarArquivos(projetoDir(r, 'beta')).map((i) => i.path);
  assert.deepEqual(caminhos, ['dados.json', 'sub', 'sub/nota.md']);
  assert.deepEqual(listarArquivos(projetoDir(r, 'alfa')), []);
});

test('lerArquivo devolve conteúdo e mime; bloqueia .painel e ..', () => {
  const r = repo();
  const a = lerArquivo(projetoDir(r, 'beta'), 'sub/nota.md');
  assert.equal(a.conteudo.toString(), '# Oi');
  assert.match(a.mime, /^text\/markdown/);
  assert.throws(() => lerArquivo(projetoDir(r, 'alfa'), '.painel/meta.json'), CaminhoInvalido);
  assert.throws(() => lerArquivo(projetoDir(r, 'beta'), '../alfa/x'), CaminhoInvalido);
  assert.throws(() => lerArquivo(projetoDir(r, 'beta'), 'sub'), CaminhoInvalido);
});

test('listarSkills lê frontmatter e ignora _shared', () => {
  assert.deepEqual(listarSkills(repo()),
    [{ name: 'avatar-funil', description: 'Faz pesquisa de avatar' }]);
});
