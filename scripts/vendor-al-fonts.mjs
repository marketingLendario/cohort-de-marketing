#!/usr/bin/env node
/**
 * Baixa woff2 (Fontsource via jsDelivr) para assets/al/fonts/.
 * Licença: SIL OFL — Newsreader & Hanken Grotesk (Google Fonts).
 *
 * Uso: node scripts/vendor-al-fonts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'assets/al/fonts');

const MANIFEST = [
  ['newsreader-latin-300-normal.woff2', 'https://cdn.jsdelivr.net/npm/@fontsource/newsreader@5.2.6/files/newsreader-latin-300-normal.woff2'],
  ['newsreader-latin-400-normal.woff2', 'https://cdn.jsdelivr.net/npm/@fontsource/newsreader@5.2.6/files/newsreader-latin-400-normal.woff2'],
  ['newsreader-latin-300-italic.woff2', 'https://cdn.jsdelivr.net/npm/@fontsource/newsreader@5.2.6/files/newsreader-latin-300-italic.woff2'],
  ['newsreader-latin-400-italic.woff2', 'https://cdn.jsdelivr.net/npm/@fontsource/newsreader@5.2.6/files/newsreader-latin-400-italic.woff2'],
  ['hanken-grotesk-latin-400-normal.woff2', 'https://cdn.jsdelivr.net/npm/@fontsource/hanken-grotesk@5.2.6/files/hanken-grotesk-latin-400-normal.woff2'],
  ['hanken-grotesk-latin-500-normal.woff2', 'https://cdn.jsdelivr.net/npm/@fontsource/hanken-grotesk@5.2.6/files/hanken-grotesk-latin-500-normal.woff2'],
  ['hanken-grotesk-latin-600-normal.woff2', 'https://cdn.jsdelivr.net/npm/@fontsource/hanken-grotesk@5.2.6/files/hanken-grotesk-latin-600-normal.woff2'],
  ['hanken-grotesk-latin-700-normal.woff2', 'https://cdn.jsdelivr.net/npm/@fontsource/hanken-grotesk@5.2.6/files/hanken-grotesk-latin-700-normal.woff2'],
  ['hanken-grotesk-latin-800-normal.woff2', 'https://cdn.jsdelivr.net/npm/@fontsource/hanken-grotesk@5.2.6/files/hanken-grotesk-latin-800-normal.woff2'],
];

async function download(name, url, retries = 3) {
  const dest = path.join(FONTS_DIR, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log(`  skip (exists): ${name}`);
    return;
  }
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`  ✓ ${name} (${buf.length} bytes)`);
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error(`${name}: ${lastErr?.message ?? 'download failed'}`);
}

async function main() {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
  console.log('== vendor-al-fonts ==');
  for (const [name, url] of MANIFEST) {
    await download(name, url);
  }
  console.log('OK: fontes em assets/al/fonts/');
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});