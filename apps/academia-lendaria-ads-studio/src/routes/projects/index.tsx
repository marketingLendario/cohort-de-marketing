import { createFileRoute } from '@tanstack/react-router';
import { ProjectsHome } from '@/components/projects-home';

export const Route = createFileRoute('/projects/')({ component: ProjectsHome });

