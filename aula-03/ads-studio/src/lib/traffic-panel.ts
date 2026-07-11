import { parse, stringify } from 'yaml';

export interface TrafficPanelArtifactInput {
  artifactType?: string;
  path?: string;
  content?: string;
  format?: string;
}

const SECTION_BY_ARTIFACT: Record<string, string> = {
  trafficTrackingAudit: 'zelador',
  trafficCreativeBattery: 'briefista',
  trafficCampaignPlan: 'estruturador',
  trafficMetricReading: 'leitor',
  trafficDiagnosis: 'diagnosticador',
};

const PANEL_SECTIONS = new Set(['zelador', 'briefista', 'estruturador', 'leitor', 'diagnosticador']);

function parseContent(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    const parsed = parse(content) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  }
}

function mergeValue(previous: unknown, next: unknown): unknown {
  if (!previous || typeof previous !== 'object' || Array.isArray(previous)) return next;
  if (!next || typeof next !== 'object' || Array.isArray(next)) return next;
  const merged: Record<string, unknown> = { ...(previous as Record<string, unknown>) };
  for (const [key, value] of Object.entries(next as Record<string, unknown>)) {
    merged[key] = key in merged ? mergeValue(merged[key], value) : value;
  }
  return merged;
}

function trackingPanelSection(value: Record<string, unknown>): Record<string, unknown> {
  if ('status_geral' in value || 'bm_ativo' in value) return value;
  return {
    ultima_checagem: value.checkedAt ?? null,
    bm_ativo: value.bmActive ?? null,
    conta_anuncios_ativa: value.adAccountActive ?? null,
    pixel_disparando: value.pixelFiring ?? null,
    capi_ativo: value.capiActive ?? null,
    evento_compra_deduplicado: value.purchaseEventDeduplicated ?? null,
    dominio_verificado: value.domainVerified ?? null,
    pagamento_aprovado: value.paymentApproved ?? null,
    status_geral: value.overallStatus ?? 'CRITICO',
    observacoes: value.evidence ? [value.evidence] : [],
  };
}

/** Builds the squad's shared panel from confirmed artifacts without inventing data. */
export function buildTrafficPanelContext(artifacts: TrafficPanelArtifactInput[]): Record<string, unknown> {
  let panel: Record<string, unknown> = {};
  for (const artifact of artifacts) {
    if (!artifact.content) continue;
    const section = artifact.artifactType ? SECTION_BY_ARTIFACT[artifact.artifactType] : undefined;
    const isSharedPanel = artifact.artifactType === 'trafficPanel' || artifact.path === 'PAINEL-DA-SEMANA.yaml';
    if (!section && !isSharedPanel) continue;
    const parsed = parseContent(artifact.content);
    const hasPanelSections = Object.keys(parsed).some((key) => PANEL_SECTIONS.has(key));
    if (hasPanelSections || isSharedPanel) {
      panel = mergeValue(panel, parsed) as Record<string, unknown>;
      continue;
    }
    if (!section) continue;
    const value = section === 'zelador' ? trackingPanelSection(parsed) : parsed[section] ?? parsed;
    panel[section] = mergeValue(panel[section], value);
  }
  return panel;
}

export function trafficPanelYaml(artifacts: TrafficPanelArtifactInput[]): string {
  return stringify(buildTrafficPanelContext(artifacts));
}
