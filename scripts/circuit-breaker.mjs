#!/usr/bin/env node
/**
 * scripts/circuit-breaker.mjs — Gatilho de stop-loss do Squad de Tráfego.
 *
 * Avalia com dados reais da Graph API os gatilhos que autorizam furar a
 * regra "não mexer 7 dias" do Estruturador:
 *
 *   v1 (sempre): gasto >= 2× CPA-alvo  E  0 conversões  E  CTR < 0,5%
 *   saturação (só --publico-tipo=morno|quente):
 *       frequência >= 8 em 7d
 *       OU entrega estagnada (impressões diárias caindo > 50% com verba constante)
 *     → exit 3 com motivo "saturacao_publico", mesmo sem estourar o CPA.
 *
 * O gatilho v1 é avaliado SEMPRE e permanece inalterado — a régua de saturação
 * só ADICIONA um caminho novo para quente/morno (retargeting satura rápido).
 * Sem --publico-tipo (default frio): comportamento e saída idênticos ao v1.
 *
 * Honestidade sobre o ramo de estagnação: ele só "conta" quando a série diária
 * de 7d (time_increment) tem dias suficientes E a verba ficou aproximadamente
 * constante — senão a queda de impressões pode ser de orçamento, não saturação,
 * e o script cai só no ramo de frequência, documentando o motivo (não afirma o
 * que a série não permite ver).
 *
 * Somente leitura. Este script NÃO pausa nada — ele informa o Diagnosticador,
 * que recomenda, e o aluno decide.
 *
 * Uso:
 *   node scripts/circuit-breaker.mjs --campaign-id=X --cpa-alvo=50 [--publico-tipo=frio|morno|quente] [--json]
 *   (janela v1: desde o início da campanha — date_preset=maximum; saturação: last_7d)
 */

import { realpathSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findEnvFile, loadEnv, buildCtx, graphGet, hint } from './lib/meta-graph.mjs';

const CTR_MINIMO = 0.5;

// Régua de saturação (Fase D / Story 19.W3.1) — só morno/quente.
const FREQ_SATURACAO = 8;        // frequência acumulada na janela de 7d
const QUEDA_IMPRESSOES = 0.5;    // queda das impressões diárias > 50%
const SPEND_TOLERANCIA = 0.2;    // "verba constante": variação do gasto médio <= 20%
const MIN_DIAS_ESTAGNACAO = 4;   // série mais curta não permite avaliar estagnação com honestidade

const ORIENT_V1_ACIONADO = 'Gatilho ACIONADO: a regra dos 7 dias está oficialmente furada. Diagnosticador pode recomendar revisão de criativo/ângulo antes do prazo — decisão final é do aluno.';
const ORIENT_V1_NAO = 'Gatilho NÃO acionado: respeite os 7 dias sem mexer. Fora deste gatilho nomeado, edição reseta o aprendizado do algoritmo.';
const ORIENT_SATURACAO = 'Saturação de público (motivo saturacao_publico): o público morno/quente cansou antes de estourar o CPA. Diagnosticador pode recomendar pausar a campanha quente e renovar exclusões/criativos — decisão final é do aluno.';

function parseArgs(argv) {
  const out = { json: false, envPath: null, campaignId: null, cpaAlvo: null, publicoTipo: 'frio', help: false };
  for (const a of argv) {
    if (a === '--json') out.json = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('--campaign-id=')) out.campaignId = a.slice('--campaign-id='.length);
    else if (a.startsWith('--cpa-alvo=')) out.cpaAlvo = Number(a.slice('--cpa-alvo='.length));
    else if (a.startsWith('--publico-tipo=')) out.publicoTipo = a.slice('--publico-tipo='.length);
    else if (a.startsWith('--env=')) out.envPath = a.slice('--env='.length);
  }
  return out;
}

function fail(msg, code = 2) {
  process.stderr.write(msg + '\n');
  process.exit(code);
}

function media(xs) {
  const v = xs.filter((x) => Number.isFinite(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}

// Gatilho v1 — a lógica original, extraída sem mudança para ser testável em
// isolamento (garante a stop condition "v1 inalterado").
export function avaliarGatilhoV1({ gasto, conversoes, ctr }, cpaAlvo) {
  const condGasto = gasto >= 2 * cpaAlvo;
  const condConv = conversoes === 0;
  const condCtr = Number.isFinite(ctr) && ctr < CTR_MINIMO;
  return { condGasto, condConv, condCtr, acionado: condGasto && condConv && condCtr };
}

// Gatilho de saturação — só morno/quente. Puro/sem rede: recebe a frequência
// acumulada de 7d e a série diária já lida da API. Nenhuma métrica é derivada
// além da comparação de médias da própria série (não "inventa" número).
export function avaliarSaturacao({ frequencia7d, serieDiaria = [] }, publicoTipo) {
  const aplica = publicoTipo === 'morno' || publicoTipo === 'quente';
  if (!aplica) {
    return { aplica: false, acionado: false, motivo: null, condicoes: {}, estagnacao_nao_avaliavel: null };
  }

  // Ramo 1 — frequência acumulada na janela.
  const freq = Number(frequencia7d);
  const condFreq = Number.isFinite(freq) && freq >= FREQ_SATURACAO;

  // Ramo 2 — entrega estagnada: impressões diárias caindo > 50% COM verba
  // constante. Só avaliável com série suficiente e gasto aproximadamente estável;
  // senão a queda pode ser de orçamento e não afirmamos o que a série não mostra.
  const serie = serieDiaria.filter((d) => Number.isFinite(d.impressions) && Number.isFinite(d.spend));
  let condEstag = false;
  let estagnacao = null;
  let estagnacaoNaoAvaliavel = null;
  if (serie.length >= MIN_DIAS_ESTAGNACAO) {
    const meio = Math.floor(serie.length / 2);
    const impInicio = media(serie.slice(0, meio).map((d) => d.impressions));
    const impFim = media(serie.slice(-meio).map((d) => d.impressions));
    const spendInicio = media(serie.slice(0, meio).map((d) => d.spend));
    const spendFim = media(serie.slice(-meio).map((d) => d.spend));
    const varSpend = spendInicio > 0 ? Math.abs(spendFim - spendInicio) / spendInicio : Infinity;
    const verbaConstante = Number.isFinite(varSpend) && varSpend <= SPEND_TOLERANCIA;
    const quedaImp = impInicio > 0 ? (impInicio - impFim) / impInicio : 0;
    if (verbaConstante) {
      condEstag = quedaImp > QUEDA_IMPRESSOES;
      estagnacao = { queda_impressoes: Number(quedaImp.toFixed(3)), var_gasto: Number(varSpend.toFixed(3)), dias: serie.length };
    } else {
      estagnacaoNaoAvaliavel = `verba variou ${(varSpend * 100).toFixed(0)}% na série — queda de impressões pode ser de orçamento, não saturação`;
    }
  } else {
    estagnacaoNaoAvaliavel = `série diária com ${serie.length} dia(s) < ${MIN_DIAS_ESTAGNACAO} — insuficiente para avaliar estagnação com honestidade (só o ramo de frequência vale)`;
  }

  const acionado = condFreq || condEstag;
  const condicoes = { [`frequência >= ${FREQ_SATURACAO} em 7d`]: condFreq };
  if (estagnacaoNaoAvaliavel === null) {
    condicoes['entrega estagnada (impressões diárias caindo > 50% com verba constante)'] = condEstag;
  }

  return {
    aplica: true,
    acionado,
    motivo: acionado ? 'saturacao_publico' : null,
    frequencia_7d: Number.isFinite(freq) ? freq : null,
    condicoes,
    estagnacao,
    estagnacao_nao_avaliavel: estagnacaoNaoAvaliavel,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.campaignId || !args.cpaAlvo || !Number.isFinite(args.cpaAlvo) || args.cpaAlvo <= 0) {
    fail('Uso: node scripts/circuit-breaker.mjs --campaign-id=<id> --cpa-alvo=<R$> [--publico-tipo=frio|morno|quente] [--json]');
  }
  if (!['frio', 'morno', 'quente'].includes(args.publicoTipo)) {
    fail(`--publico-tipo inválido: "${args.publicoTipo}" (use frio|morno|quente). Leia estruturador.publico_tipo do Painel; ausente ⇒ frio.`);
  }
  const envPath = findEnvFile(args.envPath, dirname(fileURLToPath(import.meta.url)));
  if (!envPath) fail('.env não encontrado.');
  const env = loadEnv(envPath);
  if (!env.META_ACCESS_TOKEN) fail('META_ACCESS_TOKEN ausente no .env.');
  const ctx = buildCtx(env);

  // Query agregada (janela = maximum, como v1). `frequency` é usado só na régua de
  // saturação (morno/quente); no frio nada o exibe, então a saída fica idêntica.
  const r = await graphGet(`${args.campaignId}/insights`, {
    date_preset: 'maximum',
    fields: 'spend,ctr,actions,impressions,frequency,date_start,date_stop',
  }, ctx);
  if (!r.ok) fail(`Erro na Graph API: ${r.message}\n→ ${hint(r.code, 'Confira o campaign-id.')}`, 1);
  const row = (r.data.data || [])[0];
  if (!row) fail('Campanha sem dados de entrega ainda — circuit-breaker não se aplica.', 1);

  const gasto = Number(row.spend) || 0;
  const ctr = Number(row.ctr);
  const acts = Object.fromEntries((row.actions || []).map((a) => [a.action_type, Number(a.value)]));
  const conversoes = acts.omni_purchase ?? acts.purchase ?? acts.lead ?? acts['offsite_conversion.fb_pixel_lead'] ?? 0;

  const v1 = avaliarGatilhoV1({ gasto, conversoes, ctr }, args.cpaAlvo);

  // Régua de saturação: só morno/quente puxa a série diária de 7d e a frequência
  // acumulada. No frio, nenhuma query extra roda e a saída permanece a do v1.
  let saturacao = { aplica: false, acionado: false, motivo: null };
  if (args.publicoTipo !== 'frio') {
    const serieR = await graphGet(`${args.campaignId}/insights`, {
      date_preset: 'last_7d',
      time_increment: 1,
      fields: 'impressions,spend,date_start',
    }, ctx);
    const serieDiaria = (serieR.ok ? serieR.data.data || [] : []).map((d) => ({
      date: d.date_start, impressions: Number(d.impressions), spend: Number(d.spend),
    }));
    saturacao = avaliarSaturacao({ frequencia7d: Number(row.frequency), serieDiaria }, args.publicoTipo);
  }

  const acionadoFinal = v1.acionado || saturacao.acionado;
  const orientacao = saturacao.acionado
    ? ORIENT_SATURACAO
    : (acionadoFinal ? ORIENT_V1_ACIONADO : ORIENT_V1_NAO);

  const report = {
    campaign_id: args.campaignId,
    janela: `${row.date_start} → ${row.date_stop}`,
    cpa_alvo: args.cpaAlvo,
    gasto,
    conversoes,
    ctr,
    condicoes: {
      [`gasto >= 2x CPA-alvo (R$${(2 * args.cpaAlvo).toFixed(2)})`]: v1.condGasto,
      'zero conversões': v1.condConv,
      [`CTR < ${CTR_MINIMO}%`]: v1.condCtr,
    },
    circuit_breaker_acionado: acionadoFinal,
    orientacao,
  };
  if (saturacao.aplica) {
    report.publico_tipo = args.publicoTipo;
    report.motivo = saturacao.motivo;
    report.saturacao = {
      acionado: saturacao.acionado,
      frequencia_7d: saturacao.frequencia_7d,
      condicoes: saturacao.condicoes,
      estagnacao: saturacao.estagnacao,
      estagnacao_nao_avaliavel: saturacao.estagnacao_nao_avaliavel,
    };
  }

  if (args.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else {
    process.stdout.write(`\nCircuit-breaker — campanha ${report.campaign_id} (${report.janela})\n\n`);
    for (const [k, v] of Object.entries(report.condicoes)) {
      process.stdout.write(` ${v ? '⚠ SIM' : '· não'}  ${k}\n`);
    }
    process.stdout.write(`\n Gasto: R$${gasto.toFixed(2)} · Conversões: ${conversoes} · CTR: ${Number.isFinite(ctr) ? ctr.toFixed(2) : '?'}%\n`);
    if (report.saturacao) {
      process.stdout.write(`\n Régua de saturação (${report.publico_tipo}) — gatilho adicional:\n`);
      for (const [k, v] of Object.entries(report.saturacao.condicoes)) {
        process.stdout.write(`   ${v ? '⚠ SIM' : '· não'}  ${k}\n`);
      }
      if (report.saturacao.estagnacao_nao_avaliavel) {
        process.stdout.write(`   ℹ estagnação diária não avaliada: ${report.saturacao.estagnacao_nao_avaliavel}\n`);
      }
    }
    process.stdout.write(`\n${report.circuit_breaker_acionado ? '🔴 ACIONADO' : '🟢 NÃO ACIONADO'} — ${report.orientacao}\n`);
  }
  process.exit(report.circuit_breaker_acionado ? 3 : 0);
}

// Só roda o CLI quando executado direto; no import dos testes, main() não dispara
// — que reutilizam avaliarGatilhoV1/avaliarSaturacao sem tocar a rede.
const executadoDireto = (() => {
  if (!process.argv[1]) return false;
  try { return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]); }
  catch { return false; }
})();

if (executadoDireto) {
  main().catch((e) => {
    process.stderr.write(`Erro inesperado: ${e.message}\n`);
    process.exit(2);
  });
}
