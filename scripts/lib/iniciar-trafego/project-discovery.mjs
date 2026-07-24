import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from 'node:fs';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_REL = 'data/iniciar-trafego/project-discovery.json';
const SAFE_SLUG = /^[a-z0-9][a-z0-9-]{0,62}$/;
const MARKERS = [
  'project-manifest.json',
  'funil.md',
  'copy.md',
  'DESIGN.md',
  'pagina/index.html',
  'avatar.md',
  'relatorio-avatar.md',
  'offerbook.md',
];

function cohortRootFromModule() {
  const here = fileURLToPath(new URL('.', import.meta.url));
  return resolve(here, '../../..');
}

export function portable(value) {
  return normalize(value).replace(/\\/g, '/');
}

export function scanErrorNote(root, error) {
  return {
    code: error?.code === 'EACCES' || error?.code === 'EPERM' ? 'PERMISSION_DENIED' : 'SCAN_FAILED',
    root: resolve(root),
    message: error?.message || String(error),
  };
}

function pathIdentityKey(value) {
  const normalized = portable(resolve(value));
  return process.platform === 'win32' || /^[A-Za-z]:\//.test(normalized)
    ? normalized.toLowerCase()
    : normalized;
}

function slugify(value) {
  const normalized = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  return SAFE_SLUG.test(normalized) ? normalized : `projeto-${createHash('sha256').update(value).digest('hex').slice(0, 8)}`;
}

export function loadDiscoveryConfig(cohortRoot = cohortRootFromModule()) {
  const configPath = join(cohortRoot, CONFIG_REL);
  if (!existsSync(configPath)) throw new Error(`Config ausente: ${CONFIG_REL}`);
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  if (!Array.isArray(config.scanRoots) || config.scanRoots.length === 0) {
    throw new Error('project-discovery: scanRoots deve conter ao menos uma raiz');
  }
  return config;
}

export function candidateIdForRoot(rootPath) {
  return `cand_${createHash('sha256').update(pathIdentityKey(rootPath)).digest('hex').slice(0, 16)}`;
}

function pathInside(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
}

function excludedByName(name, config) {
  return (config.excludeDirNames ?? []).some((blocked) => {
    if (process.platform === 'win32') return blocked.toLowerCase() === name.toLowerCase();
    return blocked === name;
  });
}

function exclusionForPath(root, config) {
  const parts = portable(root).split('/');
  for (const sample of config.sampleRoots ?? []) {
    if (parts.includes(sample)) return 'sample-root';
  }
  for (const segment of config.excludePathSegments ?? []) {
    const normalizedSegment = portable(segment).replace(/^\/+|\/+$/g, '');
    if (portable(root).includes(`/${normalizedSegment}`)) return 'blocked-path';
  }
  return null;
}

function nestedAliases(root) {
  const found = [];
  let entries = [];
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('pesquisa-avatar-')) continue;
    const rel = `${entry.name}/relatorio-avatar.md`;
    if (existsSync(join(root, rel))) found.push(rel);
  }
  for (const entry of entries) {
    if (!entry.isFile() || !/^offerbook-.+\.md$/i.test(entry.name)) continue;
    if (entry.name.toLowerCase() === 'briefing-offerbook.md') continue;
    found.push(entry.name);
  }
  return found;
}

function evidenceForProject(root) {
  const markersFound = MARKERS.filter((marker) => existsSync(join(root, marker)));
  markersFound.push(...nestedAliases(root));
  const unique = [...new Set(markersFound)].sort();
  const completenessScore = Math.min(1, unique.length / 6);
  return {
    markersFound: unique,
    markerCount: unique.length,
    completenessScore,
  };
}

export function buildLegacyImportPlan(root, evidence = evidenceForProject(root)) {
  const manifestExists = existsSync(join(root, 'project-manifest.json'));
  const legacyArtifacts = evidence.markersFound.filter((marker) => marker !== 'project-manifest.json');
  if (manifestExists || legacyArtifacts.length === 0) return null;
  return {
    schemaVersion: '1.0.0',
    strategy: 'bind-in-place',
    atomic: true,
    preserveOriginals: true,
    requiresManualMove: false,
    projectRoot: resolve(root),
    operations: legacyArtifacts.map((sourcePath) => ({
      sourcePath,
      action: 'bind',
      copy: false,
      deleteSource: false,
    })),
  };
}

function candidateRecord({ cohortRoot, root, scanRoot, source, excluded = false, exclusionReason = null, errorCode = null }) {
  const evidence = evidenceForProject(root);
  const displayName = basename(root);
  const rel = relative(cohortRoot, root);
  return {
    schemaVersion: '1.0.0',
    candidateId: candidateIdForRoot(root),
    suggestedSlug: slugify(displayName),
    slug: slugify(displayName),
    displayName,
    root: resolve(root),
    rootNormalized: portable(resolve(root)),
    rootRelative: pathInside(cohortRoot, root) ? portable(rel || '.') : null,
    source,
    scanRoot: resolve(scanRoot),
    excluded,
    exclusionReason,
    errorCode,
    evidence,
    completeness: evidence.completenessScore,
    legacyImportPlan: excluded ? null : buildLegacyImportPlan(root, evidence),
  };
}

function scanConfiguredRoot({ cohortRoot, scanRoot, config, candidates, notes, seen }) {
  const maxDepth = Number.isInteger(config.maxDepth) ? config.maxDepth : 2;
  let allowedRealRoot;
  try {
    allowedRealRoot = realpathSync(scanRoot);
  } catch (error) {
    notes.push(scanErrorNote(scanRoot, error));
    return;
  }

  function visit(directory, depth) {
    let entries;
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      notes.push(scanErrorNote(directory, error));
      return;
    }

    for (const entry of entries) {
      if (excludedByName(entry.name, config)) continue;
      const logicalRoot = resolve(join(directory, entry.name));
      const pathExclusion = exclusionForPath(logicalRoot, config);
      if (pathExclusion) {
        if (entry.isDirectory() || entry.isSymbolicLink()) {
          const key = pathIdentityKey(logicalRoot);
          if (!seen.has(key)) {
            seen.add(key);
            candidates.push(candidateRecord({
              cohortRoot,
              root: logicalRoot,
              scanRoot,
              source: 'scan',
              excluded: true,
              exclusionReason: pathExclusion,
            }));
          }
        }
        continue;
      }

      if (entry.isSymbolicLink()) {
        let real;
        try {
          real = realpathSync(logicalRoot);
        } catch (error) {
          notes.push({ code: 'SYMLINK_BROKEN', root: logicalRoot, message: error.message });
          continue;
        }
        if (!pathInside(allowedRealRoot, real)) {
          const key = pathIdentityKey(logicalRoot);
          if (!seen.has(key)) {
            seen.add(key);
            candidates.push(candidateRecord({
              cohortRoot,
              root: logicalRoot,
              scanRoot,
              source: 'scan',
              excluded: true,
              exclusionReason: 'symlink-escape',
              errorCode: 'SYMLINK_ESCAPE',
            }));
          }
          continue;
        }
      }

      let isDirectory = entry.isDirectory();
      if (entry.isSymbolicLink()) {
        try {
          isDirectory = statSync(logicalRoot).isDirectory();
        } catch {
          isDirectory = false;
        }
      }
      if (!isDirectory) continue;

      let realLogicalRoot;
      try {
        realLogicalRoot = realpathSync(logicalRoot);
      } catch (error) {
        notes.push(scanErrorNote(logicalRoot, error));
        continue;
      }
      const key = pathIdentityKey(realLogicalRoot);
      if (seen.has(key)) continue;
      const evidence = evidenceForProject(logicalRoot);
      const isCandidate = evidence.markerCount > 0;
      if (isCandidate) {
        seen.add(key);
        candidates.push(candidateRecord({
          cohortRoot,
          root: logicalRoot,
          scanRoot,
          source: 'scan',
        }));
        continue;
      }
      if (depth < maxDepth) visit(logicalRoot, depth + 1);
    }
  }

  visit(scanRoot, 1);
}

export function discoverProjects(input = {}) {
  const cohortRoot = resolve(input.cohortRoot ?? cohortRootFromModule());
  const config = loadDiscoveryConfig(cohortRoot);
  const candidates = [];
  const exclusionNotes = [];
  const seen = new Set();
  const configuredRoots = (input.scanRoots ?? config.scanRoots).map((configured) => (
    isAbsolute(configured) ? resolve(configured) : resolve(cohortRoot, configured)
  ));

  for (const scanRoot of configuredRoots) {
    if (!existsSync(scanRoot)) {
      exclusionNotes.push({ code: 'SCAN_ROOT_MISSING', root: scanRoot });
      continue;
    }
    if (!lstatSync(scanRoot).isDirectory()) {
      exclusionNotes.push({ code: 'SCAN_ROOT_NOT_DIRECTORY', root: scanRoot });
      continue;
    }
    scanConfiguredRoot({ cohortRoot, scanRoot, config, candidates, notes: exclusionNotes, seen });
  }

  candidates.sort((a, b) => (
    a.slug.localeCompare(b.slug)
    || a.rootNormalized.localeCompare(b.rootNormalized)
  ));
  const operational = candidates.filter((candidate) => !candidate.excluded);
  return {
    schemaVersion: '1.0.0',
    cohortRoot,
    scannedAt: new Date().toISOString(),
    scanRoots: configuredRoots,
    candidates,
    operationalCount: operational.length,
    operationalSlugs: operational.map((candidate) => candidate.slug),
    exclusionNotes,
  };
}

function ancestorProject(cwd, cohortRoot) {
  let current = resolve(cwd);
  const stop = dirname(resolve(cohortRoot));
  while (current !== stop && pathInside(cohortRoot, current)) {
    if (evidenceForProject(current).markerCount > 0 && current !== resolve(cohortRoot)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function registryCandidates(input) {
  const registry = input.registry;
  if (!registry?.projects) return [];
  return Object.values(registry.projects)
    .filter((entry) => entry?.projectRoot && existsSync(entry.projectRoot))
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
}

function resumeCandidate(input, registryEntries) {
  if (input.resumeProjectRoot && existsSync(input.resumeProjectRoot)) return resolve(input.resumeProjectRoot);
  for (const entry of registryEntries) {
    if (existsSync(join(entry.projectRoot, '.aiox/iniciar-trafego/os-resume-task.json'))) {
      return resolve(entry.projectRoot);
    }
  }
  return null;
}

export function resolveProjectFromArgs(input = {}) {
  const cohortRoot = resolve(input.cohortRoot ?? cohortRootFromModule());
  const explicit = String(input.project ?? input.projectRoot ?? '').trim();
  if (explicit) {
    const root = resolve(input.cwd ?? process.cwd(), explicit);
    if (!existsSync(root) || !statSync(root).isDirectory()) {
      const error = new Error('Projeto inválido — diretório inexistente');
      error.code = 'PROJECT_ROOT_MISSING';
      throw error;
    }
    return { mode: 'explicit', root, slug: slugify(basename(root)) };
  }

  const ancestor = ancestorProject(input.cwd ?? process.cwd(), cohortRoot);
  if (ancestor) return { mode: 'cwd-ancestor', root: ancestor, slug: slugify(basename(ancestor)) };

  const registryEntries = registryCandidates(input);
  const resumed = resumeCandidate(input, registryEntries);
  if (resumed) return { mode: 'resume-intent', root: resumed, slug: slugify(basename(resumed)) };

  if (registryEntries.length === 1) {
    return {
      mode: 'registry',
      root: resolve(registryEntries[0].projectRoot),
      slug: registryEntries[0].slug,
      registryEntry: registryEntries[0],
    };
  }

  const discovery = discoverProjects({ ...input, cohortRoot });
  const operational = discovery.candidates.filter((candidate) => !candidate.excluded);
  if (operational.length === 1) {
    return {
      mode: 'auto',
      root: operational[0].root,
      slug: operational[0].slug,
      candidate: operational[0],
    };
  }
  if (operational.length === 0) {
    const error = new Error('Nenhum projeto candidato encontrado');
    error.code = 'NO_PROJECT_CANDIDATES';
    error.discovery = discovery;
    throw error;
  }
  return {
    mode: 'select',
    code: 'PROJECT_SELECTION_REQUIRED',
    discovery,
    operational,
    choices: operational.map((candidate, index) => ({
      number: index + 1,
      candidateId: candidate.candidateId,
      projectRoot: candidate.root,
      displayName: candidate.displayName,
      completeness: candidate.completeness,
    })),
  };
}
