#!/usr/bin/env node
/**
 * Valida contratos das skills N12: SKILL.md + scripts executados + conteúdo mínimo.
 */
import { readFileSync, existsSync } from 'fs';
import { parseColetaEntries } from './lib/coleta-utils.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJ = join(ROOT, 'projetos/academia-fit');
const MANIFEST = join(PROJ, '.cohort-run.json');

const CONTRACTS = [
  {
    skill: 'avatar-funil',
    files: ['avatar.md', 'relatorio-avatar.md', 'relatorio-avatar.html', 'relatorio-avatar.pdf'],
    contentFile: 'relatorio-avatar.md',
    scripts: ['coletor_dor.py', 'gerar_pdf.sh'],
    sections: ['Dores ranqueadas', 'Resumo executivo'],
    coleta: 'pesquisa-avatar-2026-07/coleta-roteiro.txt',
  },
  {
    skill: 'espiao-do-concorrente',
    files: ['espiao/dossie-fitflow.md', 'espiao/dossie-fitflow.html', 'espiao/dossie-fitflow.pdf'],
    contentFile: 'espiao/dossie-fitflow.md',
    scripts: ['coletor_web.py'],
    sections: ['Brechas', 'Hook'],
    coleta: 'espiao/coleta-roteiro.txt',
  },
  {
    skill: 'offerbook',
    files: ['offerbook.md', 'offerbook.html', 'offerbook.pdf'],
    contentFile: 'offerbook.md',
    scripts: ['gerar_html.py'],
    sections: ['Mecanismo', 'Stack'],
  },
  {
    skill: 'metodo-funil',
    files: ['funil.md', 'funil.html', 'funil.pdf'],
    contentFile: 'funil.md',
    scripts: ['gerar_pdf.sh'],
    sections: ['Diagnóstico', 'quiz'],
  },
  {
    skill: 'copy-funil',
    files: ['copy.md'],
    contentFile: 'copy.md',
    sections: ['Big Idea', 'Headlines'],
  },
  {
    skill: 'recuperacao-funil',
    files: ['recuperacao.md', 'recuperacao.html', 'recuperacao.pdf'],
    contentFile: 'recuperacao.md',
    scripts: ['gerar_pdf.sh'],
    sections: ['Carrinho'],
  },
];

let failed = 0;
const log = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) failed++; };

log(existsSync(join(ROOT, '.env')), '.env criado pelo /comecar');
log(existsSync(MANIFEST), '.cohort-run.json presente');

const coletaAvatar = join(PROJ, 'pesquisa-avatar-2026-07/coleta-roteiro.txt');
const relAvatar = join(PROJ, 'relatorio-avatar.md');
if (existsSync(coletaAvatar) && existsSync(relAvatar)) {
  const entries = parseColetaEntries(readFileSync(coletaAvatar, 'utf8'));
  const anchor = entries[0]?.url;
  log(!!anchor && readFileSync(relAvatar, 'utf8').includes(anchor),
    'coleta→relatorio: URL do coletor presente no md');
}

let manifest = { steps: [] };
if (existsSync(MANIFEST)) {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
}

for (const c of CONTRACTS) {
  const skillMd = join(ROOT, `.claude/skills/${c.skill}/SKILL.md`);
  log(existsSync(skillMd), `SKILL.md ${c.skill}`);

  for (const f of c.files) {
    const p = join(PROJ, f);
    log(existsSync(p), `[${c.skill}] arquivo ${f}`);
    if (existsSync(p) && f === c.contentFile && c.sections?.length) {
      const text = readFileSync(p, 'utf8');
      for (const sec of c.sections) {
        log(text.toLowerCase().includes(sec.toLowerCase()), `[${c.skill}] seção "${sec}" em ${f}`);
      }
    }
    if (existsSync(p) && f.endsWith('.pdf')) {
      const buf = readFileSync(p);
      log(buf.length > 1024 && buf.slice(0, 5).toString() === '%PDF-', `[${c.skill}] PDF válido ${f} (${buf.length}b)`);
    }
  }

  if (c.coleta) {
    log(existsSync(join(PROJ, c.coleta)), `[${c.skill}] coleta ${c.coleta}`);
  }

  for (const script of c.scripts || []) {
    const ran = (manifest.steps || []).some(
      s => s.skill === c.skill && (s.script === script || (s.script || '').includes(script))
    );
    log(ran, `[${c.skill}] script ${script} registrado no manifest`);
    const scriptPath = join(ROOT, `.claude/skills/${c.skill}/scripts/${script}`);
    if (existsSync(scriptPath)) {
      if (script.endsWith('.py')) {
        const r = spawnSync('python3', [scriptPath, '--help'], { encoding: 'utf8', timeout: 5000 });
        log(r.status === 0 || r.stderr?.includes('usage') || r.stdout?.length > 0,
          `[${c.skill}] ${script} executável (exit ${r.status})`);
      } else {
        log(existsSync(scriptPath), `[${c.skill}] ${script} existe em scripts/`);
      }
    }
  }
}

console.log(failed ? `\nFALHOU: ${failed}` : '\nOK: contratos N12 + manifest + conteúdo validados');
process.exit(failed ? 1 : 0);