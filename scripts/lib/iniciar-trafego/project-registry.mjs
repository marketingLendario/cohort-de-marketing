import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { candidateIdForRoot } from './project-discovery.mjs';
import {
  ensureManifest,
  readManifest,
  writeJson,
  sha256File,
} from './project-context.mjs';

const REGISTRY_REL = '.aiox/iniciar-trafego/project-registry.json';

function portable(value) {
  return String(value).replace(/\\/g, '/');
}

function codedError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

export function registryPath(cohortRoot) {
  return join(resolve(cohortRoot), REGISTRY_REL);
}

export function emptyRegistry() {
  const now = new Date().toISOString();
  return {
    schemaVersion: '1.0.0',
    createdAt: now,
    updatedAt: now,
    projects: {},
  };
}

export function loadRegistry(cohortRoot) {
  const file = registryPath(cohortRoot);
  if (!existsSync(file)) return emptyRegistry();
  const registry = JSON.parse(readFileSync(file, 'utf8'));
  registry.projects = registry.projects ?? {};
  return registry;
}

export function saveRegistry(cohortRoot, registry) {
  registry.schemaVersion = '1.0.0';
  registry.createdAt = registry.createdAt ?? new Date().toISOString();
  registry.updatedAt = new Date().toISOString();
  writeJson(registryPath(cohortRoot), registry);
}

export function rootFingerprint(projectRoot) {
  const manifestPath = join(projectRoot, 'project-manifest.json');
  const manifest = readManifest(projectRoot);
  if (!manifest?.projectId) return '';
  const manifestHash = sha256File(manifestPath);
  return createHash('sha256')
    .update(`${manifest.projectId}\n${manifestHash}`)
    .digest('hex')
    .slice(0, 24);
}

function relativeOrAbsolute(cohortRoot, projectRoot) {
  const rel = relative(resolve(cohortRoot), resolve(projectRoot));
  if (rel && !rel.startsWith('..') && !/^[A-Za-z]:/.test(rel)) return portable(rel);
  return null;
}

function duplicateProjectId(registry, projectId, nextRoot) {
  const previous = registry.projects?.[projectId];
  if (!previous || resolve(previous.projectRoot) === resolve(nextRoot)) return null;
  if (!existsSync(previous.projectRoot)) return { kind: 'moved', previous };
  const previousManifest = readManifest(previous.projectRoot);
  if (previousManifest?.projectId === projectId) return { kind: 'collision', previous };
  return { kind: 'stale', previous };
}

export function registerProject(cohortRoot, projectRoot, input = {}) {
  const root = resolve(projectRoot);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw codedError('PROJECT_ROOT_MISSING', 'registerProject: raiz inválida', { projectRoot: root });
  }
  const canonicalRoot = realpathSync(root);
  const slug = input.slug ?? basename(canonicalRoot);
  const manifest = ensureManifest(canonicalRoot, slug);
  const registry = loadRegistry(cohortRoot);
  const duplicate = duplicateProjectId(registry, manifest.projectId, canonicalRoot);
  if (duplicate?.kind === 'collision') {
    throw codedError(
      'PROJECT_ID_COLLISION',
      `O mesmo projectId existe em duas raízes: ${duplicate.previous.projectRoot} e ${canonicalRoot}`,
      {
        projectId: manifest.projectId,
        roots: [duplicate.previous.projectRoot, canonicalRoot],
      },
    );
  }
  if (duplicate?.kind === 'stale') {
    throw codedError('REGISTRY_STALE', 'Entrada anterior não corresponde mais ao manifest', {
      projectId: manifest.projectId,
      previousRoot: duplicate.previous.projectRoot,
    });
  }

  const now = new Date().toISOString();
  const existing = registry.projects?.[manifest.projectId];
  const slugCollisionWith = Object.values(registry.projects ?? {})
    .filter((entry) => entry.projectId !== manifest.projectId && entry.slug === manifest.slug)
    .map((entry) => entry.projectId)
    .sort();
  const manifestHash = sha256File(join(canonicalRoot, 'project-manifest.json'));
  const entry = {
    schemaVersion: '1.0.0',
    projectId: manifest.projectId,
    slug: manifest.slug,
    displayName: manifest.name ?? manifest.slug,
    projectRoot: canonicalRoot,
    projectRootNormalized: portable(canonicalRoot),
    rootRelative: input.rootRelative ?? relativeOrAbsolute(cohortRoot, canonicalRoot),
    rootFingerprint: rootFingerprint(canonicalRoot),
    pathFingerprint: candidateIdForRoot(canonicalRoot),
    manifestHash,
    candidateId: input.candidateId ?? candidateIdForRoot(canonicalRoot),
    bindings: input.bindings ?? existing?.bindings ?? null,
    lastRunState: input.lastRunState ?? existing?.lastRunState ?? null,
    slugCollisionWith,
    movedFrom: duplicate?.kind === 'moved' ? duplicate.previous.projectRoot : existing?.movedFrom ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  registry.projects[manifest.projectId] = entry;
  saveRegistry(cohortRoot, registry);
  return entry;
}

export function getRegistryEntry(cohortRoot, projectId) {
  return loadRegistry(cohortRoot).projects?.[projectId] ?? null;
}

export function findProjectIdCollisions(cohortRoot, candidates = []) {
  const byId = new Map();
  for (const candidate of candidates) {
    const manifest = readManifest(candidate.root);
    if (!manifest?.projectId) continue;
    if (!byId.has(manifest.projectId)) byId.set(manifest.projectId, []);
    byId.get(manifest.projectId).push(candidate.root);
  }
  return [...byId.entries()]
    .filter(([, roots]) => new Set(roots.map((root) => resolve(root))).size > 1)
    .map(([projectId, roots]) => ({ code: 'PROJECT_ID_COLLISION', projectId, roots }));
}

export function findMovedProject(projectId, candidates = []) {
  const matches = candidates.filter((candidate) => readManifest(candidate.root)?.projectId === projectId);
  if (matches.length > 1) {
    throw codedError('PROJECT_ID_COLLISION', 'Mais de uma raiz contém o mesmo projectId', {
      projectId,
      roots: matches.map((candidate) => candidate.root),
    });
  }
  return matches[0] ?? null;
}

export function resolveRegisteredRoot(cohortRoot, projectId, options = {}) {
  const entry = getRegistryEntry(cohortRoot, projectId);
  if (!entry) return null;
  if (!existsSync(entry.projectRoot)) {
    const moved = findMovedProject(projectId, options.candidates ?? []);
    if (moved) {
      throw codedError('PROJECT_MOVED', 'Projeto foi movido desde o último registro', {
        projectId,
        previousRoot: entry.projectRoot,
        currentRoot: moved.root,
      });
    }
    throw codedError('REGISTRY_ROOT_MISSING', 'Raiz registrada não existe', {
      projectId,
      projectRoot: entry.projectRoot,
    });
  }
  const manifest = readManifest(entry.projectRoot);
  if (manifest?.projectId !== projectId) {
    throw codedError('REGISTRY_STALE', 'Registry stale: manifest projectId diverge', {
      projectId,
      projectRoot: entry.projectRoot,
    });
  }
  const manifestHash = sha256File(join(entry.projectRoot, 'project-manifest.json'));
  if (manifestHash !== entry.manifestHash || rootFingerprint(entry.projectRoot) !== entry.rootFingerprint) {
    throw codedError('REGISTRY_STALE', 'Registry stale: manifest ou fingerprint diverge', {
      projectId,
      projectRoot: entry.projectRoot,
    });
  }
  return entry;
}
