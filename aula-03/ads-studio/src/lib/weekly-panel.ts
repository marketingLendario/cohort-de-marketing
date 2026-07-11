import type { WeeklyMetric, WeeklyPanel } from '@/lib/project-domain';

export const WEEKLY_METRICS = [
  'Gasto',
  'Impressões',
  'Cliques no link',
  'CTR',
  'CPM',
  'Compras',
  'CPA',
  'ROAS',
] as const;

export function mondayOf(date = new Date()): string {
  const local = new Date(date);
  const day = local.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  local.setDate(local.getDate() + distance);
  return local.toISOString().slice(0, 10);
}

export function createWeeklyPanel(projectId: string, campaignId: string, weekStart = mondayOf()): WeeklyPanel {
  return {
    schemaVersion: '1.0.0',
    id: `week-${campaignId}-${weekStart}`,
    projectId,
    campaignId,
    weekStart,
    revision: 1,
    status: 'draft',
    metrics: WEEKLY_METRICS.map((name) => ({
      name,
      value: null,
      seal: 'nao_fornecido',
      source: '',
      attributionWindow: null,
      premise: null,
      confirmedByHuman: false,
      ...(name === 'ROAS' ? { cashConfirmed: false } : {}),
    })),
    reader: {
      literalOnly: true,
      sampleSufficientForCpa: false,
      note: 'Aguardando valores literais confirmados pelo operador.',
    },
    diagnosis: null,
    decision: { status: 'pending' },
    events: [],
  };
}

export function updateWeeklyMetric(panel: WeeklyPanel, name: string, patch: Partial<WeeklyMetric>): WeeklyPanel {
  const metrics = panel.metrics.map((metric) => {
    if (metric.name !== name) return metric;
    const next = { ...metric, ...patch };
    if (next.seal === 'nao_fornecido') {
      next.value = null;
      next.confirmedByHuman = false;
      next.source = '';
    }
    if (name === 'ROAS' && next.seal === 'Real' && !next.cashConfirmed) {
      next.seal = 'Estimado';
      next.premise = next.premise || 'Atribuição da plataforma; venda não confirmada no caixa.';
    }
    return next;
  });
  return { ...panel, metrics, revision: panel.revision + 1 };
}

export function confirmLiteralReading(panel: WeeklyPanel, now = new Date().toISOString()): WeeklyPanel {
  const supplied = panel.metrics.filter((metric) => metric.value != null && metric.confirmedByHuman && metric.seal !== 'nao_fornecido');
  const purchases = supplied.find((metric) => metric.name === 'Compras')?.value;
  const sampleSufficientForCpa = typeof purchases === 'number' && purchases >= 8;
  return {
    ...panel,
    status: 'reading_ready',
    revision: panel.revision + 1,
    reader: {
      literalOnly: true,
      sampleSufficientForCpa,
      note: sampleSufficientForCpa
        ? 'Amostra marcada como suficiente para leitura de CPA.'
        : 'Amostra insuficiente para CPA; leia sinais de topo.',
      reviewedAt: now,
    },
    events: [...panel.events, {
      id: `event-reading-${panel.revision + 1}`,
      type: 'literal_reading_confirmed',
      actor: 'human',
      createdAt: now,
      payload: { suppliedMetrics: supplied.map((metric) => metric.name) },
    }],
  };
}

export function applyDiagnosis(
  panel: WeeklyPanel,
  diagnosis: NonNullable<WeeklyPanel['diagnosis']>,
  now = new Date().toISOString(),
): WeeklyPanel {
  if (!diagnosis.hypothesis || !diagnosis.singleLever || !diagnosis.successCriterion || !diagnosis.reversalCriterion) {
    throw new Error('O diagnóstico precisa conter as quatro partes obrigatórias.');
  }
  return {
    ...panel,
    status: 'diagnosed',
    revision: panel.revision + 1,
    diagnosis,
    decision: { status: 'pending' },
    events: [...panel.events, {
      id: `event-diagnosis-${panel.revision + 1}`,
      type: 'diagnosis_proposed',
      actor: 'skill',
      createdAt: now,
      payload: diagnosis,
    }],
  };
}

export function decideWeeklyLever(
  panel: WeeklyPanel,
  status: 'approved' | 'rejected',
  humanAction: string,
  now = new Date().toISOString(),
): WeeklyPanel {
  if (!panel.diagnosis) throw new Error('Não existe diagnóstico para decidir.');
  return {
    ...panel,
    status: 'decided',
    revision: panel.revision + 1,
    decision: { status, humanAction, decidedAt: now, decidedBy: 'operador' },
    events: [...panel.events, {
      id: `event-decision-${panel.revision + 1}`,
      type: status === 'approved' ? 'lever_approved' : 'lever_rejected',
      actor: 'human',
      createdAt: now,
      payload: { humanAction },
    }],
  };
}
