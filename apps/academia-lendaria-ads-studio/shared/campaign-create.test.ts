import { describe, expect, it } from 'vitest';
import {
  buildCampaignCreateRpcParams,
  isCampaignCreateRpcPayload,
  mapCampaignCreateRpcResponse,
} from './campaign-create.js';

const CAMPAIGN_ROW = {
  id: 'campaign-1',
  workspaceId: 'ws-1',
  projectId: 'project-1',
  name: 'Nova Campanha',
  status: 'draft',
  stepCurrent: 1,
  createdAt: '2026-07-16T12:00:00.000Z',
};

describe('buildCampaignCreateRpcParams', () => {
  it('maps camelCase input to the snake_case RPC param shape, defaulting expectedProjectName to null', () => {
    expect(
      buildCampaignCreateRpcParams({
        workspaceId: 'ws-1',
        projectId: 'project-1',
        name: 'Nova Campanha',
        idempotencyKey: 'idem-1',
      }),
    ).toEqual({
      p_workspace_id: 'ws-1',
      p_project_id: 'project-1',
      p_name: 'Nova Campanha',
      p_idempotency_key: 'idem-1',
      p_expected_project_name: null,
    });
  });

  it('forwards an explicit expectedProjectName', () => {
    expect(
      buildCampaignCreateRpcParams({
        workspaceId: 'ws-1',
        projectId: 'project-1',
        name: 'Nova Campanha',
        idempotencyKey: 'idem-1',
        expectedProjectName: 'Old Name',
      }),
    ).toMatchObject({ p_expected_project_name: 'Old Name' });
  });

  it('passes through a null projectId (no project selected — structural block expected server-side)', () => {
    expect(
      buildCampaignCreateRpcParams({
        workspaceId: 'ws-1',
        projectId: null,
        name: 'Nova Campanha',
        idempotencyKey: 'idem-1',
      }),
    ).toMatchObject({ p_project_id: null });
  });
});

describe('isCampaignCreateRpcPayload', () => {
  it('accepts a well-formed success payload', () => {
    expect(isCampaignCreateRpcPayload({ ok: true, code: 'CREATED', campaign: CAMPAIGN_ROW })).toBe(true);
  });

  it('accepts a well-formed failure payload', () => {
    expect(isCampaignCreateRpcPayload({ ok: false, code: 'READINESS_BLOCKED', message: 'x' })).toBe(true);
  });

  it('rejects null/undefined/non-object/missing fields', () => {
    expect(isCampaignCreateRpcPayload(null)).toBe(false);
    expect(isCampaignCreateRpcPayload(undefined)).toBe(false);
    expect(isCampaignCreateRpcPayload('string')).toBe(false);
    expect(isCampaignCreateRpcPayload({ ok: true })).toBe(false);
    expect(isCampaignCreateRpcPayload({ code: 'CREATED' })).toBe(false);
  });
});

describe('mapCampaignCreateRpcResponse', () => {
  it('maps a CREATED payload to an ok success result', () => {
    expect(mapCampaignCreateRpcResponse({ ok: true, code: 'CREATED', campaign: CAMPAIGN_ROW }, null)).toEqual({
      ok: true,
      code: 'CREATED',
      campaign: CAMPAIGN_ROW,
    });
  });

  it('maps an IDEMPOTENT_REPLAY payload — the same draft, no second row', () => {
    expect(mapCampaignCreateRpcResponse({ ok: true, code: 'IDEMPOTENT_REPLAY', campaign: CAMPAIGN_ROW }, null)).toEqual({
      ok: true,
      code: 'IDEMPOTENT_REPLAY',
      campaign: CAMPAIGN_ROW,
    });
  });

  it('maps a READINESS_BLOCKED payload to a sanitized failure', () => {
    expect(
      mapCampaignCreateRpcResponse(
        { ok: false, code: 'READINESS_BLOCKED', message: 'Criar campanha: bloqueado por 1 pendência(s).', blockingCode: 'PROJECT_NOT_FOUND' },
        null,
      ),
    ).toEqual({ ok: false, code: 'READINESS_BLOCKED', message: 'Criar campanha: bloqueado por 1 pendência(s).' });
  });

  it('maps a STALE_READINESS payload to a sanitized failure', () => {
    expect(
      mapCampaignCreateRpcResponse(
        { ok: false, code: 'STALE_READINESS', message: 'O snapshot de prontidão ficou obsoleto — releia antes de executar.' },
        null,
      ),
    ).toEqual({ ok: false, code: 'STALE_READINESS', message: 'O snapshot de prontidão ficou obsoleto — releia antes de executar.' });
  });

  it('maps a CAMPAIGN_CREATE_CONFLICT payload to a sanitized failure', () => {
    expect(
      mapCampaignCreateRpcResponse(
        { ok: false, code: 'CAMPAIGN_CREATE_CONFLICT', message: 'Uma campanha com esta chave de idempotência já existe.' },
        null,
      ),
    ).toEqual({ ok: false, code: 'CAMPAIGN_CREATE_CONFLICT', message: 'Uma campanha com esta chave de idempotência já existe.' });
  });

  it('maps a 42501 RLS/authorization error to UNAUTHORIZED without leaking the raw DB message', () => {
    const result = mapCampaignCreateRpcResponse(null, { code: '42501', message: 'workspace membership required to create a campaign' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('UNAUTHORIZED');
      expect(result.message).not.toContain('workspace membership required');
    }
  });

  it('throws on any other DB error (infrastructure failure, not a domain rejection)', () => {
    expect(() => mapCampaignCreateRpcResponse(null, { code: '08006', message: 'connection failure' })).toThrow(/rpc failed/);
  });

  it('throws when the payload is an unexpected shape', () => {
    expect(() => mapCampaignCreateRpcResponse({ unexpected: true }, null)).toThrow(/unexpected payload/);
  });

  it('throws when data is null with no error', () => {
    expect(() => mapCampaignCreateRpcResponse(null, null)).toThrow(/unexpected payload/);
  });
});
