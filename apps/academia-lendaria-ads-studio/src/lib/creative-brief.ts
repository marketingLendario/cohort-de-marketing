export type AngleKey = 'problem' | 'result' | 'curiosity' | 'proof';
export type HookGenerationStatus = 'idle' | 'generating' | 'done';

export interface CreativeHook {
  id: string;
  headline: string;
  sub: string;
  cta: string;
  approved: boolean;
}

export interface CreativeBriefState {
  pains: string;
  desires: string;
  audienceDescription: string;
  proofPoints: string;
  brandVoice: string;
  angles: Record<AngleKey, boolean>;
  hooks: CreativeHook[];
  generationStatus: HookGenerationStatus;
  generationProgress: number;
}

export const ANGLE_LABELS: Record<AngleKey, string> = {
  problem: 'Problema',
  result: 'Resultado',
  curiosity: 'Curiosidade',
  proof: 'Prova',
};

export const ANGLE_KEYS = Object.keys(ANGLE_LABELS) as AngleKey[];

export const DEFAULT_CREATIVE_BRIEF: CreativeBriefState = {
  pains:
    'Compra curso atrás de curso e não executa. Tráfego não escala por falta de estrutura. Sente que está sempre começando do zero.',
  desires:
    'Campanhas no ar gerando previsibilidade. Time enxuto rodando como agência. Parar de ser o gargalo da operação.',
  audienceDescription:
    'Gestores de tráfego e infoprodutores, 28-45, faturando R$30k-300k/mês, querendo escalar com método.',
  proofPoints: 'Método validado em campanhas reais da Academia Lendária; foco em execução guiada e campanhas no ar.',
  brandVoice: 'Academia Lendária · editorial, direto, estratégico, sem hype vazio',
  angles: { problem: true, result: true, curiosity: false, proof: true },
  hooks: [],
  generationStatus: 'idle',
  generationProgress: 0,
};

const SEEDED_HOOKS: Array<Omit<CreativeHook, 'id' | 'approved'>> = [
  {
    headline: 'Pare de consumir. Comece a executar.',
    sub: 'O acúmulo de conteúdo virou desculpa. A estrutura vira resultado.',
    cta: 'Quero começar',
  },
  {
    headline: 'Seu tráfego não escala porque falta estrutura.',
    sub: 'Não é volume de anúncio: é arquitetura de campanha que sustenta escala.',
    cta: 'Ver como funciona',
  },
  {
    headline: 'O criativo que vende não é o mais bonito: é o mais claro.',
    sub: 'Clareza converte. O criativo bonito sem mensagem só queima verba.',
    cta: 'Garantir vaga',
  },
  {
    headline: 'Você não precisa de mais aulas. Precisa de campanhas no ar.',
    sub: 'Pare de assistir aula sobre tráfego. Coloque campanha no ar hoje.',
    cta: 'Aplicar agora',
  },
];

export function createEmptyHook(id = `hook-${Date.now()}`): CreativeHook {
  return { id, headline: '', sub: '', cta: '', approved: false };
}

export function generateDemoHooks(brief: CreativeBriefState): CreativeHook[] {
  const activeAngles = ANGLE_KEYS.filter((angle) => brief.angles[angle]);
  const suffix = activeAngles.length > 0 ? activeAngles.join('-') : 'manual';
  return SEEDED_HOOKS.map((hook, index) => ({
    id: `hook-${suffix}-${index + 1}`,
    ...hook,
    approved: false,
  }));
}

export function approvedHookCount(brief: CreativeBriefState): number {
  return brief.hooks.filter((hook) => hook.approved).length;
}

export function isBriefReadyForFactory(brief: CreativeBriefState): boolean {
  return brief.hooks.some((hook) => hook.approved && hook.headline.trim().length > 0);
}

export function updateHook(
  brief: CreativeBriefState,
  hookId: string,
  patch: Partial<Omit<CreativeHook, 'id'>>,
): CreativeBriefState {
  return {
    ...brief,
    hooks: brief.hooks.map((hook) => (hook.id === hookId ? { ...hook, ...patch } : hook)),
  };
}
