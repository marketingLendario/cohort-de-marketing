import { computeUnitEconomics } from '@/lib/ads-economics';
import { DEMO_AUTH_ENABLED, getDemoUnitEconomics, saveDemoUnitEconomics } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import {
  toEconomicsInputs,
  type UnitEconomicsForm,
} from '@/stores/unit-economics-store';

/**
 * Camada de dados da Tela 1 (AC7) — `ads_unit_economics` (1:1 com campanha).
 *
 * A FRONTEIRA DE UNIDADE vive aqui: a UI/store trabalha em R$ e %, o banco
 * guarda CENTAVOS (bigint) e margem 0..100 (numeric). Toda conversão acontece
 * em `formToRow` / `rowToForm` — em nenhum outro lugar (single boundary).
 *
 * O cliente é RLS-aware (`@/lib/supabase`): roda sob o JWT do usuário, então o
 * INSERT/UPDATE/SELECT só toca a linha cujo `workspace_id` o usuário é membro
 * (R7, provado pela @db-sage). O front não reimplementa isolamento — passa o
 * `workspace_id` do spoke ativo e a RLS faz o resto.
 *
 * Os derivados também são persistidos (AC7). Aqui são recalculados pela MESMA
 * função do client (`computeUnitEconomics`) — a re-validação autoritativa de
 * Gate#1 server-side é a story 1.6 (arch §5: o backend recalcula, não confia).
 */

/** Conversão R$ → centavos (inteiro, arredondado). */
function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Conversão centavos → R$. */
function centsToReais(cents: number): number {
  return cents / 100;
}

/** Forma da linha em `ads_unit_economics` (subset escrito/lido pela Tela 1). */
export interface UnitEconomicsRow {
  campaign_id: string;
  workspace_id: string;
  product_price_cents: number;
  gross_margin_pct: number;
  ad_spend_monthly_cents: number;
  customers_monthly: number;
  repeat_purchase_rate: number;
  avg_customer_lifespan_months: number;
  order_bump: { price_cents: number; rate: number } | Record<string, never>;
  upsells: Array<{ name?: string; price_cents: number; rate: number }>;
  cac_cents: number | null;
  ltv_cents: number | null;
  ltv_cac: number | null;
  payback_months: number | null;
  max_cpa_cents: number | null;
  breakeven_roas: number | null;
  health: 'green' | 'yellow' | 'red' | null;
  computed_at: string | null;
}

/**
 * Monta a linha do DB a partir do form (inputs em R$/%) + derivados recalculados.
 * `breakeven_roas` pode ser Infinity (margem 0) — persistimos `null` nesse caso
 * (numeric não aceita Infinity), preservando o significado "indefinido".
 */
export function formToRow(
  form: UnitEconomicsForm,
  campaignId: string,
  workspaceId: string,
): UnitEconomicsRow {
  const inputs = toEconomicsInputs(form);
  const m = computeUnitEconomics(inputs);
  const hasBump = form.orderBump.priceReais > 0 || form.orderBump.ratePct > 0;
  const finiteOrNull = (n: number): number | null => (Number.isFinite(n) ? n : null);

  return {
    campaign_id: campaignId,
    workspace_id: workspaceId,
    product_price_cents: reaisToCents(form.productPriceReais),
    gross_margin_pct: form.grossMarginPct,
    ad_spend_monthly_cents: reaisToCents(form.adSpendMonthlyReais),
    customers_monthly: Math.round(form.customersMonthly),
    repeat_purchase_rate: form.repeatPurchaseRate,
    avg_customer_lifespan_months: form.avgCustomerLifespanMonths,
    order_bump: hasBump
      ? { price_cents: reaisToCents(form.orderBump.priceReais), rate: form.orderBump.ratePct / 100 }
      : {},
    upsells: form.upsells.map((u) => ({
      name: u.name?.trim() || undefined,
      price_cents: reaisToCents(u.priceReais),
      rate: u.ratePct / 100,
    })),
    cac_cents: reaisToCents(m.cac),
    ltv_cents: reaisToCents(m.ltv),
    ltv_cac: finiteOrNull(m.ltvCac),
    payback_months: finiteOrNull(m.paybackMonths),
    max_cpa_cents: reaisToCents(m.maxCpa),
    breakeven_roas: finiteOrNull(m.breakevenRoas),
    health: m.health,
    computed_at: new Date().toISOString(),
  };
}

/** Reconstrói o form (R$/%) a partir de uma linha persistida (centavos/0..1). */
export function rowToForm(row: UnitEconomicsRow): UnitEconomicsForm {
  const bump = row.order_bump as { price_cents?: number; rate?: number };
  return {
    productPriceReais: centsToReais(row.product_price_cents),
    grossMarginPct: Number(row.gross_margin_pct),
    adSpendMonthlyReais: centsToReais(row.ad_spend_monthly_cents),
    customersMonthly: row.customers_monthly,
    repeatPurchaseRate: Number(row.repeat_purchase_rate),
    avgCustomerLifespanMonths: Number(row.avg_customer_lifespan_months),
    orderBump: {
      priceReais: bump.price_cents ? centsToReais(bump.price_cents) : 0,
      ratePct: bump.rate ? bump.rate * 100 : 0,
    },
    upsells: (row.upsells ?? []).map((u) => ({
      name: u.name ?? '',
      priceReais: centsToReais(u.price_cents),
      ratePct: u.rate * 100,
    })),
  };
}

/** Colunas lidas no load (subset da Tela 1). */
const SELECT_COLS =
  'campaign_id, workspace_id, product_price_cents, gross_margin_pct, ad_spend_monthly_cents, customers_monthly, repeat_purchase_rate, avg_customer_lifespan_months, order_bump, upsells, cac_cents, ltv_cents, ltv_cac, payback_months, max_cpa_cents, breakeven_roas, health, computed_at';

/**
 * Carrega o unit-economics da campanha (ou null se ainda não existe).
 * `maybeSingle` porque a tabela é 1:1 e a linha pode não existir num draft novo.
 */
export async function loadUnitEconomics(
  campaignId: string,
): Promise<{ form: UnitEconomicsForm | null; error: string | null }> {
  if (DEMO_AUTH_ENABLED) {
    return { form: getDemoUnitEconomics(campaignId), error: null };
  }
  const { data, error } = await supabase
    .from('ads_unit_economics')
    .select(SELECT_COLS)
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error) return { form: null, error: error.message };
  if (!data) return { form: null, error: null };
  return { form: rowToForm(data as UnitEconomicsRow), error: null };
}

/**
 * Persiste (upsert por `campaign_id`) inputs + derivados (AC7). Idempotente: o
 * UNIQUE em `campaign_id` faz o upsert atualizar a linha existente. A RLS
 * garante que só grava na campanha cujo workspace o usuário é membro.
 */
export async function saveUnitEconomics(
  form: UnitEconomicsForm,
  campaignId: string,
  workspaceId: string,
): Promise<{ error: string | null }> {
  if (DEMO_AUTH_ENABLED) {
    saveDemoUnitEconomics(campaignId, form);
    return { error: null };
  }
  const row = formToRow(form, campaignId, workspaceId);
  const { error } = await supabase
    .from('ads_unit_economics')
    .upsert(row, { onConflict: 'campaign_id' });
  return { error: error ? error.message : null };
}
