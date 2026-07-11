import { createFileRoute } from '@tanstack/react-router';
import { ProjectBriefing } from '@/components/project-briefing';

export const Route = createFileRoute('/projects/$projectId/briefing/$sectionId')({
  component: BriefingRoute,
});

function BriefingRoute() {
  const { projectId, sectionId } = Route.useParams();
  return <ProjectBriefing projectId={projectId} sectionId={sectionId} />;
}
