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

    await user.click(screen.getByRole('button', { name: /trazer materiais/i }));
    expect(await screen.findByRole('option', { name: 'Academia Lendaria' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /revisar materiais/i }));

    expect(await screen.findByText('Pronto para revisar')).toBeInTheDocument();
    expect(screen.getByText('offerbook.md')).toBeInTheDocument();
    expect(screen.getByText('Será atualizado')).toBeInTheDocument();
    expect(screen.queryByText('abc123')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /adicionar materiais/i }));

    expect(await screen.findByText('Materiais adicionados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver minha próxima ação' })).toBeInTheDocument();
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
      }), { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        projectId: DEMO_PROJECT_ID,
        projectSlug: 'maquina-de-receita-com-ia',
        manifest: {
          hash: 'manifest-retry',
          sourcePath: 'projetos/academia-lendaria',
          fileCount: 0,
          allowlist: ['**/*.md'],
          allowlistVersion: 'filesystem-project-intake-allowlist.v1',
        },
        files: [],
        conflicts: [],
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<ProjectsHome />);

    await user.click(screen.getByRole('button', { name: /trazer materiais/i }));
    await screen.findByRole('option', { name: 'Academia Lendaria' });
    await user.click(screen.getByRole('button', { name: /revisar materiais/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Essa pasta contém um arquivo privado');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Pronto para revisar')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/local/project-intake/preview',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('retries confirmation without discarding the approved preview', async () => {
    const preview = {
      projectId: DEMO_PROJECT_ID,
      projectSlug: 'maquina-de-receita-com-ia',
      manifest: {
        hash: 'manifest-hash',
        sourcePath: 'projetos/academia-lendaria',
        fileCount: 0,
        allowlist: ['**/*.md'],
        allowlistVersion: 'filesystem-project-intake-allowlist.v1',
      },
      files: [],
      conflicts: [],
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { slug: 'academia-lendaria', root: 'projetos/academia-lendaria' },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(preview), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: 'persist-failed',
        message: 'hash constraint temporarily unavailable',
      }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        manifestHash: 'manifest-hash', imported: 1, unchanged: 0,
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<ProjectsHome />);
    await user.click(screen.getByRole('button', { name: /trazer materiais/i }));
    await screen.findByRole('option', { name: 'Academia Lendaria' });
    await user.click(screen.getByRole('button', { name: /revisar materiais/i }));
    await screen.findByText('Pronto para revisar');
    await user.click(screen.getByRole('button', { name: /adicionar materiais/i }));
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Materiais adicionados')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/local/project-intake/confirm',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns to preview when confirmation detects a changed manifest', async () => {
    const preview = {
      projectId: DEMO_PROJECT_ID,
      projectSlug: 'maquina-de-receita-com-ia',
      manifest: {
        hash: 'manifest-old',
        sourcePath: 'projetos/academia-lendaria',
        fileCount: 0,
        allowlist: ['**/*.md'],
        allowlistVersion: 'filesystem-project-intake-allowlist.v1',
      },
      files: [],
      conflicts: [],
    };
    const refreshedPreview = {
      ...preview,
      manifest: { ...preview.manifest, hash: 'manifest-new' },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { slug: 'academia-lendaria', root: 'projetos/academia-lendaria' },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(preview), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: 'manifest-stale',
        message: 'manifest hash conflict',
      }), { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(refreshedPreview), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<ProjectsHome />);
    await user.click(screen.getByRole('button', { name: /trazer materiais/i }));
    await screen.findByRole('option', { name: 'Academia Lendaria' });
    await user.click(screen.getByRole('button', { name: /revisar materiais/i }));
    await screen.findByText('Pronto para revisar');
    await user.click(screen.getByRole('button', { name: /adicionar materiais/i }));
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/local/project-intake/preview',
      expect.objectContaining({ method: 'POST' }),
    ));
    expect(screen.getByText('Pronto para revisar')).toBeInTheDocument();
  });

  it('keeps project data and offers an in-place retry when creation fails', async () => {
    useSpokeStore.getState().setActiveSpoke('demo-workspace');
    createProjectMock.mockRejectedValueOnce(new Error('database unavailable'));
    const user = userEvent.setup();
    render(<ProjectsHome />);

    await user.click(screen.getByRole('button', { name: 'Novo projeto' }));
    await user.type(screen.getByLabelText('Nome do projeto'), 'Minha campanha');
    await user.click(screen.getByRole('button', { name: 'Criar e abrir' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Seus dados continuam aqui');
    expect(screen.getByLabelText('Nome do projeto')).toHaveValue('Minha campanha');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});
