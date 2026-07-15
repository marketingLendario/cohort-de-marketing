#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  lstat,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import '../skill-surface-contract.js';

const INDEX_SCHEMA_VERSION = 'artifact-index-v1';
export const ARTIFACT_GLOB_MATCHER_VERSION = '1.0.0';
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_TYPE = /^[A-Za-z][A-Za-z0-9]*$/;
const SENSITIVE_REFERENCE_PATTERNS = [
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
  /\bsk-(?:live-|test-|proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/i,
  /\bglpat-[A-Za-z0-9_-]{20,}\b/i,
  /\bnpm_[A-Za-z0-9]{30,}\b/i,
  /\bpypi-[A-Za-z0-9_-]{20,}\b/i,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/i,
  /\bAIza[A-Za-z0-9_-]{30,}\b/,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/,
];
const ENTRY_KEYS = [
  'artifactType',
  'path',
  'sha256',
  'sizeBytes',
  'origin',
  'confirmationStatus',
  'satisfiesCriticalRequirement',
];

export class ArtifactIndexError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ArtifactIndexError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new ArtifactIndexError(code, message);
}

export function isPortableArtifactPath(value) {
  return typeof value === 'string'
    && value.length > 0
    && !path.posix.isAbsolute(value)
    && !path.win32.isAbsolute(value)
    && !value.includes('\\')
    && !/[\u0000-\u001F\u007F-\u009F]/u.test(value)
    && !value.split('/').some((part) => part === '' || part === '.' || part === '..');
}

function assertSafeReference(value) {
  if (SENSITIVE_REFERENCE_PATTERNS.some((pattern) => pattern.test(value))) {
    fail('SENSITIVE_PATH', 'Um path de artefato contém uma assinatura sensível.');
  }
}

export function matchArtifactSegment(value, pattern) {
  if (typeof value !== 'string' || typeof pattern !== 'string' || value.includes('/') || pattern.includes('/')) return false;
  let previous = Array(pattern.length + 1).fill(false);
  previous[0] = true;
  for (let patternIndex = 1; patternIndex <= pattern.length; patternIndex += 1) {
    if (pattern[patternIndex - 1] === '*') previous[patternIndex] = previous[patternIndex - 1];
  }
  for (let valueIndex = 1; valueIndex <= value.length; valueIndex += 1) {
    const current = Array(pattern.length + 1).fill(false);
    for (let patternIndex = 1; patternIndex <= pattern.length; patternIndex += 1) {
      const token = pattern[patternIndex - 1];
      if (token === '*') current[patternIndex] = current[patternIndex - 1] || previous[patternIndex];
      else if (token === '?' || token === value[valueIndex - 1]) current[patternIndex] = previous[patternIndex - 1];
    }
    previous = current;
  }
  return previous[pattern.length];
}

export function matchesArtifactGlob(relativePath, pattern) {
  if (!isPortableArtifactPath(relativePath) || !isPortableArtifactPath(pattern)
    || pattern.split('/').at(-1) === '**'
    || pattern.split('/').some((part) => part === '**' ? false : part.includes('**'))) return false;
  const valueSegments = relativePath.split('/');
  const patternSegments = pattern.split('/');
  const memo = new Map();

  function matches(valueIndex, patternIndex) {
    const key = `${valueIndex}:${patternIndex}`;
    if (memo.has(key)) return memo.get(key);
    let result;
    if (patternIndex === patternSegments.length) result = valueIndex === valueSegments.length;
    else if (patternSegments[patternIndex] === '**') {
      result = matches(valueIndex, patternIndex + 1)
        || (valueIndex < valueSegments.length && matches(valueIndex + 1, patternIndex));
    } else {
      result = valueIndex < valueSegments.length
        && matchArtifactSegment(valueSegments[valueIndex], patternSegments[patternIndex])
        && matches(valueIndex + 1, patternIndex + 1);
    }
    memo.set(key, result);
    return result;
  }

  return matches(0, 0);
}

function insideRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function validateRules(rules) {
  if (!rules || typeof rules !== 'object' || Array.isArray(rules)) {
    fail('INVALID_RULES', 'As regras de artefatos são inválidas.');
  }
  const globs = rules.artifactGlobs;
  if (!globs || typeof globs !== 'object' || Array.isArray(globs)) {
    fail('INVALID_RULES', 'artifactGlobs deve ser um objeto.');
  }
  for (const [artifactType, patterns] of Object.entries(globs)) {
    if (!SAFE_TYPE.test(artifactType) || !Array.isArray(patterns) || patterns.length === 0) {
      fail('INVALID_RULES', 'Uma declaração de artefato é inválida.');
    }
    for (const pattern of patterns) {
      if (!isPortableArtifactPath(pattern)
        || pattern.split('/').at(-1) === '**'
        || pattern.split('/').some((part) => part === '**' ? false : part.includes('**'))) {
        fail('INVALID_GLOB', 'Um glob de artefato não é portátil ou confinado.');
      }
      assertSafeReference(pattern);
    }
  }
  const declaration = rules.artifactIndex;
  if (!declaration || declaration.schemaVersion !== INDEX_SCHEMA_VERSION
    || typeof declaration.confirmationRequiredByDefault !== 'boolean') {
    fail('INVALID_RULES', 'A política do ArtifactIndex está ausente ou inválida.');
  }
  return globs;
}

async function assertProjectRoot(projectRoot) {
  if (typeof projectRoot !== 'string' || projectRoot.length === 0) {
    fail('INVALID_PROJECT_ROOT', 'A raiz do projeto é inválida.');
  }
  let resolved;
  try {
    resolved = await realpath(projectRoot);
  } catch {
    fail('PROJECT_NOT_FOUND', 'O projeto informado não existe ou não pode ser lido.');
  }
  if (path.basename(path.dirname(resolved)) !== 'projetos' || !SAFE_SLUG.test(path.basename(resolved))) {
    fail('INVALID_PROJECT_ROOT', 'Use uma raiz no formato projetos/{slug}.');
  }
  const info = await stat(resolved);
  if (!info.isDirectory()) fail('INVALID_PROJECT_ROOT', 'A raiz do projeto deve ser um diretório.');
  return resolved;
}

async function safeCandidate(root, candidate, expectedDirectory = false) {
  let linkInfo;
  try {
    linkInfo = await lstat(candidate);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    fail('FILESYSTEM_ERROR', 'Não foi possível inspecionar um artefato declarado.');
  }
  let resolved;
  try {
    resolved = await realpath(candidate);
  } catch {
    fail('FILESYSTEM_ERROR', 'Não foi possível resolver um artefato declarado.');
  }
  if (!insideRoot(root, resolved)) fail('PATH_ESCAPE', 'Um artefato declarado escapou da raiz do projeto.');
  const info = linkInfo.isSymbolicLink() ? await stat(resolved) : linkInfo;
  if (expectedDirectory && !info.isDirectory()) return null;
  return { resolved, info };
}

async function expandPattern(root, pattern) {
  const segments = pattern.split('/');
  const matches = [];
  const visited = new Set();

  async function visit(current, index, relativeParts) {
    if (index === segments.length) {
      const candidate = await safeCandidate(root, current);
      if (candidate?.info.isFile()) {
        matches.push({ absolute: candidate.resolved, relative: relativeParts.join('/') });
      }
      return;
    }

    const segment = segments[index];
    if (segment === '**') {
      await visit(current, index + 1, relativeParts);
      const currentInfo = await safeCandidate(root, current, true);
      if (!currentInfo) return;
      const visitKey = `${currentInfo.resolved}:${index}`;
      if (visited.has(visitKey)) return;
      visited.add(visitKey);
      let children;
      try {
        children = await readdir(current, { withFileTypes: true });
      } catch {
        fail('FILESYSTEM_ERROR', 'Não foi possível percorrer um glob declarado.');
      }
      for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
        const childPath = path.join(current, child.name);
        const inspected = await safeCandidate(root, childPath);
        if (inspected?.info.isDirectory()) await visit(childPath, index, [...relativeParts, child.name]);
      }
      return;
    }

    const wildcard = segment.includes('*') || segment.includes('?');
    if (!wildcard) {
      const next = path.join(current, segment);
      const inspected = await safeCandidate(root, next);
      if (!inspected) return;
      if (index < segments.length - 1 && !inspected.info.isDirectory()) return;
      await visit(next, index + 1, [...relativeParts, segment]);
      return;
    }

    const currentInfo = await safeCandidate(root, current, true);
    if (!currentInfo) return;
    let children;
    try {
      children = await readdir(current, { withFileTypes: true });
    } catch {
      fail('FILESYSTEM_ERROR', 'Não foi possível percorrer um glob declarado.');
    }
    for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!matchArtifactSegment(child.name, segment)) continue;
      const childPath = path.join(current, child.name);
      const inspected = await safeCandidate(root, childPath);
      if (!inspected) continue;
      if (index < segments.length - 1 && !inspected.info.isDirectory()) continue;
      await visit(childPath, index + 1, [...relativeParts, child.name]);
    }
  }

  await visit(root, 0, []);
  return matches;
}

async function metadataFor(file) {
  let bytes;
  try {
    bytes = await readFile(file.absolute);
  } catch {
    fail('FILESYSTEM_ERROR', 'Não foi possível ler um artefato declarado.');
  }
  return {
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sizeBytes: bytes.byteLength,
  };
}

export async function buildArtifactIndex({ projectRoot, rules }) {
  const globs = validateRules(rules);
  const root = await assertProjectRoot(projectRoot);
  const byPath = new Map();

  for (const artifactType of Object.keys(globs).sort()) {
    for (const pattern of [...globs[artifactType]].sort()) {
      for (const match of await expandPattern(root, pattern)) {
        if (!isPortableArtifactPath(match.relative)) fail('PATH_ESCAPE', 'Um artefato não pôde ser normalizado com segurança.');
        assertSafeReference(match.relative);
        const known = byPath.get(match.relative);
        if (known && known.artifactType !== artifactType) {
          fail('AMBIGUOUS_ARTIFACT', 'Um arquivo corresponde a mais de um tipo de artefato.');
        }
        if (known) {
          known.patterns.add(pattern);
        } else {
          byPath.set(match.relative, { artifactType, patterns: new Set([pattern]), file: match });
        }
      }
    }
  }

  const entries = [];
  for (const [relative, discovered] of [...byPath.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const metadata = await metadataFor(discovered.file);
    const confirmationRequired = rules.artifactIndex.confirmationRequiredByDefault;
    entries.push({
      artifactType: discovered.artifactType,
      path: relative,
      sha256: metadata.sha256,
      sizeBytes: metadata.sizeBytes,
      origin: {
        kind: 'declared_glob',
        rule: `artifactGlobs.${discovered.artifactType}`,
        patterns: [...discovered.patterns].sort(),
      },
      confirmationStatus: confirmationRequired ? 'pending_confirmation' : 'confirmed',
      satisfiesCriticalRequirement: !confirmationRequired,
    });
  }

  return validateArtifactIndex({
    schemaVersion: INDEX_SCHEMA_VERSION,
    project: { slug: path.basename(root) },
    rules: {
      schemaVersion: String(rules.schemaVersion || 'unknown'),
      confirmationRequiredByDefault: rules.artifactIndex.confirmationRequiredByDefault,
    },
    entries,
    summary: {
      total: entries.length,
      confirmed: entries.filter((entry) => entry.confirmationStatus === 'confirmed').length,
      pendingConfirmation: entries.filter((entry) => entry.confirmationStatus === 'pending_confirmation').length,
    },
  }, rules);
}

function exactKeys(value, expected) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join('|') === [...expected].sort().join('|');
}

export function validateArtifactIndex(index, rules) {
  validateRules(rules);
  try {
    return globalThis.SkillSurfaceContract.validateArtifactIndex(index, rules);
  } catch (error) {
    if (error?.code === 'INVALID_ARTIFACT_INDEX') fail('INVALID_INDEX', error.message);
    fail('INVALID_INDEX', 'O ArtifactIndex não corresponde ao contrato v1.');
  }
}

export function confirmArtifact(index, { artifactType, path: artifactPath }, rules) {
  validateArtifactIndex(index, rules);
  if (!SAFE_TYPE.test(artifactType || '') || !isPortableArtifactPath(artifactPath)) {
    fail('INVALID_CONFIRMATION', 'A confirmação de artefato é inválida.');
  }
  assertSafeReference(artifactPath);
  const clone = structuredClone(index);
  const target = clone.entries.find((entry) => entry.artifactType === artifactType && entry.path === artifactPath);
  if (!target) fail('ARTIFACT_NOT_FOUND', 'O artefato solicitado não existe no índice.');
  target.confirmationStatus = 'confirmed';
  target.satisfiesCriticalRequirement = true;
  clone.summary.confirmed = clone.entries.filter((entry) => entry.confirmationStatus === 'confirmed').length;
  clone.summary.pendingConfirmation = clone.entries.length - clone.summary.confirmed;
  return validateArtifactIndex(clone, rules);
}

function parseArgs(argv) {
  const result = { confirmations: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--project') result.projectRoot = argv[++index];
    else if (token === '--rules') result.rulesPath = argv[++index];
    else if (token === '--output') result.outputPath = argv[++index];
    else if (token === '--confirm') result.confirmations.push(argv[++index]);
    else fail('INVALID_ARGUMENT', 'Argumento de CLI não reconhecido.');
  }
  if (!result.projectRoot || !result.rulesPath) {
    fail('INVALID_ARGUMENT', 'Use --project e --rules para gerar o ArtifactIndex.');
  }
  return result;
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  let rules;
  try {
    rules = JSON.parse(await readFile(args.rulesPath, 'utf8'));
  } catch {
    fail('INVALID_RULES', 'Não foi possível carregar as regras de artefatos.');
  }
  let index = await buildArtifactIndex({ projectRoot: args.projectRoot, rules });
  for (const value of args.confirmations) {
    const separator = value?.indexOf(':') ?? -1;
    if (separator <= 0) fail('INVALID_CONFIRMATION', 'Use --confirm tipo:path-relativo.');
    index = confirmArtifact(index, { artifactType: value.slice(0, separator), path: value.slice(separator + 1) }, rules);
  }
  const serialized = `${JSON.stringify(index, null, 2)}\n`;
  if (args.outputPath) await writeFile(args.outputPath, serialized, { flag: 'wx' });
  else process.stdout.write(serialized);
}

const invokedAsCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsCli) {
  runCli().catch((error) => {
    const code = error instanceof ArtifactIndexError ? error.code : 'UNEXPECTED_ERROR';
    const message = error instanceof ArtifactIndexError ? error.message : 'Falha inesperada ao gerar o ArtifactIndex.';
    process.stderr.write(`${code}: ${message}\n`);
    process.exitCode = 1;
  });
}
