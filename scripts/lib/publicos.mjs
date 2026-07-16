/**
 * scripts/lib/publicos.mjs — inventário e classificação de públicos personalizados.
 *
 * Base compartilhada do check `--publicos` do Zelador (Fase A do
 * plans/estruturador-funil-publicos-v2.md). A regra de elegibilidade é a MESMA
 * que o Estruturador v2 reusa na 19.W2.1 — por isso mora aqui, em funções puras
 * e testáveis sem rede. Só a busca (`fetchPublicos`) toca a Graph API, via
 * graphGetAll (read-only, apenas GET). Zero dependências: Node >= 18.
 *
 * Contagens da Meta são sempre APROXIMADAS (bounds). Dois placeholders conhecidos:
 * lower_bound == 20 (a Meta esconde a contagem de público pequeno) e o piso 1.000.
 * Nunca reportamos contagem como exata.
 */

import { graphGetAll } from './meta-graph.mjs';

export const PISO_TAMANHO = 1000;        // lower bound mínimo para entrega saudável
export const DIAS_FRESCOR = 90;          // além disto, público/lista é considerado velho
export const BOUND_OCULTO = 20;          // placeholder da Meta para público pequeno/oculto

// Campos pedidos ao endpoint — o mesmo shape que a classificação e a elegibilidade esperam.
export const PUBLICOS_FIELDS =
  'id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,operation_status,time_updated';

// Sinais no NOME que indicam fundo de funil (o endpoint não devolve a `rule`,
// então a distinção topo/fundo do WEBSITE sai do nome do público).
const SINAIS_FUNDO = [
  'initiatecheckout', 'initiate checkout', 'checkout', 'finalizar compra',
  'addtocart', 'add to cart', 'adicionar ao carrinho', 'addpaymentinfo',
];

/**
 * Classifica um público por temperatura, segundo a matriz do plano:
 *   ENGAGEMENT e WEBSITE-topo (PageView/visitantes) → morno
 *   WEBSITE-fundo (InitiateCheckout/checkout) e CUSTOM (listas) → quente
 *   LOOKALIKE → nao_aplicavel (expansão de frio, fora do escopo v2)
 * Outros subtypes ficam como nao_aplicavel (não inventamos temperatura).
 */
export function classificarPublico(audience) {
  const subtype = String(audience?.subtype || '').toUpperCase();
  const nome = String(audience?.name || '').toLowerCase();

  if (subtype === 'LOOKALIKE') {
    return { temperatura: 'nao_aplicavel', subtype, motivo: 'LOOKALIKE — expansão de frio, fora do escopo v2' };
  }
  if (subtype === 'ENGAGEMENT' || subtype === 'VIDEO') {
    return { temperatura: 'morno', subtype, motivo: 'engajamento (vídeo/página/IG) — topo de funil' };
  }
  if (subtype === 'WEBSITE') {
    const fundo = SINAIS_FUNDO.some((s) => nome.includes(s));
    return fundo
      ? { temperatura: 'quente', subtype, posicao_funil: 'fundo', motivo: 'WEBSITE fundo (checkout/InitiateCheckout)' }
      : { temperatura: 'morno', subtype, posicao_funil: 'topo', motivo: 'WEBSITE topo (visitantes/PageView)' };
  }
  if (subtype === 'CUSTOM') {
    return { temperatura: 'quente', subtype, motivo: 'lista (CSV/clientes) — quente' };
  }
  return { temperatura: 'nao_aplicavel', subtype, motivo: `subtype ${subtype || 'desconhecido'} fora do escopo v2` };
}

/** 'YYYY-MM-DD' a partir de time_updated (epoch em segundos), ou null. */
export function dataAtualizacao(audience) {
  const tu = audience?.time_updated;
  if (typeof tu !== 'number' || !Number.isFinite(tu)) return null;
  return new Date(tu * 1000).toISOString().slice(0, 10);
}

/**
 * Avalia elegibilidade para uso em campanha. Exige TUDO:
 *   operation_status.code == 200 E delivery_status.code == 200 E
 *   approximate_count_lower_bound >= 1.000 E time_updated <= 90 dias.
 * Retorna { elegivel, motivo } — motivo é null quando elegível. O primeiro
 * bloqueio na ordem (operação → entrega → contagem → frescor) vira o motivo,
 * com mensagem pedagógica. `hoje` é injetável (Date) para testar sem relógio.
 */
export function avaliarElegibilidade(audience, hoje = new Date()) {
  const opCode = audience?.operation_status?.code;
  const delCode = audience?.delivery_status?.code;
  const lower = audience?.approximate_count_lower_bound;
  const tu = audience?.time_updated;
  const subtype = String(audience?.subtype || '').toUpperCase();

  if (opCode !== 200) {
    const desc = audience?.operation_status?.description;
    return { elegivel: false, motivo: `operation_status ${opCode ?? 'desconhecido'}${desc ? ` (${desc})` : ''}` };
  }
  if (delCode !== 200) {
    const desc = audience?.delivery_status?.description;
    return { elegivel: false, motivo: `delivery_status ${delCode ?? 'desconhecido'}${desc ? ` (${desc})` : ''}` };
  }
  if (lower === BOUND_OCULTO) {
    return {
      elegivel: false,
      motivo: 'contagem oculta pela Meta (público pequeno) — bound 20; entrega tende a estagnar',
    };
  }
  if (typeof lower !== 'number' || lower < PISO_TAMANHO) {
    const aprox = typeof lower === 'number' ? lower : 0;
    return {
      elegivel: false,
      motivo: `tamanho abaixo do piso (~${PISO_TAMANHO.toLocaleString('pt-BR')}): ~${aprox.toLocaleString('pt-BR')} (aprox.)`,
    };
  }
  if (typeof tu === 'number' && Number.isFinite(tu)) {
    const idadeDias = Math.floor((hoje.getTime() - tu * 1000) / 86_400_000);
    if (idadeDias > DIAS_FRESCOR) {
      const dataStr = dataAtualizacao(audience);
      const ehLista = subtype === 'CUSTOM';
      return {
        elegivel: false,
        tipo_alerta: ehLista ? 'envelhecimento' : 'frescor',
        motivo: ehLista
          ? `lista CSV desatualizada há ${idadeDias} dias (última atualização: ${dataStr}) — reenvie a lista antes de usar`
          : `público desatualizado há ${idadeDias} dias (última atualização: ${dataStr})`,
      };
    }
  }
  return { elegivel: true, motivo: null };
}

/**
 * Busca paginada dos públicos da conta (read-only). Devolve o mesmo envelope
 * do graphGetAll: { ok: true, data: [...] } ou { ok: false, code, message }.
 * A conta real tem ~331 públicos — limit alto + várias páginas cobrem com folga.
 */
export async function fetchPublicos(ctx, maxPages = 40) {
  if (!ctx?.actId) {
    return { ok: false, code: 'config', message: 'META_AD_ACCOUNT_ID ausente — não dá para listar públicos' };
  }
  return graphGetAll(`${ctx.actId}/customaudiences`, { fields: PUBLICOS_FIELDS, limit: 100 }, ctx, maxPages);
}
