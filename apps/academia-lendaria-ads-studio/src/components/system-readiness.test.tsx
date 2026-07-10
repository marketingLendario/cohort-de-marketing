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
});
