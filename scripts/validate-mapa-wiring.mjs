#!/usr/bin/env node
/** Wiring: arquivos, sampleUrl, coleta→md, HTTP, tour (sem preview visual). */
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runInNewContext } from 'vm';
import { spawn } from 'child_process';
import { parseColetaEntries } from './lib/coleta-utils.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRATCH = process.env.MAP_SCRATCH || '/var/folders/6c/d7ws84896057zvsl4kdbznnh0000gn/T/grok-goal-69c8d840b7c7/implementer';
mkdirSync(SCRATCH, { recursive: true });
const SAMPLES = join(ROOT, 'mapa-skills-samples/academia-fit');
const LIVE_PROJ = join(ROOT, 'projetos/academia-fit');
const hasLiveProject = existsSync(LIVE_PROJ);
const PROJ = hasLiveProject ? LIVE_PROJ : SAMPLES;
const port = Number(process.env.MAP_PORT || 8765);

let failed = 0;
const lines = [];
const log = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); lines.push(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) failed++; };

function listDir(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) listDir(p, acc);
    else acc.push(p.replace(ROOT + '/', ''));
  }
  return acc;
}

function loadArtifacts() {
  const code = readFileSync(join(ROOT, 'mapa-skills-artifacts.js'), 'utf8');
  const sandbox = { window: {} };
  runInNewContext(code, sandbox);
  return sandbox.window.ARTIFACT_SAMPLES || {};
}

let httpChild = null;
async function ensureHttp() {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/mapa-skills.html`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) { log(true, `HTTP ${port} ativo`); if (existsSync(join(SCRATCH, 'launch-fallback.txt'))) unlinkSync(join(SCRATCH, 'launch-fallback.txt')); return; }
  } catch { /* spawn */ }
  httpChild = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const r = await fetch(`http://127.0.0.1:${port}/mapa-skills.html`);
      if (r.ok) { log(true, `HTTP ${port} iniciado`); return; }
    } catch { /* retry */ }
  }
  log(false, `HTTP ${port} indisponível`);
  writeFileSync(join(SCRATCH, 'launch-fallback.txt'), `http failed ${port}\n`);
}

// coleta → md
const coletaPath = join(LIVE_PROJ, 'pesquisa-avatar-2026-07/coleta-roteiro.txt');
const relatorioPath = join(LIVE_PROJ, 'relatorio-avatar.md');
if (hasLiveProject) {
  log(existsSync(coletaPath), 'coleta-roteiro.txt existe');
}
if (hasLiveProject && existsSync(coletaPath) && existsSync(relatorioPath)) {
  const coleta = readFileSync(coletaPath, 'utf8');
  const rel = readFileSync(relatorioPath, 'utf8');
  const entries = parseColetaEntries(coleta);
  const anchor = entries[0]?.url;
  log(!!anchor && rel.includes(anchor), `relatorio-avatar.md contém URL da coleta (${anchor?.slice(0, 48)}...)`);
  for (const e of entries.slice(0, 3)) {
    log(rel.includes(e.url), `relatorio contém [${e.label}] URL`);
  }
}

if (!hasLiveProject) log(true, 'snapshot didático usado no clone limpo');

log(existsSync(join(PROJ, '.cohort-run.json')), '.cohort-run.json');
log(existsSync(join(ROOT, 'scripts/lib/nucleo-from-coleta.mjs')), 'nucleo-from-coleta.mjs');

const KEY = ['avatar.md', 'offerbook.md', 'DESIGN.md', 'funil.md', 'copy.md'];
for (const f of KEY) log(existsSync(join(PROJ, f)), `${hasLiveProject ? 'projeto' : 'snapshot'}/${f}`);

writeFileSync(join(SCRATCH, 'projeto-listing.txt'), listDir(PROJ).join('\n'));
writeFileSync(join(SCRATCH, 'samples-listing.txt'), listDir(SAMPLES).join('\n'));

const artifacts = loadArtifacts();
const urls = [];
for (const arts of Object.values(artifacts)) {
  for (const a of arts) if (a.sampleUrl) urls.push(a.sampleUrl);
}
const bad = urls.filter(u => /\$\{/.test(u) || !existsSync(join(ROOT, u)));
log(bad.length === 0, `sampleUrl: ${urls.length - bad.length}/${urls.length} válidos`);
if (bad.length) bad.forEach(u => log(false, `sampleUrl inválido: ${u}`));

await ensureHttp();
const pdfUrl = `http://127.0.0.1:${port}/mapa-skills-samples/academia-fit/relatorio-avatar.pdf`;
try {
  const r = await fetch(pdfUrl);
  const buf = Buffer.from(await r.arrayBuffer());
  log(r.ok && buf.slice(0, 5).toString() === '%PDF-', `HTTP PDF ${buf.length}b`);
} catch (e) { log(false, `HTTP PDF: ${e.message}`); }

writeFileSync(join(SCRATCH, 'validate-wiring.txt'), lines.join('\n'));
writeFileSync(join(SCRATCH, 'validate-output.txt'), lines.join('\n') + '\nOK: wiring\n');
if (httpChild) httpChild.kill();

console.log(failed ? `\nFALHOU: ${failed}` : '\nOK: wiring');
process.exit(failed ? 1 : 0);
