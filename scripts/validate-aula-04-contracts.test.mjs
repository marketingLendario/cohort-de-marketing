import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(new URL('./validate-aula-04-contracts.mjs', import.meta.url));
const FIXTURES = fileURLToPath(new URL('../data/contracts/fixtures/aula-04/', import.meta.url));

function fixture(name) {
  return path.join(FIXTURES, name);
}

async function run(args) {
  try {
    const result = await execFileAsync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
    return { ...result, code: 0 };
  } catch (error) {
    return {
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
      code: error.code,
    };
  }
}

function parseSingleJson(stdout) {
  assert.ok(stdout.endsWith('\n'), 'stdout deve terminar com newline');
  return JSON.parse(stdout);
}

test('valida as tres fixtures positivas com envelope deterministico', async () => {
  const cases = [
    ['campaign-plan.valid.json', 'CampaignPlan'],
    ['weekly-panel.valid.json', 'WeeklyPanel'],
    ['weekly-panel.metric-not-provided.valid.json', 'WeeklyPanel'],
  ];

  for (const [name, contract] of cases) {
    const first = await run([fixture(name)]);
    const second = await run([fixture(name)]);
    assert.equal(first.code, 0, `${name}: ${first.stderr || first.stdout}`);
    assert.equal(first.stderr, '');
    assert.equal(first.stdout, second.stdout);
    assert.deepEqual(parseSingleJson(first.stdout), {
      contract,
      version: '1.0.0',
      file: fixture(name),
      valid: true,
      errors: [],
    });
  }
});

test('propriedade adicional falha com exit 1 e erros ordenados', async () => {
  const name = 'campaign-plan.additional-property.invalid.json';
  const result = await run([fixture(name)]);
  assert.equal(result.code, 1);
  assert.equal(result.stderr, '');
  const output = parseSingleJson(result.stdout);
  assert.deepEqual(output, {
    contract: 'CampaignPlan',
    version: '1.0.0',
    file: fixture(name),
    valid: false,
    errors: [
      {
        path: '/',
        keyword: 'additionalProperties',
        message: 'must NOT have additional properties: studioProjectId',
      },
    ],
  });
});

test('transicao invalida falha com erro estavel', async () => {
  const name = 'weekly-panel.invalid-transition.json';
  const first = await run([fixture(name)]);
  const second = await run([fixture(name)]);
  assert.equal(first.code, 1);
  assert.equal(first.stdout, second.stdout);
  assert.deepEqual(parseSingleJson(first.stdout), {
    contract: 'WeeklyPanel',
    version: '1.0.0',
    file: fixture(name),
    valid: false,
    errors: [
      {
        path: '/status',
        keyword: 'transition',
        message: 'transition closed -> draft is not allowed',
      },
    ],
  });
});

test('validacao preserva todos os inputs byte a byte', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'aula-04-contracts-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  for (const name of [
    'campaign-plan.valid.json',
    'campaign-plan.additional-property.invalid.json',
    'weekly-panel.valid.json',
    'weekly-panel.invalid-transition.json',
    'weekly-panel.metric-not-provided.valid.json',
  ]) {
    const target = path.join(directory, name);
    await copyFile(fixture(name), target);
    const before = await readFile(target);
    await run([target]);
    const after = await readFile(target);
    assert.deepEqual(after, before, name);
  }
});

test('nao_fornecido exige null e nao ganha valor, premissa ou janela', async () => {
  const file = fixture('weekly-panel.metric-not-provided.valid.json');
  const before = await readFile(file, 'utf8');
  const result = await run([file]);
  const after = await readFile(file, 'utf8');
  const document = JSON.parse(after);

  assert.equal(result.code, 0);
  assert.equal(after, before);
  assert.deepEqual(document.metrics[0], {
    name: 'cpa',
    value: null,
    seal: 'nao_fornecido',
    source: 'Operador nao forneceu a metrica.',
    attributionWindow: null,
    premise: null,
    confirmedByHuman: false,
    cashConfirmed: false,
  });
});

test('versao desconhecida falha fechado e exige migracao explicita', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'aula-04-version-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const target = path.join(directory, 'unknown-version.json');
  const document = JSON.parse(await readFile(fixture('campaign-plan.valid.json'), 'utf8'));
  document.schemaVersion = '2.0.0';
  await writeFile(target, `${JSON.stringify(document)}\n`);

  const result = await run([target]);
  assert.equal(result.code, 1);
  assert.deepEqual(parseSingleJson(result.stdout), {
    contract: 'CampaignPlan',
    version: '2.0.0',
    file: target,
    valid: false,
    errors: [
      {
        path: '/schemaVersion',
        keyword: 'version',
        message: 'unsupported CampaignPlan version 2.0.0; explicit migration is required',
      },
    ],
  });
});

test('uso, arquivo ausente e JSON ilegivel usam exit 2 sem stdout parcial', async (t) => {
  const usage = await run([]);
  assert.equal(usage.code, 2);
  assert.equal(usage.stdout, '');
  assert.equal(usage.stderr, 'Usage: node scripts/validate-aula-04-contracts.mjs <arquivo>\n');

  const missing = await run(['/definitely/not/a/contract.json']);
  assert.equal(missing.code, 2);
  assert.equal(missing.stdout, '');
  assert.equal(missing.stderr, 'Unable to read contract file.\n');

  const directory = await mkdtemp(path.join(os.tmpdir(), 'aula-04-json-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const malformed = path.join(directory, 'malformed.json');
  await writeFile(malformed, '{not-json}\n');
  const parsed = await run([malformed]);
  assert.equal(parsed.code, 2);
  assert.equal(parsed.stdout, '');
  assert.equal(parsed.stderr, 'Unable to parse contract JSON.\n');
});

test('schemas 2020-12 fecham envelopes e objetos controlados', async () => {
  for (const name of ['campaign-plan.v1.schema.json', 'weekly-panel.v1.schema.json']) {
    const schema = JSON.parse(await readFile(new URL(`../data/contracts/${name}`, import.meta.url), 'utf8'));
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(schema.additionalProperties, false);
    assert.ok(schema.required.includes('contract'));
    assert.equal(schema.properties.contract.const, name.startsWith('campaign') ? 'CampaignPlan' : 'WeeklyPanel');
  }
});
