import { describe, expect, it } from 'vitest';
import type { AdsCampaign } from '@/lib/types';
import type { ProjectArtifact } from '@/lib/project-domain';
import { applyDiagnosis, createWeeklyPanel, updateWeeklyMetric } from '@/lib/weekly-panel';
import { projectMonitorAlerts } from '@/lib/monitor-alerts';

const campaign: AdsCampaign = {
  id: 'campaign-1',
  workspace_id: 'workspace-1',
  project_id: 'project-1',
  name: 'Campanha de validação',
  status: 'live',
  step_current: 8,
  created_at: '2026-07-10T00:00:00Z',
};

function diagnosedPanel(circuitBreakerTriggered = false) {
  let panel = createWeeklyPanel('project-1', 'campaign-1', '2026-07-06');
  panel = updateWeeklyMetric(panel, 'CTR', {
    value: 0.8,
    seal: 'Real',
    source: 'Meta Ads',
    confirmedByHuman: true,
  });
  return applyDiagnosis(panel, {
    hypothesis: 'O CTR está abaixo do sinal esperado para o ângulo atual.',
    singleLever: 'Revisar o primeiro hook',
    successCriterion: 'Confirmar melhora do CTR na próxima leitura.',
    reversalCriterion: 'Reverter se a leitura seguinte não confirmar melhora.',
    circuitBreakerTriggered,
  });
}

describe('projectMonitorAlerts', () => {
  it('returns no alert when the weekly panel has no persisted diagnosis', () => {
    const panel = createWeeklyPanel('project-1', 'campaign-1', '2026-07-06');

    expect(projectMonitorAlerts({ panels: [panel], campaigns: [campaign], artifacts: [] })).toEqual([]);
  });

  it('projects a pending recommendation with literal evidence and a human review CTA', () => {
    const [alert] = projectMonitorAlerts({ panels: [diagnosedPanel()], campaigns: [campaign], artifacts: [] });

    expect(alert).toMatchObject({
      campaignName: 'Campanha de validação',
      hypothesis: 'O CTR está abaixo do sinal esperado para o ângulo atual.',
      severity: 'attention',
      cta: { label: 'Revisar no painel semanal' },
    });
    expect(alert?.evidence[0]).toMatchObject({ label: 'CTR', value: '0.8 · Real', source: 'Meta Ads' });
    expect(alert?.cta.href).toContain('/projects/project-1/weeks?campaignId=campaign-1');
  });

  it('derives critical severity only from the persisted circuit breaker and accepts verified artifact evidence', () => {
    let panel = diagnosedPanel(true);
    panel = { ...panel, metrics: panel.metrics.map((metric) => ({ ...metric, value: null, source: '', seal: 'nao_fornecido' as const })) };
    const artifact: ProjectArtifact = {
      id: 'artifact-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      artifactType: 'trafficDiagnosis',
      title: 'Diagnóstico da semana',
      path: 'generated/squad-trafego/campaign-1/2026-07-06/diagnosis.md',
      format: 'markdown',
      state: 'confirmed',
      verification: 'confirmed',
      source: 'skill_run',
      createdAt: '2026-07-10T00:00:00Z',
      updatedAt: '2026-07-10T00:00:00Z',
    };

    const [alert] = projectMonitorAlerts({ panels: [panel], campaigns: [campaign], artifacts: [artifact] });

    expect(alert?.severity).toBe('critical');
    expect(alert?.evidence).toEqual([expect.objectContaining({ kind: 'artifact', value: artifact.path })]);
  });

  it('does not invent an alert without a resolvable campaign, evidence, or pending decision', () => {
    const diagnosed = diagnosedPanel();
    const approved = { ...diagnosed, decision: { status: 'approved' as const } };

    expect(projectMonitorAlerts({ panels: [diagnosed], campaigns: [{ ...campaign, project_id: 'other-project' }], artifacts: [] })).toEqual([]);
    expect(projectMonitorAlerts({ panels: [{ ...diagnosed, metrics: diagnosed.metrics.map((metric) => ({ ...metric, value: null, source: '', seal: 'nao_fornecido' as const })) }], campaigns: [campaign], artifacts: [] })).toEqual([]);
    expect(projectMonitorAlerts({ panels: [approved], campaigns: [campaign], artifacts: [] })).toEqual([]);
  });

  it('rejects an incomplete persisted diagnosis instead of inventing an alert severity', () => {
    const diagnosed = diagnosedPanel();
    const incomplete = {
      ...diagnosed,
      diagnosis: {
        ...diagnosed.diagnosis!,
        hypothesis: '   ',
        circuitBreakerTriggered: undefined,
      },
    } as unknown as typeof diagnosed;

    expect(projectMonitorAlerts({ panels: [incomplete], campaigns: [campaign], artifacts: [] })).toEqual([]);
  });
});
