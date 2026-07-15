import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_VERSION = '1.0.0';
const SCHEMA_URLS = {
  CampaignPlan: new URL('../data/contracts/campaign-plan.v1.schema.json', import.meta.url),
  WeeklyPanel: new URL('../data/contracts/weekly-panel.v1.schema.json', import.meta.url),
};

export const WEEKLY_PANEL_TRANSITIONS = Object.freeze({
  initial: Object.freeze(['draft']),
  draft: Object.freeze(['reading_ready']),
  reading_ready: Object.freeze(['diagnosed']),
  diagnosed: Object.freeze(['decided']),
  decided: Object.freeze(['closed']),
  closed: Object.freeze([]),
});

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortErrors(errors) {
  return errors.sort((left, right) => (
    compareText(left.path, right.path)
    || compareText(left.keyword, right.keyword)
    || compareText(left.message, right.message)
  ));
}

function normalizedAjvErrors(errors) {
  return sortErrors((errors ?? []).map((error) => {
    const suffix = error.keyword === 'additionalProperties'
      ? `: ${error.params.additionalProperty}`
      : '';
    return {
      path: error.instancePath || '/',
      keyword: error.keyword,
      message: `${error.message}${suffix}`,
    };
  }));
}

async function createValidators() {
  const schemas = await Promise.all(Object.entries(SCHEMA_URLS).map(async ([contract, url]) => [
    contract,
    JSON.parse(await readFile(url, 'utf8')),
  ]));
  const ajv = new Ajv2020({
    allErrors: true,
    coerceTypes: false,
    removeAdditional: false,
    strict: true,
    useDefaults: false,
    validateFormats: true,
  });
  addFormats(ajv);
  return Object.fromEntries(schemas.map(([contract, schema]) => [contract, ajv.compile(schema)]));
}

function contractError(document) {
  const contract = typeof document?.contract === 'string' ? document.contract : null;
  if (!Object.hasOwn(SCHEMA_URLS, contract)) {
    return {
      contract,
      version: typeof document?.schemaVersion === 'string' ? document.schemaVersion : null,
      errors: [{
        path: '/contract',
        keyword: 'contract',
        message: `unsupported contract ${contract ?? 'missing'}; explicit contract selection is required`,
      }],
    };
  }

  const version = typeof document?.schemaVersion === 'string' ? document.schemaVersion : null;
  if (version !== CURRENT_VERSION) {
    return {
      contract,
      version,
      errors: [{
        path: '/schemaVersion',
        keyword: 'version',
        message: `unsupported ${contract} version ${version ?? 'missing'}; explicit migration is required`,
      }],
    };
  }
  return null;
}

function transitionErrors(document) {
  if (document.contract !== 'WeeklyPanel') return [];
  const transitionKey = document.previousStatus === null ? 'initial' : document.previousStatus;
  const allowed = WEEKLY_PANEL_TRANSITIONS[transitionKey];
  if (!allowed?.includes(document.status)) {
    return [{
      path: '/status',
      keyword: 'transition',
      message: `transition ${document.previousStatus ?? 'null'} -> ${document.status} is not allowed`,
    }];
  }

  const eventErrors = [];
  for (let index = 0; index < document.events.length; index += 1) {
    const payload = document.events[index].payload;
    if (payload.previousStatus !== document.previousStatus) {
      eventErrors.push({
        path: `/events/${index}/payload/previousStatus`,
        keyword: 'transition',
        message: 'event previousStatus must equal document previousStatus',
      });
    }
    if (payload.nextStatus !== document.status) {
      eventErrors.push({
        path: `/events/${index}/payload/nextStatus`,
        keyword: 'transition',
        message: 'event nextStatus must equal document status',
      });
    }
  }
  return eventErrors;
}

export async function validateAula04Contract(document, file) {
  const unsupported = contractError(document);
  if (unsupported) {
    return {
      contract: unsupported.contract,
      version: unsupported.version,
      file,
      valid: false,
      errors: unsupported.errors,
    };
  }

  const validators = await createValidators();
  const validate = validators[document.contract];
  const schemaValid = validate(document);
  const errors = normalizedAjvErrors(validate.errors);
  if (schemaValid) errors.push(...transitionErrors(document));
  sortErrors(errors);
  return {
    contract: document.contract,
    version: document.schemaVersion,
    file,
    valid: errors.length === 0,
    errors,
  };
}

async function main(args) {
  if (args.length !== 1) {
    process.stderr.write('Usage: node scripts/validate-aula-04-contracts.mjs <arquivo>\n');
    return 2;
  }

  const [file] = args;
  let input;
  try {
    input = await readFile(file, 'utf8');
  } catch {
    process.stderr.write('Unable to read contract file.\n');
    return 2;
  }

  let document;
  try {
    document = JSON.parse(input);
  } catch {
    process.stderr.write('Unable to parse contract JSON.\n');
    return 2;
  }

  const result = await validateAula04Contract(document, file);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  return result.valid ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = await main(process.argv.slice(2));
}
