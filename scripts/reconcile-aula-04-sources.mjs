import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_URL = new URL('../data/contracts/source-reconciliation.v1.schema.json', import.meta.url);
const SOURCE_ORDER = Object.freeze(['platform', 'checkout', 'cash']);
const COMPARISON_PAIRS = Object.freeze([
  Object.freeze(['platform', 'checkout']),
  Object.freeze(['platform', 'cash']),
  Object.freeze(['checkout', 'cash']),
]);
const SOURCE_PROVENANCE = Object.freeze({
  platform: new Set(['platform-export', 'operator-declaration']),
  checkout: new Set(['checkout-export', 'operator-declaration']),
  cash: new Set(['cash-export', 'operator-declaration']),
});
const ISO_4217_CODES = new Set(Intl.supportedValuesOf('currency'));
const FORBIDDEN_KEYS = new Set([
  'name', 'fullname', 'buyername', 'customername',
  'email', 'buyeremail', 'customeremail',
  'phone', 'telephone', 'mobile', 'buyerphone', 'customerphone',
  'document', 'cpf', 'cnpj', 'passport',
  'address', 'street', 'zipcode', 'postalcode',
  'token', 'accesstoken', 'refreshtoken', 'authorization', 'apikey', 'secret',
  'payload', 'buyerpayload', 'customerpayload', 'buyer', 'customer',
]);
const OPAQUE_IDENTIFIER_KEYS = new Set(['reconciliationid', 'id']);
const SENSITIVE_NUMERIC_IDENTIFIER_PATTERN = /(?:^|[^0-9])(?:[0-9]{11}|[0-9]{14})(?:[^0-9]|$)/;
const SENSITIVE_VALUE_PATTERNS = Object.freeze([
  /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/i,
  /\bbearer\s+[a-z0-9._~+/=-]+/i,
  /\b(?:access|refresh|auth|api)[_-]?token\b/i,
  /\b(?:sk|pk)_(?:live|test)_[a-z0-9]+\b/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(?:^|[^a-z])(?:buyer|customer|client|pessoa|nome|name|address|endereco|rua|avenida|street|cpf|cnpj|document|phone|telefone|mobile|token|secret|password)(?:[^a-z]|$)/i,
]);

let validatorsPromise;

function normalizeKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function containsSensitiveData(value, parentKey = '') {
  if (typeof value === 'string') {
    if (
      OPAQUE_IDENTIFIER_KEYS.has(normalizeKey(parentKey))
      && SENSITIVE_NUMERIC_IDENTIFIER_PATTERN.test(value)
    ) return true;
    if (SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) return true;
    return false;
  }
  if (Array.isArray(value)) return value.some((item) => containsSensitiveData(item, parentKey));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => (
    FORBIDDEN_KEYS.has(normalizeKey(key)) || containsSensitiveData(child, key)
  ));
}

async function createValidators() {
  const schema = JSON.parse(await readFile(SCHEMA_URL, 'utf8'));
  const ajv = new Ajv2020({
    allErrors: true,
    coerceTypes: false,
    removeAdditional: false,
    strict: true,
    useDefaults: false,
    validateFormats: true,
  });
  addFormats(ajv);
  ajv.addSchema(schema);
  return {
    input: ajv.compile({ $ref: `${schema.$id}#/$defs/sourceObservationSet` }),
    output: ajv.getSchema(schema.$id),
  };
}

function validators() {
  validatorsPromise ??= createValidators();
  return validatorsPromise;
}

function dateTimeMillis(value) {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function observationSemanticsAreValid(observation) {
  if (observation.status === 'nao_fornecido') return true;
  if (!ISO_4217_CODES.has(observation.currency)) return false;
  if (!SOURCE_PROVENANCE[observation.source].has(observation.provenanceRef.kind)) return false;
  const start = dateTimeMillis(observation.period.start);
  const end = dateTimeMillis(observation.period.end);
  return start !== null && end !== null && start < end;
}

export async function validateSourceObservationSet(document) {
  if (containsSensitiveData(document)) return false;
  const { input } = await validators();
  if (!input(document)) return false;

  const sources = new Set();
  for (const observation of document.observations) {
    if (sources.has(observation.source)) return false;
    sources.add(observation.source);
    if (!observationSemanticsAreValid(observation)) return false;
  }
  return true;
}

function missingObservation(source) {
  return {
    source,
    status: 'nao_fornecido',
    value: null,
    currency: null,
    window: null,
    period: null,
    observedAt: null,
    confirmedByHuman: false,
    cashConfirmed: false,
    provenanceRef: null,
  };
}

function projectObservation(observation) {
  if (!observation || observation.status === 'nao_fornecido') {
    return missingObservation(observation?.source);
  }
  return {
    source: observation.source,
    status: observation.status,
    value: observation.value,
    currency: observation.currency,
    window: observation.window,
    period: { start: observation.period.start, end: observation.period.end },
    observedAt: observation.observedAt,
    confirmedByHuman: observation.confirmedByHuman,
    cashConfirmed: observation.cashConfirmed,
    provenanceRef: {
      kind: observation.provenanceRef.kind,
      id: observation.provenanceRef.id,
    },
  };
}

function parseDecimal(value) {
  const [whole, fraction = ''] = value.split('.');
  return {
    units: BigInt(`${whole}${fraction}`),
    scale: fraction.length,
  };
}

function alignDecimals(left, right) {
  const scale = Math.max(left.scale, right.scale);
  return {
    left: left.units * (10n ** BigInt(scale - left.scale)),
    right: right.units * (10n ** BigInt(scale - right.scale)),
    scale,
  };
}

function canonicalDecimal(units, scale) {
  if (units === 0n) return '0';
  let digits = units.toString();
  if (scale === 0) return digits;
  digits = digits.padStart(scale + 1, '0');
  const whole = digits.slice(0, -scale);
  const fraction = digits.slice(-scale).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

function relativeGap(numerator, denominator) {
  if (denominator === 0n) return '0';
  const precision = 1_000_000n;
  const scaled = numerator * precision;
  let rounded = scaled / denominator;
  if ((scaled % denominator) * 2n >= denominator) rounded += 1n;
  if (rounded === precision) return '1';
  const fraction = rounded.toString().padStart(6, '0').replace(/0+$/, '');
  return fraction ? `0.${fraction}` : '0';
}

function greatestCommonDivisor(left, right) {
  let a = left;
  let b = right;
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function exactRelativeGap(numerator, denominator) {
  if (numerator === 0n || denominator === 0n) {
    return { numerator: '0', denominator: '1' };
  }
  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: (numerator / divisor).toString(),
    denominator: (denominator / divisor).toString(),
  };
}

function periodsMatch(left, right) {
  return dateTimeMillis(left.period.start) === dateTimeMillis(right.period.start)
    && dateTimeMillis(left.period.end) === dateTimeMillis(right.period.end);
}

function comparePair(left, right) {
  const pair = [left.source, right.source];
  if (left.status !== 'provided' || right.status !== 'provided') {
    return {
      pair,
      comparable: false,
      reasonCodes: ['MISSING_SOURCE'],
      absoluteGap: null,
      relativeGap: null,
      relativeGapExact: null,
    };
  }

  const reasonCodes = [];
  if (left.currency !== right.currency) reasonCodes.push('INCOMPATIBLE_CURRENCY');
  if (left.window !== right.window) reasonCodes.push('INCOMPATIBLE_WINDOW');
  if (!periodsMatch(left, right)) reasonCodes.push('INCOMPATIBLE_PERIOD');
  if (!left.confirmedByHuman || !right.confirmedByHuman) reasonCodes.push('UNCONFIRMED_SOURCE');
  const cash = left.source === 'cash' ? left : right.source === 'cash' ? right : null;
  if (cash && !cash.cashConfirmed) reasonCodes.push('UNCONFIRMED_CASH');
  if (reasonCodes.length > 0) {
    return {
      pair, comparable: false, reasonCodes,
      absoluteGap: null, relativeGap: null, relativeGapExact: null,
    };
  }

  const aligned = alignDecimals(parseDecimal(left.value), parseDecimal(right.value));
  const difference = aligned.left >= aligned.right
    ? aligned.left - aligned.right
    : aligned.right - aligned.left;
  const denominator = aligned.left >= aligned.right ? aligned.left : aligned.right;
  return {
    pair,
    comparable: true,
    reasonCodes: [],
    absoluteGap: canonicalDecimal(difference, aligned.scale),
    relativeGap: relativeGap(difference, denominator),
    relativeGapExact: exactRelativeGap(difference, denominator),
  };
}

export async function reconcileSourceObservations(document) {
  if (!await validateSourceObservationSet(document)) return null;
  const bySource = new Map(document.observations.map((observation) => [
    observation.source,
    projectObservation(observation),
  ]));
  const sources = SOURCE_ORDER.map((source) => bySource.get(source) ?? missingObservation(source));
  const indexed = new Map(sources.map((observation) => [observation.source, observation]));
  const output = {
    contract: 'SourceReconciliation',
    schemaVersion: '1.0.0',
    reconciliationId: document.reconciliationId,
    metric: document.metric,
    sourceContract: { contract: document.contract, schemaVersion: document.schemaVersion },
    sources,
    comparisons: COMPARISON_PAIRS.map(([left, right]) => comparePair(
      indexed.get(left), indexed.get(right),
    )),
    requiresHumanReview: true,
  };
  const { output: validateOutput } = await validators();
  if (containsSensitiveData(output) || !validateOutput(output)) {
    throw new Error('SourceReconciliation output contract violation');
  }
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

  let document;
  try {
    document = JSON.parse(input);
  } catch {
    process.stderr.write('INVALID_JSON\n');
    return 2;
  }

  let output;
  try {
    output = await reconcileSourceObservations(document);
  } catch {
    process.stderr.write('INTERNAL_CONTRACT_ERROR\n');
    return 2;
  }
  if (!output) {
    process.stdout.write('{"valid":false,"code":"INVALID_SOURCE_OBSERVATION_SET"}\n');
    return 1;
  }
  process.stdout.write(`${JSON.stringify(output)}\n`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = await main(process.argv.slice(2));
}
