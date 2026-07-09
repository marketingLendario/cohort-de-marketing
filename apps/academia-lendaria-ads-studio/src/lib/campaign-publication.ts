export type PublicationScenario = 'success' | 'partial' | 'unavailable';
export type PublicationStatus = 'idle' | 'publishing' | 'partial' | 'done' | 'unavailable';
export type PublicationStepStatus = 'pending' | 'running' | 'ok' | 'failed';

export interface PublicationStepState {
  id: 'cred' | 'camp' | 'adsets' | 'ads' | 'confirm';
  label: string;
  status: PublicationStepStatus;
}

export interface CampaignPublicationState {
  paused: boolean;
  status: PublicationStatus;
  activeStep: number;
  scenario: PublicationScenario;
  retrying: boolean;
  steps: PublicationStepState[];
  log: string[];
}

export const DEFAULT_PUBLICATION_STEPS: PublicationStepState[] = [
  { id: 'cred', label: 'Validar credenciais do spoke', status: 'pending' },
  { id: 'camp', label: 'Criar campanha', status: 'pending' },
  { id: 'adsets', label: 'Criar adsets', status: 'pending' },
  { id: 'ads', label: 'Subir ads', status: 'pending' },
  { id: 'confirm', label: 'Confirmar', status: 'pending' },
];

const STEP_LOGS: Record<PublicationStepState['id'], [string, string]> = {
  cred: ['[agent] validando credenciais do spoke via meta-ads auth…', '[ok] token válido · ad_account act_88421970'],
  camp: ['[agent] meta-ads campaign create --objective OUTCOME_SALES…', '[ok] campanha criada · id 120210000111'],
  adsets: ['[agent] meta-ads adset create ×3 (CBO)…', '[ok] 3 adsets criados'],
  ads: ['[agent] meta-ads ad create ×4 · subindo criativos…', '[ok] 4 ads no ar (pausados)'],
  confirm: ['[agent] confirmando árvore publicada…', '[ok] campanha publicada (pausada)'],
};

export function defaultCampaignPublicationState(): CampaignPublicationState {
  return {
    paused: true,
    status: 'idle',
    activeStep: -1,
    scenario: 'success',
    retrying: false,
    steps: DEFAULT_PUBLICATION_STEPS.map((step) => ({ ...step })),
    log: [],
  };
}

export function resetPublicationScenario(
  state: CampaignPublicationState,
  scenario: PublicationScenario,
): CampaignPublicationState {
  return {
    ...state,
    scenario,
    status: 'idle',
    activeStep: -1,
    retrying: false,
    steps: DEFAULT_PUBLICATION_STEPS.map((step) => ({ ...step })),
    log: [],
  };
}

export function startPublication(state: CampaignPublicationState): CampaignPublicationState {
  if (state.scenario === 'unavailable') {
    return {
      ...state,
      status: 'unavailable',
      log: [
        '[agent] conectando ao adapter services/meta-ads/ …',
        '[erro] adapter indisponível (timeout 30s)',
        '[agent] publicação abortada — consolidado preservado',
      ],
    };
  }
  return {
    ...state,
    status: 'publishing',
    activeStep: 0,
    retrying: false,
    steps: state.steps.map((step, index) => ({ ...step, status: index === 0 ? 'running' : 'pending' })),
    log: [],
  };
}

export function advancePublication(state: CampaignPublicationState): CampaignPublicationState {
  const index = state.activeStep;
  if (state.status !== 'publishing' || index < 0 || index >= state.steps.length) return state;
  const steps = state.steps.map((step) => ({ ...step }));
  const current = steps[index];
  const partialFailure = state.scenario === 'partial' && current.id === 'ads' && !state.retrying;
  const logs = partialFailure
    ? [STEP_LOGS.ads[0], '[erro] ad #4 falhou · INVALID_IMAGE_HASH']
    : STEP_LOGS[current.id];
  const log = [...state.log, ...logs];

  if (partialFailure) {
    steps[index].status = 'failed';
    return { ...state, status: 'partial', steps, log };
  }

  steps[index].status = 'ok';
  const next = index + 1;
  if (next >= steps.length) {
    return { ...state, status: 'done', activeStep: next, steps, log };
  }
  steps[next].status = 'running';
  return { ...state, activeStep: next, steps, log };
}

export function retryPublication(state: CampaignPublicationState): CampaignPublicationState {
  const failedIndex = state.steps.findIndex((step) => step.status === 'failed');
  if (failedIndex < 0) return state;
  return {
    ...state,
    status: 'publishing',
    activeStep: failedIndex,
    retrying: true,
    log: [...state.log, '[agent] retry granular · ad #4 …'],
    steps: state.steps.map((step, index) =>
      index === failedIndex ? { ...step, status: 'running' } : step,
    ),
  };
}
