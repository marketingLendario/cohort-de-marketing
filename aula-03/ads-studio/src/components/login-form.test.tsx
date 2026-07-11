import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './login-form'

vi.mock('@/lib/supabase', () => ({ supabase: { auth: { signInWithPassword: vi.fn() } } }))

describe('LoginForm local bootstrap', () => {
  it('keeps normal login available while exposing empty-runtime setup', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'empty' }), { status: 200 })))
    render(<LoginForm />)
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Seu primeiro acesso' })).toBeInTheDocument()
  })
})
