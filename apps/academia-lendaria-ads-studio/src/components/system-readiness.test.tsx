import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SystemReadiness } from './system-readiness';

describe('SystemReadiness', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['ready', 'Ambiente pronto'],
    ['degraded', 'Ambiente degradado'],
    ['blocked', 'Ambiente bloqueado'],
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
    expect(screen.getByRole('dialog', { name: 'Diagnóstico do ambiente' })).toBeInTheDocument();
    expect(screen.getByText('Codex CLI')).toBeInTheDocument();
    if (status !== 'ready') expect(screen.getByText('Rode codex login.')).toBeInTheDocument();
  });

  it('falls back to a treatable degraded state when the endpoint fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    render(<SystemReadiness />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ambiente degradado' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Ambiente degradado' }));
    expect(screen.getByText('O diagnóstico do ambiente não respondeu.')).toBeInTheDocument();
  });

  it('moves focus into the diagnostic and restores it on Escape', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      status: 'ready',
      checkedAt: '2026-07-10T12:00:00.000Z',
      source: 'launcher',
      checks: [{ id: 'web', label: 'Interface', status: 'ready', detail: 'Ativa.', required: true }],
    }), { status: 200 }));
    render(<SystemReadiness />);
    const trigger = await screen.findByRole('button', { name: 'Ambiente pronto' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Diagnóstico do ambiente' });
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    await waitFor(() => expect(dialog).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Diagnóstico do ambiente' })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());

    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Diagnóstico do ambiente' })).toHaveFocus());
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog', { name: 'Diagnóstico do ambiente' })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
