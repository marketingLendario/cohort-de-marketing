import { describe, expect, it } from 'vitest';
import { evaluateCampaignReadiness, isSnapshotStale, readinessBlockedErrorFor } from '@/lib/campaign-readiness';
import type { MarketingProject, ProjectArtifact, ProjectBriefRevision } from '@/lib/project-domain';

function project(overrides: Partial<MarketingProject> = {}): MarketingProject {
  return {
    id: 'project-1',
    workspaceId: 'workspace-1',
    slug: 'demo',
    name: 'Projeto Demo',
    status: 'active',
    activeBriefRevisionId: 'brief-1',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    ...overrides,
  };
}

function brief(data: Record<string, unknown>, revision = 1): ProjectBriefRevision {
  return {
    schemaVersion: '1.0.0',
    id: 'brief-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    revision,
    status: 'active',
    createdAt: '2026-07-09T00:00:00.000Z',
    updatedAt: '2026-07-09T00:00:00.000Z',
    data: { schemaVersion: '0.1.0', project: { slug: 'demo' }, ...data },
    fieldSources: {},
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

describe('evaluateCampaignReadiness — campaign.create', () => {
  it('blocks when there is no active project (empty project)', () => {
    const snapshot = evaluateCampaignReadiness('campaign.create', {
      project: null,
      brief: null,
      artifacts: [],
      runs: [],
    });
    expect(snapshot.state).toBe('blocked');
    expect(snapshot.blocking[0]?.code).toBe('PROJECT_NOT_FOUND');
  });

  it('is ready when the project exists with a valid name', () => {
    const snapshot = evaluateCampaignReadiness('campaign.create', {
      project: project(),
      brief: null,
      artifacts: [],
      runs: [],
    });
    expect(snapshot.state).toBe('ready');
  });
});

describe('evaluateCampaignReadiness — skill-backed capabilities', () => {
  it('blocks campaign.tracking without inventing data when the project has no briefing yet (empty project)', () => {
    const snapshot = evaluateCampaignReadiness('campaign.tracking', {
      project: project(),
      brief: null,
      artifacts: [],
      runs: [],
    });
    expect(snapshot.state).toBe('blocked');
    expect(snapshot.blocking[0]?.code).toBe('BRIEF_MISSING');
  });

  it('blocks campaign.tracking for a partial project (missing required field)', () => {
    const snapshot = evaluateCampaignReadiness('campaign.tracking', {
      project: project(),
      brief: brief({}),
      artifacts: [],
      runs: [],
    });
    expect(snapshot.state).toBe('blocked');
    expect(snapshot.blocking.some((entry) => entry.field === 'channels.primaryCtaUrl')).toBe(true);
    // No invented value: the field stays absent, never defaulted.
    expect(snapshot.blocking.every((entry) => entry.code !== 'READY_FALLBACK')).toBe(true);
  });

  it('is ready_with_warnings when only a recommended field is missing (warning project)', () => {
    const snapshot = evaluateCampaignReadiness('campaign.tracking', {
      project: project(),
      brief: brief({ channels: { primaryCtaUrl: 'https://example.com' } }),
      artifacts: [],
      runs: [],
    });
    expect(snapshot.state).toBe('ready_with_warnings');
    expect(snapshot.capability.allowed).toBe(true);
    expect(snapshot.warnings.length).toBeGreaterThan(0);
  });

  it('is ready for campaign.structure once tracking + brief artifacts and fields are all present (ready project)', () => {
    const readyBrief = brief({
      channels: { primaryCtaUrl: 'https://example.com', thankYouPageUrl: 'https://example.com/obrigado' },
      market: { dominantPain: 'Dor real', awarenessLevel: 3, trafficTemperature: 'frio' },
      offer: { exactPrice: 997, proofAssets: ['depoimento'] },
      project: { slug: 'demo', regulatedNiche: 'nao', voice: 'direto' },
    });
    const artifacts = [
      artifact('trafficTrackingAudit'),
      artifact('trafficCreativeBattery'),
      artifact('copy'),
      artifact('funnel'),
    ];
    const snapshot = evaluateCampaignReadiness('campaign.structure', {
      project: project(),
      brief: readyBrief,
      artifacts,
      runs: [],
    });
    expect(snapshot.state).toBe('ready');
    expect(snapshot.blocking).toEqual([]);
  });
});

describe('evaluateCampaignReadiness — fingerprint staleness', () => {
  it('flags a snapshot as stale once the brief revision moves on (fingerprint obsoleto)', () => {
    const context1 = { project: project(), brief: brief({}, 1), artifacts: [], runs: [] };
    const snapshot = evaluateCampaignReadiness('campaign.tracking', context1);

    const context2 = { project: project(), brief: brief({}, 2), artifacts: [], runs: [] };
    const currentSeed = JSON.stringify({
      projectId: context2.project.id,
      briefId: context2.brief.id,
      briefRevision: context2.brief.revision,
      artifactIndex: [],
    });
    // sourceRevision alone already proves staleness without needing the exact seed shape.
    expect(isSnapshotStale(snapshot, { sourceRevision: 2, fingerprintSeed: currentSeed })).toBe(true);
    expect(isSnapshotStale(snapshot, { sourceRevision: snapshot.sourceRevision, fingerprintSeed: 'irrelevant-but-same-revision' })).toBe(true);
  });

  it('computedAt never changes the fingerprint identity (AC2)', () => {
    const context = { project: project(), brief: brief({}), artifacts: [], runs: [] };
    const a = evaluateCampaignReadiness('campaign.create', context);
    const b = evaluateCampaignReadiness('campaign.create', context);
    expect(a.inputFingerprint).toBe(b.inputFingerprint);
  });
});

describe('readinessBlockedErrorFor', () => {
  it('returns null when the capability is not blocked', () => {
    expect(readinessBlockedErrorFor('campaign.create', { project: project(), brief: null, artifacts: [], runs: [] })).toBeNull();
  });

  it('returns a READINESS_BLOCKED error when blocked', () => {
    const error = readinessBlockedErrorFor('campaign.create', { project: null, brief: null, artifacts: [], runs: [] });
    expect(error?.code).toBe('READINESS_BLOCKED');
    expect(error?.target).toBe('campaign.create');
  });
});
