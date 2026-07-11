import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocalFirstRun } from './local-first-run'

const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn().mockResolvedValue({ error: null }) }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { signInWithPassword } } }))

describe('LocalFirstRun', () => {
  afterEach(() => vi.restoreAllMocks())

  it('offers the first access only when the local runtime is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'empty' }), { status: 200 })))
    render(<LocalFirstRun />)
    expect(await screen.findByRole('heading', { name: 'Seu primeiro acesso' })).toBeInTheDocument()
  })

  it('creates the access and signs in through Supabase', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'empty' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'created' }), { status: 201 }))
    vi.stubGlobal('fetch', fetch)
    const user = userEvent.setup()
    render(<LocalFirstRun />)
    await screen.findByRole('heading', { name: 'Seu primeiro acesso' })
    await user.type(screen.getByLabelText('E-mail'), 'owner@example.com')
    await user.type(screen.getByLabelText('Senha'), 'strong-password')
    await user.type(screen.getByLabelText('Nome do seu negócio'), 'Meu negócio')
    await user.click(screen.getByRole('button', { name: 'Criar meu acesso' }))
    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledWith({ email: 'owner@example.com', password: 'strong-password' }))
    expect(fetch).toHaveBeenLastCalledWith('/api/local/bootstrap', expect.objectContaining({ method: 'POST' }))
  })
})
