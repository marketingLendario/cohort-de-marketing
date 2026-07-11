/**
 * STORY-8.W2.3 — Two-phase artifact approval saga.
 *
 * The BFF is the SINGLE authority that keeps the filesystem (the canonical
 * `projetos/{slug}/...` artifact written by the W1.3 materializer) and the
 * database (artifact metadata + skill_run decision + audit event) from silently
 * diverging. Materialization is backend-only (filesystem), so the whole decision
 * MUST be owned here — a browser-side write could not coordinate both surfaces.
 *
 * Phase 1 (plan): read-only. Reads the current filesystem state for every
 * affected path and returns an ACCURATE before/after diff, the affected files,
 * and write warnings. No side effect.
 *
 * Phase 2 (decide): an OUTBOX/COMPENSATION state machine keyed by an idempotency
 * key. Deterministic states let a crash on either side of the atomic rename be
 * repaired without duplicating the write:
 *
 *   approve: pending -> materializing -> materialized -> recording -> done
 *   reject:  pending -> rejected
 *
 * Every side effect is idempotent (materialize is a no-op on an identical hash;
 * artifact rows upsert by id; the skill_run transition is a guarded CAS), so
 * `repair` resumes from the persisted state and converges. The SAME proposal
 * SHA-256 is recorded across the filesystem (materializer `hashAfter`), the DB
 * (artifact `content_hash` + outbox row) and the audit event.
 */
import { createHash, randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ARTIFACT_WRITE_SCHEMA_VERSION,
  ArtifactMaterializerError,
  canonicalizeProjectArtifactPath,
  materializeArtifact,
  canonicalizeRelativeArtifactPath,
  readSafeArtifactFile,
  type ArtifactWriteRequest,
  type ArtifactWriteResult,
} from './artifact-materializer.js';

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export type ApprovalDecision = 'approve' | 'reject';
export type ApprovalState =
  | 'pending'
  | 'materializing'
  | 'materialized'
  | 'recording'
  | 'done'
  | 'rejected'
  | 'failed';

export const APPROVAL_TERMINAL_STATES: readonly ApprovalState[] = ['done', 'rejected', 'failed'];
export const APPROVAL_REPAIRABLE_STATES: readonly ApprovalState[] = [
  'pending',
  'materializing',
  'materialized',
  'recording',
];

export type ApprovalFormat = 'markdown' | 'json' | 'yaml' | 'html';

/** An artifact the human is approving — the exact bytes shown in Phase 1. */
export interface ApprovalArtifactInput {
  artifactType: string;
  title: string;
  /** Relative to `projetos/{slug}/`. */
  path: string;
  format: ApprovalFormat;
  content: string;
}

/**
 * A planned artifact record — id is generated once and reused across repairs.
 * The approved `content` is captured here so a repair re-materializes the exact
 * bytes the human approved, independent of any later edit to the run.
 */
export interface PlannedArtifact {
  artifactId: string;
  artifactType: string;
  title: string;
  path: string;
  format: ApprovalFormat;
  content: string;
  /** SHA-256 of the content once materialized (the cross-surface anchor per file). */
  contentHash: string | null;
}

export type ApprovalOutcome = 'written' | 'unchanged' | 'conflict' | 'rejected';

/** Serializable audit event emitted for every decision. */
export interface ApprovalAuditEvent {
  event: 'artifact.approval';
  schemaVersion: typeof ARTIFACT_WRITE_SCHEMA_VERSION;
  decision: ApprovalDecision;
  workspaceId: string;
  projectId: string;
  skillRunId: string;
  proposalHash: string;
  proposalRevision: number;
  outcome: ApprovalOutcome;
  files: Array<{ path: string; hashBefore: string | null; hashAfter: string | null; outcome: string }>;
  timestamp: string;
}

export interface ApprovalOutboxRecord {
  id: string;
  workspaceId: string;
  projectId: string;
  skillRunId: string;
  idempotencyKey: string;
  decision: ApprovalDecision;
  proposalHash: string;
  proposalRevision: number;
  state: ApprovalState;
  outcome: ApprovalOutcome | null;
  plan: PlannedArtifact[];
  auditEvent: ApprovalAuditEvent | null;
  error: string | null;
  attempt: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApprovalOutboxInput {
  workspaceId: string;
  projectId: string;
  skillRunId: string;
  idempotencyKey: string;
  decision: ApprovalDecision;
  proposalHash: string;
  proposalRevision: number;
  plan: PlannedArtifact[];
}

/** Fields a transition may mutate. */
export interface ApprovalOutboxPatch {
  state?: ApprovalState;
  outcome?: ApprovalOutcome | null;
  plan?: PlannedArtifact[];
  auditEvent?: ApprovalAuditEvent | null;
  error?: string | null;
  attempt?: number;
}

/** The durable outbox journal (Supabase in prod; in-memory fake in tests). */
export interface ArtifactApprovalStore {
  getByKey(workspaceId: string, idempotencyKey: string): Promise<ApprovalOutboxRecord | undefined>;
  getBySemantic(workspaceId: string, skillRunId: string, proposalRevision: number): Promise<ApprovalOutboxRecord | undefined>;
  getById(id: string): Promise<ApprovalOutboxRecord | undefined>;
  create(input: CreateApprovalOutboxInput): Promise<ApprovalOutboxRecord>;
  advance(id: string, patch: ApprovalOutboxPatch): Promise<ApprovalOutboxRecord>;
  /** Rows stuck mid-saga (a crash before/after the atomic rename). */
  listRepairable(): Promise<ApprovalOutboxRecord[]>;
}

/** The current authoritative state of the domain skill run being reviewed. */
export interface ApprovalRunState {
  workspaceId: string;
  projectId: string;
  projectSlug: string;
  status: string;
  proposalRevision: number;
  proposalHash: string | null;
}

export interface FinalizeApprovalInput {
  workspaceId: string;
  projectId: string;
  skillRunId: string;
  expectedRevision: number;
  proposalHash: string;
  artifacts: Array<{
    artifactId: string;
    artifactType: string;
    title: string;
    path: string;
    format: ApprovalFormat;
    content: string;
    contentHash: string;
  }>;
}

export interface FinalizeRejectionInput {
  workspaceId: string;
  projectId: string;
  skillRunId: string;
  expectedRevision: number;
}

/**
 * Domain-side writes for a decision (backed by `skill_runs` + `project_artifacts`
 * via service-role, or a fake in tests). The skill_run transition is a guarded
 * compare-and-swap on `(proposal_revision, status)` so a concurrent edit cannot
 * be silently overwritten — `committed: false` means the proposal was superseded.
 */
export interface ApprovalRunGateway {
  getRunState(skillRunId: string): Promise<ApprovalRunState | undefined>;
  finalizeApproval(input: FinalizeApprovalInput): Promise<{ committed: boolean }>;
  finalizeRejection(input: FinalizeRejectionInput): Promise<{ committed: boolean }>;
}

export type ApprovalErrorCode =
  | 'run-not-found'
  | 'not-reviewable'
  | 'stale'
  | 'hash-mismatch'
  | 'invalid-path'
  | 'duplicate-path'
  | 'idempotency-conflict'
  | 'superseded'
  | 'write-failed';

export class ArtifactApprovalError extends Error {
  readonly code: ApprovalErrorCode;
  constructor(code: ApprovalErrorCode, message: string) {
    super(message);
    this.name = 'ArtifactApprovalError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Proposal hash — MUST match `src/lib/artifact-approval.ts` (golden fixture test)
// ---------------------------------------------------------------------------

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Canonical SHA-256 of the artifacts a proposal would materialize. Order-
 * independent (paths are sorted) and stable (only path/format/content matter),
 * so the browser and the BFF derive the SAME hash from the same proposal. This
 * is the integrity anchor: an edited proposal produces a different hash, which
 * invalidates a stale approval still carrying the old expected hash.
 */
export function computeProposalHash(artifacts: ApprovalArtifactInput[], projectSlug?: string): string {
  const canonical = normalizeApprovalArtifacts(artifacts, projectSlug)
    .map((artifact) => ({ path: artifact.path, format: artifact.format, content: artifact.content }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return sha256(JSON.stringify(canonical));
}

/** Normalize every proposal path before hashing, planning, persistence or write. */
export function normalizeApprovalArtifacts(artifacts: ApprovalArtifactInput[], projectSlug?: string): ApprovalArtifactInput[] {
  const seen = new Set<string>();
  return artifacts.map((artifact) => {
    let path: string;
    try {
      path = projectSlug
        ? canonicalizeProjectArtifactPath(projectSlug, artifact.path)
        : canonicalizeRelativeArtifactPath(artifact.path);
    } catch (error) {
      if (error instanceof ArtifactMaterializerError) {
        throw new ArtifactApprovalError('invalid-path', error.message);
      }
      throw error;
    }
    if (seen.has(path)) {
      throw new ArtifactApprovalError(
        'duplicate-path',
        `A proposta contém mais de um artefato para o caminho canônico ${JSON.stringify(path)}.`,
      );
    }
    seen.add(path);
    return { ...artifact, path };
  });
}

function canonicalPlanValue(artifacts: ApprovalArtifactInput[], projectSlug?: string): Array<{
  artifactType: string;
  title: string;
  path: string;
  format: ApprovalFormat;
  content: string;
}> {
  return normalizeApprovalArtifacts(artifacts, projectSlug)
    .map(({ artifactType, title, path, format, content }) => ({ artifactType, title, path, format, content }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

function storedPlanValue(plan: PlannedArtifact[]): ReturnType<typeof canonicalPlanValue> {
  return plan
    .map(({ artifactType, title, path, format, content }) => ({ artifactType, title, path, format, content }))
    .map((artifact) => ({ ...artifact, path: canonicalizeRelativeArtifactPath(artifact.path) }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

function plansMatch(record: ApprovalOutboxRecord, artifacts: ApprovalArtifactInput[], projectSlug?: string): boolean {
  return JSON.stringify(storedPlanValue(record.plan)) === JSON.stringify(canonicalPlanValue(artifacts, projectSlug));
}

// ---------------------------------------------------------------------------
// Phase 1 — plan (read-only diff)
// ---------------------------------------------------------------------------

export type FileChangeType = 'create' | 'modify' | 'unchanged';

export interface ApprovalFileDiff {
  path: string;
  artifactType: string;
  format: ApprovalFormat;
  changeType: FileChangeType;
  hashBefore: string | null;
  hashAfter: string;
  addedLines: number;
  removedLines: number;
  /** Compact preview: `- ` removed / `+ ` added lines (truncated). */
  preview: string[];
}

export interface ApprovalPlan {
  skillRunId: string;
  projectSlug: string;
  proposalHash: string;
  proposalRevision: number;
  /** True when the submitted proposal already matches the run's authoritative hash. */
  fresh: boolean;
  files: ApprovalFileDiff[];
  warnings: string[];
}

const PREVIEW_LINES = 40;

/** Minimal, accurate whole-file line diff (common prefix/suffix trimming). */
export function diffLines(before: string, after: string): { added: number; removed: number; preview: string[] } {
  if (before === after) return { added: 0, removed: 0, preview: [] };
  const beforeLines = before.length ? before.split('\n') : [];
  const afterLines = after.length ? after.split('\n') : [];
  let prefix = 0;
  while (prefix < beforeLines.length && prefix < afterLines.length && beforeLines[prefix] === afterLines[prefix]) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < beforeLines.length - prefix &&
    suffix < afterLines.length - prefix &&
    beforeLines[beforeLines.length - 1 - suffix] === afterLines[afterLines.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const removed = beforeLines.slice(prefix, beforeLines.length - suffix);
  const added = afterLines.slice(prefix, afterLines.length - suffix);
  const preview = [
    ...removed.map((line) => `- ${line}`),
    ...added.map((line) => `+ ${line}`),
  ].slice(0, PREVIEW_LINES);
  return { added: added.length, removed: removed.length, preview };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export interface ArtifactApprovalServiceDeps {
  store: ArtifactApprovalStore;
  runs: ApprovalRunGateway;
  /** Absolute path of `projetos/`. */
  projectsRoot: string;
  /** Injectable materializer (default: the W1.3 atomic materializer). */
  materialize?: (
    request: ArtifactWriteRequest,
    options: { projectsRoot: string; now?: () => Date },
  ) => Promise<ArtifactWriteResult>;
  now?: () => Date;
  /**
   * Fault hooks around the atomic rename (tests). `beforeRename` throws before
   * any file is written (repair re-materializes); `afterRename` throws after the
   * rename + the `materialized` checkpoint is persisted (repair resumes the DB
   * record). Never passed in production.
   */
  faults?: { beforeRename?: () => void | Promise<void>; afterRename?: () => void | Promise<void> };
}

export interface DecideApprovalInput {
  skillRunId: string;
  decision: ApprovalDecision;
  expectedProposalHash: string;
  expectedProposalRevision: number;
  idempotencyKey: string;
  /** Required for `approve`; ignored for `reject`. */
  artifacts?: ApprovalArtifactInput[];
}

export interface ArtifactApprovalService {
  plan(input: { skillRunId: string; artifacts: ApprovalArtifactInput[] }): Promise<ApprovalPlan>;
  decide(input: DecideApprovalInput): Promise<ApprovalOutboxRecord>;
  repair(id: string): Promise<ApprovalOutboxRecord>;
  repairAll(): Promise<ApprovalOutboxRecord[]>;
}

/**
 * Read the current canonical file for the Phase-1 diff. Reuses the SAME
 * root-containment + anti-symlink discipline as the W1.3 materializer
 * (`readSafeArtifactFile`) — read-only, no directories created — so a
 * symlink planted under `projetos/{slug}/` (leaf or intermediate ancestor)
 * cannot redirect this read outside the project root (P3-01).
 */
async function readCurrentFile(projectsRoot: string, slug: string, relativePath: string): Promise<string | null> {
  let canonicalPath: string;
  try {
    canonicalPath = canonicalizeRelativeArtifactPath(relativePath);
  } catch (error) {
    if (error instanceof ArtifactMaterializerError) {
      throw new ArtifactApprovalError('invalid-path', error.message);
    }
    throw error;
  }
  try {
    return await readSafeArtifactFile(projectsRoot, slug, canonicalPath);
  } catch (error) {
    if (error instanceof ArtifactMaterializerError) {
      throw new ArtifactApprovalError('write-failed', error.message);
    }
    throw error;
  }
}

export function createArtifactApprovalService(deps: ArtifactApprovalServiceDeps): ArtifactApprovalService {
  const materialize = deps.materialize ?? materializeArtifact;
  const clock = deps.now ?? (() => new Date());

  async function loadReviewableRun(skillRunId: string): Promise<ApprovalRunState> {
    const state = await deps.runs.getRunState(skillRunId);
    if (!state) throw new ArtifactApprovalError('run-not-found', `Skill run ${skillRunId} não encontrado.`);
    return state;
  }

  function assertRecordSemantics(
    record: ApprovalOutboxRecord,
    run: ApprovalRunState,
    input: DecideApprovalInput,
    artifacts: ApprovalArtifactInput[],
  ): void {
    const sameSemantics =
      record.workspaceId === run.workspaceId &&
      record.projectId === run.projectId &&
      record.skillRunId === input.skillRunId &&
      record.decision === input.decision &&
      record.proposalHash === input.expectedProposalHash &&
      record.proposalRevision === input.expectedProposalRevision &&
      plansMatch(record, artifacts, run.projectSlug);
    if (!sameSemantics) {
      throw new ArtifactApprovalError(
        'idempotency-conflict',
        'A chave de idempotência ou a identidade semântica já pertence a outra decisão; nenhuma alteração foi aplicada.',
      );
    }
  }

  async function plan(input: { skillRunId: string; artifacts: ApprovalArtifactInput[] }): Promise<ApprovalPlan> {
    const run = await loadReviewableRun(input.skillRunId);
    const artifacts = normalizeApprovalArtifacts(input.artifacts, run.projectSlug);
    const proposalHash = computeProposalHash(artifacts, run.projectSlug);
    const warnings: string[] = [];
    const files: ApprovalFileDiff[] = [];
    for (const artifact of artifacts) {
      const before = await readCurrentFile(deps.projectsRoot, run.projectSlug, artifact.path);
      const hashAfter = sha256(artifact.content);
      const hashBefore = before === null ? null : sha256(before);
      const changeType: FileChangeType =
        before === null ? 'create' : hashBefore === hashAfter ? 'unchanged' : 'modify';
      const { added, removed, preview } = diffLines(before ?? '', artifact.content);
      if (changeType === 'modify') {
        warnings.push(`"${artifact.path}" já existe e será sobrescrito (${removed} linha(s) removida(s), ${added} adicionada(s)).`);
      }
      files.push({
        path: artifact.path,
        artifactType: artifact.artifactType,
        format: artifact.format,
        changeType,
        hashBefore,
        hashAfter,
        addedLines: added,
        removedLines: removed,
        preview,
      });
    }
    return {
      skillRunId: input.skillRunId,
      projectSlug: run.projectSlug,
      proposalHash,
      proposalRevision: run.proposalRevision,
      fresh: run.proposalHash === null || run.proposalHash === proposalHash,
      files,
      warnings,
    };
  }

  async function decide(input: DecideApprovalInput): Promise<ApprovalOutboxRecord> {
    const run = await loadReviewableRun(input.skillRunId);
    const artifacts = input.decision === 'approve' ? normalizeApprovalArtifacts(input.artifacts ?? [], run.projectSlug) : [];

    // Idempotent replay / resume is semantic, not merely lexical. A reused key
    // must describe the same tenant/run/project, decision, revision, hash and
    // immutable canonical plan before it can resume any side effect.
    const existingByKey = await deps.store.getByKey(run.workspaceId, input.idempotencyKey);
    const existingBySemantic = existingByKey ?? await deps.store.getBySemantic(
      run.workspaceId,
      input.skillRunId,
      input.expectedProposalRevision,
    );
    const expectedPlan = artifacts;
    if (existingBySemantic) {
      assertRecordSemantics(existingBySemantic, run, input, expectedPlan);
      if (APPROVAL_TERMINAL_STATES.includes(existingBySemantic.state)) return existingBySemantic;
      return resume(existingBySemantic);
    }

    // Staleness gate (approve & reject): the run must still be reviewable at the
    // expected revision + hash. An edit bumps the revision and hash, which
    // invalidates a stale expected hash here BEFORE any write.
    if (run.status !== 'needs_review') {
      throw new ArtifactApprovalError('not-reviewable', `Skill run ${input.skillRunId} não está em revisão (${run.status}).`);
    }
    if (run.proposalRevision !== input.expectedProposalRevision) {
      throw new ArtifactApprovalError(
        'stale',
        `Revisão da proposta divergente: atual ${run.proposalRevision}, esperada ${input.expectedProposalRevision}. A proposta foi editada — recarregue e revise novamente.`,
      );
    }
    if (run.proposalHash !== null && run.proposalHash !== input.expectedProposalHash) {
      throw new ArtifactApprovalError(
        'stale',
        'Hash da proposta divergente: a proposta foi editada. Recarregue e revise novamente.',
      );
    }

    if (input.decision === 'reject') {
      const record = await deps.store.create({
        workspaceId: run.workspaceId,
        projectId: run.projectId,
        skillRunId: input.skillRunId,
        idempotencyKey: input.idempotencyKey,
        decision: 'reject',
        proposalHash: input.expectedProposalHash,
        proposalRevision: input.expectedProposalRevision,
        plan: [],
      });
      assertRecordSemantics(record, run, input, expectedPlan);
      return runReject(record, run);
    }

    // approve — content integrity: what you approve must hash to what you claim.
    if (artifacts.length === 0) {
      throw new ArtifactApprovalError('hash-mismatch', 'Aprovação sem artefatos para materializar.');
    }
    const computed = computeProposalHash(artifacts, run.projectSlug);
    if (computed !== input.expectedProposalHash) {
      throw new ArtifactApprovalError(
        'hash-mismatch',
        `Conteúdo aprovado não corresponde ao hash esperado (${computed} ≠ ${input.expectedProposalHash}).`,
      );
    }

    const planned: PlannedArtifact[] = artifacts.map((artifact) => ({
      artifactId: randomUUID(),
      artifactType: artifact.artifactType,
      title: artifact.title,
      path: artifact.path,
      format: artifact.format,
      content: artifact.content,
      contentHash: null,
    }));
    const record = await deps.store.create({
      workspaceId: run.workspaceId,
      projectId: run.projectId,
      skillRunId: input.skillRunId,
      idempotencyKey: input.idempotencyKey,
      decision: 'approve',
      proposalHash: input.expectedProposalHash,
      proposalRevision: input.expectedProposalRevision,
      plan: planned,
    });
    assertRecordSemantics(record, run, input, expectedPlan);
    return runApprove(record, run, deps.faults);
  }

  // ---- Saga branches ----

  async function runReject(record: ApprovalOutboxRecord, run: ApprovalRunState): Promise<ApprovalOutboxRecord> {
    let result: { committed: boolean };
    try {
      result = await deps.runs.finalizeRejection({
        workspaceId: record.workspaceId,
        projectId: record.projectId,
        skillRunId: record.skillRunId,
        expectedRevision: record.proposalRevision,
      });
    } catch (error) {
      // Transient: keep the (repairable) state, record the error, and rethrow.
      return checkpointError(record, 'write-failed', messageOf(error));
    }
    if (!result.committed) {
      return terminalFail(record, 'superseded', 'A proposta foi editada ou já decidida antes da rejeição.');
    }
    const audit = buildAudit(record, run, 'rejected', []);
    return deps.store.advance(record.id, { state: 'rejected', outcome: 'rejected', auditEvent: audit, error: null });
  }

  async function runApprove(
    record: ApprovalOutboxRecord,
    run: ApprovalRunState,
    faults: ArtifactApprovalServiceDeps['faults'],
  ): Promise<ApprovalOutboxRecord> {
    let current = await deps.store.advance(record.id, { state: 'materializing', attempt: record.attempt + 1, error: null });
    try {
      // Fault immediately BEFORE the atomic rename: nothing is written; repair
      // will re-materialize from the persisted `materializing` state.
      await faults?.beforeRename?.();

      const results = new Map<string, ArtifactWriteResult>();
      for (const entry of current.plan) {
        const result = await materialize(
          {
            schemaVersion: ARTIFACT_WRITE_SCHEMA_VERSION,
            projectSlug: run.projectSlug,
            relativePath: entry.path,
            format: entry.format,
            content: entry.content,
            runId: record.skillRunId,
            // The human explicitly approved this content; a modify overwrites.
            // Idempotent re-approval of identical bytes short-circuits to 'unchanged'.
            onConflict: 'overwrite',
          },
          { projectsRoot: deps.projectsRoot, now: deps.now },
        );
        results.set(entry.path, result);
      }

      const planWithHashes: PlannedArtifact[] = current.plan.map((entry) => ({
        ...entry,
        contentHash: results.get(entry.path)?.hashAfter ?? entry.contentHash,
      }));
      const aggregate = aggregateOutcome([...results.values()]);
      current = await deps.store.advance(current.id, {
        state: 'materialized',
        plan: planWithHashes,
        outcome: aggregate,
      });

      // Fault immediately AFTER the atomic rename: the file exists but the DB is
      // not yet recorded; repair resumes from the persisted `materialized` state.
      await faults?.afterRename?.();

      return recordApproval(current, run, results);
    } catch (error) {
      if (error instanceof ArtifactApprovalError && error.code === 'superseded') throw error;
      // Transient/injected fault: keep the last checkpoint state (the store row
      // is at `materializing`/`materialized`/`recording`), record the error, and
      // rethrow. `repair` resumes deterministically from that state.
      return checkpointError(current, 'write-failed', messageOf(error));
    }
  }

  /** Persist the DB side of an approval (artifacts + skill_run done + audit). Idempotent. */
  async function recordApproval(
    record: ApprovalOutboxRecord,
    run: ApprovalRunState,
    results: Map<string, ArtifactWriteResult>,
  ): Promise<ApprovalOutboxRecord> {
    const recording = await deps.store.advance(record.id, { state: 'recording', error: null });
    const finalize = await deps.runs.finalizeApproval({
      workspaceId: recording.workspaceId,
      projectId: recording.projectId,
      skillRunId: recording.skillRunId,
      expectedRevision: recording.proposalRevision,
      proposalHash: recording.proposalHash,
      artifacts: recording.plan.map((entry) => ({
        artifactId: entry.artifactId,
        artifactType: entry.artifactType,
        title: entry.title,
        path: entry.path,
        format: entry.format,
        content: entry.content,
        contentHash: entry.contentHash ?? results.get(entry.path)?.hashAfter ?? sha256(entry.content),
      })),
    });
    if (!finalize.committed) {
      return terminalFail(recording, 'superseded', 'A proposta foi editada ou já decidida durante a materialização.');
    }
    const outcome = recording.outcome ?? aggregateOutcome([...results.values()]);
    const audit = buildAudit(recording, run, outcome, buildFileAudit(recording, results));
    return deps.store.advance(recording.id, { state: 'done', outcome, auditEvent: audit, error: null });
  }

  /** Resume a crashed saga from its persisted deterministic state (idempotent). */
  async function resume(record: ApprovalOutboxRecord): Promise<ApprovalOutboxRecord> {
    if (APPROVAL_TERMINAL_STATES.includes(record.state)) return record;
    const run = await deps.runs.getRunState(record.skillRunId);
    if (!run) return terminalFail(record, 'run-not-found', `Skill run ${record.skillRunId} não encontrado no repair.`);

    if (record.decision === 'reject') return runReject(record, run);

    // Re-materialize from the plan (no fault hooks on repair) — idempotent by hash.
    if (record.state === 'pending' || record.state === 'materializing') {
      return runApprove(record, run, undefined);
    }
    // File already written (state `materialized`); resume the DB record.
    return recordApproval(record, run, new Map());
  }

  async function repair(id: string): Promise<ApprovalOutboxRecord> {
    const record = await deps.store.getById(id);
    if (!record) throw new ArtifactApprovalError('run-not-found', `Decisão ${id} não encontrada.`);
    return resume(record);
  }

  async function repairAll(): Promise<ApprovalOutboxRecord[]> {
    const stuck = await deps.store.listRepairable();
    const repaired: ApprovalOutboxRecord[] = [];
    for (const record of stuck) {
      // Best-effort: a superseded/broken row must not abort recovery of the rest.
      try {
        repaired.push(await resume(record));
      } catch {
        const settled = await deps.store.getById(record.id);
        if (settled) repaired.push(settled);
      }
    }
    return repaired;
  }

  // ---- helpers ----

  /**
   * Terminal, non-repairable failure (superseded/run-not-found): mark the row
   * `failed` and rethrow. A superseded decision needs a fresh review, not a repair.
   */
  async function terminalFail(record: ApprovalOutboxRecord, code: ApprovalErrorCode, message: string): Promise<never> {
    await deps.store.advance(record.id, { state: 'failed', error: `${code}: ${message}` });
    throw new ArtifactApprovalError(code, message);
  }

  /**
   * Transient failure (a crash / DB blip mid-saga): KEEP the last checkpoint
   * state so the row stays repairable, record the error, and rethrow. `repair`
   * resumes deterministically from the persisted state.
   */
  async function checkpointError(record: ApprovalOutboxRecord, code: ApprovalErrorCode, message: string): Promise<never> {
    await deps.store.advance(record.id, { error: `${code}: ${message}` });
    throw new ArtifactApprovalError(code, message);
  }

  function buildAudit(
    record: ApprovalOutboxRecord,
    run: ApprovalRunState,
    outcome: ApprovalOutcome,
    files: ApprovalAuditEvent['files'],
  ): ApprovalAuditEvent {
    return {
      event: 'artifact.approval',
      schemaVersion: ARTIFACT_WRITE_SCHEMA_VERSION,
      decision: record.decision,
      workspaceId: record.workspaceId,
      projectId: run.projectId,
      skillRunId: record.skillRunId,
      proposalHash: record.proposalHash,
      proposalRevision: record.proposalRevision,
      outcome,
      files,
      timestamp: clock().toISOString(),
    };
  }

  return { plan, decide, repair, repairAll };
}

function aggregateOutcome(results: ArtifactWriteResult[]): ApprovalOutcome {
  if (results.length === 0) return 'unchanged';
  if (results.some((result) => result.outcome === 'conflict')) return 'conflict';
  if (results.some((result) => result.outcome === 'written')) return 'written';
  return 'unchanged';
}

function buildFileAudit(record: ApprovalOutboxRecord, results: Map<string, ArtifactWriteResult>): ApprovalAuditEvent['files'] {
  return record.plan.map((entry) => {
    const result = results.get(entry.path);
    return {
      path: entry.path,
      hashBefore: result?.hashBefore ?? null,
      hashAfter: entry.contentHash ?? result?.hashAfter ?? null,
      outcome: result?.outcome ?? 'unchanged',
    };
  });
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ---------------------------------------------------------------------------
// In-memory outbox store (durable FAKE for tests / no-DB fallback)
// ---------------------------------------------------------------------------

export interface InMemoryArtifactApprovalStoreOptions {
  now?: () => string;
}

export function createInMemoryArtifactApprovalStore(
  options: InMemoryArtifactApprovalStoreOptions = {},
): ArtifactApprovalStore {
  const now = options.now ?? (() => new Date().toISOString());
  const rows = new Map<string, ApprovalOutboxRecord>();
  const byKey = new Map<string, string>();
  const keyOf = (workspaceId: string, idempotencyKey: string) => `${workspaceId}::${idempotencyKey}`;
  const clone = (record: ApprovalOutboxRecord): ApprovalOutboxRecord => ({
    ...record,
    plan: record.plan.map((entry) => ({ ...entry })),
    auditEvent: record.auditEvent ? { ...record.auditEvent, files: record.auditEvent.files.map((f) => ({ ...f })) } : null,
  });

  return {
    async getByKey(workspaceId, idempotencyKey) {
      const id = byKey.get(keyOf(workspaceId, idempotencyKey));
      const record = id ? rows.get(id) : undefined;
      return record ? clone(record) : undefined;
    },
    async getBySemantic(workspaceId, skillRunId, proposalRevision) {
      const record = [...rows.values()].find(
        (candidate) =>
          candidate.workspaceId === workspaceId &&
          candidate.skillRunId === skillRunId &&
          candidate.proposalRevision === proposalRevision,
      );
      return record ? clone(record) : undefined;
    },
    async getById(id) {
      const record = rows.get(id);
      return record ? clone(record) : undefined;
    },
    async create(input) {
      const ts = now();
      const composite = keyOf(input.workspaceId, input.idempotencyKey);
      if (byKey.has(composite)) {
        // Concurrent duplicate — mirror the unique-constraint semantics.
        return clone(rows.get(byKey.get(composite)!)!);
      }
      const record: ApprovalOutboxRecord = {
        id: randomUUID(),
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        skillRunId: input.skillRunId,
        idempotencyKey: input.idempotencyKey,
        decision: input.decision,
        proposalHash: input.proposalHash,
        proposalRevision: input.proposalRevision,
        state: 'pending',
        outcome: null,
        plan: input.plan.map((entry) => ({ ...entry })),
        auditEvent: null,
        error: null,
        attempt: 0,
        createdAt: ts,
        updatedAt: ts,
      };
      rows.set(record.id, record);
      byKey.set(composite, record.id);
      return clone(record);
    },
    async advance(id, patch) {
      const record = rows.get(id);
      if (!record) throw new ArtifactApprovalError('run-not-found', `Decisão ${id} não encontrada.`);
      if (patch.state !== undefined) record.state = patch.state;
      if (patch.outcome !== undefined) record.outcome = patch.outcome;
      if (patch.plan !== undefined) record.plan = patch.plan.map((entry) => ({ ...entry }));
      if (patch.auditEvent !== undefined) record.auditEvent = patch.auditEvent;
      if (patch.error !== undefined) record.error = patch.error;
      if (patch.attempt !== undefined) record.attempt = patch.attempt;
      record.updatedAt = now();
      return clone(record);
    },
    async listRepairable() {
      return [...rows.values()]
        .filter((record) => APPROVAL_REPAIRABLE_STATES.includes(record.state))
        .map(clone);
    },
  };
}

// ---------------------------------------------------------------------------
// Supabase adapters (backend-only, service-role — NFR10)
// ---------------------------------------------------------------------------

export const ARTIFACT_APPROVAL_OUTBOX_TABLE = 'artifact_approval_outbox';
const UNIQUE_VIOLATION = '23505';

interface ApprovalOutboxRow {
  id: string;
  workspace_id: string;
  project_id: string;
  skill_run_id: string;
  idempotency_key: string;
  decision: ApprovalDecision;
  proposal_hash: string;
  proposal_revision: number;
  state: ApprovalState;
  outcome: ApprovalOutcome | null;
  plan: PlannedArtifact[] | null;
  audit_event: ApprovalAuditEvent | null;
  error: string | null;
  attempt: number;
  created_at: string;
  updated_at: string;
}

const OUTBOX_COLUMNS =
  'id, workspace_id, project_id, skill_run_id, idempotency_key, decision, proposal_hash, proposal_revision, state, outcome, plan, audit_event, error, attempt, created_at, updated_at';

function outboxRowToRecord(row: ApprovalOutboxRow): ApprovalOutboxRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    skillRunId: row.skill_run_id,
    idempotencyKey: row.idempotency_key,
    decision: row.decision,
    proposalHash: row.proposal_hash,
    proposalRevision: row.proposal_revision,
    state: row.state,
    outcome: row.outcome,
    plan: row.plan ?? [],
    auditEvent: row.audit_event,
    error: row.error,
    attempt: row.attempt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface SupabaseArtifactApprovalStoreOptions {
  now?: () => string;
}

export function createSupabaseArtifactApprovalStore(
  client: SupabaseClient,
  options: SupabaseArtifactApprovalStoreOptions = {},
): ArtifactApprovalStore {
  const now = options.now ?? (() => new Date().toISOString());
  const table = () => client.from(ARTIFACT_APPROVAL_OUTBOX_TABLE);

  async function readByKey(workspaceId: string, idempotencyKey: string): Promise<ApprovalOutboxRecord | undefined> {
    const { data, error } = await table()
      .select(OUTBOX_COLUMNS)
      .eq('workspace_id', workspaceId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (error) throw new Error(`[artifact-approval] read failed: ${error.message}`);
    return data ? outboxRowToRecord(data as ApprovalOutboxRow) : undefined;
  }

  async function readBySemantic(
    workspaceId: string,
    skillRunId: string,
    proposalRevision: number,
  ): Promise<ApprovalOutboxRecord | undefined> {
    const { data, error } = await table()
      .select(OUTBOX_COLUMNS)
      .eq('workspace_id', workspaceId)
      .eq('skill_run_id', skillRunId)
      .eq('proposal_revision', proposalRevision)
      .maybeSingle();
    if (error) throw new Error(`[artifact-approval] semantic read failed: ${error.message}`);
    return data ? outboxRowToRecord(data as ApprovalOutboxRow) : undefined;
  }

  return {
    getByKey: readByKey,
    getBySemantic: readBySemantic,
    async getById(id) {
      const { data, error } = await table().select(OUTBOX_COLUMNS).eq('id', id).maybeSingle();
      if (error) throw new Error(`[artifact-approval] read failed: ${error.message}`);
      return data ? outboxRowToRecord(data as ApprovalOutboxRow) : undefined;
    },
    async create(input) {
      const ts = now();
      const insertRow = {
        workspace_id: input.workspaceId,
        project_id: input.projectId,
        skill_run_id: input.skillRunId,
        idempotency_key: input.idempotencyKey,
        decision: input.decision,
        proposal_hash: input.proposalHash,
        proposal_revision: input.proposalRevision,
        state: 'pending' as const,
        plan: input.plan,
        attempt: 0,
        created_at: ts,
        updated_at: ts,
      };
      const { data, error } = await table().insert(insertRow).select(OUTBOX_COLUMNS).single();
      if (error) {
        // Concurrent duplicate decision — the unique key is the idempotency backstop.
        if (error.code === UNIQUE_VIOLATION) {
          const existing =
            (await readByKey(input.workspaceId, input.idempotencyKey)) ??
            (await readBySemantic(input.workspaceId, input.skillRunId, input.proposalRevision));
          if (existing) return existing;
        }
        throw new Error(`[artifact-approval] create failed: ${error.message}`);
      }
      return outboxRowToRecord(data as ApprovalOutboxRow);
    },
    async advance(id, patch) {
      const update: Record<string, unknown> = { updated_at: now() };
      if (patch.state !== undefined) update.state = patch.state;
      if (patch.outcome !== undefined) update.outcome = patch.outcome;
      if (patch.plan !== undefined) update.plan = patch.plan;
      if (patch.auditEvent !== undefined) update.audit_event = patch.auditEvent;
      if (patch.error !== undefined) update.error = patch.error;
      if (patch.attempt !== undefined) update.attempt = patch.attempt;
      const { data, error } = await table().update(update).eq('id', id).select(OUTBOX_COLUMNS).single();
      if (error) throw new Error(`[artifact-approval] advance failed: ${error.message}`);
      return outboxRowToRecord(data as ApprovalOutboxRow);
    },
    async listRepairable() {
      const { data, error } = await table()
        .select(OUTBOX_COLUMNS)
        .in('state', [...APPROVAL_REPAIRABLE_STATES]);
      if (error) throw new Error(`[artifact-approval] repair scan failed: ${error.message}`);
      return ((data as ApprovalOutboxRow[] | null) ?? []).map(outboxRowToRecord);
    },
  };
}

/**
 * Supabase-backed run gateway: the domain writes of a decision over `skill_runs`
 * (guarded compare-and-swap on `(proposal_revision, status)`) and
 * `project_artifacts` (idempotent upsert by id). Backend-only, service-role.
 */
export function createSupabaseApprovalRunGateway(client: SupabaseClient): ApprovalRunGateway {
  return {
    async getRunState(skillRunId) {
      const { data, error } = await client
        .from('skill_runs')
        .select('workspace_id, project_id, status, proposal_revision, proposal_hash, marketing_projects(slug)')
        .eq('id', skillRunId)
        .maybeSingle();
      if (error) throw new Error(`[artifact-approval] run lookup failed: ${error.message}`);
      if (!data) return undefined;
      const row = data as {
        workspace_id: string;
        project_id: string;
        status: string;
        proposal_revision: number | null;
        proposal_hash: string | null;
        marketing_projects: { slug: string } | { slug: string }[] | null;
      };
      const project = Array.isArray(row.marketing_projects) ? row.marketing_projects[0] : row.marketing_projects;
      if (!project?.slug) throw new Error(`[artifact-approval] run ${skillRunId} has no project slug`);
      return {
        workspaceId: row.workspace_id,
        projectId: row.project_id,
        projectSlug: project.slug,
        status: row.status,
        proposalRevision: row.proposal_revision ?? 1,
        proposalHash: row.proposal_hash,
      };
    },

    async finalizeApproval(input) {
      // Guarded CAS FIRST: only a needs_review row at the expected tenant,
      // project and revision may transition to done. A done row is never
      // updated; it is accepted below only as an exact same-hash replay.
      type SkillRunCasRow = {
        status: string;
        proposal_hash: string | null;
        project_id: string;
        workspace_id: string;
        proposal_revision: number;
      };
      const { data, error } = await client
        .from('skill_runs')
        .update({ status: 'done', proposal_hash: input.proposalHash, updated_at: new Date().toISOString() })
        .eq('id', input.skillRunId)
        .eq('workspace_id', input.workspaceId)
        .eq('project_id', input.projectId)
        .eq('proposal_revision', input.expectedRevision)
        .eq('status', 'needs_review')
        .or(`proposal_hash.is.null,proposal_hash.eq.${input.proposalHash}`)
        .select('status, proposal_hash, project_id, workspace_id, proposal_revision')
        .maybeSingle();
      if (error) throw new Error(`[artifact-approval] skill_run finalize failed: ${error.message}`);
      let settled = data as SkillRunCasRow | null;
      if (!settled) {
        // Zero rows — re-read without mutating anything. A prior finalize is a
        // replay only if every identity dimension and the stored hash match.
        const { data: current } = await client
          .from('skill_runs')
          .select('status, proposal_hash, project_id, workspace_id, proposal_revision')
          .eq('id', input.skillRunId)
          .maybeSingle();
        settled = current as SkillRunCasRow | null;
      }
      const committed = Boolean(
        settled &&
          settled.status === 'done' &&
          settled.proposal_hash === input.proposalHash &&
          settled.workspace_id === input.workspaceId &&
          settled.project_id === input.projectId &&
          settled.proposal_revision === input.expectedRevision,
      );
      if (!committed) {
        return { committed: false };
      }

      // CAS committed — ONLY NOW claim the artifact rows. Idempotent upsert by
      // deterministic id: a repair retry re-upserts the exact same bytes.
      if (input.artifacts.length > 0) {
        const rows = input.artifacts.map((artifact) => ({
          id: artifact.artifactId,
          workspace_id: input.workspaceId,
          project_id: settled!.project_id,
          artifact_type: artifact.artifactType,
          title: artifact.title,
          path: artifact.path,
          format: artifact.format,
          state: 'confirmed',
          verification: 'confirmed',
          source: 'skill_run',
          content: artifact.content,
          content_hash: artifact.contentHash,
          skill_run_id: input.skillRunId,
        }));
        const { error: upsertError } = await client.from('project_artifacts').upsert(rows);
        if (upsertError) throw new Error(`[artifact-approval] artifact upsert failed: ${upsertError.message}`);
      }
      return { committed: true };
    },

    async finalizeRejection(input) {
      const { data, error } = await client
        .from('skill_runs')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', input.skillRunId)
        .eq('workspace_id', input.workspaceId)
        .eq('project_id', input.projectId)
        .eq('proposal_revision', input.expectedRevision)
        .eq('status', 'needs_review')
        .select('status, workspace_id, project_id, proposal_revision')
        .maybeSingle();
      if (error) throw new Error(`[artifact-approval] skill_run reject failed: ${error.message}`);
      if (data && (data as { status: string }).status === 'cancelled') return { committed: true };
      const { data: current, error: readError } = await client
        .from('skill_runs')
        .select('status, workspace_id, project_id, proposal_revision')
        .eq('id', input.skillRunId)
        .maybeSingle();
      if (readError) throw new Error(`[artifact-approval] skill_run reject reread failed: ${readError.message}`);
      const settled = current as {
        status?: string;
        workspace_id?: string;
        project_id?: string;
        proposal_revision?: number;
      } | null;
      return {
        committed:
          settled?.status === 'cancelled' &&
          settled.workspace_id === input.workspaceId &&
          settled.project_id === input.projectId &&
          settled.proposal_revision === input.expectedRevision,
      };
    },
  };
}
