#!/usr/bin/env node
/**
 * scripts/hotmart-vendas.mjs — coleta de vendas da Hotmart (caixa real, Aula 4).
 *
 * Puxa o Sales History, filtra por status de receita, extrai o rastreio (sck/src/xcode/UTM)
 * e normaliza cada venda para o formato que o painel/atribuição consomem. Somente leitura.
 *
 * Uso:
 *   node scripts/hotmart-vendas.mjs --dias=30 --json
 *   node scripts/hotmart-vendas.mjs --debug         # mostra o shape cru da 1ª venda (segredos scrubbed)
 *   node scripts/hotmart-vendas.mjs --saida=projetos/{slug}/dados-trafego/vendas.json
 *   Flags: --dias=N --status=APPROVED,COMPLETE --env=/caminho/.env
 *
 * Sem credenciais no .env → mensagem clara apontando o tutorial (nunca quebra).
 */

import { dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import { findEnvFile, loadEnv } from './lib/meta-graph.mjs';
import { buildHotmartCtx, hotmartAuth, hotmartGetAll, STATUS_RECEITA, STATUS_ESTORNO } from './lib/hotmart.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SALES_PATH = '/payments/api/v1/sales/history';

function parseArgs(argv) {
  const out = { json: false, debug: false, dias: 30, status: null, saida: null, envPath: null, produtos: null, help: false };
  for (const a of argv) {
    if (a === '--json') out.json = true;
    else if (a === '--debug') out.debug = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('--dias=')) out.dias = parseInt(a.slice(7), 10) || 30;
    else if (a.startsWith('--status=')) out.status = a.slice(9);
    else if (a.startsWith('--produtos=')) out.produtos = a.slice(11);
    else if (a.startsWith('--saida=')) out.saida = a.slice(8);
    else if (a.startsWith('--env=')) out.envPath = a.slice(6);
  }
  return out;
}

const first = (...vals) => { for (const v of vals) if (v != null && v !== '') return v; return null; };
const isoFrom = (v) => {
  if (v == null) return null;
  const n = Number(v);
  const d = Number.isFinite(n) ? new Date(n > 1e12 ? n : n * 1000) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

// Normaliza uma venda tentando múltiplos caminhos (o shape varia por versão/produto da Hotmart).
function normalizarVenda(item) {
  const p = item.purchase || item || {};
  const prod = item.product || {};
  const track = p.tracking || item.tracking || item.origin || {};
  const price = p.price || p.full_price || item.price || {};
  return {
    transacao: first(p.transaction, item.transaction),
    status: first(p.status, item.status, p.approved_date ? 'APPROVED' : null),
    valor: first(price.value, price.amount, p.value),
    moeda: first(price.currency_value, price.currency_code, price.currency, 'BRL'),
    data: isoFrom(first(p.order_date, p.approved_date, item.order_date, item.date)),
    produto: first(prod.name, prod.ucode, prod.id),
    produto_id: first(prod.id, prod.ucode),
    // rastreio (para atribuição): Hotmart entrega sck/src/xcode; UTM quando presente
    sck: first(track.source_sck, track.sck),
    src: first(track.source, track.src),
    xcode: first(track.external_code, track.xcode),
    utm_source: first(track.utm_source),
    utm_campaign: first(track.utm_campaign),
    utm_content: first(track.utm_content),
  };
}

const soma = (arr) => Number(arr.reduce((s, v) => s + (Number(v.valor) || 0), 0).toFixed(2));

function resumo(vendas) {
  const receita = vendas.filter((v) => STATUS_RECEITA.includes(String(v.status)));
  const estornos = vendas.filter((v) => STATUS_ESTORNO.includes(String(v.status)));
  const comRastreio = receita.filter((v) => v.sck || v.src || v.xcode || v.utm_campaign);
  const receitaAprovada = soma(receita);
  return {
    total_vendas: vendas.length,
    receita_aprovada: receitaAprovada,
    vendas_aprovadas: receita.length,
    ticket_medio: receita.length ? Number((receitaAprovada / receita.length).toFixed(2)) : 0,
    estornos: estornos.length,
    receita_estornada: soma(estornos),
    pct_rastreado: receita.length ? Number((comRastreio.length / receita.length * 100).toFixed(1)) : 0,
  };
}

// Receita aprovada agrupada por produto (Real; sem PII do comprador).
function porProduto(vendas) {
  const receita = vendas.filter((v) => STATUS_RECEITA.includes(String(v.status)));
  const map = new Map();
  for (const v of receita) {
    const k = v.produto || '(sem nome)';
    if (!map.has(k)) map.set(k, { produto: k, receita: 0, vendas: 0 });
    const e = map.get(k); e.receita += Number(v.valor) || 0; e.vendas += 1;
  }
  return [...map.values()].map((e) => ({ ...e, receita: Number(e.receita.toFixed(2)) }))
    .sort((a, b) => b.receita - a.receita);
}

// Receita por canal de origem (src) e por vendedor (sck) — Real, a partir do rastreio existente.
function agrupaPor(vendas, campo, rotuloVazio) {
  const receita = vendas.filter((v) => STATUS_RECEITA.includes(String(v.status)));
  const map = new Map();
  for (const v of receita) {
    const k = (v[campo] || rotuloVazio);
    if (!map.has(k)) map.set(k, { chave: k, receita: 0, vendas: 0 });
    const e = map.get(k); e.receita += Number(v.valor) || 0; e.vendas += 1;
  }
  return [...map.values()].map((e) => ({ ...e, receita: Number(e.receita.toFixed(2)) }))
    .sort((a, b) => b.receita - a.receita);
}

// Receita por dia × produto (agregado, SEM PII) — alimenta o filtro de produtos do painel.
function porDiaProduto(vendas) {
  const receita = vendas.filter((v) => STATUS_RECEITA.includes(String(v.status)) && v.data);
  const map = new Map();
  for (const v of receita) {
    const k = `${v.data}|${v.produto || '(sem nome)'}`;
    if (!map.has(k)) map.set(k, { data: v.data, produto: v.produto || '(sem nome)', receita: 0, vendas: 0 });
    const e = map.get(k); e.receita += Number(v.valor) || 0; e.vendas += 1;
  }
  return [...map.values()].map((e) => ({ ...e, receita: Number(e.receita.toFixed(2)) }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

// Receita aprovada por dia (para cruzar com o gasto diário da Meta na atribuição temporal).
function porDia(vendas) {
  const receita = vendas.filter((v) => STATUS_RECEITA.includes(String(v.status)) && v.data);
  const map = new Map();
  for (const v of receita) {
    if (!map.has(v.data)) map.set(v.data, { data: v.data, receita: 0, vendas: 0 });
    const e = map.get(v.data); e.receita += Number(v.valor) || 0; e.vendas += 1;
  }
  return [...map.values()].map((e) => ({ ...e, receita: Number(e.receita.toFixed(2)) }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

function escrever(bundle, saida) {
  const dest = isAbsolute(saida) ? saida : resolve(process.cwd(), saida);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(bundle, null, 2) + '\n');
  process.stderr.write(`Vendas salvas em ${dest}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write('Uso: node scripts/hotmart-vendas.mjs [--dias=30] [--status=APPROVED,COMPLETE] [--debug] [--json] [--saida=arq.json]\n');
    process.exit(0);
  }
  const envPath = findEnvFile(args.envPath, SCRIPT_DIR);
  const env = envPath ? loadEnv(envPath) : {};
  const ctx = buildHotmartCtx(env);

  const auth = await hotmartAuth(ctx);
  if (!auth.ok) {
    const msg = `Hotmart não conectada: ${auth.message}\n→ Configure HOTMART_CLIENT_ID e HOTMART_CLIENT_SECRET no .env. Guia: aula-04/docs/tutorial-hotmart.md`;
    if (args.json) process.stdout.write(JSON.stringify({ conectada: false, motivo: auth.message }, null, 2) + '\n');
    else process.stderr.write(msg + '\n');
    process.exit(0);
  }

  const fim = Date.now();
  const inicio = fim - args.dias * 86_400_000;
  const params = { max_results: 500, start_date: inicio, end_date: fim };
  if (args.status) params.transaction_status = args.status;

  const r = await hotmartGetAll(SALES_PATH, params, ctx, 10);
  if (!r.ok) { process.stderr.write(`Erro ao ler vendas: ${r.message}\n`); process.exit(1); }
  const itens = r.data || [];

  if (args.debug) {
    // Redige PII do comprador antes de mostrar o shape (nome/e-mail/ucode nunca aparecem).
    const semPii = itens[0] ? { ...itens[0], buyer: itens[0].buyer ? '[PII REMOVIDO]' : undefined } : null;
    const amostra = semPii ? ctx.scrub(JSON.stringify(semPii, null, 2)) : '(nenhuma venda na janela)';
    process.stdout.write(`Vendas na janela: ${itens.length}\nShape cru da 1ª venda (PII e segredos removidos):\n${amostra}\n`);
    return;
  }

  let vendas = itens.map(normalizarVenda); // normalizarVenda NÃO carrega buyer/PII
  // Filtro de produtos (config inicial): mantém só os produtos escolhidos.
  let produtosFiltro = null;
  if (args.produtos && args.produtos.trim() && args.produtos.trim().toLowerCase() !== 'todos') {
    produtosFiltro = args.produtos.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    vendas = vendas.filter((v) => produtosFiltro.some((f) => String(v.produto || '').toLowerCase().includes(f)));
  }
  const bundle = {
    conectada: true,
    plataforma: 'hotmart',
    gerado_em: new Date().toISOString().slice(0, 10),
    janela_dias: args.dias,
    produtos_filtro: produtosFiltro || 'todos',
    resumo: resumo(vendas),
    por_produto: porProduto(vendas).slice(0, 15),
    por_origem: agrupaPor(vendas, 'src', '(sem origem)').slice(0, 10),
    por_vendedor: agrupaPor(vendas, 'sck', '(sem vendedor)').slice(0, 10),
    por_dia: porDia(vendas),
    por_dia_produto: porDiaProduto(vendas),
    fonte: 'Hotmart Sales History API v1',
  };
  if (args.saida) escrever(bundle, args.saida);
  if (args.json || !args.saida) process.stdout.write(JSON.stringify(bundle, null, 2) + '\n');
}

main().catch((e) => { process.stderr.write(`Erro inesperado: ${e.message}\n`); process.exit(2); });
