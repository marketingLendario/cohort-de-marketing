import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LEGACY_VERSION = '0.1.0';
const CURRENT_VERSION = '1.0.0';
const MIGRATION_EPOCH = '1970-01-01T00:00:00.000Z';
const V1_SOURCES = new Set(['user', 'artifact', 'inferred', 'migration']);
const LEGACY_SCHEMA_PATH = new URL('../data/project-brief.schema.json', import.meta.url);
const V1_SCHEMA_PATH = new URL('../data/contracts/project-brief.v1.schema.json', import.meta.url);
const ANNOTATION_KEYWORDS = ['x-step', 'x-control', 'x-sensitive', 'x-unit', 'x-steps'];
const SENSITIVE_REFERENCE_TOKENS = new Set([
  'credential',
  'credentials',
  'credencial',
  'credenciais',
  'env',
  'password',
  'passwords',
  'private',
  'privado',
  'secret',
  'secrets',
  'segredo',
  'segredos',
  'senha',
  'senhas',
  'token',
  'tokens',
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readJson(url) {
  return JSON.parse(readFileSync(url, 'utf8'));
}

function canonicalFieldPaths(schema) {
  const fields = new Set();
  const walk = (prefix, definition) => {
    for (const [name, child] of Object.entries(definition.properties ?? {})) {
      const path = prefix ? `${prefix}.${name}` : name;
      fields.add(path);
      if (child?.type === 'object' && child.properties) walk(path, child);
    }
  };
  for (const [group, definition] of Object.entries(schema.properties ?? {})) {
    if (definition?.type === 'object' && definition.properties) walk(group, definition);
  }
  return fields;
}

function hasPortableReferenceSegments(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 256) return false;
  if (value.startsWith('/') || /^[A-Za-z]:\//.test(value)) return false;
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) return false;

  const segments = value.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return false;
  for (const segment of segments) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment)) return false;
    const tokens = segment.toLowerCase().split(/[._-]+/);
    if (tokens.some((token) => SENSITIVE_REFERENCE_TOKENS.has(token))) return false;
  }
  return true;
}

function isPortableArtifactReference(value) {
  return typeof value === 'string'
    && !value.includes('\\')
    && hasPortableReferenceSegments(value);
}

function isPortableLegacySourcePath(value) {
  return typeof value === 'string'
    && hasPortableReferenceSegments(value.replaceAll('\\', '/'));
}

export function normalizePortableArtifactReference(value) {
  if (!isPortableLegacySourcePath(value)) {
    throw new Error('Artifact reference must be a portable relative reference.');
  }
  return value.replaceAll('\\', '/');
}

export function createProjectBriefValidators() {
  const legacySchema = readJson(LEGACY_SCHEMA_PATH);
  const v1Schema = readJson(V1_SCHEMA_PATH);
  const fieldPaths = canonicalFieldPaths(legacySchema);
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: true,
  });
  addFormats(ajv);
  for (const keyword of ANNOTATION_KEYWORDS) ajv.addKeyword({ keyword });
  ajv.addFormat('canonical-field-path', {
    type: 'string',
    validate: (path) => fieldPaths.has(path),
  });
  ajv.addFormat('portable-artifact-reference', {
    type: 'string',
    validate: isPortableArtifactReference,
  });
  ajv.addFormat('portable-legacy-source-path', {
    type: 'string',
    validate: isPortableLegacySourcePath,
  });
  ajv.addSchema(legacySchema);
  const validateLegacy = ajv.getSchema(legacySchema.$id);
  const validateV1 = ajv.compile(v1Schema);
  return { ajv, fieldPaths, legacySchema, v1Schema, validateLegacy, validateV1 };
}

const validators = createProjectBriefValidators();

function validationDetails(errors) {
  return (errors ?? [])
    .map((error) => `${error.instancePath || '/'} ${error.message}`)
    .join('; ');
}

function assertValid(validate, document, label) {
  if (!validate(document)) {
    throw new Error(`${label} validation failed: ${validationDetails(validate.errors)}`);
  }
}

function normalizedMigrationResult(input, options) {
  if (isPlainObject(input.document)) {
    assertValid(validators.validateV1, input.document, 'ProjectBrief v1');
    if (!Array.isArray(input.declaredArtifacts)) {
      throw new Error('declaredArtifacts must be an array.');
    }
    return structuredClone(input);
  }
  assertValid(validators.validateV1, input, 'ProjectBrief v1');
  const result = {
    document: structuredClone(input),
    declaredArtifacts: structuredClone(options.declaredArtifacts ?? []),
  };
  if (!Array.isArray(result.declaredArtifacts)) throw new Error('declaredArtifacts must be an array.');
  return result;
}

export function migrateLegacyProjectBrief(input, options = {}) {
  if (options.targetVersion && options.targetVersion !== CURRENT_VERSION) {
    throw new Error(`Downgrade is not supported: targetVersion ${options.targetVersion}.`);
  }

  if (input?.schemaVersion === CURRENT_VERSION || input?.document?.schemaVersion === CURRENT_VERSION) {
    return normalizedMigrationResult(input, options);
  }
  if (!input || input.schemaVersion !== LEGACY_VERSION) {
    throw new Error(`Unsupported ProjectBrief schemaVersion: ${input?.schemaVersion ?? 'missing'}.`);
  }
  assertValid(validators.validateLegacy, input, 'ProjectBrief 0.1.0');

  const now = options.now ?? input.meta?.updatedAt ?? input.meta?.createdAt ?? MIGRATION_EPOCH;
  const data = structuredClone(input);
  delete data.fieldMeta;

  const fieldSources = {};
  for (const [path, meta] of Object.entries(input.fieldMeta ?? {})) {
    fieldSources[path] = {
      source: V1_SOURCES.has(meta.source) ? meta.source : 'migration',
      confirmation: meta.source === 'pending_confirmation' ? 'pending' : meta.source === 'not_applicable' ? 'not_applicable' : 'confirmed',
      ...(meta.sourcePath ? { sourceArtifactId: normalizePortableArtifactReference(meta.sourcePath) } : {}),
      updatedAt: meta.updatedAt ?? now,
    };
  }

  const projectId = options.projectId ?? `project-${input.project.slug}`;
  const revision = options.revision ?? 1;
  if (!Number.isInteger(revision) || revision < 1) throw new Error('revision must be an integer greater than zero.');

  const result = {
    document: {
      schemaVersion: CURRENT_VERSION,
      id: options.id ?? `${projectId}:revision:${revision}`,
      workspaceId: options.workspaceId ?? 'standalone',
      projectId,
      revision,
      status: 'active',
      createdAt: input.meta?.createdAt ?? now,
      updatedAt: input.meta?.updatedAt ?? now,
      data,
      fieldSources,
    },
    declaredArtifacts: [],
  };
  assertValid(validators.validateV1, result.document, 'ProjectBrief v1');
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/migrate-project-brief.mjs <input.json> <output.json>');
    process.exit(1);
  }
  const migrated = migrateLegacyProjectBrief(JSON.parse(readFileSync(resolve(inputPath), 'utf8')));
  writeFileSync(resolve(outputPath), `${JSON.stringify(migrated, null, 2)}\n`);
  console.log(`Migrated ${inputPath} -> ${outputPath}`);
}
