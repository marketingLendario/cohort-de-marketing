import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createProjectBriefValidators,
  migrateLegacyProjectBrief,
} from '../../../../scripts/migrate-project-brief.mjs';

const fixture = (name) => JSON.parse(
  readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8'),
);

test('migra 0.1.0 de forma deterministica e preserva dados e proveniencia', () => {
  const legacy = fixture('legacy-0.1.0.valid.json');
  const original = structuredClone(legacy);
  const expected = fixture('migrated-1.0.0.valid.json');

  const first = migrateLegacyProjectBrief(legacy);
  const second = migrateLegacyProjectBrief(legacy);

  assert.deepEqual(first, expected);
  assert.deepEqual(second, expected);
  assert.deepEqual(legacy, original);
  assert.equal(first.document.data.fieldMeta, undefined);
  assert.equal(first.document.fieldSources['project.name'].source, 'user');
  assert.equal(first.document.fieldSources['market.niche'].source, 'artifact');
  assert.equal(first.document.fieldSources['market.dominantPain'].confirmation, 'pending');
  assert.equal(first.document.fieldSources['offer.guarantee'].confirmation, 'not_applicable');
});

test('reprocessar o resultado v1 e um no-op idempotente', () => {
  const migrated = fixture('migrated-1.0.0.valid.json');

  assert.deepEqual(migrateLegacyProjectBrief(migrated), migrated);
  assert.deepEqual(migrateLegacyProjectBrief(migrated.document), migrated);
});

test('versao desconhecida falha fechado', () => {
  assert.throws(
    () => migrateLegacyProjectBrief(fixture('unknown-version.invalid.json')),
    /Unsupported ProjectBrief schemaVersion: 2\.0\.0/,
  );
});

test('campo critico invalido falha fechado', () => {
  assert.throws(
    () => migrateLegacyProjectBrief(fixture('critical-field.invalid.json')),
    /project\.slug|fieldMeta/,
  );
});

test('opcao de downgrade implicito falha fechado', () => {
  assert.throws(
    () => migrateLegacyProjectBrief(fixture('legacy-0.1.0.valid.json'), { targetVersion: '0.1.0' }),
    /Downgrade is not supported/,
  );
});

test('schema v1 usa o schema legado por referencia e nao duplica os 120 campos', () => {
  const schema = fixture('../../project-brief.v1.schema.json');

  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.properties.data.$ref, 'https://marketinglendario.local/cohort/project-brief.schema.json');
  assert.deepEqual(schema.properties.data.properties, { fieldMeta: false });
  assert.deepEqual(schema.required, [
    'schemaVersion',
    'id',
    'workspaceId',
    'projectId',
    'revision',
    'status',
    'createdAt',
    'updatedAt',
    'data',
    'fieldSources',
  ]);
});

test('contrato publico nao carrega acoplamentos do Studio privado', () => {
  const contract = readFileSync(
    fileURLToPath(new URL('../../project-brief.v1.schema.json', import.meta.url)),
    'utf8',
  );
  const migration = readFileSync(
    fileURLToPath(new URL('../../../../scripts/migrate-project-brief.mjs', import.meta.url)),
    'utf8',
  );

  for (const privateMarker of ['supabase', 'academia-lendaria-ads-studio', '/Users/', 'studioProjectId']) {
    assert.equal(contract.includes(privateMarker), false, `schema contem marcador privado: ${privateMarker}`);
    assert.equal(migration.includes(privateMarker), false, `migracao contem marcador privado: ${privateMarker}`);
  }
});

test('AJV 2020 compila os dois schemas e valida fixtures positivas e negativas', () => {
  const {
    fieldPaths,
    legacySchema,
    validateLegacy,
    validateV1,
  } = createProjectBriefValidators();

  assert.equal(legacySchema.schemaVersion, undefined);
  assert.equal(fieldPaths.size, 120);
  assert.equal(validateLegacy(fixture('legacy-0.1.0.valid.json')), true);
  assert.equal(validateLegacy(fixture('relative-source-path.valid.json')), true);
  assert.equal(validateV1(fixture('project-brief-1.0.0.valid.json')), true);
  assert.equal(validateLegacy(fixture('critical-field.invalid.json')), false);
  assert.equal(validateLegacy(fixture('unknown-version.invalid.json')), false);
});

test('schema legado rejeita todos os campos criticos citados pelo QG', () => {
  const cases = [
    {
      name: 'startingPoint',
      mutate: (document) => { document.project.startingPoint = 'invalido'; },
      expected: /\/project\/startingPoint/,
    },
    {
      name: 'awarenessLevel',
      mutate: (document) => { document.market.awarenessLevel = 6; },
      expected: /\/market\/awarenessLevel/,
    },
    {
      name: 'exactPrice',
      mutate: (document) => { document.offer = { exactPrice: -1 }; },
      expected: /\/offer\/exactPrice/,
    },
    {
      name: 'additional property',
      mutate: (document) => { document.project.privateProjectId = 'studio-1'; },
      expected: /additional properties/,
    },
    {
      name: 'timestamp',
      mutate: (document) => { document.meta.updatedAt = 'ontem'; },
      expected: /\/meta\/updatedAt.*date-time/,
    },
    {
      name: 'private dot-path',
      mutate: (document) => {
        document.fieldMeta['private.customerId'] = {
          source: 'user',
          updatedAt: '2026-06-02T15:30:00.000Z',
        };
      },
      expected: /canonical-field-path/,
    },
  ];

  for (const scenario of cases) {
    const document = fixture('legacy-0.1.0.valid.json');
    scenario.mutate(document);
    assert.throws(
      () => migrateLegacyProjectBrief(document),
      scenario.expected,
      scenario.name,
    );
  }
});

test('sourcePath relativo valido migra para referencia portatil deterministica', () => {
  const posix = fixture('relative-source-path.valid.json');
  const windowsRelative = structuredClone(posix);
  windowsRelative.fieldMeta['project.slug'].sourcePath = 'projetos\\acme\\avatar\\avatar-funil.md';

  const first = migrateLegacyProjectBrief(posix);
  const second = migrateLegacyProjectBrief(posix);
  const normalizedWindows = migrateLegacyProjectBrief(windowsRelative);

  assert.deepEqual(first, second);
  assert.deepEqual(normalizedWindows, first);
  assert.equal(
    first.document.fieldSources['project.slug'].sourceArtifactId,
    'projetos/acme/avatar/avatar-funil.md',
  );
});

function assertLegacySourcePathRejected(sourcePath, expected = /portable-legacy-source-path/) {
  const document = fixture('relative-source-path.valid.json');
  document.fieldMeta['project.slug'].sourcePath = sourcePath;
  assert.throws(() => migrateLegacyProjectBrief(document), expected);
}

test('sourcePath rejeita traversal', () => {
  assertLegacySourcePathRejected('projetos/acme/../segredos.json');
});

test('sourcePath rejeita path absoluto Unix', () => {
  assertLegacySourcePathRejected('/Users/private/avatar.md');
});

test('sourcePath rejeita path absoluto Windows', () => {
  assertLegacySourcePathRejected('C:\\Users\\private\\avatar.md');
});

test('sourcePath rejeita URI', () => {
  assertLegacySourcePathRejected('https://studio.example/avatar.md');
});

test('sourcePath rejeita referencia de segredo', () => {
  assertLegacySourcePathRejected('projetos/acme/secrets/token.json');
});

test('sourcePath rejeita referencia privada', () => {
  assertLegacySourcePathRejected('projetos/acme/private/customer.json');
});

test('sourcePath rejeita valor nao-string', () => {
  assertLegacySourcePathRejected(42, /sourcePath.*string/);
});

test('v1 aceita somente sourceArtifactId POSIX canônico', () => {
  const canonical = fixture('project-brief-1.0.0.valid.json');
  canonical.fieldSources['market.niche'].sourceArtifactId = 'projetos/acme/avatar/avatar-funil.md';

  assert.deepEqual(migrateLegacyProjectBrief(canonical).document, canonical);

  const windowsRepresentation = structuredClone(canonical);
  windowsRepresentation.fieldSources['market.niche'].sourceArtifactId = 'projetos\\acme\\avatar\\avatar-funil.md';
  assert.throws(
    () => migrateLegacyProjectBrief(windowsRepresentation),
    /sourceArtifactId.*portable-artifact-reference/,
  );
});

test('caminho idempotente v1 valida proveniencia e paths antes do no-op', () => {
  const cases = [
    {
      name: 'sourceArtifactId numerico',
      mutate: (document) => { document.fieldSources['market.niche'].sourceArtifactId = 42; },
      expected: /sourceArtifactId.*string/,
    },
    {
      name: 'sourceArtifactId absoluto',
      mutate: (document) => { document.fieldSources['market.niche'].sourceArtifactId = '/Users/private/avatar.md'; },
      expected: /sourceArtifactId.*portable-artifact-reference/,
    },
    {
      name: 'dot-path privado',
      mutate: (document) => {
        document.fieldSources['private.customerId'] = {
          source: 'migration',
          confirmation: 'confirmed',
          updatedAt: '2026-06-02T15:30:00.000Z',
        };
      },
      expected: /canonical-field-path/,
    },
    {
      name: 'timestamp v1',
      mutate: (document) => { document.updatedAt = 'ontem'; },
      expected: /\/updatedAt.*date-time/,
    },
    {
      name: 'additional property v1',
      mutate: (document) => { document.privateProjectId = 'studio-1'; },
      expected: /additional properties/,
    },
  ];

  for (const scenario of cases) {
    const document = fixture('project-brief-1.0.0.valid.json');
    scenario.mutate(document);
    assert.throws(
      () => migrateLegacyProjectBrief(document),
      scenario.expected,
      scenario.name,
    );
  }
});
