import { beforeEach, describe, expect, it } from 'vitest';
import {
  createDemoCampaign,
  DEMO_SPOKE_ID,
  getDemoCampaigns,
  updateDemoCampaignStep,
} from '@/lib/demo-mode';
import { advanceDemoCampaignToStep } from '@/lib/campaign-advance';
import type { UnitEconomicsForm } from '@/stores/unit-economics-store';

const VIABLE_FORM: UnitEconomicsForm = {
  productPriceReais: 1000,
  grossMarginPct: 80,
  adSpendMonthlyReais: 100,
  customersMonthly: 10,
  repeatPurchaseRate: 0,
  avgCustomerLifespanMonths: 6,
  orderBump: { priceReais: 0, ratePct: 0 },
  upsells: [],
};

const INVIABLE_FORM: UnitEconomicsForm = {
  ...VIABLE_FORM,
  productPriceReais: 10,
  adSpendMonthlyReais: 1000,
  customersMonthly: 1,
};

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(key, value),
  };
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
});

describe('advanceDemoCampaignToStep', () => {
  it('avanca a campanha demo quando o Gate #1 passa', () => {
    const campaign = createDemoCampaign(DEMO_SPOKE_ID, 'Campanha viavel');

    const result = advanceDemoCampaignToStep({
      campaignId: campaign.id,
      targetStep: 2,
      form: VIABLE_FORM,
    });

    expect(result.ok).toBe(true);
    expect(result.stepCurrent).toBe(2);
    expect(getDemoCampaigns(DEMO_SPOKE_ID).find((item) => item.id === campaign.id)?.step_current).toBe(2);
  });

  it('bloqueia a campanha demo quando LTV:CAC fica abaixo de 1', () => {
    const campaign = createDemoCampaign(DEMO_SPOKE_ID, 'Campanha inviavel');

    const result = advanceDemoCampaignToStep({
      campaignId: campaign.id,
      targetStep: 2,
      form: INVIABLE_FORM,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/LTV:CAC .* < 1/);
    expect(getDemoCampaigns(DEMO_SPOKE_ID).find((item) => item.id === campaign.id)?.step_current).toBe(1);
  });

  it('materializa uma campanha retomada antes de atualizar o passo demo', () => {
    const updated = updateDemoCampaignStep('demo-campaign-retomada', 5);

    expect(updated?.step_current).toBe(5);
    expect(updated?.workspace_id).toBe(DEMO_SPOKE_ID);
    expect(getDemoCampaigns(DEMO_SPOKE_ID).find((item) => item.id === 'demo-campaign-retomada')?.step_current).toBe(5);
  });
});
