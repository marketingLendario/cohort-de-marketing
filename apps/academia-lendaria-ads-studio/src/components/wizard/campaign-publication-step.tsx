import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Icon } from '@/lib/lendaria-ds';
import { computeUnitEconomics } from '@/lib/ads-economics';
import {
  advancePublication,
  defaultCampaignPublicationState,
  resetPublicationScenario,
  retryPublication,
  startPublication,
  type CampaignPublicationState,
  type PublicationScenario,
} from '@/lib/campaign-publication';
import { summarizeStructure } from '@/lib/campaign-structure';
import { summarizeCreativeFactory } from '@/lib/creative-factory';
import { findFunnelOption } from '@/lib/funnel-selection';
import { isTrackingApproved } from '@/lib/tracking-audit';
import {
  getDemoCampaignPublication,
  getDemoCampaignStructure,
  getDemoCreativeFactory,
  getDemoFunnelSelection,
  getDemoTrackingAudit,
  getDemoUnitEconomics,
  saveDemoCampaignPublication,
  updateDemoCampaignStep,
} from '@/lib/demo-mode';
import { toEconomicsInputs } from '@/stores/unit-economics-store';

interface CampaignPublicationStepProps {
  campaignId: string;
  onBack?: () => void;
  onNavigateStep?: (targetStep: number) => void;
  onAdvanced?: (targetStep: number) => void;
  readOnly?: boolean;
}

const SCENARIOS: Array<{ value: PublicationScenario; label: string }> = [
  { value: 'success', label: 'Sucesso' },
  { value: 'partial', label: 'Falha parcial' },
  { value: 'unavailable', label: 'Adapter off' },
];

export function CampaignPublicationStep({
  campaignId,
  onBack,
  onNavigateStep,
  onAdvanced,
  readOnly = false,
}: CampaignPublicationStepProps) {
  const [state, setState] = useState<CampaignPublicationState>(() => defaultCampaignPublicationState());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = getDemoCampaignPublication(campaignId);
    setState(saved?.status === 'publishing' ? defaultCampaignPublicationState() : (saved ?? defaultCampaignPublicationState()));
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [campaignId]);

  const economics = getDemoUnitEconomics(campaignId);
  const economicsMetrics = economics ? computeUnitEconomics(toEconomicsInputs(economics)) : null;
  const funnel = getDemoFunnelSelection(campaignId);
  const structure = getDemoCampaignStructure(campaignId);
  const creativeFactory = getDemoCreativeFactory(campaignId);
  const tracking = getDemoTrackingAudit(campaignId);
  const structureSummary = structure ? summarizeStructure(structure) : null;
  const creativeSummary = creativeFactory ? summarizeCreativeFactory(creativeFactory) : null;
  const trackingOk = isTrackingApproved(tracking);
  const economicsOk = Boolean(economicsMetrics && economicsMetrics.ltvCac >= 1);
  const slotsOk = Boolean(creativeSummary && creativeSummary.filled === creativeSummary.slots);
  const budgetOk = Boolean(structure && structure.budgetTotalReais > 0);
  const preflightOk = economicsOk && slotsOk && trackingOk && budgetOk;

  const summaryRows = useMemo(() => [
    {
      label: 'Economia',
      value: economicsMetrics
        ? `LTV:CAC ${economicsMetrics.ltvCac.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} · CPA alvo R$ ${economicsMetrics.maxCpa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'Economia não preenchida',
      icon: 'stats-up-square',
      step: 1,
    },
    { label: 'Funil', value: findFunnelOption(funnel?.chosenFunnel ?? null)?.name ?? 'Não selecionado', icon: 'filter-list', step: 2 },
    {
      label: 'Estrutura',
      value: structureSummary ? `${structureSummary.adsets} adsets · ${structureSummary.ads} ads · ${structure?.budgetMode}` : 'Não definida',
      icon: 'tree',
      step: 3,
    },
    {
      label: 'Criativos',
      value: creativeSummary ? `${creativeSummary.approved} aprovados · ${creativeSummary.filled}/${creativeSummary.slots} slots` : 'Não gerados',
      icon: 'media-image-list',
      step: 5,
    },
    { label: 'Tracking', value: tracking ? `EMQ ${tracking.emq.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} · ${trackingOk ? 'gate OK' : 'gate pendente'}` : 'Não auditado', icon: 'radar', step: 6 },
  ], [creativeSummary, economicsMetrics, funnel, structure, structureSummary, tracking, trackingOk]);

  const checklist = [
    { label: 'Viabilidade econômica (gate #1)', ok: economicsOk },
    { label: 'Criativos encaixados nos slots', ok: slotsOk },
    { label: 'Tracking auditado (gate #2)', ok: trackingOk },
    { label: 'Budget definido por adset', ok: budgetOk },
  ];

  function commit(next: CampaignPublicationState) {
    setState(next);
    saveDemoCampaignPublication(campaignId, next);
  }

  function runPublication(initial: CampaignPublicationState) {
    commit(initial);
    if (initial.status !== 'publishing') return;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setState((current) => {
        const next = advancePublication(current);
        saveDemoCampaignPublication(campaignId, next);
        if (next.status !== 'publishing') {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
        }
        return next;
      });
    }, 650);
  }

  function handleMonitor() {
    updateDemoCampaignStep(campaignId, 8);
    onAdvanced?.(8);
  }

  return (
    <div className="asx-publication">
      {!readOnly ? (
        <div className="asx-publication-scenarios">
          <span>Demo · cenário do agente</span>
          <div>
            {SCENARIOS.map((scenario) => (
              <button
                type="button"
                key={scenario.value}
                className={state.scenario === scenario.value ? 'is-active' : ''}
                aria-pressed={state.scenario === scenario.value}
                onClick={() => commit(resetPublicationScenario(state, scenario.value))}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="asx-publication-layout">
        <div className="asx-publication-left">
          <section className="asx-group">
            <div className="asx-group__head"><Icon name="list" size={14} color="var(--primary)" /> Consolidado</div>
            <div className="asx-publication-summary">
              {summaryRows.map((row) => (
                <div key={row.label}>
                  <Icon name={row.icon} size={16} />
                  <span><small>{row.label}</small><strong>{row.value}</strong></span>
                  <button type="button" onClick={() => onNavigateStep?.(row.step)}>editar</button>
                </div>
              ))}
            </div>
          </section>

          <section className="asx-group">
            <div className="asx-group__head"><Icon name="task-list" size={14} color="var(--primary)" /> Checklist pré-voo</div>
            <div className="asx-publication-checklist">
              {checklist.map((item) => (
                <div key={item.label} className={item.ok ? 'is-ok' : 'is-pending'}>
                  <Icon name={item.ok ? 'check-circle' : 'warning-triangle'} size={16} />
                  {item.label}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="asx-publication-agent">
          {readOnly ? (
            <div className="asx-publication-blocked" data-testid="legacy-publication-read-only">
              <div><Icon name="shield-check" size={14} /> <strong>Revisão no projeto unificado</strong></div>
              <p>O consolidado permanece disponível aqui. Continue pela ponte acima para revisar a submissão sem alterar a campanha nesta rota.</p>
            </div>
          ) : state.status === 'idle' ? (
            <>
              <div className="asx-publication-agent__title">Publicar via agente · CLI meta-ads</div>
              <button
                type="button"
                className="asx-publication-pause"
                aria-pressed={state.paused}
                onClick={() => commit({ ...state, paused: !state.paused })}
              >
                <span className={state.paused ? 'is-on' : ''}><i /></span>
                <div><strong>Publicar pausado</strong><small>Sobe pausado para revisar no Meta antes de ativar.</small></div>
              </button>
              {preflightOk ? (
                <Button className="asx-publication-submit" onClick={() => runPublication(startPublication(state))}>
                  <Icon name="rocket" size={15} /> Publicar campanha
                </Button>
              ) : (
                <div className="asx-publication-blocked">
                  <div><Icon name="warning-triangle" size={14} /> <strong>Gates pendentes</strong></div>
                  <p>Conclua os gates #1 e #2 e encaixe criativos antes de publicar.</p>
                </div>
              )}
            </>
          ) : state.status === 'unavailable' ? (
            <div className="asx-publication-unavailable">
              <Icon name="cloud-error" size={24} />
              <strong>Adapter indisponível</strong>
              <p>O consolidado foi preservado. Tente novamente quando o serviço voltar.</p>
              <Button variant="outline" onClick={() => commit(resetPublicationScenario(state, state.scenario))}>Voltar ao pré-voo</Button>
              <div className="asx-publication-log">{state.log.map((line) => <span key={line}>{line}</span>)}</div>
            </div>
          ) : (
            <div className="asx-publication-progress">
              <div className="asx-publication-progress__head">
                <span>Agente publicando</span>
                <Badge variant={state.status === 'partial' ? 'destructive' : state.status === 'done' ? 'success' : 'info'}>
                  {state.status === 'partial' ? 'falha parcial' : state.status === 'done' ? 'concluído' : 'em andamento'}
                </Badge>
              </div>
              <div className="asx-publication-steps">
                {state.steps.map((step, index) => (
                  <div key={step.id}>
                    <span className={`is-${step.status}`}>
                      {step.status === 'ok' ? <Icon name="check" size={13} /> : step.status === 'failed' ? <Icon name="xmark" size={13} /> : step.status === 'running' ? <Icon name="refresh-double" size={13} className="asx-recalc" /> : index + 1}
                    </span>
                    <strong>{step.label}</strong>
                    {step.status === 'failed' && (
                      <Button size="sm" variant="outline" onClick={() => runPublication(retryPublication(state))}>
                        <Icon name="refresh-double" size={13} /> Retry
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="asx-publication-log">{state.log.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</div>
              {state.status === 'done' && (
                <div className="asx-publication-success">
                  <Icon name="check-circle" size={16} />
                  <div><strong>Campanha publicada ({state.paused ? 'pausada' : 'ativa'})</strong><small>Árvore confirmada pela Meta.</small></div>
                  <Button onClick={handleMonitor}>Abrir Monitor <Icon name="arrow-right" size={14} /></Button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      <div className="asx-action-bar asx-publication-actions">
        <Button variant="ghost" onClick={onBack}><Icon name="arrow-left" size={15} /> Voltar</Button>
      </div>
    </div>
  );
}
