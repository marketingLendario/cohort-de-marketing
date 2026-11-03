import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Ordem e arquivos do funil, iguais aos que a skill status-funil confere.
const ETAPAS = [
  { chave: 'avatar', nome: 'Avatar', alvo: 'avatar.md', skill: 'avatar-funil' },
  { chave: 'oferta', nome: 'Oferta', alvo: 'offerbook.md', skill: 'offerbook' },
  { chave: 'design', nome: 'Identidade visual', alvo: 'DESIGN.md', skill: 'design-md' },
  { chave: 'funil', nome: 'Diagnóstico do funil', alvo: 'funil.md', skill: 'metodo-funil' },
  { chave: 'copy', nome: 'Copy', alvo: 'copy.md', skill: 'copy-funil' },
  { chave: 'pagina', nome: 'Página de vendas', alvo: 'pagina/', skill: 'pagina-vendas-funil' },
  { chave: 'emails', nome: 'E-mails', alvo: 'emails/', skill: 'email-funil' },
  { chave: 'conteudo', nome: 'Conteúdo', alvo: 'conteudo/', skill: 'conteudo-funil' },
  { chave: 'recuperacao', nome: 'Recuperação', alvo: 'recuperacao.md', skill: 'recuperacao-funil' },
  { chave: 'backend', nome: 'Back-end', alvo: 'back-end.md', skill: 'backend-funil' },
  { chave: 'cro', nome: 'CRO e testes', alvo: 'cro.md', skill: 'cro-funil' },
];

const EXTRAS = [
  { nome: 'VSL', alvo: 'vsl.md' },
  { nome: 'Advertorial', alvo: 'advertorial.md' },
  { nome: 'Quiz', alvo: 'quiz.md' },
  { nome: 'Webinário', alvo: 'webinario.md' },
  { nome: 'Lançamento', alvo: 'lancamento.md' },
  { nome: 'WhatsApp', alvo: 'whatsapp.md' },
  { nome: 'Criativos', alvo: 'criativos/' },
  { nome: 'Mockups', alvo: 'mockups/' },
];

function ehArquivo(caminho) {
  try { return statSync(caminho).isFile(); } catch { return false; }
}

// Caminho relativo da peça para abrir no visualizador, ou null se ela não existe.
// Prefere o .html (o que o dono lê) ao .md (fonte interna).
function localizar(dir, alvo) {
  if (alvo.endsWith('/')) {
    const pasta = alvo.slice(0, -1);
    const abs = join(dir, pasta);
    let nomes;
    try { nomes = readdirSync(abs).filter((n) => !n.startsWith('.')).sort(); } catch { return null; }
    if (nomes.includes('index.html')) return `${pasta}/index.html`;
    const primeiro = nomes.find((n) => ehArquivo(join(abs, n)));
    return primeiro ? `${pasta}/${primeiro}` : null;
  }
  if (!ehArquivo(join(dir, alvo))) return null;
  const html = alvo.replace(/\.md$/, '.html');
  return html !== alvo && ehArquivo(join(dir, html)) ? html : alvo;
}

function lerPendencias(dir) {
  if (!ehArquivo(join(dir, 'pendencias.md'))) return null;
  const linhas = readFileSync(join(dir, 'pendencias.md'), 'utf8').split('\n');
  return {
    abertas: linhas.filter((l) => /^\s*[-*]\s+\[ \]/.test(l)).length,
    resolvidas: linhas.filter((l) => /^\s*[-*]\s+\[[xX]\]/.test(l)).length,
    abrir: ehArquivo(join(dir, 'pendencias.html')) ? 'pendencias.html' : 'pendencias.md',
  };
}

export function resumoProjeto(dir, runs) {
  const etapas = ETAPAS.map((e) => {
    const abrir = localizar(dir, e.alvo);
    return { chave: e.chave, nome: e.nome, skill: e.skill, feito: abrir !== null, abrir };
  });
  const pendente = etapas.find((e) => !e.feito);

  const porSkill = new Map();
  for (const r of runs) {
    const atual = porSkill.get(r.skill) ?? { skill: r.skill, vezes: 0, ultima: r.criadoEm };
    atual.vezes += 1;
    if (String(r.criadoEm) > String(atual.ultima)) atual.ultima = r.criadoEm;
    porSkill.set(r.skill, atual);
  }

  const custo = runs.reduce((soma, r) => soma + (Number(r.custoUsd) || 0), 0);
  return {
    etapas,
    feitas: etapas.filter((e) => e.feito).length,
    proxima: pendente ? { chave: pendente.chave, nome: pendente.nome, skill: pendente.skill } : null,
    extras: EXTRAS.map((x) => ({ nome: x.nome, abrir: localizar(dir, x.alvo) })).filter((x) => x.abrir),
    book: existsSync(join(dir, 'index.html')) && ehArquivo(join(dir, 'index.html')) ? 'index.html' : null,
    pendencias: lerPendencias(dir),
    execucoes: {
      total: runs.length,
      concluidas: runs.filter((r) => r.estado === 'concluido').length,
      custoUsd: Math.round(custo * 100) / 100,
      ultima: runs.reduce((u, r) => (u === null || String(r.criadoEm) > u ? String(r.criadoEm) : u), null),
    },
    skillsUsadas: [...porSkill.values()].sort((a, b) => b.vezes - a.vezes || String(b.ultima).localeCompare(String(a.ultima))),
  };
}
