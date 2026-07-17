import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cp, mkdir, mkdtemp, readFile, readdir, readlink, rm, symlink, writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { validateAula04Contract } from './validate-aula-04-contracts.mjs';

const execFileAsync = promisify(execFile);
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SCRIPT = path.join(ROOT, 'scripts/run-aula-04-walkthrough.mjs');
const EXAMPLE = path.join(ROOT, 'aula-04/exemplos/projeto-tres-semanas');
const MODULE_README = path.join(ROOT, 'aula-04/README.md');
const GUIDE = path.join(ROOT, 'aula-04/GUIA-DO-ALUNO.html');
const EXPECTED_ARTIFACTS = [
  'decision-outcome-diagnosis.json',
  'decision-outcome-request.json',
  'historical-reading.json',
  'source-reconciliation.json',
  'walkthrough-summary.json',
  'weekly-ledger.json',
];

async function run(args) {
  try {
    const result = await execFileAsync(process.execPath, [SCRIPT, ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { PATH: process.env.PATH },
    });
    return { ...result, code: 0 };
  } catch (error) {
    return { stdout: error.stdout ?? '', stderr: error.stderr ?? '', code: error.code };
  }
}

async function temporaryDirectory(t, prefix) {
  const directory = await mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function snapshotDirectory(directory) {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .sort((left, right) => left.name.localeCompare(right.name, 'en'));
  const snapshot = {};
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) snapshot[entry.name] = await snapshotDirectory(target);
    else if (entry.isSymbolicLink()) snapshot[entry.name] = { symlink: await readlink(target) };
    else snapshot[entry.name] = createHash('sha256').update(await readFile(target)).digest('hex');
  }
  return snapshot;
}

async function compileSchema(relativePath) {
  const schema = await readJson(path.join(ROOT, relativePath));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

test('módulo apresenta uma sequência única, pré-requisitos e abertura manual por sistema', async () => {
  const [readme, guide, rootReadme, handoff] = await Promise.all([
    readFile(MODULE_README, 'utf8'),
    readFile(GUIDE, 'utf8'),
    readFile(path.join(ROOT, 'README.md'), 'utf8'),
    readFile(path.join(ROOT, 'aula-03/docs/conexao-aula-04.md'), 'utf8'),
  ]);
  const steps = ['1. Preparar', '2. Executar', '3. Revisar', '4. Registrar a decisão humana'];
  let cursor = -1;
  for (const step of steps) {
    const next = readme.indexOf(step);
    assert.ok(next > cursor, step);
    cursor = next;
  }
  assert.match(readme, /Node\.js 18\+/);
  assert.match(readme, /node scripts\/run-aula-04-walkthrough\.mjs/);
  assert.match(guide, /macOS/);
  assert.match(guide, /Windows/);
  assert.match(guide, /Linux/);
  assert.match(guide, /não abre navegador/i);
  assert.doesNotMatch(guide, /abre (?:sozinho|automaticamente)/i);
  assert.doesNotMatch(`${readme}\n${guide}`, /\/Users\/|[A-Z]:\\\\/);
  assert.match(rootReadme, /aula-04\/README\.md/);
  assert.match(handoff, /\.\.\/\.\.\/aula-04\/README\.md/);
});

test('links locais do README e guia resolvem dentro do checkout', async () => {
  for (const file of [MODULE_README, GUIDE]) {
    const content = await readFile(file, 'utf8');
    const links = [...content.matchAll(/(?:href=["']|\]\()([^"')#]+)(?:["']|\))/g)]
      .map((match) => match[1]);
    assert.ok(links.length > 0, file);
    for (const link of links) {
      assert.doesNotMatch(link, /^(?:https?:|file:|\/)/, link);
      await readFile(path.resolve(path.dirname(file), link));
    }
  }
});

test('exemplo contém exatamente três semanas públicas válidas e inputs minimizados', async () => {
  const text = await readFile(path.join(EXAMPLE, 'weekly-panels.jsonl'), 'utf8');
  const lines = text.trimEnd().split('\n');
  assert.equal(lines.length, 3);
  const panels = lines.map(JSON.parse);
  assert.equal(new Set(panels.map((panel) => panel.weekStart)).size, 3);
  for (const [index, panel] of panels.entries()) {
    const result = await validateAula04Contract(panel, `week-${index + 1}`);
    assert.equal(result.valid, true, JSON.stringify(result.errors));
  }
  const serialized = JSON.stringify({
    panels,
    observations: await readJson(path.join(EXAMPLE, 'source-observations.json')),
    decision: await readJson(path.join(EXAMPLE, 'previous-decision.json')),
  });
  assert.doesNotMatch(serialized, /@|bearer|token|password|secret|cpf|cnpj|buyer|customer/i);
});

test('walkthrough gera seis artefatos contratuais e diagnóstico inconclusivo', async (t) => {
  const output = await temporaryDirectory(t, 'aula-04-output-');
  const result = await run([EXAMPLE, output]);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  assert.deepEqual((await readdir(output)).sort(), EXPECTED_ARTIFACTS);

  const [ledger, history, reconciliation, request, diagnosis, summary, expected] = await Promise.all([
    readJson(path.join(output, 'weekly-ledger.json')),
    readJson(path.join(output, 'historical-reading.json')),
    readJson(path.join(output, 'source-reconciliation.json')),
    readJson(path.join(output, 'decision-outcome-request.json')),
    readJson(path.join(output, 'decision-outcome-diagnosis.json')),
    readJson(path.join(output, 'walkthrough-summary.json')),
    readJson(path.join(EXAMPLE, 'expected-walkthrough.json')),
  ]);
  const [validateLedger, validateReconciliation, validateDiagnosis] = await Promise.all([
    compileSchema('data/contracts/weekly-ledger.v1.schema.json'),
    compileSchema('data/contracts/source-reconciliation.v1.schema.json'),
    compileSchema('data/contracts/decision-outcome-diagnosis.v1.schema.json'),
  ]);
  assert.equal(validateLedger(ledger), true, JSON.stringify(validateLedger.errors));
  assert.equal(validateReconciliation(reconciliation), true, JSON.stringify(validateReconciliation.errors));
  assert.equal(validateDiagnosis(diagnosis), true, JSON.stringify(validateDiagnosis.errors));
  assert.equal(ledger.entries.length, 3);
  assert.equal(new Set(ledger.entries.map((entry) => entry.weekStart)).size, 3);
  assert.equal(history.contract, 'HistoricalMetricsReading');
  assert.equal(request.contract, 'DecisionOutcomeEvaluationRequest');
  assert.equal(diagnosis.verdict, 'inconclusivo');
  assert.deepEqual(diagnosis.reasonCodes, ['RECONCILIATION_CONFOUNDING_GAP']);
  assert.deepEqual(diagnosis.proposedLevers, []);
  assert.equal(diagnosis.humanDecision.status, 'pending');
  assert.equal(diagnosis.guards.mutationAllowed, false);
  assert.deepEqual(summary, expected);
  assert.deepEqual(JSON.parse(result.stdout), expected);
});

test('duas execuções limpas são determinísticas e não alteram o exemplo', async (t) => {
  const before = await snapshotDirectory(EXAMPLE);
  const first = await temporaryDirectory(t, 'aula-04-first-');
  const second = await temporaryDirectory(t, 'aula-04-second-');
  assert.equal((await run([EXAMPLE, first])).code, 0);
  assert.equal((await run([EXAMPLE, second])).code, 0);
  assert.deepEqual(await snapshotDirectory(EXAMPLE), before);
  for (const artifact of EXPECTED_ARTIFACTS) {
    assert.deepEqual(await readFile(path.join(first, artifact)), await readFile(path.join(second, artifact)), artifact);
  }
  const outputs = await Promise.all(EXPECTED_ARTIFACTS.map((artifact) => readFile(path.join(first, artifact), 'utf8')));
  assert.doesNotMatch(outputs.join('\n'), /\/Users\/|[A-Z]:\\\\|@|bearer|token|password|secret/i);
  assert.doesNotMatch(
    outputs.join('\n'),
    /(?<![a-z0-9])(?:\d{10,11}|\d{13,14})(?![a-z0-9])|(?<![a-z0-9])\d{3}\.\d{3}\.\d{3}-\d{2}(?![a-z0-9])|(?<![a-z0-9])\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}(?![a-z0-9])|(?<![a-z0-9])\(?\d{2}\)?[ .-]\d{4,5}[ .-]\d{4}(?![a-z0-9])/i,
  );
});

test('telefone, CPF e CNPJ shaped falham fechado recursivamente sem bloquear IDs opacos', async (t) => {
  const sensitiveCases = [
    ['11987654321', 'INVALID_PREVIOUS_DECISION'],
    ['(11) 98765-4321', 'INVALID_WEEKLY_PANEL'],
    ['12345678901', 'INVALID_EXPECTATION'],
    ['123.456.789-01', 'INVALID_SOURCE_OBSERVATIONS'],
    ['12345678000195', 'INVALID_PREVIOUS_DECISION'],
    ['12.345.678/0001-95', 'INVALID_EXPECTATION'],
  ];

  for (const [value, expectedCode] of sensitiveCases) {
    const input = await temporaryDirectory(t, 'aula-04-pii-input-');
    const output = await temporaryDirectory(t, 'aula-04-pii-output-');
    await cp(EXAMPLE, input, { recursive: true });
    if (expectedCode === 'INVALID_PREVIOUS_DECISION') {
      const file = path.join(input, 'previous-decision.json');
      const document = await readJson(file);
      document.hypothesis.text = `Contato ${value}`;
      await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
    } else if (expectedCode === 'INVALID_WEEKLY_PANEL') {
      const file = path.join(input, 'weekly-panels.jsonl');
      const panels = (await readFile(file, 'utf8')).trimEnd().split('\n').map(JSON.parse);
      panels[0].reader.note = `Contato ${value}`;
      await writeFile(file, `${panels.map(JSON.stringify).join('\n')}\n`);
    } else if (expectedCode === 'INVALID_SOURCE_OBSERVATIONS') {
      const file = path.join(input, 'source-observations.json');
      const document = await readJson(file);
      document.operatorReference = { nested: [`Contato ${value}`] };
      await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
    } else {
      const file = path.join(input, 'expected-walkthrough.json');
      const document = await readJson(file);
      document.operatorReference = { nested: [`Contato ${value}`] };
      await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
    }
    const before = await snapshotDirectory(input);
    const result = await run([input, output]);
    assert.equal(result.code, 1, value);
    assert.equal(result.stdout, '', value);
    assert.equal(result.stderr, `${expectedCode}\n`, value);
    assert.equal(result.stderr.includes(value), false, value);
    assert.deepEqual(await readdir(output), [], value);
    assert.deepEqual(await snapshotDirectory(input), before, value);
  }

  for (const opaqueId of ['a123456789', 'a1234567890', 'a123456789012', 'a1234567890123']) {
    const input = await temporaryDirectory(t, 'aula-04-opaque-input-');
    const output = await temporaryDirectory(t, 'aula-04-opaque-output-');
    await cp(EXAMPLE, input, { recursive: true });
    const file = path.join(input, 'previous-decision.json');
    const document = await readJson(file);
    document.hypothesis.id = `hypothesis:${opaqueId}`;
    await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
    const result = await run([input, output]);
    assert.equal(result.code, 0, result.stderr || opaqueId);
    assert.deepEqual((await readdir(output)).sort(), EXPECTED_ARTIFACTS, opaqueId);
  }
});

test('telefone fixo compacto com DDD e celular internacional compacto falham juntos sem eco', async (t) => {
  const probes = [
    { value: '1134567890', expectedCode: 'INVALID_PREVIOUS_DECISION', surface: 'decision' },
    { value: '5511987654321', expectedCode: 'INVALID_WEEKLY_PANEL', surface: 'panel' },
  ];
  const observed = [];

  for (const probe of probes) {
    const input = await temporaryDirectory(t, 'aula-04-phone-input-');
    const output = await temporaryDirectory(t, 'aula-04-phone-output-');
    await cp(EXAMPLE, input, { recursive: true });
    if (probe.surface === 'decision') {
      const file = path.join(input, 'previous-decision.json');
      const document = await readJson(file);
      document.hypothesis.text = `Contato ${probe.value}`;
      await writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
    } else {
      const file = path.join(input, 'weekly-panels.jsonl');
      const panels = (await readFile(file, 'utf8')).trimEnd().split('\n').map(JSON.parse);
      panels[0].reader.note = `Contato ${probe.value}`;
      await writeFile(file, `${panels.map(JSON.stringify).join('\n')}\n`);
    }
    const before = await snapshotDirectory(input);
    const result = await run([input, output]);
    observed.push({
      code: result.code,
      echoed: result.stderr.includes(probe.value),
      immutable: JSON.stringify(await snapshotDirectory(input)) === JSON.stringify(before),
      outputFiles: (await readdir(output)).sort(),
      stderr: result.stderr,
      stdoutEmpty: result.stdout === '',
    });
  }

  assert.deepEqual(observed, probes.map(({ expectedCode }) => ({
    code: 1,
    echoed: false,
    immutable: true,
    outputFiles: [],
    stderr: `${expectedCode}\n`,
    stdoutEmpty: true,
  })));
});

test('destino igual, descendente ou resolvido por symlink é rejeitado sem mutar o exemplo', async (t) => {
  const example = await temporaryDirectory(t, 'aula-04-contained-example-');
  await cp(EXAMPLE, example, { recursive: true });

  let before = await snapshotDirectory(example);
  let result = await run([example, example]);
  assert.equal(result.code, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'INVALID_OUTPUT\n');
  assert.deepEqual(await snapshotDirectory(example), before);

  const descendant = path.join(example, 'generated');
  await mkdir(descendant);
  before = await snapshotDirectory(example);
  result = await run([example, descendant]);
  assert.equal(result.code, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'INVALID_OUTPUT\n');
  assert.deepEqual(await snapshotDirectory(example), before);

  const missingDescendant = path.join(example, 'missing', 'leaf');
  before = await snapshotDirectory(example);
  result = await run([example, missingDescendant]);
  assert.equal(result.code, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'INVALID_OUTPUT\n');
  assert.deepEqual(await snapshotDirectory(example), before);

  const externalOutput = await temporaryDirectory(t, 'aula-04-external-output-');
  const insideLink = path.join(example, 'output-link');
  await symlink(externalOutput, insideLink, 'dir');
  before = await snapshotDirectory(example);
  result = await run([example, insideLink]);
  assert.equal(result.code, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'INVALID_OUTPUT\n');
  assert.deepEqual(await readdir(externalOutput), []);
  assert.deepEqual(await snapshotDirectory(example), before);

  const aliasParent = await temporaryDirectory(t, 'aula-04-alias-parent-');
  const outsideAlias = path.join(aliasParent, 'example-alias');
  await symlink(example, outsideAlias, 'dir');
  const aliasDestination = path.join(example, 'via-alias');
  await mkdir(aliasDestination);
  before = await snapshotDirectory(example);
  result = await run([example, path.join(outsideAlias, 'via-alias')]);
  assert.equal(result.code, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'INVALID_OUTPUT\n');
  assert.deepEqual(await snapshotDirectory(example), before);

  result = await run([example, path.join(outsideAlias, 'not-created', 'leaf')]);
  assert.equal(result.code, 2);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'INVALID_OUTPUT\n');
  assert.deepEqual(await snapshotDirectory(example), before);
});

test('runner falha fechado para uso, exemplo e destino inválidos sem ecoar paths', async (t) => {
  const empty = await temporaryDirectory(t, 'aula-04-empty-');
  const nonEmpty = await temporaryDirectory(t, 'aula-04-non-empty-');
  await writeFile(path.join(nonEmpty, 'sentinel.txt'), 'preserve\n');
  const invalid = await temporaryDirectory(t, 'aula-04-invalid-');
  await cp(EXAMPLE, invalid, { recursive: true });
  const panelsFile = path.join(invalid, 'weekly-panels.jsonl');
  const panels = (await readFile(panelsFile, 'utf8')).trimEnd().split('\n');
  panels[0] = panels[0].replace('"schemaVersion":"1.0.0"', '"schemaVersion":"9.9.9"');
  await writeFile(panelsFile, `${panels.join('\n')}\n`);
  const sensitive = await temporaryDirectory(t, 'aula-04-sensitive-');
  await cp(EXAMPLE, sensitive, { recursive: true });
  const sensitiveDecisionFile = path.join(sensitive, 'previous-decision.json');
  const sensitiveDecision = await readJson(sensitiveDecisionFile);
  sensitiveDecision.hypothesis.text = 'Contato privado aluno@example.invalid';
  await writeFile(sensitiveDecisionFile, `${JSON.stringify(sensitiveDecision, null, 2)}\n`);
  const sensitiveOutput = await temporaryDirectory(t, 'aula-04-sensitive-output-');

  const forged = await temporaryDirectory(t, 'aula-04-forged-');
  await cp(EXAMPLE, forged, { recursive: true });
  const forgedObservationsFile = path.join(forged, 'source-observations.json');
  const forgedObservations = await readJson(forgedObservationsFile);
  forgedObservations.observations.forEach((observation) => { observation.value = '1100'; });
  await writeFile(forgedObservationsFile, `${JSON.stringify(forgedObservations, null, 2)}\n`);
  const forgedExpectedFile = path.join(forged, 'expected-walkthrough.json');
  const forgedExpected = await readJson(forgedExpectedFile);
  forgedExpected.verdict = 'sustentou';
  forgedExpected.reasonCode = 'SUCCESS_CRITERION_MET';
  await writeFile(forgedExpectedFile, `${JSON.stringify(forgedExpected, null, 2)}\n`);
  const forgedOutput = await temporaryDirectory(t, 'aula-04-forged-output-');
  const cases = [
    [[], 2, 'USAGE'],
    [[path.join(empty, 'missing'), empty], 2, 'INVALID_EXAMPLE'],
    [[EXAMPLE, nonEmpty], 2, 'OUTPUT_NOT_EMPTY'],
    [[invalid, empty], 1, 'INVALID_WEEKLY_PANEL'],
    [[sensitive, sensitiveOutput], 1, 'INVALID_PREVIOUS_DECISION'],
    [[forged, forgedOutput], 1, 'UNEXPECTED_WALKTHROUGH_RESULT'],
  ];
  for (const [args, code, message] of cases) {
    const result = await run(args);
    assert.equal(result.code, code, message);
    assert.equal(result.stdout, '', message);
    assert.equal(result.stderr, `${message}\n`, message);
    assert.doesNotMatch(result.stderr, /\/Users\/|token|secret/i);
  }
  assert.equal(await readFile(path.join(nonEmpty, 'sentinel.txt'), 'utf8'), 'preserve\n');
  assert.deepEqual(await readdir(sensitiveOutput), []);
  assert.deepEqual(await readdir(forgedOutput), []);
});

test('templates cobrem os quatro contratos e runner não contém integração externa', async () => {
  const templates = [
    'aula-04/templates/weekly-ledger.yaml',
    'aula-04/templates/leitura-historica.yaml',
    'aula-04/templates/reconciliacao-fontes.yaml',
    'aula-04/templates/diagnostico-longitudinal.yaml',
  ];
  for (const template of templates) assert.ok((await readFile(path.join(ROOT, template), 'utf8')).length > 0, template);
  const runner = await readFile(SCRIPT, 'utf8');
  assert.doesNotMatch(runner, /child_process|fetch\s*\(|https?:\/\/|open\s+https?:|start\s+https?:/i);
  assert.doesNotMatch(runner, /meta.*(?:publish|pause|scale)|(?:publish|pause|scale).*meta/i);
});
