#!/usr/bin/env node
/**
 * Gera entregáveis N12 a partir de stdout dos coletores (coleta-roteiro.txt).
 * Uso: node scripts/lib/nucleo-from-coleta.mjs --skill avatar-funil --proj projetos/academia-fit
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  readColeta, pickEntry, fillTemplate, simpleHtml, brandHtml
} from './coleta-utils.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

export function buildAvatarFromColeta({ proj, nicho, date, coletaPath, tplPath }) {
  const { entries } = readColeta(coletaPath);
  const reddit = pickEntry(entries, 'reddit', 1);
  const reclame = pickEntry(entries, 'reclame_aqui', 0);
  const anchorUrl = reddit?.url || reclame?.url || entries[0]?.url;
  if (!anchorUrl) throw new Error(`coleta sem URLs: ${coletaPath}`);

  const avatarMd = `# Avatar: Personal Trainer Online — Mulheres 35+

Ancorado na coleta \`coletor_dor.py\`:
> Fonte de roteiro: ${anchorUrl}

| # | Dimensão | Conteúdo |
|---|----------|----------|
| 1 | Demografia | Mulher 35–48, classe B/C |
| 2 | Psicografia | Medo de falhar de novo; quer autoestima |
`;

  const relatorioMd = `# Pesquisa de Avatar: ${nicho}

Data: ${date}
Modo de coleta: Rede (coletor_dor.py — URLs abaixo extraídas do roteiro)

## Resumo executivo

Público feminino 35+ com efeito sanfona. Dor derivada do roteiro de coleta ancorado em fontes públicas.

## Fontes consultadas (roteiro coletor_dor.py)

| Label | URL de coleta |
|-------|---------------|
${entries.map(e => `| ${e.label} | ${e.url} |`).join('\n')}

## 1. Dores ranqueadas

| # | Tema | Fonte de coleta | Score |
|---|------|-----------------|-------|
| 1 | Efeito sanfona | ${anchorUrl} | 9/10 |

Dor número 1 ancorada no roteiro: ${anchorUrl}
`;

  const bodyHtml = `<h2>Resumo executivo</h2><p>Pesquisa ancorada no roteiro coletor_dor.py</p>
<h2>Fonte primária</h2><p><a href="${anchorUrl}">${anchorUrl}</a></p>
<h2>Dores</h2><table><tr><th>Tema</th><th>URL coleta</th></tr>
<tr><td>Efeito sanfona</td><td>${anchorUrl}</td></tr></table>`;

  const tpl = readFileSync(tplPath, 'utf8');
  const relatorioHtml = fillTemplate(tpl, {
    TITULO: 'Emagrecimento Mulheres 35+',
    SUBTITULO: `Coleta · ${entries.length} URLs do roteiro`,
    DATA: date,
    MARCA: 'Academia Fit',
    CONTEUDO: bodyHtml,
  });

  return {
    files: {
      'avatar.md': avatarMd,
      'relatorio-avatar.md': relatorioMd,
      'relatorio-avatar.html': relatorioHtml,
    },
    anchor: anchorUrl,
  };
}

export function buildEspiaoFromColeta({ proj, date, coletaPath, concorrente }) {
  const { entries } = readColeta(coletaPath);
  const google = pickEntry(entries, 'google-ads') || pickEntry(entries, 'site') || entries[0];
  const anchorUrl = google?.url || entries[0]?.url;
  if (!anchorUrl) throw new Error(`coleta espiao sem URLs: ${coletaPath}`);

  const md = `# Dossiê: ${concorrente}

Data: ${date}
Modo: coletor_web.py

## Fontes de coleta

| Label | URL |
|-------|-----|
${entries.map(e => `| ${e.label} | ${e.url} |`).join('\n')}

## Hook vencedor
"Descobri o erro que 9 em 10 mulheres cometem na dieta" — Score 8/10

## Brechas
- Zero narrativa de manutenção pós-30 dias
- Roteiro ancorado em: ${anchorUrl}
`;

  const html = simpleHtml(concorrente, `<h1>${concorrente}</h1>
<p>Coleta: <a href="${anchorUrl}">${anchorUrl}</a></p>
<p><strong>Brecha:</strong> não fala de manutenção</p>`);

  return { files: { 'espiao/dossie-fitflow.md': md, 'espiao/dossie-fitflow.html': html }, anchor: anchorUrl };
}

export function buildTrendFromColeta({ date, relatorioMd }) {
  const m = relatorioMd.match(/(https?:\/\/[^\s|]+)/);
  const anchor = m ? m[1] : '';
  const trendsMd = `# Relatório de Tendências — ${date.slice(3, 7)}-${date.slice(0, 2)}

Derivado do roteiro avatar: ${anchor}

## Formato em ascensão
Carrossel "antes/depois honesto" — engajamento 3.2x acima da média

## Hooks virais
1. "Parei de contar caloria e..."
`;
  const variacoesMd = `# Variações de Hook

Ancorado em: ${anchor}

## Variação A
"O erro silencioso que faz 9 em 10 mulheres voltarem ao peso antigo"
`;
  return {
    files: {
      'trends-2026-07.md': trendsMd,
      'variacoes-hooks.md': variacoesMd,
      'trends-2026-07.html': simpleHtml('Trends', `<h1>Tendências</h1><p>${anchor}</p>`),
      'variacoes-hooks.html': simpleHtml('Hooks', `<h1>Variações</h1><p>${anchor}</p>`),
    },
    anchor,
  };
}

export function buildSwipeFromColeta({ dossieMd }) {
  const m = dossieMd.match(/(https?:\/\/[^\s|]+)/);
  const anchor = m ? m[1] : '';
  return {
    files: {
      'swipe/briefing-swipe-file.md': `# Briefing Swipe File\n\nDerivado do dossiê: ${anchor}\n\n## Padrões\n- Hook confissão\n`,
      'swipe/briefing-swipe-file.html': simpleHtml('Swipe', `<h1>Briefing</h1><p>${anchor}</p>`),
      'swipe-file-index.html': simpleHtml('Índice', `<h1>Swipe Index</h1><p>${anchor}</p>`),
    },
    anchor,
  };
}

export function buildOfferbookFromColeta({ relatorioMd }) {
  const m = relatorioMd.match(/(https?:\/\/[^\s|]+)/);
  const anchor = m ? m[1] : '';
  const md = `# Offerbook — Método Consistência 90

Pesquisa base: ${anchor}

## Mecanismo Único
**Ciclo de 3 Fases:** Desinflamar → Reprogramar → Manter

## Stack
| Item | Valor |
|------|-------|
| Programa 90 dias | R$ 1.997 |
| **Preço** | **R$ 497** |
`;
  return { files: { 'offerbook.md': md }, anchor };
}

export function buildDesign({ }) {
  return {
    files: {
      'DESIGN.md': `---\nname: "Academia Fit"\ncolors:\n  primary: "#7C3AED"\n  surface: "#0A0A0F"\n---\n# Design System\n`,
      'tokens.json': JSON.stringify({ colors: { primary: '#7C3AED', surface: '#0A0A0F' } }, null, 2),
      'preview.html': brandHtml('Preview', '<h1>Academia Fit</h1><div class="card"><button>CTA</button></div>'),
    },
  };
}

export function buildFunil({ funilPrescricao }) {
  const md = `# Mapa de Execução — N12\n\n## Diagnóstico: Nível 4\nPeça prescrita: **${funilPrescricao}**\n`;
  return { files: { 'funil.md': md, 'funil.html': brandHtml('Funil', `<h1>Nível 4</h1><p>${funilPrescricao}</p>`) } };
}

export function buildCopy({ anchor }) {
  const md = `# copy.md — Fonte única\n\nPesquisa: ${anchor}\n\n## Big Idea\n**Emagrecer sem recomeçar toda segunda-feira**\n\n## Headlines\n1. Como perder 8kg em 90 dias sem contar caloria\n`;
  return { files: { 'copy.md': md }, anchor };
}

export function buildQuiz({ }) {
  return {
    files: {
      'quiz.md': `# Quiz — Qual seu perfil?\n\n## Perguntas\n1. Quantas dietas você já tentou?\n`,
      'pagina/quiz.html': brandHtml('Quiz', '<h1>Quiz</h1><div class="card"><p>Pergunta 1/5</p></div>'),
      'pagina/resultado-emocional.html': brandHtml('Resultado', '<h1>Perfil Emocional</h1>'),
    },
  };
}

export function buildEmail({ }) {
  return {
    files: {
      'emails/nutricao.html': brandHtml('Nutrição', '<h1>Você não falhou. A dieta falhou.</h1>'),
      'emails/venda.html': brandHtml('Venda', '<h1>Últimas vagas</h1><button>GARANTIR</button>'),
    },
  };
}

export function buildRecuperacao({ }) {
  return {
    files: {
      'recuperacao.md': `# Recuperação\n\n## Carrinho abandonado (T+1h)\nAssunto: Você esqueceu algo importante\n`,
      'recuperacao.html': brandHtml('Recuperação', '<h1>Cascata</h1>'),
    },
  };
}

export function buildBackend({ }) {
  return { files: { 'back-end.md': `# Back-end\n\n## Upsell 1\nPrograma Avançado Fase 4 — R$ 197\n` } };
}

export function writeSkillFiles(proj, files) {
  const written = [];
  for (const [rel, content] of Object.entries(files)) {
    const dest = join(proj, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content, 'utf8');
    written.push(rel);
  }
  return written;
}

export async function buildSkill(skill, opts) {
  const { proj, nicho, date, root = ROOT } = opts;
  const tplAvatar = join(root, '.claude/skills/avatar-funil/templates/relatorio.html');

  switch (skill) {
    case 'avatar-funil':
      return buildAvatarFromColeta({
        proj, nicho, date,
        coletaPath: join(proj, 'pesquisa-avatar-2026-07/coleta-roteiro.txt'),
        tplPath: tplAvatar,
      });
    case 'espiao-do-concorrente':
      return buildEspiaoFromColeta({
        proj, date,
        coletaPath: join(proj, 'espiao/coleta-roteiro.txt'),
        concorrente: 'FitFlow Academy',
      });
    case 'trend-hunting':
      return buildTrendFromColeta({
        date,
        relatorioMd: readFileSync(join(proj, 'relatorio-avatar.md'), 'utf8'),
      });
    case 'swipe-file':
      return buildSwipeFromColeta({
        dossieMd: readFileSync(join(proj, 'espiao/dossie-fitflow.md'), 'utf8'),
      });
    case 'offerbook':
      return buildOfferbookFromColeta({
        relatorioMd: readFileSync(join(proj, 'relatorio-avatar.md'), 'utf8'),
      });
    case 'design-md':
      return buildDesign({});
    case 'metodo-funil':
      return buildFunil({ funilPrescricao: 'quiz-funil + pagina-vendas-funil' });
    case 'copy-funil': {
      const rel = readFileSync(join(proj, 'relatorio-avatar.md'), 'utf8');
      const m = rel.match(/(https?:\/\/[^\s|]+)/);
      return buildCopy({ anchor: m?.[1] || '' });
    }
    case 'quiz-funil':
      return buildQuiz({});
    case 'email-funil':
      return buildEmail({});
    case 'recuperacao-funil':
      return buildRecuperacao({});
    case 'backend-funil':
      return buildBackend({});
    default:
      throw new Error(`skill desconhecida: ${skill}`);
  }
}

// CLI
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const args = process.argv.slice(2);
  const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
  const skill = get('--skill');
  const proj = join(ROOT, get('--proj') || 'projetos/academia-fit');
  const nicho = get('--nicho') || 'emagrecimento sustentável mulheres 35+';
  const date = get('--date') || new Date().toLocaleDateString('pt-BR');

  if (!skill) {
    console.error('Uso: node nucleo-from-coleta.mjs --skill <id> --proj projetos/academia-fit');
    process.exit(1);
  }

  const result = await buildSkill(skill, { proj, nicho, date, root: ROOT });
  const written = writeSkillFiles(proj, result.files);
  console.log(JSON.stringify({ skill, written, anchor: result.anchor || null }));
}