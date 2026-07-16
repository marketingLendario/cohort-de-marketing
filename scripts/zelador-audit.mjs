#!/usr/bin/env node
/**
 * scripts/zelador-audit.mjs — Auditoria real de saúde de conta Meta (Zelador, Modo API).
 *
 * Valida via Graph API: token/escopos, Business Manager, conta de anúncios,
 * pagamento, pixel (disparo), CAPI (eventos server) e página vinculada.
 * Itens que a API não consegue provar (deduplicação, domínio verificado,
 * pixel na página certa) saem com fonte "nao_verificavel_api" — nunca são
 * marcados saudáveis por presunção.
 *
 * Uso:
 *   node scripts/zelador-audit.mjs               # relatório legível (PT-BR)
 *   node scripts/zelador-audit.mjs --json        # JSON para a skill zelador
 *   node scripts/zelador-audit.mjs --env=/caminho/.env
 *   node scripts/zelador-audit.mjs --gravar-env  # grava no .env os IDs descobertos
 *   node scripts/zelador-audit.mjs --publicos    # + inventário read-only de públicos (temperatura/elegibilidade)
 *
 * Descoberta automática: se algum ID (conta, BM, pixel, página) estiver
 * ausente no .env, o script tenta descobrir via API (/me/adaccounts,
 * act_X?fields=business, /adspixels, /me/accounts). Ativo único → usa e
 * sugere a linha do .env; vários → lista para você escolher (nunca chuta).
 *
 * Requer no .env: META_ACCESS_TOKEN (System User, escopos business_management
 * + ads_read). Recomendado: META_APP_ID, META_APP_SECRET (appsecret_proof),
 * META_AD_ACCOUNT_ID, META_PIXEL_ID, META_BUSINESS_MANAGER_ID,
 * META_FACEBOOK_PAGE_ID. Zero dependências — só fetch nativo (Node >= 18).
 * Somente chamadas GET (read-only); nenhum segredo aparece no output.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GRAPH_VERSION, GRAPH_BASE, TIMEOUT_MS,
  ACCOUNT_STATUS, DISABLE_REASON, hint,
  findEnvFile as libFindEnvFile, loadEnv, buildCtx, graphGet, graphPost, graphDelete,
} from './lib/meta-graph.mjs';
import { fetchPublicos, classificarPublico, avaliarElegibilidade, dataAtualizacao } from './lib/publicos.mjs';

const PIXEL_FIRE_MAX_AGE_H = 48;
const TOKEN_EXPIRY_WARN_DAYS = 30;
const REQUIRED_SCOPES = ['business_management', 'ads_read'];

// ---------------------------------------------------------------- env

function parseArgs(argv) {
  const out = { json: false, envPath: null, help: false, gravarEnv: false, testarEscrita: false, publicos: false };
  for (const a of argv) {
    if (a === '--json') out.json = true;
    else if (a === '--gravar-env') out.gravarEnv = true;
    else if (a === '--testar-escrita') out.testarEscrita = true;
    else if (a === '--publicos') out.publicos = true;
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('--env=')) out.envPath = a.slice('--env='.length);
  }
  return out;
}

function findEnvFile(explicit) {
  return libFindEnvFile(explicit, dirname(fileURLToPath(import.meta.url)));
}

// --------------------------------------------------------- discovery

/**
 * Descobre IDs ausentes no .env via API. Ativo único → usa (descobertos);
 * vários → lista em opcoes para o aluno escolher. Nunca escolhe sozinho.
 */
async function discoverAssets(ctx, env) {
  const descobertos = {};
  const opcoes = {};
  const eff = { ...env };

  if (!eff.META_AD_ACCOUNT_ID) {
    const r = await graphGet('me/adaccounts', { fields: 'id,name,account_status', limit: 50 }, ctx);
    const list = r.ok ? r.data.data || [] : [];
    if (list.length === 1) {
      const id = list[0].id.replace(/^act_/, '');
      eff.META_AD_ACCOUNT_ID = id;
      descobertos.META_AD_ACCOUNT_ID = { valor: id, nome: list[0].name };
    } else if (list.length > 1) {
      opcoes.META_AD_ACCOUNT_ID = list.map((a) => ({ id: a.id.replace(/^act_/, ''), nome: a.name, extra: ACCOUNT_STATUS[a.account_status] || `status ${a.account_status}` }));
    }
  }

  if (!eff.META_BUSINESS_MANAGER_ID && eff.META_AD_ACCOUNT_ID) {
    // /me/businesses costuma vir vazio para System User — o BM sai da conta
    const r = await graphGet(`act_${eff.META_AD_ACCOUNT_ID.replace(/^act_/, '')}`, { fields: 'business' }, ctx);
    if (r.ok && r.data.business) {
      eff.META_BUSINESS_MANAGER_ID = r.data.business.id;
      descobertos.META_BUSINESS_MANAGER_ID = { valor: r.data.business.id, nome: r.data.business.name };
    }
  }

  if (!eff.META_PIXEL_ID && eff.META_AD_ACCOUNT_ID) {
    const r = await graphGet(`act_${eff.META_AD_ACCOUNT_ID.replace(/^act_/, '')}/adspixels`, { fields: 'id,name,last_fired_time', limit: 50 }, ctx);
    const list = r.ok ? r.data.data || [] : [];
    if (list.length === 1) {
      eff.META_PIXEL_ID = list[0].id;
      descobertos.META_PIXEL_ID = { valor: list[0].id, nome: list[0].name };
    } else if (list.length > 1) {
      const sorted = [...list].sort((a, b) => String(b.last_fired_time || '').localeCompare(String(a.last_fired_time || '')));
      opcoes.META_PIXEL_ID = sorted.map((p) => ({ id: p.id, nome: p.name, extra: p.last_fired_time ? `último disparo ${p.last_fired_time}` : 'nunca disparou' }));
    }
  }

  if (!eff.META_FACEBOOK_PAGE_ID) {
    const r = await graphGet('me/accounts', { fields: 'id,name', limit: 50 }, ctx);
    const list = r.ok ? r.data.data || [] : [];
    if (list.length === 1) {
      eff.META_FACEBOOK_PAGE_ID = list[0].id;
      descobertos.META_FACEBOOK_PAGE_ID = { valor: list[0].id, nome: list[0].name };
    } else if (list.length > 1) {
      opcoes.META_FACEBOOK_PAGE_ID = list.map((p) => ({ id: p.id, nome: p.name }));
    }
  }

  const sugestoesEnv = Object.entries(descobertos).map(([k, v]) => `${k}=${v.valor}`);
  return { eff, descobertos, opcoes, sugestoesEnv };
}

/** Grava no .env os IDs descobertos (só chaves ausentes ou vazias). */
function gravarEnv(envPath, descobertos) {
  let text = readFileSync(envPath, 'utf8');
  const gravadas = [];
  for (const [k, v] of Object.entries(descobertos)) {
    const re = new RegExp(`^${k}=\\s*$`, 'm');
    if (re.test(text)) text = text.replace(re, `${k}=${v.valor}`);
    else if (!new RegExp(`^${k}=`, 'm').test(text)) text += `${text.endsWith('\n') ? '' : '\n'}${k}=${v.valor}\n`;
    else continue; // já preenchida — não sobrescreve
    gravadas.push(k);
  }
  if (gravadas.length) writeFileSync(envPath, text);
  return gravadas;
}

// ------------------------------------------------------------ checks

function check(campo, critico, valor, fonte, detalhe, acao) {
  return { campo, critico, valor, fonte, detalhe, ...(acao ? { acao } : {}) };
}

function naoConfigurado(campo, critico, variavel) {
  return check(
    campo, critico, null, 'nao_verificavel_api',
    `variável ${variavel} ausente no .env — item não auditado`,
    `Preencha ${variavel} no .env e rode de novo.`,
  );
}

async function checkToken(ctx, env) {
  const appToken = env.META_APP_ID && env.META_APP_SECRET
    ? `${env.META_APP_ID}|${env.META_APP_SECRET}`
    : ctx.token; // um token pode inspecionar a si mesmo
  const url = new URL(`${GRAPH_BASE}/debug_token`);
  url.searchParams.set('input_token', ctx.token);
  url.searchParams.set('access_token', appToken);
  let d;
  try {
    const body = await (await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })).json();
    if (body.error) {
      return {
        result: check('token_valido', true, false, 'api',
          `debug_token falhou: ${ctx.scrub(body.error.message)} (código ${body.error.code})`,
          'Gere um novo token de System User no Business Manager (guia da Aula 3).'),
        info: null,
      };
    }
    d = body.data;
  } catch (e) {
    return {
      result: check('token_valido', true, null, 'nao_verificavel_api',
        `sem resposta da Graph API: ${ctx.scrub(e.message)}`,
        'Verifique sua conexão e rode de novo.'),
      info: null,
    };
  }

  const faltando = REQUIRED_SCOPES.filter(
    (s) => !(d.scopes || []).includes(s) && !(s === 'ads_read' && (d.scopes || []).includes('ads_management')),
  );
  const expira = d.expires_at === 0 ? null : new Date(d.expires_at * 1000);
  const diasParaExpirar = expira ? Math.floor((expira - Date.now()) / 86_400_000) : null;

  const problemas = [];
  if (!d.is_valid) problemas.push('token inválido segundo a Meta');
  if (faltando.length) problemas.push(`escopos ausentes: ${faltando.join(', ')}`);
  if (diasParaExpirar !== null && diasParaExpirar < 0) problemas.push('token expirado');

  const detalheOk = [
    `tipo ${d.type}`,
    expira ? `expira em ${expira.toISOString().slice(0, 10)} (${diasParaExpirar} dias)` : 'sem expiração',
    `${(d.scopes || []).length} escopos`,
  ].join(', ');

  const result = problemas.length
    ? check('token_valido', true, false, 'api', problemas.join('; '),
        'Gere um novo token de System User com os escopos business_management e ads_read (guia da Aula 3).')
    : check('token_valido', true, true, 'api', detalheOk,
        diasParaExpirar !== null && diasParaExpirar <= TOKEN_EXPIRY_WARN_DAYS
          ? `Atenção: token expira em ${diasParaExpirar} dias — renove antes.`
          : undefined);
  return { result, info: { type: d.type, expires: expira, scopes: d.scopes || [] } };
}

async function checkBM(ctx, env) {
  if (!env.META_BUSINESS_MANAGER_ID) return naoConfigurado('bm_ativo', true, 'META_BUSINESS_MANAGER_ID');
  const r = await graphGet(env.META_BUSINESS_MANAGER_ID, { fields: 'id,name,verification_status' }, ctx);
  if (!r.ok) {
    return check('bm_ativo', true, false, 'api',
      `BM inacessível: ${r.message} (código ${r.code})`,
      hint(r.code, 'Confirme o ID do BM e se o System User pertence a esse BM.'));
  }
  const v = r.data.verification_status;
  const verificado = v === 'verified';
  return check('bm_ativo', true, true, 'api',
    `BM "${r.data.name}" acessível — verificação da empresa: ${v || 'desconhecida'}`,
    verificado ? undefined : 'BM acessível mas empresa não verificada — verifique em Segurança > Central de Segurança.');
}

async function checkAdAccount(ctx, env) {
  if (!env.META_AD_ACCOUNT_ID) {
    return {
      conta: naoConfigurado('conta_anuncios_ativa', true, 'META_AD_ACCOUNT_ID'),
      pagamento: naoConfigurado('pagamento_aprovado', true, 'META_AD_ACCOUNT_ID'),
    };
  }
  const id = env.META_AD_ACCOUNT_ID.startsWith('act_') ? env.META_AD_ACCOUNT_ID : `act_${env.META_AD_ACCOUNT_ID}`;
  const r = await graphGet(id, {
    fields: 'name,account_status,disable_reason,currency,timezone_name,funding_source_details,spend_cap,amount_spent',
  }, ctx);
  if (!r.ok) {
    const falha = check('conta_anuncios_ativa', true, false, 'api',
      `conta inacessível: ${r.message} (código ${r.code})`,
      hint(r.code, 'Confirme o ID da conta e se o System User tem acesso a ela no BM.'));
    return { conta: falha, pagamento: check('pagamento_aprovado', true, null, 'nao_verificavel_api', 'não auditado — conta inacessível') };
  }
  const d = r.data;
  const statusLabel = ACCOUNT_STATUS[d.account_status] || `status ${d.account_status}`;
  const ativa = d.account_status === 1;
  const motivo = DISABLE_REASON[d.disable_reason];
  const canonico = d.id ? d.id.replace(/^act_/, '') : null;
  const aliasAviso = canonico && canonico !== id.replace(/^act_/, '')
    ? ` ATENÇÃO: o ID no .env é um alias antigo — atualize META_AD_ACCOUNT_ID para ${canonico} (alias funciona em leitura mas FALHA em publicação).`
    : '';

  const conta = ativa
    ? check('conta_anuncios_ativa', true, true, 'api', `"${d.name}" — ${statusLabel} (${d.currency}, ${d.timezone_name})${aliasAviso}`,
        aliasAviso ? `Atualize META_AD_ACCOUNT_ID no .env para ${canonico}.` : undefined)
    : check('conta_anuncios_ativa', true, false, 'api',
        `"${d.name}" — ${statusLabel}${motivo ? ` — motivo: ${motivo}` : ''}`,
        'Resolva o status da conta no Gerenciador de Anúncios antes de subir campanha.');

  const temFonte = Boolean(d.funding_source_details && d.funding_source_details.id);
  const semPendencia = d.account_status !== 3 && d.account_status !== 8;
  const pagamento = temFonte && semPendencia
    ? check('pagamento_aprovado', true, true, 'api', 'meio de pagamento cadastrado e sem pendência de cobrança')
    : check('pagamento_aprovado', true, false, 'api',
        temFonte ? `pagamento com pendência: ${statusLabel}` : 'nenhum meio de pagamento cadastrado na conta',
        'Configure/regularize o pagamento em Configurações de Pagamento do Gerenciador.');
  return { conta, pagamento };
}

async function checkPixel(ctx, env) {
  const nv = (campo, critico) => naoConfigurado(campo, critico, 'META_PIXEL_ID');
  if (!env.META_PIXEL_ID) {
    return { pixel: nv('pixel_disparando', true), capi: nv('capi_ativo', true), dedup: nv('evento_compra_deduplicado', true), eventos: null };
  }
  const r = await graphGet(env.META_PIXEL_ID, { fields: 'id,name,last_fired_time,is_unavailable' }, ctx);
  if (!r.ok) {
    const falha = check('pixel_disparando', true, false, 'api',
      `pixel inacessível: ${r.message} (código ${r.code})`,
      hint(r.code, 'Confirme o META_PIXEL_ID e se o System User tem acesso ao dataset no Events Manager.'));
    return {
      pixel: falha,
      capi: check('capi_ativo', true, null, 'nao_verificavel_api', 'não auditado — pixel inacessível'),
      dedup: check('evento_compra_deduplicado', true, null, 'nao_verificavel_api', 'não auditado — pixel inacessível'),
      eventos: null,
    };
  }
  const d = r.data;
  const lastFired = d.last_fired_time ? new Date(d.last_fired_time) : null;
  const horasAtras = lastFired ? (Date.now() - lastFired) / 3_600_000 : null;
  const disparando = !d.is_unavailable && horasAtras !== null && horasAtras <= PIXEL_FIRE_MAX_AGE_H;

  const pixel = disparando
    ? check('pixel_disparando', true, true, 'api',
        `pixel "${d.name}" disparou há ${Math.round(horasAtras)}h (último: ${d.last_fired_time})`)
    : check('pixel_disparando', true, false, 'api',
        d.is_unavailable
          ? `pixel "${d.name}" marcado como indisponível`
          : lastFired
            ? `último disparo há ${Math.round(horasAtras)}h (> ${PIXEL_FIRE_MAX_AGE_H}h): ${d.last_fired_time}`
            : `pixel "${d.name}" nunca disparou`,
        'Instale/teste o pixel na página de conversão (Pixel Helper) antes de subir campanha.');

  // CAPI + sinal de dedup via /stats (janela recente que a API retornar)
  const stats = await graphGet(`${env.META_PIXEL_ID}/stats`, { aggregation: 'event_source' }, ctx);
  let capi, dedup;
  if (!stats.ok) {
    capi = check('capi_ativo', true, null, 'nao_verificavel_api',
      `stats do pixel indisponíveis: ${stats.message}`,
      'Confira manualmente: Events Manager > Fontes de Dados > [pixel] > Visão Geral deve mostrar eventos de "Servidor".');
    dedup = check('evento_compra_deduplicado', true, null, 'nao_verificavel_api',
      'sem stats — faça o teste manual de compra',
      'Faça uma compra-teste e confirme que o evento aparece UMA vez no Events Manager, com event_id presente.');
  } else {
    const buckets = stats.data.data || [];
    let server = 0, browser = 0;
    const janela = { de: null, ate: null };
    for (const b of buckets) {
      if (!janela.de || b.start_time < janela.de) janela.de = b.start_time;
      if (!janela.ate || b.start_time > janela.ate) janela.ate = b.start_time;
      for (const e of b.data || []) {
        if (e.value === 'SERVER') server += e.count;
        if (e.value === 'BROWSER') browser += e.count;
      }
    }
    capi = server > 0
      ? check('capi_ativo', true, true, 'api',
          `${server} eventos de servidor e ${browser} de navegador na janela ${janela.de || '?'} → ${janela.ate || '?'}`)
      : check('capi_ativo', true, false, 'api',
          `nenhum evento de servidor na janela recente (navegador: ${browser})`,
          'Ative a Conversions API — sem ela, iOS/bloqueadores derrubam o sinal de conversão.');
    dedup = check('evento_compra_deduplicado', true, null, 'nao_verificavel_api',
      server > 0 && browser > 0
        ? `sinal positivo: eventos chegando por servidor E navegador — a dedup por event_id precisa de teste manual`
        : 'sem tráfego duplo (server+browser) na janela — teste manual necessário',
      'Faça uma compra-teste e confirme no Events Manager que o evento aparece UMA vez, com event_id presente nos dois canais.');
  }

  // Breakdown por tipo de evento (informativo)
  const ev = await graphGet(`${env.META_PIXEL_ID}/stats`, { aggregation: 'event' }, ctx);
  let eventos = null;
  if (ev.ok) {
    const tally = {};
    for (const b of ev.data.data || []) for (const e of b.data || []) tally[e.value] = (tally[e.value] || 0) + e.count;
    eventos = tally;
  }
  return { pixel, capi, dedup, eventos };
}

async function checkPage(ctx, env) {
  if (!env.META_FACEBOOK_PAGE_ID) return naoConfigurado('pagina_vinculada', false, 'META_FACEBOOK_PAGE_ID');
  const r = await graphGet(env.META_FACEBOOK_PAGE_ID, { fields: 'id,name,is_published' }, ctx);
  if (!r.ok) {
    return check('pagina_vinculada', false, false, 'api',
      `página inacessível: ${r.message} (código ${r.code})`,
      hint(r.code, 'Confirme o ID da página e o acesso do System User a ela.'));
  }
  return r.data.is_published
    ? check('pagina_vinculada', false, true, 'api', `página "${r.data.name}" acessível e publicada`)
    : check('pagina_vinculada', false, false, 'api', `página "${r.data.name}" NÃO publicada`,
        'Publique a página — anúncio não roda com página despublicada.');
}

/**
 * Opt-in (--testar-escrita): cria e apaga um ad label — metadado invisível,
 * sem efeito em entrega — para saber se a PUBLICAÇÃO via API vai funcionar
 * (app precisa do produto Marketing API). Não crítico para o gate do squad,
 * mas decide se o Estruturador pode publicar via API ou só via gerenciador.
 */
async function checkEscrita(ctx, env) {
  let actId = env.META_AD_ACCOUNT_ID
    ? (env.META_AD_ACCOUNT_ID.startsWith('act_') ? env.META_AD_ACCOUNT_ID : `act_${env.META_AD_ACCOUNT_ID}`)
    : null;
  if (!actId) return naoConfigurado('api_escrita_habilitada', false, 'META_AD_ACCOUNT_ID');
  // IDs antigos/alias falham em escrita com erro genérico — resolve o canônico antes
  const canon = await graphGet(actId, { fields: 'id' }, ctx);
  if (canon.ok) actId = canon.data.id;
  const r = await graphPost(`${actId}/adlabels`, { name: 'zelador-teste-escrita' }, { ...ctx, actId });
  if (!r.ok) {
    return check('api_escrita_habilitada', false, false, 'api',
      `escrita recusada (código ${r.code}): ${r.message || 'erro genérico'}`,
      hint(r.code, 'Publicação via API indisponível — o Estruturador deve usar o caminho manual (gerenciador).'));
  }
  await graphDelete(r.data.id, {}, { ...ctx, actId });
  return check('api_escrita_habilitada', false, true, 'api',
    'conta aceita escrita deste app — Estruturador pode publicar via API');
}

function checkDominio() {
  return check('dominio_verificado', false, null, 'nao_verificavel_api',
    `a Graph API ${GRAPH_VERSION} não expõe verificação de domínio para System User`,
    'Confira manualmente: Business Manager > Configurações > Segurança da Marca > Domínios.');
}

// -------------------------------------------------- públicos (opt-in)

/**
 * Inventário read-only dos públicos personalizados (flag --publicos). Classifica
 * por temperatura e avalia elegibilidade com as regras compartilhadas de
 * lib/publicos.mjs (as mesmas que o Estruturador v2 reusa na 19.W2.1). Contagens
 * sempre aproximadas (bounds da Meta). Nenhuma chamada de escrita — só GET.
 */
async function auditarPublicos(ctx) {
  const agora = new Date();
  const auditados_em = agora.toISOString().slice(0, 10);
  const r = await fetchPublicos(ctx);
  if (!r.ok) {
    return {
      fonte: 'api', auditados_em, ok: false, total_na_conta: 0,
      erro: `${r.message || 'falha ao listar públicos'}${r.code ? ` (código ${r.code})` : ''}`,
    };
  }
  const analisados = r.data.map((p) => {
    const cls = classificarPublico(p);
    const eleg = avaliarElegibilidade(p, agora);
    return {
      id: p.id,
      nome: p.name,
      subtype: p.subtype,
      temperatura: cls.temperatura,
      tamanho_min: typeof p.approximate_count_lower_bound === 'number' ? p.approximate_count_lower_bound : null,
      tamanho_max: typeof p.approximate_count_upper_bound === 'number' ? p.approximate_count_upper_bound : null,
      atualizado_em: dataAtualizacao(p),
      elegivel: eleg.elegivel,
      motivo: eleg.motivo,
      tipo_alerta: eleg.tipo_alerta || null,
    };
  });
  const porTamanho = (a, b) => (b.tamanho_min || 0) - (a.tamanho_min || 0);
  const morno = analisados.filter((a) => a.temperatura === 'morno').sort(porTamanho);
  const quente = analisados.filter((a) => a.temperatura === 'quente').sort(porTamanho);
  const naoAplicavel = analisados.filter((a) => a.temperatura === 'nao_aplicavel');
  const elegiveis_morno = morno.filter((a) => a.elegivel);
  const elegiveis_quente = quente.filter((a) => a.elegivel);
  // Inelegíveis acionáveis: só morno/quente (lookalike/nao_aplicavel não entram no kit v2).
  const inelegiveis = analisados
    .filter((a) => !a.elegivel && a.temperatura !== 'nao_aplicavel')
    .sort(porTamanho);
  return {
    fonte: 'api',
    auditados_em,
    ok: true,
    total_na_conta: analisados.length,
    resumo: {
      morno: morno.length,
      quente: quente.length,
      nao_aplicavel: naoAplicavel.length,
      elegiveis_morno: elegiveis_morno.length,
      elegiveis_quente: elegiveis_quente.length,
      inelegiveis: inelegiveis.length,
    },
    elegiveis_morno,
    elegiveis_quente,
    inelegiveis,
  };
}

// ------------------------------------------------------------ report

function computeStatus(checks) {
  const criticosFalhos = checks.filter((c) => c.critico && c.valor === false);
  if (criticosFalhos.length) return 'CRITICO';
  const pendentes = checks.filter((c) => c.valor === null);
  return pendentes.length ? 'PARCIAL' : 'OK';
}

function toPainelYaml(checks, status, hoje) {
  const get = (campo) => {
    const c = checks.find((x) => x.campo === campo);
    return c && c.valor !== null ? c.valor : 'null  # pendente manual';
  };
  const obs = checks
    .filter((c) => c.acao || c.valor === false || c.valor === null)
    .map((c) => `    - "[${c.campo}] ${c.acao || c.detalhe}"`);
  return [
    'zelador:',
    `  modo: "api"`,
    `  ultima_checagem: "${hoje}"`,
    `  bm_ativo: ${get('bm_ativo')}`,
    `  conta_anuncios_ativa: ${get('conta_anuncios_ativa')}`,
    `  pixel_disparando: ${get('pixel_disparando')}`,
    `  capi_ativo: ${get('capi_ativo')}`,
    `  evento_compra_deduplicado: ${get('evento_compra_deduplicado')}`,
    `  dominio_verificado: ${get('dominio_verificado')}`,
    `  pagamento_aprovado: ${get('pagamento_aprovado')}`,
    `  pagina_vinculada: ${get('pagina_vinculada')}`,
    `  status_geral: "${status}"`,
    obs.length ? '  observacoes:' : '  observacoes: []',
    ...obs,
  ].join('\n');
}

/** Bloco YAML `zelador: publicos:` pronto para o Painel (listas capadas no top). */
function publicosParaYaml(pub) {
  const J = (s) => JSON.stringify(s ?? null);
  if (!pub.ok) {
    return [
      'zelador:',
      '  publicos:',
      `    auditados_em: "${pub.auditados_em}"     # fonte: api`,
      '    fonte: "api"',
      `    erro: ${J(pub.erro)}`,
    ].join('\n');
  }
  const elegLinha = (a) =>
    `      - {id: ${J(a.id)}, nome: ${J(a.nome)}, subtype: ${J(a.subtype)}, tamanho_min: ${a.tamanho_min ?? 'null'}, atualizado_em: ${J(a.atualizado_em)}}`;
  const inelegLinha = (a) => `      - {id: ${J(a.id)}, nome: ${J(a.nome)}, motivo: ${J(a.motivo)}}`;
  const lista = (chave, itens, linhaFn, top = 10) => {
    if (!itens.length) return [`    ${chave}: []`];
    const out = [`    ${chave}:`, ...itens.slice(0, top).map(linhaFn)];
    if (itens.length > top) out.push(`      # +${itens.length - top} não listados (rode com --json para a lista completa)`);
    return out;
  };
  return [
    'zelador:',
    '  publicos:',
    `    auditados_em: "${pub.auditados_em}"     # fonte: api — contagens aproximadas (bounds da Meta)`,
    '    fonte: "api"',
    `    total_na_conta: ${pub.total_na_conta}`,
    `    elegiveis_morno_total: ${pub.resumo.elegiveis_morno}`,
    `    elegiveis_quente_total: ${pub.resumo.elegiveis_quente}`,
    `    inelegiveis_total: ${pub.resumo.inelegiveis}`,
    `    nao_aplicavel_total: ${pub.resumo.nao_aplicavel}`,
    ...lista('elegiveis_morno', pub.elegiveis_morno, elegLinha),
    ...lista('elegiveis_quente', pub.elegiveis_quente, elegLinha),
    ...lista('inelegiveis', pub.inelegiveis, inelegLinha),
  ].join('\n');
}

/** Seção legível dos públicos (só quando --publicos foi passado). */
function publicosHuman(pub) {
  const lines = ['', `Públicos personalizados (customaudiences) — fonte: API ${GRAPH_VERSION}`];
  if (!pub.ok) {
    lines.push(` ✖ não foi possível listar: ${pub.erro}`, '');
    return lines;
  }
  const r = pub.resumo;
  const fmt = (n) => (typeof n === 'number' ? `~${n.toLocaleString('pt-BR')} (aprox.)` : '~oculto');
  lines.push(
    `Total na conta: ${pub.total_na_conta} · morno ${r.morno} (elegíveis ${r.elegiveis_morno}) · quente ${r.quente} (elegíveis ${r.elegiveis_quente}) · lookalike/não aplicável ${r.nao_aplicavel}`,
    'Contagens são aproximadas (bounds da Meta), nunca exatas.',
    '',
  );
  const bloco = (titulo, itens, cap, linhaFn) => {
    if (!itens.length) { lines.push(`${titulo}: nenhum`, ''); return; }
    lines.push(`${titulo} (${itens.length}${itens.length > cap ? `, mostrando top ${cap}` : ''}):`);
    for (const a of itens.slice(0, cap)) lines.push(linhaFn(a));
    lines.push('');
  };
  const elegLinha = (a) =>
    ` ✔ ${a.id}  ${JSON.stringify(a.nome)}  [${a.subtype}]  ${fmt(a.tamanho_min)}  atualizado ${a.atualizado_em || '?'}`;
  bloco('Elegíveis — MORNO', pub.elegiveis_morno, 20, elegLinha);
  bloco('Elegíveis — QUENTE', pub.elegiveis_quente, 20, elegLinha);
  bloco('Inelegíveis', pub.inelegiveis, 15, (a) =>
    ` ✖ ${a.id}  ${JSON.stringify(a.nome)}  [${a.subtype} · ${a.temperatura}]  ${a.motivo}`);
  lines.push('Bloco de públicos para o PAINEL-DA-SEMANA.yaml:', '', publicosParaYaml(pub), '');
  return lines;
}

function printHuman(report) {
  const icon = (c) => (c.valor === true ? '✔' : c.valor === false ? '✖' : '△');
  const lines = [
    '',
    `Zelador — Auditoria de conta Meta via Graph API ${GRAPH_VERSION}`,
    `Data: ${report.ultima_checagem}`,
    '',
    ...report.checks.map((c) => {
      const fonte = c.fonte === 'api' ? 'API' : 'manual';
      let s = ` ${icon(c)} ${c.campo.padEnd(28)} [${fonte}] ${c.detalhe}`;
      if (c.acao) s += `\n     → ${c.acao}`;
      return s;
    }),
    '',
  ];
  const d = report.descobertas;
  if (d && Object.keys(d.descobertos).length) {
    lines.push('IDs descobertos automaticamente via API (ausentes no .env):');
    for (const [k, v] of Object.entries(d.descobertos)) lines.push(` ✚ ${k}=${v.valor}  ("${v.nome}")`);
    lines.push(d.gravadas_no_env
      ? ` Gravados no .env: ${d.gravadas_no_env.join(', ')}`
      : ' Adicione as linhas acima ao .env (ou rode com --gravar-env para gravar automaticamente).');
    lines.push('');
  }
  if (d && Object.keys(d.opcoes).length) {
    lines.push('Ativos com mais de uma opção — escolha e preencha no .env:');
    for (const [k, list] of Object.entries(d.opcoes)) {
      lines.push(` ${k}:`);
      for (const o of list) lines.push(`   - ${o.id}  "${o.nome}"${o.extra ? `  (${o.extra})` : ''}`);
    }
    lines.push('');
  }
  if (report.eventos_recentes && Object.keys(report.eventos_recentes).length) {
    lines.push(`Eventos recentes no pixel: ${Object.entries(report.eventos_recentes).map(([k, v]) => `${k}=${v}`).join(', ')}`);
    lines.push('');
  }
  lines.push(`STATUS GERAL (API): ${report.status_geral}`);
  if (report.pendencias_manuais.length) {
    lines.push('', 'Pendências manuais (a skill zelador confirma com você):');
    for (const p of report.pendencias_manuais) lines.push(` △ ${p}`);
  }
  lines.push('', 'Bloco para o PAINEL-DA-SEMANA.yaml:', '', report.painel_yaml, '');
  if (report.publicos) lines.push(...publicosHuman(report.publicos));
  process.stdout.write(lines.join('\n'));
}

// -------------------------------------------------------------- main

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write('Uso: node scripts/zelador-audit.mjs [--json] [--publicos] [--testar-escrita] [--gravar-env] [--env=/caminho/.env]\n');
    process.exit(0);
  }

  const envPath = findEnvFile(args.envPath);
  if (!envPath) {
    process.stderr.write('Erro: .env não encontrado. Copie .env.example para .env e preencha as variáveis META_*.\n');
    process.exit(2);
  }
  const env = loadEnv(envPath);
  if (!env.META_ACCESS_TOKEN) {
    process.stderr.write(
      'Erro: META_ACCESS_TOKEN ausente no .env — o Modo API precisa dele.\n' +
      'Gere um token de System User (escopos business_management + ads_read) — veja aula-03/materiais/guia-app-meta-integracoes.html.\n' +
      'Sem token, rode a skill zelador no Modo Manual.\n',
    );
    process.exit(2);
  }

  const ctx = buildCtx(env);

  const token = await checkToken(ctx, env);
  const checks = [token.result];
  let descobertas = null;

  if (token.result.valor === true) {
    const disc = await discoverAssets(ctx, env);
    descobertas = { descobertos: disc.descobertos, opcoes: disc.opcoes, sugestoes_env: disc.sugestoesEnv };
    if (args.gravarEnv && Object.keys(disc.descobertos).length) {
      descobertas.gravadas_no_env = gravarEnv(envPath, disc.descobertos);
    }
    const envEff = disc.eff;
    const [bm, adAccount, pixel, pagina] = await Promise.all([
      checkBM(ctx, envEff),
      checkAdAccount(ctx, envEff),
      checkPixel(ctx, envEff),
      checkPage(ctx, envEff),
    ]);
    checks.push(bm, adAccount.conta, adAccount.pagamento, pixel.pixel, pixel.capi, pixel.dedup, checkDominio(), pagina);
    if (args.testarEscrita) checks.push(await checkEscrita(ctx, envEff));
    var eventos = pixel.eventos;
    if (args.publicos) {
      if (!ctx.actId && envEff.META_AD_ACCOUNT_ID) {
        ctx.actId = envEff.META_AD_ACCOUNT_ID.startsWith('act_') ? envEff.META_AD_ACCOUNT_ID : `act_${envEff.META_AD_ACCOUNT_ID}`;
      }
      var publicos = await auditarPublicos(ctx);
    }
  } else {
    checks.push(checkDominio());
  }

  const status = token.result.valor === true ? computeStatus(checks) : 'CRITICO';
  const hoje = new Date().toISOString().slice(0, 10);
  const report = {
    modo: 'api',
    graph_api_version: GRAPH_VERSION,
    ultima_checagem: hoje,
    checks,
    descobertas,
    eventos_recentes: typeof eventos !== 'undefined' ? eventos : null,
    status_geral: status,
    pendencias_manuais: checks.filter((c) => c.valor === null).map((c) => `${c.campo}: ${c.acao || c.detalhe}`),
    painel_yaml: toPainelYaml(checks, status, hoje),
  };
  // Opt-in: a chave só existe com --publicos, para não mexer na saída padrão.
  if (args.publicos && typeof publicos !== 'undefined') report.publicos = publicos;

  if (args.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else printHuman(report);

  process.exit(status === 'CRITICO' ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write(`Erro inesperado: ${e.message}\n`);
  process.exit(2);
});
