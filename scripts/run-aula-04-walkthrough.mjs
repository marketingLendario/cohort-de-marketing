import { isDeepStrictEqual } from 'node:util';
import {
  lstat, readFile, readdir, realpath, stat, writeFile,
} from 'node:fs/promises';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildWeeklyLedger, jsonHasUnsafeNumber,
} from './build-weekly-ledger.mjs';
import { diagnoseDecisionOutcome } from './diagnose-aula-04-decision.mjs';
import { readHistoricalMetrics } from './read-aula-04-history.mjs';
import { reconcileSourceObservations } from './reconcile-aula-04-sources.mjs';
import { validateAula04Contract } from './validate-aula-04-contracts.mjs';

const INPUT_FILES = Object.freeze([
  'weekly-panels.jsonl',
  'source-observations.json',
  'previous-decision.json',
  'expected-walkthrough.json',
]);
const ARTIFACTS = Object.freeze([
  'decision-outcome-diagnosis.json',
  'decision-outcome-request.json',
  'historical-reading.json',
  'source-reconciliation.json',
  'walkthrough-summary.json',
  'weekly-ledger.json',
]);
const SENSITIVE_TEXT_PATTERNS = Object.freeze([
  /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/i,
  /\bbearer\s+[a-z0-9._~+/=-]+/i,
  /\b(?:token|password|secret|api[-_]?key)\b/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(?:^|\s)\/Users\//,
  /(?:^|\s)[A-Z]:\\/i,
]);
const PERSONAL_IDENTIFIER_PATTERNS = Object.freeze([
  /(?<![a-z0-9])(?:\d{10,11}|\d{13,14})(?![a-z0-9])/i,
  /(?<![a-z0-9])\d{3}\.\d{3}\.\d{3}-\d{2}(?![a-z0-9])/i,
  /(?<![a-z0-9])\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}(?![a-z0-9])/i,
  /(?<![a-z0-9])\(?\d{2}\)?[ .-]\d{4,5}[ .-]\d{4}(?![a-z0-9])/i,
]);
const NUMERIC_MEASUREMENT_KEYS = new Set([
  'absolutegap', 'denominator', 'numerator', 'relativegap', 'threshold', 'value',
]);
const EMPTY_LEDGER = Object.freeze({
  contract: 'WeeklyLedger',
  schemaVersion: '1.1.0',
  hashAlgorithm: 'sha256',
  projectionDigestVersion: '1.0.0',
  projectionDigestAlgorithm: 'sha256',
  entries: Object.freeze([]),
  index: Object.freeze([]),
});

function errorWithCode(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function containsSensitiveText(value, parentKey = '') {
  if (typeof value === 'string') {
    return SENSITIVE_TEXT_PATTERNS.some((pattern) => pattern.test(value))
      || (!NUMERIC_MEASUREMENT_KEYS.has(parentKey.toLowerCase())
        && PERSONAL_IDENTIFIER_PATTERNS.some((pattern) => pattern.test(value)));
  }
  if (Array.isArray(value)) return value.some((item) => containsSensitiveText(item, parentKey));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, item]) => (
    containsSensitiveText(key, 'key') || containsSensitiveText(item, key)
  ));
}

function isSameOrDescendant(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === ''
    || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function realpathAllowingMissingLeaf(target) {
  let cursor = resolve(target);
  const missingSegments = [];
  while (true) {
    try {
      return path.join(await realpath(cursor), ...missingSegments.reverse());
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) throw error;
      missingSegments.push(path.basename(cursor));
      cursor = parent;
    }
  }
}

async function readSafeJson(file, code) {
  let content;
  try {
    content = await readFile(file, 'utf8');
  } catch {
    throw errorWithCode(code);
  }
  if (jsonHasUnsafeNumber(content)) throw errorWithCode(code);
  try {
    return JSON.parse(content);
  } catch {
    throw errorWithCode(code);
  }
}

async function parsePanels(file) {
  let content;
  try {
    content = await readFile(file, 'utf8');
  } catch {
    throw errorWithCode('INVALID_EXAMPLE');
  }
  const lines = content.endsWith('\n') ? content.slice(0, -1).split('\n') : content.split('\n');
  if (lines.length !== 3 || lines.some((line) => line.length === 0 || jsonHasUnsafeNumber(line))) {
    throw errorWithCode('INVALID_WEEKLY_PANEL');
  }
  const panels = [];
  for (let index = 0; index < lines.length; index += 1) {
    let panel;
    try {
      panel = JSON.parse(lines[index]);
    } catch {
      throw errorWithCode('INVALID_WEEKLY_PANEL');
    }
    const validation = await validateAula04Contract(panel, `week-${index + 1}`);
    if (panel.contract !== 'WeeklyPanel' || !validation.valid || containsSensitiveText(panel)) {
      throw errorWithCode('INVALID_WEEKLY_PANEL');
    }
    panels.push({ panel, line: index + 1 });
  }
  const documents = panels.map(({ panel }) => panel);
  if (new Set(documents.map((panel) => panel.weekStart)).size !== 3
    || new Set(documents.map((panel) => panel.projectId)).size !== 1
    || new Set(documents.map((panel) => panel.campaignId)).size !== 1) {
    throw errorWithCode('INVALID_WEEKLY_PANEL');
  }
  return panels;
}

async function ensureInputAndOutput(exampleDirectory, outputDirectory) {
  let canonicalExample;
  try {
    if (!(await stat(exampleDirectory)).isDirectory()) throw new Error('not-directory');
    for (const file of INPUT_FILES) {
      if (!(await stat(path.join(exampleDirectory, file))).isFile()) throw new Error('not-file');
    }
    canonicalExample = await realpath(exampleDirectory);
  } catch {
    throw errorWithCode('INVALID_EXAMPLE');
  }

  try {
    const lexicalExample = resolve(exampleDirectory);
    const lexicalOutput = resolve(outputDirectory);
    const canonicalOutput = await realpathAllowingMissingLeaf(outputDirectory);
    if (isSameOrDescendant(lexicalExample, lexicalOutput)
      || isSameOrDescendant(canonicalExample, canonicalOutput)) {
      throw errorWithCode('INVALID_OUTPUT');
    }
  } catch (error) {
    if (error.code === 'INVALID_OUTPUT') throw error;
    throw errorWithCode('INVALID_OUTPUT');
  }

  try {
    if (!(await stat(outputDirectory)).isDirectory()) throw new Error('not-directory');
    if ((await lstat(outputDirectory)).isSymbolicLink()) throw new Error('symlink-directory');
    if ((await readdir(outputDirectory)).length !== 0) throw errorWithCode('OUTPUT_NOT_EMPTY');
  } catch (error) {
    if (error.code === 'OUTPUT_NOT_EMPTY') throw error;
    throw errorWithCode('INVALID_OUTPUT');
  }
}

function prettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function runAula04Walkthrough(exampleDirectory, outputDirectory) {
  await ensureInputAndOutput(exampleDirectory, outputDirectory);
  const [panels, observations, previousDecision, expected] = await Promise.all([
    parsePanels(path.join(exampleDirectory, 'weekly-panels.jsonl')),
    readSafeJson(path.join(exampleDirectory, 'source-observations.json'), 'INVALID_SOURCE_OBSERVATIONS'),
    readSafeJson(path.join(exampleDirectory, 'previous-decision.json'), 'INVALID_PREVIOUS_DECISION'),
    readSafeJson(path.join(exampleDirectory, 'expected-walkthrough.json'), 'INVALID_EXPECTATION'),
  ]);
  if (containsSensitiveText(observations)) throw errorWithCode('INVALID_SOURCE_OBSERVATIONS');
  if (containsSensitiveText(previousDecision)) throw errorWithCode('INVALID_PREVIOUS_DECISION');
  if (containsSensitiveText(expected)) throw errorWithCode('INVALID_EXPECTATION');

  const result = await buildWeeklyLedger(panels, EMPTY_LEDGER);
  if (result.conflict || result.added !== 3 || result.ledger.entries.length !== 3) {
    throw errorWithCode('INVALID_GENERATED_LEDGER');
  }
  const first = panels[0].panel;
  const historicalReading = await readHistoricalMetrics(result.ledger, {
    projectId: first.projectId,
    campaignId: first.campaignId,
    weekStart: null,
  });
  const sourceReconciliation = await reconcileSourceObservations(observations);
  if (!sourceReconciliation) throw errorWithCode('INVALID_SOURCE_OBSERVATIONS');
  const request = {
    contract: 'DecisionOutcomeEvaluationRequest',
    schemaVersion: '1.0.0',
    previousDecision,
    historicalReading,
    sourceReconciliation,
  };
  const diagnosis = await diagnoseDecisionOutcome(request);
  if (!diagnosis) throw errorWithCode('INVALID_PREVIOUS_DECISION');
  if (diagnosis.verdict !== 'inconclusivo'
    || !isDeepStrictEqual(diagnosis.reasonCodes, ['RECONCILIATION_CONFOUNDING_GAP'])
    || diagnosis.proposedLevers.length !== 0
    || diagnosis.humanDecision.status !== 'pending'
    || diagnosis.guards.mutationAllowed !== false
    || diagnosis.guards.historicalDecisionImmutable !== true) {
    throw errorWithCode('UNEXPECTED_WALKTHROUGH_RESULT');
  }
  const summary = {
    valid: true,
    code: 'WALKTHROUGH_COMPLETE',
    projectId: first.projectId,
    campaignId: first.campaignId,
    distinctWeeks: new Set(result.ledger.entries.map((entry) => entry.weekStart)).size,
    artifacts: [...ARTIFACTS],
    verdict: diagnosis.verdict,
    reasonCode: diagnosis.reasonCodes[0],
    proposedLeverCount: diagnosis.proposedLevers.length,
    humanDecisionStatus: diagnosis.humanDecision.status,
  };
  if (!isDeepStrictEqual(summary, expected)) throw errorWithCode('UNEXPECTED_WALKTHROUGH_RESULT');

  const outputs = new Map([
    ['weekly-ledger.json', result.ledger],
    ['historical-reading.json', historicalReading],
    ['source-reconciliation.json', sourceReconciliation],
    ['decision-outcome-request.json', request],
    ['decision-outcome-diagnosis.json', diagnosis],
    ['walkthrough-summary.json', summary],
  ]);
  if (containsSensitiveText([...outputs.values()])) {
    throw errorWithCode('UNSAFE_WALKTHROUGH_OUTPUT');
  }
  for (const artifact of ARTIFACTS) {
    await writeFile(path.join(outputDirectory, artifact), prettyJson(outputs.get(artifact)), { flag: 'wx' });
  }
  return summary;
}

async function main(args) {
  if (args.length !== 2) {
    process.stderr.write('USAGE\n');
    return 2;
  }
  try {
    const summary = await runAula04Walkthrough(args[0], args[1]);
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    return 0;
  } catch (error) {
    const inputCodes = new Set([
      'INVALID_EXAMPLE', 'INVALID_OUTPUT', 'OUTPUT_NOT_EMPTY', 'INVALID_WEEKLY_PANEL',
      'INVALID_SOURCE_OBSERVATIONS', 'INVALID_PREVIOUS_DECISION', 'INVALID_EXPECTATION',
      'INVALID_GENERATED_LEDGER', 'UNEXPECTED_WALKTHROUGH_RESULT',
      'UNSAFE_WALKTHROUGH_OUTPUT',
    ]);
    const code = inputCodes.has(error.code) ? error.code : 'WALKTHROUGH_ERROR';
    process.stderr.write(`${code}\n`);
    return code === 'INVALID_EXAMPLE' || code === 'INVALID_OUTPUT' || code === 'OUTPUT_NOT_EMPTY' ? 2 : 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = await main(process.argv.slice(2));
}
