import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalBootstrap, getLocalBootstrapStatus } from './local-bootstrap'

describe('local bootstrap client', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reads only the sanitized empty/closed status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'empty', token: 'secret' }), { status: 200 })))
    await expect(getLocalBootstrapStatus()).resolves.toEqual({ status: 'empty' })
  })

  it('sends bootstrap data and exposes only a sanitized server error', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Não foi possível concluir o primeiro acesso.', secret: 'hidden' }), { status: 500 }))
    vi.stubGlobal('fetch', fetch)
    await expect(createLocalBootstrap({ email: 'owner@example.com', password: 'password', workspaceName: 'Workspace' })).rejects.toThrow('Não foi possível concluir')
    expect(fetch).toHaveBeenCalledWith('/api/local/bootstrap', expect.objectContaining({ method: 'POST' }))
  })
})
