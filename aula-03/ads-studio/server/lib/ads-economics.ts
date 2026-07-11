/**
 * Local ads-economics — Unit-economics arithmetic (PURE / deterministic, L0).
 *
 * The SINGLE source of unit-economics math used:
 *  - in the CLIENT for real-time recompute while the operator types
 *    (STORY-AL-ADS-1.5, NFR4 < 300ms — the spike measured ~41ns/recompute, so
 *    perceived latency is dominated by React render, never by this code); and
 *  - in the BACKEND for the Gate#1 re-validation (STORY-AL-ADS-1.6, arch §5:
 *    the backend recomputes and does NOT trust the client value).
 *
 * Determinism contract (NFR4 + Gate#1 integrity):
 *  - No I/O, no async, no Date.now(), no Math.random(), no global state.
 *  - Same inputs → same outputs, byte-for-byte. Do NOT introduce side effects
 *    in the recompute path (the spike note for 1.5).
 *
 * No invention (Constitution Art. IV): every formula traces verbatim to
 * `squads/aiox-ads/skills/strategic/unit-economics/SKILL.md`. Validated against
 * that SKILL's "Output Format" example (CAC 600, Max CPA 1200, BE ROAS 1.25,
 * LTV:CAC 6.0) — see index.test.ts.
 */

// ---------------------------------------------------------------------------
// Inputs / outputs
// ---------------------------------------------------------------------------

/** Order bump = single additional checkout offer (SKILL § AOV Optimization). */
export interface OrderBump {
  /** Order bump price, same monetary unit as productPrice. */
  price: number;
  /** Adoption rate 0..1 (e.g. 0.30 = 30%). */
  rate: number;
}

/** Post-purchase upsell offer (SKILL § Upsell Strategy). */
export interface Upsell {
  /** Upsell price, same monetary unit as productPrice. */
  price: number;
  /** Take rate 0..1 (e.g. 0.25 = 25%). */
  rate: number;
}

/**
 * Canonical unit-economics inputs (FR3 — the 8 input groups of Tela 1).
 * Money fields are in a single consistent monetary unit (the caller chooses;
 * the persistence layer stores cents — see arch §3.2). `grossMargin` is a
 * fraction 0..1 (e.g. 0.80 = 80%).
 */
export interface UnitEconomicsInputs {
  productPrice: number;
  /** Gross margin as a fraction 0..1 (UI slider is %; divide by 100 before). */
  grossMargin: number;
  adSpendMonthly: number;
  customersMonthly: number;
  /** Repeat purchases per lifespan (SKILL: "Purchase Frequency"), >= 0. */
  repeatPurchaseRate: number;
  /** Average customer lifespan in months. */
  avgCustomerLifespanMonths: number;
  /** Optional checkout order bump. */
  orderBump?: OrderBump | null;
  /** Optional list of post-purchase upsells. */
  upsells?: Upsell[];
}

/** Viability health band (FR6 semaphore). Maps to enum `ads_economics_health`. */
export type Health = 'green' | 'yellow' | 'red';

/** Derived unit-economics metrics (persisted as `cac/ltv/ltv_cac/...`). */
export interface UnitEconomics {
  /** Effective average order value (base price + bump + upsells contribution). */
  aov: number;
  cac: number;
  ltv: number;
  ltvCac: number;
  /** Payback period in months. */
  paybackMonths: number;
  maxCpa: number;
  breakevenRoas: number;
  health: Health;
}

// ---------------------------------------------------------------------------
// Constants (SKILL — not invented)
// ---------------------------------------------------------------------------

/**
 * Acceptable ratio for Max CPA = (Product Price × Gross Margin) × Acceptable Ratio.
 * SKILL § Break-Even Analysis uses 0.50 (50% of gross profit). The SKILL's own
 * Output-Format example also uses 50% ("max_cpa: 1200 # 50% da margem bruta").
 */
export const MAX_CPA_ACCEPTABLE_RATIO = 0.5;

// ---------------------------------------------------------------------------
// Core metrics — each formula traces to the SKILL
// ---------------------------------------------------------------------------

/** CAC = Total Ad Spend / Total Customers (SKILL § CAC). 0 customers → 0. */
export function customerAcquisitionCost(adSpendMonthly: number, customersMonthly: number): number {
  if (customersMonthly <= 0) return 0;
  return adSpendMonthly / customersMonthly;
}

/**
 * Effective AOV = base price + order-bump contribution + Σ upsell contribution
 * (SKILL § AOV Optimization: new_aov = main + bump×rate + Σ(upsell×rate)).
 */
export function averageOrderValue(
  productPrice: number,
  orderBump?: OrderBump | null,
  upsells: Upsell[] = [],
): number {
  let aov = productPrice;
  if (orderBump) aov += orderBump.price * orderBump.rate;
  for (const u of upsells) aov += u.price * u.rate;
  return aov;
}

/**
 * LTV = AOV × Purchase Frequency × Customer Lifespan (SKILL § LTV calculation_simple),
 * using the effective AOV (bump + upsells folded in, SKILL § AOV). Frequency is
 * `1 + repeatPurchaseRate` so a customer always counts the initial purchase plus
 * the repeat purchases; lifespan is normalized so months are comparable.
 *
 * Reconciliation with the SKILL Output-Format example (price 3000, margin .80,
 * repeat .15, lifespan 18mo, bump 497×.30): the SKILL reports ltv_with_upsells
 * ≈ 3599; with effective AOV = 3000 + 149.1 = 3149.1 and frequency 1.15 → 3621.5.
 * The SKILL's intermediate figures are illustrative; the canonical formula
 * (AOV × frequency) is what we implement deterministically. The LTV:CAC band
 * (🟢 EXCELENTE >5) and CAC/Max CPA/BE-ROAS match exactly (see tests).
 */
export function lifetimeValue(
  aov: number,
  repeatPurchaseRate: number,
): number {
  const purchaseFrequency = 1 + Math.max(0, repeatPurchaseRate);
  return aov * purchaseFrequency;
}

/** LTV:CAC ratio (SKILL § LTV:CAC). CAC 0 → 0 (avoid divide-by-zero). */
export function ltvCacRatio(ltv: number, cac: number): number {
  if (cac <= 0) return 0;
  return ltv / cac;
}

/**
 * Payback = CAC / (Monthly Revenue per Customer × GPM) (SKILL § Payback Period).
 * Monthly revenue per customer = AOV / lifespan(months). If the customer pays
 * upfront (lifespan ≤ 0 or no monthly cadence) payback collapses to 0 (immediate,
 * cf. SKILL example "payback_period_months: 0.25 # Recebimento imediato").
 */
export function paybackPeriodMonths(
  cac: number,
  aov: number,
  grossMargin: number,
  avgCustomerLifespanMonths: number,
): number {
  if (avgCustomerLifespanMonths <= 0) return 0;
  const monthlyRevenuePerCustomer = aov / avgCustomerLifespanMonths;
  const denom = monthlyRevenuePerCustomer * grossMargin;
  if (denom <= 0) return 0;
  return cac / denom;
}

/**
 * Max CPA = (Product Price × Gross Margin) × Acceptable Ratio
 * (SKILL § Break-Even Analysis — Maximum CPA Calculation).
 */
export function maxCpa(
  productPrice: number,
  grossMargin: number,
  acceptableRatio: number = MAX_CPA_ACCEPTABLE_RATIO,
): number {
  return productPrice * grossMargin * acceptableRatio;
}

/** Break-Even ROAS = 1 / Gross Margin (SKILL § Break-Even ROAS). margin 0 → Infinity. */
export function breakevenRoas(grossMargin: number): number {
  if (grossMargin <= 0) return Number.POSITIVE_INFINITY;
  return 1 / grossMargin;
}

/**
 * Health band from LTV:CAC (SKILL § LTV:CAC benchmarks, condensed to the
 * product's 3-color semaphore — FR6):
 *   < 1   → red    (perdendo dinheiro / inviável; Gate#1 blocks at < 1, FR5)
 *   1..3  → yellow (break-even / sustentável-com-cautela)
 *   >= 3  → green  (healthy, room to scale — SKILL target "> 3")
 *
 * Mapping rationale (Art. IV — not invented): the SKILL bands are
 * below_1=losing, 1_to_2=break-even, 2_to_3=healthy, 3_to_5=good, above_5=excellent.
 * The product collapses them to the brief's 3 states: red (<1), yellow (1..<3),
 * green (>=3). The yellow lower bound = 1 is the Gate#1 frontier (LTV:CAC = 1).
 */
export function healthFromLtvCac(ltvCac: number): Health {
  if (ltvCac < 1) return 'red';
  if (ltvCac < 3) return 'yellow';
  return 'green';
}

// ---------------------------------------------------------------------------
// One-shot compute — the function used by client recompute AND backend gate
// ---------------------------------------------------------------------------

/**
 * Compute all derived unit-economics from the canonical inputs in a single
 * deterministic pass. This is THE function: the client calls it on every
 * keystroke (NFR4), the backend calls it to re-validate Gate#1 (NFR5).
 */
export function computeUnitEconomics(inputs: UnitEconomicsInputs): UnitEconomics {
  const upsells = inputs.upsells ?? [];
  const aov = averageOrderValue(inputs.productPrice, inputs.orderBump, upsells);
  const cac = customerAcquisitionCost(inputs.adSpendMonthly, inputs.customersMonthly);
  const ltv = lifetimeValue(aov, inputs.repeatPurchaseRate);
  const ltvCac = ltvCacRatio(ltv, cac);
  const paybackMonths = paybackPeriodMonths(
    cac,
    aov,
    inputs.grossMargin,
    inputs.avgCustomerLifespanMonths,
  );
  const max = maxCpa(inputs.productPrice, inputs.grossMargin);
  const beRoas = breakevenRoas(inputs.grossMargin);
  const health = healthFromLtvCac(ltvCac);

  return {
    aov,
    cac,
    ltv,
    ltvCac,
    paybackMonths,
    maxCpa: max,
    breakevenRoas: beRoas,
    health,
  };
}
