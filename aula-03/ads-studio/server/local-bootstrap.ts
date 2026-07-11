import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

export const localBootstrapInputSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(72),
  workspaceName: z.string().trim().min(2).max(120),
})

export type LocalBootstrapInput = z.infer<typeof localBootstrapInputSchema>
export type LocalBootstrapStatus = 'empty' | 'closed'

export interface LocalBootstrapState {
  status: 'available' | 'creating' | 'complete'
  claimToken?: string
  ownerToken?: string
  leaseExpiresAt?: string
}

export interface LocalBootstrapClaim {
  claimed: boolean
  claimToken?: string
  ownerToken?: string
  previousUserId?: string
  previousWorkspaceId?: string
}

export interface LocalBootstrapStore {
  readBootstrapState(): Promise<LocalBootstrapState | null>
  claimBootstrap(desiredOwnerToken: string, desiredClaimToken: string): Promise<LocalBootstrapClaim>
  renewBootstrap(ownerToken: string): Promise<void>
  recordBootstrapProgress(ownerToken: string, progress: { userId?: string; workspaceId?: string }): Promise<void>
  completeBootstrap(ownerToken: string): Promise<void>
  releaseBootstrap(ownerToken: string): Promise<void>
  countUsers(): Promise<number>
  countWorkspaces(): Promise<number>
  countMemberships(): Promise<number>
  findUserIdsByBootstrapClaim(claimToken: string): Promise<string[]>
  createUser(input: LocalBootstrapInput, claimToken: string): Promise<string>
  deleteUser(userId: string): Promise<void>
  createWorkspace(name: string, workspaceId: string): Promise<string>
  deleteWorkspace(workspaceId: string): Promise<void>
  createMembership(workspaceId: string, userId: string): Promise<void>
  deleteMembership(workspaceId: string, userId: string): Promise<void>
}

export interface LocalBootstrapService {
  status(): Promise<{ status: LocalBootstrapStatus }>
  create(input: LocalBootstrapInput): Promise<{ status: 'created' }>
}

export class LocalBootstrapClosedError extends Error {
  constructor() {
    super('O primeiro acesso local já foi configurado.')
    this.name = 'LocalBootstrapClosedError'
  }
}

/** Backend-only one-shot bootstrap. It deliberately never returns auth data. */
export function createLocalBootstrapService(store: LocalBootstrapStore): LocalBootstrapService {
  async function countsAreEmpty(): Promise<boolean> {
    const [users, workspaces, memberships] = await Promise.all([
      store.countUsers(),
      store.countWorkspaces(),
      store.countMemberships(),
    ])
    return users === 0 && workspaces === 0 && memberships === 0
  }

  async function cleanupClaim(claimToken: string, recordedUserId?: string, recordedWorkspaceId?: string): Promise<void> {
    const userIds = new Set(await store.findUserIdsByBootstrapClaim(claimToken))
    if (recordedUserId) userIds.add(recordedUserId)
    const workspaceId = recordedWorkspaceId ?? claimToken
    for (const userId of userIds) await store.deleteMembership(workspaceId, userId)
    await store.deleteWorkspace(workspaceId)
    for (const userId of userIds) await store.deleteUser(userId)
  }

  function ownsLiveClaim(state: LocalBootstrapState | null, ownerToken: string): boolean {
    return state?.status === 'creating'
      && state.ownerToken === ownerToken
      && Boolean(state.leaseExpiresAt)
      && Date.parse(state.leaseExpiresAt!) > Date.now()
  }

  return {
    async status() {
      const state = await store.readBootstrapState()
      if (state?.status === 'complete') return { status: 'closed' }
      if (state?.status === 'creating' && state.leaseExpiresAt && Date.parse(state.leaseExpiresAt) > Date.now()) {
        return { status: 'closed' }
      }
      if (state?.status === 'creating') return { status: 'empty' }
      return { status: await countsAreEmpty() ? 'empty' : 'closed' }
    },

    async create(input) {
      const parsed = localBootstrapInputSchema.parse(input)
      const claimed = await store.claimBootstrap(randomUUID(), randomUUID())
      if (!claimed.claimed || !claimed.claimToken || !claimed.ownerToken) throw new LocalBootstrapClosedError()
      const claimToken = claimed.claimToken
      const ownerToken = claimed.ownerToken
      let leaseLost = false
      let heartbeatBusy = false
      const renewLease = async (): Promise<void> => {
        if (leaseLost) throw new Error('A posse do primeiro acesso expirou.')
        try {
          await store.renewBootstrap(ownerToken)
        } catch (error) {
          leaseLost = true
          throw error
        }
      }
      const heartbeat = setInterval(() => {
        if (heartbeatBusy || leaseLost) return
        heartbeatBusy = true
        void store.renewBootstrap(ownerToken)
          .catch(() => { leaseLost = true })
          .finally(() => { heartbeatBusy = false })
      }, 10_000)
      let userId: string | undefined
      const workspaceId = claimToken
      try {
        await renewLease()
        await cleanupClaim(claimToken, claimed.previousUserId, claimed.previousWorkspaceId)
        await renewLease()
        if (!await countsAreEmpty()) throw new LocalBootstrapClosedError()

        await renewLease()
        userId = await store.createUser(parsed, claimToken)
        await renewLease()
        await store.recordBootstrapProgress(ownerToken, { userId })
        await renewLease()
        await store.createWorkspace(parsed.workspaceName, workspaceId)
        await renewLease()
        await store.recordBootstrapProgress(ownerToken, { workspaceId })
        await renewLease()
        await store.createMembership(workspaceId, userId)
        await renewLease()
        try {
          await store.completeBootstrap(ownerToken)
        } catch {
          const completion = await store.readBootstrapState().catch(() => null)
          if (completion?.status === 'complete' && completion.ownerToken === ownerToken && completion.claimToken === claimToken) {
            return { status: 'created' }
          }
          throw new Error('Não foi possível confirmar a conclusão do primeiro acesso.')
        }
        return { status: 'created' }
      } catch (error) {
        const state = await store.readBootstrapState().catch(() => null)
        if (state?.status === 'complete' && state.ownerToken === ownerToken && state.claimToken === claimToken) {
          return { status: 'created' }
        }
        if (!ownsLiveClaim(state, ownerToken)) {
          if (error instanceof LocalBootstrapClosedError) throw error
          throw new Error('Não foi possível concluir a configuração do primeiro acesso.')
        }
        let cleaned = false
        try {
          await cleanupClaim(claimToken, userId, workspaceId)
          cleaned = true
        } finally {
          if (cleaned) await store.releaseBootstrap(ownerToken)
        }
        if (error instanceof LocalBootstrapClosedError) throw error
        throw new Error('Não foi possível concluir a configuração do primeiro acesso.')
      } finally {
        clearInterval(heartbeat)
      }
    },
  }
}

export function createSupabaseLocalBootstrapStore(client: SupabaseClient): LocalBootstrapStore {
  async function rpcBoolean(name: string, args: Record<string, unknown>): Promise<void> {
    const { data, error } = await client.rpc(name, args)
    if (error || data !== true) throw new Error('Falha ao atualizar o estado do primeiro acesso.')
  }

  async function count(table: 'workspaces' | 'workspace_members'): Promise<number> {
    const { count: total, error } = await client.from(table).select('*', { count: 'exact', head: true })
    if (error) throw new Error('Falha ao consultar o estado do primeiro acesso.')
    return total ?? 0
  }

  return {
    async readBootstrapState() {
      const { data, error } = await client.rpc('get_local_bootstrap_state')
      if (error) throw new Error('Falha ao consultar o estado do primeiro acesso.')
      if (!data || typeof data !== 'object') return null
      const row = data as Record<string, unknown>
      if (row.status !== 'available' && row.status !== 'creating' && row.status !== 'complete') return null
      return {
        status: row.status,
        ...(typeof row.claimToken === 'string' ? { claimToken: row.claimToken } : {}),
        ...(typeof row.ownerToken === 'string' ? { ownerToken: row.ownerToken } : {}),
        ...(typeof row.leaseExpiresAt === 'string' ? { leaseExpiresAt: row.leaseExpiresAt } : {}),
      }
    },
    async claimBootstrap(desiredOwnerToken, desiredClaimToken) {
      const { data, error } = await client.rpc('claim_local_bootstrap', {
        p_desired_owner_token: desiredOwnerToken,
        p_desired_claim_token: desiredClaimToken,
      })
      if (error || !data || typeof data !== 'object') throw new Error('Falha ao reservar o primeiro acesso.')
      const row = data as Record<string, unknown>
      return {
        claimed: row.claimed === true,
        ...(typeof row.claimToken === 'string' ? { claimToken: row.claimToken } : {}),
        ...(typeof row.ownerToken === 'string' ? { ownerToken: row.ownerToken } : {}),
        ...(typeof row.previousUserId === 'string' ? { previousUserId: row.previousUserId } : {}),
        ...(typeof row.previousWorkspaceId === 'string' ? { previousWorkspaceId: row.previousWorkspaceId } : {}),
      }
    },
    renewBootstrap(ownerToken) {
      return rpcBoolean('renew_local_bootstrap', { p_owner_token: ownerToken })
    },
    recordBootstrapProgress(ownerToken, progress) {
      return rpcBoolean('record_local_bootstrap_progress', {
        p_owner_token: ownerToken,
        p_user_id: progress.userId ?? null,
        p_workspace_id: progress.workspaceId ?? null,
      })
    },
    completeBootstrap(ownerToken) {
      return rpcBoolean('complete_local_bootstrap', { p_owner_token: ownerToken })
    },
    releaseBootstrap(ownerToken) {
      return rpcBoolean('release_local_bootstrap', { p_owner_token: ownerToken })
    },
    async countUsers() {
      let total = 0
      let page = 1
      let hasMore = true
      while (hasMore) {
        const response = await client.auth.admin.listUsers({ page, perPage: 1000 })
        if (response.error) throw new Error('Falha ao consultar o estado do primeiro acesso.')
        total += response.data.users.length
        hasMore = response.data.users.length === 1000
        page += 1
      }
      return total
    },
    async findUserIdsByBootstrapClaim(claimToken) {
      const ids: string[] = []
      let page = 1
      let hasMore = true
      while (hasMore) {
        const response = await client.auth.admin.listUsers({ page, perPage: 1000 })
        if (response.error) throw new Error('Falha ao reconciliar o primeiro acesso.')
        for (const user of response.data.users) {
          if (user.user_metadata?.local_bootstrap_claim === claimToken) ids.push(user.id)
        }
        hasMore = response.data.users.length === 1000
        page += 1
      }
      return ids
    },
    countWorkspaces: () => count('workspaces'),
    countMemberships: () => count('workspace_members'),
    async createUser(input, claimToken) {
      const { data, error } = await client.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: { display_name: input.email.split('@')[0], local_bootstrap_claim: claimToken },
      })
      if (error || !data.user) throw new Error('Falha ao criar o primeiro acesso.')
      return data.user.id
    },
    async deleteUser(userId) {
      const { error } = await client.auth.admin.deleteUser(userId)
      if (error) throw new Error('Falha ao reconciliar o usuário do primeiro acesso.')
    },
    async createWorkspace(name, workspaceId) {
      const { error } = await client.from('workspaces').insert({ id: workspaceId, name })
      if (error) throw new Error('Falha ao criar o workspace local.')
      return workspaceId
    },
    async deleteWorkspace(workspaceId) {
      const { error } = await client.from('workspaces').delete().eq('id', workspaceId)
      if (error) throw new Error('Falha ao reconciliar o workspace do primeiro acesso.')
    },
    async createMembership(workspaceId, userId) {
      const { error } = await client.from('workspace_members').insert({ workspace_id: workspaceId, user_id: userId, role: 'owner' })
      if (error) throw new Error('Falha ao criar a membership do primeiro acesso.')
    },
    async deleteMembership(workspaceId, userId) {
      const { error } = await client.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('user_id', userId)
      if (error) throw new Error('Falha ao reconciliar a associação do primeiro acesso.')
    },
  }
}
