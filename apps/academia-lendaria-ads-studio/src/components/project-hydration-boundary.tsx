import { createContext, useContext, type ReactNode } from 'react';
import { Button, Icon } from '@/lib/lendaria-ds';
import { useProjectWorkspace, type UseProjectWorkspaceResult } from '@/hooks/use-project-workspace';

/**
 * Ações do controller de workspace expostas para as telas dentro da
 * boundary (ex.: `ProjectsHome` precisa de `createProject` persistente —
 * STORY-8.W2.1 tarefa 4). Só `createProject` é exposto: as demais mutações
 * continuam pela API legada de `useProjectStore` (autosave já embutido nela).
 */
type ProjectWorkspaceActions = Pick<UseProjectWorkspaceResult, 'createProject'>;

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
    <ProjectWorkspaceActionsContext.Provider value={{ createProject: workspace.createProject }}>
      {children}
    </ProjectWorkspaceActionsContext.Provider>
  );
}
