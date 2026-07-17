import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsonHasUnsafeNumber } from './build-weekly-ledger.mjs';

const RECONCILIATION_SCHEMA_URL = new URL('../data/contracts/source-reconciliation.v1.schema.json', import.meta.url);
const OUTPUT_SCHEMA_URL = new URL('../data/contracts/decision-outcome-diagnosis.v1.schema.json', import.meta.url);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HASH = /^[a-f0-9]{64}$/;
const NONCE = '(?=[a-f0-9]{8,32}$)(?=[a-f0-9]*[a-f])[a-f0-9]+';
const ID_PATTERNS = Object.freeze({
  decision: new RegExp(`^decision:\\d{4}-\\d{2}-\\d{2}:${NONCE}$`),
  hypothesis: new RegExp(`^hypothesis:${NONCE}$`),
  lever: new RegExp(`^lever:${NONCE}$`),
  successCriterion: new RegExp(`^criterion:success:${NONCE}$`),
  measurementWindow: new RegExp(`^window:\\d{4}-\\d{2}-\\d{2}:\\d{4}-\\d{2}-\\d{2}:${NONCE}$`),
  reversalCriterion: new RegExp(`^criterion:reversal:${NONCE}$`),
  reversal: new RegExp(`^reversal:${NONCE}$`),
  circuitBreaker: new RegExp(`^circuit-breaker:${NONCE}$`),
  operator: new RegExp(`^operator:\\d{4}-\\d{2}-\\d{2}:${NONCE}$`),
});
const METRICS = new Set(['revenue', 'orders', 'refunds', 'fees', 'net_revenue', 'cpa', 'roas', 'spend', 'ctr']);
const RECONCILABLE_METRICS = new Set(['revenue', 'orders', 'refunds', 'fees', 'net_revenue']);
const WINDOWS = new Set([
  'calendar_day', 'calendar_week', 'calendar_month', 'lifetime',
  '1d_click', '7d_click', '7d_click_1d_view', '28d_click_1d_view',
]);
const DECIMAL = /^(0|[1-9][0-9]{0,29})(\.[0-9]{1,12})?$/;
const SENSITIVE_ID = /(?:token|secret|password|bearer|authorization|api[-_]?key|email|phone|telefone|cpf|cnpj|document|address|endereco)/i;
const SENSITIVE_NUMERIC_ID = /(?:^|[^0-9])(?:[0-9]{11}|[0-9]{14})(?:[^0-9]|$)/;
const SAMPLE_KEYS = [
  'weekStart', 'revision', 'weeklyPanelId', 'canonicalHash', 'projectionDigest',
  'metricPresent', 'value', 'seal', 'sourceRef', 'attributionWindow', 'premiseRef',
  'confirmedByHuman', 'cashConfirmed',
];
const METRIC_KEYS = [
  'name', 'value', 'seal', 'sourceRef', 'attributionWindow', 'premiseRef',
  'confirmedByHuman', 'cashConfirmed',
];

let validatorsPromise;

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join('\0') === [...keys].sort().join('\0');
}

function isText(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 512;
}

function isSafePublicId(value, pattern) {
  return typeof value === 'string' && pattern.test(value)
    && !SENSITIVE_ID.test(value) && !SENSITIVE_NUMERIC_ID.test(value);
}

function isSafeMetricValue(value) {
  return typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(value)
    ? value >= 0
    : typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isRef(value, allowedKinds) {
  return exactKeys(value, ['kind', 'id'])
    && allowedKinds.has(value.kind)
    && isSafePublicId(value.id, /^[a-z0-9][a-z0-9.:-]{0,127}$/);
}

function isPremiseRef(value) {
  return value === null || isRef(value, new Set(['assumption']));
}

function toDecimalParts(value) {
  const source = typeof value === 'number' ? String(value) : value;
  if (typeof source !== 'string' || !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?$/i.test(source)) return null;
  const [coefficient, exponentText = '0'] = source.toLowerCase().split('e');
  const [whole, fraction = ''] = coefficient.split('.');
  const exponent = Number(exponentText);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) return null;
  let digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, '');
  let scale = fraction.length - exponent;
  if (scale < 0) {
    digits += '0'.repeat(-scale);
    scale = 0;
  }
  while (scale > 0 && digits.endsWith('0')) {
    digits = digits.slice(0, -1);
    scale -= 1;
  }
  return { units: BigInt(digits || '0'), scale };
}

function compareDecimals(left, right) {
  const a = toDecimalParts(left);
  const b = toDecimalParts(right);
  if (!a || !b) return null;
  const scale = Math.max(a.scale, b.scale);
  const aUnits = a.units * (10n ** BigInt(scale - a.scale));
  const bUnits = b.units * (10n ** BigInt(scale - b.scale));
  return aUnits < bUnits ? -1 : aUnits > bUnits ? 1 : 0;
}

function criterionMet(value, criterion) {
  const comparison = compareDecimals(value, criterion.threshold);
  if (comparison === null) return false;
  return criterion.operator === 'gte' ? comparison >= 0 : comparison <= 0;
}

async function validators() {
  validatorsPromise ??= (async () => {
    const [reconciliationSchema, outputSchema] = await Promise.all([
      readFile(RECONCILIATION_SCHEMA_URL, 'utf8').then(JSON.parse),
      readFile(OUTPUT_SCHEMA_URL, 'utf8').then(JSON.parse),
    ]);
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    return {
      reconciliation: ajv.compile(reconciliationSchema),
      output: ajv.compile(outputSchema),
    };
  })();
  return validatorsPromise;
}

function decisionIsValid(decision) {
  if (!exactKeys(decision, [
    'id', 'hypothesis', 'lever', 'successCriterion', 'measurementWindow',
    'reversalCriterion', 'reversal', 'circuitBreaker', 'humanDecision', 'candidateNextLever',
  ])) return false;
  if (!ID_PATTERNS.decision.test(decision.id)) return false;
  if (!exactKeys(decision.hypothesis, ['id', 'text'])
    || !ID_PATTERNS.hypothesis.test(decision.hypothesis.id) || !isText(decision.hypothesis.text)) return false;
  if (!exactKeys(decision.lever, ['id', 'text'])
    || !ID_PATTERNS.lever.test(decision.lever.id) || !isText(decision.lever.text)) return false;
  if (!exactKeys(decision.successCriterion, ['id', 'metric', 'operator', 'threshold'])
    || !ID_PATTERNS.successCriterion.test(decision.successCriterion.id)) return false;
  if (!exactKeys(decision.reversalCriterion, ['id', 'metric', 'operator', 'threshold'])
    || !ID_PATTERNS.reversalCriterion.test(decision.reversalCriterion.id)) return false;
  for (const criterion of [decision.successCriterion, decision.reversalCriterion]) {
    if (!METRICS.has(criterion.metric) || !new Set(['gte', 'lte']).has(criterion.operator)
      || !DECIMAL.test(criterion.threshold)) return false;
  }
  if (decision.successCriterion.metric !== decision.reversalCriterion.metric
    || decision.successCriterion.operator === decision.reversalCriterion.operator) return false;
  const thresholds = compareDecimals(decision.successCriterion.threshold, decision.reversalCriterion.threshold);
  if (thresholds === null) return false;
  if (decision.successCriterion.operator === 'gte' ? thresholds <= 0 : thresholds >= 0) return false;
  const window = decision.measurementWindow;
  if (!exactKeys(window, [
    'id', 'fromWeekStart', 'toWeekStart', 'attributionWindow', 'minDistinctWeeks',
  ]) || !ID_PATTERNS.measurementWindow.test(window.id)
    || !DATE.test(window.fromWeekStart) || !DATE.test(window.toWeekStart)
    || window.fromWeekStart > window.toWeekStart || !WINDOWS.has(window.attributionWindow)
    || !Number.isInteger(window.minDistinctWeeks) || window.minDistinctWeeks < 2 || window.minDistinctWeeks > 52) return false;
  if (!window.id.startsWith(`window:${window.fromWeekStart}:${window.toWeekStart}:`)) return false;
  if (!exactKeys(decision.reversal, ['id', 'text'])
    || !ID_PATTERNS.reversal.test(decision.reversal.id) || !isText(decision.reversal.text)) return false;
  if (!exactKeys(decision.circuitBreaker, ['id', 'text'])
    || !ID_PATTERNS.circuitBreaker.test(decision.circuitBreaker.id) || !isText(decision.circuitBreaker.text)) return false;
  if (!exactKeys(decision.humanDecision, ['status', 'decidedAt', 'ref'])
    || decision.humanDecision.status !== 'approved'
    || !ID_PATTERNS.operator.test(decision.humanDecision.ref)
    || !Number.isFinite(Date.parse(decision.humanDecision.decidedAt))) return false;
  if (!exactKeys(decision.candidateNextLever, ['id', 'action'])
    || !ID_PATTERNS.lever.test(decision.candidateNextLever.id)
    || decision.candidateNextLever.action !== 'execute_declared_reversal') return false;
  const ids = [
    decision.id, decision.hypothesis.id, decision.lever.id, decision.successCriterion.id,
    decision.measurementWindow.id, decision.reversalCriterion.id, decision.reversal.id,
    decision.circuitBreaker.id, decision.humanDecision.ref, decision.candidateNextLever.id,
  ];
  return new Set(ids).size === ids.length;
}

function metricIsValid(metric) {
  if (!exactKeys(metric, METRIC_KEYS) || !METRICS.has(metric.name)) return false;
  if (!new Set(['Real', 'Estimado', 'nao_fornecido']).has(metric.seal)) return false;
  if (metric.seal === 'nao_fornecido') {
    return metric.value === null && metric.sourceRef !== null && metric.attributionWindow === null
      && metric.premiseRef === null && metric.confirmedByHuman === false && metric.cashConfirmed === false;
  }
  if (!isSafeMetricValue(metric.value)
    || !isRef(metric.sourceRef, new Set(['checkout-export', 'operator-declaration', 'platform-export', 'tracking-audit']))) return false;
  if (typeof metric.attributionWindow !== 'string' || metric.attributionWindow.length === 0) return false;
  if (metric.seal === 'Estimado' && !isRef(metric.premiseRef, new Set(['assumption']))) return false;
  return isPremiseRef(metric.premiseRef)
    && typeof metric.confirmedByHuman === 'boolean' && typeof metric.cashConfirmed === 'boolean';
}

function sampleIsValid(sample) {
  if (!exactKeys(sample, SAMPLE_KEYS) || !DATE.test(sample.weekStart)
    || !Number.isInteger(sample.revision) || sample.revision < 1
    || !isSafePublicId(sample.weeklyPanelId, /^weekly-panel:[a-z0-9][a-z0-9.:-]{0,127}$/)
    || !HASH.test(sample.canonicalHash)
    || !HASH.test(sample.projectionDigest) || typeof sample.metricPresent !== 'boolean') return false;
  if (!sample.metricPresent) {
    return sample.value === null && sample.seal === 'nao_fornecido' && sample.sourceRef === null
      && sample.attributionWindow === null && sample.premiseRef === null
      && sample.confirmedByHuman === false && sample.cashConfirmed === false;
  }
  return metricIsValid({ name: 'revenue', ...Object.fromEntries(
    METRIC_KEYS.filter((key) => key !== 'name').map((key) => [key, sample[key]]),
  ) });
}

function sameObservation(entry, sample, metricName) {
  if (entry.weekStart !== sample.weekStart || entry.revision !== sample.revision
    || entry.weeklyPanelId !== sample.weeklyPanelId || entry.canonicalHash !== sample.canonicalHash
    || entry.projectionDigest !== sample.projectionDigest) return false;
  const metric = entry.metrics.find((candidate) => candidate.name === metricName);
  if (!sample.metricPresent) return metric === undefined;
  if (!metric) return false;
  return JSON.stringify(metric) === JSON.stringify({
    name: metricName, value: sample.value, seal: sample.seal, sourceRef: sample.sourceRef,
    attributionWindow: sample.attributionWindow, premiseRef: sample.premiseRef,
    confirmedByHuman: sample.confirmedByHuman, cashConfirmed: sample.cashConfirmed,
  });
}

function historyIsValid(reading, metricName) {
  if (!exactKeys(reading, ['contract', 'schemaVersion', 'selection', 'source', 'entries', 'series', 'warnings'])
    || reading.contract !== 'HistoricalMetricsReading' || reading.schemaVersion !== '1.0.0') return false;
  if (!exactKeys(reading.selection, ['projectId', 'campaignId', 'weekStart'])
    || !isSafePublicId(reading.selection.projectId, /^project-[a-z0-9][a-z0-9-]{0,63}$/)
    || !isSafePublicId(reading.selection.campaignId, /^campaign-[a-z0-9][a-z0-9-]{0,63}$/)
    || reading.selection.weekStart !== null) return false;
  if (!exactKeys(reading.source, [
    'contract', 'schemaVersion', 'hashAlgorithm', 'projectionDigestVersion', 'projectionDigestAlgorithm',
  ]) || reading.source.contract !== 'WeeklyLedger' || reading.source.schemaVersion !== '1.1.0'
    || reading.source.hashAlgorithm !== 'sha256' || reading.source.projectionDigestVersion !== '1.0.0'
    || reading.source.projectionDigestAlgorithm !== 'sha256') return false;
  if (!Array.isArray(reading.entries) || !Array.isArray(reading.series) || !Array.isArray(reading.warnings)) return false;
  if (reading.series.some((series, index) => index > 0 && compareText(reading.series[index - 1].name, series.name) >= 0)) return false;
  const series = reading.series.find((candidate) => candidate.name === metricName);
  if (!series || !exactKeys(series, ['name', 'samples', 'bySeal', 'comparison'])
    || !Array.isArray(series.samples) || !exactKeys(series.bySeal, ['Real', 'Estimado', 'nao_fornecido'])
    || !exactKeys(series.comparison, ['status', 'requiresHumanDecision', 'warningCodes'])) return false;
  for (let index = 0; index < series.samples.length; index += 1) {
    const sample = series.samples[index];
    if (!sampleIsValid(sample)) return false;
    if (index > 0) {
      const previous = series.samples[index - 1];
      if (compareText(previous.weekStart, sample.weekStart) > 0
        || (previous.weekStart === sample.weekStart && previous.revision >= sample.revision)) return false;
    }
    const entry = reading.entries.find((candidate) => (
      candidate.weekStart === sample.weekStart && candidate.revision === sample.revision
    ));
    if (!entry || !exactKeys(entry, ['weekStart', 'revision', 'weeklyPanelId', 'canonicalHash', 'projectionDigest', 'metrics'])
      || !Array.isArray(entry.metrics) || entry.metrics.some((metric) => !metricIsValid(metric))
      || !sameObservation(entry, sample, metricName)) return false;
  }
  const expectedBySeal = { Real: [], Estimado: [], nao_fornecido: [] };
  series.samples.forEach((sample, index) => expectedBySeal[sample.seal].push(index));
  return JSON.stringify(series.bySeal) === JSON.stringify(expectedBySeal)
    && reading.entries.length === series.samples.length;
}

function periodCoversWindow(source, window) {
  if (!source.period) return false;
  const start = Date.parse(source.period.start);
  const end = Date.parse(source.period.end);
  const expectedStart = Date.parse(`${window.fromWeekStart}T00:00:00Z`);
  const expectedEnd = Date.parse(`${window.toWeekStart}T00:00:00Z`) + 7 * 24 * 60 * 60 * 1000;
  return start <= expectedStart && end >= expectedEnd;
}

function evidenceState(request) {
  const decision = request.previousDecision;
  const metricName = decision.successCriterion.metric;
  const series = request.historicalReading.series.find((candidate) => candidate.name === metricName);
  const samples = series.samples.filter((sample) => (
    sample.weekStart >= decision.measurementWindow.fromWeekStart
    && sample.weekStart <= decision.measurementWindow.toWeekStart
  ));
  if (new Set(samples.map((sample) => sample.weekStart)).size < decision.measurementWindow.minDistinctWeeks) {
    return { verdict: 'nao_mensuravel', reason: 'INSUFFICIENT_DISTINCT_WEEKS', samples };
  }
  if (samples.some((sample) => sample.seal === 'Estimado')) {
    return { verdict: 'nao_mensuravel', reason: 'ESTIMATED_EVIDENCE', samples };
  }
  if (samples.some((sample) => !sample.metricPresent || sample.value === null || !sample.confirmedByHuman)) {
    return { verdict: 'nao_mensuravel', reason: 'MISSING_OR_UNCONFIRMED', samples };
  }
  if (samples.some((sample) => sample.attributionWindow !== decision.measurementWindow.attributionWindow)) {
    return { verdict: 'nao_mensuravel', reason: 'INCOMPATIBLE_ATTRIBUTION_WINDOW', samples };
  }
  const latest = samples.at(-1);
  if (RECONCILABLE_METRICS.has(metricName)) {
    const reconciliation = request.sourceReconciliation;
    if (reconciliation.metric !== metricName
      || reconciliation.sources.some((source) => (
        source.status !== 'provided' || !source.confirmedByHuman
        || source.window !== decision.measurementWindow.attributionWindow
        || !periodCoversWindow(source, decision.measurementWindow)
        || (source.source === 'cash' && !source.cashConfirmed)
      )) || reconciliation.comparisons.some((comparison) => !comparison.comparable)) {
      return { verdict: 'nao_mensuravel', reason: 'RECONCILIATION_NOT_MEASURABLE', samples };
    }
    if (reconciliation.comparisons.some((comparison) => compareDecimals(comparison.absoluteGap, '0') !== 0)
      || reconciliation.sources.some((source) => compareDecimals(source.value, latest.value) !== 0)) {
      return { verdict: 'inconclusivo', reason: 'RECONCILIATION_CONFOUNDING_GAP', samples };
    }
  }
  if (criterionMet(latest.value, decision.successCriterion)) {
    return { verdict: 'sustentou', reason: 'SUCCESS_CRITERION_MET', samples };
  }
  if (criterionMet(latest.value, decision.reversalCriterion)) {
    return { verdict: 'refutou', reason: 'REVERSAL_CRITERION_MET', samples };
  }
  return { verdict: 'inconclusivo', reason: 'NO_CRITERION_MET', samples };
}

function buildOutput(request) {
  const decision = request.previousDecision;
  const state = evidenceState(request);
  const reconciliation = request.sourceReconciliation;
  return {
    contract: 'DecisionOutcomeDiagnosis',
    schemaVersion: '1.0.0',
    decisionRefs: {
      decisionId: decision.id,
      hypothesisId: decision.hypothesis.id,
      leverId: decision.lever.id,
      successCriterionId: decision.successCriterion.id,
      measurementWindowId: decision.measurementWindow.id,
      reversalCriterionId: decision.reversalCriterion.id,
      reversalId: decision.reversal.id,
      circuitBreakerId: decision.circuitBreaker.id,
      humanDecisionRef: decision.humanDecision.ref,
    },
    evidence: {
      historicalReading: {
        contract: request.historicalReading.contract,
        schemaVersion: request.historicalReading.schemaVersion,
        projectId: request.historicalReading.selection.projectId,
        campaignId: request.historicalReading.selection.campaignId,
        metric: decision.successCriterion.metric,
        attributionWindow: decision.measurementWindow.attributionWindow,
        observationRefs: state.samples.map((sample) => ({
          weekStart: sample.weekStart,
          revision: sample.revision,
          weeklyPanelId: sample.weeklyPanelId,
          canonicalHash: sample.canonicalHash,
          projectionDigest: sample.projectionDigest,
          sourceRef: sample.sourceRef,
        })),
      },
      sourceReconciliation: reconciliation ? {
        contract: reconciliation.contract,
        schemaVersion: reconciliation.schemaVersion,
        reconciliationId: reconciliation.reconciliationId,
        metric: reconciliation.metric,
        provenanceRefs: reconciliation.sources.filter((source) => source.provenanceRef !== null).map((source) => ({
          source: source.source, ref: source.provenanceRef,
        })),
      } : null,
    },
    verdict: state.verdict,
    reasonCodes: [state.reason],
    proposedLevers: state.verdict === 'refutou' ? [{
      leverId: decision.candidateNextLever.id,
      action: decision.candidateNextLever.action,
      reversalRef: decision.reversal.id,
    }] : [],
    circuitBreaker: { ref: decision.circuitBreaker.id, status: 'preserved_not_executed' },
    humanDecision: {
      required: true, status: 'pending', historicalDecisionRef: decision.humanDecision.ref,
    },
    guards: { mutationAllowed: false, historicalDecisionImmutable: true },
  };
}

export async function diagnoseDecisionOutcome(request) {
  const baseKeys = ['contract', 'schemaVersion', 'previousDecision', 'historicalReading'];
  const hasReconciliation = Object.hasOwn(request ?? {}, 'sourceReconciliation');
  if (!(exactKeys(request, baseKeys) || exactKeys(request, [...baseKeys, 'sourceReconciliation']))
    || request.contract !== 'DecisionOutcomeEvaluationRequest' || request.schemaVersion !== '1.0.0'
    || !decisionIsValid(request.previousDecision)
    || !historyIsValid(request.historicalReading, request.previousDecision.successCriterion.metric)) return null;
  const metricName = request.previousDecision.successCriterion.metric;
  const requiresReconciliation = RECONCILABLE_METRICS.has(metricName);
  if (requiresReconciliation !== hasReconciliation) return null;
  const { reconciliation: validateReconciliation, output: validateOutput } = await validators();
  if (requiresReconciliation && (!validateReconciliation(request.sourceReconciliation)
    || request.sourceReconciliation.metric !== metricName)) return null;
  const output = buildOutput(request);
  if (!validateOutput(output)) throw new Error('OUTPUT_CONTRACT_VIOLATION');
  return output;
}

async function main(args) {
  if (args.length !== 1) {
    process.stderr.write('USAGE\n');
    return 2;
  }
  let input;
  try {
    input = await readFile(args[0], 'utf8');
  } catch {
    process.stderr.write('UNABLE_TO_READ\n');
    return 2;
  }
  if (jsonHasUnsafeNumber(input)) {
    process.stderr.write('UNSAFE_JSON_NUMBER\n');
    return 2;
  }
  let request;
  try {
    request = JSON.parse(input);
  } catch {
    process.stderr.write('INVALID_JSON\n');
    return 2;
  }
  try {
    const output = await diagnoseDecisionOutcome(request);
    if (!output) {
      process.stderr.write('INVALID_EVALUATION_REQUEST\n');
      return 1;
    }
    process.stdout.write(`${JSON.stringify(output)}\n`);
    return 0;
  } catch {
    process.stderr.write('DIAGNOSIS_ERROR\n');
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = await main(process.argv.slice(2));
}
