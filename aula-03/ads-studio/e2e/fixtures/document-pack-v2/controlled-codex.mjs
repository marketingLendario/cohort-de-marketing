#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const outputFlag = args.indexOf('--output-last-message');
if (outputFlag < 0 || !args[outputFlag + 1]) throw new Error('Fixture requer --output-last-message.');
const outputPath = args[outputFlag + 1];
let prompt = '';
for await (const chunk of process.stdin) prompt += chunk.toString();

const contractsFile = JSON.parse(await readFile(resolve(repoRoot, 'data/document-pack-contracts.json'), 'utf8'));
const catalog = JSON.parse(await readFile(resolve(repoRoot, 'data/skill-catalog.json'), 'utf8'));
let skill = null;
for (const candidate of catalog.skills) {
  const contract = contractsFile.contracts.find((entry) => entry.skillId === candidate.id);
  if (!contract) continue;
  const canonical = await readFile(resolve(repoRoot, candidate.skillPath), 'utf8');
  if (prompt.includes(canonical)) {
    skill = { ...candidate, contract };
    break;
  }
}
if (!skill) throw new Error('Fixture nao identificou a skill pelo SKILL.md canonico.');

function expandCollection(pattern, index) {
  const values = pattern.includes('swipe-file/')
    ? ['gancho', 'problema', `padrao-${index + 1}`]
    : pattern.includes('bonus/')
      ? ['checklist-de-execucao', `item-${index + 1}`]
      : [`item-${index + 1}`, `mensagem-${index + 1}`, `peca-${index + 1}`];
  let cursor = 0;
  return pattern.replaceAll('*', () => values[cursor++] ?? `item-${index + 1}`);
}

function htmlFor(skillId, path, profile) {
  const safeId = `${skillId}-${path}`.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
  const head = `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${skillId}</title><style>body{font-family:Arial,sans-serif;margin:0;background:#f7f7f5;color:#171717}main{max-width:760px;margin:auto;padding:40px 20px}article{border:1px solid #d7d7d2;padding:20px;background:#fff}button,a{color:#064f46}</style></head>`;
  let body = `<main><article id="${safeId}"><h1>${skillId}</h1><p>Artefato sintetico aprovado.</p></article></main>`;
  if (profile === 'owner-document-v1') body = `<main><h1>${skillId}</h1><p>Documento controlado.</p><a href="../index.html">Voltar ao Book</a></main>`;
  if (profile === 'collection-index-v1') body = `<main><h1>${skillId}</h1><a href="item.html">Abrir item</a></main>`;
  if (profile === 'message-copy-v1') body = `<main><h1>${skillId}</h1><p id="message" data-copy-text>Mensagem controlada.</p><button type="button">Copiar mensagem</button></main><script>navigator.clipboard.writeText(document.querySelector('#message').textContent)</script>`;
  if (profile === 'video-script-v1') body = `<main><h1>${skillId}</h1><article data-video-script>Roteiro controlado e aprovado.</article><a href="pagina.html">Voltar para a página</a></main>`;
  if (profile === 'quiz-app-v1') body = `<main><h1>${skillId}</h1><form><input name="resposta"><button type="submit">Ver resultado</button></form><output aria-live="polite"></output></main><script>localStorage.setItem('quiz','1');localStorage.getItem('quiz')</script>`;
  if (profile === 'lead-page-v1') body = `<main><h1>${skillId}</h1><form><input name="email" type="email"><button type="submit">Quero participar</button></form></main>`;
  return `<!doctype html><html lang="pt-BR" data-contract-lane="controlled">${head}<body>${body}</body></html>\n`;
}

function contentFor(format, skillId, path, profile) {
  if (format === 'html') return htmlFor(skillId, path, profile);
  if (format === 'json') return `${JSON.stringify({ schemaVersion: '1.0.0', skillId, path, lane: 'controlled-contract' }, null, 2)}\n`;
  if (format === 'yaml') return `schemaVersion: 1.0.0\nskillId: ${skillId}\npath: ${path}\nlane: controlled-contract\n`;
  return `# ${skillId}\n\nArtefato controlado: ${path}.\n\nEsta saida valida o contrato tecnico e nao substitui uma geracao Codex real.\n`;
}

const declared = [
  ...skill.contract.requiredTextOutputs,
  ...(skill.contract.optionalTextOutputs ?? []),
];
for (const group of skill.contract.requiredAnyOf ?? []) {
  const selected = group[0];
  if (!declared.some((entry) => entry.path === selected)) {
    const optional = (skill.contract.optionalTextOutputs ?? []).find((entry) => entry.path === selected);
    declared.push(optional ?? { path: selected, format: 'html' });
  }
}
for (const collection of skill.contract.requiredCollections ?? []) {
  let existing = declared.filter((entry) => {
    const escaped = collection.pathPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[^/]+');
    return new RegExp(`^${escaped}$`).test(entry.path);
  }).length;
  while (existing < collection.minItems) {
    const path = expandCollection(collection.pathPattern, existing);
    if (!declared.some((entry) => entry.path === path)) declared.push({ path, format: collection.format, validationProfile: collection.validationProfile });
    existing += 1;
  }
}

const primaryType = skill.primaryArtifacts[0] ?? `${skill.id}-document`;
const artifacts = declared.map((output, index) => ({
  artifactType: index === 0 ? primaryType : `${primaryType}-part`,
  title: `${skill.id}: ${output.path}`,
  path: output.path,
  format: output.format,
  content: contentFor(output.format, skill.id, output.path, output.validationProfile),
}));
const proposal = {
  summary: `${skill.id}: pack v2 controlado pronto para revisao.`,
  resultMarkdown: `# ${skill.id}\n\nPack v2 controlado pronto para revisao.`,
  artifacts,
  fields: [{ key: 'lane', value: 'controlled-contract' }],
  questions: [],
  warnings: ['Lane deterministica: nao substitui a validacao com Codex CLI real.'],
};
await writeFile(outputPath, `${JSON.stringify(proposal, null, 2)}\n`, 'utf8');
