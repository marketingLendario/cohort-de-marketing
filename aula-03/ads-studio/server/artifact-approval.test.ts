import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildApp } from './app.js';
import { LOCAL_RUNNER_TOKEN_HEADER } from './local-runner-security.js';
import {
  ArtifactApprovalError,
  approvalRecordForBrowser,
  computeProposalHash,
  createArtifactApprovalService,
  createInMemoryArtifactApprovalStore,
  createSupabaseArtifactApprovalStore,
  createSupabaseApprovalRunGateway,
  diffLines,
  type ApprovalArtifactInput,
  type ApprovalRunGateway,
  type ApprovalRunState,
  type ArtifactApprovalService,
  type FinalizeApprovalInput,
  type FinalizeRejectionInput,
} from './artifact-approval.js';

const sha256 = (content: string) => createHash('sha256').update(content, 'utf8').digest('hex');

const ARTIFACT: ApprovalArtifactInput = {
  artifactType: 'offerbook',
  title: 'Offerbook',
  path: 'offerbook.md',
  format: 'markdown',
  content: '# Offerbook\n\nProposta aprovada pelo humano.\n',
};

const SECOND_ARTIFACT: ApprovalArtifactInput = {
  artifactType: 'copy-funil',
  title: 'Copy do funil',
  path: 'copy/offer.md',
  format: 'markdown',
  content: '# Copy\n\nSegundo arquivo da proposta.\n',
};

const SLUG = 'maquina-de-receita-com-ia';
const RUN_ID = 'run-1';
const WORKSPACE_ID = 'ws-1';
const PROJECT_ID = 'project-1';

/** Fake gateway over a single reviewable run — records the domain writes. */
function fakeGateway(initial?: Partial<ApprovalRunState>) {
  const state: ApprovalRunState = {
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    projectSlug: SLUG,
    skillId: 'offerbook',
    status: 'needs_review',
    proposalRevision: 1,
    proposalHash: computeProposalHash([ARTIFACT]),
    ...initial,
  };
  const finalizeApprovalCalls: FinalizeApprovalInput[] = [];
  const finalizeRejectionCalls: FinalizeRejectionInput[] = [];
  let committed: 'approve' | 'reject' | null = null;
  const gateway: ApprovalRunGateway = {
    async getRunState() {
      return { ...state };
    },
    async finalizeApproval(input) {
      finalizeApprovalCalls.push(input);
      if (
        state.workspaceId !== input.workspaceId ||
        state.projectId !== input.projectId ||
        state.proposalRevision !== input.expectedRevision
      ) return { committed: false };
      if (state.status === 'needs_review' && (state.proposalHash === null || state.proposalHash === input.proposalHash)) {
        state.status = 'done';
        state.proposalHash = input.proposalHash;
        committed = 'approve';
        return { committed: true };
      }
      // A done row is a replay only when its identity is exactly the same;
      // never replace a completed revision with another proposal hash.
      if (state.status === 'done' && state.proposalHash === input.proposalHash) return { committed: true };
      return { committed: false };
    },
    async finalizeRejection(input) {
      finalizeRejectionCalls.push(input);
      if (
        state.workspaceId !== input.workspaceId ||
        state.projectId !== input.projectId ||
        state.proposalRevision !== input.expectedRevision
      ) return { committed: false };
      if (state.status === 'needs_review') {
        state.status = 'cancelled';
        committed = 'reject';
        return { committed: true };
      }
      return { committed: state.status === 'cancelled' };
    },
  };
  return { gateway, state, finalizeApprovalCalls, finalizeRejectionCalls, get committed() { return committed; } };
}

describe('artifact approval saga', () => {
  let projectsRoot: string;

  beforeEach(async () => {
    projectsRoot = await mkdtemp(join(tmpdir(), 'cohort-approval-'));
  });
  afterEach(async () => {
    await rm(projectsRoot, { recursive: true, force: true });
  });

  const idempotencyKey = (decision: string) => `${RUN_ID}:${computeProposalHash([ARTIFACT])}:${decision}`;
  const targetPath = () => resolve(projectsRoot, SLUG, ARTIFACT.path);

  it('computeProposalHash is order-independent and content-stable', () => {
    const a: ApprovalArtifactInput = { ...ARTIFACT, path: 'a.md' };
    const b: ApprovalArtifactInput = { ...ARTIFACT, path: 'b.md', content: 'other' };
    expect(computeProposalHash([a, b])).toBe(computeProposalHash([b, a]));
    expect(computeProposalHash([a])).not.toBe(computeProposalHash([b]));
  });

  it('approves: materializes the file, records the DB side and one proposal hash across FS/DB/event', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });

    const record = await service.decide({
      skillRunId: RUN_ID,
      decision: 'approve',
      expectedProposalHash: computeProposalHash([ARTIFACT]),
      expectedProposalRevision: 1,
      idempotencyKey: idempotencyKey('approve'),
      artifacts: [ARTIFACT],
    });

    expect(record.state).toBe('done');
    expect(record.outcome).toBe('written');
    // Filesystem: the canonical artifact exists with the approved content.
    const written = await readFile(targetPath(), 'utf8');
    expect(written).toBe(ARTIFACT.content);
    // Same per-file content hash across FS / DB artifact / audit event.
    const fileHash = sha256(ARTIFACT.content);
    expect(runs.finalizeApprovalCalls[0].artifacts[0].contentHash).toBe(fileHash);
    expect(record.auditEvent?.files[0].hashAfter).toBe(fileHash);
    // Same proposal hash across outbox / audit event / DB skill_run.
    expect(record.proposalHash).toBe(computeProposalHash([ARTIFACT]));
    expect(record.auditEvent?.proposalHash).toBe(record.proposalHash);
    expect(runs.state.proposalHash).toBe(record.proposalHash);
    expect(runs.state.status).toBe('done');
  });

  it('journals a deterministic binary derivative and repairs it without deriving again', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway({ skillId: 'offerbook' });
    const docx = Buffer.from('PK\u0003\u0004deterministic-offerbook');
    const deriveArtifacts = vi.fn(async () => [{
      artifactType: 'offerbook',
      title: 'Offerbook DOCX',
      path: 'offerbook.docx',
      format: 'docx' as const,
      content: docx,
      derivedFrom: 'offerbook.md',
    }]);
    let failOnce = true;
    const service = createArtifactApprovalService({
      store,
      runs: runs.gateway,
      projectsRoot,
      deriveArtifacts,
      faults: {
        beforeRename() {
          if (!failOnce) return;
          failOnce = false;
          throw new Error('crash before binary rename');
        },
      },
    });

    await expect(service.decide({
      skillRunId: RUN_ID,
      decision: 'approve',
      expectedProposalHash: computeProposalHash([ARTIFACT]),
      expectedProposalRevision: 1,
      idempotencyKey: idempotencyKey('approve-derived'),
      artifacts: [ARTIFACT],
    })).rejects.toMatchObject({ code: 'write-failed' });

    const stuck = await store.getByKey(WORKSPACE_ID, idempotencyKey('approve-derived'));
    expect(stuck?.state).toBe('materializing');
    expect(stuck?.plan).toHaveLength(2);
    expect(stuck?.plan[1]).toMatchObject({
      path: 'offerbook.docx',
      format: 'docx',
      contentEncoding: 'base64',
      derivedFrom: 'offerbook.md',
      contentHash: createHash('sha256').update(docx).digest('hex'),
    });

    const repaired = await service.repair(stuck!.id);
    expect(repaired.state).toBe('done');
    expect(deriveArtifacts).toHaveBeenCalledTimes(1);
    expect(await readFile(resolve(projectsRoot, SLUG, 'offerbook.docx'))).toEqual(docx);
    expect(runs.finalizeApprovalCalls[0].artifacts[1]).toMatchObject({
      path: 'offerbook.docx',
      format: 'docx',
      content: null,
      contentHash: createHash('sha256').update(docx).digest('hex'),
    });
    expect(repaired.auditEvent?.files.map((file) => file.path)).toEqual(['offerbook.md', 'offerbook.docx']);
    const browserRecord = approvalRecordForBrowser(repaired);
    expect(browserRecord.plan[1].content).toBe('');
    expect(browserRecord.plan[1].contentHash).toBe(repaired.plan[1].contentHash);
    expect(repaired.plan[1].content).toBe(docx.toString('base64'));
  });

  it('normaliza um path prefixado pelo projeto antes de planejar, hashear e materializar', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway({ proposalHash: null });
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });
    const prefixed = { ...ARTIFACT, path: `projetos/${SLUG}/${ARTIFACT.path}` };

    const plan = await service.plan({ skillRunId: RUN_ID, artifacts: [prefixed] });
    expect(plan.files[0]?.path).toBe(ARTIFACT.path);

    const record = await service.decide({
      skillRunId: RUN_ID,
      decision: 'approve',
      expectedProposalHash: plan.proposalHash,
      expectedProposalRevision: 1,
      idempotencyKey: `${RUN_ID}:prefixed:approve`,
      artifacts: [prefixed],
    });

    expect(record.state).toBe('done');
    expect(record.plan[0]?.path).toBe(ARTIFACT.path);
    expect(await readFile(targetPath(), 'utf8')).toBe(ARTIFACT.content);
  });

  it('replays an approval idempotently — no second materialize or DB write', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const materialize = vi.fn(async (...args: Parameters<typeof import('./artifact-materializer.js').materializeArtifact>) => {
      const { materializeArtifact } = await import('./artifact-materializer.js');
      return materializeArtifact(...args);
    });
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot, materialize });

    const input = {
      skillRunId: RUN_ID,
      decision: 'approve' as const,
      expectedProposalHash: computeProposalHash([ARTIFACT]),
      expectedProposalRevision: 1,
      idempotencyKey: idempotencyKey('approve'),
      artifacts: [ARTIFACT],
    };
    const first = await service.decide(input);
    const second = await service.decide(input);

    expect(second.id).toBe(first.id);
    expect(second.state).toBe('done');
    expect(materialize).toHaveBeenCalledTimes(1);
    expect(runs.finalizeApprovalCalls).toHaveLength(1);
  });

  it('rejects a stale expected hash (proposal was edited) without writing files', async () => {
    const store = createInMemoryArtifactApprovalStore();
    // The run is now at a DIFFERENT authoritative hash (an edit happened).
    const runs = fakeGateway({ proposalHash: sha256('edited') });
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });

    await expect(
      service.decide({
        skillRunId: RUN_ID,
        decision: 'approve',
        expectedProposalHash: computeProposalHash([ARTIFACT]),
        expectedProposalRevision: 1,
        idempotencyKey: idempotencyKey('approve'),
        artifacts: [ARTIFACT],
      }),
    ).rejects.toMatchObject({ code: 'stale' });
    await expect(readFile(targetPath(), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects a stale expected revision', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway({ proposalRevision: 2 });
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });
    await expect(
      service.decide({
        skillRunId: RUN_ID,
        decision: 'approve',
        expectedProposalHash: computeProposalHash([ARTIFACT]),
        expectedProposalRevision: 1,
        idempotencyKey: idempotencyKey('approve'),
        artifacts: [ARTIFACT],
      }),
    ).rejects.toBeInstanceOf(ArtifactApprovalError);
  });

  it('rejects a content/hash mismatch (tampered payload)', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });
    await expect(
      service.decide({
        skillRunId: RUN_ID,
        decision: 'approve',
        expectedProposalHash: computeProposalHash([ARTIFACT]),
        expectedProposalRevision: 1,
        idempotencyKey: idempotencyKey('approve'),
        artifacts: [{ ...ARTIFACT, content: 'conteúdo adulterado' }],
      }),
    ).rejects.toMatchObject({ code: 'hash-mismatch' });
  });

  it('rejects: persists the decision without writing files', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });

    const record = await service.decide({
      skillRunId: RUN_ID,
      decision: 'reject',
      expectedProposalHash: computeProposalHash([ARTIFACT]),
      expectedProposalRevision: 1,
      idempotencyKey: idempotencyKey('reject'),
    });

    expect(record.state).toBe('rejected');
    expect(record.outcome).toBe('rejected');
    expect(runs.state.status).toBe('cancelled');
    expect(runs.finalizeRejectionCalls).toHaveLength(1);
    await expect(readFile(targetPath(), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('repairs a failure injected immediately BEFORE the atomic rename', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    let armed = true;
    const service = createArtifactApprovalService({
      store,
      runs: runs.gateway,
      projectsRoot,
      faults: {
        beforeRename: () => {
          if (armed) {
            armed = false;
            throw new Error('crash antes do rename');
          }
        },
      },
    });

    await expect(
      service.decide({
        skillRunId: RUN_ID,
        decision: 'approve',
        expectedProposalHash: computeProposalHash([ARTIFACT]),
        expectedProposalRevision: 1,
        idempotencyKey: idempotencyKey('approve'),
        artifacts: [ARTIFACT],
      }),
    ).rejects.toThrow();

    // No file was written; the outbox is parked at a repairable checkpoint.
    const parked = await store.getByKey(WORKSPACE_ID, idempotencyKey('approve'));
    expect(parked?.state).toBe('materializing');
    await expect(readFile(targetPath(), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });

    const repaired = await service.repair(parked!.id);
    expect(repaired.state).toBe('done');
    expect(await readFile(targetPath(), 'utf8')).toBe(ARTIFACT.content);
    expect(runs.state.status).toBe('done');
  });

  it('repairs a failure injected immediately AFTER the atomic rename (no duplicate write)', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    let armed = true;
    const service = createArtifactApprovalService({
      store,
      runs: runs.gateway,
      projectsRoot,
      faults: {
        afterRename: () => {
          if (armed) {
            armed = false;
            throw new Error('crash depois do rename');
          }
        },
      },
    });

    await expect(
      service.decide({
        skillRunId: RUN_ID,
        decision: 'approve',
        expectedProposalHash: computeProposalHash([ARTIFACT]),
        expectedProposalRevision: 1,
        idempotencyKey: idempotencyKey('approve'),
        artifacts: [ARTIFACT],
      }),
    ).rejects.toThrow();

    // The file already exists (rename completed) but the DB side is not recorded.
    const parked = await store.getByKey(WORKSPACE_ID, idempotencyKey('approve'));
    expect(parked?.state).toBe('materialized');
    expect(await readFile(targetPath(), 'utf8')).toBe(ARTIFACT.content);
    expect(runs.finalizeApprovalCalls).toHaveLength(0);

    const repaired = await service.repair(parked!.id);
    expect(repaired.state).toBe('done');
    // Convergence: FS + DB agree on the same content hash, recorded exactly once.
    expect(await readFile(targetPath(), 'utf8')).toBe(ARTIFACT.content);
    expect(runs.finalizeApprovalCalls).toHaveLength(1);
    expect(runs.finalizeApprovalCalls[0].artifacts[0].contentHash).toBe(sha256(ARTIFACT.content));
    expect(runs.state.status).toBe('done');
  });

  it('repairAll drains every stuck decision deterministically', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    let armed = true;
    const service = createArtifactApprovalService({
      store,
      runs: runs.gateway,
      projectsRoot,
      faults: { afterRename: () => { if (armed) { armed = false; throw new Error('crash'); } } },
    });
    await expect(
      service.decide({
        skillRunId: RUN_ID,
        decision: 'approve',
        expectedProposalHash: computeProposalHash([ARTIFACT]),
        expectedProposalRevision: 1,
        idempotencyKey: idempotencyKey('approve'),
        artifacts: [ARTIFACT],
      }),
    ).rejects.toThrow();
    const repaired = await service.repairAll();
    expect(repaired).toHaveLength(1);
    expect(repaired[0].state).toBe('done');
  });

  it('P2-01 regression: a revision bump landing AFTER materialize but BEFORE finalize supersedes cleanly — no orphan/duplicate artifact metadata or event, and a fresh approval of the new revision converges deterministically', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    // The edited (revision 2) content the human approves after the race.
    const REVISION_2: ApprovalArtifactInput = {
      ...ARTIFACT,
      content: '# Offerbook\n\nRevisão 2 (edição concorrente).\n',
    };
    const revision2Hash = computeProposalHash([REVISION_2]);
    const service = createArtifactApprovalService({
      store,
      runs: runs.gateway,
      projectsRoot,
      faults: {
        // Fires immediately after the atomic rename (rev-1 bytes already on
        // disk) and BEFORE `recordApproval` calls `finalizeApproval` — exactly
        // the race window P2-01 flags: a concurrent edit bumps the revision
        // without throwing, so the saga proceeds straight into the CAS.
        afterRename: () => {
          runs.state.proposalRevision = 2;
          runs.state.proposalHash = revision2Hash;
        },
      },
    });

    const rev1Key = idempotencyKey('approve');
    await expect(
      service.decide({
        skillRunId: RUN_ID,
        decision: 'approve',
        expectedProposalHash: computeProposalHash([ARTIFACT]),
        expectedProposalRevision: 1,
        idempotencyKey: rev1Key,
        artifacts: [ARTIFACT],
      }),
    ).rejects.toMatchObject({ code: 'superseded' });

    // The file WAS transiently materialized with rev-1 bytes (the atomic
    // rename already completed before the race — the outbox `outcome` field
    // reflects that FS write), but the superseded decision's own FINALIZE must
    // claim NEITHER a `project_artifacts` row NOR an audit event: it never got
    // that far, since the CAS itself failed.
    expect(await readFile(targetPath(), 'utf8')).toBe(ARTIFACT.content);
    const supersededRecord = await store.getByKey(WORKSPACE_ID, rev1Key);
    expect(supersededRecord?.state).toBe('failed');
    expect(supersededRecord?.auditEvent).toBeNull();

    // Repair/replay must be deterministic and idempotent: a terminal `failed`
    // (superseded) row is NEVER resurrected — it stays exactly as it settled.
    const repairedAttempt = await service.repair(supersededRecord!.id);
    expect(repairedAttempt.state).toBe('failed');
    const repairedAgain = await service.repair(supersededRecord!.id);
    expect(repairedAgain).toEqual(repairedAttempt);

    // The human re-approves the NEW (winning) revision.
    const rev2Key = `${RUN_ID}:${revision2Hash}:approve`;
    const finalRecord = await service.decide({
      skillRunId: RUN_ID,
      decision: 'approve',
      expectedProposalHash: revision2Hash,
      expectedProposalRevision: 2,
      idempotencyKey: rev2Key,
      artifacts: [REVISION_2],
    });

    expect(finalRecord.state).toBe('done');
    expect(finalRecord.outcome).toBe('written');
    // Convergence: disk holds EXACTLY the winning revision's bytes — no
    // orphan/duplicate write survives from the superseded revision-1 decision.
    expect(await readFile(targetPath(), 'utf8')).toBe(REVISION_2.content);
    expect(runs.state.status).toBe('done');
    expect(runs.state.proposalHash).toBe(revision2Hash);
  });

  it('plans an accurate diff: create then modify with warnings', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });

    const created = await service.plan({ skillRunId: RUN_ID, artifacts: [ARTIFACT] });
    expect(created.files[0].changeType).toBe('create');
    expect(created.warnings).toHaveLength(0);

    // Now the file exists with different content — plan reports a modify + warning.
    await mkdir(resolve(projectsRoot, SLUG), { recursive: true });
    await writeFile(targetPath(), '# Offerbook\n\nConteúdo antigo.\n', 'utf8');
    const modified = await service.plan({ skillRunId: RUN_ID, artifacts: [ARTIFACT] });
    expect(modified.files[0].changeType).toBe('modify');
    expect(modified.files[0].hashBefore).not.toBeNull();
    expect(modified.warnings.length).toBeGreaterThan(0);
  });

  it('P3-01 regression: plan() refuses a symlink LEAF at the artifact path — never leaks external content into the diff', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });

    const outsideDir = await mkdtemp(join(tmpdir(), 'cohort-approval-outside-'));
    try {
      const secretPath = join(outsideDir, 'segredo.md');
      await writeFile(secretPath, 'CONTEUDO SECRETO FORA DA RAIZ DO PROJETO', 'utf8');
      await mkdir(resolve(projectsRoot, SLUG), { recursive: true });
      await symlink(secretPath, targetPath());

      await expect(service.plan({ skillRunId: RUN_ID, artifacts: [ARTIFACT] })).rejects.toMatchObject({
        code: 'write-failed',
      });
    } finally {
      await rm(outsideDir, { recursive: true, force: true });
    }
  });

  it('P3-01 regression: plan() refuses an INTERMEDIATE ancestor symlink under the project root — never leaks external content into the diff', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });

    const outsideDir = await mkdtemp(join(tmpdir(), 'cohort-approval-outside-'));
    try {
      await writeFile(join(outsideDir, 'nested.md'), 'CONTEUDO SECRETO FORA DA RAIZ DO PROJETO', 'utf8');
      await mkdir(resolve(projectsRoot, SLUG), { recursive: true });
      await symlink(outsideDir, resolve(projectsRoot, SLUG, 'linked'));

      await expect(
        service.plan({ skillRunId: RUN_ID, artifacts: [{ ...ARTIFACT, path: 'linked/nested.md' }] }),
      ).rejects.toMatchObject({ code: 'write-failed' });
    } finally {
      await rm(outsideDir, { recursive: true, force: true });
    }
  });

  it('W23-RG2-P1-01 regression: plan() rejects a symlink at the slug root before reading external content', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });

    const outsideDir = await mkdtemp(join(tmpdir(), 'cohort-approval-outside-'));
    try {
      await writeFile(join(outsideDir, ARTIFACT.path), 'CONTEUDO SECRETO FORA DA RAIZ DO PROJETO', 'utf8');
      await symlink(outsideDir, resolve(projectsRoot, SLUG));

      await expect(service.plan({ skillRunId: RUN_ID, artifacts: [ARTIFACT] })).rejects.toMatchObject({
        code: 'write-failed',
      });
    } finally {
      await rm(outsideDir, { recursive: true, force: true });
    }
  });

  it('diffLines trims common prefix/suffix and counts changes', () => {
    const before = 'a\nb\nc\n';
    const after = 'a\nB\nc\n';
    const diff = diffLines(before, after);
    expect(diff.removed).toBe(1);
    expect(diff.added).toBe(1);
    expect(diff.preview).toEqual(['- b', '+ B']);
  });

  it('rejects duplicate canonical paths before hashing, planning, outbox creation or materialization', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const materialize = vi.fn();
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot, materialize });
    const aliases = [
      { ...ARTIFACT, path: 'nested\\file.md' },
      { ...SECOND_ARTIFACT, path: 'nested/./file.md' },
    ];

    await expect(service.plan({ skillRunId: RUN_ID, artifacts: aliases })).rejects.toMatchObject({ code: 'duplicate-path' });
    await expect(
      service.decide({
        skillRunId: RUN_ID,
        decision: 'approve',
        expectedProposalHash: 'unused-because-duplicate-is-rejected-first',
        expectedProposalRevision: 1,
        idempotencyKey: 'duplicate-path',
        artifacts: aliases,
      }),
    ).rejects.toMatchObject({ code: 'duplicate-path' });
    expect(materialize).not.toHaveBeenCalled();
    expect(await store.getByKey(WORKSPACE_ID, 'duplicate-path')).toBeUndefined();
  });

  it('repairs a partial multi-file materialization without duplicating the first file', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const artifacts = [ARTIFACT, SECOND_ARTIFACT];
    const runs = fakeGateway({ proposalHash: computeProposalHash(artifacts) });
    let calls = 0;
    const materialize = vi.fn(async (...args: Parameters<typeof import('./artifact-materializer.js').materializeArtifact>) => {
      calls += 1;
      if (calls === 2) throw new Error('falha no segundo arquivo');
      const { materializeArtifact } = await import('./artifact-materializer.js');
      return materializeArtifact(...args);
    });
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot, materialize });
    const key = `${RUN_ID}:multi:approve`;

    await expect(
      service.decide({
        skillRunId: RUN_ID,
        decision: 'approve',
        expectedProposalHash: computeProposalHash(artifacts),
        expectedProposalRevision: 1,
        idempotencyKey: key,
        artifacts,
      }),
    ).rejects.toMatchObject({ code: 'write-failed' });
    const parked = await store.getByKey(WORKSPACE_ID, key);
    expect(parked?.state).toBe('materializing');
    expect(await readFile(resolve(projectsRoot, SLUG, ARTIFACT.path), 'utf8')).toBe(ARTIFACT.content);
    await expect(readFile(resolve(projectsRoot, SLUG, SECOND_ARTIFACT.path), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });

    const repaired = await service.repair(parked!.id);
    expect(repaired.state).toBe('done');
    expect(await readFile(resolve(projectsRoot, SLUG, SECOND_ARTIFACT.path), 'utf8')).toBe(SECOND_ARTIFACT.content);
    expect(runs.finalizeApprovalCalls).toHaveLength(1);
    expect(materialize).toHaveBeenCalledTimes(4);
  });

  it('returns a dedicated conflict when a reused key changes immutable semantics', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const materialize = vi.fn(async (...args: Parameters<typeof import('./artifact-materializer.js').materializeArtifact>) => {
      const { materializeArtifact } = await import('./artifact-materializer.js');
      return materializeArtifact(...args);
    });
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot, materialize });
    const input = {
      skillRunId: RUN_ID,
      decision: 'approve' as const,
      expectedProposalHash: computeProposalHash([ARTIFACT]),
      expectedProposalRevision: 1,
      idempotencyKey: idempotencyKey('approve'),
      artifacts: [ARTIFACT],
    };
    await service.decide(input);

    await expect(
      service.decide({
        ...input,
        expectedProposalHash: computeProposalHash([{ ...ARTIFACT, content: 'hash diferente' }]),
        artifacts: [{ ...ARTIFACT, content: 'hash diferente' }],
      }),
    ).rejects.toMatchObject({ code: 'idempotency-conflict' });
    expect(materialize).toHaveBeenCalledTimes(1);
  });

  it('blocks an alternate key from creating a second semantic decision and keeps replay repairable', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });
    const semantics = {
      skillRunId: RUN_ID,
      decision: 'approve' as const,
      expectedProposalHash: computeProposalHash([ARTIFACT]),
      expectedProposalRevision: 1,
      artifacts: [ARTIFACT],
    };
    const first = await service.decide({ ...semantics, idempotencyKey: 'first-key' });
    const alternate = await service.decide({ ...semantics, idempotencyKey: 'alternate-key' });
    expect(alternate.id).toBe(first.id);
    expect(runs.finalizeApprovalCalls).toHaveLength(1);
  });
});

// -----------------------------------------------------------------------------
// W23-RG2-P3-01 regression — the real Supabase outbox adapter must recover the
// row created by a concurrent insert that returned UNIQUE_VIOLATION (23505).
// The semantic read is exercised after the lexical key read misses, matching
// the fallback used when an alternate idempotency key lost the race.
// -----------------------------------------------------------------------------
describe('createSupabaseArtifactApprovalStore.create — 23505 recovery (W23-RG2-P3-01)', () => {
  it('returns the existing semantic row after a unique violation', async () => {
    const existingRow = {
      id: 'outbox-existing',
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      skill_run_id: RUN_ID,
      idempotency_key: 'winner-key',
      decision: 'approve',
      proposal_hash: 'proposal-hash',
      proposal_revision: 1,
      state: 'pending',
      outcome: null,
      plan: [],
      audit_event: null,
      error: null,
      attempt: 0,
      created_at: '2026-07-10T12:00:00.000Z',
      updated_at: '2026-07-10T12:00:00.000Z',
    };
    let readCount = 0;
    let insertPayload: unknown;
    const readFilters: Array<Array<[string, unknown]>> = [];
    const client = {
      from() {
        const filters: Array<[string, unknown]> = [];
        const chain: Record<string, (...args: unknown[]) => unknown> = {};
        chain.insert = (payload: unknown) => {
          insertPayload = payload;
          return chain;
        };
        chain.select = () => {
          return chain;
        };
        chain.eq = (column: unknown, value: unknown) => {
          filters.push([String(column), value]);
          return chain;
        };
        chain.maybeSingle = async () => {
          readCount += 1;
          readFilters.push(filters);
          // Key lookup misses; semantic lookup returns the concurrently
          // inserted row, proving the 23505 recovery path end-to-end.
          return readCount === 1 ? { data: null, error: null } : { data: existingRow, error: null };
        };
        chain.single = async () => ({
          data: null,
          error: { code: '23505', message: 'duplicate key value violates unique constraint' },
        });
        return chain;
      },
    };
    const store = createSupabaseArtifactApprovalStore(client as unknown as SupabaseClient, {
      now: () => '2026-07-10T12:00:00.000Z',
    });

    const result = await store.create({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      skillRunId: RUN_ID,
      idempotencyKey: 'loser-key',
      decision: 'approve',
      proposalHash: 'proposal-hash',
      proposalRevision: 1,
      plan: [],
    });

    expect(result.id).toBe(existingRow.id);
    expect(result.idempotencyKey).toBe(existingRow.idempotency_key);
    expect(readCount).toBe(2);
    expect(readFilters).toEqual([
      [
        ['workspace_id', WORKSPACE_ID],
        ['idempotency_key', 'loser-key'],
      ],
      [
        ['workspace_id', WORKSPACE_ID],
        ['skill_run_id', RUN_ID],
        ['proposal_revision', 1],
      ],
    ]);
    expect(insertPayload).toMatchObject({
      workspace_id: WORKSPACE_ID,
      skill_run_id: RUN_ID,
      idempotency_key: 'loser-key',
    });
  });
});

describe('artifact approval endpoints', () => {
  const TOKEN = 'approval-token-secret';
  const AUTH = { [LOCAL_RUNNER_TOKEN_HEADER]: TOKEN };
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];
  let projectsRoot: string;

  beforeEach(async () => {
    projectsRoot = await mkdtemp(join(tmpdir(), 'cohort-approval-ep-'));
  });
  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
    await rm(projectsRoot, { recursive: true, force: true });
  });

  async function buildWith(service: ArtifactApprovalService | null) {
    const app = await buildApp({
      campaignRepo: null,
      skillRunner: null,
      localRunnerToken: TOKEN,
      recoverOnBoot: false,
      artifactApprovalService: service,
    });
    apps.push(app);
    return app;
  }

  function realService() {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway();
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });
    return { service, store, runs };
  }

  const targetPath = () => resolve(projectsRoot, SLUG, ARTIFACT.path);
  const idempotencyKey = (decision: string) => `${RUN_ID}:${computeProposalHash([ARTIFACT])}:${decision}`;
  const decideBody = (decision: 'approve' | 'reject') => ({
    skillRunId: RUN_ID,
    decision,
    expectedProposalHash: computeProposalHash([ARTIFACT]),
    expectedProposalRevision: 1,
    idempotencyKey: idempotencyKey(decision),
    artifacts: decision === 'approve' ? [ARTIFACT] : undefined,
  });

  it('rejects an unauthenticated request (401, no token)', async () => {
    const { service } = realService();
    const app = await buildWith(service);
    const res = await app.inject({ method: 'POST', url: '/api/local/artifact-approvals', payload: decideBody('approve') });
    expect(res.statusCode).toBe(401);
  });

  it('rejects approval requests that do not originate from loopback', async () => {
    const { service } = realService();
    const app = await buildWith(service);
    const res = await app.inject({
      method: 'POST',
      url: '/api/local/artifact-approvals',
      remoteAddress: '192.168.1.20',
      headers: AUTH,
      payload: decideBody('approve'),
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('ARTIFACT_APPROVAL_LOOPBACK_ONLY');
  });

  it('reports the capability off when no approval service is wired (503)', async () => {
    const app = await buildWith(null);
    const res = await app.inject({ method: 'POST', url: '/api/local/artifact-approvals', headers: AUTH, payload: decideBody('approve') });
    expect(res.statusCode).toBe(503);
    expect(res.json().code).toBe('ARTIFACT_APPROVAL_DISABLED');
  });

  it('plans, then approves — materializes and returns a done record', async () => {
    const { service, runs } = realService();
    const app = await buildWith(service);

    const planRes = await app.inject({
      method: 'POST',
      url: '/api/local/artifact-approvals/plan',
      headers: AUTH,
      payload: { skillRunId: RUN_ID, artifacts: [ARTIFACT] },
    });
    expect(planRes.statusCode).toBe(200);
    expect(planRes.json().files[0].changeType).toBe('create');

    const res = await app.inject({ method: 'POST', url: '/api/local/artifact-approvals', headers: AUTH, payload: decideBody('approve') });
    expect(res.statusCode).toBe(200);
    expect(res.json().state).toBe('done');
    expect(await readFile(targetPath(), 'utf8')).toBe(ARTIFACT.content);
    expect(runs.state.status).toBe('done');
  });

  it('replays the same decision idempotently (same outbox id)', async () => {
    const { service } = realService();
    const app = await buildWith(service);
    const first = await app.inject({ method: 'POST', url: '/api/local/artifact-approvals', headers: AUTH, payload: decideBody('approve') });
    const second = await app.inject({ method: 'POST', url: '/api/local/artifact-approvals', headers: AUTH, payload: decideBody('approve') });
    expect(second.statusCode).toBe(200);
    expect(second.json().id).toBe(first.json().id);
  });

  it('returns 409 for a stale expected revision', async () => {
    const store = createInMemoryArtifactApprovalStore();
    const runs = fakeGateway({ proposalRevision: 3 });
    const service = createArtifactApprovalService({ store, runs: runs.gateway, projectsRoot });
    const app = await buildWith(service);
    const res = await app.inject({ method: 'POST', url: '/api/local/artifact-approvals', headers: AUTH, payload: decideBody('approve') });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('stale');
  });

  it('rejects a proposal — persists the decision without writing files', async () => {
    const { service, runs } = realService();
    const app = await buildWith(service);
    const res = await app.inject({ method: 'POST', url: '/api/local/artifact-approvals', headers: AUTH, payload: decideBody('reject') });
    expect(res.statusCode).toBe(200);
    expect(res.json().state).toBe('rejected');
    expect(runs.state.status).toBe('cancelled');
    await expect(readFile(targetPath(), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });
});

// -----------------------------------------------------------------------------
// P2-01 regression — the REAL Supabase gateway (not the test fake) must run the
// guarded skill_run CAS BEFORE any project_artifacts upsert. Exercised directly
// against `createSupabaseApprovalRunGateway`, with a minimal recording mock of
// the Supabase fluent client, so a future regression to upsert-first is caught
// even though the in-memory saga tests above use a fake gateway that was
// already CAS-first by construction (it never modeled an artifact store).
// -----------------------------------------------------------------------------
interface MockSupabaseCall {
  table: string;
  method: string;
  args: unknown[];
}

/** Minimal recording mock of the `SupabaseClient` fluent chain used by `finalizeApproval`. */
function createMockSupabaseClient(script: {
  /** Responses consumed in order by each `maybeSingle()` call against `skill_runs`. */
  skillRuns?: Array<{ data: unknown; error: unknown }>;
  /** Responses consumed in order by each `upsert()` call against `project_artifacts`. */
  projectArtifacts?: Array<{ error: unknown }>;
}) {
  const calls: MockSupabaseCall[] = [];
  let skillRunCursor = 0;
  let artifactCursor = 0;

  function chainNode(table: string) {
    const node: Record<string, (...args: unknown[]) => unknown> = {};
    for (const method of ['update', 'select', 'eq', 'in', 'or']) {
      node[method] = (...args: unknown[]) => {
        calls.push({ table, method, args });
        return node;
      };
    }
    node.maybeSingle = async () => {
      calls.push({ table, method: 'maybeSingle', args: [] });
      const response = (script.skillRuns ?? [])[skillRunCursor] ?? { data: null, error: null };
      skillRunCursor += 1;
      return response;
    };
    return node;
  }

  const client = {
    from(table: string) {
      calls.push({ table, method: 'from', args: [] });
      return {
        ...chainNode(table),
        upsert: async (rows: unknown) => {
          calls.push({ table, method: 'upsert', args: [rows] });
          const response = (script.projectArtifacts ?? [])[artifactCursor] ?? { error: null };
          artifactCursor += 1;
          return response;
        },
      };
    },
  };

  return { client: client as unknown as SupabaseClient, calls };
}

describe('createSupabaseApprovalRunGateway.finalizeApproval — CAS ordering (P2-01 regression)', () => {
  const artifactInput: FinalizeApprovalInput['artifacts'][number] = {
    artifactId: 'artifact-cas-1',
    artifactType: 'offerbook',
    title: 'Offerbook',
    path: 'offerbook.md',
    format: 'markdown',
    content: '# Offerbook\n',
    contentHash: sha256('# Offerbook\n'),
  };

  it('never upserts project_artifacts when the guarded CAS finds a superseded revision (0 rows, stale re-read)', async () => {
    const { client, calls } = createMockSupabaseClient({
      skillRuns: [
        // 1st maybeSingle(): the CAS update/select — 0 rows (revision mismatch).
        { data: null, error: null },
        // 2nd maybeSingle(): the re-read — current row is still at the OLD hash.
        {
          data: {
            status: 'needs_review',
            proposal_hash: 'hash-antigo',
            project_id: PROJECT_ID,
            workspace_id: WORKSPACE_ID,
            proposal_revision: 1,
          },
          error: null,
        },
      ],
    });
    const gateway = createSupabaseApprovalRunGateway(client);

    const result = await gateway.finalizeApproval({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      skillRunId: RUN_ID,
      expectedRevision: 1,
      proposalHash: 'hash-novo',
      artifacts: [artifactInput],
    });

    expect(result.committed).toBe(false);
    // The defect (P2-01): a superseded CAS must NEVER trigger an artifact write.
    expect(calls.some((call) => call.table === 'project_artifacts' && call.method === 'upsert')).toBe(false);
  });

  it('upserts project_artifacts ONLY after the guarded CAS commits, strictly ordered after it', async () => {
    const { client, calls } = createMockSupabaseClient({
      skillRuns: [
        // 1st maybeSingle(): the CAS update/select commits directly (1 row, status done).
        {
          data: {
            status: 'done',
            proposal_hash: 'hash-novo',
            project_id: PROJECT_ID,
            workspace_id: WORKSPACE_ID,
            proposal_revision: 1,
          },
          error: null,
        },
      ],
      projectArtifacts: [{ error: null }],
    });
    const gateway = createSupabaseApprovalRunGateway(client);

    const result = await gateway.finalizeApproval({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      skillRunId: RUN_ID,
      expectedRevision: 1,
      proposalHash: 'hash-novo',
      artifacts: [artifactInput],
    });

    expect(result.committed).toBe(true);
    const casCallIdx = calls.findIndex((call) => call.table === 'skill_runs' && call.method === 'update');
    const upsertCallIdx = calls.findIndex((call) => call.table === 'project_artifacts' && call.method === 'upsert');
    expect(casCallIdx).toBeGreaterThanOrEqual(0);
    expect(upsertCallIdx).toBeGreaterThan(casCallIdx);
  });

  it('accepts a same-hash done row as an idempotent replay without updating it', async () => {
    const { client, calls } = createMockSupabaseClient({
      skillRuns: [
        // The guarded needs_review -> done CAS returns zero; the re-read is an
        // already-done row with the same identity and hash.
        { data: null, error: null },
        {
          data: {
            status: 'done',
            proposal_hash: 'hash-novo',
            project_id: PROJECT_ID,
            workspace_id: WORKSPACE_ID,
            proposal_revision: 1,
          },
          error: null,
        },
      ],
      projectArtifacts: [{ error: null }],
    });
    const gateway = createSupabaseApprovalRunGateway(client);

    const result = await gateway.finalizeApproval({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      skillRunId: RUN_ID,
      expectedRevision: 1,
      proposalHash: 'hash-novo',
      artifacts: [artifactInput],
    });

    expect(result.committed).toBe(true);
    expect(calls.filter((call) => call.table === 'project_artifacts' && call.method === 'upsert')).toHaveLength(1);
  });

  it('rejects a different hash for the same done revision and never upserts', async () => {
    const { client, calls } = createMockSupabaseClient({
      skillRuns: [
        { data: null, error: null },
        {
          data: {
            status: 'done',
            proposal_hash: 'hash-ja-concluido',
            project_id: PROJECT_ID,
            workspace_id: WORKSPACE_ID,
            proposal_revision: 1,
          },
          error: null,
        },
      ],
    });
    const gateway = createSupabaseApprovalRunGateway(client);

    const result = await gateway.finalizeApproval({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      skillRunId: RUN_ID,
      expectedRevision: 1,
      proposalHash: 'hash-diferente',
      artifacts: [artifactInput],
    });

    expect(result.committed).toBe(false);
    expect(calls.some((call) => call.table === 'project_artifacts' && call.method === 'upsert')).toBe(false);
  });

  it('repairs an artifact-upsert failure after CAS: retry re-reads same done hash and converges', async () => {
    const { client, calls } = createMockSupabaseClient({
      skillRuns: [
        {
          data: {
            status: 'done',
            proposal_hash: 'hash-novo',
            project_id: PROJECT_ID,
            workspace_id: WORKSPACE_ID,
            proposal_revision: 1,
          },
          error: null,
        },
        { data: null, error: null },
        {
          data: {
            status: 'done',
            proposal_hash: 'hash-novo',
            project_id: PROJECT_ID,
            workspace_id: WORKSPACE_ID,
            proposal_revision: 1,
          },
          error: null,
        },
      ],
      projectArtifacts: [{ error: { message: 'falha transitória no upsert' } }, { error: null }],
    });
    const gateway = createSupabaseApprovalRunGateway(client);
    const input = {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      skillRunId: RUN_ID,
      expectedRevision: 1,
      proposalHash: 'hash-novo',
      artifacts: [artifactInput],
    } satisfies FinalizeApprovalInput;

    await expect(gateway.finalizeApproval(input)).rejects.toThrow('falha transitória no upsert');
    await expect(gateway.finalizeApproval(input)).resolves.toEqual({ committed: true });
    expect(calls.filter((call) => call.table === 'project_artifacts' && call.method === 'upsert')).toHaveLength(2);
  });
});
