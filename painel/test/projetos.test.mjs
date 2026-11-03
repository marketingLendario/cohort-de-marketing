import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listarProjetos, projetoDir } from '../lib/projetos.mjs';
import { listarArquivos, lerArquivo } from '../lib/arquivos.mjs';
import { listarSkills, lerFrontmatter } from '../lib/skills.mjs';
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

test('lerArquivo bloqueia .painel via symlink, caixa e barra invertida', () => {
  const r = repo();
  const dir = projetoDir(r, 'alfa');
  symlinkSync(join(dir, '.painel'), join(dir, 'atalho'), 'dir');
  assert.throws(() => lerArquivo(dir, 'atalho/meta.json'), CaminhoInvalido);
  assert.throws(() => lerArquivo(dir, '.PAINEL/meta.json'), (e) => e instanceof CaminhoInvalido || e.code === 'ENOENT');
  assert.throws(() => lerArquivo(dir, '.painel\\meta.json'), (e) => e instanceof CaminhoInvalido || e.code === 'ENOENT');
});

test('lerFrontmatter remove aspas, suporta blocos | e > e mantém sem aspas', () => {
  assert.equal(lerFrontmatter('---\ndescription: "Estrutura X"\n---\n').description, 'Estrutura X');
  assert.equal(lerFrontmatter("---\ndescription: 'Estrutura Y'\n---\n").description, 'Estrutura Y');
  assert.equal(lerFrontmatter('---\nname: a\ndescription: |\n  linha um\n  linha dois\n\nother: z\n---\n').description, 'linha um linha dois');
  assert.equal(lerFrontmatter('---\ndescription: >-\n  linha um\n  linha dois\nname: a\n---\n').description, 'linha um linha dois');
  assert.equal(lerFrontmatter('---\ndescription: >\n  a\n  b\n---\n').description, 'a b');
  assert.equal(lerFrontmatter('---\ndescription: Sem aspas\n---\n').description, 'Sem aspas');
});

test('listarSkills remove aspas da description', () => {
  const r = repo();
  mkdirSync(join(r, '.claude', 'skills', 'quote'), { recursive: true });
  writeFileSync(join(r, '.claude', 'skills', 'quote', 'SKILL.md'), '---\nname: quote\ndescription: "Com aspas"\n---\n');
  assert.equal(listarSkills(r).find((s) => s.name === 'quote').description, 'Com aspas');
});

test('projetoDir rejeita arquivo regular com nome de slug valido', () => {
  const r = repo();
  assert.throws(() => projetoDir(r, 'solto.txt'), CaminhoInvalido);
});

test('lerFrontmatter colapsa descricao multiparagrafo (formato real do copy-funil) e continuacao de escalar simples', () => {
  const d = lerFrontmatter('---\nname: copy-funil\ndescription: |\n  A FUNDACAO da copy\n  do funil.\n\n  O resultado vira a fonte.\n---\n').description;
  assert.equal(d, 'A FUNDACAO da copy do funil. O resultado vira a fonte.');
  assert.equal(lerFrontmatter('---\ndescription: foo\n  bar\nname: x\n---\n').description, 'foo bar');
});
