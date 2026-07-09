import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CampaignStructureStep } from '@/components/wizard/campaign-structure-step';
import { CreativeBriefStep } from '@/components/wizard/creative-brief-step';
import { CreativeFactoryStep } from '@/components/wizard/creative-factory-step';
import { FunnelSelectionStep } from '@/components/wizard/funnel-selection-step';
import { CampaignPublicationStep } from '@/components/wizard/campaign-publication-step';
import { PerformanceMonitorStep } from '@/components/wizard/performance-monitor-step';
import { TrackingAuditStep } from '@/components/wizard/tracking-audit-step';
import { UnitEconomicsStep } from '@/components/wizard/unit-economics-step';
import { WizardShell } from '@/components/wizard/wizard-shell';
import { LoginForm } from '@/components/login-form';
import { useAuth } from '@/hooks/use-auth';
import { useSpokes } from '@/hooks/use-spokes';

/**
 * Wizard de campanha (STORY-AL-ADS-1.4 shell; Telas 1+ nas stories 1.5+).
 *
 * "+ Nova campanha" cria o draft e entra aqui no `step_current` (estado
 * retomável — FR37). step=1 = Tela 1 (Setup Produto + Unit Economics,
 * STORY-AL-ADS-1.5). Os demais passos chegam nas stories seguintes — para eles
 * mantemos o placeholder honesto (não inventar Telas — Art. IV).
 */
function WizardStep() {
  const { campaignId, step } = Route.useParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { loading: spokesLoading, error: spokesError } = useSpokes(Boolean(session));
  const currentStep = Number.parseInt(step, 10);

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

  return (
    <WizardShell campaignId={campaignId} currentStep={Number.isFinite(currentStep) ? currentStep : 1} onNavigateStep={goToStep}>
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
        />
      ) : step === '8' ? (
        <PerformanceMonitorStep campaignId={campaignId} onBack={() => goToStep(7)} />
      ) : (
        <p style={{ opacity: 0.7 }}>
          Este passo do wizard chega nas próximas stories.
        </p>
      )}
    </WizardShell>
  );
}

export const Route = createFileRoute('/campaigns/$campaignId/$step')({
  component: WizardStep,
});
