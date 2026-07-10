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

export interface LocalBootstrapStore {
  countUsers(): Promise<number>
  countWorkspaces(): Promise<number>
  countMemberships(): Promise<number>
  createUser(input: LocalBootstrapInput): Promise<string>
  deleteUser(userId: string): Promise<void>
  createWorkspace(name: string): Promise<string>
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
  let creating = false
  return {
    async status() {
      const [users, workspaces, memberships] = await Promise.all([
        store.countUsers(),
        store.countWorkspaces(),
        store.countMemberships(),
      ])
      return { status: users === 0 && workspaces === 0 && memberships === 0 ? 'empty' : 'closed' }
    },

    async create(input) {
      const parsed = localBootstrapInputSchema.parse(input)
      if (creating) throw new LocalBootstrapClosedError()
      creating = true

      let userId: string | undefined
      let workspaceId: string | undefined
      let membershipCreated = false
      try {
        const current = await this.status()
        if (current.status !== 'empty') throw new LocalBootstrapClosedError()
        try {
          userId = await store.createUser(parsed)
          workspaceId = await store.createWorkspace(parsed.workspaceName)
          membershipCreated = true
          await store.createMembership(workspaceId, userId)
          return { status: 'created' }
        } catch {
          // Compensate in reverse dependency order. Cleanup errors are swallowed so
          // the public response remains generic and never contains provider data.
          if (membershipCreated && userId && workspaceId) {
            await store.deleteMembership(workspaceId, userId).catch(() => undefined)
          }
          if (workspaceId) await store.deleteWorkspace(workspaceId).catch(() => undefined)
          if (userId) await store.deleteUser(userId).catch(() => undefined)
          throw new Error('Não foi possível concluir a configuração do primeiro acesso.')
        }
      } finally {
        creating = false
      }
    },
  }
}

export function createSupabaseLocalBootstrapStore(client: SupabaseClient): LocalBootstrapStore {
  async function count(table: 'workspaces' | 'workspace_members'): Promise<number> {
    const { count: total, error } = await client.from(table).select('*', { count: 'exact', head: true })
    if (error) throw new Error('Falha ao consultar o estado do primeiro acesso.')
    return total ?? 0
  }

  return {
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
    countWorkspaces: () => count('workspaces'),
    countMemberships: () => count('workspace_members'),
    async createUser(input) {
      const { data, error } = await client.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: { display_name: input.email.split('@')[0] },
      })
      if (error || !data.user) throw new Error('Falha ao criar o primeiro acesso.')
      return data.user.id
    },
    async deleteUser(userId) {
      await client.auth.admin.deleteUser(userId)
    },
    async createWorkspace(name) {
      const id = randomUUID()
      const { error } = await client.from('workspaces').insert({ id, name })
      if (error) throw new Error('Falha ao criar o workspace local.')
      return id
    },
    async deleteWorkspace(workspaceId) {
      await client.from('workspaces').delete().eq('id', workspaceId)
    },
    async createMembership(workspaceId, userId) {
      const { error } = await client.from('workspace_members').insert({ workspace_id: workspaceId, user_id: userId, role: 'owner' })
      if (error) throw new Error('Falha ao criar a membership do primeiro acesso.')
    },
    async deleteMembership(workspaceId, userId) {
      await client.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('user_id', userId)
    },
  }
}
