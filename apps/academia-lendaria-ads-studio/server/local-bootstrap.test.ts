import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from './app.js'
import { createLocalBootstrapService, type LocalBootstrapInput, type LocalBootstrapStore } from './local-bootstrap.js'
import { LOCAL_RUNNER_TOKEN_HEADER } from './local-runner-security.js'

function fakeStore(overrides: Partial<LocalBootstrapStore> = {}): LocalBootstrapStore {
  return {
    countUsers: vi.fn().mockResolvedValue(0), countWorkspaces: vi.fn().mockResolvedValue(0), countMemberships: vi.fn().mockResolvedValue(0),
    createUser: vi.fn().mockResolvedValue('user-id'), deleteUser: vi.fn().mockResolvedValue(undefined),
    createWorkspace: vi.fn().mockResolvedValue('workspace-id'), deleteWorkspace: vi.fn().mockResolvedValue(undefined),
    createMembership: vi.fn().mockResolvedValue(undefined), deleteMembership: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const input: LocalBootstrapInput = { email: 'owner@example.com', password: 'strong-password', workspaceName: 'Meu workspace' }
const token = 'test-boundary-token'

describe('local first-run bootstrap', () => {
  const apps: Awaited<ReturnType<typeof buildApp>>[] = []
  afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())) })

  it('reports empty, creates confirmed owner resources once, then closes', async () => {
    const store = fakeStore()
    const service = createLocalBootstrapService(store)
    await expect(service.status()).resolves.toEqual({ status: 'empty' })
    await expect(service.create(input)).resolves.toEqual({ status: 'created' })
    expect(store.createUser).toHaveBeenCalledWith(expect.objectContaining(input))
    expect(store.createMembership).toHaveBeenCalledWith('workspace-id', 'user-id')

    const closedStore = fakeStore({ countUsers: vi.fn().mockResolvedValue(1) })
    await expect(createLocalBootstrapService(closedStore).create(input)).rejects.toThrow('já foi configurado')
    expect(closedStore.createUser).not.toHaveBeenCalled()
  })

  it('compensates user, workspace and membership after an intermediate failure', async () => {
    const store = fakeStore({ createMembership: vi.fn().mockRejectedValue(new Error('db failure')) })
    await expect(createLocalBootstrapService(store).create(input)).rejects.toThrow('Não foi possível concluir')
    expect(store.deleteMembership).toHaveBeenCalledWith('workspace-id', 'user-id')
    expect(store.deleteWorkspace).toHaveBeenCalledWith('workspace-id')
    expect(store.deleteUser).toHaveBeenCalledWith('user-id')
  })

  it('protects routes with loopback and boundary token and never returns credentials', async () => {
    const service = createLocalBootstrapService(fakeStore())
    const app = await buildApp({ localBootstrapService: service, localRunnerToken: token, skillRunner: null, campaignRepo: null, recoverOnBoot: false })
    apps.push(app)
    const missing = await app.inject({ method: 'GET', url: '/api/local/bootstrap/status' })
    expect(missing.statusCode).toBe(401)
    const empty = await app.inject({ method: 'GET', url: '/api/local/bootstrap/status', headers: { [LOCAL_RUNNER_TOKEN_HEADER]: token } })
    expect(empty.statusCode).toBe(200)
    expect(empty.json()).toEqual({ status: 'empty' })
    const created = await app.inject({ method: 'POST', url: '/api/local/bootstrap', headers: { [LOCAL_RUNNER_TOKEN_HEADER]: token }, payload: input })
    expect(created.statusCode).toBe(201)
    expect(created.body).not.toContain(input.password)
    expect(created.body).not.toContain(token)
    const invalid = await app.inject({ method: 'POST', url: '/api/local/bootstrap', headers: { [LOCAL_RUNNER_TOKEN_HEADER]: token }, payload: { ...input, email: 'invalid', password: 'short', workspaceName: '' } })
    expect(invalid.statusCode).toBe(400)
    const remote = await app.inject({ method: 'GET', url: '/api/local/bootstrap/status', remoteAddress: '192.168.1.20', headers: { [LOCAL_RUNNER_TOKEN_HEADER]: token } })
    expect(remote.statusCode).toBe(403)
  })
})
