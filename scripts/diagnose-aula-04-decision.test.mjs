import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(new URL('./diagnose-aula-04-decision.mjs', import.meta.url));
const FIXTURES = fileURLToPath(new URL('../aula-04/fixtures/', import.meta.url));
const SCHEMA = new URL('../data/contracts/decision-outcome-diagnosis.v1.schema.json', import.meta.url);
const SKILL = new URL('../.claude/skills/diagnosticador/SKILL.md', import.meta.url);
const MIRROR = new URL('../.agents/skills/diagnosticador/SKILL.md', import.meta.url);

function fixture(name) {
  return path.join(FIXTURES, name);
}

async function run(args) {
  try {
    const result = await execFileAsync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
    return { ...result, code: 0 };
  } catch (error) {
    return { stdout: error.stdout ?? '', stderr: error.stderr ?? '', code: error.code };
  }
}

async function withBundle(t, bundle, name = 'diagnosis-request.json') {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'decision-diagnosis-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, name);
  await writeFile(file, `${JSON.stringify(bundle, null, 2)}\n`);
  return file;
}

function sample(weekStart, value, index, overrides = {}) {
  return {
    weekStart,
    revision: 1,
    weeklyPanelId: `weekly-panel:diagnosis:${weekStart}:r1`,
    canonicalHash: `${index}`.repeat(64),
    projectionDigest: `${index + 4}`.repeat(64),
    metricPresent: true,
    value,
    seal: 'Real',
    sourceRef: { kind: 'platform-export', id: `week-${index}` },
    attributionWindow: 'calendar_week',
    premiseRef: null,
    confirmedByHuman: true,
    cashConfirmed: true,
    ...overrides,
  };
}

function history(latestValue = 1100) {
  const samples = [sample('2026-06-01', 900, 1), sample('2026-06-08', latestValue, 2)];
  return {
    contract: 'HistoricalMetricsReading',
    schemaVersion: '1.0.0',
    selection: { projectId: 'project-history', campaignId: 'campaign-history', weekStart: null },
    source: {
      contract: 'WeeklyLedger', schemaVersion: '1.1.0', hashAlgorithm: 'sha256',
      projectionDigestVersion: '1.0.0', projectionDigestAlgorithm: 'sha256',
    },
    entries: samples.map((entry) => ({
      weekStart: entry.weekStart,
      revision: entry.revision,
      weeklyPanelId: entry.weeklyPanelId,
      canonicalHash: entry.canonicalHash,
      projectionDigest: entry.projectionDigest,
      metrics: [{
        name: 'revenue', value: entry.value, seal: entry.seal,
        sourceRef: entry.sourceRef, attributionWindow: entry.attributionWindow,
        premiseRef: entry.premiseRef, confirmedByHuman: entry.confirmedByHuman,
        cashConfirmed: entry.cashConfirmed,
      }],
    })),
    series: [{
      name: 'revenue', samples,
      bySeal: { Real: [0, 1], Estimado: [], nao_fornecido: [] },
      comparison: { status: 'comparable', requiresHumanDecision: false, warningCodes: [] },
    }],
    warnings: [],
  };
}

function reconciliation(value = '1100', overrides = {}) {
  const source = (kind, nonce, offset, cashConfirmed) => ({
    source: kind,
    status: 'provided',
    value,
    currency: 'BRL',
    window: 'calendar_week',
    period: { start: '2026-06-01T00:00:00Z', end: '2026-06-15T00:00:00Z' },
    observedAt: `2026-06-15T00:0${offset}:00Z`,
    confirmedByHuman: true,
    cashConfirmed,
    provenanceRef: {
      kind: kind === 'platform' ? 'platform-export' : kind === 'checkout' ? 'checkout-export' : 'cash-export',
      id: `${kind}:2026-06:${nonce}`,
    },
  });
  const pair = (left, right) => ({
    pair: [left, right], comparable: true, reasonCodes: [], absoluteGap: '0',
    relativeGap: '0', relativeGapExact: { numerator: '0', denominator: '1' },
  });
  return {
    contract: 'SourceReconciliation', schemaVersion: '1.0.0',
    reconciliationId: 'reconciliation:revenue:2026-06:a1b2c3d4', metric: 'revenue',
    sourceContract: { contract: 'SourceObservationSet', schemaVersion: '1.0.0' },
    sources: [
      source('platform', 'a1b2c3d4', 1, false),
      source('checkout', 'b2c3d4e5', 2, false),
      source('cash', 'c3d4e5f6', 3, true),
    ],
    comparisons: [pair('platform', 'checkout'), pair('platform', 'cash'), pair('checkout', 'cash')],
    requiresHumanReview: true,
    ...overrides,
  };
}

function previousDecision() {
  return {
    id: 'decision:2026-06-01:a1b2c3d4',
    hypothesis: { id: 'hypothesis:a1b2c3d4', text: 'A mudança declarada pode elevar a receita.' },
    lever: { id: 'lever:a1b2c3d4', text: 'Aplicar somente a mudança declarada.' },
    successCriterion: {
      id: 'criterion:success:a1b2c3d4', metric: 'revenue', operator: 'gte', threshold: '1000',
    },
    measurementWindow: {
      id: 'window:2026-06-01:2026-06-08:a1b2c3d4', fromWeekStart: '2026-06-01',
      toWeekStart: '2026-06-08', attributionWindow: 'calendar_week', minDistinctWeeks: 2,
    },
    reversalCriterion: {
      id: 'criterion:reversal:a1b2c3d4', metric: 'revenue', operator: 'lte', threshold: '800',
    },
    reversal: { id: 'reversal:a1b2c3d4', text: 'Reverter para a configuração declarada anterior.' },
    circuitBreaker: {
      id: 'circuit-breaker:a1b2c3d4', text: 'Interromper e pedir revisão humana no limite declarado.'
    },
    humanDecision: {
      status: 'approved', decidedAt: '2026-06-01T12:00:00Z', ref: 'operator:2026-06-01:a1b2c3d4',
    },
    candidateNextLever: { id: 'lever:b2c3d4e5', action: 'execute_declared_reversal' },
  };
}

function bundle(latestValue = 1100, reconciliationValue = String(latestValue)) {
  return {
    contract: 'DecisionOutcomeEvaluationRequest', schemaVersion: '1.0.0',
    previousDecision: previousDecision(),
    historicalReading: history(latestValue),
    sourceReconciliation: reconciliation(reconciliationValue),
  };
}

function bundleForMetric(metric, latestValue, {
  successOperator = 'gte', successThreshold = '1000',
  reversalOperator = 'lte', reversalThreshold = '800',
} = {}) {
  const request = bundle(latestValue);
  request.previousDecision.successCriterion = {
    ...request.previousDecision.successCriterion,
    metric,
    operator: successOperator,
    threshold: successThreshold,
  };
  request.previousDecision.reversalCriterion = {
    ...request.previousDecision.reversalCriterion,
    metric,
    operator: reversalOperator,
    threshold: reversalThreshold,
  };
  request.historicalReading.series[0].name = metric;
  request.historicalReading.entries.forEach((entry) => {
    entry.metrics[0].name = metric;
  });
  delete request.sourceReconciliation;
  return request;
}

function parseSuccess(result) {
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  assert.ok(result.stdout.endsWith('\n'));
  return JSON.parse(result.stdout);
}

async function golden(name) {
  return JSON.parse(await readFile(fixture(name), 'utf8'));
}

test('quatro vereditos são determinísticos e batem os goldens sem narrativa causal', async (t) => {
  const scenarios = [
    ['diagnosis-sustained.json', bundle(1100)],
    ['diagnosis-refuted.json', bundle(750)],
    ['diagnosis-inconclusive.json', bundle(900)],
    ['diagnosis-not-measurable.json', bundle(1100)],
  ];
  scenarios[3][1].historicalReading.series[0].samples.splice(1);
  scenarios[3][1].historicalReading.entries.splice(1);
  scenarios[3][1].historicalReading.series[0].bySeal.Real = [0];
  scenarios[3][1].historicalReading.series[0].comparison = {
    status: 'insufficient_history', requiresHumanDecision: true,
    warningCodes: ['INSUFFICIENT_HISTORY'],
  };
  scenarios[3][1].historicalReading.warnings = [{ code: 'INSUFFICIENT_HISTORY', metric: 'revenue' }];

  for (const [fixtureName, request] of scenarios) {
    const file = await withBundle(t, request, fixtureName);
    const first = await run([file]);
    const second = await run([file]);
    assert.equal(first.stdout, second.stdout, fixtureName);
    const output = parseSuccess(first);
    assert.deepEqual({
      verdict: output.verdict,
      reasonCodes: output.reasonCodes,
      proposedLevers: output.proposedLevers,
    }, await golden(fixtureName), fixtureName);
    assert.equal(JSON.stringify(output).includes('porque'), false, fixtureName);
    assert.equal(JSON.stringify(output).includes('caus'), false, fixtureName);
  }
});

test('saída referencia decisão, observações e proveniência sem republicar texto ou valores', async (t) => {
  const request = bundle(1100);
  request.previousDecision.hypothesis.text = 'Pessoa aluno@example.invalid token-super-secreto';
  const file = await withBundle(t, request);
  const output = parseSuccess(await run([file]));
  assert.deepEqual(output.decisionRefs, {
    decisionId: 'decision:2026-06-01:a1b2c3d4', hypothesisId: 'hypothesis:a1b2c3d4',
    leverId: 'lever:a1b2c3d4', successCriterionId: 'criterion:success:a1b2c3d4',
    measurementWindowId: 'window:2026-06-01:2026-06-08:a1b2c3d4',
    reversalCriterionId: 'criterion:reversal:a1b2c3d4', reversalId: 'reversal:a1b2c3d4',
    circuitBreakerId: 'circuit-breaker:a1b2c3d4', humanDecisionRef: 'operator:2026-06-01:a1b2c3d4',
  });
  assert.deepEqual(output.evidence.historicalReading.observationRefs.map(({ weekStart }) => weekStart), [
    '2026-06-01', '2026-06-08',
  ]);
  assert.deepEqual(output.evidence.sourceReconciliation.provenanceRefs.map(({ source }) => source), [
    'platform', 'checkout', 'cash',
  ]);
  const serialized = JSON.stringify(output);
  assert.equal(serialized.includes('aluno@example.invalid'), false);
  assert.equal(serialized.includes('token-super-secreto'), false);
  assert.equal(serialized.includes('1100'), false);
  assert.equal(output.guards.mutationAllowed, false);
  assert.equal(output.guards.historicalDecisionImmutable, true);
  assert.equal(output.humanDecision.required, true);
  assert.equal(output.circuitBreaker.status, 'preserved_not_executed');
});

test('evidência estimada, janela incompatível, histórico insuficiente e ausência falham para nao_mensuravel', async (t) => {
  const cases = [
    ['estimated', (request) => {
      request.historicalReading.series[0].samples[1].seal = 'Estimado';
      request.historicalReading.series[0].samples[1].premiseRef = { kind: 'assumption', id: 'assumption-2' };
      request.historicalReading.entries[1].metrics[0].seal = 'Estimado';
      request.historicalReading.entries[1].metrics[0].premiseRef = { kind: 'assumption', id: 'assumption-2' };
      request.historicalReading.series[0].bySeal = { Real: [0], Estimado: [1], nao_fornecido: [] };
    }, 'ESTIMATED_EVIDENCE'],
    ['window', (request) => {
      request.historicalReading.series[0].samples[1].attributionWindow = '1d_click';
      request.historicalReading.entries[1].metrics[0].attributionWindow = '1d_click';
      request.historicalReading.series[0].comparison = {
        status: 'incompatible_attribution_window', requiresHumanDecision: true,
        warningCodes: ['INCOMPATIBLE_ATTRIBUTION_WINDOW'],
      };
      request.historicalReading.warnings = [{ code: 'INCOMPATIBLE_ATTRIBUTION_WINDOW', metric: 'revenue' }];
    }, 'INCOMPATIBLE_ATTRIBUTION_WINDOW'],
    ['missing', (request) => {
      Object.assign(request.historicalReading.series[0].samples[1], {
        metricPresent: false, value: null, seal: 'nao_fornecido', sourceRef: null,
        attributionWindow: null, premiseRef: null, confirmedByHuman: false, cashConfirmed: false,
      });
      request.historicalReading.entries[1].metrics = [];
      request.historicalReading.series[0].bySeal = { Real: [0], Estimado: [], nao_fornecido: [1] };
      request.historicalReading.series[0].comparison = {
        status: 'missing_or_unconfirmed', requiresHumanDecision: true,
        warningCodes: ['MISSING_OR_UNCONFIRMED'],
      };
      request.historicalReading.warnings = [{ code: 'MISSING_OR_UNCONFIRMED', metric: 'revenue' }];
    }, 'MISSING_OR_UNCONFIRMED'],
    ['reconciliation', (request) => {
      request.sourceReconciliation.sources[2] = {
        source: 'cash', status: 'nao_fornecido', value: null, currency: null, window: null,
        period: null, observedAt: null, confirmedByHuman: false, cashConfirmed: false,
        provenanceRef: null,
      };
      request.sourceReconciliation.comparisons[1] = {
        pair: ['platform', 'cash'], comparable: false, reasonCodes: ['MISSING_SOURCE'],
        absoluteGap: null, relativeGap: null, relativeGapExact: null,
      };
      request.sourceReconciliation.comparisons[2] = {
        pair: ['checkout', 'cash'], comparable: false, reasonCodes: ['MISSING_SOURCE'],
        absoluteGap: null, relativeGap: null, relativeGapExact: null,
      };
    }, 'RECONCILIATION_NOT_MEASURABLE'],
  ];
  for (const [name, mutate, reason] of cases) {
    const request = bundle(1100);
    mutate(request);
    const output = parseSuccess(await run([await withBundle(t, request, `${name}.json`)]));
    assert.equal(output.verdict, 'nao_mensuravel', name);
    assert.deepEqual(output.reasonCodes, [reason], name);
    assert.deepEqual(output.proposedLevers, [], name);
  }
});

test('gap reconciliado e critérios não atingidos são inconclusivos e nunca escolhem causa ou fonte', async (t) => {
  const request = bundle(900);
  request.sourceReconciliation.sources[1].value = '850';
  request.sourceReconciliation.comparisons[0] = {
    pair: ['platform', 'checkout'], comparable: true, reasonCodes: [], absoluteGap: '50',
    relativeGap: '0.055556', relativeGapExact: { numerator: '1', denominator: '18' },
  };
  request.sourceReconciliation.comparisons[2] = {
    pair: ['checkout', 'cash'], comparable: true, reasonCodes: [], absoluteGap: '50',
    relativeGap: '0.055556', relativeGapExact: { numerator: '1', denominator: '18' },
  };
  const output = parseSuccess(await run([await withBundle(t, request)]));
  assert.equal(output.verdict, 'inconclusivo');
  assert.deepEqual(output.reasonCodes, ['RECONCILIATION_CONFOUNDING_GAP']);
  assert.deepEqual(output.proposedLevers, []);
  assert.equal(JSON.stringify(output).includes('sourceOfTruth'), false);
  assert.equal(JSON.stringify(output).includes('winner'), false);
});

test('CPA, ROAS, spend e CTR mensuráveis usam somente proveniência W2.1 sem inventar reconciliação', async (t) => {
  const cases = [
    ['cpa', bundleForMetric('cpa', 40, {
      successOperator: 'lte', successThreshold: '50', reversalOperator: 'gte', reversalThreshold: '70',
    })],
    ['roas', bundleForMetric('roas', 3, {
      successOperator: 'gte', successThreshold: '2', reversalOperator: 'lte', reversalThreshold: '1.5',
    })],
    ['spend', bundleForMetric('spend', 1100)],
    ['ctr', bundleForMetric('ctr', 3, {
      successOperator: 'gte', successThreshold: '2.5', reversalOperator: 'lte', reversalThreshold: '1',
    })],
  ];
  for (const [metric, request] of cases) {
    const output = parseSuccess(await run([await withBundle(t, request, `${metric}-measurable.json`)]));
    assert.equal(output.verdict, 'sustentou', metric);
    assert.deepEqual(output.reasonCodes, ['SUCCESS_CRITERION_MET'], metric);
    assert.equal(output.evidence.historicalReading.metric, metric);
    assert.equal(output.evidence.sourceReconciliation, null);
    assert.deepEqual(output.proposedLevers, []);
    assert.equal(JSON.stringify(output).includes('porque'), false);
    assert.equal(JSON.stringify(output).includes('caus'), false);
  }
});

test('CPA, ROAS, spend e CTR não mensuráveis preservam reason code W2.1 e zero alavancas', async (t) => {
  for (const metric of ['cpa', 'roas', 'spend', 'ctr']) {
    const request = bundleForMetric(metric, 1100);
    request.historicalReading.series[0].samples.splice(1);
    request.historicalReading.entries.splice(1);
    request.historicalReading.series[0].bySeal.Real = [0];
    request.historicalReading.series[0].comparison = {
      status: 'insufficient_history', requiresHumanDecision: true,
      warningCodes: ['INSUFFICIENT_HISTORY'],
    };
    request.historicalReading.warnings = [{ code: 'INSUFFICIENT_HISTORY', metric }];
    const output = parseSuccess(await run([await withBundle(t, request, `${metric}-not-measurable.json`)]));
    assert.equal(output.verdict, 'nao_mensuravel', metric);
    assert.deepEqual(output.reasonCodes, ['INSUFFICIENT_DISTINCT_WEEKS'], metric);
    assert.equal(output.evidence.sourceReconciliation, null);
    assert.deepEqual(output.proposedLevers, [], metric);
  }
});

test('métrica financeira continua exigindo reconciliação válida e métrica não financeira a rejeita', async (t) => {
  const cases = [
    ['financial-absent', bundle(1100), (request) => { delete request.sourceReconciliation; }],
    ['financial-null', bundle(1100), (request) => { request.sourceReconciliation = null; }],
    ['financial-incompatible', bundle(1100), (request) => { request.sourceReconciliation.metric = 'orders'; }],
    ['non-financial-reconciliation', bundleForMetric('cpa', 40, {
      successOperator: 'lte', successThreshold: '50', reversalOperator: 'gte', reversalThreshold: '70',
    }), (request) => { request.sourceReconciliation = reconciliation('40'); }],
  ];
  for (const [name, request, mutate] of cases) {
    mutate(request);
    const result = await run([await withBundle(t, request, `${name}.json`)]);
    assert.equal(result.code, 1, name);
    assert.equal(result.stdout, '', name);
    assert.equal(result.stderr, 'INVALID_EVALUATION_REQUEST\n', name);
  }
});

test('decisão vazia, IDs repetidos, critérios sobrepostos e ordem forjada falham fechado', async (t) => {
  const cases = [
    ['missing-text', (request) => { delete request.previousDecision.hypothesis.text; }],
    ['duplicate-id', (request) => { request.previousDecision.lever.id = request.previousDecision.hypothesis.id; }],
    ['overlap', (request) => { request.previousDecision.reversalCriterion.threshold = '1200'; }],
    ['window-order', (request) => {
      request.previousDecision.measurementWindow.fromWeekStart = '2026-06-08';
      request.previousDecision.measurementWindow.toWeekStart = '2026-06-01';
    }],
    ['history-order', (request) => {
      request.historicalReading.series[0].samples.reverse();
      request.historicalReading.entries.reverse();
    }],
    ['history-duplicate', (request) => {
      request.historicalReading.series[0].samples[1] = structuredClone(request.historicalReading.series[0].samples[0]);
    }],
    ['metric-mismatch', (request) => { request.sourceReconciliation.metric = 'orders'; }],
    ['pending-decision', (request) => { request.previousDecision.humanDecision.status = 'pending'; }],
    ['project-pii', (request) => { request.historicalReading.selection.projectId = 'aluno@example.invalid'; }],
    ['campaign-secret', (request) => { request.historicalReading.selection.campaignId = 'campaign-token-super-secreto'; }],
    ['panel-pii', (request) => {
      request.historicalReading.series[0].samples[0].weeklyPanelId = 'weekly-panel:phone:11999998888';
      request.historicalReading.entries[0].weeklyPanelId = 'weekly-panel:phone:11999998888';
    }],
    ['source-secret', (request) => {
      request.historicalReading.series[0].samples[0].sourceRef.id = 'token-super-secreto';
      request.historicalReading.entries[0].metrics[0].sourceRef.id = 'token-super-secreto';
    }],
  ];
  for (const [name, mutate] of cases) {
    const request = bundle(1100);
    mutate(request);
    const result = await run([await withBundle(t, request, `${name}.json`)]);
    assert.equal(result.code, 1, name);
    assert.equal(result.stdout, '', name);
    assert.equal(result.stderr, 'INVALID_EVALUATION_REQUEST\n', name);
  }
});

test('JSON inseguro, arquivo ilegível, JSON inválido e uso incorreto não ecoam conteúdo', async (t) => {
  const file = await withBundle(t, bundle(1100));
  const original = await readFile(file, 'utf8');
  const unsafe = path.join(path.dirname(file), 'unsafe-token-super-secreto.json');
  await writeFile(unsafe, original.replace('"value": 1100', '"value": 9007199254740993'));
  const malformed = path.join(path.dirname(file), 'malformed-token-super-secreto.json');
  await writeFile(malformed, '{"token":"token-super-secreto"');
  const cases = [
    [[], 2, 'USAGE'],
    [[file, '--token', 'token-super-secreto'], 2, 'USAGE'],
    [['/missing/token-super-secreto.json'], 2, 'UNABLE_TO_READ'],
    [[malformed], 2, 'INVALID_JSON'],
    [[unsafe], 2, 'UNSAFE_JSON_NUMBER'],
  ];
  for (const [args, code, message] of cases) {
    const result = await run(args);
    assert.equal(result.code, code);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `${message}\n`);
    assert.equal(result.stderr.includes('token-super-secreto'), false);
  }
});

test('output passa schema fechado; entrada e mirrors permanecem byte a byte', async (t) => {
  const file = await withBundle(t, bundle(1100));
  const before = await readFile(file);
  const output = parseSuccess(await run([file]));
  assert.deepEqual(await readFile(file), before);

  const schema = JSON.parse(await readFile(SCHEMA, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(output), true, JSON.stringify(validate.errors));
  const trafficOutput = parseSuccess(await run([await withBundle(t, bundleForMetric('ctr', 3, {
    successOperator: 'gte', successThreshold: '2.5', reversalOperator: 'lte', reversalThreshold: '1',
  }), 'ctr-schema.json')]));
  assert.equal(validate(trafficOutput), true, JSON.stringify(validate.errors));
  const forged = structuredClone(output);
  forged.evidence.historicalReading.observationRefs[0].rawValue = 'token-super-secreto';
  assert.equal(validate(forged), false);
  const financialWithoutReconciliation = structuredClone(output);
  financialWithoutReconciliation.evidence.sourceReconciliation = null;
  assert.equal(validate(financialWithoutReconciliation), false);
  const trafficWithReconciliation = structuredClone(trafficOutput);
  trafficWithReconciliation.evidence.sourceReconciliation = output.evidence.sourceReconciliation;
  assert.equal(validate(trafficWithReconciliation), false);

  const canonical = await readFile(SKILL, 'utf8');
  assert.equal(canonical, await readFile(MIRROR, 'utf8'));
  assert.match(canonical, /diagnose-aula-04-decision\.mjs/);
  assert.match(canonical, /DecisionOutcomeDiagnosis/);
  assert.match(canonical, /não executa|nao executa/i);
});
