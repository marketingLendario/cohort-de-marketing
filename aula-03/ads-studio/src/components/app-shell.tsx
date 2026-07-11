import { Button } from '@/lib/lendaria-ds';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useSpokes } from '@/hooks/use-spokes';
import { useSpokeStore } from '@/stores/spoke-store';
import { LoginForm } from '@/components/login-form';
import { SpokeSelector } from '@/components/spoke-selector';
import { CampaignsList } from '@/components/campaigns-list';

/**
 * Shell autenticado (AC1/AC2/AC3 — STORY-AL-ADS-1.2).
 *
 * Orquestra o fluxo: sem sessão → LoginForm (AC1). Com sessão → carrega os
 * spokes do usuário (AC1, via RLS), mostra o seletor (AC2) e a lista de
 * campanhas re-escopada pelo spoke ativo (AC3).
 */
export function AppShell() {
  const { session, loading: authLoading } = useAuth();
  const reset = useSpokeStore((s) => s.reset);

  // Só busca spokes quando há sessão (RLS aplica sob a identidade do usuário).
  const { loading: spokesLoading, error: spokesError } = useSpokes(Boolean(session));

  async function handleSignOut() {
    await supabase.auth.signOut();
    reset();
  }

  if (authLoading) {
    return <main style={{ padding: '2rem' }}>Carregando…</main>;
  }

  if (!session) {
    return <LoginForm />;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Ads Studio</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SpokeSelector />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sair
          </Button>
        </div>
      </header>

      <section>
        <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
          Campanhas
        </h2>
        {spokesLoading ? (
          <p style={{ opacity: 0.7 }}>Carregando spokes…</p>
        ) : spokesError ? (
          <p style={{ opacity: 0.7 }}>Falha ao carregar spokes: {spokesError}</p>
        ) : (
          <CampaignsList />
        )}
      </section>
    </main>
  );
}
