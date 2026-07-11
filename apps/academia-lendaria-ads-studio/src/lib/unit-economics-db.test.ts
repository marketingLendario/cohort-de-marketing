import { describe, expect, it } from 'vitest';
import { formToRow, rowToForm } from '@/lib/unit-economics-db';
import type { UnitEconomicsForm } from '@/stores/unit-economics-store';

const FORM: UnitEconomicsForm = {
  productPriceReais: 297,
  grossMarginPct: 72,
  adSpendMonthlyReais: 3000,
  customersMonthly: 20,
  repeatPurchaseRate: 1.5,
  avgCustomerLifespanMonths: 8,
  orderBump: { priceReais: 47, ratePct: 30 },
  upsells: [{ name: 'Aceleração VIP', priceReais: 597, ratePct: 12 }],
};

describe('unit economics persistence boundary', () => {
  it('round-trips named upsells without changing money or rate units', () => {
    const row = formToRow(FORM, 'campaign-1', 'workspace-1');

    expect(row.upsells).toEqual([
      { name: 'Aceleração VIP', price_cents: 59_700, rate: 0.12 },
    ]);
    expect(rowToForm(row)).toEqual(FORM);
  });

  it('normalizes blank upsell names at the database boundary', () => {
    const row = formToRow(
      { ...FORM, upsells: [{ name: '   ', priceReais: 97, ratePct: 20 }] },
      'campaign-1',
      'workspace-1',
    );

    expect(row.upsells[0]).toEqual({ name: undefined, price_cents: 9_700, rate: 0.2 });
  });
});
