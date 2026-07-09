import { createFileRoute } from '@tanstack/react-router';
import { ProjectOverview } from '@/components/project-overview';

function OverviewRoute() {
  const { projectId } = Route.useParams();
  return <ProjectOverview projectId={projectId} />;
}

export const Route = createFileRoute('/projects/$projectId/overview')({ component: OverviewRoute });

