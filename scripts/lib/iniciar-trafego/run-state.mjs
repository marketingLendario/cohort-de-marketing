import { appendFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { aioxDir, ensureRunDirs, newId, readJson, writeJson } from './project-context.mjs';

export const RUN_STATE_FILE = 'current-run.json';
export const RUN_LOG_FILE = 'runs.jsonl';

/** Estados sancionados do workflow iniciar-trafego (handoff § lifecycle). */
export const RUN_STATES = [
  'PROJECT_UNRESOLVED',
  'PROJECT_RESOLVED',
  'ASSESSING',
  'BLOCKED',
  'INPUTS_READY',
  'PROPOSAL_SEED_READY',
  'PROPOSAL_PERSISTED',
  'AWAITING_APPROVAL',
  'APPROVED',
  'PANEL_WRITTEN',
  'PANEL_VALIDATED',
  'STUDIO_SYNCING',
  'STUDIO_SYNC_RETRYING',
  'STUDIO_SYNCED',
  'STUDIO_SYNC_FAILED',
  'STUDIO_READBACK_FAILED',
  'OPEN_DECISION',
  'OPENED',
  'NOT_OPENED',
  'READY_FOR_ZELADOR',
  'STALE',
  'STAGING',
  'ENSURING_STUDIO',
  'WAITING_OS_CONFIRMATION',
  'WAITING_REBOOT',
  'STUDIO_RUNTIME_READY',
  'STUDIO_VERIFYING',
  'FAILED',
  'CANCELLED',
];

const RESUME_BY_STATE = {
  PROPOSAL_SEED_READY: 'propose',
  PROPOSAL_PERSISTED: 'approve',
  AWAITING_APPROVAL: 'approve',
  APPROVED: 'approve',
  PANEL_WRITTEN: 'approve',
  PANEL_VALIDATED: 'approve',
  STUDIO_SYNCING: 'approve',
  STUDIO_SYNC_RETRYING: 'approve',
  STUDIO_SYNC_FAILED: 'approve',
  STUDIO_READBACK_FAILED: 'approve',
  STUDIO_SYNCED: 'open',
  OPEN_DECISION: 'open',
  OPENED: null,
  NOT_OPENED: null,
  READY_FOR_ZELADOR: null,
  STALE: 'propose',
  BLOCKED: 'start',
  ENSURING_STUDIO: 'approve',
  WAITING_OS_CONFIRMATION: 'approve',
  WAITING_REBOOT: 'approve',
  STUDIO_RUNTIME_READY: 'open',
  STUDIO_VERIFYING: 'approve',
  FAILED: 'start',
  CANCELLED: null,
};

/** Estados permitidos enquanto lockPhase=STUDIO_SYNCING (lock ≠ state). */
const STUDIO_SYNC_ALLOWED = new Set([
  'STUDIO_SYNCING',
  'PANEL_WRITTEN',
  'PANEL_VALIDATED',
  'STUDIO_SYNCED',
  'STUDIO_SYNC_FAILED',
  'STUDIO_READBACK_FAILED',
  'OPEN_DECISION',
  'ENSURING_STUDIO',
  'WAITING_OS_CONFIRMATION',
  'WAITING_REBOOT',
  'STUDIO_RUNTIME_READY',
  'STUDIO_VERIFYING',
]);

const PANEL_WRITE_STATES = new Set(['APPROVED', 'PANEL_WRITTEN', 'PANEL_VALIDATED']);

export function runStatePath(projectRoot) {
  return join(aioxDir(projectRoot), RUN_STATE_FILE);
}

export function loadRunState(projectRoot) {
  return readJson(runStatePath(projectRoot));
}

function appendRunLog(projectRoot, entry) {
  ensureRunDirs(projectRoot);
  appendFileSync(join(aioxDir(projectRoot), RUN_LOG_FILE), `${JSON.stringify(entry)}\n`, 'utf8');
}

export function ensureRunState(projectRoot, projectId) {
  ensureRunDirs(projectRoot);
  let run = loadRunState(projectRoot);
  if (run?.runId && run?.projectId === projectId) {
    if (!run.projectRoot) {
      run.projectRoot = resolve(projectRoot);
      writeJson(runStatePath(projectRoot), run);
    }
    return run;
  }
  run = {
    schemaVersion: '1.0.0',
    runId: newId('run'),
    projectId,
    projectRoot: resolve(projectRoot),
    state: 'PROJECT_RESOLVED',
    stateHistory: [{ state: 'PROJECT_RESOLVED', at: new Date().toISOString(), note: 'run inicializado' }],
    attempts: 0,
    lock: null,
    error: null,
    resumableAction: null,
    hashes: {},
    updatedAt: new Date().toISOString(),
  };
  writeJson(runStatePath(projectRoot), run);
  appendRunLog(projectRoot, { ts: run.updatedAt, event: 'init', runId: run.runId, state: run.state });
  return run;
}

export function transitionRunState(projectRoot, input) {
  const run = loadRunState(projectRoot);
  if (!run) throw new Error('Run state ausente — execute start antes de transicionar');
  if (!RUN_STATES.includes(input.state)) {
    throw new Error(`Estado invalido: ${input.state}`);
  }
  const lockPhase = run.lock ?? null;
  if (lockPhase) {
    const clearing = input.lock === null;
    const allowed = STUDIO_SYNC_ALLOWED.has(input.state) || input.state === lockPhase;
    if (!clearing && !allowed) {
      throw new Error(`Run bloqueado (${lockPhase}) — transição para ${input.state} não permitida`);
    }
  }
  const at = new Date().toISOString();
  const next = {
    ...run,
    state: input.state,
    projectRoot: input.projectRoot ? resolve(input.projectRoot) : (run.projectRoot ?? resolve(projectRoot)),
    stateHistory: [...(run.stateHistory ?? []), { state: input.state, at, note: input.note ?? undefined }],
    attempts: input.attempts ?? run.attempts ?? 0,
    lock: input.lock === undefined ? run.lock ?? null : input.lock,
    error: input.error === undefined ? run.error ?? null : input.error,
    resumableAction: input.resumableAction === undefined
      ? (RESUME_BY_STATE[input.state] ?? null)
      : input.resumableAction,
    hashes: input.hashes ? { ...(run.hashes ?? {}), ...input.hashes } : (run.hashes ?? {}),
    updatedAt: at,
  };
  writeJson(runStatePath(projectRoot), next);
  appendRunLog(projectRoot, {
    ts: at,
    event: 'transition',
    runId: next.runId,
    from: run.state,
    to: input.state,
    note: input.note ?? null,
  });
  return next;
}

export function resolveResumeAction(state) {
  return RESUME_BY_STATE[state] ?? null;
}

export function buildResumeHint(projectRoot, action, extra = {}) {
  const root = resolve(projectRoot);
  const projectArg = `--project="${root.replace(/"/g, '\\"')}"`;
  const execBase = `node scripts/iniciar-trafego.mjs resume ${projectArg} --execute`;
  if (action === 'propose') return `${execBase} # ou: node scripts/iniciar-trafego.mjs propose ${projectArg}`;
  if (action === 'approve') {
    const pid = extra.proposalId ? ` (proposal-id=${extra.proposalId})` : '';
    return `${execBase}${pid}`;
  }
  if (action === 'set-page-url') return `node scripts/iniciar-trafego.mjs set-page-url ${projectArg} --url=https://...`;
  if (action === 'open') return `${execBase}`;
  if (action === 'start') return `${execBase}`;
  return `${execBase}`;
}

export function assertPanelWriteAllowed(projectRoot) {
  const run = loadRunState(projectRoot);
  if (!run) throw new Error('Run state ausente — zero-write: painel bloqueado');
  if (!PANEL_WRITE_STATES.has(run.state) && run.state !== 'STUDIO_SYNCING') {
    throw new Error(`Zero-write: painel só após APPROVED (estado atual: ${run.state})`);
  }
}

export function markPanelWritten(projectRoot, panelHash) {
  transitionRunState(projectRoot, {
    state: 'PANEL_WRITTEN',
    note: 'painel materializado',
    hashes: panelHash ? { panelHash } : undefined,
  });
}

export function markPanelValidated(projectRoot) {
  transitionRunState(projectRoot, { state: 'PANEL_VALIDATED', note: 'painel validado' });
}
