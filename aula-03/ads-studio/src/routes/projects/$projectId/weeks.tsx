import { createFileRoute } from '@tanstack/react-router';
import { ProjectWeeks } from '@/components/project-weeks';

export const Route = createFileRoute('/projects/$projectId/weeks')({
  component: WeeksRoute,
});

function WeeksRoute() {
  const { projectId } = Route.useParams();
  return <ProjectWeeks projectId={projectId} />;
}
