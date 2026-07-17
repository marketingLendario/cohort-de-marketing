#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createProjectBriefValidators } from './migrate-project-brief.mjs';

const ROOT = process.cwd();
const RULES_PATH = join(ROOT, 'data/skill-unlock-rules.json');
const SKILLS_DIR = join(ROOT, '.claude/skills');
const FIXTURES_DIR = join(ROOT, 'data/contracts/fixtures/project-brief');

function fail(message) {
  console.error(`✖ ${message}`);
  process.exitCode = 1;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`JSON inválido em ${path}: ${error.message}`);
    return null;
  }
}

function collectRuleFields(rule) {
  const fields = new Set();
  const add = (value) => {
    if (!value) return;
    if (Array.isArray(value)) value.forEach(add);
    else if (typeof value === 'string') fields.add(value);
  };

  add(rule.requiredFields);
  add(rule.recommendedFields);
  for (const group of rule.anyOf ?? []) add(group.fields);
  for (const condition of rule.notApplicableWhen ?? []) add(condition.field);
  for (const group of rule.anyOf ?? []) {
    for (const field of Object.keys(group.matches ?? {})) add(field);
  }
  return fields;
}

function main() {
  const rules = readJson(RULES_PATH);
  if (!rules) return;

  let validators;
  try {
    validators = createProjectBriefValidators();
  } catch (error) {
    fail(`Schemas ProjectBrief não compilam em AJV 2020: ${error.message}`);
    return;
  }

  const schemaFields = validators.fieldPaths;
  const ruleSkills = new Set(Object.keys(rules.skills ?? {}));
  const canonicalSkills = new Set(
    readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== '_shared')
      .filter((entry) => existsSync(join(SKILLS_DIR, entry.name, 'SKILL.md')))
      .map((entry) => entry.name),
  );

  for (const skill of canonicalSkills) {
    if (!ruleSkills.has(skill)) fail(`Skill canônica sem regra: ${skill}`);
  }

  for (const skill of ruleSkills) {
    if (!canonicalSkills.has(skill)) fail(`Regra aponta para skill inexistente: ${skill}`);
  }

  const artifactKeys = new Set(Object.keys(rules.artifactGlobs ?? {}));
  for (const [skill, rule] of Object.entries(rules.skills ?? {})) {
    for (const field of collectRuleFields(rule)) {
      if (!schemaFields.has(field)) fail(`${skill}: campo inexistente no schema: ${field}`);
    }

    const artifactRefs = [
      ...(rule.primaryArtifacts ?? []),
      ...(rule.requiredArtifacts ?? []),
      ...(rule.recommendedArtifacts ?? []),
      ...((rule.anyOf ?? []).flatMap((group) => group.artifacts ?? [])),
    ];
    for (const artifact of artifactRefs) {
      if (!artifactKeys.has(artifact)) fail(`${skill}: artifact inexistente em artifactGlobs: ${artifact}`);
    }
  }

  const fixtureChecks = [
    ['legacy-0.1.0.valid.json', validators.validateLegacy, true],
    ['relative-source-path.valid.json', validators.validateLegacy, true],
    ['project-brief-1.0.0.valid.json', validators.validateV1, true],
    ['critical-field.invalid.json', validators.validateLegacy, false],
    ['unknown-version.invalid.json', validators.validateLegacy, false],
  ];
  for (const [name, validate, expected] of fixtureChecks) {
    const document = readJson(join(FIXTURES_DIR, name));
    if (document && validate(document) !== expected) {
      fail(`Fixture ${name} deveria ser ${expected ? 'válida' : 'inválida'} no schema compilado.`);
    }
  }

  if (!process.exitCode) {
    console.log(`✓ Project brief rules OK: ${schemaFields.size} campos, ${ruleSkills.size} skills, schemas AJV 2020 compilados`);
  }
}

main();
