import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolveInside, CaminhoInvalido } from './paths.mjs';

const ID_RE = /^[0-9a-f-]{36}$/;

function idValido(id) {
  return typeof id === 'string' && ID_RE.test(id);
}

// Pasta de runs resolvida por resolveInside (rejeita symlinks que saiam de dir).
function pasta(dir) {
  return resolveInside(dir, '.painel/runs');
}

// Caminho de escrita: valida o id e cria a pasta somente apos a resolucao segura.
function arquivoEscrita(dir, id, sufixo) {
  if (!idValido(id)) throw new CaminhoInvalido('id de run inválido');
  const base = pasta(dir);
  mkdirSync(base, { recursive: true });
  return resolveInside(dir, `.painel/runs/${id}${sufixo}`);
}

// Caminho de leitura: devolve null se o id ou o caminho forem invalidos.
function arquivoLeitura(dir, id, sufixo) {
  if (!idValido(id)) return null;
  try {
    return resolveInside(dir, `.painel/runs/${id}${sufixo}`);
  } catch (e) {
    if (e instanceof CaminhoInvalido) return null;
    throw e;
  }
}

export function salvarMeta(dir, meta) {
  const arq = arquivoEscrita(dir, meta?.id, '.meta.json');
  writeFileSync(arq, JSON.stringify(meta, null, 2));
}

export function lerMeta(dir, id) {
  const arq = arquivoLeitura(dir, id, '.meta.json');
  if (!arq || !existsSync(arq)) return null;
  try {
    return JSON.parse(readFileSync(arq, 'utf8'));
  } catch {
    return null;
  }
}

export function anexarEvento(dir, id, ev) {
  const arq = arquivoEscrita(dir, id, '.jsonl');
  appendFileSync(arq, JSON.stringify(ev) + '\n');
}

export function lerEventos(dir, id) {
  const arq = arquivoLeitura(dir, id, '.jsonl');
  if (!arq || !existsSync(arq)) return [];
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
  let base;
  try {
    base = pasta(dir);
  } catch (e) {
    if (e instanceof CaminhoInvalido) return [];
    throw e;
  }
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .filter((f) => f.endsWith('.meta.json'))
    .map((f) => lerMeta(dir, f.slice(0, -'.meta.json'.length)))
    .filter(Boolean)
    .sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
}
