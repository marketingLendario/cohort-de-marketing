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
const SCRIPT = fileURLToPath(new URL('./reconcile-aula-04-sources.mjs', import.meta.url));
const FIXTURES = fileURLToPath(new URL('../aula-04/fixtures/', import.meta.url));
const SCHEMA = new URL('../data/contracts/source-reconciliation.v1.schema.json', import.meta.url);

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

function parseSuccess(result) {
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  assert.ok(result.stdout.endsWith('\n'));
  return JSON.parse(result.stdout);
}

async function withTempDocument(t, document, name = 'observations.json') {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'source-reconciliation-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, name);
  await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
  return file;
}

async function loadFixture(name) {
  return JSON.parse(await readFile(fixture(name), 'utf8'));
}

test('match produz contrato fechado, determinístico e sem fonte verdadeira', async () => {
  const first = await run([fixture('reconciliation-match.json')]);
  const second = await run([fixture('reconciliation-match.json')]);
  assert.equal(first.stdout, second.stdout);
  const output = parseSuccess(first);

  const schema = JSON.parse(await readFile(SCHEMA, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(output), true, JSON.stringify(validate.errors));
  assert.equal(output.contract, 'SourceReconciliation');
  assert.equal(output.schemaVersion, '1.0.0');
  assert.deepEqual(output.sources.map(({ source }) => source), ['platform', 'checkout', 'cash']);
  assert.deepEqual(output.comparisons.map(({ pair }) => pair), [
    ['platform', 'checkout'], ['platform', 'cash'], ['checkout', 'cash'],
  ]);
  assert.deepEqual(output.comparisons.map(({ absoluteGap, relativeGap, relativeGapExact }) => ({
    absoluteGap, relativeGap, relativeGapExact,
  })), [
    { absoluteGap: '0', relativeGap: '0', relativeGapExact: { numerator: '0', denominator: '1' } },
    { absoluteGap: '0', relativeGap: '0', relativeGapExact: { numerator: '0', denominator: '1' } },
    { absoluteGap: '0', relativeGap: '0', relativeGapExact: { numerator: '0', denominator: '1' } },
  ]);
  assert.equal(output.requiresHumanReview, true);
  assert.equal(JSON.stringify(output).includes('truth'), false);
  assert.equal(JSON.stringify(output).includes('priority'), false);
  assert.equal(JSON.stringify(output).includes('winner'), false);
});

test('mismatch calcula gaps simétricos com decimal exato e preserva literais', async () => {
  const output = parseSuccess(await run([fixture('reconciliation-mismatch.json')]));
  assert.deepEqual(output.comparisons, [
    {
      pair: ['platform', 'checkout'], comparable: true, reasonCodes: [],
      absoluteGap: '200', relativeGap: '0.166667',
      relativeGapExact: { numerator: '1', denominator: '6' },
    },
    {
      pair: ['platform', 'cash'], comparable: true, reasonCodes: [],
      absoluteGap: '210', relativeGap: '0.175',
      relativeGapExact: { numerator: '7', denominator: '40' },
    },
    {
      pair: ['checkout', 'cash'], comparable: true, reasonCodes: [],
      absoluteGap: '10', relativeGap: '0.01',
      relativeGapExact: { numerator: '1', denominator: '100' },
    },
  ]);
  assert.equal(output.sources[0].value, '1200.000');
  assert.equal(output.sources[2].period.start, '2026-07-01T03:00:00Z');
  assert.equal(output.sources[0].period.start, '2026-07-01T00:00:00-03:00');
});

test('fonte ausente vira nao_fornecido, enquanto zero explícito continua sendo valor', async () => {
  const output = parseSuccess(await run([fixture('reconciliation-missing.json')]));
  assert.equal(output.sources[0].status, 'provided');
  assert.equal(output.sources[0].value, '0');
  assert.deepEqual(output.sources.slice(1), [
    {
      source: 'checkout', status: 'nao_fornecido', value: null, currency: null,
      window: null, period: null, observedAt: null, confirmedByHuman: false,
      cashConfirmed: false, provenanceRef: null,
    },
    {
      source: 'cash', status: 'nao_fornecido', value: null, currency: null,
      window: null, period: null, observedAt: null, confirmedByHuman: false,
      cashConfirmed: false, provenanceRef: null,
    },
  ]);
  for (const comparison of output.comparisons) {
    assert.equal(comparison.comparable, false);
    assert.deepEqual(comparison.reasonCodes, ['MISSING_SOURCE']);
    assert.equal(comparison.absoluteGap, null);
    assert.equal(comparison.relativeGap, null);
    assert.equal(comparison.relativeGapExact, null);
  }
});

test('moeda, janela, período e confirmação incompatíveis explicam sem calcular', async (t) => {
  const base = await loadFixture('reconciliation-match.json');
  const cases = [
    ['currency', (doc) => { doc.observations[1].currency = 'USD'; }, ['INCOMPATIBLE_CURRENCY']],
    ['window', (doc) => { doc.observations[1].window = '7d_click_1d_view'; }, ['INCOMPATIBLE_WINDOW']],
    ['period', (doc) => { doc.observations[1].period.end = '2026-08-02T00:00:00-03:00'; }, ['INCOMPATIBLE_PERIOD']],
    ['confirmation', (doc) => { doc.observations[1].confirmedByHuman = false; }, ['UNCONFIRMED_SOURCE']],
    ['cash', (doc) => { doc.observations[2].cashConfirmed = false; }, ['UNCONFIRMED_CASH']],
  ];

  for (const [name, mutate, expectedReasons] of cases) {
    const document = structuredClone(base);
    mutate(document);
    const file = await withTempDocument(t, document, `${name}.json`);
    const output = parseSuccess(await run([file]));
    const pair = name === 'cash' ? output.comparisons[1] : output.comparisons[0];
    assert.equal(pair.comparable, false, name);
    assert.deepEqual(pair.reasonCodes, expectedReasons, name);
    assert.equal(pair.absoluteGap, null, name);
    assert.equal(pair.relativeGap, null, name);
    assert.equal(pair.relativeGapExact, null, name);
  }
});

test('instantes RFC3339 equivalentes em offsets diferentes são comparáveis sem normalizar a saída', async () => {
  const output = parseSuccess(await run([fixture('reconciliation-mismatch.json')]));
  assert.equal(output.comparisons[1].comparable, true);
  assert.equal(output.sources[0].period.start, '2026-07-01T00:00:00-03:00');
  assert.equal(output.sources[2].period.start, '2026-07-01T03:00:00Z');
});

test('timestamps inválidos, período invertido, duplicata e versão desconhecida falham fechado', async (t) => {
  const base = await loadFixture('reconciliation-match.json');
  const cases = [
    ['timestamp', (doc) => { doc.observations[0].observedAt = '2026-02-30T09:00:00Z'; }],
    ['period-order', (doc) => { doc.observations[0].period.end = doc.observations[0].period.start; }],
    ['duplicate', (doc) => { doc.observations = [doc.observations[0], structuredClone(doc.observations[0])]; }],
    ['currency', (doc) => { doc.observations[0].currency = 'ZZZ'; }],
    ['provenance-kind', (doc) => { doc.observations[0].provenanceRef.kind = 'cash-export'; }],
    ['version', (doc) => { doc.schemaVersion = '2.0.0'; }],
  ];
  for (const [name, mutate] of cases) {
    const document = structuredClone(base);
    mutate(document);
    const file = await withTempDocument(t, document, `${name}.json`);
    const result = await run([file]);
    assert.equal(result.code, 1, name);
    assert.equal(result.stderr, '', name);
    assert.deepEqual(JSON.parse(result.stdout), {
      valid: false, code: 'INVALID_SOURCE_OBSERVATION_SET',
    });
  }
});

test('schema fechado e sanitização bloqueiam PII, credenciais e payload de comprador sem eco', async (t) => {
  const base = await loadFixture('reconciliation-match.json');
  const cases = [
    ['buyer-name', (doc) => { doc.observations[0].buyerName = 'Pessoa Confidencial'; }, 'Pessoa Confidencial'],
    ['email', (doc) => { doc.observations[0].provenanceRef.id = 'aluno@example.invalid'; }, 'aluno@example.invalid'],
    ['token', (doc) => { doc.accessToken = 'token-super-secreto'; }, 'token-super-secreto'],
    ['phone-id', (doc) => { doc.observations[0].provenanceRef.id = 'platform-11.99999.8888'; }, '11.99999.8888'],
    ['buyer-payload', (doc) => { doc.buyerPayload = { document: '12345678900' }; }, '12345678900'],
  ];
  for (const [name, mutate, sensitive] of cases) {
    const document = structuredClone(base);
    mutate(document);
    const file = await withTempDocument(t, document, `${name}.json`);
    const result = await run([file]);
    assert.equal(result.code, 1, name);
    assert.equal(result.stderr, '', name);
    assert.deepEqual(JSON.parse(result.stdout), {
      valid: false, code: 'INVALID_SOURCE_OBSERVATION_SET',
    });
    assert.equal(result.stdout.includes(sensitive), false, name);
    assert.equal(result.stderr.includes(sensitive), false, name);
  }
});

test('matriz positiva rejeita texto sensível em toda superfície republicada sem eco', async (t) => {
  const base = await loadFixture('reconciliation-match.json');
  const synthetic = {
    name: 'joao-silva',
    address: 'rua-alpha-123',
    document: 'cpf-123.456.789-09',
    phone: 'phone-11.99999.8888',
    token: 'token-super-secreto',
    buyer: 'buyer-order-abc123',
  };
  const primarySurfaces = [
    ['reconciliationId', (document, value) => { document.reconciliationId = `reconciliation:${value}:2026-07`; }],
    ['metric', (document, value) => { document.metric = value; }],
    ['window', (document, value) => { document.observations[0].window = value; }],
    ['provenanceRef.id', (document, value) => { document.observations[0].provenanceRef.id = `platform-${value}`; }],
  ];
  const remainingTextSurfaces = [
    ['source', (document) => { document.observations[0].source = synthetic.buyer; }],
    ['status', (document) => { document.observations[0].status = synthetic.buyer; }],
    ['value', (document) => { document.observations[0].value = synthetic.buyer; }],
    ['currency', (document) => { document.observations[0].currency = synthetic.buyer; }],
    ['period.start', (document) => { document.observations[0].period.start = synthetic.buyer; }],
    ['period.end', (document) => { document.observations[0].period.end = synthetic.buyer; }],
    ['observedAt', (document) => { document.observations[0].observedAt = synthetic.buyer; }],
    ['provenanceRef.kind', (document) => { document.observations[0].provenanceRef.kind = synthetic.buyer; }],
  ];

  const cases = [];
  for (const [surface, mutate] of primarySurfaces) {
    for (const [kind, value] of Object.entries(synthetic)) {
      cases.push([`${surface}:${kind}`, value, (document) => mutate(document, value)]);
    }
  }
  for (const [surface, mutate] of remainingTextSurfaces) {
    cases.push([surface, synthetic.buyer, mutate]);
  }

  for (const [name, sensitive, mutate] of cases) {
    const document = structuredClone(base);
    mutate(document);
    const file = await withTempDocument(t, document, `privacy-${name.replace(/[^a-z0-9.-]/gi, '-')}.json`);
    const result = await run([file]);
    assert.equal(result.code, 1, name);
    assert.equal(result.stderr, '', name);
    assert.deepEqual(JSON.parse(result.stdout), {
      valid: false, code: 'INVALID_SOURCE_OBSERVATION_SET',
    }, name);
    assert.equal(result.stdout.includes(sensitive), false, name);
    assert.equal(result.stderr.includes(sensitive), false, name);
  }
});

test('nonces numéricos de telefone, CPF e CNPJ falham fechado em todos os IDs opacos', async (t) => {
  const base = await loadFixture('reconciliation-match.json');
  const schema = JSON.parse(await readFile(SCHEMA, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateOutput = ajv.compile(schema);
  const sensitiveNumericNonces = [
    ['phone', '11999998888'],
    ['cpf', '52998224725'],
    ['cnpj', '11222333000181'],
  ];
  const surfaces = [
    ['reconciliationId', (document, nonce) => {
      document.reconciliationId = `reconciliation:revenue:2026-07:${nonce}`;
    }, (output, nonce) => {
      output.reconciliationId = `reconciliation:revenue:2026-07:${nonce}`;
    }],
    ['provenanceRef.id', (document, nonce) => {
      document.observations[0].provenanceRef.id = `platform:2026-07:${nonce}`;
    }, (output, nonce) => {
      output.sources[0].provenanceRef.id = `platform:2026-07:${nonce}`;
    }],
  ];

  const validOutput = parseSuccess(await run([fixture('reconciliation-match.json')]));
  for (const [kind, nonce] of sensitiveNumericNonces) {
    for (const [surface, mutateInput, mutateOutput] of surfaces) {
      const document = structuredClone(base);
      mutateInput(document, nonce);
      const file = await withTempDocument(t, document, `numeric-${surface}-${kind}.json`);
      const result = await run([file]);
      assert.equal(result.code, 1, `${surface}:${kind}:input`);
      assert.equal(result.stderr, '', `${surface}:${kind}:input`);
      assert.deepEqual(JSON.parse(result.stdout), {
        valid: false, code: 'INVALID_SOURCE_OBSERVATION_SET',
      }, `${surface}:${kind}:input`);
      assert.equal(result.stdout.includes(nonce), false, `${surface}:${kind}:input`);

      const output = structuredClone(validOutput);
      mutateOutput(output, nonce);
      assert.equal(validateOutput(output), false, `${surface}:${kind}:output`);
    }
  }
});

test('schema de saída também fecha as superfícies republicadas contra texto sintético', async () => {
  const validOutput = parseSuccess(await run([fixture('reconciliation-match.json')]));
  const schema = JSON.parse(await readFile(SCHEMA, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const cases = [
    (output) => { output.reconciliationId = 'reconciliation:joao-silva:2026-07'; },
    (output) => { output.metric = 'buyer-order'; },
    (output) => { output.sources[0].window = 'rua-alpha-123'; },
    (output) => { output.sources[0].provenanceRef.id = 'platform-joao-silva'; },
    (output) => { output.sources[0].value = 'buyer-order'; },
    (output) => { output.sources[0].currency = 'CPF'; },
    (output) => { output.sources[0].period.start = 'phone-11.99999.8888'; },
    (output) => { output.sources[0].observedAt = 'token-super-secreto'; },
  ];
  for (const mutate of cases) {
    const output = structuredClone(validOutput);
    mutate(output);
    assert.equal(validate(output), false);
  }
});

test('allowlists conhecidas e referência opaca do operador não geram falso positivo', async (t) => {
  const metrics = ['revenue', 'orders', 'refunds', 'fees', 'net_revenue'];
  const windows = [
    'calendar_day', 'calendar_week', 'calendar_month', 'lifetime',
    '1d_click', '7d_click', '7d_click_1d_view', '28d_click_1d_view',
  ];
  const base = await loadFixture('reconciliation-match.json');
  base.observations[0].provenanceRef = {
    kind: 'operator-declaration', id: 'operator:2026-07:d4e5f6a7',
  };
  for (const [metricIndex, metric] of metrics.entries()) {
    for (const [windowIndex, window] of windows.entries()) {
      const document = structuredClone(base);
      const nonce = (0xa1b2c3d4 + (metricIndex * windows.length) + windowIndex)
        .toString(16).padStart(8, '0');
      document.metric = metric;
      document.reconciliationId = `reconciliation:${metric}:2026-07:${nonce}`;
      for (const observation of document.observations) observation.window = window;
      const file = await withTempDocument(t, document, `known-${metric}-${window}.json`);
      const output = parseSuccess(await run([file]));
      assert.equal(output.metric, metric);
      assert.equal(output.sources[0].window, window);
      assert.deepEqual(output.sources[0].provenanceRef, base.observations[0].provenanceRef);
    }
  }

  const positionedLetterNonces = [
    'a1234567890', '12345a67890', '1234567890a',
    'a1234567890123', '123456a8901234', '1234567890123a',
  ];
  for (const [index, nonce] of positionedLetterNonces.entries()) {
    const document = structuredClone(base);
    document.reconciliationId = `reconciliation:revenue:2026-07:${nonce}`;
    document.observations[0].provenanceRef.id = `operator:2026-07:${nonce}`;
    const file = await withTempDocument(t, document, `opaque-numeric-shaped-${index}.json`);
    const output = parseSuccess(await run([file]));
    assert.equal(output.reconciliationId, document.reconciliationId);
    assert.equal(output.sources[0].provenanceRef.id, document.observations[0].provenanceRef.id);
  }
});

test('valores monetários de 11 e 14 dígitos não são confundidos com identificadores pessoais', async (t) => {
  const base = await loadFixture('reconciliation-match.json');
  for (const value of ['11999998888', '11222333000181']) {
    const document = structuredClone(base);
    for (const observation of document.observations) observation.value = value;
    const file = await withTempDocument(t, document, `monetary-${value.length}-digits.json`);
    const output = parseSuccess(await run([file]));
    assert.deepEqual(output.sources.map((source) => source.value), [value, value, value]);
    assert.deepEqual(output.comparisons.map((comparison) => comparison.absoluteGap), ['0', '0', '0']);
  }
});

test('decimais maiores que Number.MAX_SAFE_INTEGER mantêm precisão e input não é alterado', async (t) => {
  const document = await loadFixture('reconciliation-match.json');
  document.observations[0].value = '9007199254740993.123456789012';
  document.observations[1].value = '9007199254740992.123456789012';
  document.observations[2].value = '9007199254740993.123456789012';
  const file = await withTempDocument(t, document, 'large-decimals.json');
  const before = await readFile(file);
  const output = parseSuccess(await run([file]));
  const after = await readFile(file);
  assert.equal(output.comparisons[0].absoluteGap, '1');
  assert.deepEqual(output.comparisons[0].relativeGapExact, {
    numerator: '250000000000', denominator: '2251799813685248280864197253',
  });
  assert.equal(output.comparisons[1].absoluteGap, '0');
  assert.deepEqual(after, before);
});

test('ordem de entrada não altera bytes de saída e o contrato rejeita propriedade extra', async (t) => {
  const document = await loadFixture('reconciliation-match.json');
  document.observations.reverse();
  const shuffled = await withTempDocument(t, document, 'shuffled.json');
  const canonical = await run([fixture('reconciliation-match.json')]);
  const reordered = await run([shuffled]);
  assert.equal(reordered.stdout, canonical.stdout);

  const output = parseSuccess(canonical);
  output.unexpected = true;
  const schema = JSON.parse(await readFile(SCHEMA, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(output), false);
  assert.ok(validate.errors.some(({ keyword }) => keyword === 'additionalProperties'));
});

test('CLI usa códigos estáveis e nunca ecoa paths ou conteúdo inválido', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'reconciliation-token-super-secreto-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const malformed = path.join(directory, 'buyer@example.invalid.json');
  await writeFile(malformed, '{"accessToken":"token-super-secreto"');
  const cases = [
    [[], 2, 'USAGE'],
    [[malformed], 2, 'INVALID_JSON'],
    [[path.join(directory, 'missing-token-super-secreto.json')], 2, 'UNABLE_TO_READ'],
  ];
  for (const [args, code, stderr] of cases) {
    const result = await run(args);
    assert.equal(result.code, code);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `${stderr}\n`);
    assert.equal(result.stderr.includes('token-super-secreto'), false);
    assert.equal(result.stderr.includes('buyer@example.invalid'), false);
  }
});
