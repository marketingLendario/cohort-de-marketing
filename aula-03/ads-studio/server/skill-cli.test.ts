import { describe, expect, it, vi } from 'vitest';
import { approveSkillRunFromCli, cancelSkillFromCli, executeSkillFromCli, readEnvironmentBootstrapFromCli, readProjectStatusFromCli, rejectSkillRunFromCli, retrySkillFromCli, type SkillCliBackend, type SkillCliDatabase } from './skill-cli.js';

const payload = { workspaceId: 'workspace-1', projectId: 'project-1', brief: { project: { slug: 'prova' } } };
const proposal = {
  summary: 'Pack pronto.',
  resultMarkdown: '# Pack',
  artifacts: [
    { artifactType: 'copy', title: 'Copy', path: 'copy.md', format: 'markdown' as const, content: '# Copy' },
    { artifactType: 'copy', title: 'Copy HTML', path: 'copy.html', format: 'html' as const, content: '<h1>Copy</h1>' },
  ],
  fields: [], questions: [], warnings: [],
};

function database(): SkillCliDatabase {
  return {
    readRun: vi.fn(async () => ({ proposal })),
    createRun: vi.fn(async () => 'run-1'),
    completeRun: vi.fn(async () => undefined),
    failRun: vi.fn(async () => undefined),
    supersedeRun: vi.fn(async () => undefined),
    restartRun: vi.fn(async () => undefined),
  };
}

function backend(overrides: Partial<SkillCliBackend> = {}): SkillCliBackend {
  return {
    start: vi.fn(async () => ({ jobId: 'job-1' })),
    get: vi.fn(async () => ({ jobId: 'job-1', skillId: 'copy-funil', status: 'succeeded' as const, proposal, skillHash: 'hash-1', model: 'codex-cli-default', error: null })),
    cancel: vi.fn(async () => undefined),
    retry: vi.fn(async () => undefined),
    plan: vi.fn(async () => ({ skillRunId: 'run-1', proposalHash: 'proposal-hash', proposalRevision: 1, files: [] })),
    approve: vi.fn(async () => ({ state: 'done', outcome: 'created', proposalHash: 'proposal-hash', proposalRevision: 1, plan: [
      { path: 'copy.md', format: 'markdown', content: '# Copy', contentHash: 'md-hash' },
      { path: 'copy.pdf', format: 'pdf', content: '', contentEncoding: 'base64' as const, contentHash: 'pdf-hash' },
    ] })),
    reject: vi.fn(async () => ({ state: 'rejected', outcome: 'rejected', proposalHash: 'proposal-hash', proposalRevision: 1, plan: [] })),
    ...overrides,
  };
}

describe('skill CLI orchestration', () => {
  it('uses the durable BFF flow and the same approval saga as the panel', async () => {
    const db = database();
    const bff = backend();
    const result = await executeSkillFromCli({ skillId: 'copy-funil', payload, approve: true, pollIntervalMs: 1 }, { backend: bff, database: db });

    expect(result).toMatchObject({ surface: 'cli', status: 'done', skillRunId: 'run-1' });
    expect(result.approval?.files).toEqual([
      { path: 'copy.md', format: 'markdown', contentHash: 'md-hash' },
      { path: 'copy.pdf', format: 'pdf', contentHash: 'pdf-hash' },
    ]);
    expect(db.createRun).toHaveBeenCalledBefore(db.completeRun as ReturnType<typeof vi.fn>);
    expect(bff.plan).toHaveBeenCalledWith('run-1', proposal.artifacts);
    expect(bff.approve).toHaveBeenCalledOnce();
  });

  it('stops at an auditable elicitation checkpoint without approving', async () => {
    const questionProposal = { ...proposal, artifacts: [], questions: ['Qual é a oferta?'] };
    const bff = backend({ get: vi.fn(async () => ({ jobId: 'job-1', skillId: 'offerbook', status: 'succeeded' as const, proposal: questionProposal, skillHash: 'hash-1', model: 'codex-cli-default', error: null })) });
    const result = await executeSkillFromCli({ skillId: 'offerbook', payload, approve: true, pollIntervalMs: 1 }, { backend: bff, database: database() });

    expect(result.status).toBe('needs_input');
    expect(result.proposal.questions).toEqual(['Qual é a oferta?']);
    expect(bff.approve).not.toHaveBeenCalled();
  });

  it('supports a separate review-then-approve command and blocks pending questions', async () => {
    const bff = backend();
    await expect(approveSkillRunFromCli({ skillRunId: 'run-1', proposal }, bff)).resolves.toMatchObject({ state: 'done' });
    await expect(approveSkillRunFromCli({ skillRunId: 'run-1', proposal: { ...proposal, questions: ['Decidir preço?'] } }, bff))
      .rejects.toThrow('decisões pendentes');
  });

  it('rejects through the approval saga and cancels the durable job/run pair', async () => {
    const bff = backend();
    const db = database();
    await expect(rejectSkillRunFromCli({ skillRunId: 'run-1', proposal }, bff)).resolves.toMatchObject({ state: 'rejected' });
    expect(bff.reject).toHaveBeenCalledWith({ skillRunId: 'run-1', proposalHash: 'proposal-hash', proposalRevision: 1 });
    await cancelSkillFromCli({ workspaceId: 'workspace-1', skillRunId: 'run-1', jobId: 'job-1' }, { backend: bff, database: db });
    expect(bff.cancel).toHaveBeenCalledWith('job-1');
    expect(db.failRun).toHaveBeenCalledWith(expect.objectContaining({ runId: 'run-1', status: 'cancelled' }));
  });

  it('links a continuation run and supersedes its elicitation parent', async () => {
    const db = database();
    const bff = backend();
    const result = await executeSkillFromCli({
      skillId: 'pagina-vendas-funil',
      payload: { ...payload, elicitationParentRunId: 'parent-run' },
      approve: false,
      pollIntervalMs: 1,
    }, { backend: bff, database: db });
    expect(result.skillRunId).toBe('run-1');
    expect((bff.start as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('pagina-vendas-funil', expect.objectContaining({
      context: expect.objectContaining({ artifacts: expect.arrayContaining([expect.objectContaining({ path: 'copy.md' })]) }),
    }));
    expect(db.createRun).toHaveBeenCalledWith(expect.objectContaining({ elicitationParentRunId: 'parent-run' }));
    expect(db.supersedeRun).toHaveBeenCalledWith({ workspaceId: 'workspace-1', parentRunId: 'parent-run', continuationRunId: 'run-1' });
  });

  it('cancels the backend job if the durable CLI pointer cannot be created', async () => {
    const bff = backend();
    const db = database();
    db.createRun = vi.fn(async () => { throw new Error('RLS'); });
    await expect(executeSkillFromCli({ skillId: 'copy-funil', payload, approve: false }, { backend: bff, database: db })).rejects.toThrow('RLS');
    expect(bff.cancel).toHaveBeenCalledWith('job-1');
  });

  it('cancels both job and continuation pointer when the parent linkage fails', async () => {
    const bff = backend();
    const db = database();
    db.supersedeRun = vi.fn(async () => { throw new Error('stale parent'); });
    await expect(executeSkillFromCli({
      skillId: 'copy-funil', payload: { ...payload, elicitationParentRunId: 'parent-run' }, approve: false,
    }, { backend: bff, database: db })).rejects.toThrow('stale parent');
    expect(bff.cancel).toHaveBeenCalledWith('job-1');
    expect(db.failRun).toHaveBeenCalledWith(expect.objectContaining({ runId: 'run-1', status: 'cancelled' }));
  });

  it('retries the same durable job and run without creating a duplicate pointer', async () => {
    const bff = backend();
    const db = database();
    const result = await retrySkillFromCli({ workspaceId: 'workspace-1', skillRunId: 'run-1', jobId: 'job-1', pollIntervalMs: 1 }, { backend: bff, database: db });
    expect(result).toMatchObject({ status: 'needs_review', jobId: 'job-1', skillRunId: 'run-1' });
    expect(bff.retry).toHaveBeenCalledWith('job-1');
    expect(db.restartRun).toHaveBeenCalledWith({ workspaceId: 'workspace-1', runId: 'run-1' });
    expect(db.createRun).not.toHaveBeenCalled();
  });

  it('reads status-funil as an ephemeral read-only result without creating a run', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      schemaVersion: '1.0.0', projectSlug: 'cliente-x', pieces: [], alternatives: [],
      pending: { open: 0, resolved: 0, decisions: [] }, completed: 0, total: 11,
      nextCommand: '/avatar-funil', divergences: [], readOnly: true,
      sourceHashes: { filesystem: 'fs', database: 'db', book: null, pendings: null },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const result = await readProjectStatusFromCli({
      baseUrl: 'http://127.0.0.1:5178/', token: 'local-token', projectId: 'project-1', fetchImpl,
    });

    expect(result).toMatchObject({ surface: 'cli', skillId: 'status-funil', status: 'done', result: { readOnly: true } });
    expect(fetchImpl).toHaveBeenCalledWith('http://127.0.0.1:5178/api/local/projects/project-1/status', {
      headers: { 'x-local-runner-token': 'local-token' },
    });
  });

  it('runs comecar through the same deterministic bootstrap adapter', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      schemaVersion: '1.0.0', status: 'ready', checkedAt: '2026-07-11T12:00:00.000Z', diagnosisHash: 'a'.repeat(64), checks: [],
      starts: [{ id: 'aula-1', label: 'Começar pela pesquisa', nextCommand: '/avatar-funil' }],
    }), { status: 200 }));
    const result = await readEnvironmentBootstrapFromCli({ baseUrl: 'http://127.0.0.1:5178', token: 'local-token', fetchImpl });
    expect(result).toMatchObject({ surface: 'cli', skillId: 'comecar', status: 'done', result: { status: 'ready' } });
  });
});
