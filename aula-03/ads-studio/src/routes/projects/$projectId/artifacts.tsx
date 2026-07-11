import { createFileRoute } from '@tanstack/react-router';
import { ProjectArtifacts } from '@/components/project-artifacts';

export const Route = createFileRoute('/projects/$projectId/artifacts')({
  component: ArtifactsRoute,
});

function ArtifactsRoute() {
  const { projectId } = Route.useParams();
  return <ProjectArtifacts projectId={projectId} />;
}
