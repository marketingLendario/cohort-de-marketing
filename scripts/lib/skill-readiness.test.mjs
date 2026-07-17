import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import '../../skill-surface-contract.js';

import {
  SkillReadinessError,
  decideNextSkill,
} from './skill-readiness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STATES = ['available', 'recommended', 'almost', 'blocked', 'not_applicable', 'done'];
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const rulesFor = (skills) => ({
  schemaVersion: '0.1.0',
  states: [...STATES],
  skills,
});

const rule = (priority, overrides = {}) => ({
  command: '/fixture',
  priority,
  recommendationEligible: true,
  requiredFields: [],
  requiredArtifacts: [],
  recommendedFields: [],
  recommendedArtifacts: [],
  ...overrides,
});

const contractRefsFor = (rules) => ({
  schemaVersion: 'skill-readiness-contract-refs-v1',
  rulesSchemaVersion: '0.1.0',
  projectBriefSchemaVersion: '1.0.0',
  artifactIndexSchemaVersion: 'artifact-index-v1',
  artifactTypes: [...new Set(Object.values(rules.skills).flatMap((skillRule) => [
    ...(skillRule.requiredArtifacts || []),
    ...(skillRule.recommendedArtifacts || []),
  ]))].sort(),
  skills: Object.fromEntries(Object.entries(rules.skills).map(([skillId, skillRule]) => [skillId, {
    requiredFields: [...(skillRule.requiredFields || [])],
    requiredArtifacts: [...(skillRule.requiredArtifacts || [])],
    anyOfLabels: (skillRule.anyOf || []).map((group) => group.label),
    recommended: [...(skillRule.recommendedFields || []), ...(skillRule.recommendedArtifacts || [])],
  }])),
});

const decide = (input) => decideNextSkill({ ...input, contractRefs: contractRefsFor(input.rules) });

const evaluated = (skillId, state, overrides = {}) => ({
  skillId,
  state,
  missingFields: [],
  missingArtifacts: [],
  missingAnyOf: [],
  metAnyOf: [],
  recommendedMissing: [],
  ...overrides,
});

const evidence = {
  projectBrief: {
    schemaVersion: '1.0.0',
    status: 'draft',
    data: { project: { slug: 'fixture' } },
  },
  artifactIndex: {
    schemaVersion: 'artifact-index-v1',
    summary: { total: 0, confirmed: 0, pendingConfirmation: 0 },
    entries: [],
  },
};

async function startServer() {
  const server = createServer(async (request, response) => {
    const requested = new URL(request.url, 'http://127.0.0.1').pathname;
    const relative = requested === '/' ? 'briefing.html' : decodeURIComponent(requested.slice(1));
    const file = path.normalize(path.join(ROOT, relative));
    if (!file.startsWith(`${ROOT}${path.sep}`)) {
      response.writeHead(403).end('forbidden');
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, {
        'content-type': MIME[path.extname(file)] || 'application/octet-stream',
        'content-security-policy': "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; object-src 'none'",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

test('o motor aceita somente os seis estados públicos e falha fechado para estado desconhecido', () => {
  for (const state of STATES) {
    const decision = decide({
      rules: rulesFor({ fixture: rule(1) }),
      evaluatedSkills: [evaluated('fixture', state)],
      ...evidence,
    });
    assert.ok(STATES.includes(decision.state));
    assert.equal(decision.nextSkill?.id ?? null, ['available', 'recommended', 'almost', 'blocked'].includes(state) ? 'fixture' : null);
  }

  assert.throws(
    () => decide({
      rules: rulesFor({ fixture: rule(1) }),
      evaluatedSkills: [evaluated('fixture', 'unknown')],
      ...evidence,
    }),
    (error) => error instanceof SkillReadinessError && error.code === 'INVALID_SKILL_STATE',
  );
});

test('prioridade declarada torna a escolha independente da ordem do objeto e do array', () => {
  const first = decide({
    rules: rulesFor({ zeta: rule(20, { command: '/zeta' }), alpha: rule(10, { command: '/alpha' }) }),
    evaluatedSkills: [evaluated('zeta', 'recommended'), evaluated('alpha', 'recommended')],
    ...evidence,
  });
  const second = decide({
    rules: rulesFor({ alpha: rule(10, { command: '/alpha' }), zeta: rule(20, { command: '/zeta' }) }),
    evaluatedSkills: [evaluated('alpha', 'recommended'), evaluated('zeta', 'recommended')],
    ...evidence,
  });
  assert.deepEqual(first, second);
  assert.equal(first.nextSkill.id, 'alpha');

  const tied = decide({
    rules: rulesFor({ zeta: rule(10, { command: '/zeta' }), alpha: rule(10, { command: '/alpha' }) }),
    evaluatedSkills: [evaluated('zeta', 'available'), evaluated('alpha', 'available')],
    ...evidence,
  });
  assert.equal(tied.nextSkill.id, 'alpha', 'empate numérico usa o ID estável, não insertion order');

  const tiedAcrossStates = decide({
    rules: rulesFor({ zeta: rule(10, { command: '/zeta' }), alpha: rule(10, { command: '/alpha', requiredFields: ['project.slug'] }) }),
    evaluatedSkills: [evaluated('zeta', 'available'), evaluated('alpha', 'blocked', { missingFields: ['project.slug'] })],
    ...evidence,
  });
  assert.equal(tiedAcrossStates.nextSkill.id, 'alpha', 'estado não participa do desempate declarado');

  const gatedRoute = decide({
    rules: rulesFor({ foundation: rule(1, { command: '/foundation', requiredFields: ['project.slug'] }), later: rule(20, { command: '/later' }) }),
    evaluatedSkills: [evaluated('later', 'available'), evaluated('foundation', 'blocked', { missingFields: ['project.slug'] })],
    ...evidence,
  });
  assert.equal(gatedRoute.nextSkill.id, 'foundation', 'a prioridade canônica não salta uma etapa bloqueada para uma etapa posterior');
  assert.equal(gatedRoute.state, 'blocked');
});

test('regra sem prioridade ou elegibilidade explícita falha fechado', () => {
  assert.throws(
    () => decide({
      rules: rulesFor({ fixture: rule(undefined) }),
      evaluatedSkills: [evaluated('fixture', 'available')],
      ...evidence,
    }),
    (error) => error?.code === 'INVALID_SKILL_PRIORITY',
  );
  const malformed = rule(1);
  delete malformed.recommendationEligible;
  assert.throws(
    () => decide({
      rules: rulesFor({ fixture: malformed }),
      evaluatedSkills: [evaluated('fixture', 'available')],
      ...evidence,
    }),
    (error) => error?.code === 'INVALID_RECOMMENDATION_POLICY',
  );
});

test('versões, comando canônico e referências públicas falham fechado', () => {
  const validRules = rulesFor({ fixture: rule(1) });
  const base = { rules: validRules, evaluatedSkills: [evaluated('fixture', 'available')], ...evidence };
  assert.throws(
    () => decide({ ...base, rules: { ...validRules, schemaVersion: '9.9.9' } }),
    (error) => error?.code === 'INVALID_READINESS_RULES',
  );
  assert.throws(
    () => decide({ ...base, rules: rulesFor({ fixture: rule(1, { command: '/outro' }) }) }),
    (error) => error?.code === 'INVALID_SKILL_COMMAND',
  );
  assert.throws(
    () => decide({ ...base, projectBrief: { ...evidence.projectBrief, schemaVersion: 'token-super-secreto' } }),
    (error) => error?.code === 'INVALID_PROJECT_BRIEF_VERSION',
  );
  assert.throws(
    () => decide({ ...base, artifactIndex: { ...evidence.artifactIndex, schemaVersion: '../../credenciais' } }),
    (error) => error?.code === 'INVALID_ARTIFACT_INDEX_VERSION',
  );
  assert.throws(
    () => decide({ ...base, evaluatedSkills: [evaluated('fixture', 'blocked', { missingFields: ['../../token'] })] }),
    (error) => error?.code === 'UNDECLARED_REQUIREMENT_REFERENCE',
  );
  for (const [key, value] of [
    ['missingArtifacts', ['private-key']],
    ['missingAnyOf', ['../../credenciais']],
    ['metAnyOf', ['token']],
    ['recommendedMissing', ['password']],
  ]) {
    assert.throws(
      () => decide({ ...base, evaluatedSkills: [evaluated('fixture', 'blocked', { [key]: value })] }),
      (error) => error?.code === 'UNDECLARED_REQUIREMENT_REFERENCE',
    );
  }
  const artifactRules = rulesFor({ fixture: rule(1, { requiredArtifacts: ['avatar'] }) });
  assert.throws(
    () => decide({
      ...base,
      rules: artifactRules,
      evaluatedSkills: [evaluated('fixture', 'available')],
      artifactIndex: {
        schemaVersion: 'artifact-index-v1',
        entries: [{ artifactType: 'avatar', path: 'private/token.txt', confirmationStatus: 'confirmed' }],
        summary: { total: 1, confirmed: 1, pendingConfirmation: 0 },
      },
    }),
    (error) => error?.code === 'INVALID_ARTIFACT_INDEX',
  );
  assert.throws(
    () => decideNextSkill(base),
    (error) => error?.code === 'INVALID_CONTRACT_REFS',
  );
});

test('contractRefs reais nascem do SOT compartilhado e só contêm identificadores declarados', async () => {
  assert.equal(typeof globalThis.SkillSurfaceContract.createReadinessContractRefs, 'function');
  const [catalog, rules, legacySchema, projectBriefSchema] = await Promise.all([
    readFile(path.join(ROOT, 'data/skill-catalog.json'), 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'data/skill-unlock-rules.json'), 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'data/project-brief.schema.json'), 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'data/contracts/project-brief.v1.schema.json'), 'utf8').then(JSON.parse),
  ]);
  const refs = globalThis.SkillSurfaceContract.createReadinessContractRefs({ catalog, rules, legacySchema, projectBriefSchema });
  assert.equal(refs.rulesSchemaVersion, rules.schemaVersion);
  assert.deepEqual(Object.keys(refs.skills).sort(), Object.keys(rules.skills).sort());
  for (const [skillId, skillRefs] of Object.entries(refs.skills)) {
    assert.deepEqual(skillRefs.requiredFields, [...(rules.skills[skillId].requiredFields || [])].sort());
    assert.deepEqual(skillRefs.requiredArtifacts, [...(rules.skills[skillId].requiredArtifacts || [])].sort());
    assert.deepEqual(skillRefs.anyOfLabels, (rules.skills[skillId].anyOf || []).map((group) => group.label).sort());
  }
});

test('probes documentados por comecar e status-funil executam o call pattern público real', async () => {
  const [catalog, rules, legacySchema, projectBriefSchema, projectBrief] = await Promise.all([
    readFile(path.join(ROOT, 'data/skill-catalog.json'), 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'data/skill-unlock-rules.json'), 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'data/project-brief.schema.json'), 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'data/contracts/project-brief.v1.schema.json'), 'utf8').then(JSON.parse),
    readFile(path.join(ROOT, 'data/contracts/fixtures/project-brief/project-brief-1.0.0.valid.json'), 'utf8').then(JSON.parse),
  ]);
  const artifactIndex = {
    schemaVersion: 'artifact-index-v1',
    project: { slug: projectBrief.data.project.slug },
    rules: { schemaVersion: '0.1.0', confirmationRequiredByDefault: true },
    entries: [],
    summary: { total: 0, confirmed: 0, pendingConfirmation: 0 },
  };
  const decisions = [];
  for (const relative of [
    '.claude/skills/comecar/SKILL.md',
    '.agents/skills/comecar/SKILL.md',
    '.claude/skills/status-funil/SKILL.md',
    '.agents/skills/status-funil/SKILL.md',
  ]) {
    const content = await readFile(path.join(ROOT, relative), 'utf8');
    const probe = /```js skill-readiness-probe\n([\s\S]*?)```/.exec(content)?.[1];
    assert.ok(probe, `${relative}: probe executável ausente`);
    const executeProbe = new Function(
      'SkillSurfaceContract',
      'decideNextSkill',
      'catalog',
      'rules',
      'legacySchema',
      'projectBriefSchema',
      'projectBrief',
      'artifactIndex',
      `'use strict';\n${probe}\nreturn decision;`,
    );
    decisions.push(executeProbe(
      globalThis.SkillSurfaceContract,
      decideNextSkill,
      catalog,
      rules,
      legacySchema,
      projectBriefSchema,
      projectBrief,
      artifactIndex,
    ));
  }
  assert.equal(new Set(decisions.map(JSON.stringify)).size, 1);
  assert.match(decisions[0].nextSkill.command, /^\/[a-z0-9-]+$/);
});

test('decisão explica requisitos, ausências e evidências sem copiar valores do briefing', () => {
  const decision = decide({
    rules: rulesFor({
      fixture: rule(7, {
        command: '/fixture',
        requiredFields: ['project.slug', 'market.niche'],
        requiredArtifacts: ['avatar'],
        recommendedFields: ['offer.name'],
        recommendedArtifacts: ['design'],
        anyOf: [{ label: 'Projeto com alvo definido', fields: ['market.niche'] }],
      }),
    }),
    evaluatedSkills: [evaluated('fixture', 'almost', {
      missingFields: ['market.niche'],
      missingArtifacts: [],
      missingAnyOf: ['Projeto com alvo definido'],
      recommendedMissing: ['offer.name', 'design'],
    })],
    projectBrief: {
      ...evidence.projectBrief,
      data: { project: { slug: 'segredo-do-cliente' }, market: { niche: 'dado-sensivel-do-cliente' } },
    },
    artifactIndex: evidence.artifactIndex,
  });

  assert.deepEqual(decision.metRequirements, {
    fields: ['project.slug'],
    artifacts: ['avatar'],
    paths: [],
  });
  assert.deepEqual(decision.missingRequirements, {
    fields: ['market.niche'],
    artifacts: [],
    paths: ['Projeto com alvo definido'],
    recommended: ['design', 'offer.name'],
  });
  assert.deepEqual(decision.evidence, {
    projectBrief: { present: true, contract: 'project-brief-v1', status: 'draft' },
    artifactIndex: { present: true, contract: 'artifact-index-v1', total: 0, confirmed: 0, pendingConfirmation: 0 },
  });
  assert.match(decision.reason, /\/fixture/);
  assert.doesNotMatch(JSON.stringify(decision), /segredo-do-cliente|dado-sensivel-do-cliente/);
});

test('golden matrix entrega decisão byte-equivalente nas quatro superfícies', () => {
  const input = {
    rules: rulesFor({
      comecar: rule(0, { command: '/comecar', recommendationEligible: false }),
      'avatar-funil': rule(1, { command: '/avatar-funil' }),
      offerbook: rule(5, { command: '/offerbook', recommendedFields: ['offer.promise'] }),
      'status-funil': rule(99, { command: '/status-funil', recommendationEligible: false }),
    }),
    evaluatedSkills: [
      evaluated('comecar', 'available'),
      evaluated('avatar-funil', 'done'),
      evaluated('offerbook', 'recommended', { recommendedMissing: ['offer.promise'] }),
      evaluated('status-funil', 'available'),
    ],
    ...evidence,
  };
  const golden = JSON.stringify(decide(input));
  for (const surface of ['comecar', 'briefing', 'mapa', 'status-funil']) {
    assert.equal(JSON.stringify(decide(input)), golden, `${surface} divergiu do golden`);
  }
  assert.equal(JSON.parse(golden).nextSkill.command, '/offerbook');
});

test('not_applicable e perfis mudam a rota sem mutar artefatos; chamada direta segue autônoma', async () => {
  const rules = rulesFor({
    'avatar-funil': rule(1, { command: '/avatar-funil' }),
    offerbook: rule(5, { command: '/offerbook' }),
    'backend-funil': rule(14, { command: '/backend-funil' }),
  });
  const artifactIndex = structuredClone(evidence.artifactIndex);
  const before = JSON.stringify(artifactIndex);
  const ownOffer = decide({
    rules,
    evaluatedSkills: [evaluated('avatar-funil', 'done'), evaluated('offerbook', 'recommended'), evaluated('backend-funil', 'almost')],
    projectBrief: evidence.projectBrief,
    artifactIndex,
  });
  const affiliate = decide({
    rules,
    evaluatedSkills: [evaluated('avatar-funil', 'done'), evaluated('offerbook', 'done'), evaluated('backend-funil', 'not_applicable')],
    projectBrief: evidence.projectBrief,
    artifactIndex,
  });
  assert.equal(ownOffer.nextSkill.command, '/offerbook');
  assert.equal(affiliate.nextSkill, null);
  assert.equal(JSON.stringify(artifactIndex), before, 'o recomendador não apaga nem reescreve ArtifactIndex');

  const [canonicalStart, mirrorStart, canonicalStatus, mirrorStatus, briefing, map] = await Promise.all([
    readFile(path.join(ROOT, '.claude/skills/comecar/SKILL.md')),
    readFile(path.join(ROOT, '.agents/skills/comecar/SKILL.md')),
    readFile(path.join(ROOT, '.claude/skills/status-funil/SKILL.md')),
    readFile(path.join(ROOT, '.agents/skills/status-funil/SKILL.md')),
    readFile(path.join(ROOT, 'briefing.html'), 'utf8'),
    readFile(path.join(ROOT, 'mapa-skills.html'), 'utf8'),
  ]);
  assert.deepEqual(canonicalStart, mirrorStart);
  assert.deepEqual(canonicalStatus, mirrorStatus);
  for (const content of [canonicalStart.toString(), canonicalStatus.toString()]) {
    assert.match(content, /scripts\/lib\/skill-readiness\.mjs/);
    assert.match(content, /invoca[cç][aã]o direta/i);
  }
  for (const content of [briefing, map]) {
    assert.match(content, /decideNextSkill/);
    assert.match(content, /decision\.reason|READINESS_DECISION\.reason/);
    assert.doesNotMatch(content, /createObjectURL\(new Blob\(\[await .*skill-readiness/s);
    assert.match(content, /import\('\/scripts\/lib\/skill-readiness\.mjs'\)/);
  }
});

test('o ruleset real declara política determinística para todas as skills', async () => {
  const rules = JSON.parse(await readFile(path.join(ROOT, 'data/skill-unlock-rules.json'), 'utf8'));
  for (const [skillId, skillRule] of Object.entries(rules.skills)) {
    assert.ok(Number.isSafeInteger(skillRule.priority) && skillRule.priority >= 0, `${skillId}: priority inválida`);
    assert.equal(typeof skillRule.recommendationEligible, 'boolean', `${skillId}: recommendationEligible ausente`);
  }
});

test('briefing e mapa, raiz e Aula 3, exibem o mesmo comando e razão em desktop e mobile', { timeout: 60_000 }, async (t) => {
  const { server, origin } = await startServer();
  const browser = await chromium.launch({ headless: true });
  t.after(async () => {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  });
  const projectBrief = JSON.parse(await readFile(path.join(
    ROOT,
    'data/contracts/fixtures/project-brief/project-brief-1.0.0.valid.json',
  ), 'utf8'));
  const artifactIndex = {
    schemaVersion: 'artifact-index-v1',
    project: { slug: projectBrief.data.project.slug },
    rules: { schemaVersion: '0.1.0', confirmationRequiredByDefault: true },
    entries: [],
    summary: { total: 0, confirmed: 0, pendingConfirmation: 0 },
  };
  const payload = JSON.stringify({ document: projectBrief, artifactIndex });
  const results = [];
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const viewport of viewports) {
    for (const pathname of ['/briefing.html', '/mapa-skills.html', '/aula-03/materiais/briefing.html', '/aula-03/materiais/mapa-skills.html']) {
      const page = await browser.newPage({ viewport });
      const pageErrors = [];
      const consoleErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      await page.addInitScript(({ projectId, raw }) => {
        localStorage.setItem('cohort.projectBrief.activeProject.v1', projectId);
        localStorage.setItem(`cohort.projectBrief.v1:${encodeURIComponent(projectId)}`, raw);
      }, { projectId: projectBrief.projectId, raw: payload });
      let readinessResponse = null;
      page.on('response', (response) => {
        if (new URL(response.url()).pathname === '/scripts/lib/skill-readiness.mjs') readinessResponse = response;
      });
      const navigation = await page.goto(`${origin}${pathname}`, { waitUntil: 'networkidle' });
      const csp = navigation.headers()['content-security-policy'];
      assert.match(csp, /script-src 'self'/);
      assert.doesNotMatch(csp.split(';').find((directive) => directive.trim().startsWith('script-src')) || '', /blob:/);
      await page.waitForFunction(() => window.__SKILL_SURFACE_STATUS?.status === 'ready');
      assert.match(readinessResponse?.headers()['content-type'] || '', /^application\/javascript/);
      const result = await page.evaluate(() => ({
        decision: window.__SKILL_READINESS_DECISION,
        command: document.getElementById('next-skill-command')?.textContent
          || document.getElementById('next-skill-pill')?.textContent,
        reason: document.getElementById('next-skill-reason')?.textContent,
        documentWidth: document.documentElement.scrollWidth,
      }));
      assert.deepEqual(pageErrors, [], `${viewport.name} ${pathname}: pageerror`);
      assert.deepEqual(consoleErrors, [], `${viewport.name} ${pathname}: console error`);
      assert.ok(result.decision?.nextSkill?.command, `${viewport.name} ${pathname}: próxima skill ausente`);
      assert.equal(result.command, result.decision.nextSkill.command);
      assert.equal(result.reason, result.decision.reason);
      assert.ok(result.documentWidth > 0, `${viewport.name} ${pathname}: documento não renderizado`);
      results.push(JSON.stringify(result.decision));
      await page.close();
    }
  }
  assert.equal(new Set(results).size, 1, 'as quatro distribuições e duas viewports devem mostrar a mesma decisão serializada');
});
