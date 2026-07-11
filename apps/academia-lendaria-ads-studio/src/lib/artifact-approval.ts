/**
 * STORY-8.W2.3 — Two-phase artifact approval (browser side).
 *
 * The BFF owns the transaction (materialize + DB + audit) because materialization
 * is filesystem-only. This module is the thin client + the pure review helpers:
 *
 *   - Phase 1 (review): `planArtifactApproval` asks the BFF for the ACCURATE
 *     filesystem diff (before/after per affected file) + write warnings — only the
 *     backend can read the current file. `buildInvalidations` computes the
 *     domain-graph side (downstream artifacts that go stale) from the catalog,
 *     which only the client has. The component merges both.
 *   - Phase 2 (decide): `decideArtifactApproval` posts the decision to the
 *     idempotent endpoint with the expected proposal hash + revision echoed from
 *     the plan. `makeIdempotencyKey` is the stable replay key.
 *
 * The BFF computes the proposal hash (Phase 1), so the browser never hashes
 * content itself — there is no cross-runtime hash to drift.
 */
import { skillCatalog } from '@/generated/skill-catalog';
import type { ProjectArtifact } from '@/lib/project-domain';
import type { SkillProposal } from '@/lib/skill-runtime';

export type ApprovalDecision = 'approve' | 'reject';
export type ApprovalFormat = 'markdown' | 'json' | 'yaml' | 'html';
export type FileChangeType = 'create' | 'modify' | 'unchanged';
export type ApprovalState =
  | 'pending'
  | 'materializing'
  | 'materialized'
  | 'recording'
  | 'done'
  | 'rejected'
  | 'failed';
export type ApprovalOutcome = 'written' | 'unchanged' | 'conflict' | 'rejected';

/** An artifact the human is approving — the exact bytes shown in the review. */
export interface ApprovalArtifactInput {
  artifactType: string;
  title: string;
  path: string;
  format: ApprovalFormat;
  content: string;
}

export interface ApprovalFileDiff {
  path: string;
  artifactType: string;
  format: ApprovalFormat;
  changeType: FileChangeType;
  hashBefore: string | null;
  hashAfter: string;
  addedLines: number;
  removedLines: number;
  preview: string[];
}

/** Phase 1 response — the accurate filesystem plan for a proposal. */
export interface ApprovalPlan {
  skillRunId: string;
  projectSlug: string;
  proposalHash: string;
  proposalRevision: number;
  fresh: boolean;
  files: ApprovalFileDiff[];
  warnings: string[];
}

/** Phase 2 response — the recorded decision (subset the UI reads). */
export interface ApprovalRecord {
  id: string;
  skillRunId: string;
  decision: ApprovalDecision;
  state: ApprovalState;
  outcome: ApprovalOutcome | null;
  proposalHash: string;
  proposalRevision: number;
  error: string | null;
  plan: Array<{ artifactId: string; artifactType: string; title: string; path: string; format: ApprovalFormat; content: string; contentHash: string | null }>;
}

export interface DecideArtifactApprovalInput {
  skillRunId: string;
  decision: ApprovalDecision;
  expectedProposalHash: string;
  expectedProposalRevision: number;
  idempotencyKey: string;
  artifacts?: ApprovalArtifactInput[];
}

function baseUrl(): string {
  return import.meta.env.VITE_BFF_URL?.replace(/\/$/, '') ?? '';
}

async function readError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => ({}))) as { message?: string; code?: string };
  return payload.message ?? `Aprovação respondeu ${response.status}.`;
}

/** Stable replay key for a decision — same key ⇒ the BFF returns the same row. */
export function makeIdempotencyKey(skillRunId: string, proposalHash: string, decision: ApprovalDecision): string {
  return `${skillRunId}:${proposalHash}:${decision}`;
}

/**
 * Resolve the artifacts a proposal would materialize. Most skills embed the
 * artifacts; when a proposal only carries `resultMarkdown`, fall back to a single
 * generated artifact (same rule the journey used before this story).
 */
export function resolveApprovalArtifacts(
  proposal: SkillProposal,
  fallback: { artifactType: string; title: string; path: string },
): ApprovalArtifactInput[] {
  if (proposal.artifacts.length > 0) {
    const resolved = proposal.artifacts.map((artifact, index) => ({
      artifactType: artifact.artifactType,
      title: artifact.title,
      path: artifact.path.trim() || (() => {
        const extension: Record<ApprovalFormat, string> = {
          markdown: 'md',
          json: 'json',
          yaml: 'yaml',
          html: 'html',
        };
        const base = fallback.path.trim().replace(/\.[^./]+$/, '');
        return `${base}${index === 0 ? '' : `-${index + 1}`}.${extension[artifact.format]}`;
      })(),
      format: artifact.format,
      content: artifact.content,
    }));

    // Traffic skills can emit one block per section of the shared
    // `PAINEL-DA-SEMANA.yaml`. The review/materializer operates on files, so
    // same-path blocks in the same format must become one file instead of a
    // duplicate-path approval error. Different formats remain separate and
    // are intentionally rejected by the backend as an ambiguous contract.
    const consolidated = new Map<string, ApprovalArtifactInput>();
    for (const artifact of resolved) {
      const key = `${artifact.path}\u0000${artifact.format}`;
      const previous = consolidated.get(key);
      if (!previous) {
        consolidated.set(key, artifact);
        continue;
      }
      consolidated.set(key, {
        ...previous,
        title: previous.title === artifact.title ? previous.title : `${previous.title} + ${artifact.title}`,
        content: `${previous.content.trimEnd()}\n\n${artifact.content.trimStart()}`,
      });
    }
    return [...consolidated.values()];
  }
  if (!proposal.resultMarkdown.trim()) return [];
  return [
    {
      artifactType: fallback.artifactType,
      title: fallback.title,
      path: fallback.path,
      format: 'markdown',
      content: proposal.resultMarkdown,
    },
  ];
}

/** Downstream skill ids reachable from `skillId` over the catalog dependency edges. */
function downstreamSkillIds(skillId: string): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const edge of skillCatalog.edges) {
    if (edge.type !== 'dependency') continue;
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge.to);
    adjacency.set(edge.from, list);
  }
  const downstream = new Set<string>();
  const queue = [...(adjacency.get(skillId) ?? [])];
  while (queue.length) {
    const next = queue.shift()!;
    if (downstream.has(next)) continue;
    downstream.add(next);
    queue.push(...(adjacency.get(next) ?? []));
  }
  return downstream;
}

/**
 * Existing confirmed/real artifacts that this decision would invalidate (mark
 * stale): those produced by a skill DOWNSTREAM of the one being approved. Pure —
 * the catalog dependency graph lives only on the client (ADR-001: upstream
 * changes can mark downstream artifacts/runs `stale`).
 */
export function buildInvalidations(skillId: string, existingArtifacts: ProjectArtifact[]): ProjectArtifact[] {
  const downstream = downstreamSkillIds(skillId);
  const downstreamTypes = new Set<string>();
  for (const skill of skillCatalog.skills) {
    if (downstream.has(skill.id)) {
      for (const type of skill.primaryArtifacts) downstreamTypes.add(type);
    }
  }
  return existingArtifacts.filter(
    (artifact) =>
      downstreamTypes.has(artifact.artifactType) &&
      artifact.state !== 'stale' &&
      artifact.state !== 'example' &&
      (artifact.verification === 'confirmed' || artifact.state === 'real' || artifact.state === 'confirmed'),
  );
}

/** POST Phase 1 — the accurate filesystem plan (read-only). */
export async function planArtifactApproval(input: {
  skillRunId: string;
  artifacts: ApprovalArtifactInput[];
}): Promise<ApprovalPlan> {
  const response = await fetch(`${baseUrl()}/api/local/artifact-approvals/plan`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ApprovalPlan;
}

/** POST Phase 2 — the idempotent decision (approve/reject). */
export async function decideArtifactApproval(input: DecideArtifactApprovalInput): Promise<ApprovalRecord> {
  const response = await fetch(`${baseUrl()}/api/local/artifact-approvals`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ApprovalRecord;
}

/** POST a deterministic repair of a stuck decision. */
export async function repairArtifactApproval(id: string): Promise<ApprovalRecord> {
  const response = await fetch(`${baseUrl()}/api/local/artifact-approvals/${encodeURIComponent(id)}/repair`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ApprovalRecord;
}
