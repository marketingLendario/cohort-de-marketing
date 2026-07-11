import { createFileRoute } from '@tanstack/react-router';
import { ProjectCampaigns } from '@/components/project-campaigns';

function CampaignsRoute() {
  const { projectId } = Route.useParams();
  return <ProjectCampaigns projectId={projectId} />;
}

export const Route = createFileRoute('/projects/$projectId/campaigns/')({ component: CampaignsRoute });

