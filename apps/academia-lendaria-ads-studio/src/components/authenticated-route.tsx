import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSpokes } from '@/hooks/use-spokes';
import { LoginForm } from '@/components/login-form';
import { ProjectHydrationBoundary } from '@/components/project-hydration-boundary';
import { useSpokeStore } from '@/stores/spoke-store';

export function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { loading: spokesLoading, error: spokesError } = useSpokes(Boolean(session));
  const activeSpokeId = useSpokeStore((state) => state.activeSpokeId);

  if (authLoading || (session && spokesLoading)) {
    return (
      <main className="cms-centered-state">
        <span className="cms-loader" aria-hidden="true" />
        <p>Preparando seu workspace...</p>
      </main>
    );
  }

  if (!session) return <LoginForm />;

  if (spokesError) {
    return (
      <main className="cms-centered-state">
        <h1>Não foi possível abrir o workspace</h1>
        <p>{spokesError}</p>
      </main>
    );
  }

  return <ProjectHydrationBoundary workspaceId={activeSpokeId}>{children}</ProjectHydrationBoundary>;
}

