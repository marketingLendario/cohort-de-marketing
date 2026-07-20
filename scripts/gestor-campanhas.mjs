#!/usr/bin/env node
/**
 * scripts/gestor-campanhas.mjs — Gestor de Campanhas (Aula 4+): realizado vs planejado.
 *
 * Compara os últimos 7 e 30 dias REALIZADOS (bundle da Central de Dados) com a
 * CAMPANHA PLANEJADA (PAINEL-DA-SEMANA.yaml do squad — verba diária, período,
 * critérios de sucesso/reversão) e escreve o relatório de gestão + insumo de
 * retroalimentação. Contrato do Leitor: valores prontos = Real; derivados = Calculado;
 * ROAS de plataforma = Estimado. O Gestor recomenda — a decisão é do aluno.
 *
 * Uso:
 *   node scripts/gestor-campanhas.mjs --dados=projetos/{slug}/dados-trafego/bundle.json \
 *     [--plano=projetos/{slug}/PAINEL-DA-SEMANA.yaml] \
 *     [--saida=projetos/{slug}/dados-trafego/gestao-campanhas.md]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, isAbsolute } from 'node:path';

function parseArgs(argv) {
  const out = { dados: null, plano: null, saida: null };
  for (const a of argv) {
    if (a.startsWith('--dados=')) out.dados = a.slice(8);
    else if (a.startsWith('--plano=')) out.plano = a.slice(8);
    else if (a.startsWith('--saida=')) out.saida = a.slice(8);
  }
  return out;
}
const abs = (p) => (isAbsolute(p) ? p : resolve(process.cwd(), p));
const brl = (v) => v == null ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = (v) => v == null ? '—' : Number(v).toLocaleString('pt-BR');
const pct1 = (v) => v == null ? '—' : Number(v).toFixed(2).replace('.', ',') + '%';
const dv = (real, plano) => (plano ? Number(((real - plano) / plano * 100).toFixed(1)) : null);

// Parse mínimo do PAINEL-DA-SEMANA.yaml (sem dependências): só as chaves do plano.
function lerPlano(path) {
  if (!path || !existsSync(abs(path))) return null;
  const t = readFileSync(abs(path), 'utf8');
  const pega = (re) => { const m = t.match(re); return m ? m[1].trim().replace(/^"|"$/g, '') : null; };
  const num = (v) => (v == null || v === '' || v === 'null' ? null : Number(v));
  return {
    campanha: pega(/^campanha:\s*(.+)$/m),
    verba_diaria: num(pega(/verba_diaria:\s*([\d.]+|null)/)),
    periodo_dias: num(pega(/periodo_dias:\s*(\d+|null)/)),
    campaign_id: pega(/campaign_id:\s*"?([\d]*)"?/),
    criterio_sucesso: pega(/criterio_sucesso:\s*"?([^"\n]*)"?/),
    criterio_reversao: pega(/criterio_reversao:\s*"?([^"\n]*)"?/),
    status: pega(/^\s{2}status:\s*"?([a-z_]+)"?/m),
  };
}

// Janela de N dias (relativa ao último dia da série) somada dos diários do bundle.
function janela(bundle, nDias) {
  const dias = (bundle.series && bundle.series.dia) || [];
  if (!dias.length) return null;
  const datas = dias.map((d) => d.periodo).sort();
  const max = datas[datas.length - 1];
  const d0 = new Date(`${max}T00:00:00Z`); d0.setUTCDate(d0.getUTCDate() - (nDias - 1));
  const ini = d0.toISOString().slice(0, 10);
  const sel = dias.filter((d) => d.periodo >= ini);
  const soma = (k) => Number(sel.reduce((s, d) => s + (d[k] || 0), 0).toFixed(2));
  const spend = soma('spend'), impressions = soma('impressions'), clicks = soma('clicks');
  const fd = (bundle.funil_por_dia || []).filter((d) => d.data >= ini);
  const compra = fd.reduce((s, d) => s + (d.compra || 0), 0);
  const checkout = fd.reduce((s, d) => s + (d.checkout || 0), 0);
  const vd = ((bundle.vendas && bundle.vendas.por_dia) || []).filter((d) => d.data >= ini);
  const receitaCaixa = Number(vd.reduce((s, d) => s + (d.receita || 0), 0).toFixed(2));
  return { ini, fim: max, dias: sel.length, spend, impressions, clicks,
    ctr: impressions ? Number((clicks / impressions * 100).toFixed(3)) : null, // Calculado
    compra, checkout, receitaCaixa };
}

function linha(nome, j7, j30, fmt) {
  return `| ${nome} | ${fmt(j7)} | ${fmt(j30)} |`;
}

function gerar(bundle, plano) {
  const j7 = janela(bundle, 7), j30 = janela(bundle, 30);
  const L = [];
  L.push('# Gestão de campanhas — realizado (7/30 dias) × planejado');
  L.push('');
  L.push(`> Gerado em ${bundle.gerado_em || '—'} sobre o bundle da Central de Dados (Aula 4). Selos: Real (Meta/caixa), Calculado (derivado), Estimado (atribuição).`);
  L.push('');
  if (!j7 || !j30) { L.push('**Sem série diária no bundle** — rode a coleta (Modo API) antes.'); return L.join('\n') + '\n'; }
  L.push(`## Realizado (conta inteira)`);
  L.push('');
  L.push(`| Métrica | Últimos 7d (${j7.ini}→${j7.fim}) | Últimos 30d (${j30.ini}→${j30.fim}) |`);
  L.push('|---|---|---|');
  L.push(linha('Gasto [Real]', j7, j30, (j) => brl(j.spend)));
  L.push(linha('Impressões [Real]', j7, j30, (j) => int(j.impressions)));
  L.push(linha('Cliques [Real]', j7, j30, (j) => int(j.clicks)));
  L.push(linha('CTR [Calculado]', j7, j30, (j) => pct1(j.ctr)));
  L.push(linha('Compras (pixel) [Real]', j7, j30, (j) => int(j.compra)));
  L.push(linha('Checkouts (pixel) [Real]', j7, j30, (j) => int(j.checkout)));
  L.push(linha('Receita caixa (todos os canais) [Real]', j7, j30, (j) => brl(j.receitaCaixa)));
  L.push('');
  L.push('## Planejado × realizado');
  L.push('');
  if (plano && (plano.verba_diaria || plano.criterio_sucesso)) {
    L.push(`Campanha do plano: **${plano.campanha || '—'}** · status: ${plano.status || '—'}`);
    L.push('');
    if (plano.verba_diaria) {
      const p7 = plano.verba_diaria * 7, p30 = plano.verba_diaria * 30;
      const d7 = dv(j7.spend, p7), d30 = dv(j30.spend, p30);
      L.push(`- **Verba** [plano: ${brl(plano.verba_diaria)}/dia]: 7d realizado ${brl(j7.spend)} vs planejado ${brl(p7)} (**${d7 > 0 ? '+' : ''}${d7}%**) · 30d ${brl(j30.spend)} vs ${brl(p30)} (**${d30 > 0 ? '+' : ''}${d30}%**). [Calculado]`);
      const alerta = Math.abs(d7) > 20 ? `  - ⚠ desvio de verba em 7d acima de 20% — confira pausas/limites no Gerenciador.` : null;
      if (alerta) L.push(alerta);
    } else L.push('- Verba planejada não preenchida no PAINEL-DA-SEMANA (estruturador.verba_diaria).');
    if (plano.criterio_sucesso) L.push(`- **Critério de sucesso do plano:** ${plano.criterio_sucesso} → confira contra a tabela acima (o Gestor não decide por você).`);
    if (plano.criterio_reversao) L.push(`- **Critério de reversão:** ${plano.criterio_reversao}.`);
  } else {
    L.push('- **Plano não encontrado/preenchido** (PAINEL-DA-SEMANA.yaml). O Gestor comparou só o realizado 7×30. Preencha `estruturador.verba_diaria` e `diagnostico.criterio_sucesso` para o confronto completo.');
  }
  L.push('');
  L.push('## Leitura do Gestor (7d vs 30d — tendência)');
  L.push('');
  const m7 = j7.spend / Math.max(1, j7.dias), m30 = j30.spend / Math.max(1, j30.dias);
  const ritmo = dv(m7, m30);
  L.push(`- Ritmo de gasto: média 7d ${brl(m7)}/dia vs média 30d ${brl(m30)}/dia (${ritmo > 0 ? '+' : ''}${ritmo}%). [Calculado]`);
  if (j7.ctr != null && j30.ctr != null) {
    const dctr = dv(j7.ctr, j30.ctr);
    L.push(`- CTR: ${pct1(j7.ctr)} (7d) vs ${pct1(j30.ctr)} (30d) → ${dctr > 5 ? 'melhorando' : (dctr < -5 ? 'caindo — atenção a fadiga de criativo' : 'estável')} (${dctr > 0 ? '+' : ''}${dctr}%). [Calculado]`);
  }
  if (j30.compra) {
    L.push(`- Conversão (pixel): ${int(j7.compra)} compras em 7d vs ${int(j30.compra)} em 30d. Amostra 7d ${j7.compra < 10 ? 'BAIXA para decidir por CPA — leia sinal de topo' : 'ok'}. [Real]`);
  }
  L.push('');
  L.push('---');
  L.push('*O Gestor recomenda; quem decide é você (gate VOCÊ REVISA). Mudanças de verba/criativo voltam pro Estruturador/Diagnosticador com a sua aprovação.*');
  return L.join('\n') + '\n';
}

const args = parseArgs(process.argv.slice(2));
if (!args.dados) { process.stderr.write('Uso: node scripts/gestor-campanhas.mjs --dados=bundle.json [--plano=PAINEL-DA-SEMANA.yaml] [--saida=gestao-campanhas.md]\n'); process.exit(1); }
const bundle = JSON.parse(readFileSync(abs(args.dados), 'utf8'));
const plano = lerPlano(args.plano);
const md = gerar(bundle, plano);
if (args.saida) {
  const dest = abs(args.saida);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, md);
  process.stderr.write(`Relatório de gestão salvo em ${dest}\n`);
} else process.stdout.write(md);
