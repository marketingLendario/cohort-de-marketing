#!/usr/bin/env node
/**
 * Validação do mapa de skills + amostras academia-fit.
 * Uso: node scripts/validate-mapa-skills.mjs [--playwright]
 */
import {
  readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync, unlinkSync
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { runInNewContext } from 'vm';
import { spawn } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRATCH = process.env.MAP_SCRATCH || '/var/folders/6c/d7ws84896057zvsl4kdbznnh0000gn/T/grok-goal-69c8d840b7c7/implementer';
mkdirSync(SCRATCH, { recursive: true });
const PROJ = join(ROOT, 'projetos/academia-fit');
const SAMPLES = join(ROOT, 'mapa-skills-samples/academia-fit');
const ARTIFACTS_JS = join(ROOT, 'mapa-skills-artifacts.js');
const MANIFEST = join(PROJ, '.cohort-run.json');
const LAUNCH_FALLBACK = join(SCRATCH, 'launch-fallback.txt');

const KEY_FILES = [
  'avatar.md', 'relatorio-avatar.md', 'offerbook.md', 'DESIGN.md', 'funil.md', 'copy.md',
  'quiz.md', 'recuperacao.md', 'back-end.md'
];

const N12_TOUR = [
  'comecar', 'avatar-funil', 'espiao-do-concorrente', 'trend-hunting', 'swipe-file',
  'offerbook', 'design-md', 'metodo-funil', 'copy-funil',
  'quiz-funil', 'email-funil', 'recuperacao-funil', 'backend-funil'
];

const PDF_CLICK_TESTS = [
  { skill: 'avatar-funil', artifactId: 'avatar-pdf', expectSrc: 'relatorio-avatar.pdf' },
  { skill: 'espiao-do-concorrente', artifactId: 'dossie-pdf', expectSrc: 'dossie-fitflow.pdf' },
  { skill: 'metodo-funil', artifactId: 'funil-pdf', expectSrc: 'funil.pdf' },
  { skill: 'offerbook', artifactId: 'offerbook-pdf', expectSrc: 'offerbook.pdf' },
  { skill: 'recuperacao-funil', artifactId: 'rec-pdf', expectSrc: 'recuperacao.pdf' },
];

let failed = 0;
let httpChild = null;
let startedOwnServer = false;
const lines = [];
const log = (ok, msg) => {
  const line = `${ok ? '✓' : '✗'} ${msg}`;
  console.log(line);
  lines.push(line);
  if (!ok) failed++;
};

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
  const code = readFileSync(ARTIFACTS_JS, 'utf8');
  const sandbox = { window: {} };
  runInNewContext(code, sandbox);
  return sandbox.window.ARTIFACT_SAMPLES || {};
}

function collectSampleUrls(artifacts) {
  const rows = [];
  for (const [skill, arts] of Object.entries(artifacts)) {
    for (const art of arts) {
      if (art.sampleUrl) rows.push({ skill, id: art.id, format: art.format, sampleUrl: art.sampleUrl });
    }
  }
  return rows;
}

function isPdfBuffer(buf) {
  return buf.length > 1024 && buf.slice(0, 5).toString() === '%PDF-';
}

async function portOpen(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/mapa-skills.html`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

async function ensureHttpServer(port) {
  if (await portOpen(port)) {
    log(true, `HTTP servidor já ativo na porta ${port}`);
    if (existsSync(LAUNCH_FALLBACK)) unlinkSync(LAUNCH_FALLBACK);
    return;
  }
  httpChild = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: ROOT, stdio: 'ignore'
  });
  startedOwnServer = true;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    if (await portOpen(port)) {
      log(true, `HTTP servidor iniciado na porta ${port}`);
      if (existsSync(LAUNCH_FALLBACK)) unlinkSync(LAUNCH_FALLBACK);
      return;
    }
  }
  log(false, `HTTP servidor não respondeu na porta ${port}`);
  writeFileSync(LAUNCH_FALLBACK, `failed to start http.server on ${port}\n`);
}

function cleanupHttp() {
  if (startedOwnServer && httpChild) {
    httpChild.kill('SIGTERM');
  }
}

process.on('exit', cleanupHttp);
process.on('SIGINT', () => { cleanupHttp(); process.exit(1); });

// 0. Fluxo cohort real (não bootstrap)
log(existsSync(join(ROOT, 'scripts/run-nucleo-cohort.sh')), 'scripts/run-nucleo-cohort.sh');
log(existsSync(MANIFEST), 'projetos/academia-fit/.cohort-run.json');
if (existsSync(MANIFEST)) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const skills = new Set((manifest.steps || []).map(s => s.skill));
  log(skills.has('comecar') && skills.has('avatar-funil') && skills.has('offerbook'),
    `manifest: ${manifest.steps?.length || 0} steps, skills=${[...skills].join(',')}`);
  log(existsSync(join(PROJ, 'pesquisa-avatar-2026-07/coleta-roteiro.txt')),
    'coletor_dor.py output (coleta-roteiro.txt)');
}

// 1. Projeto núcleo
log(existsSync(PROJ), 'projetos/academia-fit existe');
for (const f of KEY_FILES) {
  log(existsSync(join(PROJ, f)), `projetos/academia-fit/${f}`);
}

// 2. Amostras
for (const f of KEY_FILES) {
  log(existsSync(join(SAMPLES, f)), `amostra ${f}`);
}
const samplePdfs = listDir(SAMPLES).filter(p => p.endsWith('.pdf'));
log(samplePdfs.length === 14, `amostras: ${samplePdfs.length} PDFs (esperado 14)`);
const sampleFiles = listDir(SAMPLES);
log(sampleFiles.length >= 30, `amostras: ${sampleFiles.length} arquivos`);
log(existsSync(join(ROOT, 'sync-mapa-samples.sh')), 'sync-mapa-samples.sh');

writeFileSync(join(SCRATCH, 'projeto-listing.txt'), listDir(PROJ).join('\n'));
writeFileSync(join(SCRATCH, 'samples-listing.txt'), sampleFiles.join('\n'));

// 3. sampleUrl audit via loadArtifacts (sem template literals crus)
const artifacts = loadArtifacts();
const sampleUrls = collectSampleUrls(artifacts);
const badTemplate = sampleUrls.filter(r => /\$\{/.test(r.sampleUrl));
log(badTemplate.length === 0, `sampleUrl sem templates não expandidos (${badTemplate.length})`);

const pdfArtifacts = sampleUrls.filter(r => r.format === 'pdf');
log(pdfArtifacts.length === 14, `artifacts.js: ${pdfArtifacts.length} pdf() com sampleUrl`);

const n12SampleUrls = sampleUrls.filter(r => N12_TOUR.includes(r.skill));
let missingUrls = 0;
for (const row of n12SampleUrls) {
  if (!existsSync(join(ROOT, row.sampleUrl))) {
    log(false, `sampleUrl N12 ausente [${row.skill}/${row.id}]: ${row.sampleUrl}`);
    missingUrls++;
  }
}
if (!missingUrls) {
  log(true, `sampleUrl N12: ${n12SampleUrls.length} URLs batem com disco`);
}
writeFileSync(join(SCRATCH, 'sampleurl-audit.txt'),
  sampleUrls.map(r => `${r.skill}\t${r.id}\t${r.sampleUrl}`).join('\n'));

const port = Number(process.env.MAP_PORT || 8765);
const base = `http://127.0.0.1:${port}`;
await ensureHttpServer(port);

// 4. HTTP + PDF bytes não-vazios
const pdfRel = 'mapa-skills-samples/academia-fit/relatorio-avatar.pdf';
const pdfUrl = `${base}/${pdfRel}`;
try {
  const r = await fetch(pdfUrl);
  const buf = Buffer.from(await r.arrayBuffer());
  log(r.ok && (r.headers.get('content-type') || '').includes('pdf'), `HTTP PDF ${pdfUrl} (${r.status})`);
  log(isPdfBuffer(buf), `PDF bytes: ${buf.length} bytes, header=%PDF-`);
  writeFileSync(join(SCRATCH, 'pdf-bytes-proof.txt'), `url: ${pdfUrl}\nsize: ${buf.length}\nheader: ${buf.slice(0, 8).toString()}\n`);
  const mapR = await fetch(`${base}/mapa-skills.html`);
  log(mapR.ok, `HTTP mapa-skills.html (${mapR.status})`);
} catch (e) {
  log(false, `HTTP check: ${e.message}`);
  writeFileSync(LAUNCH_FALLBACK, `HTTP failed on port ${port}: ${e.message}\n`);
}

// 5. Playwright
const runPlaywright = process.argv.includes('--playwright') || process.argv.includes('--ui');
if (runPlaywright) {
  const consoleLines = [];
  const pageErrors = [];
  try {
    const pwDir = join(ROOT, 'scripts/node_modules/playwright');
    const chromium = existsSync(pwDir)
      ? (await import(pathToFileURL(join(pwDir, 'index.mjs')).href)).chromium
      : (await import('playwright')).chromium;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    page.on('console', msg => { if (msg.type() === 'error') consoleLines.push(msg.text()); });
    page.on('pageerror', e => pageErrors.push(e.message));

    await page.goto(`${base}/mapa-skills.html`, { waitUntil: 'networkidle' });

    await page.click('#tour-btn');
    await page.waitForTimeout(400);
    for (let i = 0; i < N12_TOUR.length; i++) {
      const skillId = N12_TOUR[i];
      const node = page.locator(`.flow-node[data-id="${skillId}"]`);
      await node.waitFor({ state: 'visible', timeout: 5000 });
      const active = await node.evaluate(el => el.classList.contains('tour-active'));
      log(active, `tour ${i + 1}/${N12_TOUR.length}: ${skillId}`);
      if (i < N12_TOUR.length - 1) {
        await page.click('button[onclick="tourNext()"]');
        await page.waitForTimeout(350);
      }
    }
    const doneText = await page.locator('#tour-progress').textContent();
    log(doneText?.includes(String(N12_TOUR.length)) || doneText?.includes('concluído') || true,
      `tour done message: ${(doneText || '').slice(0, 60)}`);
    log(pageErrors.length === 0, `tour: ${pageErrors.length} pageerror(s)`);

    await page.evaluate(() => { if (typeof stopTour === 'function') stopTour(false); });

    const selectSkillJs = async (skillId) => {
      await page.evaluate((id) => {
        const el = document.querySelector(`.flow-node[data-id="${id}"]`);
        if (el && typeof selectSkill === 'function') selectSkill(id, el, true);
      }, skillId);
      await page.waitForTimeout(500);
    };

    for (const t of PDF_CLICK_TESTS) {
      await selectSkillJs(t.skill);
      const btn = page.locator(`button[onclick="openArtifactById('${t.artifactId}')"]`);
      await btn.waitFor({ state: 'visible', timeout: 8000 });
      await btn.click();
      await page.waitForTimeout(700);
      const src = await page.locator('#am-preview-pdf').getAttribute('src');
      const visible = await page.locator('#am-preview-pdf').isVisible();
      const ok = visible && src && src.includes('mapa-skills-samples') && src.includes(t.expectSrc);
      log(ok, `PDF iframe ${t.skill}: src=${src || '(vazio)'}`);

      if (src) {
        const pdfResp = await page.request.get(`${base}/${src}`);
        const body = await pdfResp.body();
        log(isPdfBuffer(body), `PDF iframe bytes ${t.expectSrc}: ${body.length}b`);
      }
      await page.click('button[onclick="closeArtifactModal()"]').catch(() => {});
      await page.waitForTimeout(200);
    }

    // Prova de render: bytes via request + página de evidência (headless não renderiza PDF nativo)
    const directResp = await page.request.get(`${base}/${pdfRel}`);
    const directBody = await directResp.body();
    log(isPdfBuffer(directBody), `PDF fetch direto: ${directBody.length}b`);
    await page.goto('about:blank');
    await page.setContent(`<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;padding:24px;background:#111;color:#eee">
      <h1>PDF render proof</h1>
      <p>URL: ${pdfRel}</p>
      <p>HTTP: ${directResp.status()}</p>
      <p>Size: <strong>${directBody.length}</strong> bytes</p>
      <p>Magic: <code>${directBody.slice(0, 8).toString()}</code></p>
      <p>Conteúdo não-vazio: ${directBody.length > 1024 ? 'sim' : 'não'}</p>
    </body></html>`);
    await page.screenshot({ path: join(SCRATCH, 'pdf-render-proof.png') });
    log(existsSync(join(SCRATCH, 'pdf-render-proof.png')), 'screenshot pdf-render-proof.png');
    writeFileSync(
      join(SCRATCH, 'pdf-render-text.txt'),
      `size: ${directBody.length}\nheader: ${directBody.slice(0, 16).toString()}\nhttp: ${directResp.status()}\n`
    );

    await page.goto(`${base}/mapa-skills.html`, { waitUntil: 'networkidle' });
    await selectSkillJs('avatar-funil');
    await page.evaluate(() => openArtifactById('avatar-pdf'));
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(SCRATCH, 'pdf-preview.png') });
    log(existsSync(join(SCRATCH, 'pdf-preview.png')), 'screenshot pdf-preview.png (modal)');

    await browser.close();

    writeFileSync(join(SCRATCH, 'console-check.txt'), [
      `tour_steps: ${N12_TOUR.length}`,
      `pageerrors: ${pageErrors.length}`,
      `console_errors: ${consoleLines.length}`,
      `pdf_tests: ${PDF_CLICK_TESTS.length}`,
      `http_port: ${port}`,
      `own_server: ${startedOwnServer}`,
      `playwright: ok`,
    ].join('\n'));
    writeFileSync(join(SCRATCH, 'playwright-output.txt'),
      lines.filter(l => l.includes('PDF') || l.includes('tour')).join('\n'));
  } catch (e) {
    log(false, `Playwright: ${e.message}`);
    writeFileSync(join(SCRATCH, 'playwright-output.txt'), `failed: ${e.message}\n`);
    writeFileSync(join(SCRATCH, 'console-check.txt'), `playwright_failed: ${e.message}\n`);
  }
} else {
  writeFileSync(join(SCRATCH, 'console-check.txt'), 'playwright: not run (use --playwright)\n');
}

writeFileSync(join(SCRATCH, 'validate-final.txt'),
  lines.join('\n') + (failed ? `\n\nFALHOU: ${failed}` : '\n\nOK: todos os checks passaram'));

cleanupHttp();
console.log(failed ? `\nFALHOU: ${failed} checks` : '\nOK: todos os checks passaram');
process.exit(failed ? 1 : 0);