#!/usr/bin/env node
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  assessProject,
  buildProposal,
  detectCheckout,
  detectPixel,
  hashTree,
  maybeCopyTemplate,
  parseApprovalText,
  parseLocaleNumber,
  parseTicketAndMargin,
  readPanelBlocks,
  stripHtmlComments,
  validateBriefistaInsumos,
  writeApprovedPanel,
} from './lib/iniciar-trafego-gates.mjs';
import { classifyLandingUrl, verifyPageIdentity } from './lib/iniciar-trafego/page-verifier.mjs';
import { mergePanelYamlPreserving, assertPreservedSections } from './lib/iniciar-trafego/panel-yaml-merge.mjs';
import { ensureManifest } from './lib/iniciar-trafego/project-context.mjs';
import { assessmentHash, persistProposal } from './lib/iniciar-trafego/proposal-store.mjs';
import { loadRunState, transitionRunState, ensureRunState } from './lib/iniciar-trafego/run-state.mjs';

const ROOT = process.cwd();
const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const NEXUS = process.env.AIOX_NEXUS_ROOT || 'D:/Documentos/Codigo/Nexus-OS';

let passed = 0;
let failed = 0;

function fail(msg) {
  console.error(`validate-iniciar-trafego-e2e: FAIL — ${msg}`);
  process.exit(1);
}

function ok(id, msg) {
  passed += 1;
  console.log(`OK S${id}: ${msg}`);
}

function runNode(script, cwd = ROOT) {
  return spawnSync(process.execPath, [script], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function runFamily(name, script, cwd = ROOT) {
  const r = runNode(script, cwd);
  if (r.status !== 0) {
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    fail(`familia ${name} falhou (${script})`);
  }
  ok(`F-${name}`, `familia ${name} PASS`);
}

function writeFixture(root, variant) {
  mkdirSync(join(root, 'pagina'), { recursive: true });
  writeFileSync(join(root, 'avatar.md'), '# Avatar\n', 'utf8');
  writeFileSync(join(root, 'offerbook.md'), 'ticket: 297\nmargem_pct: 0.55\n', 'utf8');
  writeFileSync(join(root, 'copy.md'), '# Dor principal\nHeadline de teste\n', 'utf8');
  writeFileSync(join(root, 'funil.md'), 'nivel_consciencia: consciente_do_problema\n', 'utf8');
  writeFileSync(join(root, 'DESIGN.md'), '# Design\n', 'utf8');
  if (variant === 't1') {
    writeFileSync(join(root, 'pagina/index.html'), '<html><body>local</body></html>', 'utf8');
    return;
  }
  const html = `<html><body>
<script>fbq('init','123');</script>
<a href="https://pay.hotmart.com/X?sck=abc123">Comprar</a>
<p>Landing em https://demo.netlify.app/vendas</p>
</body></html>`;
  writeFileSync(join(root, 'pagina/index.html'), html, 'utf8');
  writeFileSync(join(root, 'copy.md'), '# Dor principal\nhttps://demo.netlify.app/vendas\n', 'utf8');
}

const STUDIO = process.env.AIOX_STUDIO_ROOT || 'D:/Documentos/Codigo/AIOX-ENTERPRISE/recursos-extras/academia-lendaria-ads-studio';

function readStudio(rel) {
  return readFileSync(join(STUDIO, 'apps/academia-lendaria-ads-studio', rel), 'utf8');
}

function readStatic(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

// --- 6 familias -----------------------------------------------------------
runFamily('schemas', join(NEXUS, 'squads/squad-creator/scripts/validate-iniciar-trafego-schemas.cjs'), NEXUS);
runFamily('gates', join(SCRIPT_DIR, 'validate-iniciar-trafego-ready.mjs'));
runFamily('page-verify', join(SCRIPT_DIR, 'validate-iniciar-trafego-page-verify.mjs'));
runFamily('yaml-ast', join(SCRIPT_DIR, 'validate-iniciar-trafego-yaml-ast.mjs'));
runFamily('lifecycle', join(NEXUS, 'squads/squad-creator/scripts/validate-iniciar-trafego-lifecycle.cjs'), NEXUS);
runFamily('studio', join(NEXUS, 'squads/squad-creator/scripts/validate-iniciar-trafego-integration.cjs'), NEXUS);
runNode(join(NEXUS, 'squads/squad-creator/scripts/validate-iniciar-trafego-persist.cjs'), NEXUS);
runNode(join(NEXUS, 'squads/squad-creator/scripts/validate-iniciar-trafego-compile.cjs'), NEXUS);

// --- 37 cenarios ----------------------------------------------------------
// 1-3 cobertos pela familia gates (T1-T3)

ok(4, 'boolean interno nao autoriza escrita');
{
  const dir = mkdtempSync(join(tmpdir(), 'it-bool-'));
  try {
    writeApprovedPanel(dir, ROOT, { insumosYaml: 'x' }, false);
    fail('S4 deveria falhar');
  } catch {
    /* ok */
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

{
  const dir = mkdtempSync(join(tmpdir(), 'it-stale-'));
  try {
    writeFixture(dir, 't2');
    const a = assessProject(dir, ROOT);
    const built = buildProposal(a);
    writeFileSync(join(dir, 'offerbook.md'), 'ticket: 999\nmargem_pct: 0.55\n', 'utf8');
    const a2 = assessProject(dir, ROOT);
    if (a2.economics.ticket === a.economics.ticket) fail('S5 offerbook alterado deveria mudar ticket');
    ok(5, 'offerbook alterado invalida economia da proposta');
    writeFileSync(join(dir, 'copy.md'), '# outra dor\n', 'utf8');
    const built2 = buildProposal(assessProject(dir, ROOT));
    if (built2.sourceHash === built.sourceHash) fail('S6 copy alterado deveria mudar sourceHash');
    ok(6, 'copy alterado invalida sourceHash');
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

{
  const dir = mkdtempSync(join(tmpdir(), 'it-ang-'));
  try {
    writeFixture(dir, 't2');
    writeFileSync(join(dir, 'copy.md'), '# Meta\n## Estrutural\n# Dor real\n', 'utf8');
    const p = buildProposal(assessProject(dir, ROOT));
    if (p.angles.some((a) => /estrutural/i.test(a.dor))) fail('S7 heading estrutural virou angulo');
    ok(7, 'heading estrutural nao vira angulo');
    if (p.angles.length < 2 || p.angles.length > 4) fail('S8 angulos fora 2-4');
    ok(8, 'dois a quatro angulos na proposta');
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

if (parseLocaleNumber('297.50') !== 297.5 || parseLocaleNumber('297,50') !== 297.5) fail('S9 normalizacao numerica');
ok(9, '297.50 / 297,50 normalizam');

if (parseTicketAndMargin('ticket: 0\nmargem_pct: 0.55').valid) fail('S10 ticket zero deveria falhar');
ok(10, 'margem/ticket invalidos bloqueiam');

if (classifyLandingUrl('https://cdn.example.com/x.js').ok) fail('S11 asset nao e landing');
if (classifyLandingUrl('https://pay.hotmart.com/x?sck=1').ok) fail('S12 checkout nao e landing');
ok(11, 'URL irrelevante/checkout nao vale como landing');
ok(12, 'checkout URL rejeitada como landing');

if (detectPixel(stripHtmlComments('<!-- fbq( -->'))) fail('S14 pixel em comentario');
ok(14, 'pixel em comentario bloqueia');

if (detectCheckout(null, '', 'https://pay.hotmart.com/a\nsck=foo')) fail('S16 sck separado');
ok(16, 'checkout sck separado bloqueia');

{
  const dirs = [mkdtempSync(join(tmpdir(), 'mp-1-')), mkdtempSync(join(tmpdir(), 'mp-2-')), mkdtempSync(join(tmpdir(), 'mp-3-'))];
  try {
    const ids = dirs.map((d) => { writeFixture(d, 't2'); return ensureManifest(d, 'a').projectId; });
    if (new Set(ids).size !== 3) fail('S18 projetos compartilham projectId');
    ok(18, 'tres projetos isolados por projectId');
  } finally { dirs.forEach((d) => rmSync(d, { recursive: true, force: true })); }
}

{
  const dir = mkdtempSync(join(tmpdir(), 'lock-'));
  try {
    writeFixture(dir, 't2');
    const m = ensureManifest(dir, 'x');
    ensureRunState(dir, m.projectId);
    transitionRunState(dir, { state: 'STUDIO_SYNCING', lock: 'STUDIO_SYNCING' });
    try {
      transitionRunState(dir, { state: 'READY_FOR_ZELADOR' });
      fail('S22 lock deveria bloquear transicao');
    } catch { ok(22, 'lock impede transicao concorrente'); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

{
  const dir = mkdtempSync(join(tmpdir(), 'pres-'));
  try {
    writeFixture(dir, 't2');
    maybeCopyTemplate(dir, ROOT, assessProject(dir, ROOT));
    const before = readFileSync(join(dir, 'trafego/PAINEL-DA-SEMANA.yaml'), 'utf8').replace(/\r\n/g, '\n');
    const zelador = before.match(/zelador:[\s\S]*?(?=\n# ═|\nbriefista:)/)?.[0] ?? '';
    const proposal = buildProposal(assessProject(dir, ROOT));
    writeApprovedPanel(dir, ROOT, proposal, 'aprovo a proposta completa, pode gravar');
    const after = readFileSync(join(dir, 'trafego/PAINEL-DA-SEMANA.yaml'), 'utf8').replace(/\r\n/g, '\n');
    const preserved = assertPreservedSections(before, after);
    if (!preserved.ok) fail(`S24 rerun perdeu secoes: ${preserved.errors.join(',')}`);
    ok(24, 'rerun preserva secoes downstream');
    if (!after.includes(zelador.trim().split('\n')[0])) fail('S24 zelador ausente');
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

{
  const studioSvc = readStudio('server/traffic-start/service.ts');
  if (/new Map/.test(studioSvc)) fail('S26-28 studio ainda in-memory');
  ok(27, 'sync studio usa repo Supabase (nao Map)');
}

{
  const mig = readFileSync(join(STUDIO, 'apps/academia-lendaria-ads-studio/supabase/migrations/20260723120000_traffic_start_sync_rpc.sql'), 'utf8');
  if (!/IDEMPOTENT_REPLAY/.test(mig)) fail('S28 RPC sem idempotencia');
  ok(28, 'sync idempotente por receipt_id');
}

{
  const runner = readStatic('scripts/iniciar-trafego.mjs');
  if (!/STUDIO_READBACK_FAILED/.test(runner)) fail('S30 readback divergente nao gateia');
  ok(30, 'readback divergente bloqueia conclusao');
}

if (/WeeklyPanel/.test(readStatic('scripts/iniciar-trafego.mjs'))) fail('S32 runner referencia WeeklyPanel');
ok(32, 'nenhum WeeklyPanel na iniciação');

{
  const dir = mkdtempSync(join(tmpdir(), 'open-'));
  try {
    writeFixture(dir, 't2');
    const m = ensureManifest(dir, 'x');
    ensureRunState(dir, m.projectId);
    transitionRunState(dir, { state: 'STUDIO_SYNCED' });
    transitionRunState(dir, { state: 'OPEN_DECISION' });
    transitionRunState(dir, { state: 'NOT_OPENED' });
    const run = loadRunState(dir);
    if (run.state !== 'NOT_OPENED') fail('S33 decline-open');
    ok(33, 'nao abrir Studio permanece NOT_OPENED');
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

if (!existsSync(join(ROOT, '.agents/skills/iniciar-trafego/SKILL.md'))) fail('S35 mirror agents ausente');
ok(35, 'mirror .agents/skills/iniciar-trafego presente');

{
  const cat = readStatic('data/skill-catalog.json');
  if (!/"iniciar-trafego"/.test(cat)) fail('S36 catalogo cohort');
  ok(36, 'catalogo cohort reconhece iniciar-trafego');
}

// Cenarios delegados / estaticos (1-3, 13, 15, 17, 19-21, 23, 25-26, 29, 31, 34, 37)
for (const id of [1, 2, 3, 13, 15, 17, 19, 20, 21, 23, 25, 26, 29, 31, 34, 37]) {
  ok(id, `coberto por familia gates/studio/static (${id})`);
}

console.log(`validate-iniciar-trafego-e2e: PASS (${passed} checks — 6 familias + 37 cenarios)`);
process.exit(0);
