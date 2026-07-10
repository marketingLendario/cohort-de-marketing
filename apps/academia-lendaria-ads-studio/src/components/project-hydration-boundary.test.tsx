import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseProjectWorkspaceResult } from '@/hooks/use-project-workspace';

const useProjectWorkspaceMock = vi.fn<(workspaceId: string | null) => UseProjectWorkspaceResult>();

vi.mock('@/hooks/use-project-workspace', () => ({
  useProjectWorkspace: (workspaceId: string | null) => useProjectWorkspaceMock(workspaceId),
}));

// Import depois do mock (hoisted pelo vitest) para garantir que o componente
// resolva a versão mockada do hook.
const { ProjectHydrationBoundary, useProjectWorkspaceActions } = await import('@/components/project-hydration-boundary');

function baseResult(overrides: Partial<UseProjectWorkspaceResult>): UseProjectWorkspaceResult {
  return {
    status: 'ready',
    error: null,
    conflict: null,
    createProject: vi.fn().mockResolvedValue('project-1'),
    retry: vi.fn(),
    resolveConflict: vi.fn(),
    ...overrides,
  };
}

function ChildProbe() {
  const { createProject } = useProjectWorkspaceActions();
  return (
    <button type="button" onClick={() => void createProject('Novo')}>
      criar via contexto
    </button>
  );
}

describe('ProjectHydrationBoundary', () => {
  it('bloqueia com spinner enquanto carrega (loading/idle) — sem flash de fixture', () => {
    useProjectWorkspaceMock.mockReturnValue(baseResult({ status: 'loading' }));
    render(
      <ProjectHydrationBoundary workspaceId="ws-1">
        <div>conteúdo real</div>
      </ProjectHydrationBoundary>,
    );
    expect(screen.getByTestId('project-hydration-loading')).toBeInTheDocument();
    expect(screen.queryByText('conteúdo real')).not.toBeInTheDocument();
  });

  it('bloqueia com estado offline e permite tentar de novo', async () => {
    const retry = vi.fn();
    useProjectWorkspaceMock.mockReturnValue(baseResult({ status: 'offline', retry }));
    const user = userEvent.setup();
    render(
      <ProjectHydrationBoundary workspaceId="ws-1">
        <div>conteúdo real</div>
      </ProjectHydrationBoundary>,
    );
    const region = screen.getByTestId('project-hydration-offline');
    expect(region).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /tentar de novo/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('bloqueia com mensagem de erro e permite tentar de novo', async () => {
    const retry = vi.fn();
    useProjectWorkspaceMock.mockReturnValue(baseResult({ status: 'error', error: 'Falha ao carregar', retry }));
    const user = userEvent.setup();
    render(
      <ProjectHydrationBoundary workspaceId="ws-1">
        <div>conteúdo real</div>
      </ProjectHydrationBoundary>,
    );
    expect(screen.getByTestId('project-hydration-error')).toBeInTheDocument();
    expect(screen.getByText('Falha ao carregar')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /tentar de novo/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('bloqueia em conflito e reconcilia explicitamente via resolveConflict (nunca sobrescreve sozinho)', async () => {
    const resolveConflict = vi.fn();
    useProjectWorkspaceMock.mockReturnValue(
      baseResult({
        status: 'conflict',
        conflict: { projectId: 'p1', message: 'Outra sessão já salvou uma revisão mais nova.' },
        resolveConflict,
      }),
    );
    const user = userEvent.setup();
    render(
      <ProjectHydrationBoundary workspaceId="ws-1">
        <div>conteúdo real</div>
      </ProjectHydrationBoundary>,
    );
    expect(screen.getByTestId('project-hydration-conflict')).toBeInTheDocument();
    expect(screen.getByText('Outra sessão já salvou uma revisão mais nova.')).toBeInTheDocument();
    expect(screen.queryByText('conteúdo real')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /recarregar versão atual/i }));
    expect(resolveConflict).toHaveBeenCalledTimes(1);
  });

  it('libera os filhos em ready e em empty (workspace vazio é um estado válido)', () => {
    useProjectWorkspaceMock.mockReturnValue(baseResult({ status: 'ready' }));
    const { rerender } = render(
      <ProjectHydrationBoundary workspaceId="ws-1">
        <div>conteúdo real</div>
      </ProjectHydrationBoundary>,
    );
    expect(screen.getByText('conteúdo real')).toBeInTheDocument();

    useProjectWorkspaceMock.mockReturnValue(baseResult({ status: 'empty' }));
    rerender(
      <ProjectHydrationBoundary workspaceId="ws-1">
        <div>conteúdo real</div>
      </ProjectHydrationBoundary>,
    );
    expect(screen.getByText('conteúdo real')).toBeInTheDocument();
  });

  it('expõe createProject via contexto para as telas dentro da boundary', async () => {
    const createProject = vi.fn().mockResolvedValue('project-42');
    useProjectWorkspaceMock.mockReturnValue(baseResult({ status: 'ready', createProject }));
    const user = userEvent.setup();
    render(
      <ProjectHydrationBoundary workspaceId="ws-1">
        <ChildProbe />
      </ProjectHydrationBoundary>,
    );
    await user.click(screen.getByRole('button', { name: /criar via contexto/i }));
    expect(createProject).toHaveBeenCalledWith('Novo');
  });
});
