import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(new URL('./read-aula-04-history.mjs', import.meta.url));
const FIXTURES = fileURLToPath(new URL('../aula-04/fixtures/', import.meta.url));
const SKILL = new URL('../.claude/skills/leitor-de-metricas/SKILL.md', import.meta.url);
const MIRROR = new URL('../.agents/skills/leitor-de-metricas/SKILL.md', import.meta.url);

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

function parseOutput(result) {
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  assert.ok(result.stdout.endsWith('\n'));
  return JSON.parse(result.stdout);
}

const selection = [
  '--project-id', 'project-history',
  '--campaign-id', 'campaign-history',
];

test('leitura compatível é determinística, ordenada e não deriva números', async () => {
  const args = ['--ledger', fixture('history-compatible.ledger.json'), ...selection];
  const firstRun = await run(args);
  const secondRun = await run(args);
  assert.equal(firstRun.stdout, secondRun.stdout);
  const output = parseOutput(firstRun);

  assert.equal(output.contract, 'HistoricalMetricsReading');
  assert.equal(output.schemaVersion, '1.0.0');
  assert.deepEqual(output.selection, {
    projectId: 'project-history', campaignId: 'campaign-history', weekStart: null,
  });
  assert.deepEqual(output.source, {
    contract: 'WeeklyLedger', schemaVersion: '1.1.0', hashAlgorithm: 'sha256',
    projectionDigestVersion: '1.0.0', projectionDigestAlgorithm: 'sha256',
  });
  assert.deepEqual(output.series.map((series) => series.name), ['cpa', 'spend']);
  assert.deepEqual(output.series.map((series) => series.comparison), [
    { status: 'comparable', requiresHumanDecision: false, warningCodes: [] },
    { status: 'comparable', requiresHumanDecision: false, warningCodes: [] },
  ]);
  assert.deepEqual(output.series[0].samples.map((sample) => sample.value), [42, 39]);
  assert.equal(JSON.stringify(output).includes('delta'), false);
  assert.equal(JSON.stringify(output).includes('trend'), false);
  assert.equal(JSON.stringify(output).includes('average'), false);
  assert.equal(JSON.stringify(output).includes('derived'), false);
  assert.deepEqual(output.warnings, []);
});

test('preserva literalmente proveniência, revisão, hashes, selos e confirmações', async () => {
  const output = parseOutput(await run([
    '--ledger', fixture('history-compatible.ledger.json'), ...selection,
  ]));
  assert.deepEqual(output.entries[0], {
    weekStart: '2026-06-01',
    revision: 1,
    weeklyPanelId: 'weekly-panel:history:2026-06-01:r1',
    canonicalHash: '1111111111111111111111111111111111111111111111111111111111111111',
    projectionDigest: '69883a1a0de957c57f913682010231bb3e40fbfda644fab62006aba00a775040',
    metrics: [
      {
        name: 'cpa', value: 42, seal: 'Real',
        sourceRef: { kind: 'platform-export', id: 'week-1' },
        attributionWindow: '7d_click_1d_view', premiseRef: null,
        confirmedByHuman: true, cashConfirmed: false,
      },
      {
        name: 'spend', value: 210, seal: 'Real',
        sourceRef: { kind: 'platform-export', id: 'week-1' },
        attributionWindow: '7d_click_1d_view', premiseRef: null,
        confirmedByHuman: true, cashConfirmed: true,
      },
    ],
  });
});

test('janelas incompatíveis geram aviso e decisão humana sem delta ou tendência', async () => {
  const output = parseOutput(await run([
    '--ledger', fixture('history-incompatible.ledger.json'), ...selection,
  ]));
  assert.deepEqual(output.series[0].comparison, {
    status: 'incompatible_attribution_window',
    requiresHumanDecision: true,
    warningCodes: ['INCOMPATIBLE_ATTRIBUTION_WINDOW'],
  });
  assert.deepEqual(output.warnings, [{
    code: 'INCOMPATIBLE_ATTRIBUTION_WINDOW', metric: 'roas',
  }]);
  assert.deepEqual(output.series[0].samples.map((sample) => sample.attributionWindow), [
    '7d_click_1d_view', '1d_click',
  ]);
  assert.equal(Object.hasOwn(output.series[0].comparison, 'delta'), false);
});

test('ausência explícita e slot ausente permanecem null e nao_fornecido', async () => {
  const output = parseOutput(await run([
    '--ledger', fixture('history-missing.ledger.json'), ...selection,
  ]));
  const cpa = output.series.find((series) => series.name === 'cpa');
  const spend = output.series.find((series) => series.name === 'spend');
  assert.deepEqual(cpa.samples[0], {
    weekStart: '2026-06-01', revision: 1,
    weeklyPanelId: 'weekly-panel:history:2026-06-01:r1',
    canonicalHash: '5555555555555555555555555555555555555555555555555555555555555555',
    projectionDigest: '2811b736a33377f899af54bb5ff20be8f7d978c83a6447a71923cf59fc5dfd32',
    metricPresent: false, value: null, seal: 'nao_fornecido', sourceRef: null,
    attributionWindow: null, premiseRef: null, confirmedByHuman: false, cashConfirmed: false,
  });
  assert.equal(cpa.samples[1].metricPresent, true);
  assert.equal(cpa.samples[1].value, null);
  assert.equal(spend.samples[1].value, null);
  assert.deepEqual(cpa.comparison, {
    status: 'missing_or_unconfirmed', requiresHumanDecision: true,
    warningCodes: ['MISSING_OR_UNCONFIRMED'],
  });
});

test('filtro de uma semana usa o mesmo contrato e marca histórico insuficiente', async () => {
  const output = parseOutput(await run([
    '--ledger', fixture('history-compatible.ledger.json'), ...selection,
    '--week-start', '2026-06-01',
  ]));
  assert.equal(output.entries.length, 1);
  assert.equal(output.selection.weekStart, '2026-06-01');
  assert.deepEqual(output.series[0].comparison, {
    status: 'insufficient_history', requiresHumanDecision: true,
    warningCodes: ['INSUFFICIENT_HISTORY'],
  });
});

test('duas revisões da mesma semana continuam sendo histórico insuficiente', async () => {
  const output = parseOutput(await run([
    '--ledger', fixture('ledger-three-weeks.expected.json'),
    '--project-id', 'project-acme',
    '--campaign-id', 'campaign-acme-launch',
    '--week-start', '2026-07-13',
  ]));
  assert.equal(output.entries.length, 2);
  assert.deepEqual(output.entries.map(({ revision }) => revision), [1, 2]);
  assert.deepEqual(output.series[0].comparison, {
    status: 'insufficient_history', requiresHumanDecision: true,
    warningCodes: ['INSUFFICIENT_HISTORY'],
  });
});

test('CPA e ROAS só aparecem quando já existem literalmente no ledger', async () => {
  const compatible = parseOutput(await run([
    '--ledger', fixture('history-compatible.ledger.json'), ...selection,
  ]));
  assert.deepEqual(compatible.series.map((series) => series.name), ['cpa', 'spend']);

  const missing = parseOutput(await run([
    '--ledger', fixture('history-missing.ledger.json'), ...selection,
  ]));
  assert.deepEqual(missing.series.map((series) => series.name), ['cpa', 'spend']);
  assert.equal(missing.series.some((series) => series.name === 'roas'), false);
});

test('ledger, seleção e argumentos inválidos falham fechado sem ecoar valores', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-reader-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const malformed = path.join(directory, 'malformed.json');
  const forged = path.join(directory, 'forged.json');
  await writeFile(malformed, '{"secret":"token-super-secreto"');
  const valid = JSON.parse(await readFile(fixture('history-compatible.ledger.json'), 'utf8'));
  valid.index[0].revisions[0].entryIndex = 1;
  await writeFile(forged, JSON.stringify(valid));

  const cases = [
    [[], 'USAGE'],
    [['--ledger', malformed, ...selection], 'INVALID_JSON'],
    [['--ledger', forged, ...selection], 'INVALID_LEDGER_SEMANTICS'],
    [['--ledger', fixture('history-compatible.ledger.json'), '--project-id', 'missing-secret', '--campaign-id', 'campaign-history'], 'SELECTION_NOT_FOUND'],
    [['--ledger', fixture('history-compatible.ledger.json'), ...selection, '--unknown', 'token-super-secreto'], 'USAGE'],
  ];
  for (const [args, code] of cases) {
    const result = await run(args);
    assert.notEqual(result.code, 0);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, new RegExp(`^${code}\\n$`));
    assert.equal(result.stderr.includes('token-super-secreto'), false);
    assert.equal(result.stderr.includes('missing-secret'), false);
  }
});

test('digest verificável rejeita valor e sourceRef adulterados', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-integrity-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const original = JSON.parse(await readFile(fixture('history-compatible.ledger.json'), 'utf8'));

  for (const [name, mutate] of [
    ['value', (ledger) => { ledger.entries[0].metrics[0].value = 900; }],
    ['source', (ledger) => { ledger.entries[0].metrics[0].sourceRef.id = 'tampered'; }],
  ]) {
    const ledger = structuredClone(original);
    mutate(ledger);
    const file = path.join(directory, `${name}.json`);
    await writeFile(file, JSON.stringify(ledger));
    const result = await run(['--ledger', file, ...selection]);
    assert.equal(result.code, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, 'INVALID_LEDGER_SEMANTICS\n');
  }
});

test('ordem das chaves dos objetos do index não altera a leitura', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-index-order-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const originalFile = fixture('history-compatible.ledger.json');
  const ledger = JSON.parse(await readFile(originalFile, 'utf8'));
  ledger.index = ledger.index.map((entry) => ({
    revisions: entry.revisions,
    weekStart: entry.weekStart,
    campaignId: entry.campaignId,
    projectId: entry.projectId,
  }));
  const reorderedFile = path.join(directory, 'reordered-index.json');
  await writeFile(reorderedFile, `${JSON.stringify(ledger, null, 2)}\n`);

  const original = await run(['--ledger', originalFile, ...selection]);
  const reordered = await run(['--ledger', reorderedFile, ...selection]);
  assert.equal(original.code, 0, original.stderr || original.stdout);
  assert.equal(reordered.code, 0, reordered.stderr || reordered.stdout);
  assert.equal(reordered.stdout, original.stdout);
});

test('lexemas numéricos inseguros falham antes de JSON.parse e nunca são arredondados', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-numeric-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const original = await readFile(fixture('history-compatible.ledger.json'), 'utf8');
  const cases = [
    ['unsafe-integer.json', '"value": 210', '"value": 9007199254740993'],
    ['unsafe-decimal.json', '"value": 210', '"value": 0.12345678901234567'],
    ['overflow.json', '"value": 210', '"value": 1e309'],
  ];
  for (const [name, from, to] of cases) {
    assert.ok(original.includes(from));
    const file = path.join(directory, name);
    await writeFile(file, original.replace(from, to));
    const result = await run(['--ledger', file, ...selection]);
    assert.equal(result.code, 2);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, 'UNSAFE_JSON_NUMBER\n');
  }
});

test('entrada e skill mirrors permanecem byte a byte e o modo histórico é explícito', async () => {
  const file = fixture('history-compatible.ledger.json');
  const before = await readFile(file);
  await run(['--ledger', file, ...selection]);
  assert.deepEqual(await readFile(file), before);

  const canonical = await readFile(SKILL, 'utf8');
  assert.equal(canonical, await readFile(MIRROR, 'utf8'));
  assert.match(canonical, /read-aula-04-history\.mjs/);
  assert.match(canonical, /WeeklyLedger v1/);
  assert.match(canonical, /não deriva|nao deriva/i);
});
