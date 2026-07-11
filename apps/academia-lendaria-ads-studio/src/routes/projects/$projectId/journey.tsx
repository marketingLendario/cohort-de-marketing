import { createFileRoute } from '@tanstack/react-router';
import { ProjectJourney } from '@/components/project-journey';

export const Route = createFileRoute('/projects/$projectId/journey')({
  component: JourneyRoute,
});

function JourneyRoute() {
  const { projectId } = Route.useParams();
  return <ProjectJourney projectId={projectId} />;
}

