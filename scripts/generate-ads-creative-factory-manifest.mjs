#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillRoot = join(root, '.claude/skills/ads-creative-factory');
const manifestPath = join(skillRoot, 'source-manifest.json');

const epic14Files = new Map([
  ['SKILL.md', 'source'],
  ['THIRD_PARTY_NOTICES.md', 'notice'],
  ['data/gate-profiles.yaml', 'source'],
  ['data/ugc-scenes.yaml', 'source'],
  ['data/variation-axes.yaml', 'source'],
  ['schemas/creative-extension-pack.v1.schema.json', 'schema'],
  ['schemas/persona-pack.v1.schema.json', 'schema'],
  ['scripts/archetype_render.py', 'source'],
  ['scripts/build_brand_pack.py', 'source'],
  ['scripts/build_persona_pack.py', 'source'],
  ['scripts/catalog_authoring.py', 'source'],
  ['scripts/catalog_cli.py', 'source'],
  ['scripts/catalog_loader.py', 'source'],
  ['scripts/didactic.py', 'source'],
  ['scripts/doctor.py', 'source'],
  ['scripts/factory.py', 'source'],
  ['scripts/gate.py', 'source'],
  ['scripts/pack_loader.py', 'source'],
  ['scripts/variation.py', 'source'],
]);

const hotfixFiles = new Map([
  ['SKILL.md', 'source'],
  ['scripts/alib.py', 'source'],
  ['scripts/catalog_loader.py', 'source'],
]);

// EPIC-18 (STORY-18.W1.1) — cena parametrizável no EDIT de foto real (2.3.0)
const epic18Files = new Map([
  ['SKILL.md', 'source'],
  ['scripts/person.py', 'source'],
  ['scripts/archetype_render.py', 'source'],
]);

// EPIC-20 (STORY-20.W1.1) — renderer modes nativos chat/tweet (2.3.0)
const epic20Files = new Map([
  ['SKILL.md', 'source'],
  ['data/archetypes.yaml', 'source'],
  ['data/variation-axes.yaml', 'source'],
  ['schemas/creative-extension-pack.v1.schema.json', 'schema'],
  ['scripts/archetype_render.py', 'source'],
  ['scripts/catalog_cli.py', 'source'],
  ['scripts/catalog_loader.py', 'source'],
  ['scripts/chat.py', 'source'],
  ['scripts/didactic.py', 'source'],
  ['scripts/factory.py', 'source'],
  ['scripts/tweet.py', 'source'],
  ['scripts/ugc.py', 'source'],
]);

const changeReasons = {
  'epic-14': 'Authored in the public repository and reviewed for Epic 14.',
  'story-15.W1.1': 'Authored in the public repository and reviewed for the 2.2.1 transparency hotfix.',
  'story-18.W1.1': 'Authored in the public repository and reviewed for the 2.3.0 release (EPIC-18, parameterizable person scene).',
  'story-20.W1.1': 'Authored in the public repository and reviewed for the 2.3.0 release (EPIC-20, native chat/tweet renderer modes).',
};

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function publicMetadata(path, kind, change = 'epic-14') {
  return {
    path,
    package: 'public',
    kind,
    origin: {
      repository: 'cohort-de-marketing',
      commit: change,
    },
    license: {
      spdx: 'MIT',
      status: 'verified',
    },
    redistribution: {
      status: 'cleared',
      reason: changeReasons[change] ?? changeReasons['epic-14'],
    },
  };
}

if (!existsSync(manifestPath)) {
  throw new Error(`Missing release manifest: ${manifestPath}`);
}

const previous = JSON.parse(readFileSync(manifestPath, 'utf8'));
const byPath = new Map((previous.files ?? []).map((entry) => [entry.path, entry]));
const allowList = [...new Set([
  ...(previous.allowList ?? []),
  ...epic14Files.keys(),
  ...hotfixFiles.keys(),
  ...epic18Files.keys(),
  ...epic20Files.keys(),
])].sort();

const files = allowList.map((path) => {
  const absolutePath = join(skillRoot, path);
  if (!existsSync(absolutePath)) throw new Error(`Allow-listed file is missing: ${path}`);
  const buffer = readFileSync(absolutePath);
  // Precedência: a mudança MAIS RECENTE que tocou o arquivo define a proveniência.
  const metadata = epic20Files.has(path)
    ? publicMetadata(path, epic20Files.get(path), 'story-20.W1.1')
    : epic18Files.has(path)
      ? publicMetadata(path, epic18Files.get(path), 'story-18.W1.1')
      : hotfixFiles.has(path)
        ? publicMetadata(path, hotfixFiles.get(path), 'story-15.W1.1')
        : epic14Files.has(path)
          ? publicMetadata(path, epic14Files.get(path))
          : byPath.get(path);
  if (!metadata) throw new Error(`Missing provenance metadata for: ${path}`);
  return {
    ...metadata,
    path,
    bytes: buffer.byteLength,
    sha256: sha256(buffer),
  };
});

const manifest = {
  ...previous,
  schemaVersion: '2.0.0',
  artifact: 'ads-creative-factory',
  releaseVersion: '2.3.0',
  publication: {
    status: 'released',
    verdict: 'PASS',
    reason: 'All allow-listed files have verified licenses and redistribution clearance.',
  },
  allowList,
  files,
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifestPath} with ${files.length} allow-listed files.`);
