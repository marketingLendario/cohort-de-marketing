import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdtemp, readFile, readdir, rm, stat, writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readHistoricalMetrics } from './read-aula-04-history.mjs';
import { runAula04Walkthrough } from './run-aula-04-walkthrough.mjs';
import { validateAula04Contract } from './validate-aula-04-contracts.mjs';

const execFileAsync = promisify(execFile);
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const EXAMPLE = path.join(ROOT, 'aula-04/exemplos/projeto-tres-semanas');
const PANELS = path.join(EXAMPLE, 'weekly-panels.jsonl');
const BUILD_LEDGER = path.join(ROOT, 'scripts/build-weekly-ledger.mjs');
const VALIDATE_CONTRACT = path.join(ROOT, 'scripts/validate-aula-04-contracts.mjs');
const VALIDATE_CATALOG = path.join(ROOT, 'scripts/validate-skill-catalog.mjs');
const EXPECTED_ARTIFACTS = [
  'decision-outcome-diagnosis.json',
  'decision-outcome-request.json',
  'historical-reading.json',
  'source-reconciliation.json',
  'walkthrough-summary.json',
  'weekly-ledger.json',
];
const SENSITIVE_PATTERNS = [
  /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/i,
  /\bbearer\s+[a-z0-9._~+/=-]+/i,
  /(?:api[-_]?key|access[-_]?token|refresh[-_]?token|password|secret)\s*[:=]\s*["']?[^\s"']+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(?:^|[\s"'`])\/Users\//m,
  /(?:^|[\s"'`])[A-Z]:\\/im,
  /(?<![a-z0-9])(?:\d{10,11}|\d{13,14})(?![a-z0-9])/i,
  /(?<![a-z0-9])\d{3}\.\d{3}\.\d{3}-\d{2}(?![a-z0-9])/i,
  /(?<![a-z0-9])\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}(?![a-z0-9])/i,
];

async function run(command, args) {
  try {
    const result = await execFileAsync(command, args, {
      cwd: ROOT,
      encoding: 'utf8',
      env: { PATH: process.env.PATH },
    });
    return { ...result, code: 0 };
  } catch (error) {
    return { stdout: error.stdout ?? '', stderr: error.stderr ?? '', code: error.code };
  }
}

async function runNode(script, args = []) {
  return run(process.execPath, [script, ...args]);
}

async function temporaryDirectory(t, prefix) {
  const directory = await mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function firstPanel() {
  const firstLine = (await readFile(PANELS, 'utf8')).trimEnd().split('\n')[0];
  return JSON.parse(firstLine);
}

async function writePanels(directory, name, panels) {
  const file = path.join(directory, name);
  await writeFile(file, `${panels.map(JSON.stringify).join('\n')}\n`);
  return file;
}

async function buildLedger(t, panels, prefix = 'aula-04-release-ledger-') {
  const directory = await temporaryDirectory(t, prefix);
  const input = await writePanels(directory, 'weekly-panels.jsonl', panels);
  const ledgerFile = path.join(directory, 'weekly-ledger.json');
  const result = await runNode(BUILD_LEDGER, [input, ledgerFile]);
  return {
    directory,
    input,
    ledger: result.code === 0 ? await readJson(ledgerFile) : null,
    ledgerFile,
    result,
  };
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function collectFiles(target) {
  if ((await stat(target)).isFile()) return [target];
  const entries = (await readdir(target, { withFileTypes: true }))
    .sort((left, right) => left.name.localeCompare(right.name, 'en'));
  const files = [];
  for (const entry of entries) {
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

function assertSanitized(content, label) {
  for (const pattern of SENSITIVE_PATTERNS) assert.doesNotMatch(content, pattern, label);
}

test('primeira semana pública preserva o handoff da Aula 3 no WeeklyLedger', async (t) => {
  const panel = await firstPanel();
  const validation = await validateAula04Contract(panel, 'aula-03-handoff-week');
  assert.equal(validation.valid, true, JSON.stringify(validation.errors));
  assert.deepEqual(panel.decision, { status: 'pending' });
  assert.deepEqual(panel.metrics[0], {
    name: 'revenue',
    value: 900,
    seal: 'Real',
    source: 'ref:platform-export:week-a1b2c3d4',
    attributionWindow: 'calendar_week',
    premise: null,
    confirmedByHuman: true,
    cashConfirmed: true,
  });

  const built = await buildLedger(t, [panel]);
  assert.equal(built.result.code, 0, built.result.stderr || built.result.stdout);
  assert.equal(built.ledger.entries.length, 1);
  assert.deepEqual(built.ledger.entries[0].metrics[0], {
    name: 'revenue',
    value: 900,
    seal: 'Real',
    sourceRef: { kind: 'platform-export', id: 'week-a1b2c3d4' },
    attributionWindow: 'calendar_week',
    premiseRef: null,
    confirmedByHuman: true,
    cashConfirmed: true,
  });

  const reading = await readHistoricalMetrics(built.ledger, {
    projectId: panel.projectId,
    campaignId: panel.campaignId,
    weekStart: null,
  });
  assert.deepEqual(reading.series[0].comparison, {
    status: 'insufficient_history',
    requiresHumanDecision: true,
    warningCodes: ['INSUFFICIENT_HISTORY'],
  });
});

test('fonte, janela, ausência e confirmador nunca viram histórico comparável por inferência', async (t) => {
  const base = await firstPanel();
  const second = structuredClone(base);
  second.id = 'weekly-panel:aula04:2026-06-08:release-gate';
  second.weekStart = '2026-06-08';
  second.metrics[0] = {
    name: 'revenue',
    value: null,
    seal: 'nao_fornecido',
    source: 'ref:operator-declaration:not-provided',
    attributionWindow: null,
    premise: null,
    confirmedByHuman: false,
    cashConfirmed: false,
  };
  const absent = await buildLedger(t, [base, second], 'aula-04-release-absence-');
  assert.equal(absent.result.code, 0, absent.result.stderr || absent.result.stdout);
  assert.deepEqual(absent.ledger.entries[1].metrics[0], {
    name: 'revenue',
    value: null,
    seal: 'nao_fornecido',
    sourceRef: { kind: 'operator-declaration', id: 'not-provided' },
    attributionWindow: null,
    premiseRef: null,
    confirmedByHuman: false,
    cashConfirmed: false,
  });
  const absentReading = await readHistoricalMetrics(absent.ledger, {
    projectId: base.projectId,
    campaignId: base.campaignId,
    weekStart: null,
  });
  assert.deepEqual(absentReading.series[0].comparison, {
    status: 'missing_or_unconfirmed',
    requiresHumanDecision: true,
    warningCodes: ['MISSING_OR_UNCONFIRMED'],
  });

  const incompatible = structuredClone(second);
  incompatible.metrics[0] = {
    ...base.metrics[0],
    source: 'ref:platform-export:week-b2c3d4e5',
    attributionWindow: null,
  };
  const noWindow = await buildLedger(t, [base, incompatible], 'aula-04-release-window-');
  assert.equal(noWindow.result.code, 0, noWindow.result.stderr || noWindow.result.stdout);
  const windowReading = await readHistoricalMetrics(noWindow.ledger, {
    projectId: base.projectId,
    campaignId: base.campaignId,
    weekStart: null,
  });
  assert.deepEqual(windowReading.series[0].comparison, {
    status: 'incompatible_attribution_window',
    requiresHumanDecision: true,
    warningCodes: ['INCOMPATIBLE_ATTRIBUTION_WINDOW'],
  });

  const untraceable = structuredClone(second);
  untraceable.metrics[0].source = 'declaracao livre sem referencia';
  const rejected = await buildLedger(t, [untraceable], 'aula-04-release-source-');
  assert.equal(rejected.result.code, 1);
  assert.equal(rejected.result.stderr, '');
  assert.equal(JSON.parse(rejected.result.stdout).code, 'INVALID_METRIC_PROVENANCE_REFERENCE');
  assert.deepEqual((await readdir(rejected.directory)).sort(), ['weekly-panels.jsonl']);
});

test('walkthrough preserva decisão histórica approved e produz nova decisão pending', async (t) => {
  const output = await temporaryDirectory(t, 'aula-04-release-output-');
  const before = await Promise.all((await collectFiles(EXAMPLE)).map(async (file) => [file, await sha256(file)]));
  const summary = await runAula04Walkthrough(EXAMPLE, output);
  assert.deepEqual((await readdir(output)).sort(), EXPECTED_ARTIFACTS);
  assert.equal(summary.valid, true);
  assert.equal(summary.distinctWeeks, 3);
  assert.equal(summary.verdict, 'inconclusivo');
  assert.equal(summary.proposedLeverCount, 0);
  assert.equal(summary.humanDecisionStatus, 'pending');

  const [request, diagnosis] = await Promise.all([
    readJson(path.join(output, 'decision-outcome-request.json')),
    readJson(path.join(output, 'decision-outcome-diagnosis.json')),
  ]);
  assert.equal(request.previousDecision.humanDecision.status, 'approved');
  assert.equal(diagnosis.humanDecision.status, 'pending');
  assert.equal(diagnosis.guards.mutationAllowed, false);
  assert.equal(diagnosis.guards.historicalDecisionImmutable, true);
  assert.deepEqual(diagnosis.proposedLevers, []);
  assert.deepEqual(await Promise.all(before.map(async ([file]) => [file, await sha256(file)])), before);

  for (const artifact of EXPECTED_ARTIFACTS) {
    assertSanitized(await readFile(path.join(output, artifact), 'utf8'), artifact);
  }
});

test('validators, catálogo, mirrors e distribuição pública passam sem mutar fontes', async (t) => {
  const contractInputs = [
    path.join(ROOT, 'data/contracts/fixtures/aula-04/campaign-plan.valid.json'),
    path.join(ROOT, 'data/contracts/fixtures/aula-04/weekly-panel.metric-not-provided.valid.json'),
  ];
  const protectedFiles = [
    VALIDATE_CONTRACT,
    VALIDATE_CATALOG,
    ...contractInputs,
    path.join(ROOT, 'data/skill-catalog.json'),
    path.join(ROOT, 'data/skill-unlock-rules.json'),
  ];
  const before = await Promise.all(protectedFiles.map(async (file) => [file, await sha256(file)]));
  for (const input of contractInputs) {
    const result = await runNode(VALIDATE_CONTRACT, [input]);
    assert.equal(result.code, 0, result.stderr || result.stdout);
    assert.equal(JSON.parse(result.stdout).valid, true);
  }
  const catalog = await runNode(VALIDATE_CATALOG);
  assert.equal(catalog.code, 0, catalog.stderr || catalog.stdout);
  assert.match(catalog.stdout, /^Skill catalog OK:/);
  assert.deepEqual(await Promise.all(before.map(async ([file]) => [file, await sha256(file)])), before);

  const releaseTargets = [
    path.join(ROOT, 'README.md'),
    path.join(ROOT, 'aula-03/docs/conexao-aula-04.md'),
    path.join(ROOT, 'aula-04/README.md'),
    path.join(ROOT, 'aula-04/GUIA-DO-ALUNO.html'),
    path.join(ROOT, 'aula-04/templates'),
    EXAMPLE,
    path.join(ROOT, 'docs/releases/aula-04-data-loop-v1.md'),
    path.join(ROOT, 'docs/stories/epic-17/evidence/STORY-17.W3.2.md'),
  ];
  const releaseFiles = (await Promise.all(releaseTargets.map(collectFiles))).flat();
  for (const file of releaseFiles) assertSanitized(await readFile(file, 'utf8'), path.relative(ROOT, file));
  const guide = await readFile(path.join(ROOT, 'aula-04/GUIA-DO-ALUNO.html'), 'utf8');
  assert.doesNotMatch(guide, /(?:src|href)=["']https?:/i);

  const trackedPrivate = await run('git', ['ls-files', '-z', '--', 'projetos', '.env', 'node_modules']);
  assert.equal(trackedPrivate.code, 0, trackedPrivate.stderr);
  assert.equal(trackedPrivate.stdout, '');

  const scratch = await temporaryDirectory(t, 'aula-04-release-validator-');
  assert.deepEqual(await readdir(scratch), []);
});
