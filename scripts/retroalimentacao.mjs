#!/usr/bin/env node
/**
 * scripts/retroalimentacao.mjs — transforma o bundle da Aula 4 em RETROALIMENTAÇÃO
 * para as skills das Aulas 1 e 2 (avatar/nicho e oferta/copy).
 *
 * Lê o bundle (dados reais, sem PII) e escreve um markdown estruturado que as
 * outras skills conseguem consumir: quem é o público que responde, o que compra,
 * como fala, quando responde, e o que isso muda no avatar e na copy.
 * Cada achado carrega o SELO (Real/Estimado/Calculado) — contrato não-inferir.
 *
 * Uso:
 *   node scripts/retroalimentacao.mjs --dados=projetos/{slug}/dados-trafego/bundle.json \
 *     [--board=projetos/{slug}/dados-trafego/board.json] \
 *     [--saida=projetos/{slug}/dados-trafego/retroalimentacao.md]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, isAbsolute } from 'node:path';

function parseArgs(argv) {
  const out = { dados: null, board: null, saida: null };
  for (const a of argv) {
    if (a.startsWith('--dados=')) out.dados = a.slice(8);
    else if (a.startsWith('--board=')) out.board = a.slice(8);
    else if (a.startsWith('--saida=')) out.saida = a.slice(8);
  }
  return out;
}
const abs = (p) => (isAbsolute(p) ? p : resolve(process.cwd(), p));
const brl = (v) => v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = (v) => v == null ? '—' : Number(v).toLocaleString('pt-BR');
const pct1 = (v) => v == null ? '—' : Number(v).toFixed(1).replace('.', ',') + '%';

const UF_NOMES = { acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE', 'distrito federal': 'DF', 'federal district': 'DF', 'espirito santo': 'ES', goias: 'GO', maranhao: 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG', para: 'PA', paraiba: 'PB', parana: 'PR', pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS', rondonia: 'RO', roraima: 'RR', 'santa catarina': 'SC', 'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO' };
const ufDe = (nome) => {
  if (!nome) return null;
  let n = String(nome).toLowerCase().replace(/\s*\((state|estado)\)\s*/g, '').trim();
  try { n = n.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch { /* noop */ }
  return UF_NOMES[n] || null;
};

function gerar(bundle, board) {
  const L = [];
  const d = bundle.demografia, V = bundle.vendas, p = bundle.perfil || {}, s = p.sentimento;
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  L.push('# Retroalimentação — dados de tráfego → Aulas 1 e 2');
  L.push('');
  L.push(`> Gerado pela Central de Dados (Aula 4) em ${bundle.gerado_em || 'data desconhecida'} · janela de ${bundle.periodo_dias || 30} dias.`);
  L.push('> Selos: **Real** (pronto da Meta/caixa) · **Estimado** (atribuição) · **Calculado** (derivado de valores Real).');
  L.push('> Sem PII: nenhum nome/e-mail de comprador ou autor de comentário entra aqui.');
  L.push('');

  // ---- Aula 1: avatar/nicho ----
  L.push('## Para a Aula 1 (avatar & nicho)');
  L.push('');
  if (d && (d.idade_genero || []).length) {
    const ages = {}; let tF = 0, tM = 0;
    for (const x of d.idade_genero) { const a = x.idade || '?'; ages[a] = (ages[a] || 0) + (x.impressions || 0); if (x.genero === 'female') tF += x.impressions || 0; if (x.genero === 'male') tM += x.impressions || 0; }
    const fx = Object.entries(ages).sort((a, b) => b[1] - a[1]);
    const tot = tF + tM || 1;
    const ufs = {};
    for (const r of (d.regiao || [])) { const u = ufDe(r.regiao); if (u) ufs[u] = (ufs[u] || 0) + (r.impressions || 0); }
    const topUF = Object.entries(ufs).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const totUF = Object.values(ufs).reduce((a, b) => a + b, 0) || 1;
    L.push(`- **Faixa etária que os anúncios alcançam** [Real]: dominante **${fx[0][0]}**${fx[1] ? `, seguida de ${fx[1][0]}` : ''}. Gênero: **${Math.round(tM / tot * 100)}% masculino / ${Math.round(tF / tot * 100)}% feminino**.`);
    if (topUF.length) L.push(`- **Geografia** [Real]: ${topUF.map(([u, v]) => `${u} (${pct1(v / totUF * 100)})`).join(' · ')}.`);
    L.push('- *Cuidado honesto:* é a audiência PAGA (quem viu anúncio) — valide contra a base de COMPRADORES antes de mudar o avatar.');
  } else L.push('- (demografia indisponível nesta coleta)');
  if (s && s.temas && s.temas.length) {
    L.push(`- **Como o público fala / o que valoriza** [leitura por IA sobre comentários Reais]: ${s.temas.join('; ')}.`);
  }
  L.push('');

  // ---- Aula 2: oferta/copy ----
  L.push('## Para a Aula 2 (oferta & copy)');
  L.push('');
  if (V && V.conectada !== false && V.resumo) {
    const tp = (V.por_produto || []).slice(0, 5);
    L.push(`- **O que vende** [Real, caixa]: ticket médio **${brl(V.resumo.ticket_medio)}**, ${int(V.resumo.vendas_aprovadas)} vendas na janela.`);
    if (tp.length) L.push(`- **Produtos que puxam receita** [Real]: ${tp.map((x) => `${x.produto} (${brl(x.receita)})`).join(' · ')}.`);
  } else L.push('- (vendas não conectadas nesta coleta)');
  if (s && (s.destaques || []).length) {
    L.push('- **Prova social real (citações de comentários, sem autor):**');
    for (const dq of s.destaques.filter((x) => x.tom === 'positivo')) L.push(`  - "${dq.texto}"`);
    const neg = s.destaques.find((x) => x.tom === 'negativo');
    if (neg) L.push(`- **Objeção real a endereçar na copy:** "${neg.texto}"`);
  }
  if (s && s.positivo != null) {
    L.push(`- **Sentimento dos comentários** [leitura por IA]: ${s.positivo} positivo · ${s.neutro} neutro · ${s.negativo} negativo${s.metodo ? ` (${s.metodo})` : ''}.`);
  }
  L.push('');

  // ---- Tráfego: quando e onde ----
  L.push('## Para o tráfego (Aula 3/4 — quando e onde insistir)');
  L.push('');
  if (bundle.heatmap && (bundle.heatmap.celulas || []).length) {
    const conf = bundle.heatmap.celulas.filter((c) => (c.impressions || 0) >= 500 && c.ctr != null).sort((a, b) => b.ctr - a.ctr).slice(0, 3);
    if (conf.length) L.push(`- **Melhores janelas de CTR** [Calculado, amostra ≥500 impr]: ${conf.map((c) => `${dias[c.dia]} ${String(c.hora).padStart(2, '0')}h (${pct1(c.ctr)})`).join(' · ')}.`);
  }
  const camps = (bundle.campanhas || []).filter((c) => !c.sem_dados);
  if (camps.length) {
    const byCtr = camps.filter((c) => (c.impressions || 0) > 10000).sort((a, b) => (b.ctr || 0) - (a.ctr || 0))[0];
    if (byCtr) L.push(`- **Campanha com melhor CTR (amostra >10k impr)** [Real]: "${byCtr.label || byCtr.nome}" — CTR ${pct1(byCtr.ctr)}, gasto ${brl(byCtr.spend)}.`);
  }
  if (bundle.atribuicao && bundle.atribuicao.teto_roas != null) {
    L.push(`- **Teto ROAS** [Calculado]: ${bundle.atribuicao.teto_roas}x (receita de TODOS os canais ÷ gasto Meta — teto, não o ROAS da Meta). Rastreio por campanha: ${bundle.atribuicao.pct_campanha_rastreada || 0}% — priorize UTM/SCK para atribuição Real.`);
  }
  if (board && board.sintese) {
    L.push('');
    L.push(`## Síntese do board de especialistas`);
    L.push('');
    L.push(`> ${board.sintese}`);
  }
  L.push('');
  L.push('---');
  L.push('*A decisão é sua — este arquivo recomenda, você aprova (gate VOCÊ REVISA). Gerado por `scripts/retroalimentacao.mjs`.*');
  return L.join('\n') + '\n';
}

const args = parseArgs(process.argv.slice(2));
if (!args.dados) { process.stderr.write('Uso: node scripts/retroalimentacao.mjs --dados=bundle.json [--board=board.json] [--saida=retroalimentacao.md]\n'); process.exit(1); }
const bundle = JSON.parse(readFileSync(abs(args.dados), 'utf8'));
const board = args.board && existsSync(abs(args.board)) ? JSON.parse(readFileSync(abs(args.board), 'utf8')) : null;
const md = gerar(bundle, board);
if (args.saida) {
  const dest = abs(args.saida);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, md);
  process.stderr.write(`Retroalimentação salva em ${dest}\n`);
} else process.stdout.write(md);
