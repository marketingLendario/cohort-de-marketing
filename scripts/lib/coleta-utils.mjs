import { readFileSync, existsSync } from 'fs';

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
  return entries.find(e => e.label === label) || entries[fallbackIndex] || null;
}

export function fillTemplate(tpl, vars) {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ''));
  }
  return out;
}

export function simpleHtml(title, body) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:Georgia,serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:40px;line-height:1.6}
.wrap{max-width:720px;margin:0 auto}h1{font-size:1.8rem}table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{border:1px solid #333;padding:8px}th{background:#1a1a22}blockquote.verbatim{border-left:3px solid #a78bfa;padding-left:12px;font-style:italic}
</style></head><body><div class="wrap">${body}</div></body></html>`;
}

export function brandHtml(title, body) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:Inter,sans-serif;background:#0A0A0F;color:#F5F0FF;margin:0;padding:40px}
.wrap{max-width:720px;margin:0 auto}h1{color:#7C3AED}.card{background:#121218;border:1px solid #27272A;border-radius:12px;padding:16px;margin:12px 0}
button{background:#7C3AED;color:#F5F0FF;border:none;padding:12px 24px;border-radius:12px;font-weight:600}
</style></head><body><div class="wrap">${body}</div></body></html>`;
}