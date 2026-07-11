import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  RepositoryForbiddenError,
  RevisionConflictError,
  artifactUpsert,
  briefRevisionInsert,
  createSupabaseProjectRepository,
  projectInsert,
  rowToArtifact,
  rowToBriefRevision,
  rowToCampaignPlan,
  rowToProject,
  rowToSkillRun,
  rowToWeeklyPanel,
  skillRunUpdate,
  toRepositoryError,
} from '@/lib/project-repository';
import type { CampaignPlanRevision, WeeklyPanel } from '@/lib/project-domain';

// ---------------------------------------------------------------------------
// Fake Supabase client — builder encadeável que registra os filtros e resolve
// para um resultado pré-configurado. Reproduz a superfície usada pelo adapter
// (`from().select().eq()...single()/maybeSingle()` e o builder "thenable").
// ---------------------------------------------------------------------------

interface FakeResult {
  data: unknown;
  error: { code?: string; message?: string } | null;
}

function makeClient(result: FakeResult) {
  const eqCalls: Array<[string, unknown]> = [];
  const builder: Record<string, unknown> = {};
  const chain = () => builder;

  for (const method of ['select', 'insert', 'update', 'upsert', 'order', 'limit']) {
    builder[method] = vi.fn(chain);
  }
  builder.eq = vi.fn((column: string, value: unknown) => {
    eqCalls.push([column, value]);
    return builder;
  });
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  // O builder é awaitable diretamente (queries de lista): resolve ao resultado.
  builder.then = (onFulfilled: (r: FakeResult) => unknown) => Promise.resolve(result).then(onFulfilled);

  const rpc = vi.fn(() => builder);
  const client = { from: vi.fn(() => builder), rpc } as unknown as SupabaseClient;
  return { client, eqCalls, builder, rpc };
}

// ---------------------------------------------------------------------------
// Fixtures de linhas (snake_case) — o formato bruto que a RLS entrega
// ---------------------------------------------------------------------------

const PROJECT_ROW = {
  id: 'p1',
  workspace_id: 'ws1',
  slug: 'lendaria',
  name: 'Lendária',
  status: 'active' as const,
  active_brief_revision_id: null,
  created_at: '2026-07-09T00:00:00.000Z',
  updated_at: '2026-07-09T01:00:00.000Z',
};

describe('mappers snake_case -> camelCase (AC2)', () => {
  it('projeta null active_brief_revision_id para a sentinela vazia', () => {
    expect(rowToProject(PROJECT_ROW)).toEqual({
      id: 'p1',
      workspaceId: 'ws1',
      slug: 'lendaria',
      name: 'Lendária',
      status: 'active',
      activeBriefRevisionId: '',
      createdAt: '2026-07-09T00:00:00.000Z',
      updatedAt: '2026-07-09T01:00:00.000Z',
    });
  });

  it('mapeia revisão de briefing com fieldSources default', () => {
    const brief = rowToBriefRevision({
      id: 'b1',
      workspace_id: 'ws1',
      project_id: 'p1',
      revision: 3,
      schema_version: '1.0.0',
      status: 'active',
      data: { schemaVersion: '0.1.0', project: { slug: 'lendaria' } },
      field_sources: null as never,
      created_at: '2026-07-09T00:00:00.000Z',
      updated_at: '2026-07-09T00:00:00.000Z',
    });
    expect(brief.revision).toBe(3);
    expect(brief.workspaceId).toBe('ws1');
    expect(brief.projectId).toBe('p1');
    expect(brief.fieldSources).toEqual({});
  });

  it('omite campos opcionais ausentes do artefato', () => {
    const artifact = rowToArtifact({
      id: 'a1',
      workspace_id: 'ws1',
      project_id: 'p1',
      artifact_type: 'offerbook',
      title: 'Offerbook',
      path: null,
      format: 'markdown',
      state: 'real',
      verification: 'confirmed',
      source: 'skill_run',
      content: null,
      content_hash: null,
      skill_run_id: null,
      created_at: '2026-07-09T00:00:00.000Z',
      updated_at: '2026-07-09T00:00:00.000Z',
    });
    expect(artifact.path).toBe('');
    expect('hash' in artifact).toBe(false);
    expect('content' in artifact).toBe(false);
    expect('skillRunId' in artifact).toBe(false);
  });

  it('preserva hash e skillRunId quando presentes', () => {
    const artifact = rowToArtifact({
      id: 'a1',
      workspace_id: 'ws1',
      project_id: 'p1',
      artifact_type: 'offerbook',
      title: 'Offerbook',
      path: 'projetos/lendaria/offerbook.md',
      format: 'markdown',
      state: 'confirmed',
      verification: 'confirmed',
      source: 'skill_run',
      content: '# Offerbook',
      content_hash: 'sha256:abc',
      skill_run_id: 'run-1',
      created_at: '2026-07-09T00:00:00.000Z',
      updated_at: '2026-07-09T00:00:00.000Z',
    });
    expect(artifact.hash).toBe('sha256:abc');
    expect(artifact.skillRunId).toBe('run-1');
    expect(artifact.content).toBe('# Offerbook');
  });

  it('mapeia skill run omitindo proposal/hash/revisão/error nulos', () => {
    const run = rowToSkillRun({
      id: 'r1',
      workspace_id: 'ws1',
      project_id: 'p1',
      skill_id: 'offerbook',
      skill_hash: 'h1',
      status: 'running',
      input_snapshot: { a: 1 },
      proposal: null,
      proposal_hash: null,
      proposal_revision: null,
      error: null,
      created_at: '2026-07-09T00:00:00.000Z',
      updated_at: '2026-07-09T00:00:00.000Z',
    });
    expect(run.inputSnapshot).toEqual({ a: 1 });
    expect('proposal' in run).toBe(false);
    expect('proposalHash' in run).toBe(false);
    expect('proposalRevision' in run).toBe(false);
    expect('error' in run).toBe(false);
  });

  it('mapeia hash e revisão da proposta em revisão (STORY-8.W2.3)', () => {
    const run = rowToSkillRun({
      id: 'r2',
      workspace_id: 'ws1',
      project_id: 'p1',
      skill_id: 'offerbook',
      skill_hash: 'h1',
      status: 'needs_review',
      input_snapshot: {},
      proposal: { summary: 'ok' },
      proposal_hash: 'proposal-hash-abc',
      proposal_revision: 2,
      error: null,
      created_at: '2026-07-09T00:00:00.000Z',
      updated_at: '2026-07-09T00:00:00.000Z',
    });
    expect(run.proposalHash).toBe('proposal-hash-abc');
    expect(run.proposalRevision).toBe(2);
  });

  it('reconcilia a identidade do plano de campanha a partir das colunas da linha', () => {
    const data = { schemaVersion: '1.0.0', platform: 'meta', objective: 'sales', revision: 1 } as unknown as CampaignPlanRevision;
    const plan = rowToCampaignPlan({
      id: 'cp1',
      workspace_id: 'ws1',
      project_id: 'p1',
      campaign_id: 'c1',
      revision: 5,
      schema_version: '1.0.0',
      data,
      created_at: '2026-07-09T00:00:00.000Z',
      updated_at: '2026-07-09T00:00:00.000Z',
    });
    expect(plan.id).toBe('cp1');
    expect(plan.projectId).toBe('p1');
    expect(plan.campaignId).toBe('c1');
    // A coluna autoritativa vence o valor embutido no jsonb.
    expect(plan.revision).toBe(5);
  });

  it('reconcilia identidade e status do painel semanal a partir das colunas', () => {
    const data = { schemaVersion: '1.0.0', status: 'draft', metrics: [] } as unknown as WeeklyPanel;
    const panel = rowToWeeklyPanel({
      id: 'wp1',
      workspace_id: 'ws1',
      project_id: 'p1',
      campaign_id: 'c1',
      week_start: '2026-07-06',
      revision: 2,
      schema_version: '1.0.0',
      status: 'reading_ready',
      data,
      created_at: '2026-07-09T00:00:00.000Z',
      updated_at: '2026-07-09T00:00:00.000Z',
    });
    expect(panel.weekStart).toBe('2026-07-06');
    expect(panel.revision).toBe(2);
    expect(panel.status).toBe('reading_ready');
  });
});

describe('mappers camelCase -> snake_case (AC2)', () => {
  it('converte input de projeto com status default active', () => {
    expect(projectInsert({ workspaceId: 'ws1', slug: 'lendaria', name: 'Lendária' })).toEqual({
      workspace_id: 'ws1',
      slug: 'lendaria',
      name: 'Lendária',
      status: 'active',
    });
  });

  it('converte input de revisão de briefing', () => {
    const row = briefRevisionInsert({
      workspaceId: 'ws1',
      projectId: 'p1',
      revision: 2,
      status: 'draft',
      data: { schemaVersion: '0.1.0', project: { slug: 'lendaria' } },
    });
    expect(row).toMatchObject({
      workspace_id: 'ws1',
      project_id: 'p1',
      revision: 2,
      status: 'draft',
      field_sources: {},
    });
  });

  it('converte a decisão de revisão do skill run (proposta/hash/revisão) para colunas', () => {
    const patch = skillRunUpdate({
      status: 'done',
      proposalHash: 'proposal-hash-xyz',
      proposalRevision: 3,
    });
    expect(patch).toEqual({
      status: 'done',
      proposal_hash: 'proposal-hash-xyz',
      proposal_revision: 3,
    });
    // Campos ausentes não entram no patch (update parcial).
    expect(skillRunUpdate({ status: 'cancelled' })).toEqual({ status: 'cancelled' });
  });

  it('converte hash do artefato para a coluna content_hash', () => {
    const row = artifactUpsert({
      workspaceId: 'ws1',
      projectId: 'p1',
      artifactType: 'offerbook',
      title: 'Offerbook',
      format: 'markdown',
      state: 'real',
      verification: 'pending',
      source: 'skill_run',
      hash: 'sha256:abc',
    });
    expect(row.content_hash).toBe('sha256:abc');
    expect(row.path).toBeNull();
  });
});

describe('mapeamento de erros tipados', () => {
  it('23505 vira RevisionConflictError (AC3)', () => {
    const err = toRepositoryError({ code: '23505' }, 'project_brief_revisions');
    expect(err).toBeInstanceOf(RevisionConflictError);
    expect(err.code).toBe('conflict');
    expect(err.entity).toBe('project_brief_revisions');
  });

  it('42501 (RLS) vira RepositoryForbiddenError (AC4)', () => {
    const err = toRepositoryError({ code: '42501' }, 'marketing_projects');
    expect(err).toBeInstanceOf(RepositoryForbiddenError);
    expect(err.code).toBe('forbidden');
  });

  it('PGRST116 vira not_found', () => {
    const err = toRepositoryError({ code: 'PGRST116' }, 'marketing_projects');
    expect(err.code).toBe('not_found');
  });

  it('código desconhecido preserva a mensagem original', () => {
    const err = toRepositoryError({ code: 'XX000', message: 'boom' }, 'skill_runs');
    expect(err.code).toBe('unknown');
    expect(err.message).toBe('boom');
  });
});

describe('adapter Supabase', () => {
  it('createBriefRevision converte conflito de revisão em RevisionConflictError (AC3)', async () => {
    const { client } = makeClient({ data: null, error: { code: '23505' } });
    const repo = createSupabaseProjectRepository(client);

    await expect(
      repo.createBriefRevision({
        workspaceId: 'ws1',
        projectId: 'p1',
        revision: 2,
        status: 'active',
        data: { schemaVersion: '0.1.0', project: { slug: 'lendaria' } },
      }),
    ).rejects.toBeInstanceOf(RevisionConflictError);
  });

  it('toda query de projeto carrega o filtro workspace_id (AC4)', async () => {
    const { client, eqCalls } = makeClient({ data: [PROJECT_ROW], error: null });
    const repo = createSupabaseProjectRepository(client);

    const projects = await repo.listProjects('ws1');

    expect(projects).toHaveLength(1);
    expect(eqCalls).toContainEqual(['workspace_id', 'ws1']);
  });

  it('getProject retorna null quando a RLS não expõe a linha', async () => {
    const { client } = makeClient({ data: null, error: null });
    const repo = createSupabaseProjectRepository(client);
    expect(await repo.getProject('ws1', 'missing')).toBeNull();
  });

  it('updateSkillRun propaga a negação da RLS como RepositoryForbiddenError', async () => {
    const { client } = makeClient({ data: null, error: { code: '42501' } });
    const repo = createSupabaseProjectRepository(client);
    await expect(repo.updateSkillRun('ws1', 'r1', { status: 'done' })).rejects.toBeInstanceOf(
      RepositoryForbiddenError,
    );
  });

  it('edita proposta via RPC CAS, sem UPDATE direto dos campos sensíveis', async () => {
    const runRow = {
      id: 'r1',
      workspace_id: 'ws1',
      project_id: 'p1',
      skill_id: 'offerbook',
      skill_hash: 'skill-hash',
      status: 'needs_review' as const,
      input_snapshot: {},
      proposal: { artifacts: [] },
      proposal_hash: 'a'.repeat(64),
      proposal_revision: 2,
      error: null,
      created_at: '2026-07-09T00:00:00.000Z',
      updated_at: '2026-07-09T01:00:00.000Z',
    };
    const { client, builder, rpc } = makeClient({ data: runRow, error: null });
    const repo = createSupabaseProjectRepository(client);
    const proposal = { artifacts: [{ path: 'offerbook.md', content: 'editado' }] };

    const run = await repo.updateSkillRun('ws1', 'r1', {
      proposal,
      proposalHash: 'b'.repeat(64),
      proposalRevision: 2,
      expectedProposalRevision: 1,
    });

    expect(run.status).toBe('needs_review');
    expect(rpc).toHaveBeenCalledWith('review_skill_run_proposal', {
      p_workspace_id: 'ws1',
      p_skill_run_id: 'r1',
      p_expected_revision: 1,
      p_proposal: proposal,
      p_proposal_hash: 'b'.repeat(64),
    });
    expect(builder.update).not.toHaveBeenCalled();
  });

  it('listCampaignPlanRevisionsForProject filtra por workspace_id + project_id, sem exigir campaignId (AC5)', async () => {
    const campaignPlanRow = {
      id: 'cp1',
      workspace_id: 'ws1',
      project_id: 'p1',
      campaign_id: 'c1',
      revision: 1,
      schema_version: '1.0.0',
      data: { schemaVersion: '1.0.0', platform: 'meta', objective: 'sales', revision: 1 },
      created_at: '2026-07-09T00:00:00.000Z',
      updated_at: '2026-07-09T00:00:00.000Z',
    };
    const { client, eqCalls } = makeClient({ data: [campaignPlanRow], error: null });
    const repo = createSupabaseProjectRepository(client);

    const plans = await repo.listCampaignPlanRevisionsForProject('ws1', 'p1');

    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ id: 'cp1', projectId: 'p1', campaignId: 'c1' });
    expect(eqCalls).toContainEqual(['workspace_id', 'ws1']);
    expect(eqCalls).toContainEqual(['project_id', 'p1']);
  });

  it('listWeeklyPanelsForProject filtra por workspace_id + project_id, sem exigir campaignId (AC5)', async () => {
    const weeklyPanelRow = {
      id: 'wp1',
      workspace_id: 'ws1',
      project_id: 'p1',
      campaign_id: 'c1',
      week_start: '2026-07-06',
      revision: 1,
      schema_version: '1.0.0',
      status: 'draft',
      data: { schemaVersion: '1.0.0', status: 'draft', metrics: [] },
      created_at: '2026-07-09T00:00:00.000Z',
      updated_at: '2026-07-09T00:00:00.000Z',
    };
    const { client, eqCalls } = makeClient({ data: [weeklyPanelRow], error: null });
    const repo = createSupabaseProjectRepository(client);

    const panels = await repo.listWeeklyPanelsForProject('ws1', 'p1');

    expect(panels).toHaveLength(1);
    expect(panels[0]).toMatchObject({ id: 'wp1', projectId: 'p1', campaignId: 'c1', weekStart: '2026-07-06' });
    expect(eqCalls).toContainEqual(['workspace_id', 'ws1']);
    expect(eqCalls).toContainEqual(['project_id', 'p1']);
  });
});
