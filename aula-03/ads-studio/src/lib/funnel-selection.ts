export type AudienceTemperature = 'cold' | 'warm' | 'hot';
export type FunnelKey = 'direct' | 'r1' | 'zoom' | 'lead';

export interface FunnelForm {
  productType: string;
  ticketPriceReais: number;
  productValidated: boolean;
  backendExists: boolean;
  salesTeam: boolean;
  audienceTemperature: AudienceTemperature;
}

export interface FunnelRecommendation {
  key: FunnelKey | null;
  confidence: number | null;
  rationale: string;
}

export interface FunnelSelectionState {
  form: FunnelForm;
  selectedFunnel: FunnelKey | null;
  recommendedFunnel: FunnelKey | null;
  confidence: number | null;
  rationale: string;
  chosenFunnel: FunnelKey | null;
  isOverride: boolean;
}

export interface FunnelOption {
  key: FunnelKey;
  name: string;
  metrics: Array<{ label: string; value: string }>;
  when: string;
}

export const FUNNEL_OPTIONS: FunnelOption[] = [
  {
    key: 'direct',
    name: 'Tráfego Direto',
    metrics: [
      { label: 'CPA alvo', value: 'R$ 45' },
      { label: 'Conv. LP', value: '4–6%' },
    ],
    when: 'Produto validado, oferta clara, verba consistente.',
  },
  {
    key: 'r1',
    name: 'Funil R$1',
    metrics: [
      { label: 'Tripwire', value: 'R$ 1' },
      { label: 'Take upsell', value: '30–40%' },
    ],
    when: 'Público frio, baixo atrito de entrada, escala de leads.',
  },
  {
    key: 'zoom',
    name: 'Aula no Zoom',
    metrics: [
      { label: 'Show-up', value: '35–50%' },
      { label: 'Conv. ao vivo', value: '8–12%' },
    ],
    when: 'Ticket alto, público quente, vendas por evento.',
  },
  {
    key: 'lead',
    name: 'Lead Magnet',
    metrics: [
      { label: 'CPL alvo', value: 'R$ 6' },
      { label: 'Nutrição', value: '5–7 dias' },
    ],
    when: 'Público morno, ciclo de nutrição antes da oferta.',
  },
];

export const DEFAULT_FUNNEL_FORM: FunnelForm = {
  productType: 'Curso / mentoria',
  ticketPriceReais: 0,
  productValidated: true,
  backendExists: true,
  salesTeam: false,
  audienceTemperature: 'cold',
};

export function findFunnelOption(key: FunnelKey | null): FunnelOption | null {
  return FUNNEL_OPTIONS.find((option) => option.key === key) ?? null;
}

export function recommendFunnel(form: FunnelForm): FunnelRecommendation {
  if (!form.productValidated) {
    return { key: null, confidence: null, rationale: '' };
  }

  if (form.audienceTemperature === 'cold') {
    return {
      key: 'r1',
      confidence: 82,
      rationale: 'Produto validado + público frio favorecem captura de baixo atrito com tripwire de R$1.',
    };
  }

  if (form.audienceTemperature === 'hot' && form.backendExists) {
    return {
      key: 'zoom',
      confidence: 76,
      rationale: 'Público quente e backend forte respondem bem a evento ao vivo de alta conversão.',
    };
  }

  if (form.audienceTemperature === 'warm') {
    return {
      key: 'lead',
      confidence: 64,
      rationale: 'Público morno precisa de nutrição: lead magnet aquece antes da oferta.',
    };
  }

  return {
    key: 'direct',
    confidence: 71,
    rationale: 'Produto validado e verba consistente permitem tráfego direto à oferta.',
  };
}

export function resolveFunnelSelection(
  form: FunnelForm,
  selectedFunnel: FunnelKey | null,
): FunnelSelectionState {
  const recommendation = recommendFunnel(form);
  const chosenFunnel = selectedFunnel ?? recommendation.key;
  return {
    form,
    selectedFunnel,
    recommendedFunnel: recommendation.key,
    confidence: recommendation.confidence,
    rationale: recommendation.rationale,
    chosenFunnel,
    isOverride: Boolean(selectedFunnel && recommendation.key && selectedFunnel !== recommendation.key),
  };
}
