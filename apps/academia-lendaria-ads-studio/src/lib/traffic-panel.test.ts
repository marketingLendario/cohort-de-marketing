import { describe, expect, it } from 'vitest';
import { buildTrafficPanelContext, trafficPanelYaml } from '@/lib/traffic-panel';

describe('traffic panel handoff', () => {
  it('normalizes the Zelador JSON artifact into the shared panel contract', () => {
    const panel = buildTrafficPanelContext([{
      artifactType: 'trafficTrackingAudit',
      content: JSON.stringify({
        checkedAt: '2026-07-10',
        bmActive: true,
        adAccountActive: true,
        pixelFiring: true,
        capiActive: true,
        purchaseEventDeduplicated: true,
        domainVerified: true,
        paymentApproved: true,
        overallStatus: 'OK',
      }),
    }]);

    expect(panel).toMatchObject({ zelador: { status_geral: 'OK', capi_ativo: true } });
  });

  it('preserves previous sections while adding the current skill section', () => {
    const panel = buildTrafficPanelContext([
      { artifactType: 'trafficTrackingAudit', content: 'zelador:\n  status_geral: OK\n' },
      { artifactType: 'trafficCreativeBattery', content: 'briefista:\n  finalistas_curados: [finalista-1, finalista-2]\n' },
      { artifactType: 'trafficMetricReading', content: 'leitor:\n  amostra_suficiente_para_cpa: false\n' },
    ]);

    expect(panel).toEqual({
      zelador: { status_geral: 'OK' },
      briefista: { finalistas_curados: ['finalista-1', 'finalista-2'] },
      leitor: { amostra_suficiente_para_cpa: false },
    });
    expect(trafficPanelYaml([
      { artifactType: 'trafficDiagnosis', content: 'diagnosticador:\n  aprovado_pelo_aluno: null\n' },
    ])).toContain('diagnosticador:');
  });

  it('ignores confirmed project artifacts that are not part of the traffic panel', () => {
    const panel = buildTrafficPanelContext([
      {
        artifactType: 'copy',
        path: 'copy.md',
        content: '# Copy\n\n1. "Angulo" - consciente_do_problema',
      },
      {
        artifactType: 'trafficTrackingAudit',
        content: 'zelador:\n  status_geral: OK\n',
      },
    ]);

    expect(panel).toEqual({ zelador: { status_geral: 'OK' } });
  });
});
