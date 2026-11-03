# Painel local (núcleo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Painel HTML local que roda as skills do cohort pelo Claude Code em modo headless, com streaming ao vivo, perguntas respondidas na tela e visualizador dos arquivos de `projetos/{slug}/`.

**Architecture:** Servidor Node sem dependências (`painel/server.mjs`) escuta só em `127.0.0.1`, serve um frontend HTML/JS puro (`painel/web/`) e expõe uma API HTTP local. Um `RunManager` dispara `claude -p ... --output-format stream-json --verbose` (continuação com `--resume <session_id>`), normaliza o stream, grava o log de cada run em `projetos/{slug}/.painel/runs/` e retransmite por SSE. Uma fila por projeto garante uma skill por vez em cada projeto.

**Tech Stack:** Node 22+ (ESM, `node:test`, `node:http`, `node:child_process`), HTML/CSS/JS puro. Zero dependências npm.

**Spec:** `docs/superpowers/specs/2026-11-03-painel-local-nucleo-design.md`

## Global Constraints

- Node 22 ou superior; nenhuma dependência npm nova (só módulos `node:*`).
- Servidor escuta somente em `127.0.0.1`; requisições com `Host` diferente de `127.0.0.1:{porta}` ou `localhost:{porta}` são rejeitadas (403).
- Toda rota `/api/*` exige o token da inicialização (header `x-painel-token` ou query `token`). Isso é mais estrito que o spec (que pedia token só para requisições que alteram estado); a mudança é intencional porque o visualizador de arquivos também expõe dados do projeto. POSTs exigem `Content-Type: application/json` e, se houver `Origin`, ele deve ser `http://{host}`.
- Todo caminho de arquivo é resolvido por `resolveInside` e rejeita `..`, caminhos absolutos, byte nulo e symlinks que saiam da base.
- Estado do projeto = arquivos de `projetos/{slug}/` (diretório já ignorado pelo git). Metadados do painel em `projetos/{slug}/.painel/` (nunca listado nem servido pela API de arquivos).
- Uma skill por vez por projeto (fila); projetos diferentes rodam em paralelo.
- Português com acentuação correta na interface e nas mensagens; sem emoji.
- Código em português nos identificadores de domínio, como o restante do repositório.
- Testes com `node --test`; runner testado com `claude` falso (`painel/test/fake-claude.mjs`), sem gastar tokens.
- Mensagens de commit terminam com a linha `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Trabalhar numa branch (`feat/painel-local-nucleo`), nunca direto na `main`.

## File Structure

```
painel/
  package.json                 type=module, script de teste
  server.mjs                   HTTP, rotas, estáticos, SSE, main
  README.md                    como rodar
  lib/
    paths.mjs                  resolveInside, CaminhoInvalido
    projetos.mjs               listarProjetos, projetoDir
    arquivos.mjs               listarArquivos, lerArquivo
    skills.mjs                 listarSkills
    stream.mjs                 parseLinha (stream-json -> eventos normalizados)
    runlog.mjs                 persistência de meta e eventos de um run
    runner.mjs                 RunManager, ErroRequisicao, montarPrompt
    auth.mjs                   criarToken, tokenValido, hostPermitido
    diagnostico.mjs            diagnosticar
  web/
    index.html  style.css
    api.js                     token + fetch
    markdown.js                renderMarkdown (escapa HTML)
    runs.js                    visão do run (SSE, perguntas, resposta)
    arquivos.js                árvore + visualizador
    app.js                     bootstrap, sidebar, nova execução
  test/
    helpers.mjs  fake-claude.mjs
    paths.test.mjs  projetos.test.mjs  stream.test.mjs  runlog.test.mjs
    runner.test.mjs  auth.test.mjs  diagnostico.test.mjs  server.test.mjs
    markdown.test.mjs
```

---

### Task 1: Scaffold e proteção de caminhos

**Files:**
- Create: `painel/package.json`
- Create: `painel/lib/paths.mjs`
- Test: `painel/test/paths.test.mjs`

**Interfaces:**
- Produces: `class CaminhoInvalido extends Error`; `resolveInside(base: string, rel: string): string` (caminho absoluto real, dentro de `base`; lança `CaminhoInvalido`).

- [ ] **Step 1: Criar a branch e o package.json**

```bash
git switch -c feat/painel-local-nucleo
mkdir -p painel/lib painel/web painel/test
```

`painel/package.json`:

```json
{
  "name": "painel-local",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.mjs",
    "test": "node --test \"test/**/*.test.mjs\""
  }
}
```

- [ ] **Step 2: Escrever o teste que falha**

`painel/test/paths.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveInside, CaminhoInvalido } from '../lib/paths.mjs';

function fixture() {
  const raiz = mkdtempSync(join(tmpdir(), 'painel-paths-'));
  const base = join(raiz, 'base');
  const fora = join(raiz, 'fora');
  mkdirSync(base);
  mkdirSync(fora);
  writeFileSync(join(base, 'ok.txt'), 'ok');
  writeFileSync(join(fora, 'segredo.txt'), 'x');
  return { base, fora };
}

test('aceita arquivo dentro da base', () => {
  const { base } = fixture();
  assert.ok(resolveInside(base, 'ok.txt').endsWith('ok.txt'));
});

test('aceita caminho inexistente dentro da base', () => {
  const { base } = fixture();
  assert.ok(resolveInside(base, 'novo/arquivo.md').endsWith('arquivo.md'));
});

test('rejeita ..', () => {
  const { base } = fixture();
  assert.throws(() => resolveInside(base, '../fora/segredo.txt'), CaminhoInvalido);
});

test('rejeita caminho absoluto', () => {
  const { base, fora } = fixture();
  assert.throws(() => resolveInside(base, join(fora, 'segredo.txt')), CaminhoInvalido);
});

test('rejeita byte nulo', () => {
  const { base } = fixture();
  assert.throws(() => resolveInside(base, 'ok.txt\0.png'), CaminhoInvalido);
});

test('rejeita symlink que escapa da base', () => {
  const { base, fora } = fixture();
  symlinkSync(fora, join(base, 'atalho'));
  assert.throws(() => resolveInside(base, 'atalho/segredo.txt'), CaminhoInvalido);
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd painel && node --test test/paths.test.mjs`
Expected: FAIL com `Cannot find module '../lib/paths.mjs'`.

- [ ] **Step 4: Implementar**

`painel/lib/paths.mjs`:

```js
import { realpathSync } from 'node:fs';
import { resolve, sep, isAbsolute } from 'node:path';

export class CaminhoInvalido extends Error {}

export function resolveInside(base, rel) {
  if (typeof rel !== 'string' || rel.includes('\0') || isAbsolute(rel)) {
    throw new CaminhoInvalido('caminho invalido');
  }
  const baseReal = realpathSync(base);
  const alvo = resolve(baseReal, rel);
  let real;
  try {
    real = realpathSync(alvo);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    real = alvo;
  }
  if (real !== baseReal && !real.startsWith(baseReal + sep)) {
    throw new CaminhoInvalido('fora do diretorio permitido');
  }
  return real;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd painel && node --test test/paths.test.mjs`
Expected: PASS (6 testes).

- [ ] **Step 6: Commit**

```bash
git add painel/package.json painel/lib/paths.mjs painel/test/paths.test.mjs
git commit -m "feat(painel): scaffold e protecao de caminhos" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Projetos, arquivos e skills

**Files:**
- Create: `painel/lib/projetos.mjs`
- Create: `painel/lib/arquivos.mjs`
- Create: `painel/lib/skills.mjs`
- Test: `painel/test/projetos.test.mjs`

**Interfaces:**
- Consumes: `resolveInside`, `CaminhoInvalido` de `./paths.mjs`.
- Produces:
  - `SLUG_RE: RegExp`; `listarProjetos(repoRoot): {slug: string}[]`; `projetoDir(repoRoot, slug): string` (lança `CaminhoInvalido`).
  - `listarArquivos(dir): {path: string, tipo: 'dir'|'arquivo', tamanho?: number}[]` (paths POSIX relativos; ignora `.painel`, `.git`, `node_modules`, symlinks).
  - `lerArquivo(dir, rel): {conteudo: Buffer, mime: string}` (lança `CaminhoInvalido`; `ENOENT` se não existe).
  - `listarSkills(repoRoot): {name: string, description: string}[]`.

- [ ] **Step 1: Escrever o teste que falha**

`painel/test/projetos.test.mjs`:

```js
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd painel && node --test test/projetos.test.mjs`
Expected: FAIL com `Cannot find module '../lib/projetos.mjs'`.

- [ ] **Step 3: Implementar**

`painel/lib/projetos.mjs`:

```js
import { existsSync, readdirSync } from 'node:fs';
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
    throw new CaminhoInvalido('projeto invalido');
  }
  const dir = resolveInside(base, slug);
  if (!existsSync(dir)) throw new CaminhoInvalido('projeto nao encontrado');
  return dir;
}
```

`painel/lib/arquivos.mjs`:

```js
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
```

`painel/lib/skills.mjs`:

```js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd painel && node --test test/projetos.test.mjs`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add painel/lib/projetos.mjs painel/lib/arquivos.mjs painel/lib/skills.mjs painel/test/projetos.test.mjs
git commit -m "feat(painel): listagem de projetos, arquivos e skills" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Parser do stream-json

**Files:**
- Create: `painel/lib/stream.mjs`
- Test: `painel/test/stream.test.mjs`

**Interfaces:**
- Produces: `parseLinha(linha: string): Evento[]` onde `Evento` é um de:
  - `{tipo:'init', sessionId}`
  - `{tipo:'texto', texto}`
  - `{tipo:'ferramenta', nome, entrada}`
  - `{tipo:'pergunta', perguntas: object[]}` (tool `AskUserQuestion`)
  - `{tipo:'resultado', ok: boolean, texto, sessionId, custoUsd: number|null, negacoes: object[]}`
  - Linhas inválidas, hooks, `rate_limit_event`, `post_turn_summary` e `user` geram `[]`.

Os formatos abaixo foram capturados de uma execução real do `claude` 2.1.185 (`system/init` com `session_id`; `assistant` com `message.content[]`; `result` com `subtype`, `is_error`, `result`, `session_id`, `total_cost_usd`).

- [ ] **Step 1: Escrever o teste que falha**

`painel/test/stream.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLinha } from '../lib/stream.mjs';

const l = (o) => JSON.stringify(o);

test('init devolve sessionId', () => {
  assert.deepEqual(parseLinha(l({ type: 'system', subtype: 'init', session_id: 's1' })),
    [{ tipo: 'init', sessionId: 's1' }]);
});

test('assistant com texto e ferramenta gera dois eventos', () => {
  const evs = parseLinha(l({ type: 'assistant', message: { content: [
    { type: 'text', text: 'ola' },
    { type: 'tool_use', name: 'Write', input: { file_path: 'a.md' } },
  ] } }));
  assert.deepEqual(evs, [
    { tipo: 'texto', texto: 'ola' },
    { tipo: 'ferramenta', nome: 'Write', entrada: { file_path: 'a.md' } },
  ]);
});

test('AskUserQuestion vira pergunta', () => {
  const perguntas = [{ question: 'Qual?', options: [{ label: 'A' }] }];
  const evs = parseLinha(l({ type: 'assistant', message: { content: [
    { type: 'tool_use', name: 'AskUserQuestion', input: { questions: perguntas } },
  ] } }));
  assert.deepEqual(evs, [{ tipo: 'pergunta', perguntas }]);
});

test('result de sucesso e de erro', () => {
  const ok = parseLinha(l({ type: 'result', subtype: 'success', is_error: false,
    result: 'feito', session_id: 's1', total_cost_usd: 0.09 }));
  assert.deepEqual(ok, [{ tipo: 'resultado', ok: true, texto: 'feito', sessionId: 's1',
    custoUsd: 0.09, negacoes: [] }]);
  const erro = parseLinha(l({ type: 'result', subtype: 'error_during_execution',
    is_error: true, result: 'quebrou', session_id: 's1' }));
  assert.equal(erro[0].ok, false);
  assert.equal(erro[0].custoUsd, null);
});

test('ignora hooks, rate limit, lixo e linhas vazias', () => {
  assert.deepEqual(parseLinha(l({ type: 'system', subtype: 'hook_started' })), []);
  assert.deepEqual(parseLinha(l({ type: 'rate_limit_event' })), []);
  assert.deepEqual(parseLinha('nao e json'), []);
  assert.deepEqual(parseLinha(''), []);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd painel && node --test test/stream.test.mjs`
Expected: FAIL com `Cannot find module '../lib/stream.mjs'`.

- [ ] **Step 3: Implementar**

`painel/lib/stream.mjs`:

```js
export function parseLinha(linha) {
  let o;
  try {
    o = JSON.parse(linha);
  } catch {
    return [];
  }
  if (!o || typeof o !== 'object') return [];

  if (o.type === 'system' && o.subtype === 'init') {
    return [{ tipo: 'init', sessionId: o.session_id }];
  }

  if (o.type === 'assistant' && Array.isArray(o.message?.content)) {
    const saida = [];
    for (const b of o.message.content) {
      if (b.type === 'text' && b.text) {
        saida.push({ tipo: 'texto', texto: b.text });
      } else if (b.type === 'tool_use') {
        if (b.name === 'AskUserQuestion') {
          saida.push({ tipo: 'pergunta', perguntas: b.input?.questions ?? [] });
        } else {
          saida.push({ tipo: 'ferramenta', nome: b.name, entrada: b.input });
        }
      }
    }
    return saida;
  }

  if (o.type === 'result') {
    return [{
      tipo: 'resultado',
      ok: o.subtype === 'success' && !o.is_error,
      texto: o.result ?? '',
      sessionId: o.session_id,
      custoUsd: o.total_cost_usd ?? null,
      negacoes: o.permission_denials ?? [],
    }];
  }

  return [];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd painel && node --test test/stream.test.mjs`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add painel/lib/stream.mjs painel/test/stream.test.mjs
git commit -m "feat(painel): parser do stream-json do claude" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Log de runs em disco

**Files:**
- Create: `painel/lib/runlog.mjs`
- Test: `painel/test/runlog.test.mjs`

**Interfaces:**
- Produces (todas recebem `dir` = diretório do projeto):
  - `salvarMeta(dir, meta)`; `lerMeta(dir, id): object|null`
  - `anexarEvento(dir, id, ev)`; `lerEventos(dir, id): object[]`
  - `listarRuns(dir): object[]` (metas, mais recentes primeiro por `criadoEm`)
  - `id` precisa casar `/^[0-9a-f-]{36}$/`, senão `lerMeta`→`null` e `lerEventos`→`[]`.
  - Arquivos: `{dir}/.painel/runs/{id}.meta.json` e `{id}.jsonl`.

- [ ] **Step 1: Escrever o teste que falha**

`painel/test/runlog.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { salvarMeta, lerMeta, anexarEvento, lerEventos, listarRuns } from '../lib/runlog.mjs';

const ID1 = '11111111-1111-1111-1111-111111111111';
const ID2 = '22222222-2222-2222-2222-222222222222';
const dirTemp = () => mkdtempSync(join(tmpdir(), 'painel-log-'));

test('meta salva e lida', () => {
  const dir = dirTemp();
  salvarMeta(dir, { id: ID1, skill: 'a', criadoEm: '2026-01-01T00:00:00Z' });
  assert.equal(lerMeta(dir, ID1).skill, 'a');
  assert.equal(lerMeta(dir, ID2), null);
});

test('eventos são anexados em ordem e linhas corrompidas são ignoradas', () => {
  const dir = dirTemp();
  salvarMeta(dir, { id: ID1, criadoEm: 'x' });
  anexarEvento(dir, ID1, { seq: 0, tipo: 'texto', texto: 'a' });
  anexarEvento(dir, ID1, { seq: 1, tipo: 'texto', texto: 'b' });
  assert.deepEqual(lerEventos(dir, ID1).map((e) => e.texto), ['a', 'b']);
});

test('id inválido não toca o disco', () => {
  const dir = dirTemp();
  assert.equal(lerMeta(dir, '../../etc/passwd'), null);
  assert.deepEqual(lerEventos(dir, '../../etc/passwd'), []);
});

test('listarRuns ordena do mais recente para o mais antigo', () => {
  const dir = dirTemp();
  salvarMeta(dir, { id: ID1, criadoEm: '2026-01-01T00:00:00Z' });
  salvarMeta(dir, { id: ID2, criadoEm: '2026-02-01T00:00:00Z' });
  assert.deepEqual(listarRuns(dir).map((m) => m.id), [ID2, ID1]);
});

test('listarRuns sem pasta devolve vazio', () => {
  assert.deepEqual(listarRuns(dirTemp()), []);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd painel && node --test test/runlog.test.mjs`
Expected: FAIL com `Cannot find module '../lib/runlog.mjs'`.

- [ ] **Step 3: Implementar**

`painel/lib/runlog.mjs`:

```js
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ID_RE = /^[0-9a-f-]{36}$/;
const pasta = (dir) => join(dir, '.painel', 'runs');

export function salvarMeta(dir, meta) {
  mkdirSync(pasta(dir), { recursive: true });
  writeFileSync(join(pasta(dir), `${meta.id}.meta.json`), JSON.stringify(meta, null, 2));
}

export function lerMeta(dir, id) {
  if (!ID_RE.test(id)) return null;
  const arq = join(pasta(dir), `${id}.meta.json`);
  if (!existsSync(arq)) return null;
  try {
    return JSON.parse(readFileSync(arq, 'utf8'));
  } catch {
    return null;
  }
}

export function anexarEvento(dir, id, ev) {
  mkdirSync(pasta(dir), { recursive: true });
  appendFileSync(join(pasta(dir), `${id}.jsonl`), JSON.stringify(ev) + '\n');
}

export function lerEventos(dir, id) {
  if (!ID_RE.test(id)) return [];
  const arq = join(pasta(dir), `${id}.jsonl`);
  if (!existsSync(arq)) return [];
  const eventos = [];
  for (const linha of readFileSync(arq, 'utf8').split('\n')) {
    if (!linha.trim()) continue;
    try {
      eventos.push(JSON.parse(linha));
    } catch {
      /* linha corrompida: ignora */
    }
  }
  return eventos;
}

export function listarRuns(dir) {
  if (!existsSync(pasta(dir))) return [];
  return readdirSync(pasta(dir))
    .filter((f) => f.endsWith('.meta.json'))
    .map((f) => lerMeta(dir, f.slice(0, -'.meta.json'.length)))
    .filter(Boolean)
    .sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd painel && node --test test/runlog.test.mjs`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add painel/lib/runlog.mjs painel/test/runlog.test.mjs
git commit -m "feat(painel): log de runs em disco" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: RunManager (runner, fila, resume, cancelar) com claude falso

**Files:**
- Create: `painel/test/fake-claude.mjs`
- Create: `painel/test/helpers.mjs`
- Create: `painel/lib/runner.mjs`
- Test: `painel/test/runner.test.mjs`

**Interfaces:**
- Consumes: `parseLinha` (Task 3); `listarProjetos`, `projetoDir` (Task 2); `salvarMeta`, `lerMeta`, `anexarEvento`, `lerEventos`, `listarRuns` (Task 4); `CaminhoInvalido`.
- Produces:
  - `class ErroRequisicao extends Error { status: number }`
  - `montarPrompt(skill: string, slug: string, args?: string): string` → `"/{skill} {args}\n\nProjeto ativo: projetos/{slug}"` (sem args: `"/{skill} Projeto ativo: projetos/{slug}"`).
  - `class RunManager({ repoRoot, claudeBin='claude', claudeBaseArgs=[], permissionMode='acceptEdits' })` com:
    - `iniciar({skill, slug, args=''}): meta`
    - `responder(id, texto): meta`
    - `cancelar(id): void`
    - `obter(id): meta|null`
    - `eventos(id): Evento[]` (cada um com `seq`, `ts`)
    - `assinar(id, fn): () => void` (chama `fn(evento)` para eventos novos)
    - `listar(slug): meta[]`
  - `meta = { id, skill, slug, args, sessionId, estado, criadoEm, finalizadoEm, custoUsd, perguntaPendente, erro }`; `estado ∈ na_fila | executando | aguardando_resposta | concluido | erro | cancelado`.
  - Eventos extras emitidos pelo manager: `{tipo:'estado', estado}`, `{tipo:'usuario', texto}`, `{tipo:'erro', mensagem}`.
  - `helpers.mjs`: `FAKE`, `criarRepo(): string`, `esperar(cond, ms?)`, `novoManager(RunManager, repoRoot)`.
  - `fake-claude.mjs`: modo escolhido por token no prompt: `[lento]` (fica vivo até receber SIGTERM), `[erro]` (stderr + exit 1), `[pergunta]` (emite AskUserQuestion); padrão `ok`. Em `--resume X` o texto vira `retomado X: {prompt}`.

- [ ] **Step 1: Criar o claude falso e os helpers**

`painel/test/fake-claude.mjs`:

```js
const args = process.argv.slice(2);
const prompt = args[args.indexOf('-p') + 1] ?? '';
const iResume = args.indexOf('--resume');
const resume = iResume >= 0 ? args[iResume + 1] : null;
const modo = prompt.match(/\[(lento|erro|pergunta)\]/)?.[1] ?? 'ok';
const sessionId = resume ?? 'sess-123';
const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');

if (modo === 'erro') {
  process.stderr.write('falha simulada\n');
  process.exit(1);
}

out({ type: 'system', subtype: 'hook_started' });
out({ type: 'system', subtype: 'init', session_id: sessionId });

if (modo === 'lento') {
  setInterval(() => {}, 1000);
} else {
  const texto = resume ? `retomado ${resume}: ${prompt}` : `rodando ${prompt}`;
  out({ type: 'assistant', session_id: sessionId, message: { content: [{ type: 'text', text: texto }] } });
  out({ type: 'assistant', session_id: sessionId, message: { content: [
    { type: 'tool_use', name: 'Write', input: { file_path: 'x.md' } }] } });
  if (modo === 'pergunta' && !resume) {
    out({ type: 'assistant', session_id: sessionId, message: { content: [
      { type: 'tool_use', name: 'AskUserQuestion', input: { questions: [{
        question: 'Qual nicho?', header: 'Nicho', multiSelect: false,
        options: [{ label: 'A', description: 'a' }, { label: 'B', description: 'b' }] }] } }] } });
  }
  out({ type: 'result', subtype: 'success', is_error: false, result: 'feito',
    session_id: sessionId, total_cost_usd: 0.01 });
}
```

`painel/test/helpers.mjs`:

```js
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
```

- [ ] **Step 2: Escrever o teste que falha**

`painel/test/runner.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunManager, ErroRequisicao, montarPrompt } from '../lib/runner.mjs';
import { lerEventos } from '../lib/runlog.mjs';
import { projetoDir } from '../lib/projetos.mjs';
import { criarRepo, esperar, novoManager } from './helpers.mjs';

const estadoDe = (m, id) => m.obter(id)?.estado;
const textos = (m, id) => m.eventos(id).filter((e) => e.tipo === 'texto').map((e) => e.texto);

test('montarPrompt inclui skill, args e projeto ativo', () => {
  assert.equal(montarPrompt('avatar-funil', 'demo', 'nicho X'),
    '/avatar-funil nicho X\n\nProjeto ativo: projetos/demo');
  assert.equal(montarPrompt('avatar-funil', 'demo'),
    '/avatar-funil Projeto ativo: projetos/demo');
});

test('run simples chega a concluido e grava log em disco', async () => {
  const repo = criarRepo();
  const m = novoManager(RunManager, repo);
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  await esperar(() => estadoDe(m, id) === 'concluido');
  const meta = m.obter(id);
  assert.equal(meta.sessionId, 'sess-123');
  assert.equal(meta.custoUsd, 0.01);
  assert.ok(meta.finalizadoEm);
  assert.match(textos(m, id)[0], /rodando \/avatar-funil/);
  assert.equal(lerEventos(projetoDir(repo, 'demo'), id).length, m.eventos(id).length);
});

test('pergunta leva a aguardando_resposta; responder continua com --resume', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[pergunta]' });
  await esperar(() => estadoDe(m, id) === 'aguardando_resposta');
  assert.equal(m.obter(id).perguntaPendente[0].question, 'Qual nicho?');
  m.responder(id, 'B');
  await esperar(() => estadoDe(m, id) === 'concluido');
  assert.ok(textos(m, id).includes('retomado sess-123: B'));
  assert.equal(m.obter(id).perguntaPendente, null);
});

test('responder durante execução é recusado (409)', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m, id) === 'executando');
  await esperar(() => m.obter(id).sessionId);
  assert.throws(() => m.responder(id, 'oi'), (e) => e instanceof ErroRequisicao && e.status === 409);
  m.cancelar(id);
  await esperar(() => estadoDe(m, id) === 'cancelado');
});

test('falha do processo vira estado erro com a mensagem do stderr', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[erro]' });
  await esperar(() => estadoDe(m, id) === 'erro');
  assert.match(m.obter(id).erro, /falha simulada/);
});

test('binário inexistente vira erro, não exceção', async () => {
  const m = new RunManager({ repoRoot: criarRepo(), claudeBin: '/nao/existe/claude' });
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  await esperar(() => estadoDe(m, id) === 'erro');
  assert.ok(m.obter(id).erro);
});

test('cancelar mata o processo em execução', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m, id) === 'executando');
  m.cancelar(id);
  await esperar(() => estadoDe(m, id) === 'cancelado');
});

test('fila por projeto: segundo run espera o primeiro', async () => {
  const m = novoManager(RunManager, criarRepo());
  const a = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m, a.id) === 'executando');
  const b = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  assert.equal(estadoDe(m, b.id), 'na_fila');
  m.cancelar(a.id);
  await esperar(() => estadoDe(m, b.id) === 'concluido');
});

test('cancelar um run que está na fila', async () => {
  const m = novoManager(RunManager, criarRepo());
  const a = m.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m, a.id) === 'executando');
  const b = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  m.cancelar(b.id);
  assert.equal(estadoDe(m, b.id), 'cancelado');
  m.cancelar(a.id);
  await esperar(() => estadoDe(m, a.id) === 'cancelado');
});

test('validação: skill desconhecida e projeto inválido', () => {
  const m = novoManager(RunManager, criarRepo());
  assert.throws(() => m.iniciar({ skill: 'nao-existe', slug: 'demo' }), ErroRequisicao);
  assert.throws(() => m.iniciar({ skill: '../x', slug: 'demo' }), ErroRequisicao);
  assert.throws(() => m.iniciar({ skill: 'avatar-funil', slug: '../demo' }), ErroRequisicao);
});

test('assinar recebe eventos novos e cancela a assinatura', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  const vistos = [];
  const cancelar = m.assinar(id, (e) => vistos.push(e.tipo));
  await esperar(() => estadoDe(m, id) === 'concluido');
  cancelar();
  assert.ok(vistos.includes('resultado'));
});

test('recupera run do disco; run que estava executando vira erro', async () => {
  const repo = criarRepo();
  const m1 = novoManager(RunManager, repo);
  const { id } = m1.iniciar({ skill: 'avatar-funil', slug: 'demo', args: '[lento]' });
  await esperar(() => estadoDe(m1, id) === 'executando');
  const m2 = novoManager(RunManager, repo);
  assert.equal(m2.obter(id).estado, 'erro');
  assert.match(m2.obter(id).erro, /reiniciado/);
  assert.ok(m2.eventos(id).length > 0);
  m1.cancelar(id);
  await esperar(() => estadoDe(m1, id) === 'cancelado');
});

test('listar devolve os runs do projeto', async () => {
  const m = novoManager(RunManager, criarRepo());
  const { id } = m.iniciar({ skill: 'avatar-funil', slug: 'demo' });
  await esperar(() => estadoDe(m, id) === 'concluido');
  assert.deepEqual(m.listar('demo').map((r) => r.id), [id]);
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd painel && node --test test/runner.test.mjs`
Expected: FAIL com `Cannot find module '../lib/runner.mjs'`.

- [ ] **Step 4: Implementar**

`painel/lib/runner.mjs`:

```js
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CaminhoInvalido } from './paths.mjs';
import { listarProjetos, projetoDir } from './projetos.mjs';
import { parseLinha } from './stream.mjs';
import * as log from './runlog.mjs';

const SKILL_RE = /^[a-z0-9][a-z0-9-]*$/;
const FERRAMENTAS = ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'Skill'];
const TERMINAIS = new Set(['concluido', 'erro', 'cancelado']);

export class ErroRequisicao extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

export function montarPrompt(skill, slug, args = '') {
  const corpo = [args.trim(), `Projeto ativo: projetos/${slug}`].filter(Boolean).join('\n\n');
  return `/${skill} ${corpo}`;
}

export class RunManager {
  #runs = new Map();
  #filas = new Map();

  constructor({ repoRoot, claudeBin = 'claude', claudeBaseArgs = [], permissionMode = 'acceptEdits' }) {
    this.repoRoot = repoRoot;
    this.claudeBin = claudeBin;
    this.claudeBaseArgs = claudeBaseArgs;
    this.permissionMode = permissionMode;
  }

  iniciar({ skill, slug, args = '' }) {
    if (!SKILL_RE.test(skill ?? '') ||
        !existsSync(join(this.repoRoot, '.claude', 'skills', skill, 'SKILL.md'))) {
      throw new ErroRequisicao('skill desconhecida');
    }
    const dir = this.#dirProjeto(slug);
    const meta = {
      id: randomUUID(), skill, slug, args: String(args ?? ''), sessionId: null,
      estado: 'na_fila', criadoEm: new Date().toISOString(), finalizadoEm: null,
      custoUsd: null, perguntaPendente: null, erro: null,
    };
    const run = { meta, dir, eventos: [], ouvintes: new Set(), proc: null, cancelado: false };
    this.#runs.set(meta.id, run);
    log.salvarMeta(dir, meta);
    this.#emitir(run, { tipo: 'estado', estado: 'na_fila' });
    this.#enfileirar(run, montarPrompt(skill, slug, meta.args));
    return { ...meta };
  }

  responder(id, texto) {
    const run = this.#exigir(id);
    if (typeof texto !== 'string' || !texto.trim()) throw new ErroRequisicao('resposta vazia');
    if (run.meta.estado === 'na_fila' || run.meta.estado === 'executando') {
      throw new ErroRequisicao('run em andamento', 409);
    }
    if (!run.meta.sessionId) throw new ErroRequisicao('run sem sessao para continuar', 409);
    run.meta.perguntaPendente = null;
    run.cancelado = false;
    this.#emitir(run, { tipo: 'usuario', texto });
    this.#mudarEstado(run, 'na_fila');
    this.#enfileirar(run, texto);
    return { ...run.meta };
  }

  cancelar(id) {
    const run = this.#exigir(id);
    const fila = this.#filas.get(run.meta.slug);
    const idx = fila ? fila.espera.findIndex((t) => t.run === run) : -1;
    if (idx >= 0) {
      fila.espera.splice(idx, 1);
      this.#mudarEstado(run, 'cancelado');
      return;
    }
    if (run.proc) {
      run.cancelado = true;
      run.proc.kill('SIGTERM');
      return;
    }
    throw new ErroRequisicao('run nao esta em andamento', 409);
  }

  obter(id) {
    const run = this.#carregar(id);
    return run ? { ...run.meta } : null;
  }

  eventos(id) {
    return [...(this.#carregar(id)?.eventos ?? [])];
  }

  assinar(id, fn) {
    const run = this.#exigir(id);
    run.ouvintes.add(fn);
    return () => run.ouvintes.delete(fn);
  }

  listar(slug) {
    return log.listarRuns(this.#dirProjeto(slug));
  }

  // ---- internos ----

  #dirProjeto(slug) {
    try {
      return projetoDir(this.repoRoot, slug);
    } catch (e) {
      if (e instanceof CaminhoInvalido) throw new ErroRequisicao('projeto invalido');
      throw e;
    }
  }

  #exigir(id) {
    const run = this.#carregar(id);
    if (!run) throw new ErroRequisicao('run nao encontrado', 404);
    return run;
  }

  #carregar(id) {
    const emMemoria = this.#runs.get(id);
    if (emMemoria) return emMemoria;
    for (const { slug } of listarProjetos(this.repoRoot)) {
      const dir = projetoDir(this.repoRoot, slug);
      const meta = log.lerMeta(dir, id);
      if (!meta) continue;
      const run = {
        meta, dir, eventos: log.lerEventos(dir, id),
        ouvintes: new Set(), proc: null, cancelado: false,
      };
      this.#runs.set(id, run);
      if (meta.estado === 'na_fila' || meta.estado === 'executando') {
        meta.erro = 'interrompido: o servidor foi reiniciado';
        this.#mudarEstado(run, 'erro');
      }
      return run;
    }
    return null;
  }

  #emitir(run, ev) {
    const completo = { seq: run.eventos.length, ts: Date.now(), ...ev };
    run.eventos.push(completo);
    log.anexarEvento(run.dir, run.meta.id, completo);
    for (const fn of run.ouvintes) fn(completo);
  }

  #mudarEstado(run, estado) {
    run.meta.estado = estado;
    run.meta.finalizadoEm = TERMINAIS.has(estado) ? new Date().toISOString() : null;
    log.salvarMeta(run.dir, run.meta);
    this.#emitir(run, { tipo: 'estado', estado });
  }

  #enfileirar(run, prompt) {
    const slug = run.meta.slug;
    const fila = this.#filas.get(slug) ?? { ativo: null, espera: [] };
    this.#filas.set(slug, fila);
    fila.espera.push({ run, prompt });
    this.#proximo(slug);
  }

  #proximo(slug) {
    const fila = this.#filas.get(slug);
    if (!fila || fila.ativo || fila.espera.length === 0) return;
    const { run, prompt } = fila.espera.shift();
    fila.ativo = run.meta.id;
    this.#executar(run, prompt, fila);
  }

  #executar(run, prompt, fila) {
    run.meta.erro = null;
    this.#mudarEstado(run, 'executando');

    const argv = [
      ...this.claudeBaseArgs, '-p', prompt,
      '--output-format', 'stream-json', '--verbose',
      '--permission-mode', this.permissionMode,
      '--allowedTools', FERRAMENTAS.join(','),
    ];
    if (run.meta.sessionId) argv.push('--resume', run.meta.sessionId);

    let resultado = null;
    let buffer = '';
    let stderr = '';
    let finalizado = false;

    const finalizar = (codigo) => {
      if (finalizado) return;
      finalizado = true;
      run.proc = null;
      if (run.cancelado) {
        this.#mudarEstado(run, 'cancelado');
      } else if (resultado?.ok) {
        this.#mudarEstado(run, run.meta.perguntaPendente ? 'aguardando_resposta' : 'concluido');
      } else {
        run.meta.erro = resultado?.texto || stderr.trim() || `claude saiu com codigo ${codigo}`;
        this.#emitir(run, { tipo: 'erro', mensagem: run.meta.erro });
        this.#mudarEstado(run, 'erro');
      }
      fila.ativo = null;
      this.#proximo(run.meta.slug);
    };

    const tratar = (linha) => {
      for (const ev of parseLinha(linha)) {
        if (ev.tipo === 'init') run.meta.sessionId = ev.sessionId;
        if (ev.tipo === 'pergunta') run.meta.perguntaPendente = ev.perguntas;
        if (ev.tipo === 'resultado') {
          resultado = ev;
          run.meta.custoUsd = (run.meta.custoUsd ?? 0) + (ev.custoUsd ?? 0);
          if (ev.sessionId) run.meta.sessionId = ev.sessionId;
        }
        if (ev.tipo === 'init' || ev.tipo === 'pergunta' || ev.tipo === 'resultado') {
          log.salvarMeta(run.dir, run.meta);
        }
        this.#emitir(run, ev);
      }
    };

    let proc;
    try {
      proc = spawn(this.claudeBin, argv, { cwd: this.repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      stderr = e.message;
      finalizar(null);
      return;
    }
    run.proc = proc;
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (d) => {
      buffer += d;
      let i;
      while ((i = buffer.indexOf('\n')) >= 0) {
        const linha = buffer.slice(0, i);
        buffer = buffer.slice(i + 1);
        if (linha.trim()) tratar(linha);
      }
    });
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (d) => { stderr = (stderr + d).slice(-2000); });
    proc.on('error', (e) => { stderr = e.message; finalizar(null); });
    proc.on('close', (codigo) => {
      if (buffer.trim()) tratar(buffer);
      finalizar(codigo);
    });
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd painel && node --test test/runner.test.mjs`
Expected: PASS (12 testes), processo termina sem ficar pendurado.

- [ ] **Step 6: Commit**

```bash
git add painel/test/fake-claude.mjs painel/test/helpers.mjs painel/lib/runner.mjs painel/test/runner.test.mjs
git commit -m "feat(painel): RunManager com fila por projeto, resume e cancelamento" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Token, host e diagnóstico

**Files:**
- Create: `painel/lib/auth.mjs`
- Create: `painel/lib/diagnostico.mjs`
- Test: `painel/test/auth.test.mjs`
- Test: `painel/test/diagnostico.test.mjs`

**Interfaces:**
- Produces:
  - `criarToken(): string` (48 hex); `tokenValido(esperado: string, recebido: unknown): boolean`; `hostPermitido(host: string|undefined, porta: number): boolean`.
  - `diagnosticar({claudeBin='claude', claudeBaseArgs=[], execFileFn=execFile}={}): Promise<{claudeInstalado: boolean, versao: string|null, logado: boolean|null, problemas: {codigo, mensagem, comando}[]}>`. O e-mail da conta nunca é devolvido.

- [ ] **Step 1: Escrever os testes que falham**

`painel/test/auth.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarToken, tokenValido, hostPermitido } from '../lib/auth.mjs';

test('token tem 48 hex e é aleatório', () => {
  const a = criarToken();
  assert.match(a, /^[0-9a-f]{48}$/);
  assert.notEqual(a, criarToken());
});

test('tokenValido compara com segurança', () => {
  const t = criarToken();
  assert.equal(tokenValido(t, t), true);
  assert.equal(tokenValido(t, t.slice(1)), false);
  assert.equal(tokenValido(t, 'x'.repeat(48)), false);
  assert.equal(tokenValido(t, undefined), false);
  assert.equal(tokenValido(t, null), false);
});

test('hostPermitido só aceita loopback com a porta certa', () => {
  assert.equal(hostPermitido('127.0.0.1:4747', 4747), true);
  assert.equal(hostPermitido('localhost:4747', 4747), true);
  assert.equal(hostPermitido('evil.com', 4747), false);
  assert.equal(hostPermitido('127.0.0.1:9999', 4747), false);
  assert.equal(hostPermitido(undefined, 4747), false);
});
```

`painel/test/diagnostico.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnosticar } from '../lib/diagnostico.mjs';

const exec = (respostas) => (bin, args, opts, cb) => {
  const r = respostas[args[0]];
  if (r instanceof Error) cb(r); else cb(null, r);
};

test('claude ausente gera problema com comando de instalação', async () => {
  const d = await diagnosticar({ execFileFn: exec({ '--version': new Error('ENOENT') }) });
  assert.equal(d.claudeInstalado, false);
  assert.equal(d.problemas[0].codigo, 'claude_ausente');
  assert.match(d.problemas[0].comando, /npm install -g @anthropic-ai\/claude-code/);
});

test('instalado e logado não tem problemas e não vaza e-mail', async () => {
  const d = await diagnosticar({ execFileFn: exec({
    '--version': '2.1.185 (Claude Code)\n',
    auth: JSON.stringify({ loggedIn: true, email: 'a@b.com' }),
  }) });
  assert.equal(d.claudeInstalado, true);
  assert.equal(d.versao, '2.1.185 (Claude Code)');
  assert.equal(d.logado, true);
  assert.deepEqual(d.problemas, []);
  assert.ok(!JSON.stringify(d).includes('a@b.com'));
});

test('sem login gera problema sem_login', async () => {
  const d = await diagnosticar({ execFileFn: exec({
    '--version': '2.1.185\n',
    auth: JSON.stringify({ loggedIn: false }),
  }) });
  assert.equal(d.logado, false);
  assert.equal(d.problemas[0].codigo, 'sem_login');
});

test('auth status ilegível deixa logado null sem derrubar', async () => {
  const d = await diagnosticar({ execFileFn: exec({
    '--version': '2.1.185\n',
    auth: new Error('comando desconhecido'),
  }) });
  assert.equal(d.logado, null);
  assert.deepEqual(d.problemas, []);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd painel && node --test test/auth.test.mjs test/diagnostico.test.mjs`
Expected: FAIL com `Cannot find module`.

- [ ] **Step 3: Implementar**

`painel/lib/auth.mjs`:

```js
import { randomBytes, timingSafeEqual } from 'node:crypto';

export function criarToken() {
  return randomBytes(24).toString('hex');
}

export function tokenValido(esperado, recebido) {
  if (typeof recebido !== 'string') return false;
  const a = Buffer.from(esperado);
  const b = Buffer.from(recebido);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hostPermitido(host, porta) {
  return host === `127.0.0.1:${porta}` || host === `localhost:${porta}`;
}
```

`painel/lib/diagnostico.mjs`:

```js
import { execFile } from 'node:child_process';

export async function diagnosticar({ claudeBin = 'claude', claudeBaseArgs = [], execFileFn = execFile } = {}) {
  const rodar = (args) => new Promise((ok, ko) => {
    execFileFn(claudeBin, [...claudeBaseArgs, ...args], { timeout: 15000 },
      (erro, stdout) => (erro ? ko(erro) : ok(String(stdout))));
  });

  const problemas = [];
  let versao;
  try {
    versao = (await rodar(['--version'])).trim();
  } catch {
    problemas.push({
      codigo: 'claude_ausente',
      mensagem: 'Claude Code não encontrado neste computador.',
      comando: 'npm install -g @anthropic-ai/claude-code',
    });
    return { claudeInstalado: false, versao: null, logado: null, problemas };
  }

  let logado = null;
  try {
    logado = JSON.parse(await rodar(['auth', 'status'])).loggedIn === true;
  } catch {
    logado = null;
  }
  if (logado === false) {
    problemas.push({
      codigo: 'sem_login',
      mensagem: 'Claude Code sem login. Abra o terminal, rode o comando e faça login.',
      comando: 'claude',
    });
  }
  return { claudeInstalado: true, versao, logado, problemas };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd painel && node --test test/auth.test.mjs test/diagnostico.test.mjs`
Expected: PASS (7 testes).

- [ ] **Step 5: Commit**

```bash
git add painel/lib/auth.mjs painel/lib/diagnostico.mjs painel/test/auth.test.mjs painel/test/diagnostico.test.mjs
git commit -m "feat(painel): token, validacao de host e diagnostico do claude" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Servidor HTTP, API e SSE

**Files:**
- Create: `painel/server.mjs`
- Create: `painel/web/index.html` (stub mínimo com `{{TOKEN}}`; substituído na Task 9)
- Test: `painel/test/server.test.mjs`

**Interfaces:**
- Consumes: tudo das Tasks 1–6.
- Produces:
  - `criarServidor({ repoRoot, runManager, token, diagnostico }): http.Server` (`diagnostico: () => Promise<object>`).
  - Rotas (JSON, exceto onde indicado). Erros: `{erro: string}` com status 400/401/403/404/409/415/500.
    - `GET /` e estáticos de `painel/web/` (sem token; `index.html` tem `{{TOKEN}}` substituído)
    - `GET /api/diagnostico` → objeto de `diagnosticar`
    - `GET /api/projetos` → `{projetos:[{slug}]}`
    - `GET /api/skills` → `{skills:[{name,description}]}`
    - `GET /api/projetos/:slug/arquivos` → `{itens:[...]}`
    - `GET /api/projetos/:slug/arquivo?path=` → bytes do arquivo com `content-type` do mime
    - `GET /api/projetos/:slug/runs` → `{runs:[meta]}`
    - `POST /api/runs` `{skill, projeto, args}` → meta
    - `GET /api/runs/:id` → meta
    - `GET /api/runs/:id/events?desde=N` → SSE (`id: seq+1`, `data: <evento json>`), fica aberto
    - `POST /api/runs/:id/resposta` `{texto}` → meta
    - `POST /api/runs/:id/cancelar` `{}` → `{ok:true}`
  - `main`: `node server.mjs` (porta `PAINEL_PORT` ou 4747, tenta até +9; `PAINEL_FAKE=1` usa o claude falso; `PAINEL_CLAUDE_BIN`; `PAINEL_PERMISSION_MODE`; `PAINEL_NO_OPEN=1` não abre o navegador).

- [ ] **Step 1: Stub do index.html**

`painel/web/index.html`:

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="painel-token" content="{{TOKEN}}">
<title>Painel do Funil</title>
</head>
<body>Painel</body>
</html>
```

- [ ] **Step 2: Escrever o teste que falha**

`painel/test/server.test.mjs`:

```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { criarServidor } from '../server.mjs';
import { RunManager } from '../lib/runner.mjs';
import { criarRepo, esperar, novoManager } from './helpers.mjs';

const TOKEN = 't'.repeat(48);
let servidor, base, porta;

before(async () => {
  const repo = criarRepo();
  mkdirSync(join(repo, 'projetos', 'demo', 'sub'), { recursive: true });
  writeFileSync(join(repo, 'projetos', 'demo', 'sub', 'nota.md'), '# Oi');
  writeFileSync(join(repo, 'projetos', 'demo', 'avatar.html'), '<h1>x</h1>');
  servidor = criarServidor({
    repoRoot: repo,
    runManager: novoManager(RunManager, repo),
    token: TOKEN,
    diagnostico: async () => ({ claudeInstalado: true, versao: 'x', logado: true, problemas: [] }),
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  porta = servidor.address().port;
  base = `http://127.0.0.1:${porta}`;
});

after(() => {
  servidor.closeAllConnections();
  servidor.close();
});

async function chamar(caminho, { metodo = 'GET', corpo, headers = {}, token = TOKEN } = {}) {
  const r = await fetch(base + caminho, {
    method: metodo,
    headers: {
      ...(token ? { 'x-painel-token': token } : {}),
      ...(corpo !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  return r;
}

test('GET / entrega o html com o token injetado', async () => {
  const txt = await (await fetch(base + '/')).text();
  assert.ok(txt.includes(TOKEN));
  assert.ok(!txt.includes('{{TOKEN}}'));
});

test('Host estranho é recusado (403)', async () => {
  const status = await new Promise((ok, ko) => {
    http.get({ host: '127.0.0.1', port: porta, path: '/', headers: { host: 'evil.com' } },
      (res) => { res.resume(); ok(res.statusCode); }).on('error', ko);
  });
  assert.equal(status, 403);
});

test('API sem token ou com token errado devolve 401', async () => {
  assert.equal((await chamar('/api/projetos', { token: null })).status, 401);
  assert.equal((await chamar('/api/projetos', { token: 'x'.repeat(48) })).status, 401);
});

test('listas de projetos, skills e diagnóstico', async () => {
  assert.deepEqual((await (await chamar('/api/projetos')).json()).projetos, [{ slug: 'demo' }]);
  assert.equal((await (await chamar('/api/skills')).json()).skills[0].name, 'avatar-funil');
  assert.equal((await (await chamar('/api/diagnostico')).json()).claudeInstalado, true);
});

test('árvore e leitura de arquivo; .. é recusado; html sai com CSP sandbox', async () => {
  const arv = await (await chamar('/api/projetos/demo/arquivos')).json();
  assert.ok(arv.itens.some((i) => i.path === 'sub/nota.md'));
  const md = await chamar('/api/projetos/demo/arquivo?path=sub/nota.md');
  assert.equal(await md.text(), '# Oi');
  assert.equal((await chamar('/api/projetos/demo/arquivo?path=../../x')).status, 400);
  assert.equal((await chamar('/api/projetos/demo/arquivo?path=nao-existe.md')).status, 404);
  const html = await chamar('/api/projetos/demo/arquivo?path=avatar.html');
  assert.match(html.headers.get('content-security-policy'), /sandbox/);
});

test('POST exige JSON e origem local', async () => {
  const semJson = await fetch(`${base}/api/runs`, {
    method: 'POST', headers: { 'x-painel-token': TOKEN, 'content-type': 'text/plain' }, body: '{}',
  });
  assert.equal(semJson.status, 415);
  const outraOrigem = await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'avatar-funil', projeto: 'demo' },
    headers: { origin: 'https://evil.com' },
  });
  assert.equal(outraOrigem.status, 403);
});

test('fluxo completo: iniciar, acompanhar por SSE e listar', async () => {
  const criado = await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'avatar-funil', projeto: 'demo', args: '' },
  });
  assert.equal(criado.status, 200);
  const { id } = await criado.json();

  await esperar(async () => (await (await chamar(`/api/runs/${id}`)).json()).estado === 'concluido');

  const sse = await fetch(`${base}/api/runs/${id}/events?token=${TOKEN}`);
  assert.match(sse.headers.get('content-type'), /text\/event-stream/);
  const leitor = sse.body.getReader();
  const dec = new TextDecoder();
  let txt = '';
  while (!txt.includes('"tipo":"resultado"')) {
    const { value, done } = await leitor.read();
    if (done) break;
    txt += dec.decode(value);
  }
  await leitor.cancel();
  assert.match(txt, /rodando \/avatar-funil/);

  const runs = await (await chamar('/api/projetos/demo/runs')).json();
  assert.equal(runs.runs[0].id, id);
});

test('erros de validação e run inexistente', async () => {
  const ruim = await chamar('/api/runs', {
    metodo: 'POST', corpo: { skill: 'nao-existe', projeto: 'demo' },
  });
  assert.equal(ruim.status, 400);
  assert.equal((await chamar('/api/runs/abc')).status, 404);
  assert.equal((await chamar('/api/runs/abc/cancelar', { metodo: 'POST', corpo: {} })).status, 404);
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd painel && node --test test/server.test.mjs`
Expected: FAIL com `Cannot find module '../server.mjs'`.

- [ ] **Step 4: Implementar**

`painel/server.mjs`:

```js
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CaminhoInvalido, resolveInside } from './lib/paths.mjs';
import { listarProjetos, projetoDir } from './lib/projetos.mjs';
import { listarArquivos, lerArquivo } from './lib/arquivos.mjs';
import { listarSkills } from './lib/skills.mjs';
import { RunManager, ErroRequisicao } from './lib/runner.mjs';
import { criarToken, tokenValido, hostPermitido } from './lib/auth.mjs';
import { diagnosticar } from './lib/diagnostico.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const WEB = join(AQUI, 'web');
const TIPOS_ESTATICOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};
const MAX_CORPO = 100 * 1024;

function json(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function lerCorpo(req) {
  return new Promise((ok, ko) => {
    let tamanho = 0;
    const partes = [];
    req.on('data', (d) => {
      tamanho += d.length;
      if (tamanho > MAX_CORPO) {
        ko(new ErroRequisicao('corpo grande demais', 413));
        req.destroy();
        return;
      }
      partes.push(d);
    });
    req.on('end', () => {
      try {
        const txt = Buffer.concat(partes).toString('utf8');
        ok(txt ? JSON.parse(txt) : {});
      } catch {
        ko(new ErroRequisicao('json invalido'));
      }
    });
    req.on('error', ko);
  });
}

function responderErro(res, e) {
  if (res.headersSent) { res.end(); return; }
  if (e instanceof ErroRequisicao) return json(res, e.status, { erro: e.message });
  if (e instanceof CaminhoInvalido) return json(res, 400, { erro: e.message });
  if (e?.code === 'ENOENT') return json(res, 404, { erro: 'nao encontrado' });
  console.error(e);
  return json(res, 500, { erro: 'erro interno' });
}

export function criarServidor({ repoRoot, runManager, token, diagnostico }) {
  function estatico(res, caminho) {
    const rel = caminho === '/' ? 'index.html' : decodeURIComponent(caminho).replace(/^\/+/, '');
    const abs = resolveInside(WEB, rel);
    if (!existsSync(abs) || !statSync(abs).isFile() || !TIPOS_ESTATICOS[extname(abs)]) {
      throw new ErroRequisicao('nao encontrado', 404);
    }
    let corpo = readFileSync(abs);
    if (rel === 'index.html') corpo = Buffer.from(corpo.toString('utf8').replaceAll('{{TOKEN}}', token));
    res.writeHead(200, { 'content-type': TIPOS_ESTATICOS[extname(abs)], 'cache-control': 'no-store' });
    res.end(corpo);
  }

  function servirArquivo(res, slug, rel) {
    const { conteudo, mime } = lerArquivo(projetoDir(repoRoot, slug), rel);
    const cabecalhos = { 'content-type': mime, 'x-content-type-options': 'nosniff', 'cache-control': 'no-store' };
    if (mime.startsWith('text/html')) cabecalhos['content-security-policy'] = 'sandbox allow-scripts';
    else if (mime !== 'application/pdf') cabecalhos['content-security-policy'] = 'sandbox';
    res.writeHead(200, cabecalhos);
    res.end(conteudo);
  }

  function sse(req, res, id, desde) {
    const historico = runManager.eventos(id);
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    });
    const enviar = (ev) => res.write(`id: ${ev.seq + 1}\ndata: ${JSON.stringify(ev)}\n\n`);
    for (const ev of historico.slice(desde)) enviar(ev);
    const cancelar = runManager.assinar(id, enviar);
    const batimento = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => { clearInterval(batimento); cancelar(); });
  }

  async function tratar(req, res) {
    const porta = servidor.address().port;
    if (!hostPermitido(req.headers.host, porta)) throw new ErroRequisicao('host nao permitido', 403);
    const url = new URL(req.url, `http://127.0.0.1:${porta}`);
    const caminho = url.pathname;

    if (!caminho.startsWith('/api/')) {
      if (req.method !== 'GET') throw new ErroRequisicao('metodo nao permitido', 405);
      return estatico(res, caminho);
    }

    const recebido = req.headers['x-painel-token'] ?? url.searchParams.get('token');
    if (!tokenValido(token, recebido)) throw new ErroRequisicao('token invalido', 401);

    if (req.method === 'POST') {
      const origem = req.headers.origin;
      if (origem && origem !== `http://${req.headers.host}`) throw new ErroRequisicao('origem nao permitida', 403);
      if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) {
        throw new ErroRequisicao('use application/json', 415);
      }
    }

    let m;
    if (req.method === 'GET') {
      if (caminho === '/api/diagnostico') return json(res, 200, await diagnostico());
      if (caminho === '/api/projetos') return json(res, 200, { projetos: listarProjetos(repoRoot) });
      if (caminho === '/api/skills') return json(res, 200, { skills: listarSkills(repoRoot) });
      if ((m = caminho.match(/^\/api\/projetos\/([^/]+)\/arquivos$/))) {
        return json(res, 200, { itens: listarArquivos(projetoDir(repoRoot, m[1])) });
      }
      if ((m = caminho.match(/^\/api\/projetos\/([^/]+)\/arquivo$/))) {
        return servirArquivo(res, m[1], url.searchParams.get('path') ?? '');
      }
      if ((m = caminho.match(/^\/api\/projetos\/([^/]+)\/runs$/))) {
        return json(res, 200, { runs: runManager.listar(m[1]) });
      }
      if ((m = caminho.match(/^\/api\/runs\/([^/]+)$/))) {
        const meta = runManager.obter(m[1]);
        if (!meta) throw new ErroRequisicao('run nao encontrado', 404);
        return json(res, 200, meta);
      }
      if ((m = caminho.match(/^\/api\/runs\/([^/]+)\/events$/))) {
        if (!runManager.obter(m[1])) throw new ErroRequisicao('run nao encontrado', 404);
        const desde = Number(url.searchParams.get('desde') ?? req.headers['last-event-id'] ?? 0) || 0;
        return sse(req, res, m[1], desde);
      }
    }

    if (req.method === 'POST') {
      if (caminho === '/api/runs') {
        const c = await lerCorpo(req);
        return json(res, 200, runManager.iniciar({ skill: c.skill, slug: c.projeto, args: c.args ?? '' }));
      }
      if ((m = caminho.match(/^\/api\/runs\/([^/]+)\/resposta$/))) {
        const c = await lerCorpo(req);
        return json(res, 200, runManager.responder(m[1], c.texto));
      }
      if ((m = caminho.match(/^\/api\/runs\/([^/]+)\/cancelar$/))) {
        await lerCorpo(req);
        runManager.cancelar(m[1]);
        return json(res, 200, { ok: true });
      }
    }

    throw new ErroRequisicao('rota nao encontrada', 404);
  }

  const servidor = createServer((req, res) => {
    tratar(req, res).catch((e) => responderErro(res, e));
  });
  return servidor;
}

// ---- execução direta ----

function ouvir(servidor, porta) {
  return new Promise((ok, ko) => {
    servidor.once('error', ko);
    servidor.listen(porta, '127.0.0.1', () => { servidor.off('error', ko); ok(); });
  });
}

function abrirNavegador(url) {
  const [cmd, args] = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : ['xdg-open', [url]];
  try {
    spawn(cmd, args, { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
  } catch { /* o aluno abre o endereço manualmente */ }
}

async function iniciar() {
  const repoRoot = resolve(AQUI, '..');
  const fake = process.env.PAINEL_FAKE === '1';
  const claudeBin = fake ? process.execPath : (process.env.PAINEL_CLAUDE_BIN ?? 'claude');
  const claudeBaseArgs = fake ? [join(AQUI, 'test', 'fake-claude.mjs')] : [];
  const runManager = new RunManager({
    repoRoot, claudeBin, claudeBaseArgs,
    permissionMode: process.env.PAINEL_PERMISSION_MODE ?? 'acceptEdits',
  });
  const servidor = criarServidor({
    repoRoot, runManager, token: criarToken(),
    diagnostico: () => diagnosticar({ claudeBin, claudeBaseArgs }),
  });
  const inicial = Number(process.env.PAINEL_PORT ?? 4747);
  for (let p = inicial; p < inicial + 10; p++) {
    try {
      await ouvir(servidor, p);
      const url = `http://127.0.0.1:${p}/`;
      console.log(`Painel rodando em ${url}`);
      if (process.env.PAINEL_NO_OPEN !== '1') abrirNavegador(url);
      return;
    } catch (e) {
      if (e.code !== 'EADDRINUSE') throw e;
    }
  }
  console.error(`Nenhuma porta livre entre ${inicial} e ${inicial + 9}.`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  iniciar();
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd painel && node --test test/server.test.mjs`
Expected: PASS (8 testes).

- [ ] **Step 6: Rodar toda a suíte do backend**

Run: `cd painel && npm test`
Expected: PASS em todos os arquivos (paths, projetos, stream, runlog, runner, auth, diagnostico, server).

- [ ] **Step 7: Commit**

```bash
git add painel/server.mjs painel/web/index.html painel/test/server.test.mjs
git commit -m "feat(painel): servidor HTTP com API, SSE, token e protecao de host" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Frontend base — api.js e markdown.js

**Files:**
- Create: `painel/web/api.js`
- Create: `painel/web/markdown.js`
- Test: `painel/test/markdown.test.mjs`

**Interfaces:**
- Produces:
  - `markdown.js`: `renderMarkdown(src: string): string` (HTML seguro: todo texto é escapado; só links `http(s)` viram `<a>`).
  - `api.js` (só roda no navegador): `urlApi(caminho, params?): string` (inclui `token`), `api(caminho, {metodo='GET', corpo, params}?): Promise<object>` (lança `Error` com `erro` do servidor).

- [ ] **Step 1: Escrever o teste que falha**

`painel/test/markdown.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../web/markdown.js';

test('escapa HTML em qualquer posição', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n# <img onerror=x>');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;script&gt;/);
});

test('títulos, listas, ênfase e código', () => {
  const html = renderMarkdown('# Título\n\n- um\n- **dois**\n\ntexto com `cod` e *ênfase*');
  assert.match(html, /<h1>Título<\/h1>/);
  assert.match(html, /<ul><li>um<\/li><li><strong>dois<\/strong><\/li><\/ul>/);
  assert.match(html, /<code>cod<\/code>/);
  assert.match(html, /<em>ênfase<\/em>/);
});

test('bloco de código preserva e escapa o conteúdo', () => {
  const html = renderMarkdown('```\n<b>x</b>\n```');
  assert.match(html, /<pre><code>&lt;b&gt;x&lt;\/b&gt;<\/code><\/pre>/);
});

test('só links http(s) viram âncora', () => {
  assert.match(renderMarkdown('[ok](https://a.com/x)'), /<a href="https:\/\/a.com\/x" target="_blank" rel="noopener noreferrer">ok<\/a>/);
  assert.ok(!renderMarkdown('[mau](javascript:alert(1))').includes('<a '));
});

test('não entra em loop com linhas estranhas', () => {
  assert.doesNotThrow(() => renderMarkdown('#\n#hashtag\n- \n```\nsem fechar'));
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd painel && node --test test/markdown.test.mjs`
Expected: FAIL com `Cannot find module '../web/markdown.js'`.

- [ ] **Step 3: Implementar**

`painel/web/markdown.js`:

```js
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
```

`painel/web/api.js`:

```js
const token = document.querySelector('meta[name="painel-token"]').content;

export function urlApi(caminho, params = {}) {
  const u = new URL(caminho, location.origin);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set('token', token);
  return u.pathname + u.search;
}

export async function api(caminho, { metodo = 'GET', corpo, params } = {}) {
  const headers = { 'x-painel-token': token };
  if (corpo !== undefined) headers['content-type'] = 'application/json';
  const r = await fetch(urlApi(caminho, params), {
    method: metodo,
    headers,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(dados.erro ?? `erro ${r.status}`);
  return dados;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd painel && node --test test/markdown.test.mjs`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add painel/web/api.js painel/web/markdown.js painel/test/markdown.test.mjs
git commit -m "feat(painel): helper de API e renderizador de markdown seguro" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Frontend — shell, nova execução e visão do run

**Files:**
- Modify: `painel/web/index.html` (substitui o stub)
- Create: `painel/web/style.css`
- Create: `painel/web/runs.js`
- Create: `painel/web/app.js`
- Create: `painel/web/arquivos.js` (stub nesta task; completo na Task 10)

**Interfaces:**
- Consumes: `api`, `urlApi` (`api.js`); `renderMarkdown`; rotas da Task 7.
- Produces:
  - `criarVisaoRun({ cabecalho, log, form, aoMudar, aoArquivosMudarem }): { abrir(id): Promise<void>, fechar(): void }`
  - `criarArquivos({ arvore, visualizador, obterProjeto }): { recarregar(): void }` (stub: função vazia)

Frontend não tem teste automatizado; a verificação é feita no navegador com o claude falso (Step 6).

- [ ] **Step 1: index.html**

`painel/web/index.html`:

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="painel-token" content="{{TOKEN}}">
<title>Painel do Funil</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header>
  <h1>Painel do Funil</h1>
  <div id="diag" role="status"></div>
</header>
<main>
  <aside id="lateral">
    <label>Projeto
      <select id="sel-projeto"></select>
    </label>
    <h2>Skills</h2>
    <input id="filtro-skill" type="search" placeholder="Filtrar skills">
    <ul id="lista-skills"></ul>
    <h2>Execuções</h2>
    <ul id="lista-runs"></ul>
  </aside>
  <section id="principal">
    <form id="form-nova" hidden>
      <div><strong id="nova-skill"></strong></div>
      <textarea id="nova-args" rows="3" placeholder="Instruções para a skill (opcional)"></textarea>
      <button type="submit">Rodar</button>
    </form>
    <div id="cabecalho-run"></div>
    <div id="log" aria-live="polite"></div>
    <form id="form-resposta" hidden>
      <textarea rows="2" placeholder="Responda ou peça um ajuste"></textarea>
      <button type="submit">Enviar</button>
    </form>
  </section>
  <aside id="arquivos">
    <h2>Arquivos</h2>
    <ul id="arvore"></ul>
    <div id="visualizador"></div>
  </aside>
</main>
<script type="module" src="/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: style.css**

`painel/web/style.css`:

```css
:root {
  --bg: #fafaf9; --painel: #ffffff; --texto: #1c1917; --suave: #78716c;
  --borda: #e7e5e4; --acento: #1d4ed8; --erro: #b91c1c; --ok: #15803d;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0c0a09; --painel: #1c1917; --texto: #f5f5f4; --suave: #a8a29e;
    --borda: #292524; --acento: #60a5fa; --erro: #f87171; --ok: #4ade80;
  }
}
* { box-sizing: border-box; }
body { margin: 0; font: 15px/1.5 system-ui, sans-serif; background: var(--bg); color: var(--texto); }
header { display: flex; gap: 16px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--borda); background: var(--painel); }
h1 { font-size: 16px; margin: 0; }
h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--suave); margin: 16px 0 6px; }
#diag { font-size: 13px; color: var(--suave); }
#diag.problema { color: var(--erro); }
main { display: grid; grid-template-columns: 260px minmax(0, 1fr) 320px; height: calc(100vh - 49px); }
aside { padding: 12px 16px; overflow: auto; background: var(--painel); }
#lateral { border-right: 1px solid var(--borda); }
#arquivos { border-left: 1px solid var(--borda); }
#principal { display: flex; flex-direction: column; min-width: 0; padding: 12px 16px; gap: 8px; }
select, input, textarea, button { font: inherit; color: inherit; background: var(--bg); border: 1px solid var(--borda); border-radius: 6px; padding: 6px 10px; }
select, input[type=search] { width: 100%; }
textarea { width: 100%; resize: vertical; }
button { cursor: pointer; }
button:hover { border-color: var(--acento); }
button[type=submit] { background: var(--acento); color: #fff; border-color: var(--acento); }
ul { list-style: none; margin: 0; padding: 0; }
#lista-skills { max-height: 38vh; overflow: auto; }
#lista-skills button, #lista-runs button { width: 100%; text-align: left; border: 0; background: none; padding: 4px 6px; border-radius: 4px; }
#lista-skills button:hover, #lista-runs button:hover, #lista-runs button.ativo { background: var(--bg); }
.pequeno { font-size: 12px; color: var(--suave); }
#form-nova { display: grid; gap: 8px; padding: 12px; border: 1px solid var(--borda); border-radius: 8px; background: var(--painel); }
#cabecalho-run { display: flex; gap: 12px; align-items: center; min-height: 28px; }
.estado { font-size: 12px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--borda); }
.estado.executando, .estado.na_fila { color: var(--acento); }
.estado.concluido { color: var(--ok); }
.estado.erro { color: var(--erro); }
.estado.aguardando_resposta { color: #b45309; }
#log { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 8px; padding: 4px 0; }
.msg { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--borda); background: var(--painel); overflow-wrap: anywhere; }
.msg.usuario { align-self: flex-end; background: var(--bg); }
.msg.erro { border-color: var(--erro); color: var(--erro); }
.msg pre { overflow: auto; background: var(--bg); padding: 8px; border-radius: 6px; }
.ferramenta, .resultado { font-size: 12px; color: var(--suave); }
.pergunta { padding: 12px; border: 1px solid var(--acento); border-radius: 8px; background: var(--painel); }
.pergunta .opcoes { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.pergunta .opcoes small { display: block; color: var(--suave); }
#form-resposta { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
#arvore button { border: 0; background: none; padding: 2px 4px; text-align: left; width: 100%; }
#arvore button:hover { background: var(--bg); }
#arvore .dir { color: var(--suave); padding: 2px 4px; }
#visualizador { margin-top: 12px; border-top: 1px solid var(--borda); padding-top: 12px; }
#visualizador iframe { width: 100%; height: 55vh; border: 1px solid var(--borda); background: #fff; }
#visualizador img { max-width: 100%; }
#visualizador pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; }
@media (max-width: 900px) {
  main { grid-template-columns: 1fr; height: auto; }
}
```

- [ ] **Step 3: runs.js**

`painel/web/runs.js`:

```js
import { api, urlApi } from './api.js';
import { renderMarkdown } from './markdown.js';

const ROTULO = {
  na_fila: 'Na fila', executando: 'Executando', aguardando_resposta: 'Aguardando você',
  concluido: 'Concluído', erro: 'Erro', cancelado: 'Cancelado',
};
const PODE_RESPONDER = new Set(['aguardando_resposta', 'concluido', 'erro']);
const ESCREVEM_ARQUIVOS = new Set(['Write', 'Edit', 'Bash']);

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto != null) e.textContent = texto;
  return e;
}

function resumoEntrada(entrada) {
  const v = entrada?.file_path ?? entrada?.command ?? entrada?.pattern ?? entrada?.url ?? '';
  return String(v).slice(0, 100);
}

export function criarVisaoRun({ cabecalho, log, form, aoMudar, aoArquivosMudarem }) {
  let fonte = null;
  let meta = null;
  const campo = form.querySelector('textarea');

  function fechar() {
    fonte?.close();
    fonte = null;
    meta = null;
    cabecalho.replaceChildren();
    log.replaceChildren();
    form.hidden = true;
  }

  function desenharCabecalho() {
    cabecalho.replaceChildren();
    if (!meta) return;
    cabecalho.append(el('strong', '', `/${meta.skill}`),
      el('span', `estado ${meta.estado}`, ROTULO[meta.estado] ?? meta.estado));
    if (meta.estado === 'executando' || meta.estado === 'na_fila') {
      const b = el('button', '', 'Cancelar');
      b.type = 'button';
      b.onclick = () => api(`/api/runs/${meta.id}/cancelar`, { metodo: 'POST', corpo: {} })
        .catch((e) => alert(e.message));
      cabecalho.append(b);
    }
    form.hidden = !(PODE_RESPONDER.has(meta.estado) && meta.sessionId);
  }

  async function atualizarMeta() {
    if (!meta) return;
    meta = await api(`/api/runs/${meta.id}`);
    desenharCabecalho();
    aoMudar();
  }

  async function enviar(texto) {
    try {
      await api(`/api/runs/${meta.id}/resposta`, { metodo: 'POST', corpo: { texto } });
    } catch (e) {
      alert(e.message);
    }
  }

  function desenharPergunta(perguntas) {
    for (const p of perguntas) {
      const caixa = el('div', 'pergunta');
      caixa.append(el('strong', '', p.question ?? 'Escolha uma opção'));
      const opcoes = el('div', 'opcoes');
      for (const o of p.options ?? []) {
        const b = el('button', '', o.label);
        b.type = 'button';
        if (o.description) b.append(el('small', '', o.description));
        b.onclick = () => enviar(o.label);
        opcoes.append(b);
      }
      caixa.append(opcoes);
      log.append(caixa);
    }
  }

  function tratar(ev) {
    switch (ev.tipo) {
      case 'estado':
        atualizarMeta();
        break;
      case 'texto': {
        const d = el('div', 'msg');
        d.innerHTML = renderMarkdown(ev.texto);
        log.append(d);
        break;
      }
      case 'ferramenta':
        log.append(el('div', 'ferramenta', `${ev.nome} ${resumoEntrada(ev.entrada)}`.trim()));
        if (ESCREVEM_ARQUIVOS.has(ev.nome)) aoArquivosMudarem();
        break;
      case 'pergunta':
        desenharPergunta(ev.perguntas);
        break;
      case 'usuario':
        log.append(el('div', 'msg usuario', ev.texto));
        break;
      case 'erro':
        log.append(el('div', 'msg erro', ev.mensagem));
        break;
      case 'resultado':
        log.append(el('div', 'resultado',
          ev.custoUsd != null ? `Fim do turno · custo US$ ${ev.custoUsd.toFixed(2)}` : 'Fim do turno'));
        aoArquivosMudarem();
        break;
      default:
        return;
    }
    log.scrollTop = log.scrollHeight;
  }

  async function abrir(id) {
    fechar();
    meta = await api(`/api/runs/${id}`);
    desenharCabecalho();
    fonte = new EventSource(urlApi(`/api/runs/${id}/events`));
    fonte.onmessage = (m) => tratar(JSON.parse(m.data));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = campo.value.trim();
    if (!texto || !meta) return;
    campo.value = '';
    enviar(texto);
  });

  return { abrir, fechar };
}
```

- [ ] **Step 4: arquivos.js (stub) e app.js**

`painel/web/arquivos.js` (stub, substituído na Task 10):

```js
export function criarArquivos() {
  return { recarregar() {} };
}
```

`painel/web/app.js`:

```js
import { api } from './api.js';
import { criarVisaoRun } from './runs.js';
import { criarArquivos } from './arquivos.js';

const $ = (s) => document.querySelector(s);
const ROTULO = {
  na_fila: 'na fila', executando: 'executando', aguardando_resposta: 'aguardando você',
  concluido: 'concluído', erro: 'erro', cancelado: 'cancelado',
};

let projeto = null;
let skills = [];
let skillEscolhida = null;

const arquivos = criarArquivos({
  arvore: $('#arvore'), visualizador: $('#visualizador'), obterProjeto: () => projeto,
});
const visao = criarVisaoRun({
  cabecalho: $('#cabecalho-run'), log: $('#log'), form: $('#form-resposta'),
  aoMudar: () => carregarRuns(),
  aoArquivosMudarem: () => arquivos.recarregar(),
});

function lembrar(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch { /* sem armazenamento: segue */ }
}
function recordar(chave) {
  try { return localStorage.getItem(chave); } catch { return null; }
}

async function diagnostico() {
  const alvo = $('#diag');
  try {
    const d = await api('/api/diagnostico');
    if (d.problemas.length === 0) {
      alvo.textContent = `Claude Code ${d.versao}`;
      alvo.className = '';
    } else {
      alvo.textContent = d.problemas.map((p) => `${p.mensagem} Comando: ${p.comando}`).join(' · ');
      alvo.className = 'problema';
    }
  } catch (e) {
    alvo.textContent = e.message;
    alvo.className = 'problema';
  }
}

function desenharSkills() {
  const filtro = $('#filtro-skill').value.trim().toLowerCase();
  const lista = $('#lista-skills');
  lista.replaceChildren();
  for (const s of skills.filter((x) => x.name.includes(filtro) || x.description.toLowerCase().includes(filtro))) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.name;
    b.title = s.description;
    b.onclick = () => escolherSkill(s.name);
    li.append(b);
    lista.append(li);
  }
}

function escolherSkill(nome) {
  skillEscolhida = nome;
  $('#nova-skill').textContent = `/${nome}`;
  $('#form-nova').hidden = false;
  $('#nova-args').focus();
}

async function carregarRuns() {
  const lista = $('#lista-runs');
  lista.replaceChildren();
  if (!projeto) return;
  try {
    const { runs } = await api(`/api/projetos/${projeto}/runs`);
    for (const r of runs) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `/${r.skill} · ${ROTULO[r.estado] ?? r.estado}`;
      b.title = new Date(r.criadoEm).toLocaleString('pt-BR');
      b.onclick = () => visao.abrir(r.id);
      li.append(b);
      lista.append(li);
    }
  } catch (e) {
    lista.textContent = e.message;
  }
}

async function trocarProjeto(slug) {
  projeto = slug || null;
  if (projeto) lembrar('painel.projeto', projeto);
  visao.fechar();
  arquivos.recarregar();
  await carregarRuns();
}

$('#sel-projeto').addEventListener('change', (e) => trocarProjeto(e.target.value));
$('#filtro-skill').addEventListener('input', desenharSkills);
$('#form-nova').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!projeto || !skillEscolhida) return;
  try {
    const meta = await api('/api/runs', {
      metodo: 'POST', corpo: { skill: skillEscolhida, projeto, args: $('#nova-args').value },
    });
    $('#nova-args').value = '';
    $('#form-nova').hidden = true;
    await carregarRuns();
    await visao.abrir(meta.id);
  } catch (err) {
    alert(err.message);
  }
});

async function iniciar() {
  diagnostico();
  const [{ projetos }, { skills: lista }] = await Promise.all([api('/api/projetos'), api('/api/skills')]);
  skills = lista;
  desenharSkills();
  const sel = $('#sel-projeto');
  for (const p of projetos) sel.append(new Option(p.slug, p.slug));
  if (projetos.length === 0) {
    sel.append(new Option('(nenhum projeto em projetos/)', ''));
  }
  const ultimo = recordar('painel.projeto');
  if (ultimo && projetos.some((p) => p.slug === ultimo)) sel.value = ultimo;
  await trocarProjeto(sel.value);
  if (projeto) {
    const { runs } = await api(`/api/projetos/${projeto}/runs`);
    const ativo = runs.find((r) => r.estado === 'executando' || r.estado === 'aguardando_resposta');
    if (ativo) visao.abrir(ativo.id);
  }
}

iniciar().catch((e) => { $('#diag').textContent = e.message; $('#diag').className = 'problema'; });
```

- [ ] **Step 5: Garantir que o backend continua passando**

Run: `cd painel && npm test`
Expected: PASS (nenhum teste quebrou; o `index.html` novo ainda contém `{{TOKEN}}`).

- [ ] **Step 6: Verificar no navegador com o claude falso**

```bash
mkdir -p projetos/demo
PAINEL_FAKE=1 PAINEL_NO_OPEN=1 node painel/server.mjs
```

Abrir o endereço impresso no navegador embutido. Conferir, em ordem:
1. Cabeçalho mostra "Claude Code" (ou o problema do diagnóstico com o claude falso: com `PAINEL_FAKE=1` o `--version` não é suportado pelo fake e o diagnóstico mostrará "não encontrado"; isso é esperado e não bloqueia).
2. Seletor mostra `demo`; lista de skills aparece e o filtro funciona.
3. Clicar em `avatar-funil`, digitar `[pergunta]`, Rodar: log mostra texto "rodando /avatar-funil ...", linha da ferramenta `Write x.md`, o cartão "Qual nicho?" com botões A e B, estado "Aguardando você".
4. Clicar em B: aparece a mensagem do usuário, depois "retomado sess-123: B", estado "Concluído".
5. Rodar de novo com `[lento]`: estado "Executando", botão Cancelar funciona, estado "Cancelado".
6. Recarregar a página: lista "Execuções" mostra os runs; clicar em um reabre o log completo.

Expected: todos os 6 itens funcionam; console do navegador sem erros. Parar o servidor com Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add painel/web/index.html painel/web/style.css painel/web/runs.js painel/web/arquivos.js painel/web/app.js
git commit -m "feat(painel): interface com selecao de projeto, execucao de skills e perguntas" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Frontend — árvore de arquivos e visualizador

**Files:**
- Modify: `painel/web/arquivos.js` (substitui o stub)

**Interfaces:**
- Consumes: `api`, `urlApi`; `renderMarkdown`; rotas `/api/projetos/:slug/arquivos` e `/arquivo?path=`.
- Produces: `criarArquivos({ arvore, visualizador, obterProjeto }): { recarregar(): void }` (com debounce de 300 ms; relê a árvore sem fechar o arquivo aberto).

- [ ] **Step 1: Implementar**

`painel/web/arquivos.js`:

```js
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
```

- [ ] **Step 2: Verificar no navegador**

```bash
mkdir -p projetos/demo/sub
printf '# Titulo\n\n- item um\n- **item dois**\n\n<script>alert(1)</script>\n' > projetos/demo/sub/nota.md
printf '{"a":1,"b":[1,2]}' > projetos/demo/dados.json
printf '<h1>Ola do html</h1>' > projetos/demo/pagina.html
PAINEL_FAKE=1 PAINEL_NO_OPEN=1 node painel/server.mjs
```

No navegador, projeto `demo`:
1. A árvore mostra `dados.json`, `pagina.html`, `sub/` e `nota.md` indentado.
2. `nota.md` renderiza título e lista; o `<script>` aparece como texto, sem executar alerta.
3. `dados.json` aparece formatado; `pagina.html` aparece num iframe com "Ola do html".
4. Sem recarregar a página, criar um arquivo em outro terminal (`echo oi > projetos/demo/novo.txt`) e rodar uma skill falsa: ao fim do run a árvore passa a listar `novo.txt` (a atualização é disparada por eventos `Write`/`resultado`).
5. `.painel` não aparece na árvore.

Expected: os 5 itens funcionam. Parar o servidor.

- [ ] **Step 3: Commit**

```bash
git add painel/web/arquivos.js
git commit -m "feat(painel): arvore de arquivos e visualizador (md, html, json, imagem)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: README e verificação ponta a ponta com o Claude Code real

**Files:**
- Create: `painel/README.md`
- Modify (somente se o Step 3 falhar): `painel/lib/runner.mjs` (`montarPrompt`) e `painel/test/runner.test.mjs`

**Interfaces:**
- Consumes: tudo acima.
- Produces: documentação de uso; confirmação (ou correção) de que `/skill` funciona em `claude -p`.

- [ ] **Step 1: Escrever o README**

`painel/README.md`:

````markdown
# Painel local do Funil

Interface HTML que roda as skills do cohort pelo Claude Code, sem usar o terminal para conduzir o trabalho.

## Como rodar

Requisitos: Node 22+ e Claude Code instalado e com login (`claude`).

```bash
node painel/server.mjs
```

O painel abre no navegador em `http://127.0.0.1:4747/` (ou na próxima porta livre). Escolha o projeto de `projetos/{slug}/`, clique numa skill, escreva instruções opcionais e rode. Perguntas da skill viram botões; depois que o turno termina, a caixa de resposta permite pedir ajustes na mesma sessão.

## Variáveis de ambiente

| Variável | Efeito |
|---|---|
| `PAINEL_PORT` | Porta inicial (padrão 4747; tenta até +9) |
| `PAINEL_NO_OPEN=1` | Não abre o navegador |
| `PAINEL_PERMISSION_MODE` | Modo de permissão do Claude Code (padrão `acceptEdits`) |
| `PAINEL_CLAUDE_BIN` | Caminho alternativo do executável `claude` |
| `PAINEL_FAKE=1` | Usa um claude falso (desenvolvimento da interface). Escreva `[pergunta]`, `[lento]` ou `[erro]` nas instruções para simular cada caso |

## Segurança

- Escuta somente em `127.0.0.1`; rejeita `Host` e `Origin` externos.
- Toda rota `/api` exige um token novo a cada inicialização, entregue à página servida pelo próprio servidor.
- A API só lê arquivos dentro de `projetos/`; `..`, caminhos absolutos e symlinks que escapam são recusados. `projetos/{slug}/.painel/` (logs dos runs) não é servido.
- O Claude Code roda com as ferramentas `Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch, Skill` pré-aprovadas e o modo de permissão acima. Rode o painel só no seu computador.

## Estado e logs

Cada run grava `projetos/{slug}/.painel/runs/{id}.meta.json` e `{id}.jsonl`. Fechar o navegador não interrompe o run; reabra o painel e escolha-o em "Execuções". Se o servidor for reiniciado no meio de um run, ele aparece como "Erro: interrompido".

## Testes

```bash
cd painel && npm test
```

## Limitações conhecidas

- Uma skill por vez por projeto (fila); projetos diferentes rodam em paralelo.
- Só Claude Code (não Codex).
- Telas específicas por skill, redline/roteiro com comentário por trecho e painel de tráfego são os sub-projetos seguintes.
````

- [ ] **Step 2: Rodar a suíte inteira**

Run: `cd painel && npm test`
Expected: PASS em todos os arquivos.

- [ ] **Step 3: Verificação real — a skill roda via `claude -p`?**

Este é o ponto em aberto do spec. Rodar, na raiz do repositório, com o `projetos/demo` criado antes:

```bash
claude -p "/status-funil Projeto ativo: projetos/demo" --output-format stream-json --verbose --permission-mode acceptEdits 2>/dev/null | python3 -c '
import sys, json
for l in sys.stdin:
    try: o = json.loads(l)
    except Exception: continue
    if o.get("type") in ("assistant", "result"):
        print(json.dumps(o, ensure_ascii=False)[:400])
'
```

Expected (caso A): os eventos mostram a skill `status-funil` sendo executada (leitura do projeto, resposta sobre o estado do funil). Seguir para o Step 4.

Se em vez disso o resultado disser que o comando é desconhecido/não reconhecido (caso B), o slash command não funciona em modo headless: aplicar o Step 3b antes de seguir.

- [ ] **Step 3b: (somente caso B) Trocar o formato do prompt**

Em `painel/lib/runner.mjs`, trocar o corpo de `montarPrompt` por:

```js
export function montarPrompt(skill, slug, args = '') {
  const extra = args.trim() ? `\n\nInstruções do aluno: ${args.trim()}` : '';
  return `Execute a skill ${skill} (arquivo .claude/skills/${skill}/SKILL.md) fielmente, ` +
    `usando o ferramental Skill se disponível.\n\nProjeto ativo: projetos/${slug}${extra}`;
}
```

E ajustar em `painel/test/runner.test.mjs` as duas asserções de `montarPrompt` e a regex `/rodando \/avatar-funil/` (nos testes de runner e de servidor) para `/rodando Execute a skill avatar-funil/`. Rodar `cd painel && npm test` e repetir o comando do Step 3 com o novo formato de prompt para confirmar que a skill executa.

- [ ] **Step 4: Verificação real pelo painel**

```bash
PAINEL_NO_OPEN=1 node painel/server.mjs
```

No navegador: projeto `demo`, skill `status-funil`, Rodar. Conferir:
1. O diagnóstico no cabeçalho mostra a versão do Claude Code e nenhum problema.
2. O texto da skill aparece em streaming, com linhas de ferramenta (`Read`, `Bash` etc.).
3. Ao final, estado "Concluído" e o custo.
4. Mandar uma resposta de acompanhamento na caixa ("resuma em uma frase"): a resposta vem na mesma sessão (o texto mostra contexto da execução anterior).
5. Fechar a aba no meio de um run longo, reabrir o painel: o run aparece em "Execuções" e o log continua de onde estava.
6. Se alguma skill chamar `AskUserQuestion`, anotar se o cartão de pergunta apareceu com as opções; se não apareceu (a ferramenta pode ser recusada em modo headless), registrar o comportamento observado no final do `README.md` em "Limitações conhecidas" e na seção "Questões em aberto" do spec, sem mudar o código.

Expected: itens 1 a 5 funcionam. Parar o servidor.

- [ ] **Step 5: Commit**

```bash
git add painel/README.md
git commit -m "docs(painel): README e verificacao com o claude real" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

(Se o Step 3b foi aplicado, incluir também `painel/lib/runner.mjs`, `painel/test/runner.test.mjs` e `painel/test/server.test.mjs` no `git add`.)

---

## Self-Review

**Cobertura do spec**

| Requisito do spec | Onde |
|---|---|
| Servidor Node sem deps, 127.0.0.1, `node painel/server.mjs` abre o navegador | Task 7 (`iniciar`, `abrirNavegador`) |
| Frontend HTML/JS puro sem build | Tasks 8–10 |
| Runner `claude -p` stream-json, `--resume`, log em `.painel/runs/*.jsonl`, SSE | Tasks 3, 4, 5, 7 |
| Fila por projeto; cancelar | Task 5 |
| API: projetos, arquivos, arquivo, skills, runs, events, resposta, cancelar, diagnostico | Task 7 |
| Interface: seletor de projeto, skills, log, formulário de pergunta, árvore e visualizador (md, html em iframe isolado, json, imagem), diagnóstico | Tasks 9, 10 |
| Encaixes (registro de skills / extensões do visualizador) | Parcial: lista genérica de skills lida de `.claude/skills`; o visualizador despacha por extensão em `abrirArquivo`, ponto único de extensão para o item 3. O registro de telas por skill (`web/skills/`) fica para o sub-projeto 2 (YAGNI agora). |
| Erros: claude ausente/sem login com comando exato; run sobrevive ao navegador; falha preserva parciais; `..`/symlink; token | Tasks 1, 5, 6, 7 |
| Testes: unitários, runner com claude falso, verificação manual | Tasks 1–8, 11 |
| Critérios de aceite 1–6 | 1: Task 7/11; 2: 9/11; 3: 5/9/11 (item 6 do Step 4 verifica o caso real); 4: 10; 5: 5/9/11; 6: 1/2/7 |
| Questão em aberto: detecção de "esperando resposta" | `AskUserQuestion` vira `pergunta`; qualquer turno concluído permite resposta livre via `--resume`; Task 11 Step 4 item 6 registra o comportamento real |

**Desvios do spec, intencionais:** token exigido em todas as rotas `/api` (mais estrito); diagnóstico usa `claude auth status` (verificado na máquina) e nunca expõe o e-mail. O "diretório do projeto ignorado pelo git" já vale (`projetos/` está no `.gitignore`).

**Consistência de nomes:** `RunManager.{iniciar,responder,cancelar,obter,eventos,assinar,listar}`, estados `na_fila|executando|aguardando_resposta|concluido|erro|cancelado`, eventos `init|texto|ferramenta|pergunta|resultado|estado|usuario|erro`, `criarVisaoRun`/`criarArquivos`, `resolveInside`/`CaminhoInvalido`/`ErroRequisicao` usados de forma idêntica entre tasks.

**Placeholders:** nenhum; os dois pontos condicionais (Task 11 Step 3b e Step 4 item 6) têm código e critério explícitos.
