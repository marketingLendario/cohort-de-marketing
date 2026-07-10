#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function collectBriefValues(value, prefix = '', output = []) {
  if (Array.isArray(value)) {
    output.push([prefix, value]);
    return output;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      collectBriefValues(child, path, output);
    }
    return output;
  }
  output.push([prefix, value]);
  return output;
}

function normalizeError(code, message, detail = {}) {
  return { code, message, ...detail };
}

export function validatePilotPackage(options = {}) {
  const manifestPath = resolve(options.manifestPath ?? 'data/pilots/academia-lendaria-project.manifest.json');
  const briefPath = resolve(options.briefPath ?? 'data/pilots/academia-lendaria-project-brief.json');
  const errors = [];

  let manifest;
  let brief;

  try {
    manifest = readJson(manifestPath);
  } catch (error) {
    return {
      ok: false,
      errors: [normalizeError('manifest_invalid', `Manifesto inválido em ${manifestPath}: ${error.message}`)],
    };
  }

  try {
    brief = readJson(briefPath);
  } catch (error) {
    return {
      ok: false,
      errors: [normalizeError('brief_invalid', `ProjectBrief inválido em ${briefPath}: ${error.message}`)],
    };
  }

  const sourceIds = new Set();
  const factById = new Map();
  const gapById = new Map();
  const factByPath = new Map();
  const artifactTypes = new Set();

  for (const source of manifest.sources ?? []) {
    if (!source?.id) {
      errors.push(normalizeError('source_invalid', 'Fonte sem id.', { source }));
      continue;
    }
    if (sourceIds.has(source.id)) {
      errors.push(normalizeError('source_duplicate', `Fonte duplicada: ${source.id}.`, { sourceId: source.id }));
      continue;
    }
    sourceIds.add(source.id);

    if (!existsSync(source.path)) {
      errors.push(normalizeError('missing_source', `Fonte ausente: ${source.path}.`, { sourceId: source.id, path: source.path }));
      continue;
    }

    const currentHash = sha256File(source.path);
    if (currentHash !== source.sha256) {
      errors.push(
        normalizeError('hash_mismatch', `Hash divergente para ${source.id}.`, {
          sourceId: source.id,
          expected: source.sha256,
          actual: currentHash,
          path: source.path,
        }),
      );
    }
  }

  for (const fact of manifest.facts ?? []) {
    if (!fact?.id || !fact?.path) {
      errors.push(normalizeError('fact_invalid', 'Fact sem id/path.', { fact }));
      continue;
    }
    factById.set(fact.id, fact);
    factByPath.set(fact.path, fact);
    if (!sourceIds.has(fact.sourceId)) {
      errors.push(normalizeError('fact_unknown_source', `Fact ${fact.id} aponta para sourceId inexistente.`, { factId: fact.id }));
    }
  }

  for (const gap of manifest.unknowns ?? []) {
    if (!gap?.id || !gap?.path) {
      errors.push(normalizeError('gap_invalid', 'Gap sem id/path.', { gap }));
      continue;
    }
    gapById.set(gap.id, gap);
  }

  for (const artifact of manifest.artifactManifest ?? []) {
    if (!artifact?.artifactType) {
      errors.push(normalizeError('artifact_invalid', 'Artifact manifest sem artifactType.', { artifact }));
      continue;
    }
    artifactTypes.add(artifact.artifactType);
    if (!sourceIds.has(artifact.sourceId)) {
      errors.push(normalizeError('artifact_unknown_source', `Artifact ${artifact.artifactType} aponta para sourceId inexistente.`, {
        artifactType: artifact.artifactType,
      }));
    }
  }

  if (brief.schemaVersion !== '0.1.0') {
    errors.push(normalizeError('brief_schema', `schemaVersion esperado 0.1.0; recebido ${brief.schemaVersion ?? 'undefined'}.`));
  }
  if (manifest.importProof?.compatibleSchemaVersion && brief.schemaVersion !== manifest.importProof.compatibleSchemaVersion) {
    errors.push(
      normalizeError('import_proof_schema', 'O briefing não coincide com o schema declarado em importProof.', {
        expected: manifest.importProof.compatibleSchemaVersion,
        actual: brief.schemaVersion,
      }),
    );
  }

  const entries = collectBriefValues(brief)
    .filter(([path]) => path && path !== 'schemaVersion')
    .filter(([path]) => !path.startsWith('meta.'))
    .filter(([path]) => !path.startsWith('fieldMeta.'))
    .filter(([path]) => !path.startsWith('artifacts.'));

  const briefValuePaths = new Set(entries.map(([path]) => path));
  const fieldMeta = brief.fieldMeta ?? {};

  for (const [path, value] of entries) {
    const meta = fieldMeta[path];
    if (!meta) {
      errors.push(normalizeError('invented_field', `Campo preenchido sem fieldMeta: ${path}.`, { path }));
      continue;
    }

    if (value === 'unknown') {
      if (meta.source !== 'pending_confirmation') {
        errors.push(normalizeError('unknown_source_invalid', `Campo unknown sem source pending_confirmation: ${path}.`, { path }));
      }
      if (!String(meta.sourcePath ?? '').startsWith('gap:')) {
        errors.push(normalizeError('unknown_gap_missing', `Campo unknown sem gap referenciado: ${path}.`, { path }));
        continue;
      }
      const gap = gapById.get(String(meta.sourcePath).slice(4));
      if (!gap) {
        errors.push(normalizeError('unknown_gap_missing', `Gap inexistente para ${path}.`, { path, sourcePath: meta.sourcePath }));
        continue;
      }
      if (gap.path !== path && !path.startsWith(`${gap.path}.`)) {
        errors.push(normalizeError('unknown_gap_path_mismatch', `Gap divergente para ${path}.`, {
          path,
          gapPath: gap.path,
          gapId: gap.id,
        }));
      }
      continue;
    }

    if (!String(meta.sourcePath ?? '').startsWith('fact:')) {
      errors.push(normalizeError('fact_missing', `Campo factual sem fact referenciado: ${path}.`, { path }));
      continue;
    }

    const fact = factById.get(String(meta.sourcePath).slice(5));
    if (!fact) {
      errors.push(normalizeError('fact_missing', `Fact inexistente para ${path}.`, { path, sourcePath: meta.sourcePath }));
      continue;
    }
    if (fact.path !== path) {
      errors.push(normalizeError('fact_path_mismatch', `Fact de ${path} aponta para outro path.`, {
        path,
        factPath: fact.path,
        factId: fact.id,
      }));
      continue;
    }
    if (!deepEqual(fact.value, value)) {
      errors.push(normalizeError('invented_field', `Valor divergente do fact para ${path}.`, {
        path,
        expected: fact.value,
        actual: value,
      }));
    }
  }

  for (const path of Object.keys(fieldMeta)) {
    if (!briefValuePaths.has(path)) {
      errors.push(normalizeError('orphan_field_meta', `fieldMeta sem valor correspondente no briefing: ${path}.`, { path }));
    }
  }

  const declaredArtifacts = Object.entries(brief.artifacts ?? {})
    .filter(([, declared]) => declared === true)
    .map(([artifactType]) => artifactType)
    .sort();

  for (const artifactType of declaredArtifacts) {
    if (!artifactTypes.has(artifactType)) {
      errors.push(normalizeError('artifact_missing', `Artefato declarado no briefing não existe no manifesto: ${artifactType}.`, {
        artifactType,
      }));
    }
  }

  const importProofArtifacts = [...(manifest.importProof?.declaredArtifacts ?? [])].sort();
  if (!deepEqual(importProofArtifacts, declaredArtifacts)) {
    errors.push(
      normalizeError('import_proof_artifacts_mismatch', 'declaredArtifacts de importProof diverge do briefing.', {
        expected: importProofArtifacts,
        actual: declaredArtifacts,
      }),
    );
  }

  const manifestArtifactTypes = [...artifactTypes].sort();
  if (!deepEqual(manifestArtifactTypes, declaredArtifacts)) {
    errors.push(
      normalizeError('artifact_manifest_mismatch', 'artifactManifest diverge das declarações do briefing.', {
        expected: manifestArtifactTypes,
        actual: declaredArtifacts,
      }),
    );
  }

  return { ok: errors.length === 0, errors };
}

function main() {
  const manifestPath = process.argv[2];
  const briefPath = process.argv[3];
  const result = validatePilotPackage({
    ...(manifestPath ? { manifestPath } : {}),
    ...(briefPath ? { briefPath } : {}),
  });

  if (result.ok) {
    console.log('OK pilot package valid');
    return;
  }

  for (const error of result.errors) {
    console.error(`FAIL ${error.code}: ${error.message}`);
  }
  process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main();
}
