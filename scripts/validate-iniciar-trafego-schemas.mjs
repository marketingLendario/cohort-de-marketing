import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CONTRACTS = join(ROOT, 'data/contracts/iniciar-trafego');
const FIXTURES = join(CONTRACTS, 'fixtures');

function fail(msg) {
  console.error(`validate-iniciar-trafego-schemas: FAIL — ${msg}`);
  process.exit(1);
}

const index = JSON.parse(readFileSync(join(CONTRACTS, 'index.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validators = new Map();
for (const entry of index.contracts) {
  const schemaPath = join(CONTRACTS, entry.file);
  if (!existsSync(schemaPath)) fail(`registry aponta arquivo inexistente: ${entry.file}`);
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  validators.set(entry.id, ajv.compile(schema));
}

for (const entry of index.contracts) {
  const dir = join(FIXTURES, entry.id);
  if (!existsSync(dir)) fail(`fixtures ausentes para ${entry.id}`);
  const validPath = join(dir, 'valid.json');
  const invalidPath = join(dir, 'invalid.json');
  if (!existsSync(validPath) || !existsSync(invalidPath)) {
    fail(`fixtures valid/invalid ausentes para ${entry.id}`);
  }
  const validate = validators.get(entry.id);
  const validDoc = JSON.parse(readFileSync(validPath, 'utf8'));
  const invalidDoc = JSON.parse(readFileSync(invalidPath, 'utf8'));
  if (!validate(validDoc)) fail(`${entry.id} valid.json deveria passar: ${JSON.stringify(validate.errors)}`);
  if (validate(invalidDoc)) fail(`${entry.id} invalid.json deveria falhar`);
}

const schemaFiles = readdirSync(CONTRACTS).filter((f) => f.endsWith('.schema.json'));
if (schemaFiles.length !== index.contracts.length) {
  fail(`contagem diverge: ${schemaFiles.length} arquivos vs ${index.contracts.length} no registry`);
}

console.log(`validate-iniciar-trafego-schemas: PASS (${index.contracts.length} schemas, ${index.contracts.length * 2} fixtures)`);
process.exit(0);
