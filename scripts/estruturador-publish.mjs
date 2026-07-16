#!/usr/bin/env node
/**
 * scripts/estruturador-publish.mjs — Publicação de campanha Meta Ads (Squad de Tráfego).
 *
 * Materializa o "default sagrado" via Graph API com guardrails PROGRAMÁTICOS:
 * o script recusa configurações fora do padrão — não é aviso, é bloqueio.
 *
 *   node scripts/estruturador-publish.mjs --dry-run --plano=campanha.json
 *   node scripts/estruturador-publish.mjs --criar   --plano=campanha.json   # cria TUDO PAUSED
 *   node scripts/estruturador-publish.mjs --ativar  --campaign-id=X --confirmo-ativacao
 *   node scripts/estruturador-publish.mjs --pausar  --campaign-id=X         # kill-switch
 *   node scripts/estruturador-publish.mjs --status  --campaign-id=X
 *   node scripts/estruturador-publish.mjs --listar-publicos                 # inventário elegível (read-only)
 *
 * Alavancas do Diagnosticador (só após aprovação do aluno no Painel):
 *   --trocar-verba --adset-id=X --verba=<R$/dia> --confirmo-mudanca   # re-valida piso/teto
 *   --adicionar-criativo --adset-id=X --criativo=novo.json            # nasce PAUSED
 *   --pausar-anuncio --ad-id=X                                        # troca de criativo = novo PAUSED + pausar o antigo
 *
 * Segurança (não negociável):
 *   - Campanha/conjunto/anúncios nascem PAUSED. Ativar é um segundo passo com
 *     confirmação explícita (--confirmo-ativacao) e projeção de gasto na tela.
 *   - O plano só é aceito com `aprovado_pelo_aluno_em` preenchido — a decisão
 *     é humana e fica registrada (mais log em outputs/trafego/log-publicacoes.jsonl).
 *   - `periodo_dias` vira end_time real no conjunto: a campanha PARA sozinha.
 *   - Falha no meio da criação → rollback (deleta o que já foi criado).
 *
 * Formato do plano (JSON — a skill estruturador gera a partir do Painel):
 * {
 *   "nome": "[COHORT1]_[meu-projeto]_[2026-07-15]",
 *   "objetivo": "OUTCOME_SALES",              // ou OUTCOME_LEADS — nada além
 *   "evento_conversao": "PURCHASE",           // ou "LEAD"
 *   "verba_diaria_reais": 30,
 *   "periodo_dias": 7,
 *   "pais": "BR",
 *   "interesse_guarda_chuva": null,           // ou {"id":"6003...","name":"..."} (máx 1; PROIBIDO em morno/quente)
 *   "link_destino": "https://... (já com UTMs)",
 *   "cta": "LEARN_MORE",
 *   "pixel_id": null,                         // default: META_PIXEL_ID do .env
 *   "page_id": null,                          // default: META_FACEBOOK_PAGE_ID do .env
 *   "publico": {                              // OPCIONAL — ausente = frio = comportamento v1 idêntico
 *     "tipo": "quente",                        //   "frio" (default) | "morno" | "quente"
 *     "custom_audiences": [{"id":"...","name":"..."}],      // 1–3; obrigatório se tipo != frio
 *     "exclusoes": [{"id":"...","name":"Compradores 180d"}] // obrigatório se tipo == "quente"
 *   },
 *   "criativos": [                            // 2 a 3 finalistas do Briefista
 *     {"id":"hook-1","titulo":"...","copy":"...","image_hash":"..." },
 *     {"id":"hook-2","titulo":"...","copy":"...","image_path":"criativos/h2-feed.png"}
 *   ],
 *   "aprovado_pelo_aluno_em": "2026-07-15"    // preenchido SÓ após aprovação humana
 * }
 *
 * Temperatura do público (bloco `publico`) — regra do kit v2:
 *   - Ausente OU tipo:"frio" → default sagrado v1 intacto (amplo + Advantage+, advantage_audience:1,
 *     interesse guarda-chuva opcional). Targeting gerado é BYTE A BYTE o mesmo do v1.
 *   - tipo:"morno"/"quente" → hard audience: advantage_audience:0 (Advantage+ ligado trata o público
 *     como sugestão e expande, furando o retargeting), custom_audiences (1–3), excluded_custom_audiences
 *     (quente: >=1 obrigatório), SEM interesse guarda-chuva. Teto de verba cai para R$100/dia (público
 *     finito satura rápido). O NOME precisa carregar a temperatura ([morno]/[quente]) — o Leitor separa
 *     as réguas de frequência/CPM pelo nome. Cada público é validado AO VIVO (existe, entrega, tamanho)
 *     no --dry-run e no --criar, ANTES de criar qualquer coisa; inelegível é recusa, não aviso.
 *   Descubra os IDs elegíveis sem sair do fluxo: --listar-publicos (read-only, só GET).
 */

import { readFileSync, appendFileSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findEnvFile, loadEnv, buildCtx, graphGet, graphPost, graphDelete, graphGetAll, hint, resolveActId,
  GRAPH_VERSION,
} from './lib/meta-graph.mjs';
import {
  fetchPublicos, classificarPublico, avaliarElegibilidade, PUBLICOS_FIELDS,
} from './lib/publicos.mjs';

const OBJETIVOS_VALIDOS = { OUTCOME_SALES: 'PURCHASE', OUTCOME_LEADS: 'LEAD' };
const EVENTOS_VALIDOS = ['PURCHASE', 'LEAD'];
const PISO_DIARIO_REAIS = 20;
const TETO_DIARIO_REAIS = 200;   // frio: acima disso não é kit de validação — trave e converse
const TETO_DIARIO_MORNO_QUENTE_REAIS = 100;  // público finito satura rápido; teto menor que o frio
const MIN_CRIATIVOS = 2;
const MAX_CRIATIVOS = 3;
const TEMPERATURAS_VALIDAS = ['frio', 'morno', 'quente'];
const MIN_PUBLICOS = 1;
const MAX_PUBLICOS = 3;   // acumular público não amplia, dilui o sinal
const LOG_PATH = 'outputs/trafego/log-publicacoes.jsonl';

// Camada de hints local do Estruturador (não polui a lib compartilhada meta-graph.mjs).
// Categoria especial de anúncio (crédito, emprego, habitação, política/temas sociais): a Meta
// restringe segmentação e retargeting nessas contas — a criação do CONJUNTO com custom_audiences
// (morno/quente) é o ponto onde isso costuma estourar.
const HINT_CATEGORIA_ESPECIAL =
  'Conta em CATEGORIA ESPECIAL DE ANÚNCIO (crédito, emprego, habitação, política/temas sociais)? '
  + 'A Meta restringe segmentação e retargeting nessas contas — o conjunto com custom_audiences pode ser '
  + 'bloqueado. Confira a categoria em Configurações da conta; se for o caso, o kit frio (amplo) ainda funciona.';

function parseArgs(argv) {
  const out = {
    modo: null, plano: null, campaignId: null, adsetId: null, adId: null, criativo: null,
    verba: null, confirmoAtivacao: false, confirmoMudanca: false, json: false, envPath: null,
  };
  for (const a of argv) {
    if (['--dry-run', '--criar', '--ativar', '--pausar', '--status', '--trocar-verba', '--adicionar-criativo', '--pausar-anuncio', '--listar-publicos'].includes(a)) out.modo = a.slice(2);
    else if (a === '--confirmo-ativacao') out.confirmoAtivacao = true;
    else if (a === '--confirmo-mudanca') out.confirmoMudanca = true;
    else if (a === '--json') out.json = true;
    else if (a.startsWith('--plano=')) out.plano = a.slice('--plano='.length);
    else if (a.startsWith('--campaign-id=')) out.campaignId = a.slice('--campaign-id='.length);
    else if (a.startsWith('--adset-id=')) out.adsetId = a.slice('--adset-id='.length);
    else if (a.startsWith('--ad-id=')) out.adId = a.slice('--ad-id='.length);
    else if (a.startsWith('--criativo=')) out.criativo = a.slice('--criativo='.length);
    else if (a.startsWith('--verba=')) out.verba = Number(a.slice('--verba='.length));
    else if (a.startsWith('--env=')) out.envPath = a.slice('--env='.length);
  }
  return out;
}

function fail(msg, code = 2) {
  process.stderr.write(msg + '\n');
  process.exit(code);
}

function logAuditoria(evento) {
  try {
    mkdirSync(dirname(LOG_PATH), { recursive: true });
    appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...evento }) + '\n');
  } catch { /* log é best-effort, nunca bloqueia */ }
}

// ------------------------------------------------- validação do plano

export function validarPlano(plano, env) {
  const erros = [];
  const p = { periodo_dias: 7, pais: 'BR', cta: 'LEARN_MORE', ...plano };
  p.pixel_id = p.pixel_id || env.META_PIXEL_ID;
  p.page_id = p.page_id || env.META_FACEBOOK_PAGE_ID;

  // --- bloco `publico` (v2): ausente = frio = comportamento v1 idêntico.
  const publicoBruto = plano.publico;
  const publicoObj = publicoBruto && typeof publicoBruto === 'object' && !Array.isArray(publicoBruto) ? publicoBruto : {};
  const tipo = publicoObj.tipo || 'frio';
  const custom = Array.isArray(publicoObj.custom_audiences) ? publicoObj.custom_audiences : [];
  const exclusoes = Array.isArray(publicoObj.exclusoes) ? publicoObj.exclusoes : [];
  p.publico = { tipo, custom_audiences: custom, exclusoes };
  if (publicoBruto !== undefined && (typeof publicoBruto !== 'object' || publicoBruto === null || Array.isArray(publicoBruto))) {
    erros.push('publico deve ser um objeto {tipo, custom_audiences, exclusoes} ou estar ausente (= frio).');
  }
  if (!TEMPERATURAS_VALIDAS.includes(tipo)) {
    erros.push(`publico.tipo "${tipo}" inválido — use "frio" (default), "morno" ou "quente".`);
  }

  if (!p.nome || p.nome.length < 5) erros.push('nome ausente ou curto demais — use um nome rastreável, ex.: [COHORT1]_[slug]_[data]');
  if (!OBJETIVOS_VALIDOS[p.objetivo]) {
    erros.push(`objetivo "${p.objetivo}" inválido. Só ${Object.keys(OBJETIVOS_VALIDOS).join(' ou ')} — "Impulsionar"/engajamento NÃO existe neste squad (anti-erro nº1).`);
  }
  if (!EVENTOS_VALIDOS.includes(p.evento_conversao)) erros.push(`evento_conversao "${p.evento_conversao}" inválido (${EVENTOS_VALIDOS.join('|')}).`);
  if (p.objetivo && OBJETIVOS_VALIDOS[p.objetivo] && p.evento_conversao !== OBJETIVOS_VALIDOS[p.objetivo]) {
    erros.push(`objetivo ${p.objetivo} pede evento ${OBJETIVOS_VALIDOS[p.objetivo]}, não ${p.evento_conversao}.`);
  }
  const verba = Number(p.verba_diaria_reais);
  if (!Number.isFinite(verba) || verba < PISO_DIARIO_REAIS) {
    erros.push(`verba_diaria_reais R$${p.verba_diaria_reais} abaixo do piso de R$${PISO_DIARIO_REAIS}/dia — abaixo disso o teste não gera sinal, só gasta.`);
  }
  if (tipo === 'frio') {
    if (verba > TETO_DIARIO_REAIS) {
      erros.push(`verba_diaria_reais R$${verba} acima do teto de segurança de R$${TETO_DIARIO_REAIS}/dia do kit de validação — escala é conversa da Aula 4.`);
    }
  } else if (verba > TETO_DIARIO_MORNO_QUENTE_REAIS) {
    erros.push(`verba_diaria_reais R$${verba} acima do teto de R$${TETO_DIARIO_MORNO_QUENTE_REAIS}/dia para público ${tipo} — público de retargeting é finito e satura rápido; acima disso a frequência explode em dias, não em semanas.`);
  }
  const periodo = Number(p.periodo_dias);
  if (!Number.isFinite(periodo) || periodo < 3 || periodo > 14) erros.push('periodo_dias deve ficar entre 3 e 14 (default sagrado: 7).');
  if (p.interesse_guarda_chuva && !(p.interesse_guarda_chuva.id && p.interesse_guarda_chuva.name)) {
    erros.push('interesse_guarda_chuva deve ser null ou {id, name} — e no máximo UM.');
  }
  if (Array.isArray(p.interesse_guarda_chuva)) erros.push('apenas 1 interesse guarda-chuva — segmentar demais mata o aprendizado do algoritmo.');
  if (tipo !== 'frio' && p.interesse_guarda_chuva) {
    erros.push('interesse_guarda_chuva não vale em morno/quente — interesse em cima de retargeting só encolhe um público que já é pequeno; deixe interesse_guarda_chuva null.');
  }
  if (!p.link_destino || !/^https:\/\//.test(p.link_destino)) erros.push('link_destino ausente ou sem https.');
  if (!Array.isArray(p.criativos) || p.criativos.length < MIN_CRIATIVOS || p.criativos.length > MAX_CRIATIVOS) {
    erros.push(`criativos: exatamente ${MIN_CRIATIVOS}-${MAX_CRIATIVOS} finalistas curados pelo aluno (recebi ${p.criativos?.length ?? 0}).`);
  }
  for (const c of p.criativos || []) {
    if (!c.id || !c.copy) erros.push(`criativo "${c.id || '?'}": precisa de id e copy.`);
    if (!c.image_hash && !c.image_path) erros.push(`criativo "${c.id}": precisa de image_hash (via acf-upload.mjs) ou image_path.`);
  }
  if (!p.pixel_id) erros.push('pixel_id ausente (nem no plano, nem META_PIXEL_ID no .env).');
  if (!p.page_id) erros.push('page_id ausente (nem no plano, nem META_FACEBOOK_PAGE_ID no .env).');
  if (!p.aprovado_pelo_aluno_em) {
    erros.push('aprovado_pelo_aluno_em vazio — o plano só publica depois que o aluno aprovar a estrutura, e a aprovação fica registrada.');
  }

  // --- guardrails do bloco `publico` (1, 3, 4) + nome carregando a temperatura.
  if (tipo === 'frio') {
    if (custom.length) erros.push('custom_audiences só valem para "morno"/"quente" — o kit frio é amplo + Advantage+, não se "tempera" com público por fora. Remova custom_audiences ou defina publico.tipo.');
    if (exclusoes.length) erros.push('exclusoes só valem para "morno"/"quente" — no kit frio (amplo) não há retargeting a excluir.');
  } else {
    if (custom.length < MIN_PUBLICOS) {
      erros.push(`publico.tipo "${tipo}" exige custom_audiences (${MIN_PUBLICOS}–${MAX_PUBLICOS}) — retargeting sem público é frio disfarçado. Rode --listar-publicos e escolha os IDs.`);
    }
    if (custom.length > MAX_PUBLICOS) {
      erros.push(`custom_audiences: máximo ${MAX_PUBLICOS} incluídos (recebi ${custom.length}) — acumular público dilui o sinal, não amplia.`);
    }
    if (exclusoes.length > MAX_PUBLICOS) {
      erros.push(`exclusoes: máximo ${MAX_PUBLICOS} excluídos (recebi ${exclusoes.length}).`);
    }
    for (const a of custom) if (!a || !a.id || !a.name) erros.push(`custom_audiences: cada público precisa de {id, name} (recebi ${JSON.stringify(a)}).`);
    for (const a of exclusoes) if (!a || !a.id || !a.name) erros.push(`exclusoes: cada público precisa de {id, name} (recebi ${JSON.stringify(a)}).`);
    if (tipo === 'quente' && exclusoes.length < 1) {
      erros.push('publico.tipo "quente" exige exclusoes (ao menos os compradores) — pagar de novo por quem já comprou é o desperdício nº1 do remarketing.');
    }
    if (!String(p.nome || '').toLowerCase().includes(tipo)) {
      erros.push(`o nome da campanha precisa carregar a temperatura "[${tipo}]" (ex.: [COHORT1]_[slug]_[${tipo}]_[data]) — o Leitor separa as réguas de frequência/CPM pelo nome; sem isso, morno e quente se misturam na leitura.`);
    }
  }

  return { plano: p, erros };
}

// ------------------------------------------ targeting por temperatura

/**
 * Monta o objeto `targeting` do conjunto conforme a temperatura do público.
 *   frio  → amplo + Advantage+ (advantage_audience:1) + 1 interesse opcional — v1 INTACTO.
 *   morno/quente → hard audience: advantage_audience:0 (com Advantage+ ligado a Meta trata o
 *     público como sugestão e expande, furando o retargeting), custom_audiences (1–3) e
 *     excluded_custom_audiences (quente: >=1). Sem flexible_spec (interesse proibido).
 * Exportado para teste: a retrocompatibilidade do frio é asserida sobre este objeto.
 */
export function montarTargeting(p) {
  const targeting = {
    geo_locations: { countries: [p.pais] },
    targeting_automation: { advantage_audience: 1 },
  };
  const pub = p.publico && p.publico.tipo ? p.publico : { tipo: 'frio', custom_audiences: [], exclusoes: [] };
  if (pub.tipo === 'frio') {
    if (p.interesse_guarda_chuva) {
      targeting.flexible_spec = [{ interests: [{ id: p.interesse_guarda_chuva.id, name: p.interesse_guarda_chuva.name }] }];
    }
    return targeting;
  }
  targeting.targeting_automation.advantage_audience = 0;
  targeting.custom_audiences = pub.custom_audiences.map((a) => ({ id: a.id }));
  if (pub.exclusoes && pub.exclusoes.length) {
    targeting.excluded_custom_audiences = pub.exclusoes.map((a) => ({ id: a.id }));
  }
  return targeting;
}

/**
 * Validação AO VIVO de cada público (incluído + excluído) contra a Graph API.
 * `fetcher(audienceId)` devolve o envelope do graphGet: {ok:true, data} ou {ok:false, code, message}.
 * É injetável de propósito — os testes rodam sem rede. Aplica a MESMA elegibilidade da lib
 * (op/delivery 200, tamanho >= piso, bound 20 = oculto). Público inexistente/inelegível → erro
 * (recusa); lista/público velho > 90d entra como warning (impresso, não bloqueia). `hoje` injetável.
 * Retorna { erros: string[], warnings: string[] }.
 */
export async function validarPublicosAoVivo(publico, fetcher, hoje = new Date()) {
  const erros = [];
  const warnings = [];
  if (!publico || publico.tipo === 'frio') return { erros, warnings };
  const alvos = [
    ...(publico.custom_audiences || []).map((a) => ({ ...a, papel: 'incluído' })),
    ...(publico.exclusoes || []).map((a) => ({ ...a, papel: 'excluído' })),
  ];
  for (const a of alvos) {
    const r = await fetcher(a.id);
    if (!r || !r.ok) {
      const cod = r && r.code ? ` (código ${r.code})` : '';
      erros.push(`público ${a.papel} "${a.name || a.id}" (${a.id}): não existe nesta conta ou está inacessível${cod}. Confira o ID com --listar-publicos.`);
      continue;
    }
    const eleg = avaliarElegibilidade(r.data, hoje);
    if (eleg.elegivel) continue;
    const nome = r.data?.name || a.name || a.id;
    if (eleg.tipo_alerta === 'envelhecimento' || eleg.tipo_alerta === 'frescor') {
      warnings.push(`público ${a.papel} "${nome}" (${a.id}): ${eleg.motivo} — segue elegível, mas renove antes de escalar.`);
    } else {
      erros.push(`público ${a.papel} "${nome}" (${a.id}): ${eleg.motivo}`);
    }
  }
  return { erros, warnings };
}

// ------------------------------------------------------ upload imagem

async function uploadImagem(path, ctx) {
  const bytes = readFileSync(path);
  const form = new FormData();
  form.set(basename(path), new Blob([bytes]), basename(path));
  const r = await graphPost(`${ctx.actId}/adimages`, form, ctx);
  if (!r.ok) return r;
  const images = r.data.images || {};
  const first = Object.values(images)[0];
  return first?.hash ? { ok: true, hash: first.hash } : { ok: false, code: '?', message: 'resposta sem hash' };
}

// ---------------------------------------------- pré-flight de escrita

/**
 * Testa se a conta aceita ESCRITA deste app criando (e apagando) um ad label —
 * metadado invisível, sem efeito em entrega. Pega o bloqueio clássico de app
 * sem Marketing API habilitada ANTES de tentar montar a campanha.
 */
async function preflightEscrita(ctx) {
  const r = await graphPost(`${ctx.actId}/adlabels`, { name: 'squad-trafego-preflight' }, ctx);
  if (!r.ok) {
    process.stderr.write(`\nESCRITA BLOQUEADA nesta conta (código ${r.code}): ${r.message || 'erro genérico'}\n`);
    process.stderr.write(`→ ${hint(r.code, 'Verifique as permissões do app.')}\n\n`);
    process.stderr.write('Enquanto isso, use o caminho manual: a skill estruturador te entrega a configuração\ncampo a campo para replicar no Gerenciador de Anúncios (leitura via API continua funcionando).\n');
    process.exit(4);
  }
  await graphDelete(r.data.id, {}, ctx);
}

// ------------------------------------------------------------- criar

async function criar(plano, ctx, dryRun) {
  const { plano: p, erros } = validarPlano(plano, ctx.env);
  if (erros.length) {
    process.stderr.write('Plano RECUSADO pelos guardrails do default sagrado:\n');
    for (const e of erros) process.stderr.write(` ✖ ${e}\n`);
    process.exit(1);
  }
  const verbaCentavos = Math.round(Number(p.verba_diaria_reais) * 100);
  const gastoMax = (Number(p.verba_diaria_reais) * Number(p.periodo_dias)).toFixed(2);
  const endTime = new Date(Date.now() + Number(p.periodo_dias) * 86_400_000).toISOString();

  process.stdout.write(`\nPlano validado — "${p.nome}"\n`);
  process.stdout.write(`  ${p.objetivo} / ${p.evento_conversao} · R$${p.verba_diaria_reais}/dia × ${p.periodo_dias} dias (teto total ~R$${gastoMax}, com fim automático)\n`);
  if (p.publico.tipo === 'frio') {
    process.stdout.write(`  Público: amplo/frio Advantage+ (${p.pais})${p.interesse_guarda_chuva ? ` + 1 interesse: ${p.interesse_guarda_chuva.name}` : ''}\n`);
  } else {
    const inc = p.publico.custom_audiences.map((a) => a.name).join(', ');
    const exc = p.publico.exclusoes.map((a) => a.name).join(', ');
    process.stdout.write(`  Público: ${p.publico.tipo.toUpperCase()} — hard audience (advantage_audience:0, ${p.pais}) · inclui: ${inc}${exc ? ` · exclui: ${exc}` : ''}\n`);
  }
  process.stdout.write(`  ${p.criativos.length} criativos · pixel ${p.pixel_id} · página ${p.page_id}\n`);
  process.stdout.write(`  Aprovado pelo aluno em: ${p.aprovado_pelo_aluno_em}\n\n`);

  // Validação AO VIVO dos públicos (morno/quente) ANTES de qualquer escrita — no --dry-run e no --criar.
  // Frio não toca a rede: validarPublicosAoVivo retorna de imediato.
  if (p.publico.tipo !== 'frio') {
    const fetcher = (id) => graphGet(id, { fields: PUBLICOS_FIELDS }, ctx);
    const { erros: errosPub, warnings } = await validarPublicosAoVivo(p.publico, fetcher);
    for (const w of warnings) process.stdout.write(` △ ${w}\n`);
    if (errosPub.length) {
      process.stderr.write('\nPúblicos RECUSADOS na validação ao vivo (nada foi criado):\n');
      for (const e of errosPub) process.stderr.write(` ✖ ${e}\n`);
      process.exit(1);
    }
    process.stdout.write(` ✔ ${p.publico.custom_audiences.length + p.publico.exclusoes.length} público(s) validado(s) ao vivo — existem, entregam e têm tamanho suficiente\n`);
  }

  await preflightEscrita(ctx);
  process.stdout.write(' ✔ pré-flight de escrita passou (o app pode publicar nesta conta)\n');

  if (dryRun) {
    // validate_only é best-effort: a Meta às vezes responde erro genérico (código 1)
    const v = await graphPost(`${ctx.actId}/campaigns`, {
      name: p.nome, objective: p.objetivo, status: 'PAUSED',
      special_ad_categories: [], is_adset_budget_sharing_enabled: false,
      execution_options: ['validate_only'],
    }, ctx);
    if (v.ok || v.code === 1) {
      process.stdout.write(`DRY-RUN OK — guardrails locais passaram${v.ok ? ' e a Meta validou os parâmetros da campanha' : ' (validação remota indisponível — normal)'}. Nada foi criado.\n`);
    } else {
      process.stdout.write(`DRY-RUN: a Meta recusou os parâmetros: ${v.message}\n→ ${hint(v.code, 'Ajuste o plano e rode de novo.')}\n`);
      process.exit(1);
    }
    return;
  }

  const criados = { campaign_id: null, adset_id: null, creative_ids: [], ad_ids: [] };
  const rollback = async (motivo) => {
    process.stderr.write(`\nFalha: ${motivo}\nExecutando rollback...\n`);
    for (const cid of criados.creative_ids) await graphDelete(cid, {}, ctx);
    if (criados.campaign_id) await graphDelete(criados.campaign_id, {}, ctx);
    logAuditoria({ acao: 'rollback', motivo, criados });
    process.stderr.write('Rollback concluído — nada ficou na conta.\n');
    process.exit(1);
  };

  // 1. Campanha (PAUSED)
  let r = await graphPost(`${ctx.actId}/campaigns`, {
    name: p.nome, objective: p.objetivo, status: 'PAUSED',
    special_ad_categories: [], is_adset_budget_sharing_enabled: false, buying_type: 'AUCTION',
  }, ctx);
  if (!r.ok) await rollback(`campanha: ${r.message} → ${hint(r.code, '')}`);
  criados.campaign_id = r.data.id;
  process.stdout.write(` ✔ campanha criada (PAUSED): ${criados.campaign_id}\n`);

  // 2. Conjunto (PAUSED, com fim automático). Targeting por temperatura (frio = v1 intacto).
  const targeting = montarTargeting(p);
  r = await graphPost(`${ctx.actId}/adsets`, {
    name: `${p.nome} — conjunto único`, campaign_id: criados.campaign_id, status: 'PAUSED',
    daily_budget: verbaCentavos, billing_event: 'IMPRESSIONS',
    optimization_goal: 'OFFSITE_CONVERSIONS', bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    promoted_object: { pixel_id: p.pixel_id, custom_event_type: p.evento_conversao },
    targeting, end_time: endTime,
  }, ctx);
  if (!r.ok) {
    // Custom audiences num conjunto podem estourar em conta de categoria especial de anúncio.
    const extra = p.publico.tipo !== 'frio' ? `\n   ${HINT_CATEGORIA_ESPECIAL}` : '';
    await rollback(`conjunto: ${r.message} → ${hint(r.code, '')}${extra}`);
  }
  criados.adset_id = r.data.id;
  process.stdout.write(` ✔ conjunto criado (PAUSED, fim automático em ${endTime.slice(0, 10)}): ${criados.adset_id}\n`);

  // 3+4. Criativos e anúncios (PAUSED)
  for (const c of p.criativos) {
    let imageHash = c.image_hash;
    if (!imageHash) {
      const up = await uploadImagem(c.image_path, ctx);
      if (!up.ok) await rollback(`upload da imagem de "${c.id}": ${up.message}`);
      imageHash = up.hash;
      process.stdout.write(` ✔ imagem de "${c.id}" enviada (hash ${imageHash.slice(0, 10)}…)\n`);
    }
    r = await graphPost(`${ctx.actId}/adcreatives`, {
      name: `${p.nome} — ${c.id}`,
      object_story_spec: {
        page_id: p.page_id,
        link_data: {
          link: p.link_destino, message: c.copy, ...(c.titulo ? { name: c.titulo } : {}),
          image_hash: imageHash, call_to_action: { type: p.cta, value: { link: p.link_destino } },
        },
      },
    }, ctx);
    if (!r.ok) await rollback(`criativo "${c.id}": ${r.message} → ${hint(r.code, '')}`);
    criados.creative_ids.push(r.data.id);

    r = await graphPost(`${ctx.actId}/ads`, {
      name: `${p.nome} — ${c.id}`, adset_id: criados.adset_id,
      creative: { creative_id: criados.creative_ids.at(-1) }, status: 'PAUSED',
    }, ctx);
    if (!r.ok) await rollback(`anúncio "${c.id}": ${r.message} → ${hint(r.code, '')}`);
    criados.ad_ids.push(r.data.id);
    process.stdout.write(` ✔ anúncio "${c.id}" criado (PAUSED): ${criados.ad_ids.at(-1)}\n`);
  }

  logAuditoria({ acao: 'criar', plano_nome: p.nome, aprovado_pelo_aluno_em: p.aprovado_pelo_aluno_em, ...criados });
  const linkGerenciador = `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${ctx.actId.replace('act_', '')}&selected_campaign_ids=${criados.campaign_id}`;
  process.stdout.write(`\nTUDO CRIADO EM PAUSED — nada está gastando.\n`);
  process.stdout.write(`Revise no gerenciador: ${linkGerenciador}\n`);
  process.stdout.write(`Para ativar (após revisão do aluno):\n  node scripts/estruturador-publish.mjs --ativar --campaign-id=${criados.campaign_id} --confirmo-ativacao\n\n`);
  const fmtPublicos = (arr) => `[${arr.map((a) => `{id: "${a.id}", name: ${JSON.stringify(a.name)}}`).join(', ')}]`;
  const publicoLinhas = [`  publico_tipo: "${p.publico.tipo}"`];
  if (p.publico.tipo !== 'frio') {
    publicoLinhas.push(`  custom_audiences: ${fmtPublicos(p.publico.custom_audiences)}`);
    publicoLinhas.push(`  exclusoes: ${fmtPublicos(p.publico.exclusoes)}`);
  }
  process.stdout.write(`Bloco para o PAINEL-DA-SEMANA.yaml:\n\nestruturador:\n  montado_em: "${new Date().toISOString().slice(0, 10)}"\n  publicada_via: "api"\n  campaign_id: "${criados.campaign_id}"\n  adset_id: "${criados.adset_id}"\n  ad_ids: ${JSON.stringify(criados.ad_ids)}\n${publicoLinhas.join('\n')}\n  verba_diaria: ${p.verba_diaria_reais}\n  periodo_dias: ${p.periodo_dias}\n  fim_automatico: "${endTime.slice(0, 10)}"\n  status: "criada_pausada"\n  aprovada_pelo_aluno_em: "${p.aprovado_pelo_aluno_em}"\n  ativada_em: ""\n`);
}

// --------------------------------------------------- ativar / pausar

async function mudarStatus(campaignId, novoStatus, ctx) {
  const filhos = await graphGetAll(`${campaignId}/adsets`, { fields: 'id' }, ctx);
  const ads = await graphGetAll(`${campaignId}/ads`, { fields: 'id' }, ctx);
  const alvos = [campaignId, ...(filhos.ok ? filhos.data.map((x) => x.id) : []), ...(ads.ok ? ads.data.map((x) => x.id) : [])];
  for (const id of alvos) {
    const r = await graphPost(id, { status: novoStatus }, ctx);
    if (!r.ok) fail(`Falha ao mudar ${id} para ${novoStatus}: ${r.message}\n→ ${hint(r.code, '')}`, 1);
  }
  return alvos.length;
}

async function ativar(campaignId, confirmo, ctx) {
  const info = await graphGet(campaignId, { fields: 'name,status,objective' }, ctx);
  if (!info.ok) fail(`Campanha inacessível: ${info.message}`, 1);
  const adsets = await graphGetAll(`${campaignId}/adsets`, { fields: 'daily_budget,end_time' }, ctx);
  const verba = adsets.ok && adsets.data[0] ? Number(adsets.data[0].daily_budget) / 100 : null;
  const fim = adsets.ok && adsets.data[0]?.end_time ? adsets.data[0].end_time.slice(0, 10) : 'sem fim automático';

  process.stdout.write(`\nATIVAÇÃO — "${info.data.name}" (${info.data.objective})\n`);
  process.stdout.write(`  Verba: ${verba ? `R$${verba}/dia` : 'desconhecida'} · fim automático: ${fim}\n`);
  process.stdout.write(`  A partir da ativação a campanha GASTA DINHEIRO REAL e entra em revisão da Meta.\n\n`);
  if (!confirmo) {
    fail('Ativação NÃO executada: exige a flag --confirmo-ativacao (registro de decisão humana).\nRegra do squad: 7 dias sem mexer após ativar, salvo circuit-breaker.', 1);
  }
  const n = await mudarStatus(campaignId, 'ACTIVE', ctx);
  logAuditoria({ acao: 'ativar', campaign_id: campaignId, objetos: n });
  process.stdout.write(`✔ ${n} objetos ativados. Acompanhe a revisão: node scripts/estruturador-publish.mjs --status --campaign-id=${campaignId}\n`);
  process.stdout.write(`Registre no Painel: estruturador.ativada_em: "${new Date().toISOString().slice(0, 10)}" e status: "ativa"\n`);
}

async function pausar(campaignId, ctx) {
  const r = await graphPost(campaignId, { status: 'PAUSED' }, ctx);
  if (!r.ok) fail(`Falha ao pausar: ${r.message}\n→ ${hint(r.code, '')}`, 1);
  logAuditoria({ acao: 'pausar', campaign_id: campaignId });
  process.stdout.write(`✔ Campanha ${campaignId} PAUSADA (kill-switch — pausa no nível da campanha para a entrega toda).\n`);
}

// ------------------------------------- alavancas do Diagnosticador

async function trocarVerba(adsetId, verba, confirmo, ctx) {
  if (!Number.isFinite(verba)) fail('--trocar-verba exige --verba=<R$/dia>');
  if (verba < PISO_DIARIO_REAIS) fail(`R$${verba}/dia abaixo do piso de R$${PISO_DIARIO_REAIS} — guardrail do default sagrado, não negociável.`, 1);
  if (verba > TETO_DIARIO_REAIS) fail(`R$${verba}/dia acima do teto de R$${TETO_DIARIO_REAIS} do kit de validação — escala é conversa da Aula 4.`, 1);
  const atual = await graphGet(adsetId, { fields: 'name,daily_budget,effective_status' }, ctx);
  if (!atual.ok) fail(`Conjunto inacessível: ${atual.message}`, 1);
  const de = Number(atual.data.daily_budget) / 100;
  process.stdout.write(`\nMudança de verba — "${atual.data.name}" (${atual.data.effective_status})\n  R$${de}/dia → R$${verba}/dia\n`);
  if (!confirmo) {
    fail('\nNÃO executado: exige --confirmo-mudanca (decisão do aluno registrada no Painel via diagnosticador.aprovado_pelo_aluno).\nLembre: mexer em verba reseta parte do aprendizado do algoritmo.', 1);
  }
  const r = await graphPost(adsetId, { daily_budget: Math.round(verba * 100) }, ctx);
  if (!r.ok) fail(`Falha: ${r.message}\n→ ${hint(r.code, '')}`, 1);
  logAuditoria({ acao: 'trocar-verba', adset_id: adsetId, de, para: verba });
  process.stdout.write(`✔ Verba alterada para R$${verba}/dia.\n`);
}

async function adicionarCriativo(adsetId, criativoPath, ctx) {
  let c;
  try { c = JSON.parse(readFileSync(criativoPath, 'utf8')); }
  catch (e) { fail(`Não consegui ler ${criativoPath}: ${e.message}`); }
  const erros = [];
  if (!c.id || !c.copy) erros.push('criativo precisa de id e copy');
  if (!c.image_hash && !c.image_path) erros.push('criativo precisa de image_hash ou image_path');
  if (!c.link_destino || !/^https:\/\//.test(c.link_destino)) erros.push('link_destino ausente ou sem https');
  const pageId = c.page_id || ctx.env.META_FACEBOOK_PAGE_ID;
  if (!pageId) erros.push('page_id ausente (criativo ou .env)');
  if (erros.length) fail('Criativo recusado:\n' + erros.map((e) => ` ✖ ${e}`).join('\n'), 1);

  const adset = await graphGet(adsetId, { fields: 'name,campaign_id' }, ctx);
  if (!adset.ok) fail(`Conjunto inacessível: ${adset.message}`, 1);
  const nAds = await graphGetAll(`${adsetId}/ads`, { fields: 'effective_status' }, ctx);
  const ativosOuPausados = nAds.ok ? nAds.data.filter((a) => a.effective_status !== 'DELETED').length : 0;
  if (ativosOuPausados >= MAX_CRIATIVOS + 1) {
    fail(`Conjunto já tem ${ativosOuPausados} anúncios — troca de criativo é 1 entra / 1 sai (pause o antigo com --pausar-anuncio). Não acumule.`, 1);
  }

  let imageHash = c.image_hash;
  if (!imageHash) {
    const up = await uploadImagem(c.image_path, ctx);
    if (!up.ok) fail(`Upload falhou: ${up.message}`, 1);
    imageHash = up.hash;
  }
  let r = await graphPost(`${ctx.actId}/adcreatives`, {
    name: `${adset.data.name} — ${c.id}`,
    object_story_spec: {
      page_id: pageId,
      link_data: {
        link: c.link_destino, message: c.copy, ...(c.titulo ? { name: c.titulo } : {}),
        image_hash: imageHash, call_to_action: { type: c.cta || 'LEARN_MORE', value: { link: c.link_destino } },
      },
    },
  }, ctx);
  if (!r.ok) fail(`Criativo: ${r.message}\n→ ${hint(r.code, '')}`, 1);
  const creativeId = r.data.id;
  r = await graphPost(`${ctx.actId}/ads`, {
    name: `${adset.data.name} — ${c.id}`, adset_id: adsetId,
    creative: { creative_id: creativeId }, status: 'PAUSED',
  }, ctx);
  if (!r.ok) { await graphDelete(creativeId, {}, ctx); fail(`Anúncio: ${r.message}\n→ ${hint(r.code, '')}`, 1); }
  logAuditoria({ acao: 'adicionar-criativo', adset_id: adsetId, ad_id: r.data.id, criativo: c.id });
  process.stdout.write(`✔ Anúncio "${c.id}" criado PAUSED (${r.data.id}) no conjunto ${adsetId}.\n`);
  process.stdout.write(`Troca completa = pausar o anúncio antigo: --pausar-anuncio --ad-id=<antigo>\nDepois ative o novo: o aluno ativa no gerenciador, ou --ativar re-liga a campanha toda.\n`);
}

async function pausarAnuncio(adId, ctx) {
  const r = await graphPost(adId, { status: 'PAUSED' }, ctx);
  if (!r.ok) fail(`Falha ao pausar anúncio: ${r.message}\n→ ${hint(r.code, '')}`, 1);
  logAuditoria({ acao: 'pausar-anuncio', ad_id: adId });
  process.stdout.write(`✔ Anúncio ${adId} PAUSADO.\n`);
}

// -------------------------------------------------------------- status

async function status(campaignId, ctx, json) {
  const c = await graphGet(campaignId, { fields: 'name,status,effective_status,objective,created_time' }, ctx);
  if (!c.ok) fail(`Campanha inacessível: ${c.message}`, 1);
  const adsets = await graphGetAll(`${campaignId}/adsets`, { fields: 'id,name,effective_status,daily_budget,end_time' }, ctx);
  const ads = await graphGetAll(`${campaignId}/ads`, { fields: 'id,name,effective_status,ad_review_feedback' }, ctx);
  const rep = {
    campanha: c.data,
    conjuntos: adsets.ok ? adsets.data : [],
    anuncios: ads.ok ? ads.data.map((a) => ({
      id: a.id, name: a.name, effective_status: a.effective_status,
      revisao: a.ad_review_feedback?.global || null,
    })) : [],
  };
  if (json) { process.stdout.write(JSON.stringify(rep, null, 2) + '\n'); return; }
  process.stdout.write(`\n"${rep.campanha.name}" — ${rep.campanha.effective_status} (${rep.campanha.objective})\n`);
  for (const s of rep.conjuntos) process.stdout.write(`  conjunto ${s.effective_status} · R$${Number(s.daily_budget) / 100}/dia · fim ${s.end_time ? s.end_time.slice(0, 10) : '—'}\n`);
  for (const a of rep.anuncios) {
    process.stdout.write(`  anúncio "${a.name}" — ${a.effective_status}${a.revisao ? ` · revisão: ${JSON.stringify(a.revisao)}` : ''}\n`);
  }
  process.stdout.write('\nLegenda: PENDING_REVIEW = em análise da Meta (normal após ativar); WITH_ISSUES/DISAPPROVED = reprovado, veja a revisão.\n');
}

// ------------------------------------------------ listar-publicos

/**
 * Inventário read-only dos públicos ELEGÍVEIS para morno/quente (só GET). Reusa
 * fetchPublicos + classificar/elegibilidade da lib. Imprime só os elegíveis,
 * ordenados por tamanho desc, no máx 20 linhas, com id/nome/temperatura/tamanho
 * aproximado (min–max), e uma linha final contando os inelegíveis/fora de escopo.
 * Não exige --plano. Contagens são sempre aproximadas (bounds da Meta).
 */
async function listarPublicos(ctx) {
  const r = await fetchPublicos(ctx);
  if (!r.ok) {
    fail(`Não consegui listar públicos: ${r.message || 'erro'}${r.code ? ` (código ${r.code})` : ''}\n→ ${hint(r.code, 'Confira META_ACCESS_TOKEN e META_AD_ACCOUNT_ID no .env.')}`, 1);
  }
  const hoje = new Date();
  const analisados = r.data.map((a) => {
    const cls = classificarPublico(a);
    const eleg = avaliarElegibilidade(a, hoje);
    return {
      id: a.id, nome: a.name, temperatura: cls.temperatura,
      min: typeof a.approximate_count_lower_bound === 'number' ? a.approximate_count_lower_bound : null,
      max: typeof a.approximate_count_upper_bound === 'number' ? a.approximate_count_upper_bound : null,
      elegivel: eleg.elegivel,
    };
  });
  const elegiveis = analisados
    .filter((a) => a.elegivel && (a.temperatura === 'morno' || a.temperatura === 'quente'))
    .sort((a, b) => (b.min || 0) - (a.min || 0));
  const inelegiveis = analisados.length - elegiveis.length;
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('pt-BR') : '?');
  process.stdout.write(`\nPúblicos ELEGÍVEIS para morno/quente — fonte: API ${GRAPH_VERSION} (contagens aproximadas, bounds da Meta)\n\n`);
  if (!elegiveis.length) {
    process.stdout.write('Nenhum público elegível. Diagnóstico completo dos inelegíveis: node scripts/zelador-audit.mjs --publicos\n');
  } else {
    for (const a of elegiveis.slice(0, 20)) {
      process.stdout.write(` ${a.id}  [${a.temperatura}]  ~${fmt(a.min)}–${fmt(a.max)}  ${JSON.stringify(a.nome)}\n`);
    }
    if (elegiveis.length > 20) process.stdout.write(`  # +${elegiveis.length - 20} elegíveis além do top 20 (ordenados por tamanho)\n`);
  }
  process.stdout.write(`\nTotal na conta: ${analisados.length} · elegíveis morno/quente: ${elegiveis.length} · inelegíveis/fora de escopo: ${inelegiveis}\n`);
  process.stdout.write('Cole os IDs no bloco "publico" do campanha.json. Diagnóstico dos inelegíveis: node scripts/zelador-audit.mjs --publicos\n');
}

// -------------------------------------------------------------- main

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.modo) {
    fail('Uso: --dry-run|--criar --plano=campanha.json  |  --ativar|--pausar|--status --campaign-id=X\n(--ativar exige --confirmo-ativacao)');
  }
  const envPath = findEnvFile(args.envPath, dirname(fileURLToPath(import.meta.url)));
  if (!envPath) fail('.env não encontrado — a publicação via API exige credenciais (guia da Aula 3).');
  const env = loadEnv(envPath);
  if (!env.META_ACCESS_TOKEN) fail('META_ACCESS_TOKEN ausente no .env.');
  const ctx = buildCtx(env);
  if (!ctx.actId) fail('META_AD_ACCOUNT_ID ausente no .env.');
  const res = await resolveActId(ctx);
  if (res.ok && res.mudou) {
    process.stdout.write(`Aviso: META_AD_ACCOUNT_ID do .env é um ID antigo — usando o canônico ${ctx.actId}. Atualize o .env para ${ctx.actId.replace('act_', '')}.\n`);
  }

  if (args.modo === 'listar-publicos') return listarPublicos(ctx);

  if (args.modo === 'dry-run' || args.modo === 'criar') {
    if (!args.plano) fail(`--${args.modo} exige --plano=campanha.json`);
    let plano;
    try { plano = JSON.parse(readFileSync(args.plano, 'utf8')); }
    catch (e) { fail(`Não consegui ler o plano ${args.plano}: ${e.message}`); }
    await criar(plano, ctx, args.modo === 'dry-run');
    return;
  }
  if (args.modo === 'trocar-verba') {
    if (!args.adsetId) fail('--trocar-verba exige --adset-id=<id>');
    return trocarVerba(args.adsetId, args.verba, args.confirmoMudanca, ctx);
  }
  if (args.modo === 'adicionar-criativo') {
    if (!args.adsetId || !args.criativo) fail('--adicionar-criativo exige --adset-id=<id> e --criativo=arquivo.json');
    return adicionarCriativo(args.adsetId, args.criativo, ctx);
  }
  if (args.modo === 'pausar-anuncio') {
    if (!args.adId) fail('--pausar-anuncio exige --ad-id=<id>');
    return pausarAnuncio(args.adId, ctx);
  }
  if (!args.campaignId) fail(`--${args.modo} exige --campaign-id=<id>`);
  if (args.modo === 'ativar') return ativar(args.campaignId, args.confirmoAtivacao, ctx);
  if (args.modo === 'pausar') return pausar(args.campaignId, ctx);
  if (args.modo === 'status') return status(args.campaignId, ctx, args.json);
}

// Só roda o CLI quando executado direto (node estruturador-publish.mjs ...), nunca no import
// dos testes — que reutilizam validarPlano/montarTargeting/validarPublicosAoVivo sem tocar a rede.
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
