import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  LEGACY_BRIEF_SCHEMA_VERSION,
  PROJECT_BRIEF_SCHEMA_VERSION,
  migrateLegacyBrief,
  setPath,
  slugifyProjectName,
  type CampaignPlanRevision,
  type FieldSourceMeta,
  type MarketingProject,
  type ProjectArtifact,
  type ProjectBriefData,
  type ProjectBriefRevision,
  type SkillRun,
  type WeeklyPanel,
} from '@/lib/project-domain';

export const DEMO_PROJECT_ID = 'demo-project-academia-lendaria';
export const DEMO_WORKSPACE_ID = 'demo-spoke-academia-lendaria';

const NOW = '2026-07-09T12:00:00.000Z';

/**
 * Mesma regra de `DEMO_AUTH_ENABLED` (`@/lib/demo-mode`), duplicada aqui para
 * não criar um ciclo de import entre os dois módulos (`demo-mode.ts` já
 * importa `DEMO_PROJECT_ID` deste arquivo). `createProjectStore` aceita
 * `demoEnabled` explícito, então este helper só decide o default real/app.
 */
function defaultDemoEnabled(): boolean {
  return import.meta.env.MODE !== 'test' && import.meta.env.VITE_DEMO_AUTH === 'true';
}

function id(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function flattenProvidedPaths(value: unknown, prefix = '', output: string[] = []): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return output;
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) flattenProvidedPaths(child, path, output);
    else if (child !== undefined && child !== null && child !== '') output.push(path);
  }
  return output;
}

function confirmedFieldSources(data: ProjectBriefData, now: string): Record<string, FieldSourceMeta> {
  return Object.fromEntries(
    flattenProvidedPaths(data)
      .filter((path) => !path.startsWith('meta.') && !path.startsWith('fieldMeta.'))
      .map((path) => [path, { source: 'user', confirmation: 'confirmed', updatedAt: now } satisfies FieldSourceMeta]),
  );
}

const DEMO_BRIEF_DATA: ProjectBriefData = {
  schemaVersion: LEGACY_BRIEF_SCHEMA_VERSION,
  meta: { createdAt: NOW, updatedAt: NOW, completionStatus: 'ready_for_funnel' },
  project: {
    slug: 'maquina-de-receita-com-ia',
    name: 'Máquina de Receita com IA',
    ownerName: 'Academia Lendária',
    startingPoint: 'rodando',
    offerType: 'especialista',
    operator: 'dono',
    regulatedNiche: 'nao',
    voice: 'marca',
    ticketRange: 'medio',
    currentStage: 'trafego',
  },
  market: {
    niche: 'educação em marketing e inteligência artificial',
    productCategory: 'cohort ao vivo',
    targetAudience: 'Empreendedores e operadores que querem construir uma máquina de receita com IA.',
    avatarSummary: 'Profissional não técnico que já tentou ferramentas isoladas e precisa de um sistema executável.',
    dominantPain: 'Tem muitas ferramentas e ideias, mas não consegue transformar isso em uma operação de marketing contínua.',
    objections: ['não sou técnico', 'não tenho equipe', 'já tentei automações soltas'],
    desiredTransformation: 'Operar um funil e uma rotina de tráfego com IA sem depender de código.',
    awarenessLevel: 2,
    marketSophistication: 'maduro',
    trafficTemperature: 'frio',
    trafficSource: 'ads-frio',
    researchMode: 'hibrido',
  },
  offer: {
    name: 'Máquina de Receita com IA',
    productName: 'Cohort de Marketing',
    promise: 'Montar uma máquina de marketing com IA em quatro semanas.',
    uniqueMechanism: 'Skills especializadas operadas como um squad.',
    exactPrice: 1997,
    anchorPrice: 4997,
    guarantee: 'Garantia conforme os termos oficiais da oferta.',
    deliverables: ['Aulas ao vivo', 'Skills do cohort', 'Templates operacionais', 'Suporte em grupo'],
    proofAssets: ['Demonstrações dos artefatos', 'Casos da Academia Lendária'],
  },
  brand: {
    designMode: 'usar-existente',
    vibeWords: ['editorial', 'rigoroso', 'lendário'],
    colors: ['#D6B25E', '#0B0B0C', '#F4F1E8'],
    approvedDirection: true,
  },
  funnel: {
    recommendedFormat: 'webinario',
    closingDestination: 'checkout',
  },
  channels: {
    primaryCtaText: 'Quero construir minha máquina',
    primaryCtaUrl: 'https://academialendaria.com.br',
    adChannels: ['meta'],
    adFormats: ['reels', 'feed'],
    creativeScope: 'Bateria de validação para público frio.',
  },
  data: { analyticsVariant: 'venda-direta', dataSourceNotes: 'Dados do projeto demo.' },
  integrations: {
    apifyStatus: 'configured',
    openRouterStatus: 'not_needed',
    activeCampaignStatus: 'unknown',
    calendarStatus: 'not_needed',
  },
  fieldMeta: {},
};

const DEMO_BRIEF: ProjectBriefRevision = {
  schemaVersion: PROJECT_BRIEF_SCHEMA_VERSION,
  id: 'demo-brief-revision-1',
  workspaceId: DEMO_WORKSPACE_ID,
  projectId: DEMO_PROJECT_ID,
  revision: 1,
  status: 'active',
  createdAt: NOW,
  updatedAt: NOW,
  data: DEMO_BRIEF_DATA,
  fieldSources: confirmedFieldSources(DEMO_BRIEF_DATA, NOW),
};

const DEMO_PROJECT: MarketingProject = {
  id: DEMO_PROJECT_ID,
  workspaceId: DEMO_WORKSPACE_ID,
  slug: 'maquina-de-receita-com-ia',
  name: 'Máquina de Receita com IA',
  status: 'active',
  activeBriefRevisionId: DEMO_BRIEF.id,
  createdAt: NOW,
  updatedAt: NOW,
};

const DEMO_ARTIFACTS: ProjectArtifact[] = [
  ['avatar', 'Avatar e pesquisa', 'avatar.md', 'markdown'],
  ['competitorDossier', 'Dossiê competitivo', 'espiao/dossie-referencia.md', 'markdown'],
  ['trendReport', 'Tendências do mercado', 'trends-2026-07.md', 'markdown'],
  ['swipeBrief', 'Briefing do swipe file', 'swipe/briefing-swipe-file.md', 'markdown'],
  ['offerbook', 'Offerbook', 'offerbook.md', 'markdown'],
  ['design', 'Sistema visual', 'DESIGN.md', 'markdown'],
  ['funnel', 'Mapa do funil', 'funil.md', 'markdown'],
  ['copy', 'Fundação de copy', 'copy.md', 'markdown'],
].map(([artifactType, title, path, format], index) => ({
  id: `demo-artifact-${index + 1}`,
  workspaceId: DEMO_WORKSPACE_ID,
  projectId: DEMO_PROJECT_ID,
  artifactType,
  title,
  path,
  format: format as ProjectArtifact['format'],
  state: 'confirmed',
  verification: 'confirmed',
  source: 'demo',
  createdAt: NOW,
  updatedAt: NOW,
}));

/**
 * Estados de hidratação da UI (AC2 — STORY-8.W2.1).
 *
 * `idle`: ainda não hidratou (boot). `loading`: hidratação em curso.
 * `ready`/`empty`: hidratação concluída (com ou sem projetos) — a UI real
 * renderiza normalmente nos dois casos, cada tela decide como exibir a
 * ausência de dados. `error`/`offline`: hidratação falhou. `conflict`: uma
 * escrita de autosave colidiu com uma revisão concorrente e precisa de
 * reconciliação explícita antes de aceitar novas edições daquele projeto.
 */
export type HydrationStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'offline' | 'conflict';

export interface HydrationConflict {
  projectId: string;
  message: string;
}

export interface HydrationState {
  status: HydrationStatus;
  error: string | null;
  conflict: HydrationConflict | null;
}

/** Snapshot completo do cache — usado pelo controller para repor o estado após hidratar. */
export interface ProjectCacheSnapshot {
  projects: MarketingProject[];
  briefRevisions: ProjectBriefRevision[];
  artifacts: ProjectArtifact[];
  skillRuns: SkillRun[];
  campaignPlans?: CampaignPlanRevision[];
  weeklyPanels?: WeeklyPanel[];
  activeProjectId?: string | null;
}

/**
 * Sink de persistência opcional (STORY-8.W2.1): o controller/hook de
 * workspace (`use-project-workspace.ts`) se registra aqui em modo real para
 * que as mutations legadas do store (chamadas pelas telas existentes) também
 * disparem autosave contra o repository. Em modo demo nenhum sink é ligado —
 * as mutations permanecem 100% locais.
 */
export interface ProjectPersistenceSink {
  onBriefFieldChange: (projectId: string, path: string, value: unknown, source: FieldSourceMeta['source']) => void;
  onFieldNotApplicable: (projectId: string, path: string) => void;
}

export interface ProjectState {
  projects: MarketingProject[];
  briefRevisions: ProjectBriefRevision[];
  artifacts: ProjectArtifact[];
  skillRuns: SkillRun[];
  campaignPlans: CampaignPlanRevision[];
  weeklyPanels: WeeklyPanel[];
  activeProjectId: string | null;
  hydration: HydrationState;
  persistenceSink: ProjectPersistenceSink | null;
  setActiveProject: (projectId: string) => void;
  createProject: (workspaceId: string, name: string) => string;
  updateBriefField: (projectId: string, path: string, value: unknown, source?: FieldSourceMeta['source']) => void;
  markFieldNotApplicable: (projectId: string, path: string) => void;
  importLegacyBrief: (workspaceId: string, input: ProjectBriefData & { artifacts?: Record<string, boolean> }) => string;
  addArtifact: (artifact: Omit<ProjectArtifact, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateArtifact: (artifactId: string, patch: Partial<ProjectArtifact>) => void;
  startSkillRun: (projectId: string, skillId: string, inputSnapshot?: Record<string, unknown>) => string;
  updateSkillRun: (runId: string, patch: Partial<SkillRun>) => void;
  upsertCampaignPlan: (plan: CampaignPlanRevision) => void;
  upsertWeeklyPanel: (panel: WeeklyPanel) => void;
  resetDemo: () => void;
  // ---- Cache API (STORY-8.W2.1) ----
  /** Liga/desliga o sink de autosave. `null` desliga (usado em modo demo). */
  bindPersistence: (sink: ProjectPersistenceSink | null) => void;
  beginHydration: () => void;
  replaceAll: (snapshot: ProjectCacheSnapshot) => void;
  clearAll: () => void;
  setHydrationError: (message: string) => void;
  setHydrationOffline: () => void;
  flagConflict: (projectId: string, message: string) => void;
  clearConflict: () => void;
  /** Aplica um projeto + sua 1ª revisão recém-criados no repository (controller). */
  applyCreatedProject: (project: MarketingProject, brief: ProjectBriefRevision) => void;
  /**
   * Instala `revision` como a revisão ativa de `projectId` (supersedendo a
   * anterior) e limpa qualquer conflito pendente. Serve tanto para o autosave
   * bem-sucedido (nova revisão) quanto para a reconciliação explícita pós-
   * conflito (revisão atual recarregada do repository).
   */
  applyBriefRevision: (projectId: string, revision: ProjectBriefRevision) => void;
}

function initialCollections(demoEnabled: boolean) {
  if (!demoEnabled) {
    return {
      projects: [] as MarketingProject[],
      briefRevisions: [] as ProjectBriefRevision[],
      artifacts: [] as ProjectArtifact[],
      skillRuns: [] as SkillRun[],
      campaignPlans: [] as CampaignPlanRevision[],
      weeklyPanels: [] as WeeklyPanel[],
      activeProjectId: null as string | null,
    };
  }
  return {
    projects: [DEMO_PROJECT],
    briefRevisions: [DEMO_BRIEF],
    artifacts: DEMO_ARTIFACTS,
    skillRuns: [] as SkillRun[],
    campaignPlans: [] as CampaignPlanRevision[],
    weeklyPanels: [] as WeeklyPanel[],
    activeProjectId: DEMO_PROJECT_ID,
  };
}

function initialHydration(demoEnabled: boolean): HydrationState {
  // Fixtures demo já estão "prontas" ao montar; modo real começa `idle` até o
  // controller de workspace chamar `beginHydration()`.
  return { status: demoEnabled ? 'ready' : 'idle', error: null, conflict: null };
}

/** No-op `Storage`: usado fora do modo demo para nunca depender do `localStorage` como SOT (AC1/AC4). */
function noopStorage(): Storage {
  return {
    length: 0,
    clear: () => {},
    getItem: () => null,
    key: () => null,
    removeItem: () => {},
    setItem: () => {},
  };
}

/**
 * Factory do store (STORY-8.W2.1): permite instanciar stores independentes
 * com `demoEnabled` explícito, tanto para os dois modos reais da app quanto
 * para testes (que não podem depender do `import.meta.env.MODE` global).
 */
export function createProjectStore(
  options: { demoEnabled?: boolean } = {},
): UseBoundStore<StoreApi<ProjectState>> {
  const demoEnabled = options.demoEnabled ?? defaultDemoEnabled();

  return create<ProjectState>()(
    persist(
      (set, get) => ({
        ...initialCollections(demoEnabled),
        hydration: initialHydration(demoEnabled),
        persistenceSink: null,
        setActiveProject: (projectId) => set({ activeProjectId: projectId }),
        createProject: (workspaceId, name) => {
          const now = new Date().toISOString();
          const projectId = id('project');
          const briefId = id('brief');
          const slug = slugifyProjectName(name);
          const data: ProjectBriefData = {
            schemaVersion: LEGACY_BRIEF_SCHEMA_VERSION,
            meta: { createdAt: now, updatedAt: now, completionStatus: 'draft' },
            project: { slug, name },
            market: {},
            offer: {},
            brand: {},
            funnel: {},
            channels: {},
            data: {},
            integrations: {},
            fieldMeta: {},
          };
          const project: MarketingProject = {
            id: projectId,
            workspaceId,
            slug,
            name,
            status: 'active',
            activeBriefRevisionId: briefId,
            createdAt: now,
            updatedAt: now,
          };
          const brief: ProjectBriefRevision = {
            schemaVersion: PROJECT_BRIEF_SCHEMA_VERSION,
            id: briefId,
            workspaceId,
            projectId,
            revision: 1,
            status: 'active',
            createdAt: now,
            updatedAt: now,
            data,
            fieldSources: confirmedFieldSources(data, now),
          };
          set((state) => ({
            projects: [...state.projects, project],
            briefRevisions: [...state.briefRevisions, brief],
            activeProjectId: projectId,
          }));
          return projectId;
        },
        updateBriefField: (projectId, path, value, source = 'user') => {
          const now = new Date().toISOString();
          set((state) => ({
            briefRevisions: state.briefRevisions.map((brief) => {
              if (brief.projectId !== projectId || brief.status !== 'active') return brief;
              const nextData = setPath(brief.data, path, value);
              return {
                ...brief,
                data: setPath(nextData, 'meta.updatedAt', now),
                fieldSources: {
                  ...brief.fieldSources,
                  [path]: { source, confirmation: 'confirmed', updatedAt: now },
                },
                updatedAt: now,
              };
            }),
            projects: state.projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    name: path === 'project.name' && typeof value === 'string' ? value : project.name,
                    slug: path === 'project.slug' && typeof value === 'string' ? value : project.slug,
                    updatedAt: now,
                  }
                : project,
            ),
          }));
          get().persistenceSink?.onBriefFieldChange(projectId, path, value, source);
        },
        markFieldNotApplicable: (projectId, path) => {
          const now = new Date().toISOString();
          set((state) => ({
            briefRevisions: state.briefRevisions.map((brief) =>
              brief.projectId === projectId && brief.status === 'active'
                ? {
                    ...brief,
                    fieldSources: {
                      ...brief.fieldSources,
                      [path]: { source: 'user', confirmation: 'not_applicable', updatedAt: now },
                    },
                    updatedAt: now,
                  }
                : brief,
            ),
          }));
          get().persistenceSink?.onFieldNotApplicable(projectId, path);
        },
        importLegacyBrief: (workspaceId, input) => {
          const now = new Date().toISOString();
          const projectId = id('project');
          const migrated = migrateLegacyBrief(input, {
            id: id('brief'),
            workspaceId,
            projectId,
            now,
          });
          const project: MarketingProject = {
            id: projectId,
            workspaceId,
            slug: String(input.project.slug),
            name: String(input.project.name || input.project.slug),
            status: 'active',
            activeBriefRevisionId: migrated.document.id,
            createdAt: now,
            updatedAt: now,
          };
          const declarations: ProjectArtifact[] = migrated.declaredArtifactTypes.map((artifactType) => ({
            id: id('artifact'),
            workspaceId,
            projectId,
            artifactType,
            title: artifactType,
            path: '',
            format: 'other',
            state: 'proposal',
            verification: 'pending',
            source: 'migration',
            createdAt: now,
            updatedAt: now,
          }));
          set((state) => ({
            projects: [...state.projects, project],
            briefRevisions: [...state.briefRevisions, migrated.document],
            artifacts: [...state.artifacts, ...declarations],
            activeProjectId: projectId,
          }));
          return projectId;
        },
        addArtifact: (artifact) => {
          const now = new Date().toISOString();
          const artifactId = id('artifact');
          set((state) => ({
            artifacts: [...state.artifacts, { ...artifact, id: artifactId, createdAt: now, updatedAt: now }],
          }));
          return artifactId;
        },
        updateArtifact: (artifactId, patch) => {
          const now = new Date().toISOString();
          set((state) => ({
            artifacts: state.artifacts.map((artifact) =>
              artifact.id === artifactId ? { ...artifact, ...patch, id: artifact.id, updatedAt: now } : artifact,
            ),
          }));
        },
        startSkillRun: (projectId, skillId, inputSnapshot = {}) => {
          const now = new Date().toISOString();
          const runId = id('run');
          const project = get().projects.find((candidate) => candidate.id === projectId);
          if (!project) throw new Error(`Projeto não encontrado: ${projectId}`);
          const run: SkillRun = {
            id: runId,
            workspaceId: project.workspaceId,
            projectId,
            skillId,
            status: 'queued',
            skillHash: 'catalog-v1-local',
            inputSnapshot,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({ skillRuns: [...state.skillRuns, run] }));
          return runId;
        },
        updateSkillRun: (runId, patch) => {
          const now = new Date().toISOString();
          set((state) => ({
            skillRuns: state.skillRuns.map((run) =>
              run.id === runId ? { ...run, ...patch, id: run.id, updatedAt: now } : run,
            ),
          }));
        },
        upsertCampaignPlan: (plan) => set((state) => ({
          campaignPlans: [...state.campaignPlans.filter((candidate) => candidate.id !== plan.id), plan],
        })),
        upsertWeeklyPanel: (panel) => set((state) => ({
          weeklyPanels: [...state.weeklyPanels.filter((candidate) => candidate.id !== panel.id), panel],
        })),
        // Utilitário explícito (usado por testes de componente): sempre repõe o
        // fixture demo, independente do `demoEnabled` da instância — não é o
        // boot automático da store, então não é afetado pelo gate da AC4.
        resetDemo: () => set({ ...initialCollections(true), hydration: initialHydration(true) }),
        bindPersistence: (sink) => set({ persistenceSink: sink }),
        beginHydration: () =>
          set((state) => ({ hydration: { status: 'loading', error: null, conflict: state.hydration.conflict } })),
        replaceAll: (snapshot) =>
          set({
            projects: snapshot.projects,
            briefRevisions: snapshot.briefRevisions,
            artifacts: snapshot.artifacts,
            skillRuns: snapshot.skillRuns,
            ...(snapshot.campaignPlans ? { campaignPlans: snapshot.campaignPlans } : {}),
            ...(snapshot.weeklyPanels ? { weeklyPanels: snapshot.weeklyPanels } : {}),
            activeProjectId: snapshot.activeProjectId ?? get().activeProjectId,
            hydration: { status: snapshot.projects.length ? 'ready' : 'empty', error: null, conflict: null },
          }),
        clearAll: () =>
          set({
            ...initialCollections(false),
            hydration: { status: 'idle', error: null, conflict: null },
          }),
        setHydrationError: (message) => set({ hydration: { status: 'error', error: message, conflict: null } }),
        setHydrationOffline: () => set({ hydration: { status: 'offline', error: null, conflict: null } }),
        flagConflict: (projectId, message) =>
          set({ hydration: { status: 'conflict', error: null, conflict: { projectId, message } } }),
        clearConflict: () =>
          set((state) => ({
            hydration: { status: state.projects.length ? 'ready' : 'empty', error: null, conflict: null },
          })),
        applyCreatedProject: (project, brief) =>
          set((state) => ({
            projects: [...state.projects, project],
            briefRevisions: [...state.briefRevisions, brief],
            activeProjectId: project.id,
            hydration: { status: 'ready', error: null, conflict: null },
          })),
        applyBriefRevision: (projectId, revision) =>
          set((state) => ({
            briefRevisions: [
              ...state.briefRevisions.filter((rev) => rev.id !== revision.id),
              revision,
            ].map((rev) =>
              rev.projectId === projectId && rev.id !== revision.id && rev.status === 'active'
                ? { ...rev, status: 'superseded' as const }
                : rev,
            ),
            projects: state.projects.map((project) =>
              project.id === projectId
                ? { ...project, activeBriefRevisionId: revision.id, updatedAt: revision.updatedAt }
                : project,
            ),
            hydration: { status: state.projects.length ? 'ready' : 'empty', error: null, conflict: null },
          })),
      }),
      {
        name: 'cohort-marketing-studio.project-state',
        version: 1,
        storage: createJSONStorage(() => (demoEnabled ? localStorage : noopStorage())),
        partialize: (state) => ({
          projects: state.projects,
          briefRevisions: state.briefRevisions,
          artifacts: state.artifacts,
          skillRuns: state.skillRuns,
          campaignPlans: state.campaignPlans,
          weeklyPanels: state.weeklyPanels,
          activeProjectId: state.activeProjectId,
        }),
      },
    ),
  );
}

export const useProjectStore = createProjectStore();

export function activeBriefFor(projectId: string, revisions: ProjectBriefRevision[]): ProjectBriefRevision | null {
  return revisions
    .filter((revision) => revision.projectId === projectId && revision.status === 'active')
    .sort((a, b) => b.revision - a.revision)[0] ?? null;
}
