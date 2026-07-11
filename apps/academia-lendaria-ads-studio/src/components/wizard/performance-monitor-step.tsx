import { useEffect, useState } from 'react';
import { Badge, Button, Icon } from '@/lib/lendaria-ds';
import {
  MONITOR_KPIS,
  SCALE_READINESS_CHECKS,
  defaultPerformanceMonitorState,
  resolveApprovalQueue,
  type PerformanceMonitorState,
} from '@/lib/performance-monitor';
import {
  getDemoPerformanceMonitor,
  saveDemoPerformanceMonitor,
} from '@/lib/demo-mode';

interface PerformanceMonitorStepProps {
  campaignId: string;
  onBack?: () => void;
}

const KIND_LABELS = {
  scale: { label: 'scale', icon: 'stats-up-square' },
  kill: { label: 'kill', icon: 'cancel' },
  alert: { label: 'alert', icon: 'warning-triangle' },
} as const;

export function PerformanceMonitorStep({ campaignId, onBack }: PerformanceMonitorStepProps) {
  const [state, setState] = useState<PerformanceMonitorState>(() => defaultPerformanceMonitorState());

  useEffect(() => {
    setState(getDemoPerformanceMonitor(campaignId) ?? defaultPerformanceMonitorState());
  }, [campaignId]);

  function commit(next: PerformanceMonitorState) {
    setState(next);
    saveDemoPerformanceMonitor(campaignId, next);
  }

  return (
    <div className="asx-monitor">
      <div className="asx-monitor-toolbar">
        <Badge variant={state.status === 'active' ? 'success' : 'warning'}>
          {state.status === 'active' ? 'Monitor ativo' : 'Monitor pausado'}
        </Badge>
        <Button variant="outline" onClick={() => commit({ ...state, scaleOpen: true })}>
          <Icon name="trending-up" size={14} /> Scale readiness
        </Button>
        <Button variant="ghost" onClick={() => commit({ ...state, status: state.status === 'active' ? 'paused' : 'active' })}>
          {state.status === 'active' ? 'Pausar' : 'Retomar'}
        </Button>
      </div>

      <div className="asx-monitor-kpis">
        {MONITOR_KPIS.map((kpi) => (
          <article key={kpi.label}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small className={kpi.good ? 'is-good' : 'is-warning'}>
              <Icon name={kpi.delta.startsWith('-') ? 'arrow-down' : kpi.delta.startsWith('+') ? 'arrow-up' : 'minus'} size={12} />
              {kpi.delta}
            </small>
          </article>
        ))}
      </div>

      <div className="asx-monitor-layout">
        <section className="asx-monitor-log">
          <h2>Decision log</h2>
          <div className="asx-monitor-table">
            <div className="asx-monitor-table__head">
              <span>Hora</span><span>Decisão</span><span>Target</span><span>Trigger</span><span>Status</span>
            </div>
            {state.decisions.map((decision) => {
              const kind = KIND_LABELS[decision.kind];
              return (
                <div className="asx-monitor-row" key={decision.id}>
                  <span>{decision.time}</span>
                  <span className={`asx-monitor-kind is-${decision.kind}`}><Icon name={kind.icon} size={11} /> {kind.label}</span>
                  <span title={decision.target}>{decision.target}</span>
                  <span>{decision.trigger}</span>
                  <Badge variant={decision.status === 'pending' ? 'warning' : 'outline'}>
                    {decision.status === 'pending' ? 'pendente' : 'aplicado'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="asx-monitor-queue">
          <h2><Icon name="hand-card" size={15} /> Fila de aprovação humana</h2>
          {state.queue.length ? state.queue.map((item) => (
            <article key={item.id}>
              <div className="asx-monitor-impact"><Icon name="warning-triangle" size={13} /> Impacto {item.impact}% do budget</div>
              <strong>{item.action}</strong>
              <p>{item.trigger}</p>
              <div>
                <Button onClick={() => commit(resolveApprovalQueue(state, item.id, true))}><Icon name="check" size={14} /> Aprovar</Button>
                <Button variant="outline" onClick={() => commit(resolveApprovalQueue(state, item.id, false))}>Rejeitar</Button>
              </div>
            </article>
          )) : (
            <div className="asx-monitor-empty">
              <Icon name="check-circle" size={24} color="var(--success)" />
              <strong>Fila vazia</strong>
              <p>Nenhuma ação aguardando aprovação.</p>
            </div>
          )}
        </aside>
      </div>

      <div className="asx-action-bar asx-monitor-actions">
        <Button variant="ghost" onClick={onBack}><Icon name="arrow-left" size={15} /> Voltar</Button>
      </div>

      {state.scaleOpen && (
        <div className="asx-monitor-modal" role="presentation" onMouseDown={() => commit({ ...state, scaleOpen: false })}>
          <div role="dialog" aria-modal="true" aria-labelledby="scale-readiness-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="asx-monitor-modal__head">
              <span><Icon name="trending-up" size={16} color="var(--primary)" /><h2 id="scale-readiness-title">Scale readiness</h2></span>
              <button type="button" aria-label="Fechar" onClick={() => commit({ ...state, scaleOpen: false })}><Icon name="xmark" size={17} /></button>
            </div>
            <p>Critérios para escalar budget com segurança.</p>
            <div className="asx-monitor-checks">
              {SCALE_READINESS_CHECKS.map((check) => (
                <div key={check.label} className={check.ok ? 'is-ok' : 'is-warning'}>
                  <Icon name={check.ok ? 'check-circle' : 'warning-triangle'} size={16} />
                  <span>{check.label}</span>
                </div>
              ))}
            </div>
            <div className="asx-monitor-modal__note">3 de 4 critérios atendidos. Frequência merece atenção antes do próximo incremento.</div>
          </div>
        </div>
      )}
    </div>
  );
}
