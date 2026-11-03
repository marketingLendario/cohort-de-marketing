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
