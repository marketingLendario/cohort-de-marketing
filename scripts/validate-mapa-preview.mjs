#!/usr/bin/env node
/** Preview visual: Playwright + pdf.js canvas no mapa. */
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawn } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRATCH = process.env.MAP_SCRATCH || '/var/folders/6c/d7ws84896057zvsl4kdbznnh0000gn/T/grok-goal-69c8d840b7c7/implementer';
mkdirSync(SCRATCH, { recursive: true });
const port = Number(process.env.MAP_PORT || 8765);
const base = `http://127.0.0.1:${port}`;

let failed = 0;
const log = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) failed++; };

let httpChild = null;
async function ensureHttp() {
  try {
    if ((await fetch(`${base}/mapa-skills.html`, { signal: AbortSignal.timeout(2000) })).ok) return;
  } catch { /* */ }
  httpChild = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    try { if ((await fetch(`${base}/mapa-skills.html`)).ok) return; } catch { /* */ }
  }
  throw new Error(`HTTP ${port} indisponível`);
}

await ensureHttp();
if (existsSync(join(SCRATCH, 'launch-fallback.txt'))) unlinkSync(join(SCRATCH, 'launch-fallback.txt'));

const pwDir = join(ROOT, 'scripts/node_modules/playwright');
const chromium = existsSync(pwDir)
  ? (await import(pathToFileURL(join(pwDir, 'index.mjs')).href)).chromium
  : (await import('playwright')).chromium;

const consoleErrors = [];
const pageErrors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => pageErrors.push(e.message));

await page.goto(`${base}/mapa-skills.html`, { waitUntil: 'networkidle' });

await page.evaluate(() => {
  const el = document.querySelector('.flow-node[data-id="avatar-funil"]');
  if (el && typeof selectSkill === 'function') selectSkill('avatar-funil', el, true);
});
await page.waitForTimeout(500);
await page.evaluate(() => openArtifactById('avatar-pdf'));
await page.waitForFunction(() => {
  const c = document.getElementById('am-preview-pdf-canvas');
  return c && c.dataset.rendered === '1';
}, { timeout: 15000 });

const canvasInfo = await page.evaluate(() => {
  const c = document.getElementById('am-preview-pdf-canvas');
  if (!c) return { dataLen: 0, w: 0, h: 0, rendered: '0' };
  const data = c.toDataURL('image/png');
  return { dataLen: data.length, w: c.width, h: c.height, rendered: c.dataset.rendered, sampleUrl: c.dataset.sampleUrl || '' };
});

log(canvasInfo.rendered === '1', `canvas rendered=${canvasInfo.rendered}`);
log(canvasInfo.dataLen > 1000, `canvas toDataURL length=${canvasInfo.dataLen}`);
log(canvasInfo.w > 100 && canvasInfo.h > 100, `canvas size ${canvasInfo.w}x${canvasInfo.h}`);
log(canvasInfo.sampleUrl.includes('relatorio-avatar.pdf'), `canvas sampleUrl=${canvasInfo.sampleUrl}`);

await page.locator('#am-preview-pdf-wrap').screenshot({ path: join(SCRATCH, 'pdf-preview.png') });
log(existsSync(join(SCRATCH, 'pdf-preview.png')), 'screenshot pdf-preview.png');

log(pageErrors.length === 0, `preview: ${pageErrors.length} pageerror(s)`);

await browser.close();
if (httpChild) httpChild.kill();

writeFileSync(join(SCRATCH, 'console-check.txt'), [
  `canvas_data_len: ${canvasInfo.dataLen}`,
  `canvas_size: ${canvasInfo.w}x${canvasInfo.h}`,
  `pageerrors: ${pageErrors.length}`,
  `console_errors: ${consoleErrors.length}`,
  ...pageErrors.map(e => `pageerror: ${e}`),
].join('\n'));

const wiringTxt = existsSync(join(SCRATCH, 'validate-wiring.txt'))
  ? readFileSync(join(SCRATCH, 'validate-wiring.txt'), 'utf8') : '';
writeFileSync(join(SCRATCH, 'validate-final.txt'),
  wiringTxt + `\n--- preview ---\npreview: ${failed ? 'FALHOU' : 'OK'}\ncanvas_data: ${canvasInfo.dataLen}b\n`);

console.log(failed ? `\nFALHOU: ${failed}` : '\nOK: preview');
process.exit(failed ? 1 : 0);