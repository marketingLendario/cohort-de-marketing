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
    let estourou = false;
    const partes = [];
    req.on('data', (d) => {
      if (estourou) return;
      tamanho += d.length;
      if (tamanho > MAX_CORPO) {
        estourou = true;
        ko(new ErroRequisicao('corpo grande demais', 413));
        return;
      }
      partes.push(d);
    });
    req.on('end', () => {
      if (estourou) return;
      let obj;
      try {
        const txt = Buffer.concat(partes).toString('utf8');
        obj = txt ? JSON.parse(txt) : {};
      } catch {
        ko(new ErroRequisicao('json inválido'));
        return;
      }
      if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        ko(new ErroRequisicao('o corpo deve ser um objeto json'));
        return;
      }
      ok(obj);
    });
    req.on('error', ko);
  });
}

function responderErro(res, e) {
  if (res.headersSent) { res.end(); return; }
  if (e instanceof ErroRequisicao) return json(res, e.status, { erro: e.message });
  if (e instanceof CaminhoInvalido) return json(res, 400, { erro: e.message });
  if (e instanceof URIError) return json(res, 400, { erro: 'endereço inválido' });
  if (e?.code === 'ENOENT') return json(res, 404, { erro: 'não encontrado' });
  console.error(e);
  return json(res, 500, { erro: 'erro interno' });
}

export function criarServidor({ repoRoot, runManager, token, diagnostico }) {
  function estatico(res, caminho) {
    const rel = caminho === '/' ? 'index.html' : decodeURIComponent(caminho).replace(/^\/+/, '');
    let abs;
    try {
      abs = resolveInside(WEB, rel);
    } catch (e) {
      if (e instanceof CaminhoInvalido) throw new ErroRequisicao('não encontrado', 404);
      throw e;
    }
    if (!existsSync(abs) || !statSync(abs).isFile() || !TIPOS_ESTATICOS[extname(abs)]) {
      throw new ErroRequisicao('não encontrado', 404);
    }
    let corpo = readFileSync(abs);
    if (rel === 'index.html') corpo = Buffer.from(corpo.toString('utf8').replaceAll('{{TOKEN}}', token));
    res.writeHead(200, {
      'content-type': TIPOS_ESTATICOS[extname(abs)],
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
    });
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
      'x-content-type-options': 'nosniff',
      connection: 'keep-alive',
    });
    const escrever = (txt) => {
      if (!res.destroyed && !res.writableEnded) res.write(txt);
    };
    const enviar = (ev) => escrever(`id: ${ev.seq + 1}\ndata: ${JSON.stringify(ev)}\n\n`);
    for (const ev of historico.slice(desde)) enviar(ev);
    const cancelar = runManager.assinar(id, enviar);
    const batimento = setInterval(() => escrever(': ping\n\n'), 15000);
    let limpo = false;
    const limpar = () => {
      if (limpo) return;
      limpo = true;
      clearInterval(batimento);
      cancelar();
    };
    res.on('close', limpar);
    res.on('error', limpar);
    req.on('error', limpar);
  }

  async function tratar(req, res) {
    const porta = servidor.address().port;
    if (!hostPermitido(req.headers.host, porta)) throw new ErroRequisicao('host não permitido', 403);
    const url = new URL(req.url, `http://127.0.0.1:${porta}`);
    const caminho = url.pathname;

    if (!caminho.startsWith('/api/')) {
      if (req.method !== 'GET') throw new ErroRequisicao('método não permitido', 405);
      return estatico(res, caminho);
    }

    const recebido = req.headers['x-painel-token'] ?? url.searchParams.get('token');
    if (!tokenValido(token, recebido)) throw new ErroRequisicao('token inválido', 401);

    if (req.method === 'POST') {
      const origem = req.headers.origin;
      if (origem && origem !== `http://${req.headers.host}`) throw new ErroRequisicao('origem não permitida', 403);
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
        if (!meta) throw new ErroRequisicao('run não encontrado', 404);
        return json(res, 200, meta);
      }
      if ((m = caminho.match(/^\/api\/runs\/([^/]+)\/events$/))) {
        if (!runManager.obter(m[1])) throw new ErroRequisicao('run não encontrado', 404);
        const bruto = Number(url.searchParams.get('desde') ?? req.headers['last-event-id'] ?? 0);
        const desde = Number.isFinite(bruto) && bruto > 0 ? Math.floor(bruto) : 0;
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

    throw new ErroRequisicao('rota não encontrada', 404);
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

// Ctrl+C / SIGTERM / SIGHUP: os claude rodam em grupos de processos próprios (detached),
// então o sinal não chega a eles. Cancela tudo, fecha as conexões e sai.
export function instalarEncerramento({
  servidor, runManager, processo = process, sair = process.exit, timeoutMs = 5000,
}) {
  let encerrando = false;
  const encerrar = async () => {
    // Segundo sinal: o aluno quer sair já, mesmo que o encerramento ordenado trave.
    if (encerrando) { sair(1); return; }
    encerrando = true;
    let timer;
    try {
      await Promise.race([
        runManager.encerrarTodos(),
        new Promise((_, ko) => {
          timer = setTimeout(() => ko(new Error('tempo esgotado')), timeoutMs);
          timer.unref();
        }),
      ]);
    } catch (e) {
      console.error(`painel: falha ao encerrar runs: ${e.message}`);
    } finally {
      clearTimeout(timer);
    }
    servidor.closeAllConnections();
    servidor.close();
    sair(0);
  };
  // SIGHUP: fechar a janela do terminal; sem tratá-lo os claude (detached) ficariam órfãos.
  for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP']) processo.on(sinal, encerrar);
  return encerrar;
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
      instalarEncerramento({ servidor, runManager });
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
