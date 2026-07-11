import { describe, expect, it } from 'vitest';
import { canStructureCampaign, createInitialCampaignPlan, TRACKING_CHECKS, trackingStatus, updateTrackingCheck } from '@/lib/campaign-plan';
import type { ProjectBriefRevision } from '@/lib/project-domain';

const brief: ProjectBriefRevision = {
  schemaVersion: '1.0.0',
  id: 'brief-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  revision: 1,
  status: 'active',
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
  data: {
    schemaVersion: '0.1.0',
    project: { slug: 'demo' },
    market: { dominantPain: 'Dor real', awarenessLevel: 2 },
    channels: { primaryCtaUrl: 'https://example.com' },
  },
  fieldSources: {},
};

describe('campaign plan', () => {
  it('inherits campaign foundations from a brief revision', () => {
    const plan = createInitialCampaignPlan('project-1', 'campaign-1', brief, '2026-07-09T00:00:00.000Z');
    expect(plan.sourceBrief).toEqual({ id: 'brief-1', revision: 1 });
    expect(plan.angles[0]?.name).toBe('Dor real');
    expect(plan.landingPageUrl).toBe('https://example.com');
  });

  it('requires literal evidence for every critical tracking check', () => {
    const plan = createInitialCampaignPlan('project-1', 'campaign-1', brief);
    let next = plan;
    for (const check of TRACKING_CHECKS) {
      next = updateTrackingCheck(next, check.id, { value: true, evidence: `Confirmado: ${check.label}` });
    }
    expect(trackingStatus(next.tracking.checks)).toBe('OK');
    next = updateTrackingCheck(next, 'capiActive', { evidence: '' });
    expect(next.tracking.status).toBe('CRITICO');
  });

  it('blocks structure below the budget floor or without human finalists', () => {
    const plan = createInitialCampaignPlan('project-1', 'campaign-1', brief);
    expect(canStructureCampaign(plan)).toBe(false);
    expect(canStructureCampaign({
      ...plan,
      budget: { ...plan.budget, daily: 19 },
      tracking: { ...plan.tracking, status: 'OK', criticalItemsConfirmed: true },
      finalists: [
        { id: '1', angleId: 'angle-1', hook: 'A', copy: 'A', format: 'feed', selectedByHuman: true },
        { id: '2', angleId: 'angle-1', hook: 'B', copy: 'B', format: 'feed', selectedByHuman: true },
      ],
    })).toBe(false);
  });
});
