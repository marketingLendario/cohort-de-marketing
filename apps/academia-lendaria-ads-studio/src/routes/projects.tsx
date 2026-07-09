import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AuthenticatedRoute } from '@/components/authenticated-route';

export const Route = createFileRoute('/projects')({
  component: () => <AuthenticatedRoute><Outlet /></AuthenticatedRoute>,
});

