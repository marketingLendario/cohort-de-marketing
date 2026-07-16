import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdsCampaign } from '@/lib/types';

/**
 * Testes do enforcement transacional `campaign.create` em `useCreateCampaign`
 * (STORY-12.W1.1 AC4, reescritos pela STORY-12.W4.1 — cutover legado).
 *
 * Antes desta story, `createCampaign` sem `projectId` (atalho do dashboard
 * legado) pulava QUALQUER preflight e inseria direto em `ads_campaigns` — o
 * "side door" que esta story fecha. Agora TODA criação real passa pela mesma
 * RPC transacional/idempotente `campaign_create_readiness_rpc` (STORY-12.W4.2)
 * — mockada aqui via `supabase.rpc`, nunca `.from('ads_campaigns').insert(...)`
 * (a asserção `fromSpy` de qualquer chamada a `.from` prova isso por
 * construção, não só por leitura de código).
 */

const SAMPLE_DRAFT = {
  id: 'camp-1',
  workspaceId: 'ws-1',
  projectId: 'project-1',
  name: 'Campanha Black Friday',
  status: 'draft',
  stepCurrent: 1,
  createdAt: '2026-07-16T00:00:00Z',
};

const SAMPLE: AdsCampaign = {
  id: 'camp-1',
  workspace_id: 'ws-1',
  project_id: 'project-1',
  name: 'Campanha Black Friday',
  status: 'draft',
  step_current: 1,
  created_at: '2026-07-16T00:00:00Z',
};

const rpcSpy = vi.fn();
const fromSpy = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => (fromSpy(...args), { insert: vi.fn() }),
    rpc: (...args: unknown[]) => rpcSpy(...args),
  },
}));

const getProject = vi.fn();
const getActiveBrief = vi.fn();
const listArtifacts = vi.fn();
const listSkillRuns = vi.fn();

vi.mock('@/lib/project-repository', () => ({
  projectRepository: {
    getProject: (...args: unknown[]) => getProject(...args),
    getActiveBrief: (...args: unknown[]) => getActiveBrief(...args),
    listArtifacts: (...args: unknown[]) => listArtifacts(...args),
    listSkillRuns: (...args: unknown[]) => listSkillRuns(...args),
  },
}));

import { useCreateCampaign } from '@/lib/use-create-campaign';

const READY_PROJECT = {
  id: 'project-1',
  workspaceId: 'ws-1',
  slug: 'demo',
  name: 'Projeto Demo',
  status: 'active' as const,
  activeBriefRevisionId: 'brief-1',
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
};

beforeEach(() => {
  rpcSpy.mockReset();
  fromSpy.mockReset();
  getProject.mockReset();
  getActiveBrief.mockReset();
  listArtifacts.mockReset().mockResolvedValue([]);
  listSkillRuns.mockReset().mockResolvedValue([]);
});

describe('useCreateCampaign — enforcement transacional campaign.create (STORY-12.W4.1)', () => {
  it('blocks with READINESS_BLOCKED and performs zero network/mutation when no projectId is given (closed side door)', async () => {
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = SAMPLE;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Nova campanha');
    });

    expect(created).toBeNull();
    expect(rpcSpy).not.toHaveBeenCalled();
    expect(fromSpy).not.toHaveBeenCalled();
    expect(getProject).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.error).toMatch(/bloqueado/));
    expect(result.current.error).not.toMatch(/\/Users\/|\/home\//);
  });

  it('blocks with READINESS_BLOCKED and performs zero mutation when the project has no active project row (client preflight)', async () => {
    getProject.mockResolvedValue(null);
    getActiveBrief.mockResolvedValue(null);
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = SAMPLE;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Nova campanha', 'project-1');
    });

    expect(created).toBeNull();
    expect(rpcSpy).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.error).toMatch(/bloqueado/));
    expect(result.current.error).not.toMatch(/\/Users\/|\/home\//);
  });

  it('calls campaign_create_readiness_rpc with the correct params and returns the mapped campaign on CREATED', async () => {
    getProject.mockResolvedValue(READY_PROJECT);
    getActiveBrief.mockResolvedValue(null);
    rpcSpy.mockResolvedValue({ data: { ok: true, code: 'CREATED', campaign: SAMPLE_DRAFT }, error: null });
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = null;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Campanha Black Friday', 'project-1');
    });

    expect(created).toEqual(SAMPLE);
    expect(result.current.error).toBeNull();
    expect(fromSpy).not.toHaveBeenCalled();
    expect(rpcSpy).toHaveBeenCalledTimes(1);
    const [name, params] = rpcSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(name).toBe('campaign_create_readiness_rpc');
    expect(params).toMatchObject({
      p_workspace_id: 'ws-1',
      p_project_id: 'project-1',
      p_name: 'Campanha Black Friday',
      p_expected_project_name: 'Projeto Demo',
    });
    expect(typeof params.p_idempotency_key).toBe('string');
    expect((params.p_idempotency_key as string).length).toBeGreaterThan(0);
  });

  it('maps an IDEMPOTENT_REPLAY payload to the same campaign — a retry never duplicates', async () => {
    getProject.mockResolvedValue(READY_PROJECT);
    getActiveBrief.mockResolvedValue(null);
    rpcSpy.mockResolvedValue({ data: { ok: true, code: 'IDEMPOTENT_REPLAY', campaign: SAMPLE_DRAFT }, error: null });
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = null;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Campanha Black Friday', 'project-1');
    });

    expect(created).toEqual(SAMPLE);
    expect(result.current.error).toBeNull();
  });

  it('surfaces a server-side READINESS_BLOCKED (stale client cache) as a sanitized error with zero mutation', async () => {
    getProject.mockResolvedValue(READY_PROJECT);
    getActiveBrief.mockResolvedValue(null);
    rpcSpy.mockResolvedValue({
      data: { ok: false, code: 'READINESS_BLOCKED', message: 'Criar campanha: bloqueado por 1 pendência(s).' },
      error: null,
    });
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = SAMPLE;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Campanha Black Friday', 'project-1');
    });

    expect(created).toBeNull();
    expect(result.current.error).toBe('Criar campanha: bloqueado por 1 pendência(s).');
  });

  it('surfaces STALE_READINESS as an actionable conflict without leaking internals', async () => {
    getProject.mockResolvedValue(READY_PROJECT);
    getActiveBrief.mockResolvedValue(null);
    rpcSpy.mockResolvedValue({
      data: { ok: false, code: 'STALE_READINESS', message: 'O snapshot de prontidão ficou obsoleto — releia antes de executar.' },
      error: null,
    });
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = SAMPLE;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Campanha Black Friday', 'project-1');
    });

    expect(created).toBeNull();
    expect(result.current.error).toMatch(/obsoleto/);
  });

  it('surfaces CAMPAIGN_CREATE_CONFLICT (concurrent/repeated idempotency key) as an actionable conflict', async () => {
    getProject.mockResolvedValue(READY_PROJECT);
    getActiveBrief.mockResolvedValue(null);
    rpcSpy.mockResolvedValue({
      data: { ok: false, code: 'CAMPAIGN_CREATE_CONFLICT', message: 'Uma campanha com esta chave de idempotência já existe.' },
      error: null,
    });
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = SAMPLE;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Campanha Black Friday', 'project-1');
    });

    expect(created).toBeNull();
    expect(result.current.error).toMatch(/já existe/);
  });

  it('maps a 42501 RLS/authorization error (direct bypass) to a sanitized UNAUTHORIZED message', async () => {
    getProject.mockResolvedValue(READY_PROJECT);
    getActiveBrief.mockResolvedValue(null);
    rpcSpy.mockResolvedValue({ data: null, error: { code: '42501', message: 'workspace membership required to create a campaign' } });
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = SAMPLE;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Campanha Black Friday', 'project-1');
    });

    expect(created).toBeNull();
    expect(result.current.error).not.toContain('workspace membership required');
    expect(result.current.error).toMatch(/permiss/i);
  });

  it('surfaces an unexpected infra error (e.g. connectivity) as a generic sanitized message, never raw', async () => {
    getProject.mockResolvedValue(READY_PROJECT);
    getActiveBrief.mockResolvedValue(null);
    rpcSpy.mockResolvedValue({ data: null, error: { code: '08006', message: 'connection failure to internal-db-host.local' } });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = SAMPLE;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Campanha Black Friday', 'project-1');
    });

    expect(created).toBeNull();
    expect(result.current.error).not.toMatch(/internal-db-host/);
    expect(result.current.error).toMatch(/tente novamente/i);
    consoleSpy.mockRestore();
  });
});
