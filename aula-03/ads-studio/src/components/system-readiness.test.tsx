import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SystemReadiness } from './system-readiness';

describe('SystemReadiness', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['ready', 'Tudo pronto para continuar'],
    ['degraded', 'Um item precisa de atenção'],
    ['blocked', 'Ação necessária para continuar'],
  ] as const)('renders and opens the %s state', async (status, label) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      status,
      checkedAt: '2026-07-10T12:00:00.000Z',
      source: 'launcher',
      checks: [{
        id: 'codex',
        label: 'Codex CLI',
        status,
        detail: status === 'ready' ? 'Autenticado.' : 'Precisa de atenção.',
        recovery: status === 'ready' ? undefined : 'Rode codex login.',
        required: true,
      }],
    }), { status: 200 }));

    render(<SystemReadiness />);
    await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(screen.getByRole('dialog', { name: 'Estado do Marketing Studio' })).toBeInTheDocument();
    expect(screen.getByText('Acesso à inteligência artificial')).toBeInTheDocument();
    expect(screen.queryByText(/codex|cli|login/i)).not.toBeInTheDocument();
    if (status !== 'ready') expect(screen.getByRole('button', { name: 'Verificar novamente' })).toBeInTheDocument();
  });

  it('falls back to a treatable degraded state when the endpoint fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    render(<SystemReadiness />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Um item precisa de atenção' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Um item precisa de atenção' }));
    expect(screen.getByText('Verificação do Marketing Studio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verificar novamente' })).toBeInTheDocument();
  });

  it('translates every launcher check into task language', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      status: 'ready',
      checkedAt: '2026-07-10T12:00:00.000Z',
      source: 'launcher',
      checks: [
        ['node', 'Node.js'], ['npm', 'Dependências'], ['codex', 'Codex CLI'],
        ['filesystem', 'Arquivos do projeto'], ['ports', 'Portas locais'],
        ['supabase', 'Supabase local'], ['migrations', 'Banco atualizado'],
        ['browser', 'Navegador'], ['bff', 'Motor local'], ['web', 'Interface'],
      ].map(([id, label]) => ({ id, label, status: 'ready', detail: 'Ativo.', required: true })),
    }), { status: 200 }));

    render(<SystemReadiness />);
    const trigger = await screen.findByRole('button', { name: 'Tudo pronto para continuar' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Estado do Marketing Studio' });

    expect(dialog).toHaveTextContent('Base do Marketing Studio');
    expect(dialog).toHaveTextContent('Ações do Marketing Studio');
    expect(dialog).not.toHaveTextContent(/Node\.js|Dependências|Codex|CLI|Supabase|BFF|Portas locais|Motor local/i);
  });

  it('moves focus into the diagnostic and restores it on Escape', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      status: 'ready',
      checkedAt: '2026-07-10T12:00:00.000Z',
      source: 'launcher',
      checks: [{ id: 'web', label: 'Interface', status: 'ready', detail: 'Ativa.', required: true }],
    }), { status: 200 }));
    render(<SystemReadiness />);
    const trigger = await screen.findByRole('button', { name: 'Tudo pronto para continuar' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Estado do Marketing Studio' });
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    await waitFor(() => expect(dialog).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Diagnóstico do ambiente' })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());

    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Estado do Marketing Studio' })).toHaveFocus());
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog', { name: 'Diagnóstico do ambiente' })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('configures Apify only after a protected value and explicit confirmation', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 'degraded', checkedAt: '2026-07-11T12:00:00.000Z', source: 'launcher', diagnosisHash: 'a'.repeat(64),
        checks: [{ id: 'apify', label: 'Pesquisa', status: 'degraded', detail: 'Ausente.', required: false, recoveryActionId: 'configure-apify' }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 'ready', checkedAt: '2026-07-11T12:01:00.000Z', source: 'launcher', diagnosisHash: 'b'.repeat(64),
        checks: [{ id: 'apify', label: 'Pesquisa', status: 'ready', detail: 'Configurado.', required: false }],
      }), { status: 200 }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<SystemReadiness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Um item precisa de atenção' }));
    const save = screen.getByRole('button', { name: 'Salvar com minha autorização' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Token do Apify'), { target: { value: 'apify_api_1234567890abcdefghijkl' } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/local/environment-bootstrap/recover', expect.objectContaining({ method: 'POST' })));
    const request = fetchMock.mock.calls.at(-1)?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({ consent: true, actionId: 'configure-apify' });
  });
});
