import type { AdsCampaign } from '@/lib/types';
import type { ProjectArtifact, WeeklyPanel } from '@/lib/project-domain';

export type MonitorAlertSeverity = 'critical' | 'attention';

export interface MonitorAlertEvidence {
  kind: 'metric' | 'artifact';
  label: string;
  value: string;
  source: string;
}

export interface MonitorAlert {
  id: string;
  projectId: string;
  campaignId: string;
  campaignName: string;
  panelId: string;
  weekStart: string;
  severity: MonitorAlertSeverity;
  hypothesis: string;
  evidence: MonitorAlertEvidence[];
  cta: {
    label: 'Revisar no painel semanal';
    href: string;
  };
}

export interface MonitorAlertProjectionInput {
  panels: readonly WeeklyPanel[];
  campaigns: readonly AdsCampaign[];
  artifacts: readonly ProjectArtifact[];
}

function hasCompleteDiagnosis(diagnosis: WeeklyPanel['diagnosis']): diagnosis is NonNullable<WeeklyPanel['diagnosis']> {
  return diagnosis !== null
    && typeof diagnosis.circuitBreakerTriggered === 'boolean'
    && diagnosis.hypothesis.trim().length > 0
    && diagnosis.singleLever.trim().length > 0
    && diagnosis.successCriterion.trim().length > 0
    && diagnosis.reversalCriterion.trim().length > 0;
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

function metricEvidence(panel: WeeklyPanel): MonitorAlertEvidence[] {
  return panel.metrics
    .filter((metric) => metric.value !== null && metric.seal !== 'nao_fornecido' && metric.source.trim().length > 0)
    .slice(0, 3)
    .map((metric) => ({
      kind: 'metric' as const,
      label: metric.name,
      value: `${metric.value} · ${metric.seal}`,
      source: metric.source,
    }));
}

function artifactEvidence(
  panel: WeeklyPanel,
  artifacts: readonly ProjectArtifact[],
): MonitorAlertEvidence[] {
  return artifacts
    .filter((artifact) => (
      artifact.projectId === panel.projectId
      && artifact.verification === 'confirmed'
      && artifact.path.includes(`/${panel.campaignId}/`)
    ))
    .slice(0, 2)
    .map((artifact) => ({
      kind: 'artifact' as const,
      label: artifact.title,
      value: artifact.path,
      source: 'Artefato verificado',
    }));
}

/**
 * Projeta somente recomendações que já existem no estado operacional
 * persistido. A função não calcula métricas, não cria diagnóstico e não
 * expõe nenhuma mutação de campanha.
 */
export function projectMonitorAlerts({ panels, campaigns, artifacts }: MonitorAlertProjectionInput): MonitorAlert[] {
  return panels
    .filter((panel) => panel.diagnosis !== null && panel.decision.status === 'pending')
    .flatMap((panel) => {
      const diagnosis = panel.diagnosis;
      if (!hasCompleteDiagnosis(diagnosis)) return [];

      const campaign = campaigns.find((candidate) => (
        candidate.id === panel.campaignId
        && candidate.project_id === panel.projectId
      ));
      if (!campaign) return [];

      const evidence = [...metricEvidence(panel), ...artifactEvidence(panel, artifacts)];
      if (evidence.length === 0) return [];

      return [{
        id: `monitor-alert-${panel.id}`,
        projectId: panel.projectId,
        campaignId: panel.campaignId,
        campaignName: campaign.name,
        panelId: panel.id,
        weekStart: panel.weekStart,
        severity: diagnosis.circuitBreakerTriggered ? 'critical' : 'attention',
        hypothesis: diagnosis.hypothesis,
        evidence,
        cta: {
          label: 'Revisar no painel semanal' as const,
          href: `/projects/${encode(panel.projectId)}/weeks?campaignId=${encode(panel.campaignId)}&panelId=${encode(panel.id)}`,
        },
      } satisfies MonitorAlert];
    })
    .sort((a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical') || b.weekStart.localeCompare(a.weekStart));
}
