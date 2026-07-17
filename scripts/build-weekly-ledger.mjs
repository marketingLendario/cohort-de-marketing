import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { createHash, randomBytes } from 'node:crypto';
import {
  link, lstat, mkdir, open, readFile, rename, rm, rmdir, stat, unlink, writeFile,
} from 'node:fs/promises';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAula04Contract } from './validate-aula-04-contracts.mjs';

const LEDGER_VERSION = '1.1.0';
const PROJECTION_DIGEST_VERSION = '1.0.0';
const PROJECTION_DIGEST_ALGORITHM = 'sha256';
const LEDGER_SCHEMA_URL = new URL('../data/contracts/weekly-ledger.v1.schema.json', import.meta.url);
const SOURCE_REFERENCE_KINDS = new Set([
  'checkout-export',
  'operator-declaration',
  'platform-export',
  'tracking-audit',
]);
const PREMISE_REFERENCE_KINDS = new Set(['assumption']);
const REFERENCE_PATTERN = /^ref:([a-z][a-z0-9-]{0,31}):([a-z0-9][a-z0-9.-]{0,127})$/;
const DEFAULT_LOCK_TIMEOUT_MS = 10_000;
const DEFAULT_LOCK_RETRY_MS = 20;
const DEFAULT_LOCK_STALE_MS = 30_000;
const DEFAULT_CAS_RETRIES = 64;
const LOCK_INITIALIZATION_GRACE_MS = 1_000;
const EMPTY_LEDGER = Object.freeze({
  contract: 'WeeklyLedger',
  schemaVersion: LEDGER_VERSION,
  hashAlgorithm: 'sha256',
  projectionDigestVersion: PROJECTION_DIGEST_VERSION,
  projectionDigestAlgorithm: PROJECTION_DIGEST_ALGORITHM,
  entries: Object.freeze([]),
  index: Object.freeze([]),
});

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareIdentity(left, right) {
  return compareText(left.projectId, right.projectId)
    || compareText(left.campaignId, right.campaignId)
    || compareText(left.weekStart, right.weekStart)
    || left.revision - right.revision;
}

function identityOf(record) {
  return {
    projectId: record.projectId,
    campaignId: record.campaignId,
    weekStart: record.weekStart,
    revision: record.revision,
  };
}

function identityKey(record) {
  return JSON.stringify([
    record.projectId,
    record.campaignId,
    record.weekStart,
    record.revision,
  ]);
}

function integerOption(name, fallback, minimum) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= minimum ? parsed : fallback;
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function numericLexemeIsSafe(lexeme) {
  const value = Number(lexeme);
  if (!Number.isFinite(value)) return false;
  const mantissa = lexeme.toLowerCase().split('e')[0].replace(/^-/, '');
  const nonZeroMantissa = /[1-9]/.test(mantissa);
  if (value === 0 && nonZeroMantissa) return false;
  if (Number.isInteger(value)) return Number.isSafeInteger(value);
  const significantDigits = mantissa
    .replace('.', '')
    .replace(/^0+/, '')
    .replace(/0+$/, '');
  return significantDigits.length <= 15;
}

export function jsonHasUnsafeNumber(input) {
  for (let index = 0; index < input.length;) {
    if (input[index] === '"') {
      index += 1;
      while (index < input.length) {
        if (input[index] === '\\') {
          index += 2;
        } else if (input[index] === '"') {
          index += 1;
          break;
        } else {
          index += 1;
        }
      }
      continue;
    }
    if (input[index] === '-' || /[0-9]/.test(input[index])) {
      const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(input.slice(index));
      if (match) {
        if (!numericLexemeIsSafe(match[0])) return true;
        index += match[0].length;
        continue;
      }
    }
    index += 1;
  }
  return false;
}

function lockPathFor(ledgerPath) {
  return path.join(path.dirname(ledgerPath), `.${path.basename(ledgerPath)}.lock`);
}

function processIsAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== 'ESRCH';
  }
}

function sameFileIdentity(left, right) {
  return left?.dev === right?.dev && left?.ino === right?.ino;
}

function validLockOwner(owner) {
  const createdAtMs = Date.parse(owner?.createdAt);
  if (
    owner?.version !== 1
    || !Number.isSafeInteger(owner.pid)
    || typeof owner.token !== 'string'
    || owner.token.length === 0
    || !Number.isFinite(createdAtMs)
    || createdAtMs > Date.now() + 60_000
  ) return null;
  return owner;
}

async function readOwnerFile(ownerPath) {
  try {
    return validLockOwner(JSON.parse(await readFile(ownerPath, 'utf8')));
  } catch {
    return null;
  }
}

async function readLockState(lockPath) {
  let lockStat;
  try {
    lockStat = await lstat(lockPath);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  if (!lockStat.isDirectory() || lockStat.isSymbolicLink()) {
    return { lockStat, owner: null, ownerStat: null };
  }

  const ownerPath = path.join(lockPath, 'owner.json');
  try {
    const ownerStat = await lstat(ownerPath);
    if (!ownerStat.isFile() || ownerStat.isSymbolicLink()) {
      return { lockStat, owner: null, ownerStat };
    }
    return { lockStat, ownerStat, owner: await readOwnerFile(ownerPath) };
  } catch (error) {
    if (error.code === 'ENOENT') return { lockStat, owner: null, ownerStat: null };
    throw error;
  }
}

function lockMatchesState(lock, state) {
  return Boolean(
    state?.owner
    && state.owner.pid === lock.pid
    && state.owner.token === lock.token
    && sameFileIdentity(state.lockStat, lock.lockStat)
    && sameFileIdentity(state.ownerStat, lock.ownerStat),
  );
}

function ownerMatchesState(owner, ownerStat, state) {
  return Boolean(
    owner
    && state?.owner
    && owner.pid === state.owner.pid
    && owner.token === state.owner.token
    && owner.createdAt === state.owner.createdAt
    && sameFileIdentity(ownerStat, state.ownerStat),
  );
}

async function restoreQuarantinedOwner(quarantinePath, ownerPath) {
  try {
    await link(quarantinePath, ownerPath);
  } catch {
    // Never overwrite a replacement owner while restoring a disputed claim.
  }
  await unlink(quarantinePath).catch(() => {});
}

async function removeClaimedDirectoryLock(lockPath, state) {
  if (!state?.owner || !state.ownerStat) return false;
  const ownerPath = path.join(lockPath, 'owner.json');
  const quarantinePath = `${lockPath}.owner.${process.pid}.${randomBytes(8).toString('hex')}.quarantine`;
  try {
    await rename(ownerPath, quarantinePath);
  } catch {
    return false;
  }

  let quarantineStat;
  let quarantineOwner;
  try {
    quarantineStat = await lstat(quarantinePath);
    quarantineOwner = await readOwnerFile(quarantinePath);
  } catch {
    await restoreQuarantinedOwner(quarantinePath, ownerPath);
    return false;
  }
  if (!ownerMatchesState(quarantineOwner, quarantineStat, state)) {
    await restoreQuarantinedOwner(quarantinePath, ownerPath);
    return false;
  }

  try {
    await rmdir(lockPath);
  } catch {
    await restoreQuarantinedOwner(quarantinePath, ownerPath);
    return false;
  }
  await unlink(quarantinePath).catch(() => {});
  return true;
}

async function quarantineNonDirectoryLock(lockPath, observedStat) {
  const quarantinePath = `${lockPath}.${process.pid}.${randomBytes(8).toString('hex')}.quarantine`;
  try {
    await rename(lockPath, quarantinePath);
  } catch {
    return false;
  }
  try {
    const quarantineStat = await lstat(quarantinePath);
    if (!sameFileIdentity(quarantineStat, observedStat)) {
      try {
        await lstat(lockPath);
      } catch (error) {
        if (error.code === 'ENOENT') await rename(quarantinePath, lockPath).catch(() => {});
      }
      return false;
    }
    await rm(quarantinePath, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

async function removeAbandonedLock(lockPath, staleMs) {
  const state = await readLockState(lockPath);
  if (!state) return true;
  if (!state.lockStat.isDirectory() || state.lockStat.isSymbolicLink()) {
    if (Date.now() - state.lockStat.mtimeMs < staleMs) return false;
    return quarantineNonDirectoryLock(lockPath, state.lockStat);
  }
  if (state.owner) {
    const ageMs = Date.now() - Date.parse(state.owner.createdAt);
    if (processIsAlive(state.owner.pid) || ageMs < staleMs) return false;
    return removeClaimedDirectoryLock(lockPath, state);
  }

  try {
    const minimumAgeMs = Math.max(staleMs, LOCK_INITIALIZATION_GRACE_MS);
    if (Date.now() - state.lockStat.mtimeMs < minimumAgeMs) return false;
    await rmdir(lockPath);
    return true;
  } catch (error) {
    return error.code === 'ENOENT';
  }
}

async function acquireLedgerLock(ledgerPath) {
  const lockPath = lockPathFor(ledgerPath);
  const timeoutMs = integerOption('WEEKLY_LEDGER_LOCK_TIMEOUT_MS', DEFAULT_LOCK_TIMEOUT_MS, 1);
  const retryMs = integerOption('WEEKLY_LEDGER_LOCK_RETRY_MS', DEFAULT_LOCK_RETRY_MS, 1);
  const staleMs = integerOption('WEEKLY_LEDGER_LOCK_STALE_MS', DEFAULT_LOCK_STALE_MS, 1);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const token = randomBytes(16).toString('hex');
    let createdLockDirectory = false;
    try {
      await mkdir(lockPath);
      createdLockDirectory = true;
      const owner = {
        version: 1,
        pid: process.pid,
        token,
        createdAt: new Date().toISOString(),
      };
      const initializationDelayMs = integerOption(
        'WEEKLY_LEDGER_TEST_LOCK_INIT_DELAY_MS',
        0,
        0,
      );
      if (initializationDelayMs > 0) await delay(initializationDelayMs);
      await writeFile(path.join(lockPath, 'owner.json'), `${JSON.stringify(owner)}\n`, { flag: 'wx' });
      const state = await readLockState(lockPath);
      if (
        state?.owner?.pid === process.pid
        && state.owner.token === token
        && state.ownerStat
      ) {
        return {
          lockPath,
          pid: process.pid,
          token,
          lockStat: state.lockStat,
          ownerStat: state.ownerStat,
        };
      }
    } catch (error) {
      if (!createdLockDirectory && error.code !== 'EEXIST') return null;
      if (createdLockDirectory) {
        await rmdir(lockPath).catch(() => {});
        if (error.code !== 'ENOENT' && error.code !== 'EEXIST') return null;
      }
    }
    await removeAbandonedLock(lockPath, staleMs);
    if (Date.now() <= deadline) await delay(retryMs);
  }
  return null;
}

async function ledgerLockIsOwned(lock) {
  if (!lock) return false;
  return lockMatchesState(lock, await readLockState(lock.lockPath));
}

async function releaseLedgerLock(lock) {
  if (!lock) return;
  const state = await readLockState(lock.lockPath);
  if (!lockMatchesState(lock, state)) return;
  await removeClaimedDirectoryLock(lock.lockPath, state);
}

function provenanceReference(value, allowedKinds) {
  if (typeof value !== 'string') return null;
  const match = REFERENCE_PATTERN.exec(value);
  if (!match || !allowedKinds.has(match[1])) return null;
  return { kind: match[1], id: match[2] };
}

function validateProvenanceReferences(panels) {
  for (const { panel, line } of panels) {
    for (let metricIndex = 0; metricIndex < panel.metrics.length; metricIndex += 1) {
      const metric = panel.metrics[metricIndex];
      if (!provenanceReference(metric.source, SOURCE_REFERENCE_KINDS)) {
        return {
          valid: false,
          code: 'INVALID_METRIC_PROVENANCE_REFERENCE',
          line,
          metricIndex,
          field: 'source',
        };
      }
      if (
        metric.premise !== null
        && !provenanceReference(metric.premise, PREMISE_REFERENCE_KINDS)
      ) {
        return {
          valid: false,
          code: 'INVALID_METRIC_PROVENANCE_REFERENCE',
          line,
          metricIndex,
          field: 'premise',
        };
      }
    }
  }
  return null;
}

/**
 * RFC 8785 is deliberately not claimed here. WeeklyLedger v1 freezes this
 * simpler JSON-domain algorithm: recursively sort object keys, preserve array
 * order, then emit compact JSON with JSON.stringify.
 */
export function canonicalSerialize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalSerialize).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort(compareText).map((key) => (
      `${JSON.stringify(key)}:${canonicalSerialize(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function canonicalHash(record) {
  return createHash('sha256').update(canonicalSerialize(record), 'utf8').digest('hex');
}

export function projectionDigestForEntry(entry) {
  const { projectionDigest: _projectionDigest, ...projection } = entry;
  return canonicalHash(projection);
}

function metricReference(metric) {
  return {
    name: metric.name,
    value: metric.value,
    seal: metric.seal,
    sourceRef: provenanceReference(metric.source, SOURCE_REFERENCE_KINDS),
    attributionWindow: metric.attributionWindow,
    premiseRef: metric.premise === null
      ? null
      : provenanceReference(metric.premise, PREMISE_REFERENCE_KINDS),
    confirmedByHuman: metric.confirmedByHuman,
    cashConfirmed: metric.cashConfirmed,
  };
}

function ledgerEntry(panel) {
  const metrics = panel.metrics.map(metricReference);
  const projection = {
    projectId: panel.projectId,
    campaignId: panel.campaignId,
    weekStart: panel.weekStart,
    revision: panel.revision,
    weeklyPanelId: panel.id,
    schemaVersion: panel.schemaVersion,
    canonicalHash: canonicalHash(panel),
    metrics,
  };
  return {
    projectId: projection.projectId,
    campaignId: projection.campaignId,
    weekStart: projection.weekStart,
    revision: projection.revision,
    weeklyPanelId: projection.weeklyPanelId,
    schemaVersion: projection.schemaVersion,
    canonicalHash: projection.canonicalHash,
    projectionDigest: projectionDigestForEntry(projection),
    metrics,
  };
}

function buildIndex(entries) {
  const groups = new Map();
  entries.forEach((entry, entryIndex) => {
    const key = JSON.stringify([entry.projectId, entry.campaignId, entry.weekStart]);
    let group = groups.get(key);
    if (!group) {
      group = {
        projectId: entry.projectId,
        campaignId: entry.campaignId,
        weekStart: entry.weekStart,
        revisions: [],
      };
      groups.set(key, group);
    }
    group.revisions.push({ revision: entry.revision, entryIndex });
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      revisions: group.revisions.sort((left, right) => (
        left.revision - right.revision || left.entryIndex - right.entryIndex
      )),
    }))
    .sort(compareIdentity);
}

async function createLedgerValidator() {
  const schema = JSON.parse(await readFile(LEDGER_SCHEMA_URL, 'utf8'));
  const ajv = new Ajv2020({
    allErrors: true,
    coerceTypes: false,
    removeAdditional: false,
    strict: true,
    useDefaults: false,
    validateFormats: true,
  });
  addFormats(ajv);
  return ajv.compile(schema);
}

function sameJsonStructure(left, right) {
  return canonicalSerialize(left) === canonicalSerialize(right);
}

async function validateExistingLedger(ledger) {
  const validate = await createLedgerValidator();
  if (!validate(ledger)) return false;

  const identities = new Set();
  for (let index = 0; index < ledger.entries.length; index += 1) {
    const entry = ledger.entries[index];
    if (index > 0 && compareIdentity(ledger.entries[index - 1], entry) >= 0) return false;
    const key = identityKey(entry);
    if (identities.has(key)) return false;
    identities.add(key);
    if (projectionDigestForEntry(entry) !== entry.projectionDigest) return false;
    if (new Set(entry.metrics.map((metric) => metric.name)).size !== entry.metrics.length) return false;
  }
  return sameJsonStructure(ledger.index, buildIndex(ledger.entries));
}

async function parseInput(inputPath) {
  let input;
  try {
    input = await readFile(inputPath, 'utf8');
  } catch {
    return { ioError: 'Unable to read ledger input.\n' };
  }

  const lines = input.endsWith('\n') ? input.slice(0, -1).split('\n') : input.split('\n');
  if (lines.length === 1 && lines[0] === '') {
    return { parseError: 'Unable to parse ledger input at line 1.\n' };
  }

  const panels = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (jsonHasUnsafeNumber(lines[index])) {
      return { unsafeNumberLine: index + 1 };
    }
    let panel;
    try {
      panel = JSON.parse(lines[index]);
    } catch {
      return { parseError: `Unable to parse ledger input at line ${index + 1}.\n` };
    }
    panels.push({ panel, line: index + 1 });
  }
  return { panels };
}

async function validatePanels(panels, inputPath) {
  for (const { panel, line } of panels) {
    const result = await validateAula04Contract(panel, `${inputPath}:${line}`);
    if (panel?.contract !== 'WeeklyPanel' || !result.valid) {
      return {
        valid: false,
        code: 'INVALID_WEEKLY_PANEL',
        line,
        errors: result.errors,
      };
    }
  }
  return null;
}

async function readExistingLedger(ledgerPath) {
  try {
    const contents = await readFile(ledgerPath);
    const text = contents.toString('utf8');
    if (jsonHasUnsafeNumber(text)) return { invalid: true };
    const ledger = JSON.parse(text);
    if (!await validateExistingLedger(ledger)) return { invalid: true };
    return {
      ledger,
      exists: true,
      snapshot: { exists: true, hash: createHash('sha256').update(contents).digest('hex') },
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        ledger: structuredClone(EMPTY_LEDGER),
        exists: false,
        snapshot: { exists: false, hash: null },
      };
    }
    return { invalid: true };
  }
}

async function destinationSnapshot(destination) {
  try {
    const contents = await readFile(destination);
    return { exists: true, hash: createHash('sha256').update(contents).digest('hex') };
  } catch (error) {
    if (error.code === 'ENOENT') return { exists: false, hash: null };
    throw error;
  }
}

async function atomicWrite(destination, contents, expectedSnapshot, lock) {
  const temporary = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`,
  );
  let handle;
  try {
    handle = await open(temporary, 'wx');
    await handle.writeFile(contents, 'utf8');
    await handle.sync();
    await handle.close();
    handle = null;
    const beforeRenameDelayMs = integerOption(
      'WEEKLY_LEDGER_TEST_BEFORE_RENAME_DELAY_MS',
      0,
      0,
    );
    if (beforeRenameDelayMs > 0) await delay(beforeRenameDelayMs);
    if (!await ledgerLockIsOwned(lock)) {
      const error = new Error('Ledger lock ownership changed before CAS.');
      error.code = 'LEDGER_LOCK_OWNERSHIP_LOST';
      throw error;
    }
    const currentSnapshot = await destinationSnapshot(destination);
    if (
      currentSnapshot.exists !== expectedSnapshot.exists
      || currentSnapshot.hash !== expectedSnapshot.hash
    ) {
      const error = new Error('Ledger changed while the update was being prepared.');
      error.code = 'LEDGER_CAS_MISMATCH';
      throw error;
    }
    if (!await ledgerLockIsOwned(lock)) {
      const error = new Error('Ledger lock ownership changed before rename.');
      error.code = 'LEDGER_LOCK_OWNERSHIP_LOST';
      throw error;
    }
    await rename(temporary, destination);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export async function buildWeeklyLedger(panels, existingLedger) {
  const entries = existingLedger.entries.map((entry) => structuredClone(entry));
  const byIdentity = new Map(entries.map((entry) => [identityKey(entry), entry]));
  const candidates = panels.map(({ panel }) => ledgerEntry(panel)).sort(compareIdentity);
  let added = 0;
  let replayed = 0;

  for (const candidate of candidates) {
    const key = identityKey(candidate);
    const existing = byIdentity.get(key);
    if (existing) {
      if (existing.canonicalHash !== candidate.canonicalHash) {
        return { conflict: identityOf(candidate) };
      }
      replayed += 1;
      continue;
    }
    entries.push(candidate);
    byIdentity.set(key, candidate);
    added += 1;
  }
  entries.sort(compareIdentity);

  return {
    ledger: {
      contract: 'WeeklyLedger',
      schemaVersion: LEDGER_VERSION,
      hashAlgorithm: 'sha256',
      projectionDigestVersion: PROJECTION_DIGEST_VERSION,
      projectionDigestAlgorithm: PROJECTION_DIGEST_ALGORITHM,
      entries,
      index: buildIndex(entries),
    },
    added,
    replayed,
  };
}

async function main(args) {
  if (args.length !== 2) {
    process.stderr.write('Usage: node scripts/build-weekly-ledger.mjs <input.jsonl> <ledger.json>\n');
    return 2;
  }
  const [inputPath, ledgerPath] = args;
  if (resolve(inputPath) === resolve(ledgerPath)) {
    process.stderr.write('Input and ledger paths must be different.\n');
    return 2;
  }

  const parsed = await parseInput(inputPath);
  if (parsed.ioError) {
    process.stderr.write(parsed.ioError);
    return 2;
  }
  if (parsed.parseError) {
    process.stderr.write(parsed.parseError);
    return 2;
  }
  if (parsed.unsafeNumberLine) {
    process.stderr.write(`Unsafe JSON number at line ${parsed.unsafeNumberLine}.\n`);
    return 2;
  }

  const invalidPanel = await validatePanels(parsed.panels, inputPath);
  if (invalidPanel) {
    process.stdout.write(`${JSON.stringify(invalidPanel)}\n`);
    return 1;
  }

  const invalidProvenance = validateProvenanceReferences(parsed.panels);
  if (invalidProvenance) {
    process.stdout.write(`${JSON.stringify(invalidProvenance)}\n`);
    return 1;
  }

  try {
    if (!(await stat(path.dirname(ledgerPath))).isDirectory()) throw new Error('not a directory');
  } catch {
    process.stderr.write('Unable to write ledger atomically.\n');
    return 2;
  }

  const maxCasRetries = integerOption('WEEKLY_LEDGER_CAS_RETRIES', DEFAULT_CAS_RETRIES, 0);
  for (let attempt = 0; attempt <= maxCasRetries; attempt += 1) {
    const lock = await acquireLedgerLock(ledgerPath);
    if (!lock) {
      process.stderr.write('Unable to acquire ledger lock.\n');
      return 2;
    }

    let retryAfterCasMismatch = false;
    try {
      if (!await ledgerLockIsOwned(lock)) {
        process.stderr.write('Unable to retain ledger lock.\n');
        return 2;
      }
      const existing = await readExistingLedger(ledgerPath);
      if (existing.ioError) {
        process.stderr.write('Unable to read existing ledger.\n');
        return 2;
      }
      if (existing.invalid) {
        process.stdout.write(`${JSON.stringify({ valid: false, code: 'INVALID_EXISTING_LEDGER' })}\n`);
        return 1;
      }

      const result = await buildWeeklyLedger(parsed.panels, existing.ledger);
      if (result.conflict) {
        process.stdout.write(`${JSON.stringify({
          valid: false,
          code: 'LEDGER_IDENTITY_CONFLICT',
          identity: result.conflict,
        })}\n`);
        return 1;
      }

      if (!await validateExistingLedger(result.ledger)) {
        process.stdout.write(`${JSON.stringify({ valid: false, code: 'INVALID_GENERATED_LEDGER' })}\n`);
        return 1;
      }

      if (result.added > 0 || !existing.exists) {
        try {
          await atomicWrite(
            ledgerPath,
            `${JSON.stringify(result.ledger, null, 2)}\n`,
            existing.snapshot,
            lock,
          );
        } catch (error) {
          if (error.code === 'LEDGER_CAS_MISMATCH') {
            retryAfterCasMismatch = true;
          } else if (error.code === 'LEDGER_LOCK_OWNERSHIP_LOST') {
            process.stderr.write('Unable to retain ledger lock.\n');
            return 2;
          } else {
            process.stderr.write('Unable to write ledger atomically.\n');
            return 2;
          }
        }
      }
      if (!retryAfterCasMismatch) {
        process.stdout.write(`${JSON.stringify({
          added: result.added,
          replayed: result.replayed,
          total: result.ledger.entries.length,
        })}\n`);
        return 0;
      }
    } finally {
      await releaseLedgerLock(lock);
    }

    if (retryAfterCasMismatch && attempt < maxCasRetries) {
      await delay(integerOption('WEEKLY_LEDGER_LOCK_RETRY_MS', DEFAULT_LOCK_RETRY_MS, 1));
    }
  }

  process.stdout.write(`${JSON.stringify({
    valid: false,
    code: 'LEDGER_CONCURRENT_MODIFICATION',
  })}\n`);
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = await main(process.argv.slice(2));
}
