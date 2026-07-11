import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Icon, Input, Label } from '@/lib/lendaria-ds';
import {
  TRACKING_EVENTS,
  TRACKING_VARIANCE,
  defaultTrackingAuditState,
  finishTrackingAudit,
  isTrackingApproved,
  type TrackingAuditState,
  type TrackingEventName,
} from '@/lib/tracking-audit';
import {
  getDemoTrackingAudit,
  saveDemoTrackingAudit,
  updateDemoCampaignStep,
} from '@/lib/demo-mode';

interface TrackingAuditStepProps {
  campaignId: string;
  onBack?: () => void;
  onAdvanced?: (targetStep: number) => void;
}

export function TrackingAuditStep({ campaignId, onBack, onAdvanced }: TrackingAuditStepProps) {
  const [state, setState] = useState<TrackingAuditState>(() => defaultTrackingAuditState());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = getDemoTrackingAudit(campaignId);
    setState(saved?.audit === 'running' ? { ...saved, audit: 'idle', progress: 0 } : (saved ?? defaultTrackingAuditState()));
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [campaignId]);

  const approved = isTrackingApproved(state);

  function commit(next: TrackingAuditState) {
    setState(next);
    saveDemoTrackingAudit(campaignId, next);
  }

  function toggleEvent(eventName: TrackingEventName) {
    commit({
      ...state,
      audit: state.audit === 'done' ? 'idle' : state.audit,
      progress: state.audit === 'done' ? 0 : state.progress,
      events: { ...state.events, [eventName]: !state.events[eventName] },
    });
  }

  function handleRun() {
    if (timer.current) clearInterval(timer.current);
    const start = { ...state, audit: 'running' as const, progress: 0, emq: 0 };
    setState(start);
    let progress = 0;
    timer.current = setInterval(() => {
      progress = Math.min(100, progress + 10);
      setState((current) => {
        if (progress < 100) return { ...current, progress };
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        const done = finishTrackingAudit(current);
        saveDemoTrackingAudit(campaignId, done);
        return done;
      });
    }, 80);
  }

  function handleNext() {
    if (!approved) return;
    saveDemoTrackingAudit(campaignId, state);
    updateDemoCampaignStep(campaignId, 7);
    onAdvanced?.(7);
  }

  return (
    <div className="asx-tracking">
      <div className="asx-tracking-demo">
        <Button
          variant="outline"
          onClick={() => commit({
            ...state,
            purchaseBroken: !state.purchaseBroken,
            audit: state.audit === 'done' ? 'idle' : state.audit,
            progress: state.audit === 'done' ? 0 : state.progress,
          })}
        >
          <Icon name="refresh-double" size={14} />
          {state.purchaseBroken ? 'Simular tracking OK' : 'Simular evento quebrado'}
        </Button>
      </div>

      <div className="asx-tracking-layout">
        <div className="asx-tracking-config">
          <section className="asx-group">
            <div className="asx-group__head">
              <Icon name="developer" size={14} color="var(--primary)" /> Configuração
            </div>
            <div className="asx-tracking-fields">
              <div>
                <Label htmlFor="tracking-pixel">Pixel ID / conta</Label>
                <Input
                  id="tracking-pixel"
                  value={state.pixel}
                  onChange={(event) => commit({ ...state, pixel: event.target.value, audit: 'idle', progress: 0 })}
                />
              </div>
              <div>
                <Label htmlFor="tracking-domain">Domínio / landing</Label>
                <Input
                  id="tracking-domain"
                  value={state.domain}
                  onChange={(event) => commit({ ...state, domain: event.target.value, audit: 'idle', progress: 0 })}
                />
              </div>
              <div className="asx-tracking-capi">
                <span>Status do CAPI</span>
                <Badge variant="success">CAPI conectado</Badge>
              </div>
            </div>
          </section>

          <section className="asx-group">
            <div className="asx-group__head">
              <Icon name="check-circle" size={14} color="var(--primary)" /> Eventos esperados
            </div>
            <div className="asx-tracking-events">
              {TRACKING_EVENTS.map((eventName) => {
                const eventOk = state.audit === 'done' && state.events[eventName] && !(eventName === 'Purchase' && state.purchaseBroken);
                const eventBad = state.audit === 'done' && !eventOk;
                return (
                  <div key={eventName}>
                    <button
                      type="button"
                      className={state.events[eventName] ? 'is-active' : ''}
                      aria-label={`${state.events[eventName] ? 'Desativar' : 'Ativar'} ${eventName}`}
                      aria-pressed={state.events[eventName]}
                      onClick={() => toggleEvent(eventName)}
                    >
                      {state.events[eventName] && <Icon name="check" size={12} />}
                    </button>
                    <span>{eventName}</span>
                    {state.audit === 'running' && <small>disparando</small>}
                    {eventOk && <small className="is-ok"><Icon name="check-circle" size={12} /> ok</small>}
                    {eventBad && <small className="is-bad"><Icon name="xmark-circle" size={12} /> falhou</small>}
                  </div>
                );
              })}
            </div>
            <Button className="asx-tracking-run" disabled={state.audit === 'running'} onClick={handleRun}>
              <Icon name="flash" size={15} />
              {state.audit === 'done' ? 'Rodar de novo' : 'Rodar auditoria'}
            </Button>
          </section>
        </div>

        <aside className="asx-tracking-results">
          {state.audit === 'idle' ? (
            <div className="asx-tracking-idle">
              <Icon name="radar" size={28} />
              <strong>Aguardando auditoria</strong>
              <p>Rode para ver EMQ, eventos e variance.</p>
            </div>
          ) : state.audit === 'running' ? (
            <div className="asx-tracking-running">
              <div><Icon name="radar" size={15} className="asx-recalc" /> Verificando eventos… {state.progress}%</div>
              <span><i style={{ width: `${state.progress}%` }} /></span>
            </div>
          ) : (
            <div className="asx-tracking-done">
              <div className="asx-tracking-emq">
                <div>
                  <span>EMQ · Event Match Quality</span>
                  <strong>{state.emq.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}<small>/10</small></strong>
                </div>
                <Badge variant={approved ? 'success' : 'warning'}>{approved ? 'Boa qualidade' : 'Baixa qualidade'}</Badge>
              </div>
              <div className="asx-tracking-variance">
                <div><span>Evento</span><span>Meta</span><span>Backend</span><span>Δ</span></div>
                {TRACKING_VARIANCE.map((row) => (
                  <div key={row.event}>
                    <span><Icon name={approved ? 'check-circle' : 'warning-triangle'} size={12} /> {row.event}</span>
                    <span>{row.meta}</span>
                    <span>{row.backend}</span>
                    <span>{row.delta}</span>
                  </div>
                ))}
              </div>
              <div className={`asx-tracking-gate ${approved ? 'is-approved' : 'is-blocked'}`}>
                <div>
                  <Icon name={approved ? 'check-circle' : 'lock'} size={15} />
                  <strong>{approved ? 'Tracking aprovado' : 'Publicação bloqueada'}</strong>
                </div>
                <p>
                  {approved
                    ? 'Todos os eventos críticos disparam. Pode publicar.'
                    : 'Evento crítico Purchase não dispara. Sem ele não há otimização nem ROAS confiável.'}
                </p>
                {!approved && <em>Corrija o pixel/CAPI da landing e rode a auditoria de novo.</em>}
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className="asx-action-bar asx-tracking-actions">
        <Button variant="ghost" onClick={onBack}><Icon name="arrow-left" size={15} /> Voltar</Button>
        <Button disabled={!approved} title={approved ? 'Avançar' : 'Corrija o tracking para liberar'} onClick={handleNext}>
          Avançar para Publicação <Icon name="arrow-right" size={15} />
        </Button>
      </div>
    </div>
  );
}
