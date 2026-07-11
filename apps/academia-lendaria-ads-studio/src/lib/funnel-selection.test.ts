import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FUNNEL_FORM,
  recommendFunnel,
  resolveFunnelSelection,
} from '@/lib/funnel-selection';

describe('funnel-selection', () => {
  it('recomenda Funil R$1 para produto validado com público frio', () => {
    const result = recommendFunnel({
      ...DEFAULT_FUNNEL_FORM,
      productValidated: true,
      audienceTemperature: 'cold',
    });

    expect(result.key).toBe('r1');
    expect(result.confidence).toBe(82);
    expect(result.rationale).toMatch(/público frio/i);
  });

  it('não fabrica recomendação quando o produto ainda não foi validado', () => {
    const result = recommendFunnel({
      ...DEFAULT_FUNNEL_FORM,
      productValidated: false,
    });

    expect(result.key).toBeNull();
    expect(result.confidence).toBeNull();
    expect(result.rationale).toBe('');
  });

  it('marca override quando a escolha manual diverge da recomendação', () => {
    const state = resolveFunnelSelection(
      {
        ...DEFAULT_FUNNEL_FORM,
        productValidated: true,
        audienceTemperature: 'cold',
      },
      'direct',
    );

    expect(state.recommendedFunnel).toBe('r1');
    expect(state.chosenFunnel).toBe('direct');
    expect(state.isOverride).toBe(true);
  });
});
