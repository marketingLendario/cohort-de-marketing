import type { AdsCampaign } from '@/lib/types';

export function resolveUnifiedProjectsHref(
  campaigns: readonly AdsCampaign[],
  projectIds: ReadonlySet<string>,
  queryCampaignId: string | null,
): string {
  const bridgeCampaign = queryCampaignId
    ? campaigns.find((campaign) => campaign.id === queryCampaignId && campaign.project_id)
    : campaigns.find((campaign) => campaign.project_id && projectIds.has(campaign.project_id));

  if (bridgeCampaign?.project_id && projectIds.has(bridgeCampaign.project_id)) {
    return `/projects/${encodeURIComponent(bridgeCampaign.project_id)}/overview?campaignId=${encodeURIComponent(bridgeCampaign.id)}`;
  }

  return queryCampaignId
    ? `/projects?legacyCampaignId=${encodeURIComponent(queryCampaignId)}`
    : '/projects';
}
