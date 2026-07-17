import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalSerialize, jsonHasUnsafeNumber, projectionDigestForEntry,
} from './build-weekly-ledger.mjs';

const READING_VERSION = '1.0.0';
const LEDGER_VERSION = '1.1.0';
const PROJECTION_DIGEST_VERSION = '1.0.0';
const PROJECTION_DIGEST_ALGORITHM = 'sha256';
const LEDGER_SCHEMA_URL = new URL('../data/contracts/weekly-ledger.v1.schema.json', import.meta.url);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_ARGUMENTS = new Set(['--ledger', '--project-id', '--campaign-id', '--week-start']);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareEntries(left, right) {
  return compareText(left.projectId, right.projectId)
    || compareText(left.campaignId, right.campaignId)
    || compareText(left.weekStart, right.weekStart)
    || left.revision - right.revision;
}

function identityKey(entry) {
  return JSON.stringify([entry.projectId, entry.campaignId, entry.weekStart, entry.revision]);
}

function parseArguments(args) {
  if (args.length === 0 || args.length % 2 !== 0) return null;
  const parsed = {};
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!ALLOWED_ARGUMENTS.has(name) || Object.hasOwn(parsed, name)) return null;
    if (typeof value !== 'string' || value.length === 0 || value.startsWith('--')) return null;
    parsed[name] = value;
  }
  if (!parsed['--ledger'] || !parsed['--project-id'] || !parsed['--campaign-id']) return null;
  if (parsed['--week-start'] && !DATE_PATTERN.test(parsed['--week-start'])) return null;
  return {
    ledgerPath: parsed['--ledger'],
    projectId: parsed['--project-id'],
    campaignId: parsed['--campaign-id'],
    weekStart: parsed['--week-start'] ?? null,
  };
}

async function createLedgerValidator() {
  const schema = JSON.parse(await readFile(LEDGER_SCHEMA_URL, 'utf8'));
  const ajv = new Ajv2020({
    allErrors: true,
    coerceTypes: false,
    removeAdditional: false,
    strict: true,
    useDefaults: false,
    validateFormats: true,
  });
  addFormats(ajv);
  return ajv.compile(schema);
}

function expectedIndex(entries) {
  const groups = [];
  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const entry = entries[entryIndex];
    const previous = groups.at(-1);
    if (
      !previous
      || previous.projectId !== entry.projectId
      || previous.campaignId !== entry.campaignId
      || previous.weekStart !== entry.weekStart
    ) {
      groups.push({
        projectId: entry.projectId,
        campaignId: entry.campaignId,
        weekStart: entry.weekStart,
        revisions: [],
      });
    }
    groups.at(-1).revisions.push({ revision: entry.revision, entryIndex });
  }
  return groups;
}

function ledgerSemanticsAreValid(ledger) {
  if (
    ledger.contract !== 'WeeklyLedger'
    || ledger.schemaVersion !== LEDGER_VERSION
    || ledger.hashAlgorithm !== 'sha256'
    || ledger.projectionDigestVersion !== PROJECTION_DIGEST_VERSION
    || ledger.projectionDigestAlgorithm !== PROJECTION_DIGEST_ALGORITHM
  ) return false;

  const identities = new Set();
  for (let index = 0; index < ledger.entries.length; index += 1) {
    const entry = ledger.entries[index];
    if (index > 0 && compareEntries(ledger.entries[index - 1], entry) >= 0) return false;
    const identity = identityKey(entry);
    if (identities.has(identity)) return false;
    identities.add(identity);
    if (projectionDigestForEntry(entry) !== entry.projectionDigest) return false;
    const metricNames = new Set();
    for (const metric of entry.metrics) {
      if (metricNames.has(metric.name)) return false;
      metricNames.add(metric.name);
    }
  }
  return canonicalSerialize(ledger.index) === canonicalSerialize(expectedIndex(ledger.entries));
}

function projectMetric(metric) {
  return {
    name: metric.name,
    value: metric.value,
    seal: metric.seal,
    sourceRef: { kind: metric.sourceRef.kind, id: metric.sourceRef.id },
    attributionWindow: metric.attributionWindow,
    premiseRef: metric.premiseRef === null
      ? null
      : { kind: metric.premiseRef.kind, id: metric.premiseRef.id },
    confirmedByHuman: metric.confirmedByHuman,
    cashConfirmed: metric.cashConfirmed,
  };
}

function projectEntry(entry) {
  return {
    weekStart: entry.weekStart,
    revision: entry.revision,
    weeklyPanelId: entry.weeklyPanelId,
    canonicalHash: entry.canonicalHash,
    projectionDigest: entry.projectionDigest,
    metrics: [...entry.metrics]
      .sort((left, right) => compareText(left.name, right.name))
      .map(projectMetric),
  };
}

function sampleFor(entry, metricName) {
  const metric = entry.metrics.find((candidate) => candidate.name === metricName);
  const identity = {
    weekStart: entry.weekStart,
    revision: entry.revision,
    weeklyPanelId: entry.weeklyPanelId,
    canonicalHash: entry.canonicalHash,
    projectionDigest: entry.projectionDigest,
  };
  if (!metric) {
    return {
      ...identity,
      metricPresent: false,
      value: null,
      seal: 'nao_fornecido',
      sourceRef: null,
      attributionWindow: null,
      premiseRef: null,
      confirmedByHuman: false,
      cashConfirmed: false,
    };
  }
  const projected = projectMetric(metric);
  return { ...identity, metricPresent: true, ...projected, name: undefined };
}

function cleanSample(sample) {
  const { name: _name, ...cleaned } = sample;
  return cleaned;
}

function classifySamples(samples) {
  if (new Set(samples.map((sample) => sample.weekStart)).size < 2) {
    return {
      status: 'insufficient_history',
      requiresHumanDecision: true,
      warningCodes: ['INSUFFICIENT_HISTORY'],
    };
  }
  if (samples.some((sample) => (
    !sample.metricPresent
    || sample.value === null
    || !sample.confirmedByHuman
    || sample.seal === 'nao_fornecido'
  ))) {
    return {
      status: 'missing_or_unconfirmed',
      requiresHumanDecision: true,
      warningCodes: ['MISSING_OR_UNCONFIRMED'],
    };
  }
  const windows = new Set(samples.map((sample) => sample.attributionWindow));
  if (windows.has(null) || windows.size !== 1) {
    return {
      status: 'incompatible_attribution_window',
      requiresHumanDecision: true,
      warningCodes: ['INCOMPATIBLE_ATTRIBUTION_WINDOW'],
    };
  }
  return { status: 'comparable', requiresHumanDecision: false, warningCodes: [] };
}

function buildSeries(entries) {
  const metricNames = [...new Set(entries.flatMap((entry) => entry.metrics.map((metric) => metric.name)))]
    .sort(compareText);
  return metricNames.map((name) => {
    const samples = entries.map((entry) => cleanSample(sampleFor(entry, name)));
    return {
      name,
      samples,
      bySeal: {
        Real: samples.map((sample, index) => sample.seal === 'Real' ? index : null).filter((index) => index !== null),
        Estimado: samples.map((sample, index) => sample.seal === 'Estimado' ? index : null).filter((index) => index !== null),
        nao_fornecido: samples.map((sample, index) => sample.seal === 'nao_fornecido' ? index : null).filter((index) => index !== null),
      },
      comparison: classifySamples(samples),
    };
  });
}

export async function readHistoricalMetrics(ledger, selection) {
  const validateLedger = await createLedgerValidator();
  if (!validateLedger(ledger)) {
    const error = new Error('INVALID_LEDGER_SCHEMA');
    error.code = 'INVALID_LEDGER_SCHEMA';
    throw error;
  }
  if (!ledgerSemanticsAreValid(ledger)) {
    const error = new Error('INVALID_LEDGER_SEMANTICS');
    error.code = 'INVALID_LEDGER_SEMANTICS';
    throw error;
  }

  const entries = ledger.entries.filter((entry) => (
    entry.projectId === selection.projectId
    && entry.campaignId === selection.campaignId
    && (selection.weekStart === null || entry.weekStart === selection.weekStart)
  ));
  if (entries.length === 0) {
    const error = new Error('SELECTION_NOT_FOUND');
    error.code = 'SELECTION_NOT_FOUND';
    throw error;
  }

  const series = buildSeries(entries);
  return {
    contract: 'HistoricalMetricsReading',
    schemaVersion: READING_VERSION,
    selection: {
      projectId: selection.projectId,
      campaignId: selection.campaignId,
      weekStart: selection.weekStart,
    },
    source: {
      contract: ledger.contract,
      schemaVersion: ledger.schemaVersion,
      hashAlgorithm: ledger.hashAlgorithm,
      projectionDigestVersion: ledger.projectionDigestVersion,
      projectionDigestAlgorithm: ledger.projectionDigestAlgorithm,
    },
    entries: entries.map(projectEntry),
    series,
    warnings: series.flatMap((metricSeries) => metricSeries.comparison.warningCodes.map((code) => ({
      code,
      metric: metricSeries.name,
    }))),
  };
}

async function main(args) {
  const selection = parseArguments(args);
  if (!selection) {
    process.stderr.write('USAGE\n');
    return 2;
  }

  let content;
  try {
    content = await readFile(selection.ledgerPath, 'utf8');
  } catch {
    process.stderr.write('UNREADABLE_LEDGER\n');
    return 2;
  }

  if (jsonHasUnsafeNumber(content)) {
    process.stderr.write('UNSAFE_JSON_NUMBER\n');
    return 2;
  }

  let ledger;
  try {
    ledger = JSON.parse(content);
  } catch {
    process.stderr.write('INVALID_JSON\n');
    return 2;
  }

  try {
    const output = await readHistoricalMetrics(ledger, selection);
    process.stdout.write(`${JSON.stringify(output)}\n`);
    return 0;
  } catch (error) {
    const safeCodes = new Set(['INVALID_LEDGER_SCHEMA', 'INVALID_LEDGER_SEMANTICS', 'SELECTION_NOT_FOUND']);
    process.stderr.write(`${safeCodes.has(error.code) ? error.code : 'READER_ERROR'}\n`);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = await main(process.argv.slice(2));
}
