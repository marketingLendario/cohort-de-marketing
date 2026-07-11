import { createContext, useContext, type ReactNode } from 'react';
import { Button, Icon } from '@/lib/lendaria-ds';
import { useProjectWorkspace, type UseProjectWorkspaceResult } from '@/hooks/use-project-workspace';

/**
 * Ações do controller de workspace expostas para as telas dentro da boundary:
 *   - `createProject`: `ProjectsHome` cria projeto persistente (STORY-8.W2.1).
 *   - `importProjectBrief`: importa o briefing via controller/repository fora do demo (STORY-9.W1.2).
 *   - `persistSkillRunStart`/`persistSkillRunUpdate`: `ProjectJourney` persiste o
 *     pointer durável do skill run pelo `ProjectRepository` (STORY-8.W2.2 /
 *     QA-W2B1-02), para o run e sua proposta sobreviverem a um reload em modo real.
 * As demais mutações continuam pela API legada de `useProjectStore`.
 */
export type ProjectWorkspaceActions = Pick<
  UseProjectWorkspaceResult,
  'createProject' | 'persistSkillRunStart' | 'persistSkillRunUpdate'
> & Partial<Pick<UseProjectWorkspaceResult, 'importProjectBrief'>>;

const ProjectWorkspaceActionsContext = createContext<ProjectWorkspaceActions | null>(null);

/** Consumido pelas telas dentro da boundary (ex.: `ProjectsHome`) para criar projetos persistentes. */
// eslint-disable-next-line react-refresh/only-export-components -- hook do contexto vive ao lado do provider (padrão React de context+hook colocados)
export function useProjectWorkspaceActions(): ProjectWorkspaceActions {
  const context = useContext(ProjectWorkspaceActionsContext);
  if (!context) {
    throw new Error('useProjectWorkspaceActions precisa estar dentro de <ProjectHydrationBoundary>.');
  }
  return context;
}

/**
 * Variante opcional (STORY-8.W2.2 / QA-W2B1-02): devolve as ações do workspace se
 * houver provider, ou `null` quando renderizado FORA da boundary. É o seam que
 * permite ao `ProjectJourney` persistir via repository em produção sem quebrar os
 * testes de componente que o renderizam isolado (modo demo/cache) — sem
 * enfraquecer a persistência real.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook do contexto vive ao lado do provider
export function useOptionalProjectWorkspaceActions(): ProjectWorkspaceActions | null {
  return useContext(ProjectWorkspaceActionsContext);
}

/** Provider das ações do workspace — usado pela boundary e, em testes, para injetar duplos. */
export function ProjectWorkspaceActionsProvider({
  value,
  children,
}: {
  value: ProjectWorkspaceActions;
  children: ReactNode;
}) {
  return <ProjectWorkspaceActionsContext.Provider value={value}>{children}</ProjectWorkspaceActionsContext.Provider>;
}

function CenteredState({ testId, children }: { testId: string; children: ReactNode }) {
  return (
    <main className="cms-centered-state" data-testid={testId}>
      {children}
    </main>
  );
}

/**
 * Bloqueia a árvore até a hidratação real terminar (AC2 — sem flash de
 * fixture). `loading`/`idle` mostram spinner; `error`/`offline`/`conflict`
 * bloqueiam com uma ação de retomada explícita. `ready` e `empty` liberam os
 * filhos: workspace vazio é um estado válido — é a própria tela (ex.:
 * `ProjectsHome`) quem decide como convidar para criar o primeiro projeto.
 */
export function ProjectHydrationBoundary({
  workspaceId,
  children,
}: {
  workspaceId: string | null;
  children: ReactNode;
}) {
  const workspace = useProjectWorkspace(workspaceId);

  if (workspace.status === 'idle' || workspace.status === 'loading') {
    return (
      <CenteredState testId="project-hydration-loading">
        <span className="cms-loader" aria-hidden="true" />
        <p>Carregando seus projetos...</p>
      </CenteredState>
    );
  }

  if (workspace.status === 'offline') {
    return (
      <CenteredState testId="project-hydration-offline">
        <h1>Você está offline</h1>
        <p>Reconecte-se à internet para carregar seus projetos.</p>
        <Button onClick={workspace.retry}>
          <Icon name="refresh" size={14} />
          Tentar de novo
        </Button>
      </CenteredState>
    );
  }

  if (workspace.status === 'error') {
    return (
      <CenteredState testId="project-hydration-error">
        <h1>Não foi possível carregar seus projetos</h1>
        <p>{workspace.error}</p>
        <Button onClick={workspace.retry}>
          <Icon name="refresh" size={14} />
          Tentar de novo
        </Button>
      </CenteredState>
    );
  }

  if (workspace.status === 'conflict') {
    return (
      <CenteredState testId="project-hydration-conflict">
        <h1>Uma edição concorrente foi salva antes da sua</h1>
        <p>{workspace.conflict?.message ?? 'Recarregue a versão atual antes de continuar editando.'}</p>
        <Button onClick={workspace.resolveConflict}>
          <Icon name="refresh" size={14} />
          Recarregar versão atual
        </Button>
      </CenteredState>
    );
  }

  return (
    <ProjectWorkspaceActionsProvider
      value={{
        createProject: workspace.createProject,
        importProjectBrief: workspace.importProjectBrief,
        persistSkillRunStart: workspace.persistSkillRunStart,
        persistSkillRunUpdate: workspace.persistSkillRunUpdate,
      }}
    >
      {children}
    </ProjectWorkspaceActionsProvider>
  );
}
