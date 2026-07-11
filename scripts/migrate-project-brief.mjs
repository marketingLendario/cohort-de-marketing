import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function migrateLegacyProjectBrief(input, options = {}) {
  if (!input || input.schemaVersion !== '0.1.0') {
    throw new Error('Expected a ProjectBrief 0.1.0 document.');
  }
  if (!input.project?.slug) {
    throw new Error('Legacy ProjectBrief must contain project.slug.');
  }

  const now = options.now ?? new Date().toISOString();
  const data = structuredClone(input);
  const declaredArtifacts = data.artifacts ?? {};
  delete data.artifacts;

  const fieldSources = {};
  for (const [path, meta] of Object.entries(data.fieldMeta ?? {})) {
    fieldSources[path] = {
      source: meta.source === 'artifact' ? 'artifact' : meta.source === 'inferred' ? 'inferred' : 'migration',
      confirmation: meta.source === 'pending_confirmation' ? 'pending' : meta.source === 'not_applicable' ? 'not_applicable' : 'confirmed',
      ...(meta.sourcePath ? { sourceArtifactId: meta.sourcePath } : {}),
      updatedAt: meta.updatedAt ?? now,
    };
  }

  return {
    document: {
      schemaVersion: '1.0.0',
      id: options.id ?? randomUUID(),
      workspaceId: options.workspaceId ?? 'legacy-workspace',
      projectId: options.projectId ?? `project-${input.project.slug}`,
      revision: 1,
      status: 'active',
      createdAt: input.meta?.createdAt ?? now,
      updatedAt: input.meta?.updatedAt ?? now,
      data,
      fieldSources,
    },
    declaredArtifacts: Object.entries(declaredArtifacts)
      .filter(([, declared]) => Boolean(declared))
      .map(([artifactType]) => ({ artifactType, verification: 'pending' })),
  };
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

