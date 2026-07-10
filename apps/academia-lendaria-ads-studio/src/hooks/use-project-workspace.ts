import { useCallback, useEffect, useRef } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import { DEMO_AUTH_ENABLED } from '@/lib/demo-mode';
import {
  RevisionConflictError,
  createSupabaseProjectRepository,
  type ProjectRepository,
} from '@/lib/project-repository';
import {
  LEGACY_BRIEF_SCHEMA_VERSION,
  slugifyProjectName,
  type CampaignPlanRevision,
  type MarketingProject,
  type ProjectArtifact,
  type ProjectBriefData,
  type ProjectBriefRevision,
  type SkillRun,
  type WeeklyPanel,
} from '@/lib/project-domain';
import {
  activeBriefFor,
  useProjectStore,
  type HydrationConflict,
  type HydrationStatus,
  type ProjectPersistenceSink,
  type ProjectState,
} from '@/stores/project-store';

/**
 * Controller de hidratação/persistência do workspace de projetos
 * (STORY-8.W2.1 — AC1/AC3/AC5).
 *
 * Fora do modo demo, o Zustand (`useProjectStore`) é só cache: este módulo é
 * quem fala com o `ProjectRepository` (Supabase, SOT) e replica o resultado
 * no cache. Autosave dos campos do briefing é debounced com flush explícito;
 * um conflito de revisão (OCC) NUNCA sobrescreve — ele bloqueia via
 * `flagConflict` até uma reconciliação explícita (`resolveConflict`).
 */
export const AUTOSAVE_DEBOUNCE_MS = 800;

export interface ProjectWorkspaceDeps {
  workspaceId: string;
  repository?: ProjectRepository;
  store?: UseBoundStore<StoreApi<ProjectState>>;
  demoEnabled?: boolean;
  debounceMs?: number;
}

export interface ProjectWorkspaceController {
  hydrate: () => Promise<void>;
  createProject: (name: string) => Promise<string>;
  /** Força o flush imediato do autosave pendente de um projeto (ignora o debounce). */
  flush: (projectId: string) => Promise<void>;
  /** Recarrega a revisão ativa do repository e limpa o conflito, sem sobrescrever o servidor. */
  resolveConflict: (projectId: string) => Promise<void>;
  retry: () => Promise<void>;
  destroy: () => void;
}

function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return error instanceof TypeError;
}

function messageFor(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Falha ao carregar os dados do projeto.';
}

function emptyBriefData(slug: string, name: string, now: string): ProjectBriefData {
  return {
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
}

/**
 * Factory pura e injetável do controller — sem React. Usada pelo hook
 * `useProjectWorkspace` e diretamente pelos testes (round-trip entre duas
 * instâncias de controller sobre o mesmo repository fake prova a "nova sessão").
 */
export function createProjectWorkspaceController(deps: ProjectWorkspaceDeps): ProjectWorkspaceController {
  const store = deps.store ?? useProjectStore;
  const repository = deps.repository ?? createSupabaseProjectRepository();
  const demoEnabled = deps.demoEnabled ?? DEMO_AUTH_ENABLED;
  const debounceMs = deps.debounceMs ?? AUTOSAVE_DEBOUNCE_MS;
  const { workspaceId } = deps;

  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let destroyed = false;

  async function loadWorkspaceSnapshot(): Promise<{
    projects: MarketingProject[];
    briefRevisions: ProjectBriefRevision[];
    artifacts: ProjectArtifact[];
    skillRuns: SkillRun[];
    campaignPlans: CampaignPlanRevision[];
    weeklyPanels: WeeklyPanel[];
  }> {
    const projects = await repository.listProjects(workspaceId);
    const [briefRevisions, artifacts, skillRuns, campaignPlans, weeklyPanels] = await Promise.all([
      Promise.all(projects.map((project) => repository.listBriefRevisions(workspaceId, project.id))).then((lists) =>
        lists.flat(),
      ),
      Promise.all(projects.map((project) => repository.listArtifacts(workspaceId, project.id))).then((lists) =>
        lists.flat(),
      ),
      Promise.all(projects.map((project) => repository.listSkillRuns(workspaceId, project.id))).then((lists) =>
        lists.flat(),
      ),
      Promise.all(
        projects.map((project) => repository.listCampaignPlanRevisionsForProject(workspaceId, project.id)),
      ).then((lists) => lists.flat()),
      Promise.all(projects.map((project) => repository.listWeeklyPanelsForProject(workspaceId, project.id))).then(
        (lists) => lists.flat(),
      ),
    ]);
    return { projects, briefRevisions, artifacts, skillRuns, campaignPlans, weeklyPanels };
  }

  async function hydrate(): Promise<void> {
    if (demoEnabled) return; // fixtures já carregadas no cache (hydration inicial = 'ready').
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      store.getState().setHydrationOffline();
      return;
    }
    store.getState().beginHydration();
    try {
      const snapshot = await loadWorkspaceSnapshot();
      if (destroyed) return;
      store.getState().replaceAll({ ...snapshot, activeProjectId: store.getState().activeProjectId });
    } catch (error) {
      if (destroyed) return;
      if (isNetworkError(error)) store.getState().setHydrationOffline();
      else store.getState().setHydrationError(messageFor(error));
    }
  }

  async function createProject(name: string): Promise<string> {
    if (demoEnabled) return store.getState().createProject(workspaceId, name);

    const slug = slugifyProjectName(name);
    const now = new Date().toISOString();
    const project = await repository.createProject({ workspaceId, slug, name });
    const brief = await repository.createBriefRevision({
      workspaceId,
      projectId: project.id,
      revision: 1,
      status: 'active',
      data: emptyBriefData(slug, name, now),
      fieldSources: {},
    });
    const updatedProject = await repository.updateProject(workspaceId, project.id, {
      activeBriefRevisionId: brief.id,
    });
    store.getState().applyCreatedProject(updatedProject, brief);
    return updatedProject.id;
  }

  function scheduleFlush(projectId: string) {
    if (demoEnabled || destroyed) return;
    const existing = timers.get(projectId);
    if (existing) clearTimeout(existing);
    timers.set(
      projectId,
      setTimeout(() => {
        timers.delete(projectId);
        void flush(projectId);
      }, debounceMs),
    );
  }

  async function flush(projectId: string): Promise<void> {
    const pending = timers.get(projectId);
    if (pending) {
      clearTimeout(pending);
      timers.delete(projectId);
    }
    if (demoEnabled || destroyed) return;

    const state = store.getState();
    if (state.hydration.status === 'conflict') return; // aguarda reconciliação explícita antes de tentar de novo
    const project = state.projects.find((candidate) => candidate.id === projectId);
    const brief = activeBriefFor(projectId, state.briefRevisions);
    if (!project || !brief) return;

    try {
      const created = await repository.createBriefRevision({
        workspaceId: project.workspaceId,
        projectId,
        revision: brief.revision + 1,
        status: 'active',
        data: brief.data,
        fieldSources: brief.fieldSources,
      });
      await repository.updateProject(project.workspaceId, projectId, { activeBriefRevisionId: created.id });
      if (destroyed) return;
      store.getState().applyBriefRevision(projectId, created);
    } catch (error) {
      if (destroyed) return;
      if (error instanceof RevisionConflictError) {
        store.getState().flagConflict(projectId, error.message);
      } else if (isNetworkError(error)) {
        store.getState().setHydrationOffline();
      } else {
        store.getState().setHydrationError(messageFor(error));
      }
    }
  }

  async function resolveConflict(projectId: string): Promise<void> {
    const state = store.getState();
    const project = state.projects.find((candidate) => candidate.id === projectId);
    if (!project) {
      store.getState().clearConflict();
      return;
    }
    try {
      // Não usamos `getActiveBrief` (filtra por `status='active'`): a
      // exclusividade de uma única revisão ativa por projeto é um risco P3
      // conhecido (deferido em 8.W1.1, fora do ownership desta story) — o
      // repository não expõe forma de "superseder" a revisão anterior.
      // O `revision` mais alto é a garantia real (índice único do OCC), então
      // reconciliamos por ele em vez de confiar no campo `status` da linha.
      const revisions = await repository.listBriefRevisions(project.workspaceId, projectId);
      if (destroyed) return;
      const latest = revisions.reduce<ProjectBriefRevision | null>(
        (acc, candidate) => (!acc || candidate.revision > acc.revision ? candidate : acc),
        null,
      );
      if (latest) store.getState().applyBriefRevision(projectId, { ...latest, status: 'active' });
      else store.getState().clearConflict();
    } catch (error) {
      if (destroyed) return;
      if (isNetworkError(error)) store.getState().setHydrationOffline();
      else store.getState().setHydrationError(messageFor(error));
    }
  }

  async function retry(): Promise<void> {
    await hydrate();
  }

  const sink: ProjectPersistenceSink = {
    onBriefFieldChange: (projectId) => scheduleFlush(projectId),
    onFieldNotApplicable: (projectId) => scheduleFlush(projectId),
  };
  if (!demoEnabled) store.getState().bindPersistence(sink);

  function destroy(): void {
    destroyed = true;
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    if (!demoEnabled) store.getState().bindPersistence(null);
  }

  return { hydrate, createProject, flush, resolveConflict, retry, destroy };
}

export interface UseProjectWorkspaceResult {
  status: HydrationStatus;
  error: string | null;
  conflict: HydrationConflict | null;
  /** Cria um projeto persistente (repository) fora do demo; local no demo. */
  createProject: (name: string) => Promise<string>;
  retry: () => void;
  resolveConflict: () => void;
}

/**
 * Hook React do controller — hidrata ao montar/trocar de workspace e expõe
 * as ações que a UI (boundary, ProjectsHome) precisa disparar.
 */
export function useProjectWorkspace(workspaceId: string | null): UseProjectWorkspaceResult {
  const hydration = useProjectStore((state) => state.hydration);
  const controllerRef = useRef<ProjectWorkspaceController | null>(null);

  useEffect(() => {
    if (!workspaceId) return undefined;
    const controller = createProjectWorkspaceController({ workspaceId });
    controllerRef.current = controller;
    void controller.hydrate();
    return () => {
      controller.destroy();
      controllerRef.current = null;
      useProjectStore.getState().clearAll();
    };
  }, [workspaceId]);

  const createProject = useCallback(async (name: string): Promise<string> => {
    if (!controllerRef.current) throw new Error('Workspace ainda não hidratado.');
    return controllerRef.current.createProject(name);
  }, []);

  const retry = useCallback(() => {
    void controllerRef.current?.retry();
  }, []);

  const resolveConflict = useCallback(() => {
    const projectId = useProjectStore.getState().hydration.conflict?.projectId;
    if (projectId) void controllerRef.current?.resolveConflict(projectId);
  }, []);

  return {
    status: hydration.status,
    error: hydration.error,
    conflict: hydration.conflict,
    createProject,
    retry,
    resolveConflict,
  };
}
