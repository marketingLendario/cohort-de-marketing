import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { UnifiedShell } from '@/components/unified-shell';
import { useProjectStore } from '@/stores/project-store';

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const project = useProjectStore((state) => state.projects.find((candidate) => candidate.id === projectId));
  const setActiveProject = useProjectStore((state) => state.setActiveProject);

  useEffect(() => {
    if (project) setActiveProject(projectId);
  }, [project, projectId, setActiveProject]);

  if (!project) {
    return (
      <main className="cms-centered-state">
        <h1>Projeto não encontrado</h1>
        <p>Volte para a lista de projetos e escolha outro item.</p>
      </main>
    );
  }

  return <UnifiedShell projectId={projectId}><Outlet /></UnifiedShell>;
}

export const Route = createFileRoute('/projects/$projectId')({ component: ProjectLayout });
