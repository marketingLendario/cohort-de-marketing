import { describe, expect, it } from 'vitest';
import {
  campaignRunIdempotencyKey,
  classifyReadinessBlocked,
  classifyRunError,
  classifyStaleReadiness,
  isCampaignReadinessSnapshotStale,
  redactCorrelationId,
} from './campaign-run-errors';
import type { CampaignReadinessSnapshot } from '@/lib/campaign-readiness';

function snapshot(overrides: Partial<CampaignReadinessSnapshot> = {}): CampaignReadinessSnapshot {
  return {
    contractVersion: 'campaign-readiness.v1',
    target: 'campaign.structure',
    state: 'blocked',
    capability: { allowed: false, label: 'Estrutura da campanha', skillId: 'estruturador' },
    blocking: [],
    warnings: [],
    satisfied: [],
    nextAction: null,
    inputFingerprint: 'fingerprint1234567890',
    sourceRevision: 1,
    computedAt: '2026-07-16T12:00:00.000Z',
    ...overrides,
  };
}

describe('redactCorrelationId', () => {
  it('keeps only the first 8 chars, appending an ellipsis (AC2)', () => {
    expect(redactCorrelationId('job-12345678-abcdef')).toBe('job-1234…');
  });

  it('returns the id unchanged when it is already short', () => {
    expect(redactCorrelationId('short')).toBe('short');
  });

  it('returns a placeholder for a missing id', () => {
    expect(redactCorrelationId(null)).toBe('—');
    expect(redactCorrelationId(undefined)).toBe('—');
  });
});

describe('campaignRunIdempotencyKey (AC4)', () => {
  it('is stable per jobId but distinct per attempt', () => {
    const first = campaignRunIdempotencyKey('job-1', 1);
    const second = campaignRunIdempotencyKey('job-1', 2);
    expect(first).not.toBe(second);
    expect(first).toContain('job-1');
    expect(second).toContain('job-1');
  });
});

describe('isCampaignReadinessSnapshotStale (AC4 — retry não reusa snapshot obsoleto)', () => {
  it('is NOT stale when fingerprint and revision are unchanged', () => {
    const started = snapshot({ inputFingerprint: 'abc', sourceRevision: 2 });
    const current = snapshot({ inputFingerprint: 'abc', sourceRevision: 2 });
    expect(isCampaignReadinessSnapshotStale(started, current)).toBe(false);
  });

  it('is stale when the input fingerprint drifted (artifact/briefing changed)', () => {
    const started = snapshot({ inputFingerprint: 'abc', sourceRevision: 2 });
    const current = snapshot({ inputFingerprint: 'def', sourceRevision: 2 });
    expect(isCampaignReadinessSnapshotStale(started, current)).toBe(true);
  });

  it('is stale when the briefing revision advanced', () => {
    const started = snapshot({ inputFingerprint: 'abc', sourceRevision: 2 });
    const current = snapshot({ inputFingerprint: 'abc', sourceRevision: 3 });
    expect(isCampaignReadinessSnapshotStale(started, current)).toBe(true);
  });

  it('never compares computedAt (informative only)', () => {
    const started = snapshot({ inputFingerprint: 'abc', sourceRevision: 2, computedAt: '2026-01-01T00:00:00.000Z' });
    const current = snapshot({ inputFingerprint: 'abc', sourceRevision: 2, computedAt: '2026-12-31T00:00:00.000Z' });
    expect(isCampaignReadinessSnapshotStale(started, current)).toBe(false);
  });
});

describe('classifyReadinessBlocked (AC2)', () => {
  it('classifies READINESS_BLOCKED with the first blocking entry action and a redacted correlation id, never retry-safe', () => {
    const blockedSnapshot = snapshot({
      blocking: [
        { code: 'FIELD_MISSING', label: 'Campo pendente no briefing: offer.name', source: 'briefing', field: 'offer.name', action: { kind: 'briefing', target: 'offer.name' } },
        { code: 'ARTIFACT_MISSING', label: 'Artefato pendente: trafficTrackingAudit', source: 'artifact', action: { kind: 'journey', target: 'trafficTrackingAudit' } },
      ],
    });
    const classified = classifyReadinessBlocked(blockedSnapshot);
    expect(classified.code).toBe('READINESS_BLOCKED');
    expect(classified.message).toContain('offer.name');
    expect(classified.message).toContain('mais 1 pendência');
    expect(classified.action).toEqual({ label: 'Corrigir pendência', kind: 'briefing', target: 'offer.name' });
    expect(classified.correlationId).toBe('fingerpr…');
    expect(classified.retrySafe).toBe(false);
  });

  it('never emits a mute/generic message even with zero blocking entries', () => {
    const classified = classifyReadinessBlocked(snapshot({ blocking: [] }));
    expect(classified.message).toMatch(/bloqueada/i);
  });
});

describe('classifyStaleReadiness (AC2)', () => {
  it('classifies STALE_READINESS, never retry-safe (must re-evaluate, not just retry)', () => {
    const classified = classifyStaleReadiness('campaign.structure', snapshot());
    expect(classified.code).toBe('STALE_READINESS');
    expect(classified.action).toEqual({ label: 'Reavaliar prontidão', kind: 'inline', target: 'campaign.structure' });
    expect(classified.retrySafe).toBe(false);
  });
});

describe('classifyRunError (AC2 — RUN_FAILED / RUN_CANCELLED / RUN_TIMEOUT)', () => {
  it('classifies RUN_CANCELLED and marks it retry-safe', () => {
    const classified = classifyRunError({
      jobId: 'job-abcdef123456',
      attempt: 1,
      status: 'cancelled',
      error: { reason: 'Execução cancelada pelo operador.', capabilityUnavailable: false },
    });
    expect(classified.code).toBe('RUN_CANCELLED');
    expect(classified.message).toContain('cancelada');
    expect(classified.retrySafe).toBe(true);
    expect(classified.correlationId).toBe('job-abcd…');
  });

  it('classifies RUN_TIMEOUT distinctly from RUN_FAILED when error.kind is "timeout"', () => {
    const classified = classifyRunError({
      jobId: 'job-1',
      attempt: 1,
      status: 'failed',
      error: { reason: 'Codex CLI excedeu o limite de 60 segundos.', capabilityUnavailable: false, kind: 'timeout' },
    });
    expect(classified.code).toBe('RUN_TIMEOUT');
    expect(classified.message).toContain('excedeu o tempo limite');
    expect(classified.message).toContain('60 segundos'); // never swallows the runner's reason
    expect(classified.retrySafe).toBe(true);
  });

  it('classifies a plain failure as RUN_FAILED and embeds the runner reason verbatim (never a mute error)', () => {
    const classified = classifyRunError({
      jobId: 'job-1',
      attempt: 2,
      status: 'failed',
      error: { reason: 'backend indisponível', capabilityUnavailable: false, kind: 'runner_error' },
    });
    expect(classified.code).toBe('RUN_FAILED');
    expect(classified.message).toContain('backend indisponível');
    expect(classified.retrySafe).toBe(true);
  });

  it('never crashes and still produces a treatable message when the error payload is null', () => {
    const classified = classifyRunError({ jobId: 'job-1', attempt: 1, status: 'failed', error: null });
    expect(classified.code).toBe('RUN_FAILED');
    expect(classified.message.length).toBeGreaterThan(0);
  });
});
