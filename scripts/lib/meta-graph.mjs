/**
 * scripts/lib/meta-graph.mjs — base compartilhada dos scripts do Squad de Tráfego.
 *
 * Extraída do zelador-audit.mjs (plano: plans/squad-trafego-master-plan.md, Fase A).
 * Zero dependências: fetch nativo do Node >= 18. Toda chamada usa appsecret_proof
 * quando META_APP_SECRET existe, e nenhum segredo aparece em output (scrubber).
 */

import { readFileSync, existsSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { join, resolve } from 'node:path';

export const GRAPH_VERSION = 'v24.0';
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
export const TIMEOUT_MS = 20_000;

export const ACCOUNT_STATUS = {
  1: 'ATIVA',
  2: 'DESATIVADA',
  3: 'PENDENTE DE PAGAMENTO (unsettled)',
  7: 'EM REVISÃO DE RISCO',
  8: 'PAGAMENTO PENDENTE DE LIQUIDAÇÃO',
  9: 'EM PERÍODO DE CARÊNCIA',
  100: 'FECHAMENTO PENDENTE',
  101: 'FECHADA',
};

export const DISABLE_REASON = {
  0: null,
  1: 'violação de política de integridade de anúncios',
  2: 'em revisão de integridade (ADS_IP_REVIEW)',
  3: 'risco de pagamento (RISK_PAYMENT)',
  4: 'conta cinza desativada (GRAY_ACCOUNT_SHUT_DOWN)',
  5: 'em revisão AFC (ADS_AFC_REVIEW)',
  6: 'integridade do negócio (BUSINESS_INTEGRITY_RAR)',
  7: 'fechamento permanente',
  8: 'conta de revendedor sem uso',
  9: 'conta sem uso',
};

// Dicas pedagógicas por código de erro da Graph API
export const ERROR_HINTS = {
  1: 'Erro genérico da Meta em ESCRITA. Causas na ordem mais comum: (1) META_AD_ACCOUNT_ID é um ID antigo/alias — leitura funciona, escrita não; descubra o ID canônico com scripts/zelador-audit.mjs e atualize o .env; (2) o System User tem só "Ver desempenho" na conta — troque para "Gerenciar campanhas" em BM > Usuários do sistema > Atribuir ativos; (3) o app não tem o produto Marketing API habilitado em developers.facebook.com.',
  190: 'Token inválido ou expirado — gere um novo token de System User (guia da Aula 3) e atualize META_ACCESS_TOKEN no .env.',
  102: 'Sessão inválida — gere um novo token de System User e atualize o .env.',
  100: 'ID errado ou campo inexistente — confira o ID no .env (conta sem o prefixo act_; pixel/BM/página como aparecem no Business Manager).',
  200: 'Permissão insuficiente — o System User precisa ter o ativo atribuído a ele no BM (Usuários do sistema > Atribuir ativos).',
  10: 'Permissão de app insuficiente — confira os escopos do token (business_management, ads_read/ads_management).',
  4: 'Limite de chamadas da API atingido — aguarde alguns minutos e rode de novo.',
  17: 'Limite de chamadas da conta atingido — aguarde alguns minutos e rode de novo.',
  32: 'Limite de chamadas da página atingido — aguarde alguns minutos e rode de novo.',
  613: 'Limite de chamadas atingido — aguarde alguns minutos e rode de novo.',
};

export function hint(code, fallback) {
  return ERROR_HINTS[code] || fallback;
}

// ---------------------------------------------------------------- env

export function findEnvFile(explicit, scriptDir) {
  if (explicit) {
    const p = resolve(explicit);
    if (existsSync(p)) return p;
    // caminho explícito inexistente NÃO trava (nunca-travar): avisa e segue sem env → modo exemplo
    process.stderr.write(`aviso: --env aponta para arquivo inexistente (${p}) — seguindo sem credenciais.\n`);
    return null;
  }
  const candidates = [join(process.cwd(), '.env')];
  if (scriptDir) candidates.push(join(scriptDir, '..', '.env'), join(scriptDir, '..', '..', '.env'));
  return candidates.find((p) => existsSync(p)) || null;
}

export function loadEnv(path) {
  const env = {};
  if (!path || !existsSync(path)) return env;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

export function makeScrubber(secrets) {
  const values = secrets.filter((s) => s && s.length >= 8);
  return (text) => {
    let out = String(text ?? '');
    for (const v of values) out = out.split(v).join('[REDACTED]');
    return out;
  };
}

/** Contexto padrão dos scripts: token + secret + scrubber + ids usuais. */
export function buildCtx(env) {
  return {
    env,
    token: env.META_ACCESS_TOKEN,
    appSecret: env.META_APP_SECRET || null,
    scrub: makeScrubber([env.META_ACCESS_TOKEN, env.META_APP_SECRET]),
    actId: env.META_AD_ACCOUNT_ID
      ? (env.META_AD_ACCOUNT_ID.startsWith('act_') ? env.META_AD_ACCOUNT_ID : `act_${env.META_AD_ACCOUNT_ID}`)
      : null,
  };
}

// ------------------------------------------------------------- graph

function authParams(ctx) {
  const p = { access_token: ctx.token };
  if (ctx.appSecret) {
    p.appsecret_proof = createHmac('sha256', ctx.appSecret).update(ctx.token).digest('hex');
  }
  return p;
}

function encodeValue(v) {
  return typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
}

async function request(method, path, params, ctx, body) {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, encodeValue(v));
  if (method === 'GET' || method === 'DELETE') {
    for (const [k, v] of Object.entries(authParams(ctx))) url.searchParams.set(k, v);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const init = { method, signal: controller.signal };
    if (method === 'POST') {
      if (body instanceof FormData) {
        for (const [k, v] of Object.entries(authParams(ctx))) body.set(k, v);
        init.body = body;
      } else {
        const form = new URLSearchParams();
        for (const [k, v] of Object.entries(body || {})) form.set(k, encodeValue(v));
        for (const [k, v] of Object.entries(authParams(ctx))) form.set(k, v);
        init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        init.body = form;
      }
    }
    const res = await fetch(url, init);
    const json = await res.json();
    if (json.error) {
      return {
        ok: false,
        code: json.error.code,
        subcode: json.error.error_subcode,
        message: ctx.scrub(json.error.error_user_msg || json.error.message),
      };
    }
    return { ok: true, data: json };
  } catch (e) {
    const reason = e.name === 'AbortError' ? `timeout após ${TIMEOUT_MS / 1000}s` : e.message;
    return { ok: false, code: 'network', message: ctx.scrub(reason) };
  } finally {
    clearTimeout(timer);
  }
}

export async function graphGet(path, params, ctx) {
  return request('GET', path, params, ctx);
}

/** POST form-encoded (ou FormData para upload). Objetos/arrays viram JSON. */
export async function graphPost(path, body, ctx) {
  return request('POST', path, null, ctx, body);
}

export async function graphDelete(path, params, ctx) {
  return request('DELETE', path, params, ctx);
}

/**
 * Resolve o ID canônico da conta de anúncios. IDs antigos/alias funcionam em
 * leitura mas falham em ESCRITA com erro genérico (código 1) — descoberto
 * empiricamente. Atualiza ctx.actId no lugar e devolve o resultado.
 */
export async function resolveActId(ctx) {
  if (!ctx.actId) return { ok: false, message: 'sem META_AD_ACCOUNT_ID' };
  const r = await graphGet(ctx.actId, { fields: 'id' }, ctx);
  if (!r.ok) return r;
  const canonico = r.data.id;
  const mudou = canonico !== ctx.actId;
  ctx.actId = canonico;
  return { ok: true, canonico, mudou };
}

/** Percorre paginação (cursor after) até maxPages. */
export async function graphGetAll(path, params, ctx, maxPages = 10) {
  const out = [];
  let after = null;
  for (let i = 0; i < maxPages; i++) {
    const r = await graphGet(path, { ...params, ...(after ? { after } : {}) }, ctx);
    if (!r.ok) return r;
    out.push(...(r.data.data || []));
    after = r.data.paging?.cursors?.after;
    if (!after || !r.data.paging?.next) break;
  }
  return { ok: true, data: out };
}
