import { Link } from '@tanstack/react-router';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';
import { Icon } from '@/lib/lendaria-ds';
import { useSpokeStore } from '@/stores/spoke-store';

export interface WizardStepMeta {
  num: number;
  label: string;
  title: string;
  accent: string;
  eyebrowSuffix?: string;
}

const WIZARD_STEPS: WizardStepMeta[] = [
  { num: 1, label: 'Viabilidade', title: 'Viabilidade do', accent: 'produto' },
  { num: 2, label: 'Funil', title: 'Seleção de', accent: 'funil' },
  { num: 3, label: 'Estrutura', title: 'Estrutura da', accent: 'campanha' },
  { num: 4, label: 'Briefing', title: 'Briefing', accent: 'criativo' },
  { num: 5, label: 'Criativos', title: 'Fábrica de', accent: 'criativos' },
  { num: 6, label: 'Tracking', title: 'Auditoria de', accent: 'tracking', eyebrowSuffix: ' · Gate #2' },
  { num: 7, label: 'Publicação', title: 'Revisão &', accent: 'publicação' },
  { num: 8, label: 'Monitor', title: 'Monitoramento', accent: '' },
];

interface WizardShellProps {
  campaignId: string;
  currentStep: number;
  children: ReactNode;
  onNavigateStep: (targetStep: number) => void;
}

function getStepStatus(
  stepNum: number,
  currentStep: number,
): 'completed' | 'current' | 'ready' | 'available' | 'locked' {
  if (stepNum < currentStep) return 'completed';
  if (stepNum === currentStep) return 'current';
  if (stepNum === 7 && currentStep < 7) return 'locked';
  if (stepNum === currentStep + 1 && stepNum <= 5) return 'ready';
  return 'available';
}

function getStepIcon(status: ReturnType<typeof getStepStatus>, stepNum: number) {
  if (status === 'completed') return <Icon name="check" size={13} />;
  if (status === 'locked') return <Icon name="lock" size={12} />;
  return stepNum;
}

export function WizardShell({ campaignId, currentStep, children, onNavigateStep }: WizardShellProps) {
  const { theme, setTheme } = useTheme();
  const spokes = useSpokeStore((state) => state.spokes);
  const activeSpokeId = useSpokeStore((state) => state.activeSpokeId);
  const accountName = spokes.find((spoke) => spoke.id === activeSpokeId)?.name ?? 'Academia Lendária';
  const currentMeta = WIZARD_STEPS.find((step) => step.num === currentStep) ?? {
    num: currentStep,
    label: `Passo ${currentStep}`,
    title: 'Wizard de campanha',
    accent: `passo ${currentStep}`,
  };
  const progressPct = Math.round((Math.min(Math.max(currentStep, 1), WIZARD_STEPS.length) / WIZARD_STEPS.length) * 100);
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <div className="asx-stage">
      <div className="asx-app al-scrollbar">
        <header className="asx-topbar">
          <div className="asx-topbar__left">
            <div className="asx-brand">
              <span className="asx-wordmark">
                Lendár<em>[IA]</em>
              </span>
              <span className="asx-brand__rule" />
              <span className="asx-brand__product">Ads Studio</span>
            </div>
            <button className="asx-account" type="button" aria-label={`Conta ${accountName}`}>
              <span className="asx-account__dot">AL</span>
              <span className="asx-account__name">{accountName}</span>
              <Icon name="nav-arrow-down" size={14} color="var(--muted-foreground)" />
            </button>
          </div>

          <div className="asx-topbar__actions">
            <button
              className="asx-iconbtn"
              type="button"
              onClick={() => setTheme(nextTheme)}
              title="Alternar tema"
              aria-label="Alternar tema"
            >
              <Icon name={theme === 'light' ? 'half-moon' : 'sun-light'} size={16} />
            </button>
          </div>
        </header>

        <div className="asx-mobile-progress">
          <div className="asx-mobile-progress__row">
            <span>
              Passo {currentMeta.num} de 8 · {currentMeta.label}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="asx-mobile-progress__bar" aria-hidden="true">
            <div style={{ width: `${progressPct}%` }} />
          </div>
          <div className="asx-mobile-steps al-scrollbar">
            <Link to="/dashboard" className="asx-mobile-step asx-mobile-step--home">
              Home
            </Link>
            {WIZARD_STEPS.map((step) => {
              const status = getStepStatus(step.num, currentStep);
              const locked = status === 'locked';
              return (
                <button
                  key={step.num}
                  type="button"
                  className={`asx-mobile-step asx-mobile-step--${status}`}
                  disabled={locked}
                  onClick={() => onNavigateStep(step.num)}
                >
                  {step.num} {step.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="asx-body" data-campaign-id={campaignId}>
          <nav className="asx-stepper" aria-label="Wizard de campanha">
            <div className="asx-stepper__eyebrow">Wizard · 8 passos</div>
            <Link to="/dashboard" className="asx-step asx-step--home">
              <span className="asx-step__index">
                <Icon name="home-simple-door" size={12} />
              </span>
              <span className="asx-step__label">Home</span>
            </Link>
            {WIZARD_STEPS.map((step) => {
              const status = getStepStatus(step.num, currentStep);
              const locked = status === 'locked';
              return (
                <button
                  key={step.num}
                  type="button"
                  className={`asx-step asx-step--${status}`}
                  disabled={locked}
                  onClick={() => onNavigateStep(step.num)}
                >
                  <span className="asx-step__index">{getStepIcon(status, step.num)}</span>
                  <span className="asx-step__label">{step.label}</span>
                  {status === 'ready' && <span className="asx-step__tag">próx.</span>}
                </button>
              );
            })}
            <div className="asx-stepper__note">
              Converte consumo em <span>execução</span>.
            </div>
          </nav>

          <main className="asx-main al-scrollbar">
            <div className="asx-page">
              <div className="asx-page-head">
                <div>
                  <div className="asx-page-head__eyebrow">
                    Passo {currentMeta.num} · Wizard{currentMeta.eyebrowSuffix ?? ''}
                  </div>
                  <h1 className="asx-page-head__title">
                    {currentMeta.title}{currentMeta.accent ? <> <em>{currentMeta.accent}</em></> : null}
                  </h1>
                </div>
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
