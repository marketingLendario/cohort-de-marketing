import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseCampaignCreateRepo, type CampaignCreateInput } from './campaign-create-repo.js'

const INPUT: CampaignCreateInput = {
  workspaceId: 'ws-1',
  projectId: 'project-1',
  name: 'Nova Campanha',
  idempotencyKey: 'idem-1',
}

const CAMPAIGN_ROW = {
  id: 'campaign-1',
  workspaceId: 'ws-1',
  projectId: 'project-1',
  name: 'Nova Campanha',
  status: 'draft',
  stepCurrent: 1,
  createdAt: '2026-07-16T12:00:00.000Z',
}

/** Fake `SupabaseClient` exposing only `.rpc`, recording the call args. */
function fakeClient(response: { data?: unknown; error?: { code?: string; message: string } | null }) {
  const calls: Array<{ name: string; args: unknown }> = []
  const client = {
    rpc(name: string, args: unknown) {
      calls.push({ name, args })
      return Promise.resolve({ data: response.data ?? null, error: response.error ?? null })
    },
  }
  return { client: client as unknown as SupabaseClient, calls }
}

describe('createSupabaseCampaignCreateRepo', () => {
  it('calls the RPC by name with snake_case params, defaulting expectedProjectName to null', async () => {
    const { client, calls } = fakeClient({ data: { ok: true, code: 'CREATED', campaign: CAMPAIGN_ROW } })
    const repo = createSupabaseCampaignCreateRepo(client)

    await repo.createCampaign(INPUT)

    expect(calls).toHaveLength(1)
    expect(calls[0].name).toBe('campaign_create_readiness_rpc')
    expect(calls[0].args).toEqual({
      p_workspace_id: 'ws-1',
      p_project_id: 'project-1',
      p_name: 'Nova Campanha',
      p_idempotency_key: 'idem-1',
      p_expected_project_name: null,
    })
  });

  it('forwards an explicit expectedProjectName', async () => {
    const { client, calls } = fakeClient({ data: { ok: true, code: 'CREATED', campaign: CAMPAIGN_ROW } })
    const repo = createSupabaseCampaignCreateRepo(client)

    await repo.createCampaign({ ...INPUT, expectedProjectName: 'Old Name' })

    expect(calls[0].args).toMatchObject({ p_expected_project_name: 'Old Name' })
  });

  it('maps a CREATED payload to an ok success result with the campaign draft', async () => {
    const { client } = fakeClient({ data: { ok: true, code: 'CREATED', campaign: CAMPAIGN_ROW } })
    const repo = createSupabaseCampaignCreateRepo(client)

    const result = await repo.createCampaign(INPUT)

    expect(result).toEqual({ ok: true, code: 'CREATED', campaign: CAMPAIGN_ROW })
  });

  it('maps an IDEMPOTENT_REPLAY payload — the same draft, no second row', async () => {
    const { client } = fakeClient({ data: { ok: true, code: 'IDEMPOTENT_REPLAY', campaign: CAMPAIGN_ROW } })
    const repo = createSupabaseCampaignCreateRepo(client)

    const result = await repo.createCampaign(INPUT)

    expect(result).toEqual({ ok: true, code: 'IDEMPOTENT_REPLAY', campaign: CAMPAIGN_ROW })
  });

  it('maps a READINESS_BLOCKED payload to a sanitized failure', async () => {
    const { client } = fakeClient({
      data: { ok: false, code: 'READINESS_BLOCKED', message: 'Criar campanha: bloqueado por 1 pendência(s).', blockingCode: 'PROJECT_NOT_FOUND' },
    })
    const repo = createSupabaseCampaignCreateRepo(client)

    const result = await repo.createCampaign(INPUT)

    expect(result).toEqual({
      ok: false,
      code: 'READINESS_BLOCKED',
      message: 'Criar campanha: bloqueado por 1 pendência(s).',
    })
  });

  it('maps a STALE_READINESS payload to a sanitized failure', async () => {
    const { client } = fakeClient({
      data: { ok: false, code: 'STALE_READINESS', message: 'O snapshot de prontidão ficou obsoleto — releia antes de executar.' },
    })
    const repo = createSupabaseCampaignCreateRepo(client)

    const result = await repo.createCampaign({ ...INPUT, expectedProjectName: 'Old Name' })

    expect(result).toEqual({
      ok: false,
      code: 'STALE_READINESS',
      message: 'O snapshot de prontidão ficou obsoleto — releia antes de executar.',
    })
  });

  it('maps a CAMPAIGN_CREATE_CONFLICT payload to a sanitized failure', async () => {
    const { client } = fakeClient({
      data: { ok: false, code: 'CAMPAIGN_CREATE_CONFLICT', message: 'Uma campanha com esta chave de idempotência já existe.' },
    })
    const repo = createSupabaseCampaignCreateRepo(client)

    const result = await repo.createCampaign(INPUT)

    expect(result).toEqual({
      ok: false,
      code: 'CAMPAIGN_CREATE_CONFLICT',
      message: 'Uma campanha com esta chave de idempotência já existe.',
    })
  });

  it('maps a 42501 RLS/authorization error to UNAUTHORIZED without leaking the raw DB message', async () => {
    const { client } = fakeClient({
      error: { code: '42501', message: 'workspace membership required to create a campaign' },
    })
    const repo = createSupabaseCampaignCreateRepo(client)

    const result = await repo.createCampaign(INPUT)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('UNAUTHORIZED')
      expect(result.message).not.toContain('workspace membership required')
    }
  });

  it('throws on any other DB error (infrastructure failure, not a domain rejection)', async () => {
    const { client } = fakeClient({ error: { code: '08006', message: 'connection failure' } })
    const repo = createSupabaseCampaignCreateRepo(client)

    await expect(repo.createCampaign(INPUT)).rejects.toThrow(/rpc failed/)
  });

  it('throws when the RPC returns an unexpected payload shape', async () => {
    const { client } = fakeClient({ data: { unexpected: true } })
    const repo = createSupabaseCampaignCreateRepo(client)

    await expect(repo.createCampaign(INPUT)).rejects.toThrow(/unexpected payload/)
  });

  it('throws when the RPC returns null data with no error', async () => {
    const { client } = fakeClient({ data: null })
    const repo = createSupabaseCampaignCreateRepo(client)

    await expect(repo.createCampaign(INPUT)).rejects.toThrow(/unexpected payload/)
  });
})
