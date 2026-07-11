import { createFileRoute } from '@tanstack/react-router';
import { TrafficCampaignWorkspace } from '@/components/traffic-campaign-workspace';

function CampaignStageRoute() {
  const { projectId, campaignId, stageId } = Route.useParams();
  return <TrafficCampaignWorkspace projectId={projectId} campaignId={campaignId} stageId={stageId} />;
}

export const Route = createFileRoute('/projects/$projectId/campaigns/$campaignId/$stageId')({ component: CampaignStageRoute });
