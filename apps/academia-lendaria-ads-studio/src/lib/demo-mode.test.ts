import { beforeEach, describe, expect, it } from 'vitest';
import {
  createDemoCampaign,
  getDemoCampaign,
  updateDemoCampaignName,
} from '@/lib/demo-mode';

describe('demo campaign metadata', () => {
  beforeEach(() => localStorage.clear());

  it('loads and renames a campaign draft', () => {
    const campaign = createDemoCampaign('workspace-1', 'Nova campanha');

    expect(getDemoCampaign(campaign.id)?.name).toBe('Nova campanha');
    expect(updateDemoCampaignName(campaign.id, 'Mentoria Tráfego Lendário')?.name).toBe(
      'Mentoria Tráfego Lendário',
    );
    expect(getDemoCampaign(campaign.id)?.name).toBe('Mentoria Tráfego Lendário');
  });

  it('resumes a missing demo campaign during rename', () => {
    expect(updateDemoCampaignName('missing', 'Produto')).toMatchObject({
      id: 'missing',
      workspace_id: 'demo-spoke-academia-lendaria',
      name: 'Produto',
      step_current: 1,
    });
    expect(getDemoCampaign('missing')?.name).toBe('Produto');
  });
});
