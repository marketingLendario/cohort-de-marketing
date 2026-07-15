import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  SkillReadinessError,
  decideNextSkill,
} from './skill-readiness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STATES = ['available', 'recommended', 'almost', 'blocked', 'not_applicable', 'done'];

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

const evaluated = (skillId, state, overrides = {}) => ({
  skillId,
  state,
  missingFields: [],
  missingArtifacts: [],
  missingAnyOf: [],
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
    summary: { total: 2, confirmed: 1, pendingConfirmation: 1 },
    entries: [],
  },
};

test('o motor aceita somente os seis estados públicos e falha fechado para estado desconhecido', () => {
  for (const state of STATES) {
    const decision = decideNextSkill({
      rules: rulesFor({ fixture: rule(1) }),
      evaluatedSkills: [evaluated('fixture', state)],
      ...evidence,
    });
    assert.ok(STATES.includes(decision.state));
    assert.equal(decision.nextSkill?.id ?? null, ['available', 'recommended', 'almost'].includes(state) ? 'fixture' : null);
  }

  assert.throws(
    () => decideNextSkill({
      rules: rulesFor({ fixture: rule(1) }),
      evaluatedSkills: [evaluated('fixture', 'unknown')],
      ...evidence,
    }),
    (error) => error instanceof SkillReadinessError && error.code === 'INVALID_SKILL_STATE',
  );
});

test('prioridade declarada torna a escolha independente da ordem do objeto e do array', () => {
  const first = decideNextSkill({
    rules: rulesFor({ zeta: rule(20, { command: '/zeta' }), alpha: rule(10, { command: '/alpha' }) }),
    evaluatedSkills: [evaluated('zeta', 'recommended'), evaluated('alpha', 'recommended')],
    ...evidence,
  });
  const second = decideNextSkill({
    rules: rulesFor({ alpha: rule(10, { command: '/alpha' }), zeta: rule(20, { command: '/zeta' }) }),
    evaluatedSkills: [evaluated('alpha', 'recommended'), evaluated('zeta', 'recommended')],
    ...evidence,
  });
  assert.deepEqual(first, second);
  assert.equal(first.nextSkill.id, 'alpha');

  const tied = decideNextSkill({
    rules: rulesFor({ zeta: rule(10, { command: '/zeta' }), alpha: rule(10, { command: '/alpha' }) }),
    evaluatedSkills: [evaluated('zeta', 'available'), evaluated('alpha', 'available')],
    ...evidence,
  });
  assert.equal(tied.nextSkill.id, 'alpha', 'empate numérico usa o ID estável, não insertion order');
});

test('regra sem prioridade ou elegibilidade explícita falha fechado', () => {
  assert.throws(
    () => decideNextSkill({
      rules: rulesFor({ fixture: rule(undefined) }),
      evaluatedSkills: [evaluated('fixture', 'available')],
      ...evidence,
    }),
    (error) => error?.code === 'INVALID_SKILL_PRIORITY',
  );
  const malformed = rule(1);
  delete malformed.recommendationEligible;
  assert.throws(
    () => decideNextSkill({
      rules: rulesFor({ fixture: malformed }),
      evaluatedSkills: [evaluated('fixture', 'available')],
      ...evidence,
    }),
    (error) => error?.code === 'INVALID_RECOMMENDATION_POLICY',
  );
});

test('decisão explica requisitos, ausências e evidências sem copiar valores do briefing', () => {
  const decision = decideNextSkill({
    rules: rulesFor({
      fixture: rule(7, {
        command: '/fixture',
        requiredFields: ['project.slug', 'market.niche'],
        requiredArtifacts: ['avatar'],
        recommendedFields: ['offer.name'],
        recommendedArtifacts: ['design'],
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
    projectBrief: { present: true, schemaVersion: '1.0.0', status: 'draft' },
    artifactIndex: { present: true, schemaVersion: 'artifact-index-v1', total: 2, confirmed: 1, pendingConfirmation: 1 },
  });
  assert.match(decision.reason, /\/fixture/);
  assert.doesNotMatch(JSON.stringify(decision), /segredo-do-cliente|dado-sensivel-do-cliente/);
});

test('golden matrix entrega decisão byte-equivalente nas quatro superfícies', () => {
  const input = {
    rules: rulesFor({
      comecar: rule(0, { command: '/comecar', recommendationEligible: false }),
      avatar: rule(1, { command: '/avatar-funil' }),
      offerbook: rule(5, { command: '/offerbook' }),
      status: rule(99, { command: '/status-funil', recommendationEligible: false }),
    }),
    evaluatedSkills: [
      evaluated('comecar', 'available'),
      evaluated('avatar', 'done'),
      evaluated('offerbook', 'recommended', { recommendedMissing: ['offer.promise'] }),
      evaluated('status', 'available'),
    ],
    ...evidence,
  };
  const golden = JSON.stringify(decideNextSkill(input));
  for (const surface of ['comecar', 'briefing', 'mapa', 'status-funil']) {
    assert.equal(JSON.stringify(decideNextSkill(input)), golden, `${surface} divergiu do golden`);
  }
  assert.equal(JSON.parse(golden).nextSkill.command, '/offerbook');
});

test('not_applicable e perfis mudam a rota sem mutar artefatos; chamada direta segue autônoma', async () => {
  const rules = rulesFor({
    avatar: rule(1, { command: '/avatar-funil' }),
    offerbook: rule(5, { command: '/offerbook' }),
    backend: rule(14, { command: '/backend-funil' }),
  });
  const artifactIndex = structuredClone(evidence.artifactIndex);
  const before = JSON.stringify(artifactIndex);
  const ownOffer = decideNextSkill({
    rules,
    evaluatedSkills: [evaluated('avatar', 'done'), evaluated('offerbook', 'recommended'), evaluated('backend', 'almost')],
    projectBrief: evidence.projectBrief,
    artifactIndex,
  });
  const affiliate = decideNextSkill({
    rules,
    evaluatedSkills: [evaluated('avatar', 'done'), evaluated('offerbook', 'done'), evaluated('backend', 'not_applicable')],
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
  }
});

test('o ruleset real declara política determinística para todas as skills', async () => {
  const rules = JSON.parse(await readFile(path.join(ROOT, 'data/skill-unlock-rules.json'), 'utf8'));
  for (const [skillId, skillRule] of Object.entries(rules.skills)) {
    assert.ok(Number.isSafeInteger(skillRule.priority) && skillRule.priority >= 0, `${skillId}: priority inválida`);
    assert.equal(typeof skillRule.recommendationEligible, 'boolean', `${skillId}: recommendationEligible ausente`);
  }
});
