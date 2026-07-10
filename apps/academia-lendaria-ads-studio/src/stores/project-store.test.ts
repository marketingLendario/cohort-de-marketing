import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectStore, DEMO_PROJECT_ID } from '@/stores/project-store';
import { getPath } from '@/lib/project-domain';
import type { MarketingProject, ProjectBriefRevision } from '@/lib/project-domain';

describe('project store — modo demo (fixtures locais)', () => {
  // Storage local isolado por teste: o store demo persiste em `localStorage`
  // (comportamento intencional do modo demo); limpar evita bleed entre testes.
  beforeEach(() => localStorage.clear());

  function demoStore() {
    return createProjectStore({ demoEnabled: true });
  }

  it('carrega o projeto fixture ao criar o store', () => {
    const store = demoStore();
    expect(store.getState().projects.some((project) => project.id === DEMO_PROJECT_ID)).toBe(true);
    expect(store.getState().hydration.status).toBe('ready');
  });

  it('persists an explicit false with confirmed provenance', () => {
    const store = demoStore();
    store.getState().updateBriefField(DEMO_PROJECT_ID, 'brand.approvedDirection', false);
    const brief = store.getState().briefRevisions.find((candidate) => candidate.projectId === DEMO_PROJECT_ID);
    expect(getPath(brief?.data, 'brand.approvedDirection').value).toBe(false);
    expect(brief?.fieldSources['brand.approvedDirection']?.confirmation).toBe('confirmed');
  });

  it('imports declared artifacts as pending instead of completed', () => {
    const store = demoStore();
    const projectId = store.getState().importLegacyBrief('workspace-import', {
      schemaVersion: '0.1.0',
      project: { slug: 'importado', name: 'Importado' },
      artifacts: { offerbook: true },
    });
    const artifact = store.getState().artifacts.find((candidate) => candidate.projectId === projectId);
    expect(artifact?.artifactType).toBe('offerbook');
    expect(artifact?.verification).toBe('pending');
    expect(artifact?.state).toBe('proposal');
  });

  it('creates isolated project and brief records', () => {
    const store = demoStore();
    const projectId = store.getState().createProject('workspace-2', 'Projeto Novo');
    const project = store.getState().projects.find((candidate) => candidate.id === projectId);
    const brief = store.getState().briefRevisions.find((candidate) => candidate.projectId === projectId);
    expect(project?.slug).toBe('projeto-novo');
    expect(brief?.workspaceId).toBe('workspace-2');
  });

  it('resetDemo volta ao fixture original', () => {
    const store = demoStore();
    store.getState().createProject('workspace-2', 'Projeto Novo');
    store.getState().resetDemo();
    expect(store.getState().projects).toHaveLength(1);
    expect(store.getState().projects[0]?.id).toBe(DEMO_PROJECT_ID);
  });
});

describe('project store — modo real (cache de hidratação)', () => {
  function realStore() {
    return createProjectStore({ demoEnabled: false });
  }

  it('inicia vazio e com hidratação idle, sem fixtures', () => {
    const store = realStore();
    expect(store.getState().projects).toEqual([]);
    expect(store.getState().briefRevisions).toEqual([]);
    expect(store.getState().hydration).toEqual({ status: 'idle', error: null, conflict: null });
  });

  it('beginHydration move para loading preservando conflito anterior como null', () => {
    const store = realStore();
    store.getState().beginHydration();
    expect(store.getState().hydration.status).toBe('loading');
  });

  it('replaceAll com projetos marca ready; sem projetos marca empty', () => {
    const store = realStore();
    const project: MarketingProject = {
      id: 'p1',
      workspaceId: 'ws1',
      slug: 'p1',
      name: 'Projeto 1',
      status: 'active',
      activeBriefRevisionId: 'b1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    store.getState().replaceAll({ projects: [project], briefRevisions: [], artifacts: [], skillRuns: [] });
    expect(store.getState().hydration.status).toBe('ready');
    expect(store.getState().projects).toEqual([project]);

    store.getState().replaceAll({ projects: [], briefRevisions: [], artifacts: [], skillRuns: [] });
    expect(store.getState().hydration.status).toBe('empty');
  });

  it('setHydrationError e setHydrationOffline refletem falhas de hidratação', () => {
    const store = realStore();
    store.getState().setHydrationError('falha de rede');
    expect(store.getState().hydration).toEqual({ status: 'error', error: 'falha de rede', conflict: null });

    store.getState().setHydrationOffline();
    expect(store.getState().hydration).toEqual({ status: 'offline', error: null, conflict: null });
  });

  it('flagConflict bloqueia e clearConflict volta ao estado anterior', () => {
    const store = realStore();
    store.getState().replaceAll({
      projects: [
        {
          id: 'p1',
          workspaceId: 'ws1',
          slug: 'p1',
          name: 'Projeto 1',
          status: 'active',
          activeBriefRevisionId: 'b1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      briefRevisions: [],
      artifacts: [],
      skillRuns: [],
    });

    store.getState().flagConflict('p1', 'Revisão concorrente');
    expect(store.getState().hydration).toEqual({
      status: 'conflict',
      error: null,
      conflict: { projectId: 'p1', message: 'Revisão concorrente' },
    });

    store.getState().clearConflict();
    expect(store.getState().hydration).toEqual({ status: 'ready', error: null, conflict: null });
  });

  it('applyCreatedProject adiciona projeto+brief e ativa o projeto', () => {
    const store = realStore();
    const project: MarketingProject = {
      id: 'p1',
      workspaceId: 'ws1',
      slug: 'p1',
      name: 'Projeto 1',
      status: 'active',
      activeBriefRevisionId: 'b1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const brief: ProjectBriefRevision = {
      schemaVersion: '1.0.0',
      id: 'b1',
      workspaceId: 'ws1',
      projectId: 'p1',
      revision: 1,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      data: { schemaVersion: '0.1.0', project: { slug: 'p1', name: 'Projeto 1' } },
      fieldSources: {},
    };
    store.getState().applyCreatedProject(project, brief);
    expect(store.getState().projects).toEqual([project]);
    expect(store.getState().briefRevisions).toEqual([brief]);
    expect(store.getState().activeProjectId).toBe('p1');
    expect(store.getState().hydration.status).toBe('ready');
  });

  it('applyBriefRevision supersede a revisão ativa anterior e atualiza o projeto', () => {
    const store = realStore();
    const baseBrief: ProjectBriefRevision = {
      schemaVersion: '1.0.0',
      id: 'b1',
      workspaceId: 'ws1',
      projectId: 'p1',
      revision: 1,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      data: { schemaVersion: '0.1.0', project: { slug: 'p1', name: 'Projeto 1' } },
      fieldSources: {},
    };
    store.getState().applyCreatedProject(
      {
        id: 'p1',
        workspaceId: 'ws1',
        slug: 'p1',
        name: 'Projeto 1',
        status: 'active',
        activeBriefRevisionId: 'b1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      baseBrief,
    );

    const nextBrief: ProjectBriefRevision = { ...baseBrief, id: 'b2', revision: 2, updatedAt: '2026-01-02T00:00:00.000Z' };
    store.getState().applyBriefRevision('p1', nextBrief);

    const revisions = store.getState().briefRevisions;
    expect(revisions.find((rev) => rev.id === 'b1')?.status).toBe('superseded');
    expect(revisions.find((rev) => rev.id === 'b2')?.status).toBe('active');
    expect(store.getState().projects[0]?.activeBriefRevisionId).toBe('b2');
    expect(store.getState().hydration.status).toBe('ready');
  });

  it('clearAll volta ao cache vazio e hidratação idle', () => {
    const store = realStore();
    store.getState().replaceAll({
      projects: [
        {
          id: 'p1',
          workspaceId: 'ws1',
          slug: 'p1',
          name: 'Projeto 1',
          status: 'active',
          activeBriefRevisionId: 'b1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      briefRevisions: [],
      artifacts: [],
      skillRuns: [],
    });
    store.getState().clearAll();
    expect(store.getState().projects).toEqual([]);
    expect(store.getState().hydration).toEqual({ status: 'idle', error: null, conflict: null });
  });

  it('bindPersistence liga o sink de autosave às mutations legadas', () => {
    const store = realStore();
    store.getState().applyCreatedProject(
      {
        id: 'p1',
        workspaceId: 'ws1',
        slug: 'p1',
        name: 'Projeto 1',
        status: 'active',
        activeBriefRevisionId: 'b1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        schemaVersion: '1.0.0',
        id: 'b1',
        workspaceId: 'ws1',
        projectId: 'p1',
        revision: 1,
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        data: { schemaVersion: '0.1.0', project: { slug: 'p1', name: 'Projeto 1' } },
        fieldSources: {},
      },
    );

    const onBriefFieldChange = vi.fn();
    const onFieldNotApplicable = vi.fn();
    store.getState().bindPersistence({ onBriefFieldChange, onFieldNotApplicable });

    store.getState().updateBriefField('p1', 'offer.exactPrice', 0);
    expect(onBriefFieldChange).toHaveBeenCalledWith('p1', 'offer.exactPrice', 0, 'user');
    expect(getPath(store.getState().briefRevisions[0]?.data, 'offer.exactPrice').value).toBe(0);

    store.getState().markFieldNotApplicable('p1', 'data.analyticsVariant');
    expect(onFieldNotApplicable).toHaveBeenCalledWith('p1', 'data.analyticsVariant');

    store.getState().bindPersistence(null);
    store.getState().updateBriefField('p1', 'offer.exactPrice', 10);
    expect(onBriefFieldChange).toHaveBeenCalledTimes(1);
  });
});
