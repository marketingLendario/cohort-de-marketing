import { afterEach, describe, expect, it, vi } from 'vitest';
import { skillCatalog } from '@/generated/skill-catalog';
import type { ProjectArtifact } from '@/lib/project-domain';
import type { SkillProposal } from '@/lib/skill-runtime';
import {
  buildInvalidations,
  decideArtifactApproval,
  makeIdempotencyKey,
  planArtifactApproval,
  resolveApprovalArtifacts,
} from '@/lib/artifact-approval';

const NOW = '2026-07-10T12:00:00.000Z';

function artifact(overrides: Partial<ProjectArtifact>): ProjectArtifact {
  return {
    id: 'a1',
    workspaceId: 'ws-1',
    projectId: 'p-1',
    artifactType: 'offerbook',
    title: 'Offerbook',
    path: 'offerbook.md',
    format: 'markdown',
    state: 'confirmed',
    verification: 'confirmed',
    source: 'skill_run',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

const PROPOSAL: SkillProposal = {
  summary: 'Proposta pronta',
  resultMarkdown: '# Resultado\n\nCorpo.',
  artifacts: [
    { artifactType: 'offerbook', title: 'Offerbook', path: 'offerbook.md', format: 'markdown', content: '# Offerbook' },
  ],
  fields: [],
  questions: [],
  warnings: [],
};

describe('artifact-approval client helpers', () => {
  afterEach(() => vi.restoreAllMocks());

  it('makeIdempotencyKey is stable per (run, hash, decision)', () => {
    expect(makeIdempotencyKey('run-1', 'hash', 'approve')).toBe('run-1:hash:approve');
    expect(makeIdempotencyKey('run-1', 'hash', 'approve')).toBe(makeIdempotencyKey('run-1', 'hash', 'approve'));
    expect(makeIdempotencyKey('run-1', 'hash', 'reject')).not.toBe(makeIdempotencyKey('run-1', 'hash', 'approve'));
  });

  it('resolveApprovalArtifacts uses the proposal artifacts when present', () => {
    const resolved = resolveApprovalArtifacts(PROPOSAL, { artifactType: 'x', title: 'X', path: 'x.md' });
    expect(resolved).toHaveLength(1);
    expect(resolved[0].path).toBe('offerbook.md');
    expect(resolved[0].content).toBe('# Offerbook');
  });

  it('consolida blocos do mesmo arquivo compartilhado no mesmo formato', () => {
    const resolved = resolveApprovalArtifacts(
      {
        ...PROPOSAL,
        artifacts: [
          { artifactType: 'trafficCreativeBattery', title: 'Bateria', path: 'PAINEL-DA-SEMANA.yaml', format: 'yaml', content: 'briefista:\n  bateria_gerada: []' },
          { artifactType: 'trafficCreativeBattery', title: 'Recusa', path: 'PAINEL-DA-SEMANA.yaml', format: 'yaml', content: 'angulo_recusado:\n  motivo: ausente' },
        ],
      },
      { artifactType: 'x', title: 'X', path: 'x.md' },
    );

    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toMatchObject({ path: 'PAINEL-DA-SEMANA.yaml', format: 'yaml', title: 'Bateria + Recusa' });
    expect(resolved[0].content).toContain('briefista:');
    expect(resolved[0].content).toContain('angulo_recusado:');
  });

  it('mantém formatos diferentes como conflito para o backend rejeitar', () => {
    const resolved = resolveApprovalArtifacts(
      {
        ...PROPOSAL,
        artifacts: [
          { artifactType: 'x', title: 'YAML', path: 'painel.yaml', format: 'yaml', content: 'a: 1' },
          { artifactType: 'x', title: 'JSON', path: 'painel.yaml', format: 'json', content: '{"a":1}' },
        ],
      },
      { artifactType: 'x', title: 'X', path: 'x.md' },
    );

    expect(resolved).toHaveLength(2);
  });

  it('resolveApprovalArtifacts assigns a typed generated path when Codex leaves it blank', () => {
    const resolved = resolveApprovalArtifacts(
      {
        ...PROPOSAL,
        artifacts: [{ ...PROPOSAL.artifacts[0], path: '   ', format: 'json' }],
      },
      { artifactType: 'offerbook', title: 'Offerbook', path: 'generated/offerbook/run.md' },
    );
    expect(resolved[0].path).toBe('generated/offerbook/run.json');
    expect(resolved[0].content).toBe('# Offerbook');
  });

  it('resolveApprovalArtifacts falls back to a generated artifact from resultMarkdown', () => {
    const resolved = resolveApprovalArtifacts(
      { ...PROPOSAL, artifacts: [] },
      { artifactType: 'offerbook', title: 'Offerbook', path: 'generated/offerbook/run.md' },
    );
    expect(resolved).toHaveLength(1);
    expect(resolved[0].path).toBe('generated/offerbook/run.md');
    expect(resolved[0].content).toBe(PROPOSAL.resultMarkdown);
  });

  it('resolveApprovalArtifacts returns nothing when there is no content to write', () => {
    const resolved = resolveApprovalArtifacts(
      { ...PROPOSAL, artifacts: [], resultMarkdown: '   ' },
      { artifactType: 'x', title: 'X', path: 'x.md' },
    );
    expect(resolved).toHaveLength(0);
  });

  it('buildInvalidations flags existing artifacts produced downstream of the approved skill', () => {
    // Derive a concrete (upstream skill -> downstream artifact type) pair from the catalog.
    const edge = skillCatalog.edges.find(
      (candidate) =>
        candidate.type === 'dependency' &&
        (skillCatalog.skills.find((skill) => skill.id === candidate.to)?.primaryArtifacts.length ?? 0) > 0,
    );
    expect(edge).toBeDefined();
    const downstreamType = skillCatalog.skills.find((skill) => skill.id === edge!.to)!.primaryArtifacts[0];

    const stale = artifact({ id: 'downstream', artifactType: downstreamType });
    const invalidations = buildInvalidations(edge!.from, [stale]);
    expect(invalidations.map((item) => item.id)).toContain('downstream');
  });

  it('buildInvalidations ignores artifacts that are not downstream', () => {
    const unrelated = artifact({ id: 'unrelated', artifactType: '__no-such-artifact-type__' });
    expect(buildInvalidations('avatar-funil', [unrelated])).toHaveLength(0);
  });

  it('planArtifactApproval posts to the plan endpoint and parses the plan', async () => {
    const plan = { skillRunId: 'run-1', projectSlug: 'demo', proposalHash: 'h', proposalRevision: 1, fresh: true, files: [], warnings: [] };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(plan), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await planArtifactApproval({ skillRunId: 'run-1', artifacts: [] });
    expect(result.proposalHash).toBe('h');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/local/artifact-approvals/plan'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('decideArtifactApproval surfaces the endpoint error message', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ code: 'stale', message: 'proposta editada' }), { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      decideArtifactApproval({
        skillRunId: 'run-1',
        decision: 'approve',
        expectedProposalHash: 'h',
        expectedProposalRevision: 1,
        idempotencyKey: 'k',
        artifacts: [],
      }),
    ).rejects.toThrow('proposta editada');
  });
});
