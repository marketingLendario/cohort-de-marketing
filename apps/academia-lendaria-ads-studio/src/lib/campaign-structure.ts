export type CampaignObjective = 'testing' | 'scale' | 'funnel' | 'launch';
export type BudgetMode = 'CBO' | 'ABO';
export type AudienceKind = 'LAL' | 'Interesse' | 'Broad';

export interface AdNode {
  id: string;
}

export interface AdsetNode {
  id: string;
  audience: AudienceKind;
  detail: string;
  budgetReais: number;
  collapsed: boolean;
  ads: AdNode[];
}

export interface CampaignStructureState {
  objective: CampaignObjective;
  budgetTotalReais: number;
  budgetDailyReais: number;
  budgetMode: BudgetMode;
  productName: string;
  namingDate: string;
  namingPattern: string;
  adsets: AdsetNode[];
}

export interface StructureSummary {
  adsets: number;
  ads: number;
  emptySlots: number;
  budgetLabel: string;
}

export const OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  testing: 'Teste',
  scale: 'Escala',
  funnel: 'Funil',
  launch: 'Lançamento',
};

export const AUDIENCE_OPTIONS: AudienceKind[] = ['LAL', 'Interesse', 'Broad'];
export const STRUCTURE_NAMING_PATTERN = '[TIPO] Produto - Público - Data';

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export function defaultNamingDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function defaultCampaignStructure(productName = 'Produto', date = new Date()): CampaignStructureState {
  return {
    objective: 'testing',
    budgetTotalReais: 20000,
    budgetDailyReais: 670,
    budgetMode: 'CBO',
    productName,
    namingDate: defaultNamingDate(date),
    namingPattern: STRUCTURE_NAMING_PATTERN,
    adsets: [
      {
        id: 'as1',
        audience: 'LAL',
        detail: 'LAL 1% compradores',
        budgetReais: 7000,
        collapsed: false,
        ads: [{ id: 'ad1' }, { id: 'ad2' }],
      },
      {
        id: 'as2',
        audience: 'Interesse',
        detail: 'Marketing digital + Empreendedorismo',
        budgetReais: 7000,
        collapsed: false,
        ads: [{ id: 'ad3' }],
      },
      {
        id: 'as3',
        audience: 'Broad',
        detail: 'Sem segmentação · 18-55',
        budgetReais: 6000,
        collapsed: false,
        ads: [{ id: 'ad4' }],
      },
    ],
  };
}

export function campaignNodeName(state: CampaignStructureState): string {
  return `[CAMPANHA] ${state.productName} - ${OBJECTIVE_LABELS[state.objective]} - ${state.namingDate}`;
}

export function adsetNodeName(state: CampaignStructureState, adset: AdsetNode): string {
  return `[ADSET] ${state.productName} - ${adset.audience} - ${state.namingDate}`;
}

export function adNodeName(state: CampaignStructureState, adset: AdsetNode, adIndex: number): string {
  return `[AD] ${state.productName} - ${adset.audience} - ${state.namingDate} - ${String(adIndex + 1).padStart(2, '0')}`;
}

export function summarizeStructure(state: CampaignStructureState): StructureSummary {
  const ads = state.adsets.reduce((total, adset) => total + adset.ads.length, 0);
  const aboBudget = state.adsets.reduce((total, adset) => total + adset.budgetReais, 0);
  return {
    adsets: state.adsets.length,
    ads,
    emptySlots: ads,
    budgetLabel:
      state.budgetMode === 'CBO'
        ? `R$ ${state.budgetTotalReais.toLocaleString('pt-BR')}`
        : `R$ ${aboBudget.toLocaleString('pt-BR')}`,
  };
}

export function addAdset(state: CampaignStructureState): CampaignStructureState {
  const id = nextId('as');
  const adId = nextId('ad');
  return {
    ...state,
    adsets: [
      ...state.adsets,
      {
        id,
        audience: 'Interesse',
        detail: 'Novo público',
        budgetReais: 3000,
        collapsed: false,
        ads: [{ id: adId }],
      },
    ],
  };
}

export function addAdToAdset(state: CampaignStructureState, adsetId: string): CampaignStructureState {
  return {
    ...state,
    adsets: state.adsets.map((adset) =>
      adset.id === adsetId ? { ...adset, ads: [...adset.ads, { id: nextId('ad') }] } : adset,
    ),
  };
}

export function removeAdset(state: CampaignStructureState, adsetId: string): CampaignStructureState {
  if (state.adsets.length <= 1) return state;
  return { ...state, adsets: state.adsets.filter((adset) => adset.id !== adsetId) };
}

export function moveAdset(state: CampaignStructureState, adsetId: string, direction: -1 | 1): CampaignStructureState {
  const index = state.adsets.findIndex((adset) => adset.id === adsetId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= state.adsets.length) return state;

  const adsets = [...state.adsets];
  const [item] = adsets.splice(index, 1);
  adsets.splice(target, 0, item);
  return { ...state, adsets };
}
