import { describe, expect, it } from 'vitest';
import { applyDiagnosis, confirmLiteralReading, createWeeklyPanel, decideWeeklyLever, updateWeeklyMetric } from '@/lib/weekly-panel';

describe('weekly panel', () => {
  it('never calculates an absent metric', () => {
    let panel = createWeeklyPanel('project-1', 'campaign-1', '2026-07-06');
    panel = updateWeeklyMetric(panel, 'Gasto', { value: 210, seal: 'Real', source: 'Meta', confirmedByHuman: true });
    panel = updateWeeklyMetric(panel, 'Compras', { value: 4, seal: 'Real', source: 'Meta', confirmedByHuman: true });
    const cpa = panel.metrics.find((metric) => metric.name === 'CPA');
    expect(cpa?.value).toBeNull();
    expect(cpa?.seal).toBe('nao_fornecido');
  });

  it('downgrades manager ROAS to estimated until cash is confirmed', () => {
    let panel = createWeeklyPanel('project-1', 'campaign-1');
    panel = updateWeeklyMetric(panel, 'ROAS', { value: 3.1, seal: 'Real', source: 'Meta', confirmedByHuman: true, cashConfirmed: false });
    const roas = panel.metrics.find((metric) => metric.name === 'ROAS');
    expect(roas?.seal).toBe('Estimado');
    expect(roas?.premise).toContain('não confirmada');
  });

  it('keeps diagnosis and decision as append-only events', () => {
    let panel = confirmLiteralReading(createWeeklyPanel('project-1', 'campaign-1'), '2026-07-09T00:00:00.000Z');
    panel = applyDiagnosis(panel, {
      hypothesis: 'CTR baixo',
      singleLever: 'Trocar ângulo',
      successCriterion: 'CTR acima de 1% em 3 dias',
      reversalCriterion: 'Reverter em 5 dias se não melhorar',
      circuitBreakerTriggered: false,
    }, '2026-07-09T01:00:00.000Z');
    panel = decideWeeklyLever(panel, 'approved', 'Briefista na segunda', '2026-07-09T02:00:00.000Z');
    expect(panel.events.map((event) => event.type)).toEqual(['literal_reading_confirmed', 'diagnosis_proposed', 'lever_approved']);
    expect(panel.decision.status).toBe('approved');
  });
});
