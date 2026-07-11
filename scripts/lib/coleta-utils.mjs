import { readFileSync, existsSync } from 'fs';

export {
  simpleHtml,
  brandHtml,
  documentHtml,
  landingHtml,
  emailHtml,
  mdToHtml,
  salesPageHtml,
  quizPageHtml,
  previewHtml,
} from './html-templates.mjs';

/** Extrai entradas [label] URL do stdout dos coletores cohort */
export function parseColetaEntries(text) {
  const entries = [];
  for (const line of text.split('\n')) {
    const m = line.match(/\[([^\]]+)\]\s+(https?:\/\/\S+)/);
    if (m) entries.push({ label: m[1], url: m[2] });
  }
  return entries;
}

export function readColeta(path) {
  if (!existsSync(path)) return { text: '', entries: [] };
  const text = readFileSync(path, 'utf8');
  return { text, entries: parseColetaEntries(text) };
}

export function pickEntry(entries, label, fallbackIndex = 0) {
  return entries.find((e) => e.label === label) || entries[fallbackIndex] || null;
}

export function fillTemplate(tpl, vars) {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ''));
  }
  return out;
}