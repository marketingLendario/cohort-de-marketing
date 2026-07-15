import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(new URL('./build-weekly-ledger.mjs', import.meta.url));
const FIXTURES = fileURLToPath(new URL('../aula-04/fixtures/', import.meta.url));
const SCHEMA = new URL('../data/contracts/weekly-ledger.v1.schema.json', import.meta.url);

function fixture(name) {
  return path.join(FIXTURES, name);
}

async function run(args, options = {}) {
  try {
    const result = await execFileAsync(process.execPath, [SCRIPT, ...args], {
      encoding: 'utf8',
      env: { ...process.env, ...options.env },
    });
    return { ...result, code: 0 };
  } catch (error) {
    return { stdout: error.stdout ?? '', stderr: error.stderr ?? '', code: error.code };
  }
}

function runConcurrent(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      env: { ...process.env, ...options.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function lockPathFor(ledgerPath) {
  return path.join(path.dirname(ledgerPath), `.${path.basename(ledgerPath)}.lock`);
}

async function withLedger(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'weekly-ledger-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return path.join(directory, 'weekly-ledger.json');
}

test('constroi ledger de tres semanas conforme schema e fixture congelada', async (t) => {
  const ledgerPath = await withLedger(t);
  const result = await run([fixture('ledger-three-weeks.input.jsonl'), ledgerPath]);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), { added: 4, replayed: 0, total: 4 });

  const actualText = await readFile(ledgerPath, 'utf8');
  const expectedText = await readFile(fixture('ledger-three-weeks.expected.json'), 'utf8');
  assert.equal(actualText, expectedText);
  const ledger = JSON.parse(actualText);

  const schema = JSON.parse(await readFile(SCHEMA, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(ledger), true, JSON.stringify(validate.errors));
  assert.equal(ledger.entries.length, 4);
  assert.deepEqual(ledger.index.map(({ weekStart, revisions }) => ({ weekStart, revisions })), [
    { weekStart: '2026-07-13', revisions: [{ revision: 1, entryIndex: 0 }, { revision: 2, entryIndex: 1 }] },
    { weekStart: '2026-07-20', revisions: [{ revision: 1, entryIndex: 2 }] },
    { weekStart: '2026-07-27', revisions: [{ revision: 1, entryIndex: 3 }] },
  ]);
});

test('preserva proveniencia literal e ausencia explicita sem inferir ou normalizar', async (t) => {
  const ledgerPath = await withLedger(t);
  await run([fixture('ledger-three-weeks.input.jsonl'), ledgerPath]);
  const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));

  assert.deepEqual(ledger.entries[2].metrics[0], {
    name: 'cpa',
    value: null,
    seal: 'nao_fornecido',
    source: 'Operador nao forneceu a metrica.',
    attributionWindow: null,
    premise: null,
    confirmedByHuman: false,
    cashConfirmed: false,
  });
  assert.deepEqual(ledger.entries[3].metrics[0], {
    name: 'revenue',
    value: 510,
    seal: 'Estimado',
    source: 'Checkout exportado pelo operador em 2026-07-27',
    attributionWindow: 'calendar_week',
    premise: 'Taxas ainda nao conciliadas.',
    confirmedByHuman: true,
    cashConfirmed: false,
  });
});

test('replay com chaves JSON reordenadas e hash igual e idempotente byte a byte', async (t) => {
  const ledgerPath = await withLedger(t);
  await run([fixture('ledger-three-weeks.input.jsonl'), ledgerPath]);
  const before = await readFile(ledgerPath);
  const result = await run([fixture('ledger-idempotent.input.jsonl'), ledgerPath]);
  const after = await readFile(ledgerPath);

  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.deepEqual(JSON.parse(result.stdout), { added: 0, replayed: 1, total: 4 });
  assert.deepEqual(after, before);
});

test('mesma identidade com hash diferente falha fechado e preserva ledger', async (t) => {
  const ledgerPath = await withLedger(t);
  await run([fixture('ledger-three-weeks.input.jsonl'), ledgerPath]);
  const before = await readFile(ledgerPath);
  const result = await run([fixture('ledger-conflict.input.jsonl'), ledgerPath]);
  const after = await readFile(ledgerPath);

  assert.equal(result.code, 1);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    valid: false,
    code: 'LEDGER_IDENTITY_CONFLICT',
    identity: {
      projectId: 'project-acme', campaignId: 'campaign-acme-launch', weekStart: '2026-07-13', revision: 1,
    },
  });
  assert.deepEqual(after, before);
});

test('nova revisao e anexada sem sobrescrever a anterior', async (t) => {
  const ledgerPath = await withLedger(t);
  const lines = (await readFile(fixture('ledger-three-weeks.input.jsonl'), 'utf8')).trim().split('\n');
  const directory = path.dirname(ledgerPath);
  const initial = path.join(directory, 'initial.jsonl');
  const revision = path.join(directory, 'revision.jsonl');
  await writeFile(initial, `${lines[2]}\n`);
  await writeFile(revision, `${lines[1]}\n`);

  await run([initial, ledgerPath]);
  const previous = JSON.parse(await readFile(ledgerPath, 'utf8'));
  const result = await run([revision, ledgerPath]);
  const current = JSON.parse(await readFile(ledgerPath, 'utf8'));

  assert.equal(result.code, 0);
  assert.deepEqual(current.entries[0], previous.entries[0]);
  assert.equal(current.entries[0].revision, 1);
  assert.equal(current.entries[1].revision, 2);
});

test('qualquer metrica sem proveniencia valida aborta o lote antes de escrever', async (t) => {
  const ledgerPath = await withLedger(t);
  await run([fixture('ledger-three-weeks.input.jsonl'), ledgerPath]);
  const before = await readFile(ledgerPath);
  const valid = (await readFile(fixture('ledger-idempotent.input.jsonl'), 'utf8')).trim();
  const invalidPanel = JSON.parse(valid);
  invalidPanel.revision = 9;
  delete invalidPanel.metrics[0].source;
  const batch = path.join(path.dirname(ledgerPath), 'invalid-provenance.jsonl');
  await writeFile(batch, `${valid}\n${JSON.stringify(invalidPanel)}\n`);

  const result = await run([batch, ledgerPath]);
  assert.equal(result.code, 1);
  assert.equal(JSON.parse(result.stdout).code, 'INVALID_WEEKLY_PANEL');
  assert.deepEqual(await readFile(ledgerPath), before);
});

test('conflito no fim de um lote nao anexa candidatos anteriores', async (t) => {
  const ledgerPath = await withLedger(t);
  await run([fixture('ledger-three-weeks.input.jsonl'), ledgerPath]);
  const before = await readFile(ledgerPath);
  const newPanel = JSON.parse((await readFile(fixture('ledger-idempotent.input.jsonl'), 'utf8')).trim());
  newPanel.id = 'weekly-panel:zeta:2026-07-13:r1';
  newPanel.projectId = 'project-zeta';
  newPanel.campaignId = 'campaign-zeta';
  const conflict = (await readFile(fixture('ledger-conflict.input.jsonl'), 'utf8')).trim();
  const batch = path.join(path.dirname(ledgerPath), 'new-then-conflict.jsonl');
  await writeFile(batch, `${JSON.stringify(newPanel)}\n${conflict}\n`);

  const result = await run([batch, ledgerPath]);
  assert.equal(result.code, 1);
  assert.equal(JSON.parse(result.stdout).code, 'LEDGER_IDENTITY_CONFLICT');
  assert.deepEqual(await readFile(ledgerPath), before);
});

test('ledger existente invalido falha fechado sem ser reparado ou reformatado', async (t) => {
  const ledgerPath = await withLedger(t);
  const forged = '{"contract":"WeeklyLedger","schemaVersion":"1.0.0","hashAlgorithm":"sha256","entries":[],"index":[{"projectId":"forged"}]}\n';
  await writeFile(ledgerPath, forged);

  const result = await run([fixture('ledger-idempotent.input.jsonl'), ledgerPath]);
  assert.equal(result.code, 1);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), { valid: false, code: 'INVALID_EXISTING_LEDGER' });
  assert.equal(await readFile(ledgerPath, 'utf8'), forged);
});

test('saida omite conteudo bruto, decisoes, eventos, leitor e dados pessoais', async (t) => {
  const ledgerPath = await withLedger(t);
  await run([fixture('ledger-three-weeks.input.jsonl'), ledgerPath]);
  const output = await readFile(ledgerPath, 'utf8');
  for (const forbidden of [
    'reader', 'decision', 'events', 'diagnosis', 'owner@example.invalid',
    'aluno@example.invalid', 'Documento bruto confidencial', 'Manter verba.',
  ]) assert.equal(output.includes(forbidden), false, forbidden);
});

test('uso, I/O e JSONL invalido usam exit 2 e nunca criam saida parcial', async (t) => {
  const usage = await run([]);
  assert.equal(usage.code, 2);
  assert.equal(usage.stdout, '');
  assert.equal(usage.stderr, 'Usage: node scripts/build-weekly-ledger.mjs <input.jsonl> <ledger.json>\n');

  const ledgerPath = await withLedger(t);
  const missing = await run(['/definitely/not/input.jsonl', ledgerPath]);
  assert.equal(missing.code, 2);
  assert.equal(missing.stdout, '');
  assert.equal(missing.stderr, 'Unable to read ledger input.\n');

  const malformed = path.join(path.dirname(ledgerPath), 'malformed.jsonl');
  await writeFile(malformed, '{not-json}\n');
  const parsed = await run([malformed, ledgerPath]);
  assert.equal(parsed.code, 2);
  assert.equal(parsed.stdout, '');
  assert.equal(parsed.stderr, 'Unable to parse ledger input at line 1.\n');
  await assert.rejects(readFile(ledgerPath));

  const impossibleOutput = path.join(path.dirname(ledgerPath), 'missing', 'ledger.json');
  const writeFailure = await run([fixture('ledger-idempotent.input.jsonl'), impossibleOutput]);
  assert.equal(writeFailure.code, 2);
  assert.equal(writeFailure.stdout, '');
  assert.equal(writeFailure.stderr, 'Unable to write ledger atomically.\n');
});

test('vinte e quatro writers concorrentes preservam todas as entradas exatamente uma vez', async (t) => {
  const ledgerPath = await withLedger(t);
  const base = JSON.parse((await readFile(fixture('ledger-three-weeks.input.jsonl'), 'utf8')).split('\n')[0]);
  const inputs = [];
  for (let index = 0; index < 24; index += 1) {
    const panel = structuredClone(base);
    const suffix = String(index).padStart(2, '0');
    panel.id = `weekly-panel:race-${suffix}:2026-07-20:r1`;
    panel.projectId = `project-race-${suffix}`;
    panel.campaignId = `campaign-race-${suffix}`;
    const input = path.join(path.dirname(ledgerPath), `race-${suffix}.jsonl`);
    await writeFile(input, `${JSON.stringify(panel)}\n`);
    inputs.push(input);
  }

  const results = await Promise.all(inputs.map((input) => runConcurrent([input, ledgerPath])));
  assert.deepEqual(results.map(({ code }) => code), Array(24).fill(0), JSON.stringify(results));
  const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
  assert.equal(ledger.entries.length, 24);
  assert.equal(new Set(ledger.entries.map(({ projectId }) => projectId)).size, 24);
  await assert.rejects(access(lockPathFor(ledgerPath)));
});

test('lock abandonado por processo morto e recuperado e removido pelo novo owner', async (t) => {
  const ledgerPath = await withLedger(t);
  const lockPath = lockPathFor(ledgerPath);
  await mkdir(lockPath);
  await writeFile(path.join(lockPath, 'owner.json'), `${JSON.stringify({
    version: 1,
    pid: 2_147_483_647,
    token: 'crashed-owner',
    createdAt: '2000-01-01T00:00:00.000Z',
  })}\n`);

  const result = await run([fixture('ledger-three-weeks.input.jsonl'), ledgerPath], {
    env: { WEEKLY_LEDGER_LOCK_STALE_MS: '1' },
  });
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(await readFile(ledgerPath, 'utf8')).entries.length, 4);
  await assert.rejects(access(lockPath));
});

test('lock de owner vivo expira com erro deterministico sem escrever nem remover lock alheio', async (t) => {
  const ledgerPath = await withLedger(t);
  const lockPath = lockPathFor(ledgerPath);
  await mkdir(lockPath);
  await writeFile(path.join(lockPath, 'owner.json'), `${JSON.stringify({
    version: 1,
    pid: process.pid,
    token: 'live-owner',
    createdAt: new Date().toISOString(),
  })}\n`);

  const result = await run([fixture('ledger-three-weeks.input.jsonl'), ledgerPath], {
    env: {
      WEEKLY_LEDGER_LOCK_TIMEOUT_MS: '100',
      WEEKLY_LEDGER_LOCK_RETRY_MS: '10',
      WEEKLY_LEDGER_LOCK_STALE_MS: '1',
    },
  });
  assert.equal(result.code, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'Unable to acquire ledger lock.\n');
  await assert.rejects(readFile(ledgerPath));
  assert.equal(JSON.parse(await readFile(path.join(lockPath, 'owner.json'), 'utf8')).token, 'live-owner');
});

test('proveniencia livre com PII, decisao ou conteudo bruto falha fechado sem criar ledger', async (t) => {
  const ledgerPath = await withLedger(t);
  const panel = JSON.parse((await readFile(fixture('ledger-three-weeks.input.jsonl'), 'utf8')).split('\n')[0]);
  panel.metrics[0].source = 'decidedBy=owner@example.invalid; humanAction=Manter verba.; Documento bruto confidencial';
  const input = path.join(path.dirname(ledgerPath), 'sensitive-provenance.jsonl');
  await writeFile(input, `${JSON.stringify(panel)}\n`);

  const result = await run([input, ledgerPath]);
  assert.equal(result.code, 1);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    valid: false,
    code: 'INVALID_METRIC_PROVENANCE_REFERENCE',
    line: 1,
    metricIndex: 0,
    field: 'source',
  });
  await assert.rejects(readFile(ledgerPath));
});

test('ledger projeta referencias estruturadas e nunca strings brutas de source ou premise', async (t) => {
  const ledgerPath = await withLedger(t);
  const result = await run([fixture('ledger-three-weeks.input.jsonl'), ledgerPath]);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
  for (const entry of ledger.entries) {
    for (const metric of entry.metrics) {
      assert.equal(Object.hasOwn(metric, 'source'), false);
      assert.equal(Object.hasOwn(metric, 'premise'), false);
      assert.deepEqual(Object.keys(metric.sourceRef).sort(), ['id', 'kind']);
      if (metric.premiseRef !== null) {
        assert.deepEqual(Object.keys(metric.premiseRef).sort(), ['id', 'kind']);
      }
    }
  }
});
