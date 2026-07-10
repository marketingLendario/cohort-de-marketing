import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from './app.js'
import {
  createLocalBootstrapService,
  type LocalBootstrapInput,
  type LocalBootstrapState,
  type LocalBootstrapStore,
} from './local-bootstrap.js'
import { LOCAL_RUNNER_TOKEN_HEADER } from './local-runner-security.js'

function fakeStore(overrides: Partial<LocalBootstrapStore> = {}): LocalBootstrapStore {
  let state: LocalBootstrapState | null = null
  const store: LocalBootstrapStore = {
    readBootstrapState: vi.fn(async () => state),
    claimBootstrap: vi.fn(async (desiredOwnerToken, desiredClaimToken) => {
      if (state?.status === 'complete') return { claimed: false }
      if (state?.status === 'creating' && state.leaseExpiresAt && Date.parse(state.leaseExpiresAt) > Date.now()) {
        return { claimed: false }
      }
      const claimToken = state?.status === 'creating' ? state.claimToken! : desiredClaimToken
      state = { status: 'creating', claimToken, ownerToken: desiredOwnerToken, leaseExpiresAt: new Date(Date.now() + 60_000).toISOString() }
      return { claimed: true, claimToken, ownerToken: desiredOwnerToken }
    }),
    renewBootstrap: vi.fn(async (ownerToken) => {
      if (state?.status !== 'creating' || state.ownerToken !== ownerToken) throw new Error('lease lost')
      state = { ...state, leaseExpiresAt: new Date(Date.now() + 60_000).toISOString() }
    }),
    recordBootstrapProgress: vi.fn(async (ownerToken, progress) => {
      state = { status: 'creating', claimToken: state?.claimToken, ownerToken, leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(), ...progress }
    }),
    completeBootstrap: vi.fn(async (ownerToken) => { state = { status: 'complete', claimToken: state?.claimToken, ownerToken } }),
    releaseBootstrap: vi.fn(async () => { state = { status: 'available' } }),
    countUsers: vi.fn().mockResolvedValue(0), countWorkspaces: vi.fn().mockResolvedValue(0), countMemberships: vi.fn().mockResolvedValue(0),
    findUserIdsByBootstrapClaim: vi.fn().mockResolvedValue([]),
    createUser: vi.fn().mockResolvedValue('user-id'), deleteUser: vi.fn().mockResolvedValue(undefined),
    createWorkspace: vi.fn(async (_name, workspaceId) => workspaceId), deleteWorkspace: vi.fn().mockResolvedValue(undefined),
    createMembership: vi.fn().mockResolvedValue(undefined), deleteMembership: vi.fn().mockResolvedValue(undefined),
  }
  return Object.assign(store, overrides)
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
    expect(store.createUser).toHaveBeenCalledWith(expect.objectContaining(input), expect.any(String))
    const workspaceId = vi.mocked(store.createWorkspace).mock.calls[0]![1]
    expect(store.createMembership).toHaveBeenCalledWith(workspaceId, 'user-id')
    expect(store.renewBootstrap).toHaveBeenCalled()
    await expect(service.status()).resolves.toEqual({ status: 'closed' })

    const closedStore = fakeStore({ countUsers: vi.fn().mockResolvedValue(1) })
    await expect(createLocalBootstrapService(closedStore).create(input)).rejects.toThrow('já foi configurado')
    expect(closedStore.createUser).not.toHaveBeenCalled()
  })

  it('compensates user, workspace and membership after an intermediate failure', async () => {
    const store = fakeStore({ createMembership: vi.fn().mockRejectedValue(new Error('db failure')) })
    await expect(createLocalBootstrapService(store).create(input)).rejects.toThrow('Não foi possível concluir')
    const workspaceId = vi.mocked(store.createWorkspace).mock.calls[0]![1]
    expect(store.deleteMembership).toHaveBeenCalledWith(workspaceId, 'user-id')
    expect(store.deleteWorkspace).toHaveBeenCalledWith(workspaceId)
    expect(store.deleteUser).toHaveBeenCalledWith('user-id')
    const ownerToken = vi.mocked(store.claimBootstrap).mock.calls[0]![0]
    expect(store.releaseBootstrap).toHaveBeenCalledWith(ownerToken)
  })

  it('serializes two BFF processes through the durable claim', async () => {
    let finishUser!: (userId: string) => void
    const store = fakeStore({
      createUser: vi.fn(() => new Promise<string>((resolve) => { finishUser = resolve })),
    })
    const first = createLocalBootstrapService(store).create(input)
    await vi.waitFor(() => expect(store.createUser).toHaveBeenCalledTimes(1))

    await expect(createLocalBootstrapService(store).create(input)).rejects.toBeInstanceOf(Error)
    expect(store.createUser).toHaveBeenCalledTimes(1)
    finishUser('user-id')
    await expect(first).resolves.toEqual({ status: 'created' })
  })

  it('reconciles resources from a stale claim before retrying', async () => {
    const claimToken = '93000000-0000-0000-0000-000000000001'
    const ownerToken = '94000000-0000-0000-0000-000000000001'
    const store = fakeStore({
      readBootstrapState: vi.fn().mockResolvedValue({ status: 'creating', claimToken, ownerToken, leaseExpiresAt: new Date(Date.now() + 60_000).toISOString() }),
      claimBootstrap: vi.fn().mockResolvedValue({ claimed: true, claimToken, ownerToken, previousUserId: 'recorded-user', previousWorkspaceId: claimToken }),
      renewBootstrap: vi.fn().mockResolvedValue(undefined),
      findUserIdsByBootstrapClaim: vi.fn().mockResolvedValue(['unrecorded-user']),
    })

    await expect(createLocalBootstrapService(store).create(input)).resolves.toEqual({ status: 'created' })
    expect(store.deleteUser).toHaveBeenCalledWith('recorded-user')
    expect(store.deleteUser).toHaveBeenCalledWith('unrecorded-user')
    expect(store.deleteWorkspace).toHaveBeenCalledWith(claimToken)
    expect(store.createWorkspace).toHaveBeenCalledWith(input.workspaceName, claimToken)
  })

  it('does not compensate after losing the fenced owner token', async () => {
    const store = fakeStore({
      recordBootstrapProgress: vi.fn().mockRejectedValue(new Error('lease lost')),
      readBootstrapState: vi.fn().mockResolvedValue({
        status: 'creating',
        claimToken: '95000000-0000-0000-0000-000000000001',
        ownerToken: 'new-owner',
        leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    })

    await expect(createLocalBootstrapService(store).create(input)).rejects.toThrow('Não foi possível concluir')
    expect(store.deleteUser).not.toHaveBeenCalledWith('user-id')
    expect(store.releaseBootstrap).not.toHaveBeenCalled()
  })

  it('treats an ambiguous completion response as success when durable state is complete', async () => {
    const claimToken = '96000000-0000-0000-0000-000000000001'
    const ownerToken = '97000000-0000-0000-0000-000000000001'
    const store = fakeStore({
      claimBootstrap: vi.fn().mockResolvedValue({ claimed: true, claimToken, ownerToken }),
      renewBootstrap: vi.fn().mockResolvedValue(undefined),
      completeBootstrap: vi.fn().mockRejectedValue(new Error('response lost')),
      readBootstrapState: vi.fn().mockResolvedValue({ status: 'complete', claimToken, ownerToken }),
    })

    await expect(createLocalBootstrapService(store).create(input)).resolves.toEqual({ status: 'created' })
    expect(store.deleteUser).not.toHaveBeenCalledWith('user-id')
    expect(store.releaseBootstrap).not.toHaveBeenCalled()
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
