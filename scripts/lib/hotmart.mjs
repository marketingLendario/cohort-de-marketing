/**
 * scripts/lib/hotmart.mjs — conector da API da Hotmart (vendas / atribuição, Aula 4).
 *
 * Espelha o padrão do lib/meta-graph.mjs: zero dependências (fetch nativo Node >= 18),
 * scrubber de segredos em toda saída, leitura do .env. OAuth client_credentials.
 *
 * Fluxo: buildHotmartCtx(env) → hotmartAuth(ctx) (pega o Bearer) → hotmartGet(path, params, ctx).
 * Preparado para outras plataformas via o mesmo shape de ctx (ver PLATAFORMAS abaixo).
 *
 * Docs: https://developers.hotmart.com/docs/en/start/app-auth
 *       https://developers.hotmart.com/docs/en/v1/sales/sales-history/
 */

import { Buffer } from 'node:buffer';
import { makeScrubber } from './meta-graph.mjs';

export const HOTMART_AUTH_URL = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
export const HOTMART_API_BASE = 'https://developers.hotmart.com';
export const TIMEOUT_MS = 25_000;

// Status de transação que contam como RECEITA de caixa (o resto é filtrado ou tratado à parte).
export const STATUS_RECEITA = ['APPROVED', 'COMPLETE'];
export const STATUS_ESTORNO = ['REFUNDED', 'CHARGEBACK', 'PARTIALLY_REFUNDED', 'PROTESTED'];

// Catálogo de plataformas suportadas (Hotmart pronta; demais são stubs preparados).
export const PLATAFORMAS = {
  hotmart: { nome: 'Hotmart', vars: ['HOTMART_CLIENT_ID', 'HOTMART_CLIENT_SECRET'], pronto: true },
  kiwify: { nome: 'Kiwify', vars: ['KIWIFY_CLIENT_ID', 'KIWIFY_CLIENT_SECRET'], pronto: false },
  eduzz: { nome: 'Eduzz', vars: ['EDUZZ_CLIENT_ID', 'EDUZZ_CLIENT_SECRET'], pronto: false },
  monetizze: { nome: 'Monetizze', vars: ['MONETIZZE_TOKEN'], pronto: false },
};

/** Contexto Hotmart: credenciais + Basic (derivado se não vier pronto) + scrubber. */
export function buildHotmartCtx(env) {
  const clientId = env.HOTMART_CLIENT_ID || null;
  const clientSecret = env.HOTMART_CLIENT_SECRET || null;
  const basic = env.HOTMART_BASIC
    || (clientId && clientSecret ? Buffer.from(`${clientId}:${clientSecret}`).toString('base64') : null);
  return {
    clientId, clientSecret, basic, token: null,
    scrub: makeScrubber([clientId, clientSecret, basic]),
  };
}

async function fetchTimeout(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const json = await res.json().catch(() => ({}));
    return { res, json };
  } finally {
    clearTimeout(timer);
  }
}

/** Autentica (client_credentials) e guarda o Bearer em ctx.token. */
export async function hotmartAuth(ctx) {
  if (!ctx.clientId || !ctx.clientSecret || !ctx.basic) {
    return { ok: false, message: 'HOTMART_CLIENT_ID / HOTMART_CLIENT_SECRET ausentes no .env (ver aula-04/docs/tutorial-hotmart.md).' };
  }
  const url = new URL(HOTMART_AUTH_URL);
  url.searchParams.set('grant_type', 'client_credentials');
  url.searchParams.set('client_id', ctx.clientId);
  url.searchParams.set('client_secret', ctx.clientSecret);
  try {
    const { res, json } = await fetchTimeout(url, { method: 'POST', headers: { Authorization: `Basic ${ctx.basic}` } });
    if (json.access_token) { ctx.token = json.access_token; return { ok: true, expira_em: json.expires_in }; }
    return { ok: false, status: res.status, message: ctx.scrub(json.error_description || json.error || `falha de autenticação (HTTP ${res.status})`) };
  } catch (e) {
    return { ok: false, message: ctx.scrub(e.name === 'AbortError' ? `timeout após ${TIMEOUT_MS / 1000}s` : e.message) };
  }
}

/** GET autenticado na API da Hotmart. Autentica sozinho se ainda não houver token. */
export async function hotmartGet(path, params, ctx) {
  if (!ctx.token) { const a = await hotmartAuth(ctx); if (!a.ok) return a; }
  const url = new URL(`${HOTMART_API_BASE}${path}`);
  for (const [k, v] of Object.entries(params || {})) if (v != null && v !== '') url.searchParams.set(k, v);
  try {
    const { res, json } = await fetchTimeout(url, { headers: { Authorization: `Bearer ${ctx.token}` } });
    if (res.status >= 400 || json.error) {
      return { ok: false, status: res.status, message: ctx.scrub(json.message || json.error_description || json.error || `HTTP ${res.status}`) };
    }
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, message: ctx.scrub(e.name === 'AbortError' ? `timeout após ${TIMEOUT_MS / 1000}s` : e.message) };
  }
}

/** Percorre a paginação (page_token) do Sales History até maxPages. */
export async function hotmartGetAll(path, params, ctx, maxPages = 10) {
  const out = [];
  let pageToken = null;
  for (let i = 0; i < maxPages; i++) {
    const r = await hotmartGet(path, { ...params, ...(pageToken ? { page_token: pageToken } : {}) }, ctx);
    if (!r.ok) return out.length ? { ok: true, data: out, parcial: r.message } : r;
    out.push(...(r.data.items || []));
    pageToken = r.data.page_info?.next_page_token || null;
    if (!pageToken) break;
  }
  return { ok: true, data: out };
}
