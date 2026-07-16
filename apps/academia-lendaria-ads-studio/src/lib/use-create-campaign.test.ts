import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdsCampaign } from '@/lib/types';

/**
 * Testes do preflight `campaign.create` em `useCreateCampaign` (AC4 —
 * STORY-12.W1.1). Mocka `@/lib/supabase` (padrão de dashboard.test.tsx) e
 * `@/lib/project-repository` para controlar os três cenários: sem projeto
 * (atalho legado, sem preflight), com projeto bloqueado (READINESS_BLOCKED,
 * zero mutação) e com projeto pronto (segue para o insert).
 */

const SAMPLE: AdsCampaign = {
  id: 'camp-1',
  workspace_id: 'ws-1',
  project_id: 'project-1',
  name: 'Campanha Black Friday',
  status: 'draft',
  step_current: 1,
  created_at: '2026-07-16T00:00:00Z',
};

const insertSingle = vi.fn();
const fromSpy = vi.fn();

vi.mock('@/lib/supabase', () => {
  const builder = {
    insert: vi.fn(() => ({
      select: vi.fn(() => ({ single: () => insertSingle() })),
    })),
  };
  return { supabase: { from: (...args: unknown[]) => (fromSpy(...args), builder) } };
});

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

beforeEach(() => {
  insertSingle.mockReset();
  fromSpy.mockReset();
  getProject.mockReset();
  getActiveBrief.mockReset();
  listArtifacts.mockReset().mockResolvedValue([]);
  listSkillRuns.mockReset().mockResolvedValue([]);
});

describe('useCreateCampaign — preflight campaign.create (AC4)', () => {
  it('skips the preflight and inserts directly when no projectId is given (legacy dashboard shortcut)', async () => {
    insertSingle.mockResolvedValue({ data: SAMPLE, error: null });
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = null;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Campanha Black Friday');
    });

    expect(getProject).not.toHaveBeenCalled();
    expect(created).toEqual(SAMPLE);
    expect(fromSpy).toHaveBeenCalledWith('ads_campaigns');
  });

  it('blocks with READINESS_BLOCKED and performs zero mutation when the project has no active project row', async () => {
    getProject.mockResolvedValue(null);
    getActiveBrief.mockResolvedValue(null);
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = SAMPLE;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Nova campanha', 'project-1');
    });

    expect(created).toBeNull();
    expect(insertSingle).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.error).toMatch(/bloqueado/));
    expect(result.current.error).not.toMatch(/\/Users\/|\/home\//);
  });

  it('runs the preflight and proceeds to insert when campaign.create is ready', async () => {
    getProject.mockResolvedValue({
      id: 'project-1',
      workspaceId: 'ws-1',
      slug: 'demo',
      name: 'Projeto Demo',
      status: 'active',
      activeBriefRevisionId: 'brief-1',
      createdAt: '2026-07-09T00:00:00.000Z',
      updatedAt: '2026-07-09T00:00:00.000Z',
    });
    getActiveBrief.mockResolvedValue(null);
    insertSingle.mockResolvedValue({ data: SAMPLE, error: null });
    const { result } = renderHook(() => useCreateCampaign());

    let created: AdsCampaign | null = null;
    await act(async () => {
      created = await result.current.createCampaign('ws-1', 'Campanha Black Friday', 'project-1');
    });

    expect(created).toEqual(SAMPLE);
    expect(result.current.error).toBeNull();
    expect(fromSpy).toHaveBeenCalledWith('ads_campaigns');
  });
});
