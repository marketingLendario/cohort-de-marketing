#!/usr/bin/env node
/**
 * scripts/painel-trafego-data.mjs — Central de Dados, Aula 4 (Squad de Tráfego).
 *
 * Monta o "bundle" de dados que alimenta o painel-trafego.html: séries temporais
 * (dia / mês / quarter), comparação de campanhas, comparação de dois períodos e o
 * esboço do perfil orgânico (roadmap). Construído sobre scripts/lib/meta-graph.mjs.
 *
 * Preserva o contrato do Squad ("não-inferir" + selo Real/Estimado):
 *   - só repassa números que a Meta entrega prontos (nada de derivar CTR/CPM/CPA);
 *   - purchase_roas SEMPRE sai como "Estimado" (atribuição ≠ caixa);
 *   - agregação trimestral SOMA só contadores aditivos (gasto/impressões/cliques);
 *     taxas (CTR/CPM/CPC/frequência) e alcance único NÃO são recalculados → "não fornecido";
 *   - variações de comparação saem com selo "Calculado" (diferença entre dois valores Real);
 *   - campo ausente = "não fornecido"; segredos passam pelo ctx.scrub.
 *
 * Sem credenciais (ou --exemplo) → carrega scripts/fixtures/painel-trafego-exemplo.json
 * e devolve o bundle com "modo":"exemplo". A demo nunca trava (regra _shared/nunca-travar.md).
 *
 * Uso:
 *   node scripts/painel-trafego-data.mjs --account --json           # bundle completo da conta
 *   node scripts/painel-trafego-data.mjs --campaign-id=123 --json   # bundle de uma campanha
 *   node scripts/painel-trafego-data.mjs --serie=mes --json         # só a série mensal
 *   node scripts/painel-trafego-data.mjs --exemplo --json           # força o fixture
 *   node scripts/painel-trafego-data.mjs --account --saida=projetos/x/dados-trafego/bundle.json
 *   Flags: --perfil (tenta orgânico) --env=/caminho/.env
 *
 * Somente leitura (GET).
 */

import { dirname, join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import {
  GRAPH_VERSION, ACCOUNT_STATUS, findEnvFile, loadEnv, buildCtx, graphGet, graphGetAll, hint, resolveActId, makeScrubber,
} from './lib/meta-graph.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(SCRIPT_DIR, 'fixtures', 'painel-trafego-exemplo.json');

// Campos aditivos (podem ser somados ao agregar em quarter) vs. campos-taxa (não recalcular).
const SERIE_FIELDS = [
  'spend', 'impressions', 'clicks', 'inline_link_clicks', 'ctr', 'cpm', 'cpc',
  'frequency', 'reach', 'actions', 'purchase_roas', 'date_start', 'date_stop',
].join(',');
const ADITIVOS = ['spend', 'impressions', 'clicks', 'inline_link_clicks'];
const TAXAS = ['ctr', 'cpm', 'cpc', 'frequency', 'reach']; // reach é único: não soma

function parseArgs(argv) {
  const out = {
    json: false, envPath: null, campaignId: null, account: false,
    serie: null, perfil: false, exemplo: false, saida: null, help: false,
    listarContas: false, adAccountId: null, vendas: null, config: null, periodo: null,
  };
  for (const a of argv) {
    if (a === '--json') out.json = true;
    else if (a === '--account') out.account = true;
    else if (a === '--perfil') out.perfil = true;
    else if (a === '--exemplo') out.exemplo = true;
    else if (a === '--listar-contas') out.listarContas = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('--campaign-id=')) out.campaignId = a.slice('--campaign-id='.length);
    else if (a.startsWith('--ad-account-id=')) out.adAccountId = a.slice('--ad-account-id='.length);
    else if (a.startsWith('--serie=')) out.serie = a.slice('--serie='.length);
    else if (a.startsWith('--vendas=')) out.vendas = a.slice('--vendas='.length);
    else if (a.startsWith('--config=')) out.config = a.slice('--config='.length);
    else if (a.startsWith('--periodo=')) out.periodo = parseInt(a.slice('--periodo='.length), 10) || null;
    else if (a.startsWith('--saida=')) out.saida = a.slice('--saida='.length);
    else if (a.startsWith('--env=')) out.envPath = a.slice('--env='.length);
  }
  return out;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

// Compras atribuídas + ROAS (sempre Estimado), a partir do array `actions`/`purchase_roas`.
function extrairConversao(row) {
  const acts = {};
  for (const a of row.actions || []) acts[a.action_type] = num(a.value);
  const purchases = acts.omni_purchase ?? acts.purchase ?? null;
  const roasArr = (row.purchase_roas || []);
  const roasVal = roasArr.length ? num(roasArr[0].value) : null;
  return { purchases, roasVal };
}

// Uma linha de insights da Meta → um ponto de série. Números vêm prontos (Real).
function mapPonto(row, granularidade, fonte) {
  const { purchases, roasVal } = extrairConversao(row);
  return {
    periodo: row.date_start,
    granularidade,
    spend: num(row.spend),
    impressions: num(row.impressions),
    clicks: num(row.clicks),
    inline_link_clicks: num(row.inline_link_clicks),
    ctr: num(row.ctr),
    cpm: num(row.cpm),
    cpc: num(row.cpc),
    frequency: num(row.frequency),
    reach: num(row.reach),
    purchases,
    roas: roasVal === null ? null : { valor: roasVal, selo: 'Estimado' },
    selo: 'Real',
    fonte,
  };
}

// Agrupa pontos mensais em trimestres. SOMA só aditivos; taxas viram null (não recalcular).
function agruparQuarter(pontosMes, fonte) {
  const buckets = new Map();
  for (const p of pontosMes) {
    const d = new Date(p.periodo);
    const q = Math.floor(d.getUTCMonth() / 3) + 1;
    const chave = `${d.getUTCFullYear()}-Q${q}`;
    if (!buckets.has(chave)) buckets.set(chave, { periodo: chave, granularidade: 'quarter', selo: 'Real', fonte,
      nota: 'trimestre = soma dos meses; taxas (CTR/CPM/CPC/frequência) e alcance não são recalculados', purchases: 0 });
    const b = buckets.get(chave);
    for (const f of ADITIVOS) b[f] = (b[f] ?? 0) + (p[f] ?? 0);
    if (p.purchases !== null) b.purchases += p.purchases;
    for (const f of TAXAS) b[f] = null;
    b.roas = null;
  }
  return [...buckets.values()].sort((a, b) => a.periodo.localeCompare(b.periodo));
}

async function serie(scopePath, granularidade, ctx, janela) {
  const hoje = new Date();
  const fonteBase = `API Graph ${GRAPH_VERSION}`;
  if (granularidade === 'dia') {
    const jan = janela ? { time_range: janela } : { date_preset: 'last_30d' };
    // graphGetAll pagina: com time_increment=1 a Meta lista 1 linha/dia e limita 25/página.
    const r = await graphGetAll(`${scopePath}/insights`,
      { ...jan, time_increment: 1, fields: SERIE_FIELDS, limit: 500 }, ctx, 4);
    if (!r.ok) throw new Error(`série diária: ${r.message}\n→ ${hint(r.code, 'Confira escopo e permissões.')}`);
    return (r.data || []).map((row) => mapPonto(row, 'dia', `${fonteBase} (time_increment=1)`));
  }
  // mês e quarter partem da mesma leitura mensal (até 12 meses p/ formar 4 trimestres).
  const since = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 11, 1));
  const r = await graphGet(`${scopePath}/insights`,
    { time_range: { since: iso(since), until: iso(hoje) }, time_increment: 'monthly', fields: SERIE_FIELDS }, ctx);
  if (!r.ok) throw new Error(`série mensal: ${r.message}\n→ ${hint(r.code, 'Confira escopo e permissões.')}`);
  const meses = (r.data.data || []).map((row) => mapPonto(row, 'mes', `${fonteBase} (time_increment=monthly)`));
  return granularidade === 'quarter' ? agruparQuarter(meses, `${fonteBase} (agregado de monthly)`) : meses;
}

// Comparação de campanhas em DUAS chamadas (rápido mesmo em conta grande):
// 1 insights agregado por campanha (level=campaign) + 1 lista de status. Sem loop por campanha.
async function comparaCampanhas(ctx, janela) {
  const jan = janela ? { time_range: janela } : { date_preset: 'last_30d' };
  const ins = await graphGet(`${ctx.actId}/insights`, {
    level: 'campaign', ...jan,
    fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpm,actions,purchase_roas',
    limit: 200,
  }, ctx);
  if (!ins.ok) throw new Error(`campanhas: ${ins.message}\n→ ${hint(ins.code, 'Confira a permissão de leitura da conta.')}`);
  const rows = ins.data.data || [];
  // status + datas das campanhas numa única chamada (metadados), para o selo e a coluna de data do painel.
  const st = await graphGet(`${ctx.actId}/campaigns`, { fields: 'id,effective_status,created_time,start_time,stop_time', limit: 500 }, ctx);
  const meta = {};
  if (st.ok) for (const c of (st.data.data || [])) meta[c.id] = c;
  const out = rows.map((row) => {
    const { purchases, roasVal } = extrairConversao(row);
    const m = meta[row.campaign_id] || {};
    return {
      id: row.campaign_id, nome: row.campaign_name, status: m.effective_status || '—',
      inicio: (m.start_time || m.created_time || '').slice(0, 10) || null,
      criada: (m.created_time || '').slice(0, 10) || null,
      fim: (m.stop_time || '').slice(0, 10) || null,
      spend: num(row.spend), impressions: num(row.impressions), clicks: num(row.clicks),
      ctr: num(row.ctr), cpm: num(row.cpm), purchases,
      roas: roasVal === null ? null : { valor: roasVal, selo: 'Estimado' },
      selo: 'Real', fonte: `API Graph ${GRAPH_VERSION} (level=campaign, last_30d)`,
    };
  });
  // Ordena por gasto e mantém até 100 (o painel filtra/limita na tela; Top 15/30/Todas).
  return out.sort((a, b) => (b.spend || 0) - (a.spend || 0)).slice(0, 100);
}

function delta(a, b) {
  if (a === null || b === null || a === 0) return null;
  return Number((((b - a) / Math.abs(a)) * 100).toFixed(1));
}

async function comparaPeriodos(scopePath, ctx, periodoDias) {
  const meia = Math.max(1, Math.round((periodoDias || 60) / 2)); // duas metades do período (default 30/30)
  const hoje = new Date();
  const fimA = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() - meia));
  const iniA = new Date(fimA.getTime() - (meia - 1) * 86_400_000);
  const iniB = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() - (meia - 1)));
  const rotuloA = `${meia} dias anteriores`, rotuloB = `últimos ${meia} dias`;
  const janela = async (since, until, rotulo) => {
    const r = await graphGet(`${scopePath}/insights`,
      { time_range: { since: iso(since), until: iso(until) }, fields: SERIE_FIELDS }, ctx);
    const row = r.ok ? (r.data.data || [])[0] : null;
    return { rotulo, desde: iso(since), ate: iso(until), ...(row ? mapPonto(row, 'periodo', `API Graph ${GRAPH_VERSION}`) : { sem_dados: true }) };
  };
  const a = await janela(iniA, fimA, rotuloA);
  const b = await janela(iniB, hoje, rotuloB);
  const deltas = {};
  for (const f of ['spend', 'impressions', 'clicks', 'ctr', 'cpm', 'purchases']) deltas[f] = delta(a[f], b[f]);
  return { periodo_a: a, periodo_b: b, deltas, selo_deltas: 'Calculado', nota: 'variação percentual entre dois valores Real' };
}

// --- Instagram API com login do Instagram (graph.instagram.com) — API nova ---
const IG_BASE = 'https://graph.instagram.com';
async function igGet(path, params, token, scrub) {
  const url = new URL(`${IG_BASE}/${path}`);
  for (const [k, v] of Object.entries(params || {})) if (v != null) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  try {
    const res = await fetch(url);
    const j = await res.json();
    if (j.error) return { ok: false, code: j.error.code, message: scrub(j.error.message || 'erro') };
    return { ok: true, data: j };
  } catch (e) { return { ok: false, message: scrub(e.message) }; }
}
// Lê mídias + comentários do IG via a API nova (token do próprio Instagram).
async function perfilInstagramLogin(token, scrub) {
  const me = await igGet('me', { fields: 'id,username' }, token, scrub);
  if (!me.ok) return { erro: me };
  const r = await igGet(`${me.data.id}/media`,
    { fields: 'caption,timestamp,like_count,comments_count,permalink,media_type', limit: 25 }, token, scrub);
  if (!r.ok) return { erro: r };
  const posts = (r.data.data || []).map((m) => ({
    id: m.id, data: m.timestamp ? m.timestamp.slice(0, 10) : null,
    trecho: (m.caption || '(sem legenda)').replace(/\s+/g, ' ').slice(0, 120),
    reacoes: m.like_count ?? 0, comentarios: m.comments_count ?? 0, compartilhamentos: 0, permalink: m.permalink || null,
  }));
  posts.sort((a, b) => (b.reacoes + b.comentarios * 2) - (a.reacoes + a.comentarios * 2));
  const top = posts; // todos os posts — o painel ordena/filtra/limita
  const comentarios = [];
  for (const p of top.slice(0, 6)) {
    if (!p.comentarios) continue;
    const c = await igGet(`${p.id}/comments`, { fields: 'text,like_count,timestamp' }, token, scrub);
    if (c.ok) for (const x of (c.data.data || [])) {
      const t = (x.text || '').replace(/\s+/g, ' ').trim();
      if (t) comentarios.push({ texto: t.slice(0, 240), curtidas: x.like_count ?? 0, post: p.trecho.slice(0, 40) });
    }
    if (comentarios.length >= 60) break;
  }
  const resumo = { posts: posts.length, reacoes: posts.reduce((s, p) => s + p.reacoes, 0), comentarios: posts.reduce((s, p) => s + p.comentarios, 0), compartilhamentos: 0, comentarios_coletados: comentarios.length };
  return { disponivel: true, plataforma: 'instagram', conta: me.data.username || null, resumo, top_posts: top, comentarios, sentimento: null, selo: 'Real', fonte: `Instagram Graph API (graph.instagram.com) — media+comments` };
}

// Engajamento do Instagram (API com login do Facebook) — mídias + comentários (texto p/ sentimento; SEM PII).
async function perfilInstagram(igId, ctx) {
  const r = await graphGet(`${igId}/media`,
    { fields: 'caption,timestamp,like_count,comments_count,permalink,media_type', limit: 25 }, ctx);
  if (!r.ok) return { erro: r };
  const posts = (r.data.data || []).map((m) => ({
    id: m.id,
    data: m.timestamp ? m.timestamp.slice(0, 10) : null,
    trecho: (m.caption || '(sem legenda)').replace(/\s+/g, ' ').slice(0, 120),
    reacoes: m.like_count ?? 0,
    comentarios: m.comments_count ?? 0,
    compartilhamentos: 0,
    permalink: m.permalink || null,
  }));
  posts.sort((a, b) => (b.reacoes + b.comentarios * 2) - (a.reacoes + a.comentarios * 2));
  const top = posts; // todos os posts — o painel ordena/filtra/limita
  const comentarios = [];
  for (const p of top.slice(0, 6)) {
    if (!p.comentarios) continue;
    const c = await graphGet(`${p.id}/comments`, { fields: 'text,like_count', limit: 25 }, ctx);
    if (c.ok) for (const x of (c.data.data || [])) {
      const m = (x.text || '').replace(/\s+/g, ' ').trim();
      if (m) comentarios.push({ texto: m.slice(0, 240), curtidas: x.like_count ?? 0, post: p.trecho.slice(0, 40) });
    }
    if (comentarios.length >= 60) break;
  }
  const resumo = {
    posts: posts.length,
    reacoes: posts.reduce((s, p) => s + p.reacoes, 0),
    comentarios: posts.reduce((s, p) => s + p.comentarios, 0),
    compartilhamentos: 0,
    comentarios_coletados: comentarios.length,
  };
  return { disponivel: true, plataforma: 'instagram', resumo, top_posts: top, comentarios, sentimento: null, selo: 'Real', fonte: `API Graph ${GRAPH_VERSION} (instagram media+comments)` };
}

// Engajamento orgânico — tenta Instagram (via conta business) e cai pra Página do FB.
// Coleta curtidas/comentários/reações + textos dos comentários (SEM autor/PII). Degrada com clareza.
async function perfilOrganico(ctx) {
  // Caminho A (Instagram API nova, login do Instagram): token do próprio IG em META_INSTAGRAM_TOKEN.
  if (ctx.env.META_INSTAGRAM_TOKEN) {
    const scrub = makeScrubber([ctx.token, ctx.env.META_INSTAGRAM_TOKEN, ctx.appSecret]);
    const res = await perfilInstagramLogin(ctx.env.META_INSTAGRAM_TOKEN, scrub);
    if (res.disponivel) return res;
    const rr = res.erro || {};
    return {
      disponivel: false,
      motivo: `Instagram (API nova) indisponível (${rr.message || 'sem resposta'}). Confira META_INSTAGRAM_TOKEN (escopos instagram_business_basic + instagram_business_manage_comments) — ver aula-04/docs/tutorial-token-meta.md → Caminho A.`,
      top_posts: [], comentarios: [],
    };
  }
  const pageId = ctx.env.META_FACEBOOK_PAGE_ID;
  if (!pageId) return { disponivel: false, motivo: 'META_FACEBOOK_PAGE_ID ausente no .env (rode /zelador para descobrir).', top_posts: [], comentarios: [] };
  // Token capaz de ler a página: META_PAGE_ACCESS_TOKEN (Caminho A) se houver; senão o token de anúncios.
  const baseToken = ctx.env.META_PAGE_ACCESS_TOKEN || ctx.token;
  let pageCtx = { ...ctx, token: baseToken, scrub: makeScrubber([ctx.token, baseToken, ctx.appSecret]) };
  // Fluxo de 2 passos: troca por um Page Access Token (a "nova experiência de Páginas" recusa o token de usuário direto).
  const pt = await graphGet(pageId, { fields: 'access_token' }, pageCtx);
  if (pt.ok && pt.data.access_token) {
    pageCtx = { ...pageCtx, token: pt.data.access_token, scrub: makeScrubber([ctx.token, baseToken, pt.data.access_token, ctx.appSecret]) };
  }
  // Preferência: Instagram (conta business vinculada). Resolve por env ou pela página.
  let igId = ctx.env.META_INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!igId) { const ig = await graphGet(pageId, { fields: 'instagram_business_account' }, pageCtx); if (ig.ok) igId = ig.data.instagram_business_account?.id; }
  if (igId) {
    const res = await perfilInstagram(igId, pageCtx);
    if (res.disponivel) return res;
    if (res.erro) {
      const rr = res.erro; const gate = String(rr.code) === '10' || /instagram_manage_comments|instagram_basic|App Review|permission/i.test(rr.message || '');
      return {
        disponivel: false,
        motivo: gate
          ? `A Meta recusou o acesso ao Instagram (${rr.message}). Caminho A (modo dev): gere um token com instagram_basic + instagram_manage_comments + pages_show_list e cole em META_PAGE_ACCESS_TOKEN — ver aula-04/docs/tutorial-token-meta.md.`
          : `Instagram indisponível (${rr.message}). Ver aula-04/docs/organico-roadmap.md.`,
        top_posts: [], comentarios: [],
      };
    }
  }
  // Fallback: Página do Facebook (posts + comentários).
  const r = await graphGet(`${pageId}/posts`, {
    fields: 'message,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)',
    limit: 25,
  }, pageCtx);
  if (!r.ok) {
    const gate = String(r.code) === '10' || /pages_read_user_content|App Review|pages_read_engagement/i.test(r.message || '');
    return {
      disponivel: false,
      motivo: gate
        ? `A Meta exige App Review para ler conteúdo da página (${r.message}). Caminho A (modo dev): gere um token de usuário admin da página com pages_read_engagement + pages_read_user_content e cole em META_PAGE_ACCESS_TOKEN — ver aula-04/docs/tutorial-token-meta.md.`
        : `A Graph API recusou o acesso orgânico (${r.message}). Ver aula-04/docs/organico-roadmap.md.`,
      top_posts: [], comentarios: [],
    };
  }
  const posts = (r.data.data || []).map((p) => ({
    id: p.id,
    data: p.created_time ? p.created_time.slice(0, 10) : null,
    trecho: (p.message || '(sem texto)').replace(/\s+/g, ' ').slice(0, 120),
    reacoes: p.reactions?.summary?.total_count ?? 0,
    comentarios: p.comments?.summary?.total_count ?? 0,
    compartilhamentos: p.shares?.count ?? 0,
    permalink: p.permalink_url || null,
  }));
  posts.sort((a, b) => (b.reacoes + b.comentarios * 2) - (a.reacoes + a.comentarios * 2));
  const top = posts; // todos os posts — o painel ordena/filtra/limita
  // textos dos comentários dos posts com mais engajamento (nunca o autor — só o texto)
  const comentarios = [];
  for (const p of top.slice(0, 5)) {
    if (!p.comentarios) continue;
    const c = await graphGet(`${p.id}/comments`, { fields: 'message,like_count', limit: 25, order: 'reverse_chronological' }, pageCtx);
    if (c.ok) for (const x of (c.data.data || [])) {
      const m = (x.message || '').replace(/\s+/g, ' ').trim();
      if (m) comentarios.push({ texto: m.slice(0, 240), curtidas: x.like_count ?? 0, post: p.trecho.slice(0, 40) });
    }
    if (comentarios.length >= 60) break;
  }
  const resumo = {
    posts: posts.length,
    reacoes: posts.reduce((s, p) => s + p.reacoes, 0),
    comentarios: posts.reduce((s, p) => s + p.comentarios, 0),
    compartilhamentos: posts.reduce((s, p) => s + p.compartilhamentos, 0),
    comentarios_coletados: comentarios.length,
  };
  // sentimento fica null aqui — a skill /board-de-especialistas lê `comentarios` e preenche (leitura por IA).
  return { disponivel: true, resumo, top_posts: top, comentarios, sentimento: null, selo: 'Real', fonte: `API Graph ${GRAPH_VERSION} (page posts+comments)` };
}

function carregarFixture() {
  if (!existsSync(FIXTURE)) {
    throw new Error(`Fixture de exemplo não encontrada em ${FIXTURE}. Sem credenciais e sem fixture, não há o que mostrar.`);
  }
  const bundle = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  bundle.modo = 'exemplo';
  return bundle;
}

// Heatmap dia-da-semana × hora. Soma contadores aditivos por célula (Real); CTR da
// célula é derivado da soma (selo Calculado, transparente). Breakdown horário da Meta.
async function heatmap(scopePath, ctx, janela) {
  const jan = janela ? { time_range: janela } : { date_preset: 'last_30d' };
  const r = await graphGetAll(`${scopePath}/insights`, {
    ...jan, time_increment: 1,
    breakdowns: 'hourly_stats_aggregated_by_advertiser_time_zone',
    fields: 'impressions,clicks,spend', limit: 500,
  }, ctx, 6);
  if (!r.ok) throw new Error(`heatmap: ${r.message}`);
  const grid = {};
  for (const row of r.data || []) {
    const dia = new Date(row.date_start).getUTCDay(); // 0=domingo
    const bucket = row.hourly_stats_aggregated_by_advertiser_time_zone || '00';
    const hora = parseInt(String(bucket).slice(0, 2), 10) || 0;
    const k = `${dia}-${hora}`;
    if (!grid[k]) grid[k] = { dia, hora, impressions: 0, clicks: 0, spend: 0 };
    grid[k].impressions += num(row.impressions) || 0;
    grid[k].clicks += num(row.clicks) || 0;
    grid[k].spend += num(row.spend) || 0;
  }
  const celulas = Object.values(grid).map((c) => ({
    ...c, spend: Number(c.spend.toFixed(2)),
    ctr: c.impressions ? Number((c.clicks / c.impressions * 100).toFixed(3)) : null,
  }));
  return { celulas, metrica: 'ctr', selo: 'Calculado', fonte: `API Graph ${GRAPH_VERSION} (breakdown horário, 30d — CTR agregado)` };
}

// Funil de conversão a partir do array `actions` (só as etapas que a conta reporta — não-inferir).
async function funil(scopePath, ctx, janela) {
  const jan = janela ? { time_range: janela } : { date_preset: 'last_30d' };
  const r = await graphGet(`${scopePath}/insights`,
    { ...jan, fields: 'impressions,inline_link_clicks,actions' }, ctx);
  const row = r.ok ? (r.data.data || [])[0] : null;
  if (!row) return { etapas: [], fonte: 'sem dados na janela', selo: 'Real' };
  const acts = {};
  for (const a of row.actions || []) acts[a.action_type] = num(a.value);
  const pega = (...keys) => { for (const k of keys) if (acts[k] != null) return acts[k]; return null; };
  const def = [
    { nome: 'Impressões', valor: num(row.impressions) },
    { nome: 'Cliques no link', valor: num(row.inline_link_clicks) ?? pega('link_click') },
    { nome: 'Landing page view', valor: pega('landing_page_view', 'omni_landing_page_view') },
    { nome: 'Add. ao carrinho', valor: pega('omni_add_to_cart', 'add_to_cart') },
    { nome: 'Checkout iniciado', valor: pega('omni_initiated_checkout', 'initiate_checkout') },
    { nome: 'Compra', valor: pega('omni_purchase', 'purchase') },
  ];
  const etapas = def.filter((e) => e.valor != null && e.valor > 0).map((e) => ({ ...e, selo: 'Real' }));
  return { etapas, fonte: `API Graph ${GRAPH_VERSION} (actions, last_30d)`, selo: 'Real' };
}

// Funil por CAMPANHA × DIA — alimenta o filtro de campanhas do funil. Formato COMPACTO
// (array de arrays [cid, data, impr, cliques, lpv, carrinho, checkout, compra]) p/ caber no bundle. Sem PII.
// Busca em janelas de 15 dias: level=campaign + time_increment=1 num período longo estoura o timeout numa página só.
async function funilPorCampanhaDia(scopePath, ctx, janela) {
  const hj = new Date();
  const ini = janela ? new Date(`${janela.since}T00:00:00Z`) : new Date(hj.getTime() - 89 * 86_400_000);
  const fimJanela = janela ? new Date(`${janela.until}T00:00:00Z`) : hj;
  const out = [];
  let cur = new Date(ini);
  while (cur <= fimJanela) {
    const fim = new Date(Math.min(fimJanela.getTime(), cur.getTime() + 14 * 86_400_000));
    const r = await graphGetAll(`${scopePath}/insights`,
      { level: 'campaign', time_range: { since: iso(cur), until: iso(fim) }, time_increment: 1,
        fields: 'campaign_id,impressions,inline_link_clicks,actions', limit: 300 }, ctx, 10);
    if (!r.ok) throw new Error(`funil por campanha (${iso(cur)}→${iso(fim)}): ${r.message}`);
    for (const row of (r.data || [])) {
      const acts = {};
      for (const a of row.actions || []) acts[a.action_type] = num(a.value);
      const pega = (...keys) => { for (const k of keys) if (acts[k] != null) return acts[k]; return 0; };
      out.push([row.campaign_id, row.date_start, num(row.impressions) || 0,
        (num(row.inline_link_clicks) ?? pega('link_click')) || 0,
        pega('landing_page_view', 'omni_landing_page_view'), pega('omni_add_to_cart', 'add_to_cart'),
        pega('omni_initiated_checkout', 'initiate_checkout'), pega('omni_purchase', 'purchase')]);
    }
    cur = new Date(fim.getTime() + 86_400_000);
  }
  return out;
}

// Funil por DIA (time_increment=1) — alimenta o filtro de data do funil no painel. Só eventos que a conta reporta.
async function funilPorDia(scopePath, ctx, janela) {
  const jan = janela ? { time_range: janela } : { date_preset: 'last_90d' };
  const r = await graphGetAll(`${scopePath}/insights`,
    { ...jan, time_increment: 1, fields: 'impressions,inline_link_clicks,actions', limit: 500 }, ctx, 4);
  const rows = r.ok ? (r.data || []) : [];
  return rows.map((row) => {
    const acts = {};
    for (const a of row.actions || []) acts[a.action_type] = num(a.value);
    const pega = (...keys) => { for (const k of keys) if (acts[k] != null) return acts[k]; return 0; };
    return {
      data: row.date_start,
      impressions: num(row.impressions) || 0,
      cliques: (num(row.inline_link_clicks) ?? pega('link_click')) || 0,
      lpv: pega('landing_page_view', 'omni_landing_page_view'),
      carrinho: pega('omni_add_to_cart', 'add_to_cart'),
      checkout: pega('omni_initiated_checkout', 'initiate_checkout'),
      compra: pega('omni_purchase', 'purchase'),
    };
  });
}

// Demografia da audiência PAGA (quem os anúncios atingem) — breakdowns da Meta, sem token de página.
async function demografia(scopePath, ctx, janela) {
  const jan = janela ? { time_range: janela } : { date_preset: 'last_30d' };
  const ig = await graphGet(`${scopePath}/insights`,
    { ...jan, breakdowns: 'age,gender', fields: 'impressions,clicks,spend', limit: 200 }, ctx);
  const idade_genero = ig.ok ? (ig.data.data || []).map((r) => ({
    idade: r.age, genero: r.gender, impressions: num(r.impressions), clicks: num(r.clicks), spend: num(r.spend),
  })) : [];
  const rg = await graphGet(`${scopePath}/insights`,
    { ...jan, breakdowns: 'region', fields: 'impressions,spend', limit: 200 }, ctx);
  const regiao = rg.ok ? (rg.data.data || []).map((r) => ({
    regiao: r.region, impressions: num(r.impressions), spend: num(r.spend),
  })).sort((a, b) => (b.impressions || 0) - (a.impressions || 0)).slice(0, 30) : [];
  if (!idade_genero.length && !regiao.length) return null;
  return { idade_genero, regiao, selo: 'Real', fonte: `API Graph ${GRAPH_VERSION} (breakdowns age,gender,region)` };
}

async function bundleLive(args, ctx, cfg) {
  const hoje = iso(new Date());
  const scopePath = args.account ? ctx.actId : args.campaignId;
  const escopo = args.account ? `conta ${ctx.actId}` : `campanha ${args.campaignId}`;
  // Janela global: --periodo ou config.periodo_dias → time_range; sem isso, mantém last_30d.
  const periodoDias = args.periodo || (cfg && cfg.periodo_dias) || null;
  let janela = null;
  if (periodoDias) {
    const hj = new Date();
    const since = new Date(hj.getTime() - (periodoDias - 1) * 86_400_000);
    janela = { since: iso(since), until: iso(hj) };
  }
  const granularidades = args.serie ? [args.serie] : ['dia', 'mes', 'quarter'];
  const series = {};
  for (const g of granularidades) series[g] = await serie(scopePath, g, ctx, janela);
  const bundle = { modo: 'api', gerado_em: hoje, escopo, granularidade_pedida: args.serie || 'todas', periodo_dias: periodoDias || 30, series };
  if (args.account && !args.serie) bundle.campanhas = await comparaCampanhas(ctx, janela);
  if (!args.serie) {
    bundle.comparacao = await comparaPeriodos(scopePath, ctx, periodoDias);
    try { bundle.heatmap = await heatmap(scopePath, ctx, janela); } catch (e) { bundle.heatmap = null; process.stderr.write(`heatmap indisponível: ${e.message}\n`); }
    try { bundle.funil = await funil(scopePath, ctx, janela); } catch (e) { bundle.funil = null; process.stderr.write(`funil indisponível: ${e.message}\n`); }
    try { bundle.funil_por_dia = await funilPorDia(scopePath, ctx, janela); } catch (e) { bundle.funil_por_dia = null; process.stderr.write(`funil diário indisponível: ${e.message}\n`); }
    if (args.account) { try { bundle.funil_por_campanha_dia = await funilPorCampanhaDia(scopePath, ctx, janela); } catch (e) { bundle.funil_por_campanha_dia = null; process.stderr.write(`funil por campanha indisponível: ${e.message}\n`); } }
    try { bundle.demografia = await demografia(scopePath, ctx, janela); } catch (e) { bundle.demografia = null; process.stderr.write(`demografia indisponível: ${e.message}\n`); }
  }
  bundle.perfil = args.perfil ? await perfilOrganico(ctx)
    : { disponivel: false, motivo: 'perfil orgânico é roadmap — rode com --perfil para tentar. Ver aula-04/docs/organico-roadmap.md.', posts: [] };
  // Aplica labels e mapa produto↔campanha da config (nome exibido; nunca altera o dado bruto).
  if (cfg) aplicarConfig(bundle, cfg);
  return bundle;
}

function escrever(bundle, saida) {
  const dest = isAbsolute(saida) ? saida : resolve(process.cwd(), saida);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(bundle, null, 2) + '\n');
  process.stderr.write(`Bundle salvo em ${dest}\n`);
}

// Config durável por projeto (período, filtro de produtos, mapa produto↔campanha, labels).
const CONFIG_DEFAULT = { schemaVersion: '1.0.0', periodo_dias: 90, produtos_incluidos: 'todos', mapa_produto_campanha: {}, labels: {}, campanhas_excluidas: [], fieldMeta: {} };
function lerConfig(configPath) {
  if (!configPath) return null;
  const p = isAbsolute(configPath) ? configPath : resolve(process.cwd(), configPath);
  if (!existsSync(p)) { process.stderr.write(`config: não encontrada (${p}) — usando defaults.\n`); return { ...CONFIG_DEFAULT }; }
  try { return { ...CONFIG_DEFAULT, ...JSON.parse(readFileSync(p, 'utf8')) }; }
  catch (e) { process.stderr.write(`config inválida (${e.message}) — usando defaults.\n`); return { ...CONFIG_DEFAULT }; }
}
// Aplica labels e mapa da config ao bundle (só rótulo exibido; nunca altera o dado bruto).
function aplicarConfig(bundle, cfg) {
  const excluidas = Array.isArray(cfg.campanhas_excluidas) ? cfg.campanhas_excluidas.map(String) : [];
  bundle.config = {
    periodo_dias: cfg.periodo_dias, produtos_incluidos: cfg.produtos_incluidos,
    mapa_produto_campanha: cfg.mapa_produto_campanha || {}, labels: cfg.labels || {},
    campanhas_excluidas: excluidas,
  };
  // Expurgo: campanhas marcadas como exceção (ex.: acidente/conta compartilhada) saem da lista.
  if (excluidas.length && Array.isArray(bundle.campanhas)) {
    const set = new Set(excluidas);
    const antes = bundle.campanhas.length;
    bundle.campanhas = bundle.campanhas.filter((c) => !set.has(String(c.id)));
    const rm = antes - bundle.campanhas.length;
    if (rm) process.stderr.write(`config: ${rm} campanha(s) expurgada(s) por campanhas_excluidas.\n`);
  }
  const labels = cfg.labels || {};
  for (const c of (bundle.campanhas || [])) c.label = labels[c.id] || labels[c.nome] || null;
}

// Anexa o caixa (Hotmart) e calcula a atribuição TEMPORAL (honesta: correlação, não causação).
function anexarVendas(bundle, vendasPath) {
  const p = isAbsolute(vendasPath) ? vendasPath : resolve(process.cwd(), vendasPath);
  if (!existsSync(p)) { process.stderr.write(`vendas: arquivo não encontrado (${p}) — seção de vendas omitida.\n`); return; }
  const v = JSON.parse(readFileSync(p, 'utf8'));
  if (!v.conectada) { bundle.vendas = { conectada: false, motivo: v.motivo || 'plataforma de vendas não conectada' }; return; }
  bundle.vendas = v;
  const dias = (bundle.series && bundle.series.dia) || [];
  const gastoMeta = Number(dias.reduce((s, x) => s + (x.spend || 0), 0).toFixed(2));
  const receita = v.resumo ? v.resumo.receita_aprovada : 0;
  const gastoDia = {}; dias.forEach((x) => { if (x.periodo) gastoDia[x.periodo] = x.spend || 0; });
  const recDia = {}; (v.por_dia || []).forEach((d) => { recDia[d.data] = d.receita; });
  const datas = [...new Set([...Object.keys(gastoDia), ...Object.keys(recDia)])].sort();
  const overlay = datas.map((d) => ({ data: d, gasto: gastoDia[d] ?? null, receita: recDia[d] ?? null }));
  bundle.atribuicao = {
    metodo: 'temporal',
    gasto_meta: gastoMeta,
    receita_caixa: receita,
    teto_roas: gastoMeta ? Number((receita / gastoMeta).toFixed(2)) : null,
    pct_campanha_rastreada: 0,
    overlay,
    selo: 'Estimado',
    nota: 'Sem UTM/SCK por CAMPANHA, não dá para isolar quanto do caixa veio da Meta. O "teto" divide TODA a receita (todos os canais — orgânico, base, time de vendas) pelo gasto Meta — NÃO é o ROAS da Meta. Para atribuição Real por campanha, marque o link do anúncio com o id/nome da campanha no SCK ou numa UTM.',
  };
}

// Lista as contas de anúncio que o token acessa (para trocar de conta sem editar o .env).
async function listarContas(ctx) {
  const r = await graphGet('me/adaccounts', { fields: 'id,name,account_status', limit: 50 }, ctx);
  if (!r.ok) throw new Error(`listar contas: ${r.message}\n→ ${hint(r.code, 'Confira o token e o escopo ads_read.')}`);
  return (r.data.data || []).map((c) => ({
    id: c.id, nome: c.name, status: ACCOUNT_STATUS[c.account_status] || `status ${c.account_status}`,
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(
      'Uso: node scripts/painel-trafego-data.mjs [--account | --campaign-id=X] [--serie=dia|mes|quarter]\n' +
      '                                          [--ad-account-id=act_123] [--listar-contas] [--perfil]\n' +
      '                                          [--exemplo] [--json] [--saida=arq.json] [--env=/caminho/.env]\n' +
      '  --listar-contas    lista as contas de anúncio que o token acessa (Modo API)\n' +
      '  --ad-account-id=X  usa outra conta só nesta execução, sem editar o .env\n');
    process.exit(0);
  }

  const envPath = findEnvFile(args.envPath, SCRIPT_DIR);
  const env = envPath ? loadEnv(envPath) : {};

  // --listar-contas: precisa de token; sem ele, orienta em vez de quebrar.
  if (args.listarContas) {
    if (!env.META_ACCESS_TOKEN) {
      const msg = 'Sem META_ACCESS_TOKEN no .env — não dá para listar contas. Configure o token (aula-04/docs/tutorial-token-meta.md) ou siga em Modo Exemplo.';
      if (args.json) process.stdout.write(JSON.stringify({ contas: [], motivo: msg }, null, 2) + '\n');
      else process.stderr.write(msg + '\n');
      process.exit(0);
    }
    const ctx = buildCtx(env);
    try {
      const contas = await listarContas(ctx);
      if (args.json) process.stdout.write(JSON.stringify({ contas }, null, 2) + '\n');
      else {
        process.stdout.write('\nContas de anúncio que o seu token acessa — use com --ad-account-id=<id>:\n');
        for (const c of contas) process.stdout.write(`  ${c.id}  [${c.status}]  "${c.nome}"\n`);
      }
    } catch (e) {
      process.stderr.write(`${e.message}\n`);
      process.exit(1);
    }
    return;
  }

  let bundle;
  const cfg = lerConfig(args.config);
  const contaOverride = args.adAccountId || env.META_AD_ACCOUNT_ID;
  const temEscopo = Boolean(args.campaignId || contaOverride);

  if (args.exemplo || !env.META_ACCESS_TOKEN || !temEscopo) {
    // Fallback: sem token ou sem conta/campanha, o painel roda sobre a fixture (modo exemplo).
    if (!args.exemplo) {
      process.stderr.write('Sem META_ACCESS_TOKEN e/ou conta de anúncio — usando dados de exemplo (modo exemplo).\n');
    }
    bundle = carregarFixture();
    if (cfg) aplicarConfig(bundle, cfg);
  } else {
    const ctx = buildCtx(env);
    // --ad-account-id sobrescreve a conta só nesta execução (normaliza prefixo act_).
    if (args.adAccountId) ctx.actId = args.adAccountId.startsWith('act_') ? args.adAccountId : `act_${args.adAccountId}`;
    await resolveActId(ctx);
    if (!args.account && !args.campaignId) args.account = true; // default: conta inteira
    try {
      bundle = await bundleLive(args, ctx, cfg);
    } catch (e) {
      process.stderr.write(`Falha ao ler a Graph API: ${e.message}\n→ Caindo para dados de exemplo.\n`);
      bundle = carregarFixture();
      if (cfg) aplicarConfig(bundle, cfg);
    }
  }

  if (args.vendas) anexarVendas(bundle, args.vendas);

  if (args.saida) escrever(bundle, args.saida);
  if (args.json || !args.saida) process.stdout.write(JSON.stringify(bundle, null, 2) + '\n');
}

main().catch((e) => {
  process.stderr.write(`Erro inesperado: ${e.message}\n`);
  process.exit(2);
});
