import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RevisionConflictError, type ProjectRepository } from '@/lib/project-repository';
import {
  PROJECT_BRIEF_SCHEMA_VERSION,
  getPath,
  type CampaignPlanRevision,
  type MarketingProject,
  type ProjectArtifact,
  type ProjectBriefRevision,
  type SkillRun,
  type WeeklyPanel,
} from '@/lib/project-domain';
import { activeBriefFor, createProjectStore } from '@/stores/project-store';
import { AUTOSAVE_DEBOUNCE_MS, createProjectWorkspaceController } from '@/hooks/use-project-workspace';

/**
 * Repository fake em memória — implementa a interface completa para permitir
 * duas instâncias de controller (duas "sessões") apontarem para o MESMO
 * banco fake e provarem round-trip (AC5) e conflito de revisão (AC3).
 */
function createFakeRepository(): ProjectRepository {
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}-${++seq}`;
  const now = () => '2026-07-09T12:00:00.000Z';

  const projects: MarketingProject[] = [];
  const briefRevisions: ProjectBriefRevision[] = [];
  const artifacts: ProjectArtifact[] = [];
  const skillRuns: SkillRun[] = [];
  const campaignPlans: CampaignPlanRevision[] = [];
  const weeklyPanels: WeeklyPanel[] = [];

  return {
    async listProjects(workspaceId) {
      return projects.filter((p) => p.workspaceId === workspaceId);
    },
    async getProject(workspaceId, id) {
      return projects.find((p) => p.workspaceId === workspaceId && p.id === id) ?? null;
    },
    async getProjectBySlug(workspaceId, slug) {
      return projects.find((p) => p.workspaceId === workspaceId && p.slug === slug) ?? null;
    },
    async createProject(input) {
      const project: MarketingProject = {
        id: nextId('project'),
        workspaceId: input.workspaceId,
        slug: input.slug,
        name: input.name,
        status: input.status ?? 'active',
        activeBriefRevisionId: '',
        createdAt: now(),
        updatedAt: now(),
      };
      projects.push(project);
      return project;
    },
    async updateProject(workspaceId, id, patch) {
      const index = projects.findIndex((p) => p.workspaceId === workspaceId && p.id === id);
      if (index === -1) throw new Error(`Projeto não encontrado: ${id}`);
      const current = projects[index]!;
      const updated: MarketingProject = {
        ...current,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.activeBriefRevisionId !== undefined
          ? { activeBriefRevisionId: patch.activeBriefRevisionId ?? '' }
          : {}),
        updatedAt: now(),
      };
      projects[index] = updated;
      return updated;
    },
    async listBriefRevisions(workspaceId, projectId) {
      return briefRevisions
        .filter((r) => r.workspaceId === workspaceId && r.projectId === projectId)
        .sort((a, b) => b.revision - a.revision);
    },
    async getActiveBrief(workspaceId, projectId) {
      return (
        briefRevisions.find(
          (r) => r.workspaceId === workspaceId && r.projectId === projectId && r.status === 'active',
        ) ?? null
      );
    },
    async createBriefRevision(input) {
      const collides = briefRevisions.some(
        (r) => r.workspaceId === input.workspaceId && r.projectId === input.projectId && r.revision === input.revision,
      );
      if (collides) throw new RevisionConflictError('project_brief_revisions');
      // Simula a exclusividade de "1 revisão ativa por projeto" que o schema
      // real garante no backend (fora do escopo desta story).
      if (input.status === 'active') {
        for (const revision of briefRevisions) {
          if (revision.workspaceId === input.workspaceId && revision.projectId === input.projectId && revision.status === 'active') {
            revision.status = 'superseded';
          }
        }
      }
      const row: ProjectBriefRevision = {
        schemaVersion: PROJECT_BRIEF_SCHEMA_VERSION,
        id: nextId('brief'),
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        revision: input.revision,
        status: input.status,
        createdAt: now(),
        updatedAt: now(),
        data: input.data,
        fieldSources: input.fieldSources ?? {},
      };
      briefRevisions.push(row);
      return row;
    },
    async listArtifacts(workspaceId, projectId) {
      return artifacts.filter((a) => a.workspaceId === workspaceId && a.projectId === projectId);
    },
    async upsertArtifact(input) {
      const row: ProjectArtifact = {
        id: input.id ?? nextId('artifact'),
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        artifactType: input.artifactType,
        title: input.title,
        path: input.path ?? '',
        format: input.format,
        state: input.state,
        verification: input.verification,
        source: input.source,
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.hash !== undefined ? { hash: input.hash } : {}),
        ...(input.skillRunId !== undefined ? { skillRunId: input.skillRunId } : {}),
        createdAt: now(),
        updatedAt: now(),
      };
      const index = artifacts.findIndex((a) => a.id === row.id);
      if (index === -1) artifacts.push(row);
      else artifacts[index] = row;
      return row;
    },
    async listSkillRuns(workspaceId, projectId) {
      return skillRuns.filter((r) => r.workspaceId === workspaceId && r.projectId === projectId);
    },
    async createSkillRun(input) {
      const row: SkillRun = {
        id: nextId('run'),
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        skillId: input.skillId,
        status: input.status,
        skillHash: input.skillHash,
        inputSnapshot: input.inputSnapshot ?? {},
        createdAt: now(),
        updatedAt: now(),
      };
      skillRuns.push(row);
      return row;
    },
    async updateSkillRun(workspaceId, id, patch) {
      const index = skillRuns.findIndex((r) => r.workspaceId === workspaceId && r.id === id);
      if (index === -1) throw new Error(`Skill run não encontrado: ${id}`);
      const updated = { ...skillRuns[index]!, ...patch, updatedAt: now() } as SkillRun;
      skillRuns[index] = updated;
      return updated;
    },
    async listCampaignPlanRevisions(workspaceId, campaignId) {
      return campaignPlans
        .filter((p) => p.campaignId === campaignId && projects.some((proj) => proj.id === p.projectId && proj.workspaceId === workspaceId))
        .sort((a, b) => b.revision - a.revision);
    },
    async getLatestCampaignPlan(workspaceId, campaignId) {
      const matches = campaignPlans
        .filter((p) => p.campaignId === campaignId && projects.some((proj) => proj.id === p.projectId && proj.workspaceId === workspaceId))
        .sort((a, b) => b.revision - a.revision);
      return matches[0] ?? null;
    },
    async createCampaignPlanRevision(input) {
      const row: CampaignPlanRevision = { ...input.data, id: nextId('campaign-plan'), projectId: input.projectId, campaignId: input.campaignId, revision: input.revision };
      campaignPlans.push(row);
      return row;
    },
    async listCampaignPlanRevisionsForProject(workspaceId, projectId) {
      return campaignPlans
        .filter((p) => p.projectId === projectId && projects.some((proj) => proj.id === projectId && proj.workspaceId === workspaceId))
        .sort((a, b) => b.revision - a.revision);
    },
    async listWeeklyPanels(workspaceId, campaignId) {
      return weeklyPanels
        .filter((p) => p.campaignId === campaignId && projects.some((proj) => proj.id === p.projectId && proj.workspaceId === workspaceId))
        .sort((a, b) => (a.weekStart < b.weekStart ? 1 : a.weekStart > b.weekStart ? -1 : b.revision - a.revision));
    },
    async getLatestWeeklyPanel(workspaceId, campaignId, weekStart) {
      const matches = weeklyPanels
        .filter(
          (p) =>
            p.campaignId === campaignId &&
            p.weekStart === weekStart &&
            projects.some((proj) => proj.id === p.projectId && proj.workspaceId === workspaceId),
        )
        .sort((a, b) => b.revision - a.revision);
      return matches[0] ?? null;
    },
    async createWeeklyPanelRevision(input) {
      const row: WeeklyPanel = {
        ...input.data,
        id: nextId('weekly-panel'),
        projectId: input.projectId,
        campaignId: input.campaignId,
        weekStart: input.weekStart,
        revision: input.revision,
        status: input.status,
      };
      weeklyPanels.push(row);
      return row;
    },
    async listWeeklyPanelsForProject(workspaceId, projectId) {
      return weeklyPanels
        .filter((p) => p.projectId === projectId && projects.some((proj) => proj.id === projectId && proj.workspaceId === workspaceId))
        .sort((a, b) => (a.weekStart < b.weekStart ? 1 : a.weekStart > b.weekStart ? -1 : b.revision - a.revision));
    },
  };
}

const WORKSPACE_ID = 'ws-1';

describe('use-project-workspace — hidratação e criação', () => {
  it('hidrata um workspace vazio como empty (sem fixture)', async () => {
    const repository = createFakeRepository();
    const store = createProjectStore({ demoEnabled: false });
    const controller = createProjectWorkspaceController({ workspaceId: WORKSPACE_ID, repository, store, demoEnabled: false });

    await controller.hydrate();

    expect(store.getState().hydration.status).toBe('empty');
    expect(store.getState().projects).toEqual([]);
    controller.destroy();
  });

  it('createProject persiste no repository e atualiza o cache antes de retornar', async () => {
    const repository = createFakeRepository();
    const store = createProjectStore({ demoEnabled: false });
    const controller = createProjectWorkspaceController({ workspaceId: WORKSPACE_ID, repository, store, demoEnabled: false });

    const projectId = await controller.createProject('Novo Projeto');

    const project = store.getState().projects.find((p) => p.id === projectId);
    expect(project?.slug).toBe('novo-projeto');
    expect(project?.activeBriefRevisionId).toBeTruthy();

    const brief = activeBriefFor(projectId, store.getState().briefRevisions);
    expect(brief?.revision).toBe(1);
    expect(await repository.getProject(WORKSPACE_ID, projectId)).toMatchObject({ slug: 'novo-projeto' });
    controller.destroy();
  });
});

describe('use-project-workspace — autosave e conflito', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('agrupa múltiplas edições rápidas em um único flush debounced e preserva 0/false/not_applicable', async () => {
    vi.useFakeTimers();
    const repository = createFakeRepository();
    const store = createProjectStore({ demoEnabled: false });
    const controller = createProjectWorkspaceController({ workspaceId: WORKSPACE_ID, repository, store, demoEnabled: false });

    const projectId = await controller.createProject('Projeto Autosave');

    store.getState().updateBriefField(projectId, 'offer.exactPrice', 0);
    store.getState().updateBriefField(projectId, 'brand.approvedDirection', false);
    store.getState().markFieldNotApplicable(projectId, 'data.analyticsVariant');

    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS + 10);

    const revisions = await repository.listBriefRevisions(WORKSPACE_ID, projectId);
    // Uma única revisão nova (2) — as 3 edições foram agrupadas pelo debounce.
    expect(revisions.map((r) => r.revision).sort()).toEqual([1, 2]);

    const active = revisions.find((r) => r.status === 'active');
    expect(getPath(active?.data, 'offer.exactPrice').value).toBe(0);
    expect(getPath(active?.data, 'brand.approvedDirection').value).toBe(false);
    expect(active?.fieldSources['data.analyticsVariant']?.confirmation).toBe('not_applicable');

    controller.destroy();
  });

  it('flush explícito ignora o debounce e escreve imediatamente', async () => {
    const repository = createFakeRepository();
    const store = createProjectStore({ demoEnabled: false });
    const controller = createProjectWorkspaceController({ workspaceId: WORKSPACE_ID, repository, store, demoEnabled: false });

    const projectId = await controller.createProject('Projeto Flush');
    store.getState().updateBriefField(projectId, 'project.name', 'Projeto Flush Editado');

    await controller.flush(projectId);

    const revisions = await repository.listBriefRevisions(WORKSPACE_ID, projectId);
    expect(revisions).toHaveLength(2);
    controller.destroy();
  });

  it('um conflito de revisão concorrente bloqueia sem sobrescrever, e resolveConflict reconcilia explicitamente', async () => {
    const repository = createFakeRepository();
    const store = createProjectStore({ demoEnabled: false });
    const controller = createProjectWorkspaceController({ workspaceId: WORKSPACE_ID, repository, store, demoEnabled: false });

    const projectId = await controller.createProject('Projeto Conflito');
    store.getState().updateBriefField(projectId, 'offer.exactPrice', 500);

    // Simula outra sessão gravando a revisão 2 primeiro.
    const concurrent = await repository.createBriefRevision({
      workspaceId: WORKSPACE_ID,
      projectId,
      revision: 2,
      status: 'active',
      data: { schemaVersion: '0.1.0', project: { slug: 'projeto-conflito', name: 'Projeto Conflito (outra sessão)' } },
      fieldSources: {},
    });

    // Nosso flush local também tenta gravar a revisão 2 → colide.
    await controller.flush(projectId);

    expect(store.getState().hydration.status).toBe('conflict');
    expect(store.getState().hydration.conflict?.projectId).toBe(projectId);
    // A revisão concorrente NÃO foi sobrescrita.
    expect((await repository.getActiveBrief(WORKSPACE_ID, projectId))?.id).toBe(concurrent.id);

    await controller.resolveConflict(projectId);

    expect(store.getState().hydration.status).toBe('ready');
    const reconciled = activeBriefFor(projectId, store.getState().briefRevisions);
    expect(reconciled?.id).toBe(concurrent.id);
    expect(getPath(reconciled?.data, 'project.name').value).toBe('Projeto Conflito (outra sessão)');

    controller.destroy();
  });
});

describe('use-project-workspace — round-trip entre sessões', () => {
  it('um novo controller/store sobre o mesmo repository recupera projeto, briefing, artefatos e skill runs', async () => {
    const repository = createFakeRepository();

    const storeA = createProjectStore({ demoEnabled: false });
    const controllerA = createProjectWorkspaceController({
      workspaceId: WORKSPACE_ID,
      repository,
      store: storeA,
      demoEnabled: false,
    });
    const projectId = await controllerA.createProject('Projeto Sessão A');
    storeA.getState().updateBriefField(projectId, 'offer.exactPrice', 0);
    storeA.getState().markFieldNotApplicable(projectId, 'data.analyticsVariant');
    await controllerA.flush(projectId);
    await repository.upsertArtifact({
      workspaceId: WORKSPACE_ID,
      projectId,
      artifactType: 'offerbook',
      title: 'Offerbook',
      format: 'markdown',
      state: 'confirmed',
      verification: 'confirmed',
      source: 'skill_run',
    });
    await repository.createSkillRun({
      workspaceId: WORKSPACE_ID,
      projectId,
      skillId: 'offerbook',
      skillHash: 'catalog-v1-fake',
      status: 'done',
      inputSnapshot: { niche: 'marketing' },
    });
    controllerA.destroy();

    // "Nova sessão": store e controller completamente novos, mesmo repository fake.
    const storeB = createProjectStore({ demoEnabled: false });
    const controllerB = createProjectWorkspaceController({
      workspaceId: WORKSPACE_ID,
      repository,
      store: storeB,
      demoEnabled: false,
    });
    await controllerB.hydrate();

    expect(storeB.getState().projects.map((p) => p.id)).toEqual([projectId]);
    const brief = activeBriefFor(projectId, storeB.getState().briefRevisions);
    expect(getPath(brief?.data, 'offer.exactPrice').value).toBe(0);
    expect(brief?.fieldSources['data.analyticsVariant']?.confirmation).toBe('not_applicable');
    expect(storeB.getState().artifacts).toHaveLength(1);
    expect(storeB.getState().artifacts[0]?.artifactType).toBe('offerbook');
    expect(storeB.getState().skillRuns).toHaveLength(1);
    expect(storeB.getState().skillRuns[0]?.skillId).toBe('offerbook');

    controllerB.destroy();
  });

  it('um novo controller/store sobre o mesmo repository recupera campaign plans e weekly panels do projeto (AC5)', async () => {
    const repository = createFakeRepository();

    const storeA = createProjectStore({ demoEnabled: false });
    const controllerA = createProjectWorkspaceController({
      workspaceId: WORKSPACE_ID,
      repository,
      store: storeA,
      demoEnabled: false,
    });
    const projectId = await controllerA.createProject('Projeto Sessão A — Campanhas');
    const campaignId = 'campaign-1';

    const planData = {
      schemaVersion: '1.0.0',
      sourceBrief: { id: 'brief-x', revision: 1 },
      platform: 'meta',
      objective: 'sales',
      budget: { daily: 100, periodDays: 7, currency: 'BRL' },
      angles: [],
      finalists: [],
      tracking: { status: 'PENDING', criticalItemsConfirmed: false, checks: {} },
      structure: null,
      manualSubmission: { status: 'not_ready' },
      overrides: {},
      updatedAt: '2026-07-09T12:00:00.000Z',
    } as unknown as CampaignPlanRevision;
    await repository.createCampaignPlanRevision({
      workspaceId: WORKSPACE_ID,
      projectId,
      campaignId,
      revision: 1,
      data: planData,
    });

    const panelData = {
      schemaVersion: '1.0.0',
      metrics: [],
      reader: { literalOnly: true, sampleSufficientForCpa: false, note: '' },
      diagnosis: null,
      decision: { status: 'pending' },
      events: [],
    } as unknown as WeeklyPanel;
    await repository.createWeeklyPanelRevision({
      workspaceId: WORKSPACE_ID,
      projectId,
      campaignId,
      weekStart: '2026-07-06',
      revision: 1,
      status: 'draft',
      data: panelData,
    });
    controllerA.destroy();

    // "Nova sessão": store e controller completamente novos, mesmo repository fake.
    const storeB = createProjectStore({ demoEnabled: false });
    const controllerB = createProjectWorkspaceController({
      workspaceId: WORKSPACE_ID,
      repository,
      store: storeB,
      demoEnabled: false,
    });
    await controllerB.hydrate();

    expect(storeB.getState().campaignPlans).toHaveLength(1);
    expect(storeB.getState().campaignPlans[0]).toMatchObject({ projectId, campaignId, revision: 1 });
    expect(storeB.getState().weeklyPanels).toHaveLength(1);
    expect(storeB.getState().weeklyPanels[0]).toMatchObject({
      projectId,
      campaignId,
      weekStart: '2026-07-06',
      revision: 1,
      status: 'draft',
    });

    controllerB.destroy();
  });
});

describe('use-project-workspace — offline', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: originalOnLine });
  });

  it('marca offline sem chamar o repository quando o navegador está offline', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    const repository = createFakeRepository();
    const listProjects = vi.spyOn(repository, 'listProjects');
    const store = createProjectStore({ demoEnabled: false });
    const controller = createProjectWorkspaceController({ workspaceId: WORKSPACE_ID, repository, store, demoEnabled: false });

    await controller.hydrate();

    expect(store.getState().hydration.status).toBe('offline');
    expect(listProjects).not.toHaveBeenCalled();
    controller.destroy();
  });
});
