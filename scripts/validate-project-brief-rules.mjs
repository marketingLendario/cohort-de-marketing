#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCHEMA_PATH = join(ROOT, 'data/project-brief.schema.json');
const RULES_PATH = join(ROOT, 'data/skill-unlock-rules.json');
const SKILLS_DIR = join(ROOT, '.claude/skills');

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

function getSchemaFieldPaths(schema) {
  const fields = new Set();
  const walk = (prefix, def) => {
    for (const [fieldName, fieldDef] of Object.entries(def.properties ?? {})) {
      const path = prefix ? `${prefix}.${fieldName}` : fieldName;
      fields.add(path);
      if (fieldDef?.type === 'object' && fieldDef.properties) {
        walk(path, fieldDef);
      }
    }
  };

  for (const [groupName, groupDef] of Object.entries(schema.properties ?? {})) {
    if (!groupDef || groupDef.type !== 'object' || !groupDef.properties) continue;
    walk(groupName, groupDef);
  }
  return fields;
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
  const schema = readJson(SCHEMA_PATH);
  const rules = readJson(RULES_PATH);
  if (!schema || !rules) return;

  const schemaFields = getSchemaFieldPaths(schema);
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

  if (!process.exitCode) {
    console.log(`✓ Project brief rules OK: ${schemaFields.size} campos, ${ruleSkills.size} skills`);
  }
}

main();
