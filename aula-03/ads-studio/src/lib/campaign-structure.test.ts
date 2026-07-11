import { describe, expect, it } from 'vitest';
import {
  addAdToAdset,
  defaultCampaignStructure,
  moveAdset,
  removeAdset,
  summarizeStructure,
  adsetNodeName,
  campaignNodeName,
} from '@/lib/campaign-structure';

describe('campaign-structure', () => {
  it('gera nomes no padrão [TIPO] Produto - Público - Data', () => {
    const state = defaultCampaignStructure('Máquina de Receita', new Date('2026-07-09T12:00:00Z'));

    expect(campaignNodeName(state)).toBe('[CAMPANHA] Máquina de Receita - Teste - 2026-07-09');
    expect(adsetNodeName(state, state.adsets[0])).toBe('[ADSET] Máquina de Receita - LAL - 2026-07-09');
  });

  it('resume adsets, ads, slots vazios e budget CBO', () => {
    const state = defaultCampaignStructure('Produto', new Date('2026-07-09T12:00:00Z'));

    expect(summarizeStructure(state)).toEqual({
      adsets: 3,
      ads: 4,
      emptySlots: 4,
      budgetLabel: 'R$ 20.000',
    });
  });

  it('adiciona ads e reordena adsets sem perder slots', () => {
    const state = defaultCampaignStructure('Produto', new Date('2026-07-09T12:00:00Z'));
    const withAd = addAdToAdset(state, 'as2');
    const moved = moveAdset(withAd, 'as2', -1);

    expect(withAd.adsets.find((adset) => adset.id === 'as2')?.ads).toHaveLength(2);
    expect(moved.adsets[0].id).toBe('as2');
    expect(summarizeStructure(moved).emptySlots).toBe(5);
  });

  it('mantém pelo menos um adset ao remover', () => {
    const oneAdset = { ...defaultCampaignStructure(), adsets: [defaultCampaignStructure().adsets[0]] };

    expect(removeAdset(oneAdset, 'as1').adsets).toHaveLength(1);
  });
});
