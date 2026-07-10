import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_PROJECT_ID, useProjectStore } from '@/stores/project-store';
import { useSpokeStore } from '@/stores/spoke-store';

const { navigateMock, createProjectMock, signOutMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  createProjectMock: vi.fn().mockResolvedValue('project-new'),
  signOutMock: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/components/project-hydration-boundary', () => ({
  useProjectWorkspaceActions: () => ({ createProject: createProjectMock }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signOut: signOutMock } },
}));

import { ProjectsHome } from '@/components/projects-home';

describe('ProjectsHome filesystem intake', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useProjectStore.getState().resetDemo();
    useSpokeStore.getState().reset();
    navigateMock.mockReset();
    createProjectMock.mockReset();
    signOutMock.mockReset();
  });

  it('lists local directories, renders the preview and confirms the intake', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { slug: 'academia-lendaria', root: 'projetos/academia-lendaria' },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        projectId: DEMO_PROJECT_ID,
        projectSlug: 'maquina-de-receita-com-ia',
        manifest: {
          hash: 'manifest-hash',
          sourcePath: 'projetos/academia-lendaria',
          fileCount: 1,
          allowlist: ['**/*.md'],
          allowlistVersion: 'filesystem-project-intake-allowlist.v1',
        },
        files: [
          {
            path: 'offerbook.md',
            artifactType: 'offerbook',
            format: 'markdown',
            hash: 'abc123',
            sizeBytes: 42,
            conflict: 'conflict',
            existingHash: 'old123',
          },
        ],
        conflicts: [
          {
            path: 'offerbook.md',
            existingHash: 'old123',
            incomingHash: 'abc123',
          },
        ],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        manifestHash: 'manifest-hash',
        imported: 1,
        unchanged: 0,
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<ProjectsHome />);

    await user.click(screen.getByRole('button', { name: /intake local/i }));
    expect(await screen.findByRole('option', { name: 'projetos/academia-lendaria' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /gerar preview/i }));

    expect(await screen.findByText('Manifesto gerado')).toBeInTheDocument();
    expect(screen.getByText('offerbook.md')).toBeInTheDocument();
    expect(screen.getByText(/Tipo:/)).toHaveTextContent('offerbook');
    expect(screen.getByText(/Hash:/)).toHaveTextContent('abc123');
    expect(screen.getByText(/Conflito:/)).toHaveTextContent('conflict');

    await user.click(screen.getByRole('button', { name: /confirmar intake/i }));

    expect(await screen.findByText('Intake confirmado: 1 importado(s), 0 reaproveitado(s).')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/local/project-intake/confirm',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          projectId: DEMO_PROJECT_ID,
          sourceSlug: 'academia-lendaria',
          expectedManifestHash: 'manifest-hash',
        }),
      }),
    ));
  });

  it('surfaces preview rejections from the backend', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { slug: 'academia-lendaria', root: 'projetos/academia-lendaria' },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: 'secret-rejected',
        message: 'Arquivo rejeitado por conter segredo conhecido: .env',
      }), { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<ProjectsHome />);

    await user.click(screen.getByRole('button', { name: /intake local/i }));
    await screen.findByRole('option', { name: 'projetos/academia-lendaria' });
    await user.click(screen.getByRole('button', { name: /gerar preview/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Arquivo rejeitado por conter segredo conhecido: .env');
  });
});
