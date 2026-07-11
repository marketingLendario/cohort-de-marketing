import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CampaignStructureStep } from '@/components/wizard/campaign-structure-step';
import { CreativeBriefStep } from '@/components/wizard/creative-brief-step';
import { CreativeFactoryStep } from '@/components/wizard/creative-factory-step';
import { FunnelSelectionStep } from '@/components/wizard/funnel-selection-step';
import { CampaignPublicationStep } from '@/components/wizard/campaign-publication-step';
import { TrackingAuditStep } from '@/components/wizard/tracking-audit-step';
import { UnitEconomicsStep } from '@/components/wizard/unit-economics-step';
import { WizardShell } from '@/components/wizard/wizard-shell';
import { LoginForm } from '@/components/login-form';
import { useAuth } from '@/hooks/use-auth';
import { useSpokes } from '@/hooks/use-spokes';
import { DEMO_AUTH_ENABLED, getDemoCampaign } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import type { AdsCampaign } from '@/lib/types';

/**
 * Wizard de campanha legado, mantido como superfície recuperável durante o cutover.
 *
 * "+ Nova campanha" cria o draft e entra aqui no `step_current` (estado
 * retomável — FR37). step=1 = Tela 1 (Setup Produto + Unit Economics).
 * Etapas sem conteúdo específico permanecem neutras e apontam para a ponte
 * unificada, sem inventar dados de campanha.
 */
function WizardStep() {
  const { campaignId, step } = Route.useParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { loading: spokesLoading, error: spokesError } = useSpokes(Boolean(session));
  const currentStep = Number.parseInt(step, 10);
  const isValidStep = ['1', '2', '3', '4', '5', '6', '7', '8'].includes(step);

  function goToStep(targetStep: number) {
    navigate({
      to: '/campaigns/$campaignId/$step',
      params: { campaignId, step: String(targetStep) },
    });
  }

  if (authLoading || (session && spokesLoading)) {
    return <main className="asx-route-state">Carregando campanha…</main>;
  }

  if (!session) {
    return <LoginForm />;
  }

  if (spokesError) {
    return <main className="asx-route-state">Falha ao carregar o workspace: {spokesError}</main>;
  }

  if (!isValidStep) {
    return (
      <main className="asx-route-state">
        <h1>Passo de campanha inválido</h1>
        <p>O caminho não corresponde a uma das oito etapas recuperáveis.</p>
        <a className="al-btn al-btn--primary" href={`/projects?legacyCampaignId=${encodeURIComponent(campaignId)}&legacyStep=${encodeURIComponent(step)}`}>Abrir projetos</a>
      </main>
    );
  }

  return (
    <WizardShell campaignId={campaignId} currentStep={Number.isFinite(currentStep) ? currentStep : 1} onNavigateStep={goToStep}>
      <LegacyCutoverBridge campaignId={campaignId} step={step} />
      {step === '1' ? (
        <UnitEconomicsStep campaignId={campaignId} onAdvanced={goToStep} />
      ) : step === '2' ? (
        <FunnelSelectionStep campaignId={campaignId} onBack={() => goToStep(1)} onAdvanced={goToStep} />
      ) : step === '3' ? (
        <CampaignStructureStep campaignId={campaignId} onBack={() => goToStep(2)} onAdvanced={goToStep} />
      ) : step === '4' ? (
        <CreativeBriefStep campaignId={campaignId} onBack={() => goToStep(3)} onAdvanced={goToStep} />
      ) : step === '5' ? (
        <CreativeFactoryStep campaignId={campaignId} onBack={() => goToStep(4)} onAdvanced={goToStep} />
      ) : step === '6' ? (
        <TrackingAuditStep campaignId={campaignId} onBack={() => goToStep(5)} onAdvanced={goToStep} />
      ) : step === '7' ? (
        <CampaignPublicationStep
          campaignId={campaignId}
          onBack={() => goToStep(6)}
          onNavigateStep={goToStep}
          onAdvanced={goToStep}
          readOnly
        />
      ) : step === '8' ? (
        <section className="cms-section" aria-labelledby="legacy-monitor-title">
          <span className="cms-kicker">Operação semanal</span>
          <h2 id="legacy-monitor-title">Leitura e diagnóstico no projeto unificado</h2>
          <p>O monitor legado foi substituído pela operação semanal persistida. Use a ponte acima para revisar recomendações e evidências sem executar ações na campanha.</p>
        </section>
      ) : (
        <p style={{ opacity: 0.7 }}>
          Esta etapa não está disponível nesta rota.
        </p>
      )}
    </WizardShell>
  );
}

const UNIFIED_STAGES = ['foundations', 'tracking', 'briefista', 'curation', 'structure', 'submission', 'metrics', 'diagnosis'] as const;

function LegacyCutoverBridge({ campaignId, step }: { campaignId: string; step: string }) {
  const [campaign, setCampaign] = useState<AdsCampaign | null | undefined>(() => getDemoCampaign(campaignId));
  const [resolving, setResolving] = useState(() => getDemoCampaign(campaignId) === null);

  useEffect(() => {
    let mounted = true;
    const localCampaign = getDemoCampaign(campaignId);
    if (localCampaign) {
      setCampaign(localCampaign);
      setResolving(false);
      return () => { mounted = false; };
    }
    if (DEMO_AUTH_ENABLED) {
      setCampaign(null);
      setResolving(false);
      return () => { mounted = false; };
    }

    setResolving(true);
    void supabase
      .from('ads_campaigns')
      .select('id, workspace_id, project_id, name, status, step_current, created_at')
      .eq('id', campaignId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        setCampaign(error || !data ? null : data as AdsCampaign);
        setResolving(false);
      });

    return () => { mounted = false; };
  }, [campaignId]);

  const stage = UNIFIED_STAGES[Math.max(0, Math.min(7, Number.parseInt(step, 10) - 1))] ?? 'foundations';
  const href = campaign?.project_id
    ? `/projects/${encodeURIComponent(campaign.project_id)}/campaigns/${encodeURIComponent(campaign.id)}/${stage}?legacyStep=${encodeURIComponent(step)}`
    : `/projects?legacyCampaignId=${encodeURIComponent(campaignId)}&legacyStep=${encodeURIComponent(step)}`;

  return (
    <aside className="cms-next-action" aria-label="Retorno ao workspace unificado" data-testid="legacy-cutover-bridge">
      <div className="cms-next-action__marker"><span aria-hidden="true">↗</span></div>
      <div className="cms-next-action__copy">
        <span className="cms-kicker">Compatibilidade de rota</span>
        <h2>Esta é uma etapa legada</h2>
        <p>{resolving ? 'Localizando o vínculo persistido da campanha...' : campaign?.project_id ? 'A campanha agora continua no projeto unificado, com esta etapa preservada.' : 'O vínculo com um projeto não foi confirmado; abra o workspace para localizar a campanha com segurança.'}</p>
      </div>
      <a className="al-btn al-btn--primary cms-action-link" href={href}>
        {campaign?.project_id ? 'Ir para campanha unificada' : 'Abrir projetos'}
      </a>
    </aside>
  );
}

export const Route = createFileRoute('/campaigns/$campaignId/$step')({
  component: WizardStep,
});
