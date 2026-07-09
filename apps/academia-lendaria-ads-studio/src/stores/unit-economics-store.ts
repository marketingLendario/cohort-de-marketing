import { create } from 'zustand';
import {
  computeUnitEconomics,
  type UnitEconomics,
  type UnitEconomicsInputs,
} from '@/lib/ads-economics';

/**
 * Estado da Tela 1 (Setup Produto + Unit Economics) — STORY-AL-ADS-1.5.
 *
 * Os inputs vivem aqui na unidade DA UI (R$ e %), porque é o que o operador
 * digita. A conversão para a unidade do módulo (`@sinkra/ads-economics` trabalha
 * em reais e margem 0..1) acontece em `toEconomicsInputs`; a conversão para a
 * unidade do banco (centavos, margem 0..100) acontece na borda do DB
 * (`src/lib/unit-economics-db.ts`). NUNCA reimplementar fórmula aqui — o
 * recálculo é uma chamada pura a `computeUnitEconomics` (AC2/AC5, NFR4).
 *
 * Zustand mantém o padrão da app (spoke-store). O recálculo roda no client a
 * cada keystroke — não vai ao servidor para aritmética (AC6/NFR4).
 */

/** Order bump em unidade de UI (preço em R$, taxa em %). */
export interface OrderBumpForm {
  /** Preço do order bump em reais. */
  priceReais: number;
  /** Taxa de adesão em pontos percentuais (0..100). */
  ratePct: number;
}

/** Upsell em unidade de UI (preço em R$, taxa em %). */
export interface UpsellForm {
  /** Nome editorial exibido na estrutura da oferta. */
  name?: string;
  /** Preço do upsell em reais. */
  priceReais: number;
  /** Take rate em pontos percentuais (0..100). */
  ratePct: number;
}

/**
 * Os 8 grupos de inputs canônicos da Tela 1 (FR3), em unidade de UI.
 *  1. preço do produto (R$)
 *  2. margem bruta (% — slider)
 *  3. verba de anúncio mensal (R$)
 *  4. clientes/mês
 *  5. taxa de recompra (nº de recompras na vida útil)
 *  6. vida útil do cliente (meses)
 *  7. order bump { preço, taxa }
 *  8. upsells[] { preço, taxa }
 */
export interface UnitEconomicsForm {
  productPriceReais: number;
  grossMarginPct: number;
  adSpendMonthlyReais: number;
  customersMonthly: number;
  repeatPurchaseRate: number;
  avgCustomerLifespanMonths: number;
  orderBump: OrderBumpForm;
  upsells: UpsellForm[];
}

/** Form vazio/padrão (sem invenção de números — tudo zero exceto order bump desligado). */
export const EMPTY_FORM: UnitEconomicsForm = {
  productPriceReais: 0,
  grossMarginPct: 0,
  adSpendMonthlyReais: 0,
  customersMonthly: 0,
  repeatPurchaseRate: 0,
  avgCustomerLifespanMonths: 0,
  orderBump: { priceReais: 0, ratePct: 0 },
  upsells: [],
};

/**
 * Traduz o form (R$, %) para os inputs do módulo (reais, margem 0..1, taxas 0..1).
 * O módulo é unit-agnostic para dinheiro desde que consistente — usamos reais.
 */
export function toEconomicsInputs(form: UnitEconomicsForm): UnitEconomicsInputs {
  const hasBump = form.orderBump.priceReais > 0 || form.orderBump.ratePct > 0;
  return {
    productPrice: form.productPriceReais,
    grossMargin: form.grossMarginPct / 100,
    adSpendMonthly: form.adSpendMonthlyReais,
    customersMonthly: form.customersMonthly,
    repeatPurchaseRate: form.repeatPurchaseRate,
    avgCustomerLifespanMonths: form.avgCustomerLifespanMonths,
    orderBump: hasBump
      ? { price: form.orderBump.priceReais, rate: form.orderBump.ratePct / 100 }
      : null,
    upsells: form.upsells.map((u) => ({ price: u.priceReais, rate: u.ratePct / 100 })),
  };
}

interface UnitEconomicsState {
  /** Campanha atualmente em edição (1:1 com `ads_unit_economics`). */
  campaignId: string | null;
  /** Inputs em unidade de UI. */
  form: UnitEconomicsForm;
  /** Derivados recalculados (puro, client-side). */
  metrics: UnitEconomics;
  /** True após carregar/persistir com sucesso no DB. */
  persisted: boolean;
  /** Substitui o form inteiro (ex.: ao carregar do DB) e recalcula. */
  hydrate: (campaignId: string, form: UnitEconomicsForm, persisted: boolean) => void;
  /** Atualiza um campo escalar do form e recalcula (AC2 — tempo real). */
  setField: <K extends keyof UnitEconomicsForm>(key: K, value: UnitEconomicsForm[K]) => void;
  /** Atualiza um campo do order bump e recalcula. */
  setOrderBump: <K extends keyof OrderBumpForm>(key: K, value: number) => void;
  /** Adiciona um upsell vazio. */
  addUpsell: () => void;
  /** Atualiza um campo de um upsell pelo índice. */
  setUpsell: <K extends keyof UpsellForm>(index: number, key: K, value: UpsellForm[K]) => void;
  /** Remove um upsell pelo índice. */
  removeUpsell: (index: number) => void;
  /** Marca como persistido (após upsert bem-sucedido). */
  markPersisted: () => void;
  /** Limpa o estado (troca de campanha / unmount). */
  reset: () => void;
}

const INITIAL_METRICS = computeUnitEconomics(toEconomicsInputs(EMPTY_FORM));

/**
 * Recalcula os derivados a partir do form. Uma só função de recálculo, usada
 * por todos os setters — garante que `metrics` nunca diverge de `form` (AC2).
 */
function recompute(form: UnitEconomicsForm): UnitEconomics {
  return computeUnitEconomics(toEconomicsInputs(form));
}

export const useUnitEconomicsStore = create<UnitEconomicsState>((set) => ({
  campaignId: null,
  form: EMPTY_FORM,
  metrics: INITIAL_METRICS,
  persisted: false,
  hydrate: (campaignId, form, persisted) =>
    set({ campaignId, form, metrics: recompute(form), persisted }),
  setField: (key, value) =>
    set((state) => {
      const form = { ...state.form, [key]: value };
      return { form, metrics: recompute(form), persisted: false };
    }),
  setOrderBump: (key, value) =>
    set((state) => {
      const form = { ...state.form, orderBump: { ...state.form.orderBump, [key]: value } };
      return { form, metrics: recompute(form), persisted: false };
    }),
  addUpsell: () =>
    set((state) => {
      const form = {
        ...state.form,
        upsells: [...state.form.upsells, { name: '', priceReais: 0, ratePct: 0 }],
      };
      return { form, metrics: recompute(form), persisted: false };
    }),
  setUpsell: (index, key, value) =>
    set((state) => {
      const upsells = state.form.upsells.map((u, i) => (i === index ? { ...u, [key]: value } : u));
      const form = { ...state.form, upsells };
      return { form, metrics: recompute(form), persisted: false };
    }),
  removeUpsell: (index) =>
    set((state) => {
      const upsells = state.form.upsells.filter((_, i) => i !== index);
      const form = { ...state.form, upsells };
      return { form, metrics: recompute(form), persisted: false };
    }),
  markPersisted: () => set({ persisted: true }),
  reset: () =>
    set({ campaignId: null, form: EMPTY_FORM, metrics: INITIAL_METRICS, persisted: false }),
}));
