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
