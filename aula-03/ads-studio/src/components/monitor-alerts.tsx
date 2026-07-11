import type { MonitorAlert } from '@/lib/monitor-alerts';
import { Icon } from '@/lib/lendaria-ds';

export interface MonitorAlertsProps {
  alerts?: readonly MonitorAlert[];
}

export function MonitorAlerts({ alerts = [] }: MonitorAlertsProps) {
  return (
    <section className="cms-section asx-monitor-alerts" aria-labelledby="monitor-alerts-title" data-testid="monitor-alerts">
      <div className="cms-section__head">
        <div>
          <span className="cms-kicker">Operação semanal</span>
          <h2 id="monitor-alerts-title">Alertas para revisão</h2>
        </div>
        <span className="cms-live-status"><span /> Somente recomendação</span>
      </div>

      {alerts.length === 0 ? (
        <div className="asx-monitor-empty" data-testid="monitor-alerts-empty">
          <Icon name="check-circle" size={24} color="var(--success)" />
          <strong>Nenhum alerta pendente</strong>
          <p>A operação semanal não registrou recomendações para revisão.</p>
        </div>
      ) : (
        <div className="asx-monitor-queue" style={{ display: 'grid', gap: '12px' }}>
          {alerts.map((alert) => (
            <article key={alert.id} data-testid="monitor-alert-card" data-severity={alert.severity}>
              <div className="asx-monitor-impact">
                <Icon name="warning-triangle" size={13} />
                <span>{alert.severity === 'critical' ? 'Revisão prioritária' : 'Revisão recomendada'}</span>
              </div>
              <strong>{alert.campaignName}</strong>
              <p>
                <span className="cms-kicker">Hipótese</span>
                {alert.hypothesis}
              </p>
              <div className="cms-compact-list" aria-label={`Evidências de ${alert.campaignName}`}>
                {alert.evidence.map((evidence) => (
                  <div className="cms-compact-row" key={`${evidence.kind}-${evidence.label}-${evidence.value}`}>
                    <span><strong>{evidence.label}</strong><small>{evidence.source}</small></span>
                    <span>{evidence.value}</span>
                  </div>
                ))}
              </div>
              <a className="al-btn al-btn--primary cms-action-link" href={alert.cta.href}>
                {alert.cta.label}
                <Icon name="nav-arrow-right" size={13} />
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
