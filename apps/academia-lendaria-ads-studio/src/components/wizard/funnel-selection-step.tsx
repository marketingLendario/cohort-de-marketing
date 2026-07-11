import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { computeUnitEconomics } from '@/lib/ads-economics';
import {
  getDemoFunnelSelection,
  getDemoUnitEconomics,
  saveDemoFunnelSelection,
  updateDemoCampaignStep,
} from '@/lib/demo-mode';
import {
  DEFAULT_FUNNEL_FORM,
  FUNNEL_OPTIONS,
  findFunnelOption,
  resolveFunnelSelection,
  type AudienceTemperature,
  type FunnelForm,
  type FunnelKey,
} from '@/lib/funnel-selection';
import { Button, Icon } from '@/lib/lendaria-ds';
import { toEconomicsInputs } from '@/stores/unit-economics-store';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const TEMPERATURE_OPTIONS: Array<{ value: AudienceTemperature; label: string }> = [
  { value: 'cold', label: 'Frio' },
  { value: 'warm', label: 'Morno' },
  { value: 'hot', label: 'Quente' },
];

function boolLabel(value: boolean): string {
  return value ? 'Sim' : 'Não';
}

function SegmentedButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`asx-funnel-segment${active ? ' asx-funnel-segment--active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SegmentGroup({ children }: { children: ReactNode }) {
  return <div className="asx-funnel-segments">{children}</div>;
}

export interface FunnelSelectionStepProps {
  campaignId: string;
  onBack?: () => void;
  onAdvanced?: (targetStep: number) => void;
}

export function FunnelSelectionStep({ campaignId, onBack, onAdvanced }: FunnelSelectionStepProps) {
  const [form, setForm] = useState<FunnelForm>(DEFAULT_FUNNEL_FORM);
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelKey | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const economics = getDemoUnitEconomics(campaignId);
    const saved = getDemoFunnelSelection(campaignId);
    const ticketPriceReais = economics
      ? computeUnitEconomics(toEconomicsInputs(economics)).aov
      : DEFAULT_FUNNEL_FORM.ticketPriceReais;

    if (saved) {
      setForm({ ...saved.form, ticketPriceReais });
      setSelectedFunnel(saved.selectedFunnel);
      return;
    }

    setForm({ ...DEFAULT_FUNNEL_FORM, ticketPriceReais });
    setSelectedFunnel(null);
  }, [campaignId]);

  const state = useMemo(() => resolveFunnelSelection(form, selectedFunnel), [form, selectedFunnel]);
  const recommendedOption = findFunnelOption(state.recommendedFunnel);
  const chosenFunnel = state.chosenFunnel;

  function setField<K extends keyof FunnelForm>(key: K, value: FunnelForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function useRecommendation() {
    setSelectedFunnel(state.recommendedFunnel);
    setError(null);
  }

  function handleNext() {
    const finalState = resolveFunnelSelection(form, selectedFunnel);
    if (!finalState.chosenFunnel) {
      setError('Escolha um funil antes de avançar.');
      return;
    }

    setSaving(true);
    saveDemoFunnelSelection(campaignId, finalState);
    updateDemoCampaignStep(campaignId, 3);
    setSaving(false);
    onAdvanced?.(3);
  }

  return (
    <div className="asx-funnel">
      <section className="asx-funnel-rec" aria-labelledby="funnel-rec-title">
        <div className="asx-funnel-rec__eyebrow">
          <Icon name="spark" size={13} color="var(--info)" />
          Recomendação da IA
          {state.isOverride && <span>override manual</span>}
        </div>

        {recommendedOption ? (
          <div className="asx-funnel-rec__content">
            <div className="asx-funnel-rec__copy">
              <h2 id="funnel-rec-title">
                {recommendedOption.name} <em>recomendado</em>
              </h2>
              <p>{state.rationale}</p>
              <button
                type="button"
                className="asx-funnel-reason"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                <Icon name={expanded ? 'nav-arrow-up' : 'nav-arrow-down'} size={12} />
                {expanded ? 'Ocultar raciocínio' : 'Ver raciocínio'}
              </button>
              {expanded && (
                <p className="asx-funnel-rec__details">
                  temperatura={form.audienceTemperature} · validado={boolLabel(form.productValidated)} ·
                  backend={boolLabel(form.backendExists)} · ticket={BRL.format(form.ticketPriceReais)}
                </p>
              )}
            </div>

            <div className="asx-funnel-confidence">
              <div className="asx-funnel-confidence__label">
                <span>Confiança</span>
                <strong>{state.confidence}%</strong>
              </div>
              <div className="asx-funnel-confidence__track" aria-hidden="true">
                <div style={{ width: `${state.confidence ?? 0}%` }} />
              </div>
              <Button onClick={useRecommendation}>Usar recomendado</Button>
            </div>
          </div>
        ) : (
          <p className="asx-funnel-rec__empty">
            Sem recomendação suficiente. Escolha manualmente um dos funis abaixo.
          </p>
        )}
      </section>

      <div className="asx-funnel__layout">
        <section className="asx-group asx-funnel-context" aria-labelledby="funnel-context-title">
          <div className="asx-group__head" id="funnel-context-title">
            <Icon name="settings" size={14} color="var(--primary)" />
            Contexto
          </div>

          <div className="asx-funnel-context__fields">
            <div>
              <div className="asx-funnel-context__ticket-label">
                <span>Ticket</span>
                <em>· herdado da viabilidade · lock</em>
              </div>
              <div className="asx-funnel-ticket" aria-label="Ticket herdado da viabilidade">
                <Icon name="lock" size={12} color="var(--muted-foreground)" />
                {BRL.format(form.ticketPriceReais)}
              </div>
            </div>

            <div>
              <div className="asx-funnel-context__label">Temperatura do público</div>
              <SegmentGroup>
                {TEMPERATURE_OPTIONS.map((option) => (
                  <SegmentedButton
                    key={option.value}
                    active={form.audienceTemperature === option.value}
                    onClick={() => setField('audienceTemperature', option.value)}
                  >
                    {option.label}
                  </SegmentedButton>
                ))}
              </SegmentGroup>
            </div>

            <div className="asx-funnel-bools">
              {[
                ['productValidated', 'Produto já validado?'],
                ['backendExists', 'Tem backend / upsell?'],
                ['salesTeam', 'Tem time de vendas?'],
              ].map(([key, label]) => {
                const field = key as 'productValidated' | 'backendExists' | 'salesTeam';
                return (
                  <div className="asx-funnel-bool" key={field}>
                    <span>{label}</span>
                    <SegmentGroup>
                      <SegmentedButton active={form[field]} onClick={() => setField(field, true)}>
                        Sim
                      </SegmentedButton>
                      <SegmentedButton active={!form[field]} onClick={() => setField(field, false)}>
                        Não
                      </SegmentedButton>
                    </SegmentGroup>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="asx-funnel-options" aria-label="Opções de funil">
          {FUNNEL_OPTIONS.map((option) => {
            const selected = option.key === chosenFunnel;
            const recommended = option.key === state.recommendedFunnel;
            return (
              <button
                key={option.key}
                type="button"
                className={`asx-funnel-option${selected ? ' asx-funnel-option--selected' : ''}`}
                aria-pressed={selected}
                onClick={() => {
                  setSelectedFunnel(option.key);
                  setError(null);
                }}
              >
                <div className="asx-funnel-option__head">
                  <strong>{option.name}</strong>
                  {selected && <Icon name="check-circle" size={16} color="var(--primary)" />}
                </div>
                {recommended && <span className="asx-funnel-option__badge">recomendado</span>}
                <div className="asx-funnel-option__metrics">
                  {option.metrics.map((metric) => (
                    <div key={metric.label}>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>
                <p>{option.when}</p>
              </button>
            );
          })}
        </div>
      </div>

      {state.isOverride && (
        <div className="asx-funnel-status asx-funnel-status--warning">
          <Icon name="warning-triangle" size={14} />
          Escolha manual registrada como override.
        </div>
      )}
      {error && (
        <div className="asx-funnel-status asx-funnel-status--error" role="alert">
          <Icon name="warning-circle" size={14} />
          {error}
        </div>
      )}

      <div className="asx-action-bar asx-funnel-actions">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="arrow-left" size={15} />
          Voltar
        </Button>
        <Button onClick={handleNext} disabled={!chosenFunnel || saving}>
          {saving ? 'Salvando…' : 'Avançar para Estrutura'}
          <Icon name="arrow-right" size={15} />
        </Button>
      </div>
    </div>
  );
}
