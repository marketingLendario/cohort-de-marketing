import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { parseBookDoFunilState, reconcileBookDoFunil, renderBookDoFunil } from '../dist/server/document-pack/book-reconciler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidenceDir = resolve(__dirname, '../design-qa-evidence/epic-11');
let state = parseBookDoFunilState(null, 'book-visual-proof');
state = reconcileBookDoFunil({ prior: state, skillId: 'offerbook', title: 'Offerbook', revision: 1, canonicalHtmlPath: 'offerbook.html', immutableHtmlPath: 'offerbook.r1.html' });
state = reconcileBookDoFunil({ prior: state, skillId: 'offerbook', title: 'Offerbook', revision: 2, canonicalHtmlPath: 'offerbook.html', immutableHtmlPath: 'offerbook.r2.html' });
const html = renderBookDoFunil(state);
const evidence = { schemaVersion: '1.0.0', generatedAt: new Date().toISOString(), scenarios: [] };

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto('http://127.0.0.1:5177', { waitUntil: 'domcontentloaded' });
    await page.setContent(html, { waitUntil: 'load' });
    await page.getByRole('heading', { name: 'Book do Funil' }).waitFor();
    await page.getByRole('link', { name: 'Abrir peça' }).waitFor();
    const remove = page.getByRole('button', { name: '✕ Excluir esta versão' }).first();
    await remove.click();
    const restore = page.getByRole('button', { name: 'Mostrar versões ocultas (1)' });
    await restore.waitFor();
    await restore.click();
    const layout = await page.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      versionButtons: document.querySelectorAll('.version button').length,
      markerVisible: document.body.innerText.includes('VOCÊ ESTÁ AQUI:'),
    }));
    if (layout.horizontalOverflow || layout.versionButtons !== 2 || !layout.markerVisible || consoleErrors.length) {
      throw new Error(`${name}: Book visual inválido`);
    }
    const screenshot = `book-do-funil-${name}.png`;
    await page.screenshot({ path: resolve(evidenceDir, screenshot), fullPage: true });
    evidence.scenarios.push({ name, viewport, screenshot, layout, consoleErrors });
    await context.close();
  }
  await writeFile(resolve(evidenceDir, 'book-do-funil.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
