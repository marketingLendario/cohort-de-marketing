import { describe, expect, it } from 'vitest';
import { evaluateProjectSkills, evaluateSkill, isProvided, nextProjectAction, topologicalSkillIds } from '@/lib/readiness';
import type { ProjectArtifact, ProjectBriefRevision, SkillRun } from '@/lib/project-domain';

function brief(data: Record<string, unknown>, fieldSources: ProjectBriefRevision['fieldSources'] = {}): ProjectBriefRevision {
  return {
    schemaVersion: '1.0.0',
    id: 'brief-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    revision: 1,
    status: 'active',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    data: { schemaVersion: '0.1.0', project: {}, ...data },
    fieldSources,
  };
}

function artifact(artifactType: string, overrides: Partial<ProjectArtifact> = {}): ProjectArtifact {
  return {
    id: `artifact-${artifactType}`,
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    artifactType,
    title: artifactType,
    path: `${artifactType}.md`,
    format: 'markdown',
    state: 'confirmed',
    verification: 'confirmed',
    source: 'filesystem',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    ...overrides,
  };
}

describe('readiness semantics', () => {
  it('treats explicit zero and false as provided values', () => {
    const revision = brief({ project: { slug: 'demo', approved: false }, data: { purchases: 0 } });
    expect(isProvided(revision, 'project.approved')).toBe(true);
    expect(isProvided(revision, 'data.purchases')).toBe(true);
  });

  it('does not treat missing values as explicit false', () => {
    const revision = brief({ project: { slug: 'demo' } });
    expect(isProvided(revision, 'project.approved')).toBe(false);
  });

  it('accepts an explicit not-applicable field without inventing a value', () => {
    const revision = brief(
      { project: { slug: 'demo' } },
      {
        'offer.backendOffer': {
          source: 'user',
          confirmation: 'not_applicable',
          updatedAt: '2026-07-09T00:00:00.000Z',
        },
      },
    );
    expect(isProvided(revision, 'offer.backendOffer')).toBe(true);
  });

  it('ignores example and unverified artifacts', () => {
    const revision = brief({ project: { slug: 'demo' } });
    const evaluation = evaluateSkill('status-funil', revision, [
      artifact('offerbook', { state: 'example' }),
      artifact('funnel', { verification: 'pending' }),
    ], []);
    expect(evaluation.lifecycle).toBe('idle');
  });

  it('marks a skill done only with a confirmed real primary artifact', () => {
    const revision = brief({ project: { slug: 'demo' } });
    const evaluation = evaluateSkill('offerbook', revision, [artifact('offerbook')], []);
    expect(evaluation.lifecycle).toBe('done');
    expect(evaluation.action).toBe('open_result');
  });

  it('prioritizes human review over another ready skill', () => {
    const revision = brief({ project: { slug: 'demo' }, market: { niche: 'marketing' } });
    const runs: SkillRun[] = [{
      id: 'run-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      skillId: 'avatar-funil',
      status: 'needs_review',
      skillHash: 'hash',
      inputSnapshot: {},
      createdAt: '2026-07-09T00:00:00.000Z',
      updatedAt: '2026-07-09T00:00:00.000Z',
    }];
    const next = nextProjectAction(evaluateProjectSkills(revision, [], runs));
    expect(next?.skillId).toBe('avatar-funil');
    expect(next?.action).toBe('review');
  });

  it('keeps the traffic dependency order in the graph', () => {
    const ids = topologicalSkillIds();
    expect(ids.indexOf('zelador')).toBeLessThan(ids.indexOf('briefista'));
    expect(ids.indexOf('briefista')).toBeLessThan(ids.indexOf('estruturador'));
    expect(ids.indexOf('estruturador')).toBeLessThan(ids.indexOf('leitor-de-metricas'));
    expect(ids.indexOf('leitor-de-metricas')).toBeLessThan(ids.indexOf('diagnosticador'));
  });
});
