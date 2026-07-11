import { describe, expect, it } from 'vitest';
import { trafficApprovalBlockReason, trafficWorkflowBlockReason } from '@/lib/traffic-workflow';

const baseArtifacts = [
  { artifactType: 'trafficTrackingAudit', content: 'zelador:\n  status_geral: OK\n' },
  { artifactType: 'trafficCreativeBattery', content: 'briefista:\n  finalistas_curados: [finalista-1, finalista-2]\n' },
];

describe('traffic workflow gates', () => {
  it('requires tracking and human curation before Estruturador', () => {
    expect(trafficWorkflowBlockReason('estruturador', [baseArtifacts[0]!])).toMatch(/curadoria|finalistas/i);
    expect(trafficWorkflowBlockReason('estruturador', [{ artifactType: 'trafficCreativeBattery', content: baseArtifacts[1]!.content }])).toMatch(/Zelador|tracking/i);
    expect(trafficWorkflowBlockReason('estruturador', baseArtifacts)).toBeNull();
  });

  it('rejects approval of a blocked structural proposal', () => {
    expect(trafficApprovalBlockReason('estruturador', [
      ...baseArtifacts,
      { artifactType: 'trafficCampaignPlan', content: 'Campanha não montada: finalistas_curados está vazio.' },
    ])).toMatch(/bloqueada|execute novamente/i);
  });
});
