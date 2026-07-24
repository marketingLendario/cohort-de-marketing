/**
 * Merge preservador de seções do PAINEL-DA-SEMANA.yaml.
 * Substitui apenas chaves autorizadas (insumos_a2, projecao) mantendo
 * zelador/briefista/estruturador/leitor/diagnosticador byte-identicos.
 */

const PRESERVE_KEYS = ['zelador', 'briefista', 'estruturador', 'leitor', 'diagnosticador', 'historico'];

export function extractPreamble(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^[a-zA-Z_][\w-]*:/.test(line) && !line.startsWith(' ')) break;
    i += 1;
  }
  return lines.slice(0, i).join('\n');
}

export function listDocumentKeys(text) {
  const keys = [];
  for (const line of String(text ?? '').split(/\r?\n/)) {
    if (/^[a-zA-Z_][\w-]*:/.test(line) && !line.startsWith(' ')) {
      keys.push(line.replace(/:.*/, ''));
    }
  }
  return keys;
}

export function validatePanelYamlStructure(text) {
  const source = String(text ?? '').replace(/\r\n/g, '\n');
  const keys = listDocumentKeys(source);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  const invalidIndentation = source
    .split('\n')
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => /^\t/.test(line) || /^( +)\S/.test(line) && line.match(/^ +/)?.[0].length % 2 !== 0)
    .map(({ number }) => number);
  const required = ['insumos_a2', 'projecao'];
  const missing = required.filter((key) => !keys.includes(key));
  return {
    ok: duplicates.length === 0 && invalidIndentation.length === 0 && missing.length === 0,
    keys,
    duplicates: [...new Set(duplicates)],
    invalidIndentation,
    missing,
  };
}

function findKeyLineIndex(lines, key) {
  return lines.findIndex((l) => l.startsWith(`${key}:`));
}

function findSectionStart(lines, keyStart) {
  let start = keyStart;
  for (let i = keyStart - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (line.trim() === '') continue;
    if (line.startsWith('#')) {
      start = i;
      while (start > 0 && (lines[start - 1].startsWith('#') || lines[start - 1].trim() === '')) {
        start -= 1;
      }
      return start;
    }
    if (/^[a-zA-Z_][\w-]*:/.test(line) && !line.startsWith(' ')) break;
  }
  return keyStart;
}

function findSectionEnd(lines, keyStart) {
  for (let i = keyStart + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^# ═/.test(line)) return i;
    if (/^[a-zA-Z_][\w-]*:/.test(line) && !line.startsWith(' ')) return i;
  }
  return lines.length;
}

export function extractSectionBlock(text, key) {
  const lines = String(text ?? '').split(/\r?\n/);
  const keyStart = findKeyLineIndex(lines, key);
  if (keyStart < 0) return null;
  const start = findSectionStart(lines, keyStart);
  const end = findSectionEnd(lines, keyStart);
  return lines.slice(start, end).join('\n');
}

function extractSectionBanner(existingText, key) {
  const block = extractSectionBlock(existingText, key);
  if (!block) return '';
  const lines = block.split('\n');
  const keyIdx = findKeyLineIndex(lines, key);
  if (keyIdx <= 0) return '';
  return lines.slice(0, keyIdx).join('\n').trimEnd();
}

function applyPatchWithBanner(existingText, key, patchBody) {
  const banner = extractSectionBanner(existingText, key);
  const originalBlock = extractSectionBlock(existingText, key);
  const body = String(patchBody).trimEnd();
  const trailing = originalBlock?.match(/(\n+)$/)?.[1] ?? '\n';
  if (banner) return `${banner}\n\n${body}${trailing}`;
  return `${body}${trailing}`;
}

export function mergePanelYamlPreserving(existingText, patchSections) {
  let text = String(existingText ?? '').replace(/\r\n/g, '\n');
  for (const [key, patchBody] of Object.entries(patchSections)) {
    const block = extractSectionBlock(text, key);
    const replacement = applyPatchWithBanner(text, key, patchBody);
    if (!block) {
      text = `${text.trimEnd()}\n\n${replacement}\n`;
      continue;
    }
    const idx = text.indexOf(block);
    if (idx < 0) {
      throw new Error(`Secao ${key} nao encontrada para merge AST (normalizacao de linha)`);
    }
    text = `${text.slice(0, idx)}${replacement}${text.slice(idx + block.length)}`;
  }
  const result = text.endsWith('\n') ? text : `${text}\n`;
  const structure = validatePanelYamlStructure(result);
  if (!structure.ok) {
    throw new Error(`Painel YAML estruturalmente inválido: ${JSON.stringify(structure)}`);
  }
  return result;
}

export function assertPreservedSections(beforeText, afterText, keys = PRESERVE_KEYS) {
  const norm = (value) => String(value ?? '').replace(/\r\n/g, '\n');
  const errors = [];
  for (const key of keys) {
    const before = extractSectionBlock(norm(beforeText), key);
    const after = extractSectionBlock(norm(afterText), key);
    if (before === null && after === null) continue;
    if (before !== after) errors.push(key);
  }
  return { ok: errors.length === 0, errors };
}

export { PRESERVE_KEYS };
