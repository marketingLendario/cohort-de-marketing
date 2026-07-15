import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path, { extname, normalize } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFile(path.join(ROOT, relative), 'utf8');
const json = async (relative) => JSON.parse(await read(relative));

async function loadContract() {
  const code = await read('skill-surface-contract.js');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { filename: 'skill-surface-contract.js' });
  assert.ok(sandbox.window.SkillSurfaceContract, 'SkillSurfaceContract precisa ser publicado pela distribuição');
  return sandbox.window.SkillSurfaceContract;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function surfaceInputs() {
  return {
    catalog: await json('data/skill-catalog.json'),
    rules: await json('data/skill-unlock-rules.json'),
    legacySchema: await json('data/project-brief.schema.json'),
    projectBriefSchema: await json('data/contracts/project-brief.v1.schema.json'),
  };
}

test('catálogo e regras formam um contrato único e completo das superfícies', async () => {
  const contract = await loadContract();
  const inputs = await surfaceInputs();
  const { catalog } = inputs;
  const result = contract.validateContracts(inputs);

  assert.equal(result.skills.length, catalog.skills.length);
  assert.deepEqual([...result.skills.map((skill) => skill.id)], catalog.skills.map((skill) => skill.id));
  assert.deepEqual([...result.edges.map(({ from, to, type }) => `${from}:${to}:${type}`)], catalog.edges.map(({ from, to, type }) => `${from}:${to}:${type}`));
});

test('inserir ou remover fixture muda a lista derivada sem literal de contagem', async () => {
  const contract = await loadContract();
  const inputs = await surfaceInputs();
  const { catalog, rules } = inputs;
  const insertedCatalog = clone(catalog);
  const insertedRules = clone(rules);
  insertedCatalog.skills.push({
    ...clone(catalog.skills.at(-1)),
    id: 'fixture-skill',
    title: 'fixture-skill',
    command: '/fixture-skill',
    skillPath: '.claude/skills/fixture-skill/SKILL.md',
    feeds: [],
  });
  insertedRules.skills['fixture-skill'] = {
    ...clone(rules.skills[catalog.skills.at(-1).id]),
    command: '/fixture-skill',
  };
  assert.equal(contract.validateContracts({ ...inputs, catalog: insertedCatalog, rules: insertedRules }).skills.length, catalog.skills.length + 1);

  const removedId = catalog.skills.at(-1).id;
  const removedCatalog = clone(catalog);
  const removedRules = clone(rules);
  removedCatalog.skills = removedCatalog.skills.filter((skill) => skill.id !== removedId);
  removedCatalog.edges = removedCatalog.edges.filter((edge) => edge.from !== removedId && edge.to !== removedId);
  delete removedRules.skills[removedId];
  assert.equal(contract.validateContracts({ ...inputs, catalog: removedCatalog, rules: removedRules }).skills.length, catalog.skills.length - 1);
});

test('divergência de skill, edge, requisito ou ArtifactIndex falha fechado', async () => {
  const contract = await loadContract();
  const inputs = await surfaceInputs();
  const { catalog, rules } = inputs;

  const cases = [
    [() => { const c = clone(catalog); c.edges.push({ from: 'orfa', to: c.skills[0].id, type: 'dependency' }); return [c, clone(rules)]; }, 'CATALOG_ORPHAN_EDGE'],
    [() => { const r = clone(rules); delete r.skills[catalog.skills[0].id]; return [clone(catalog), r]; }, 'SURFACE_ID_MISMATCH'],
    [() => { const r = clone(rules); r.skills[catalog.skills[0].id].requiredArtifacts = ['orfa']; return [clone(catalog), r]; }, 'RULE_ORPHAN_ARTIFACT'],
  ];

  for (const [fixture, code] of cases) {
    const [candidateCatalog, candidateRules] = fixture();
    assert.throws(() => contract.validateContracts({ ...inputs, catalog: candidateCatalog, rules: candidateRules }), (error) => error?.code === code);
  }

  assert.throws(
    () => contract.evaluateSkills({ ...inputs, projectBrief: {}, artifactIndex: { schemaVersion: 'errado', entries: [] } }),
    (error) => error?.code === 'INVALID_ARTIFACT_INDEX',
  );
});

test('campos e artefatos órfãos, inclusive anyOf e notApplicableWhen, falham fechado', async () => {
  const contract = await loadContract();
  const inputs = await surfaceInputs();
  const cases = [
    (rules) => { rules.skills.comecar.requiredFields = ['project.inexistente']; },
    (rules) => { rules.skills.comecar.anyOf = [{ label: 'órfão', fields: ['market.inexistente'] }]; },
    (rules) => { rules.skills.comecar.anyOf = [{ label: 'órfão', artifacts: ['artifactInexistente'] }]; },
    (rules) => { rules.skills.comecar.notApplicableWhen = [{ field: 'offer.inexistente', equals: true, reason: 'fixture' }]; },
  ];
  for (const mutate of cases) {
    const rules = clone(inputs.rules);
    mutate(rules);
    assert.throws(
      () => contract.validateContracts({ ...inputs, rules }),
      (error) => ['RULE_ORPHAN_FIELD', 'RULE_ORPHAN_ARTIFACT'].includes(error?.code),
    );
  }
});

test('regras oficiais passam e 35 fixtures condicionais adversariais falham fechado', async () => {
  const contract = await loadContract();
  const inputs = await surfaceInputs();
  assert.doesNotThrow(() => contract.validateContracts(inputs));
  const setAnyOf = (value) => (rules) => { rules.skills['avatar-funil'].anyOf = value; };
  const setNotApplicable = (value) => (rules) => { rules.skills.offerbook.notApplicableWhen = value; };
  const fixtures = [
    ['anyOf não-array', setAnyOf('inválido')],
    ['anyOf vazio', setAnyOf([])],
    ['grupo nulo', setAnyOf([null])],
    ['label ausente', setAnyOf([{ fields: ['project.slug'] }])],
    ['label vazio', setAnyOf([{ label: '', fields: ['project.slug'] }])],
    ['label em branco', setAnyOf([{ label: '   ', fields: ['project.slug'] }])],
    ['restrição ausente', setAnyOf([{ label: 'vazio' }])],
    ['fields não-array', setAnyOf([{ label: 'x', fields: 'project.slug' }])],
    ['fields vazio', setAnyOf([{ label: 'x', fields: [] }])],
    ['field vazio', setAnyOf([{ label: 'x', fields: [''] }])],
    ['field órfão', setAnyOf([{ label: 'x', fields: ['project.inexistente'] }])],
    ['artifacts não-array', setAnyOf([{ label: 'x', artifacts: 'avatar' }])],
    ['artifacts vazio', setAnyOf([{ label: 'x', artifacts: [] }])],
    ['artifact vazio', setAnyOf([{ label: 'x', artifacts: [''] }])],
    ['artifact órfão', setAnyOf([{ label: 'x', artifacts: ['inexistente'] }])],
    ['matches string', setAnyOf([{ label: 'x', matches: 'project.slug' }])],
    ['matches array', setAnyOf([{ label: 'x', matches: [] }])],
    ['matches objeto vazio', setAnyOf([{ label: 'x', matches: {} }])],
    ['match field órfão', setAnyOf([{ label: 'x', matches: { 'project.inexistente': 'x' } }])],
    ['match string vazia', setAnyOf([{ label: 'x', matches: { 'project.slug': '' } }])],
    ['match array vazia', setAnyOf([{ label: 'x', matches: { 'project.slug': [] } }])],
    ['match array inválida', setAnyOf([{ label: 'x', matches: { 'project.slug': [{}] } }])],
    ['match objeto', setAnyOf([{ label: 'x', matches: { 'project.slug': {} } }])],
    ['grupo com chave extra', setAnyOf([{ label: 'x', fields: ['project.slug'], unexpected: true }])],
    ['notApplicable não-array', setNotApplicable('inválido')],
    ['notApplicable vazio', setNotApplicable([])],
    ['condição nula', setNotApplicable([null])],
    ['equals e in juntos', setNotApplicable([{ field: 'project.startingPoint', equals: 'sem-projeto', in: ['sem-projeto'], reason: 'x' }])],
    ['predicado ausente', setNotApplicable([{ field: 'project.startingPoint', reason: 'x' }])],
    ['in vazio', setNotApplicable([{ field: 'project.startingPoint', in: [], reason: 'x' }])],
    ['in com valor inválido', setNotApplicable([{ field: 'project.startingPoint', in: [{}], reason: 'x' }])],
    ['reason vazio', setNotApplicable([{ field: 'project.startingPoint', equals: 'sem-projeto', reason: '   ' }])],
    ['equals array', setNotApplicable([{ field: 'project.startingPoint', equals: ['sem-projeto'], reason: 'x' }])],
    ['in aninhado', setNotApplicable([{ field: 'project.startingPoint', in: [['sem-projeto']], reason: 'x' }])],
    ['in misto', setNotApplicable([{ field: 'project.startingPoint', in: ['sem-projeto', ['afiliado']], reason: 'x' }])],
  ];
  assert.equal(fixtures.length, 35);
  for (const [label, mutate] of fixtures) {
    const rules = clone(inputs.rules);
    mutate(rules);
    assert.throws(
      () => contract.evaluateSkills({ ...inputs, rules, projectBrief: null, artifactIndex: null }),
      (error) => ['INVALID_UNLOCK_RULES', 'RULE_ORPHAN_FIELD', 'RULE_ORPHAN_ARTIFACT'].includes(error?.code),
      label,
    );
  }
});

test('estado é derivado de ProjectBrief v1 e ArtifactIndex confirmado', async () => {
  const contract = await loadContract();
  const inputs = await surfaceInputs();
  const { catalog, rules } = inputs;
  const projectBrief = await json('data/contracts/fixtures/project-brief/project-brief-1.0.0.valid.json');
  const artifactIndex = {
    schemaVersion: 'artifact-index-v1',
    project: { slug: projectBrief.data.project.slug },
    rules: { schemaVersion: String(rules.schemaVersion), confirmationRequiredByDefault: true },
    entries: [{
      artifactType: 'avatar',
      path: 'avatar.md',
      sha256: 'a'.repeat(64),
      sizeBytes: 1,
      origin: { kind: 'declared_glob', rule: 'artifactGlobs.avatar', patterns: ['avatar.md'] },
      confirmationStatus: 'confirmed',
      satisfiesCriticalRequirement: true,
    }],
    summary: { total: 1, confirmed: 1, pendingConfirmation: 0 },
  };
  const evaluated = contract.evaluateSkills({ ...inputs, projectBrief, artifactIndex });
  assert.deepEqual([...evaluated.map((item) => item.skillId)], catalog.skills.map((skill) => skill.id));
  assert.equal(evaluated.find((item) => item.skillId === 'avatar-funil').state, 'done');
  assert.ok(evaluated.every((item) => rules.states.includes(item.state)));
});

test('ProjectBrief e ArtifactIndex persistidos usam os contratos completos e exatos', async () => {
  const contract = await loadContract();
  const inputs = await surfaceInputs();
  const projectBrief = await json('data/contracts/fixtures/project-brief/project-brief-1.0.0.valid.json');
  const baseIndex = {
    schemaVersion: 'artifact-index-v1',
    project: { slug: projectBrief.data.project.slug },
    rules: { schemaVersion: inputs.rules.schemaVersion, confirmationRequiredByDefault: true },
    entries: [{
      artifactType: 'avatar', path: 'avatar.md', sha256: 'a'.repeat(64), sizeBytes: 1,
      origin: { kind: 'declared_glob', rule: 'artifactGlobs.avatar', patterns: ['avatar.md'] },
      confirmationStatus: 'confirmed', satisfiesCriticalRequirement: true,
    }],
    summary: { total: 1, confirmed: 1, pendingConfirmation: 0 },
  };
  const indexMutations = [
    (index) => { index.rules.schemaVersion = '9.9.9'; },
    (index) => { index.entries[0].sha256 = 'forjado'; },
    (index) => { index.entries[0].origin.patterns = ['relatorio-avatar.md']; },
    (index) => { index.entries.push(clone(index.entries[0])); index.summary = { total: 2, confirmed: 2, pendingConfirmation: 0 }; },
  ];
  for (const mutate of indexMutations) {
    const artifactIndex = clone(baseIndex);
    mutate(artifactIndex);
    assert.throws(() => contract.evaluateSkills({ ...inputs, projectBrief, artifactIndex }), (error) => error?.code === 'INVALID_ARTIFACT_INDEX');
  }

  const invalidBrief = clone(projectBrief);
  invalidBrief.schemaVersion = '9.9.9';
  assert.throws(() => contract.evaluateSkills({ ...inputs, projectBrief: invalidBrief, artifactIndex: null }), (error) => error?.code === 'INVALID_PROJECT_BRIEF');
});

test('mapa revalida localStorage e não renderiza done para índice forjado', { timeout: 30_000 }, async (t) => {
  const server = createServer(async (request, response) => {
    const requested = new URL(request.url, 'http://127.0.0.1').pathname;
    const file = normalize(path.join(ROOT, decodeURIComponent(requested.slice(1))));
    if (!file.startsWith(`${ROOT}${path.sep}`)) return response.writeHead(403).end('forbidden');
    try {
      const body = await readFile(file);
      const type = extname(file) === '.json' ? 'application/json'
        : extname(file) === '.js' ? 'text/javascript'
          : extname(file) === '.mjs' ? 'application/javascript'
            : 'text/html';
      response.writeHead(200, { 'content-type': type }).end(body);
    } catch {
      response.writeHead(404).end('not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  t.after(async () => {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const document = await json('data/contracts/fixtures/project-brief/project-brief-1.0.0.valid.json');
  const saved = {
    document,
    artifacts: { avatar: true },
    artifactIndex: {
      schemaVersion: 'artifact-index-v1',
      project: { slug: document.data.project.slug },
      rules: { schemaVersion: '0.1.0', confirmationRequiredByDefault: true },
      entries: [{
        artifactType: 'avatar', path: 'avatar.md', sha256: 'forjado', sizeBytes: 1,
        origin: { kind: 'declared_glob', rule: 'artifactGlobs.avatar', patterns: ['avatar.md'] },
        confirmationStatus: 'confirmed', satisfiesCriticalRequirement: true,
      }],
      summary: { total: 1, confirmed: 1, pendingConfirmation: 0 },
    },
    ui: { activeStep: 'review' },
  };
  for (const pathname of ['/mapa-skills.html', '/aula-03/materiais/mapa-skills.html']) {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.route('**/*', (route) => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    await page.addInitScript((payload) => {
      localStorage.setItem('cohort.projectBrief.activeProject.v1', payload.document.projectId);
      localStorage.setItem(`cohort.projectBrief.v1:${encodeURIComponent(payload.document.projectId)}`, JSON.stringify(payload));
    }, saved);
    await page.goto(`${origin}${pathname}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__SKILL_SURFACE_STATUS?.status !== 'loading');
    assert.equal(await page.evaluate(() => window.__SKILL_SURFACE_STATUS.code), 'INVALID_ARTIFACT_INDEX');
    assert.equal(await page.locator('.flow-node.state-done').count(), 0);
    assert.deepEqual(pageErrors, []);
    await page.close();
  }

  const invalidRules = clone((await surfaceInputs()).rules);
  invalidRules.skills.offerbook.notApplicableWhen = [{
    field: 'project.startingPoint',
    in: ['sem-projeto', ['afiliado']],
    reason: 'predicado aninhado',
  }];
  for (const pathname of ['/mapa-skills.html', '/aula-03/materiais/mapa-skills.html']) {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.route('**/*', (route) => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    await page.route('**/data/skill-unlock-rules.json', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(invalidRules),
    }));
    await page.goto(`${origin}${pathname}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__SKILL_SURFACE_STATUS?.status !== 'loading');
    assert.equal(await page.evaluate(() => window.__SKILL_SURFACE_STATUS.code), 'INVALID_UNLOCK_RULES');
    assert.equal(await page.evaluate(() => window.__SKILL_SURFACE_DATA), undefined);
    assert.equal(await page.locator('.state-available, .state-recommended, .state-done').count(), 0);
    assert.deepEqual(pageErrors, []);
    await page.close();
  }
});

test('HTMLs consomem contratos por fetch e não mantêm banco de skills ou edges', async () => {
  for (const relative of ['briefing.html', 'mapa-skills.html', 'aula-03/materiais/briefing.html', 'aula-03/materiais/mapa-skills.html']) {
    const html = await read(relative);
    assert.match(html, /fetch\(['"]\/data\/skill-catalog\.json['"]\)/);
    assert.match(html, /fetch\(['"]\/data\/skill-unlock-rules\.json['"]\)/);
    assert.doesNotMatch(html, /const\s+SKILLS\s*=\s*\[/);
    assert.doesNotMatch(html, /const\s+FLOW_EDGES\s*=\s*\[/);
    assert.match(html, /skill-surface-contract\.js/);
    assert.doesNotMatch(html, /\b(?:31|25)\s+skills\b|>\s*25\s*</i);
  }
  for (const relative of ['mapa-skills-artifacts.js', 'aula-03/materiais/mapa-skills-artifacts.js', 'scripts/validate-skill-catalog.mjs']) {
    assert.doesNotMatch(await read(relative), /\b(?:31|25)\s+skills\b|25\/25|length\s*===\s*31/i);
  }
});

test('distribuições raiz e aula-03 permanecem byte a byte equivalentes', async () => {
  for (const relative of ['briefing.html', 'mapa-skills.html', 'mapa-skills-artifacts.js']) {
    const rootBytes = await readFile(path.join(ROOT, relative));
    const aulaBytes = await readFile(path.join(ROOT, 'aula-03', 'materiais', relative));
    assert.ok(rootBytes.equals(aulaBytes), `${relative} divergiu da cópia distribuída`);
  }
});
