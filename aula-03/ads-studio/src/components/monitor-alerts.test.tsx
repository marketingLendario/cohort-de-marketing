import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MonitorAlert } from '@/lib/monitor-alerts';
import { MonitorAlerts } from '@/components/monitor-alerts';

const alert: MonitorAlert = {
  id: 'monitor-alert-week-1',
  projectId: 'project-1',
  campaignId: 'campaign-1',
  campaignName: 'Campanha de validação',
  panelId: 'week-campaign-1-2026-07-06',
  weekStart: '2026-07-06',
  severity: 'attention',
  hypothesis: 'O CTR está abaixo do sinal esperado.',
  evidence: [{ kind: 'metric', label: 'CTR', value: '0.8 · Real', source: 'Meta Ads' }],
  cta: {
    label: 'Revisar no painel semanal',
    href: '/projects/project-1/weeks?campaignId=campaign-1&panelId=week-campaign-1-2026-07-06',
  },
};

describe('MonitorAlerts', () => {
  it('renders a professional empty state without future-story placeholder copy', () => {
    render(<MonitorAlerts />);

    expect(screen.getByTestId('monitor-alerts-empty')).toBeInTheDocument();
    expect(screen.getByText('Nenhum alerta pendente')).toBeInTheDocument();
    expect(screen.queryByText(/Epic|Story|placeholder/i)).not.toBeInTheDocument();
  });

  it('renders campaign, evidence, hypothesis, severity and a review-only CTA', () => {
    render(<MonitorAlerts alerts={[alert]} />);

    expect(screen.getByTestId('monitor-alert-card')).toHaveAttribute('data-severity', 'attention');
    expect(screen.getByText('Campanha de validação')).toBeInTheDocument();
    expect(screen.getByText('O CTR está abaixo do sinal esperado.')).toBeInTheDocument();
    expect(screen.getByText('CTR')).toBeInTheDocument();
    expect(screen.getByText('0.8 · Real')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /revisar no painel semanal/i })).toHaveAttribute('href', alert.cta.href);
    expect(screen.queryByRole('button', { name: /pausar|publicar|escalar/i })).not.toBeInTheDocument();
  });
});
