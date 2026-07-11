import { buildTrafficPanelContext, type TrafficPanelArtifactInput } from '@/lib/traffic-panel';

function section(panel: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = panel[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function artifactInputs(artifacts: TrafficPanelArtifactInput[]): TrafficPanelArtifactInput[] {
  return artifacts.filter((artifact) => artifact.artifactType?.startsWith('traffic') || artifact.path === 'PAINEL-DA-SEMANA.yaml');
}

/** Hard gates for the steps whose outputs would otherwise look successful while remaining unusable. */
export function trafficWorkflowBlockReason(skillId: string, artifacts: TrafficPanelArtifactInput[]): string | null {
  if (skillId !== 'estruturador') return null;
  const panel = buildTrafficPanelContext(artifactInputs(artifacts));
  const trackingStatus = String(section(panel, 'zelador').status_geral ?? '').toUpperCase();
  if (!['OK', 'PARCIAL'].includes(trackingStatus)) {
    return 'O Estruturador só pode rodar depois que o Zelador confirmar o tracking no Painel da Semana.';
  }
  const finalists = section(panel, 'briefista').finalistas_curados;
  if (!Array.isArray(finalists) || finalists.length < 2 || finalists.length > 3) {
    return 'Faça a curadoria humana de 2 a 3 finalistas no resultado do Briefista antes de estruturar a campanha.';
  }
  return null;
}

/** Blocks approval of a structurally incomplete campaign plan. */
export function trafficApprovalBlockReason(skillId: string, artifacts: TrafficPanelArtifactInput[]): string | null {
  const block = trafficWorkflowBlockReason(skillId, artifacts);
  if (block) return block;
  if (skillId !== 'estruturador') return null;
  const content = artifacts.map((artifact) => artifact.content ?? '').join('\n').toLowerCase();
  if (/não é possível estruturar|nao e possivel estruturar|campanha não montada|campanha nao montada/.test(content)) {
    return 'A proposta do Estruturador ainda está bloqueada. Corrija os pré-requisitos e execute novamente.';
  }
  return null;
}
