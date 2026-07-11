import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/lib/lendaria-ds';
import { DEMO_AUTH_ENABLED, signOutDemo } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useSpokes } from '@/hooks/use-spokes';
import { useSpokeStore } from '@/stores/spoke-store';
import { LoginForm } from '@/components/login-form';
import { SpokeSelector } from '@/components/spoke-selector';
import { Dashboard } from '@/components/dashboard';
import { ProjectHydrationBoundary } from '@/components/project-hydration-boundary';
import type { AdsCampaign } from '@/lib/types';

/**
 * Rota da Home / Dashboard — Tela 0 (STORY-AL-ADS-1.4).
 *
 * Hospeda o shell autenticado (REUSE da 1.2: useAuth, useSpokes, SpokeSelector,
 * LoginForm) e o `Dashboard` (grid de campanhas + Nova campanha + alertas persistidos).
 *
 * "+ Nova campanha" cria um draft e navega ao wizard no `step_current` da
 * campanha (AC2). A rota do wizard é legada e permanece recuperável durante
 * o cutover para o workspace unificado.
 */
function DashboardPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const reset = useSpokeStore((s) => s.reset);
  const activeSpokeId = useSpokeStore((s) => s.activeSpokeId);
  const { loading: spokesLoading, error: spokesError } = useSpokes(Boolean(session));

  async function handleSignOut() {
    if (DEMO_AUTH_ENABLED) {
      signOutDemo();
    } else {
      await supabase.auth.signOut();
    }
    reset();
  }

  function goToWizard(campaign: AdsCampaign) {
    navigate({
      to: '/campaigns/$campaignId/$step',
      params: { campaignId: campaign.id, step: String(campaign.step_current) },
    });
  }

  if (authLoading) {
    return <main style={{ padding: '2rem' }}>Carregando…</main>;
  }

  if (!session) {
    return <LoginForm />;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '64rem', margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Academia Lendária Ads Studio</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SpokeSelector />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sair
          </Button>
        </div>
      </header>

      {spokesLoading ? (
        <p style={{ opacity: 0.7 }}>Carregando spokes…</p>
      ) : spokesError ? (
        <p style={{ opacity: 0.7 }}>Falha ao carregar spokes: {spokesError}</p>
      ) : (
        <ProjectHydrationBoundary workspaceId={activeSpokeId}>
          <Dashboard onNavigateToWizard={goToWizard} />
        </ProjectHydrationBoundary>
      )}
    </main>
  );
}

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
});
