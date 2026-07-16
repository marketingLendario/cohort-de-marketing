import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  assertAcyclicSkillGraph,
  CAMPAIGN_READINESS_CAPABILITIES,
  computeCampaignReadiness,
  isSnapshotStale,
  stableHash,
  toReadinessBlockedError,
  type CapabilitySkillInput,
} from './campaign-readiness';

const here = dirname(fileURLToPath(import.meta.url));
// shared/ -> academia-lendaria-ads-studio/ -> apps/ -> repo root -> data/...
const canonicalPath = join(here, '..', '..', '..', 'data', 'campaign-readiness-capabilities.json');

function ready(skillId: string, overrides: Partial<CapabilitySkillInput> = {}): CapabilitySkillInput {
  return {
    skillId,
    readiness: 'ready',
    missingFields: [],
    missingArtifacts: [],
    missingAlternatives: [],
    recommendedMissing: [],
    ...overrides,
  };
}

describe('campaign-readiness-capabilities.json drift', () => {
  it('matches the embedded versioned copy exactly (no invented capability)', () => {
    const canonical = JSON.parse(readFileSync(canonicalPath, 'utf8')) as {
      capabilities: Record<string, { label: string; kind: string; skillId?: string }>;
    };
    expect(canonical.capabilities).toEqual(CAMPAIGN_READINESS_CAPABILITIES);
  });
});

describe('assertAcyclicSkillGraph', () => {
  it('accepts the real traffic dependency chain (create -> tracking/brief -> structure -> measure -> diagnose)', () => {
    const skillIds = ['zelador', 'briefista', 'estruturador', 'leitor-de-metricas', 'diagnosticador'];
    const edges = [
      { from: 'zelador', to: 'estruturador', type: 'dependency' },
      { from: 'briefista', to: 'estruturador', type: 'dependency' },
      { from: 'estruturador', to: 'leitor-de-metricas', type: 'dependency' },
      { from: 'leitor-de-metricas', to: 'diagnosticador', type: 'dependency' },
    ];
    expect(() => assertAcyclicSkillGraph(skillIds, edges)).not.toThrow();
  });

  it('throws on a synthetic cycle (AC1 — mapeamento declarativo sem ciclo)', () => {
    const skillIds = ['a', 'b', 'c'];
    const edges = [
      { from: 'a', to: 'b', type: 'dependency' },
      { from: 'b', to: 'c', type: 'dependency' },
      { from: 'c', to: 'a', type: 'dependency' },
    ];
    expect(() => assertAcyclicSkillGraph(skillIds, edges)).toThrow(/ciclo/);
  });
});

describe('computeCampaignReadiness — campaign.create (structural)', () => {
  it('blocks when there is no active project', () => {
    const snapshot = computeCampaignReadiness({
      target: 'campaign.create',
      skillEvaluations: [],
      project: { exists: false, name: null },
      sourceRevision: null,
      fingerprintSeed: 'seed-1',
    });
    expect(snapshot.state).toBe('blocked');
    expect(snapshot.capability.allowed).toBe(false);
    expect(snapshot.blocking[0]?.code).toBe('PROJECT_NOT_FOUND');
  });

  it('blocks when the project has no valid name', () => {
    const snapshot = computeCampaignReadiness({
      target: 'campaign.create',
      skillEvaluations: [],
      project: { exists: true, name: '   ' },
      sourceRevision: 1,
      fingerprintSeed: 'seed-2',
    });
    expect(snapshot.state).toBe('blocked');
    expect(snapshot.blocking[0]?.code).toBe('PROJECT_NAME_INVALID');
  });

  it('is ready when project exists with a valid name', () => {
    const snapshot = computeCampaignReadiness({
      target: 'campaign.create',
      skillEvaluations: [],
      project: { exists: true, name: 'Projeto Demo' },
      sourceRevision: 1,
      fingerprintSeed: 'seed-3',
    });
    expect(snapshot.state).toBe('ready');
    expect(snapshot.capability.allowed).toBe(true);
    expect(snapshot.satisfied[0]?.code).toBe('PROJECT_ACTIVE');
  });
});

describe('computeCampaignReadiness — skill-backed capabilities', () => {
  it('surfaces missing fields/artifacts as blocking entries without inventing data (empty project)', () => {
    const snapshot = computeCampaignReadiness({
      target: 'campaign.tracking',
      skillEvaluations: [
        ready('zelador', {
          readiness: 'locked',
          missingFields: ['channels.primaryCtaUrl'],
          missingArtifacts: [],
        }),
      ],
      project: { exists: true, name: 'Projeto Demo' },
      sourceRevision: 1,
      fingerprintSeed: 'seed-4',
    });
    expect(snapshot.state).toBe('blocked');
    expect(snapshot.blocking).toEqual([
      {
        code: 'FIELD_MISSING',
        label: 'Campo pendente no briefing: channels.primaryCtaUrl',
        source: 'briefing',
        field: 'channels.primaryCtaUrl',
        action: { kind: 'briefing', target: 'channels.primaryCtaUrl' },
      },
    ]);
    expect(snapshot.nextAction).toEqual({
      label: 'Campo pendente no briefing: channels.primaryCtaUrl',
      target: 'channels.primaryCtaUrl',
    });
  });

  it('is ready_with_warnings when only recommended items are missing (partial project)', () => {
    const snapshot = computeCampaignReadiness({
      target: 'campaign.tracking',
      skillEvaluations: [ready('zelador', { readiness: 'recommended', recommendedMissing: ['project.regulatedNiche'] })],
      project: { exists: true, name: 'Projeto Demo' },
      sourceRevision: 2,
      fingerprintSeed: 'seed-5',
    });
    expect(snapshot.state).toBe('ready_with_warnings');
    expect(snapshot.capability.allowed).toBe(true);
    expect(snapshot.warnings).toHaveLength(1);
    expect(snapshot.nextAction).toEqual({ label: 'Rodar zelador', target: 'zelador' });
  });

  it('is ready with no blocking/warnings for a fully-ready project', () => {
    const snapshot = computeCampaignReadiness({
      target: 'campaign.structure',
      skillEvaluations: [ready('estruturador')],
      project: { exists: true, name: 'Projeto Demo' },
      sourceRevision: 3,
      fingerprintSeed: 'seed-6',
    });
    expect(snapshot.state).toBe('ready');
    expect(snapshot.blocking).toEqual([]);
    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.nextAction).toBeNull();
  });

  it('treats not_applicable as ready without blocking (a skill that does not apply is not a gate)', () => {
    const snapshot = computeCampaignReadiness({
      target: 'campaign.diagnose',
      skillEvaluations: [ready('diagnosticador', { readiness: 'not_applicable' })],
      project: { exists: true, name: 'Projeto Demo' },
      sourceRevision: 1,
      fingerprintSeed: 'seed-7',
    });
    expect(snapshot.state).toBe('ready');
    expect(snapshot.satisfied[0]?.code).toBe('NOT_APPLICABLE');
  });

  it('throws when the mapped skillId has no matching evaluation (config drift, not a user-facing block)', () => {
    expect(() =>
      computeCampaignReadiness({
        target: 'campaign.brief',
        skillEvaluations: [],
        project: { exists: true, name: 'Projeto Demo' },
        sourceRevision: 1,
        fingerprintSeed: 'seed-8',
      }),
    ).toThrow(/briefista/);
  });
});

describe('fingerprint (AC2)', () => {
  it('is stable for the same seed and changes when the seed changes', () => {
    const base = {
      target: 'campaign.create' as const,
      skillEvaluations: [],
      project: { exists: true, name: 'Projeto Demo' },
      sourceRevision: 1,
    };
    const a = computeCampaignReadiness({ ...base, fingerprintSeed: 'same-seed', now: '2026-07-01T00:00:00.000Z' });
    const b = computeCampaignReadiness({ ...base, fingerprintSeed: 'same-seed', now: '2026-07-02T00:00:00.000Z' });
    const c = computeCampaignReadiness({ ...base, fingerprintSeed: 'different-seed', now: '2026-07-01T00:00:00.000Z' });
    // computedAt varies but never changes the fingerprint identity (AC2).
    expect(a.inputFingerprint).toBe(b.inputFingerprint);
    expect(a.inputFingerprint).not.toBe(c.inputFingerprint);
    expect(a.computedAt).not.toBe(b.computedAt);
  });

  it('stableHash is deterministic for equal strings', () => {
    expect(stableHash('abc')).toBe(stableHash('abc'));
    expect(stableHash('abc')).not.toBe(stableHash('abd'));
  });
});

describe('staleness (ADR-002 — sourceRevision detects an obsolete snapshot)', () => {
  it('flags a snapshot as stale when the brief revision moved on', () => {
    const snapshot = computeCampaignReadiness({
      target: 'campaign.create',
      skillEvaluations: [],
      project: { exists: true, name: 'Projeto Demo' },
      sourceRevision: 1,
      fingerprintSeed: 'seed-9',
    });
    expect(isSnapshotStale(snapshot, { sourceRevision: 1, fingerprintSeed: 'seed-9' })).toBe(false);
    expect(isSnapshotStale(snapshot, { sourceRevision: 2, fingerprintSeed: 'seed-9' })).toBe(true);
    expect(isSnapshotStale(snapshot, { sourceRevision: 1, fingerprintSeed: 'seed-9-changed' })).toBe(true);
  });
});

describe('toReadinessBlockedError', () => {
  it('builds a serializable error with no absolute paths or secrets', () => {
    const snapshot = computeCampaignReadiness({
      target: 'campaign.create',
      skillEvaluations: [],
      project: { exists: false, name: null },
      sourceRevision: null,
      fingerprintSeed: 'seed-10',
    });
    const error = toReadinessBlockedError(snapshot);
    expect(error.code).toBe('READINESS_BLOCKED');
    expect(error.target).toBe('campaign.create');
    expect(JSON.stringify(error)).not.toMatch(/\/Users\/|\/home\//);
  });
});
