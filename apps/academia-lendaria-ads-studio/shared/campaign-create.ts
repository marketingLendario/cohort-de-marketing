/**
 * Pure interpretation of the `campaign_create_readiness_rpc` payload
 * (STORY-12.W4.2 migration, STORY-12.W4.1 cutover).
 *
 * Environment-agnostic (no `@supabase/*`, `@/generated/*`, DOM or `node:*`
 * imports) so it is consumable both by the browser (`src/lib/use-create-campaign.ts`,
 * calling the RPC directly as `authenticated` — the same client-bypass surface
 * AC3 of STORY-12.W4.2 enforces) and by the backend repo
 * (`server/lib/campaign-create-repo.ts`, calling the RPC as `service_role`).
 *
 * Reuse, not duplication (Dev Notes precedent set by `campaign-readiness.ts`):
 * before this module existed, `server/lib/campaign-create-repo.ts` was the
 * ONLY place that knew how to interpret the RPC's `{ok, code, campaign|message}`
 * jsonb shape. STORY-12.W4.1 needs the SAME interpretation in the browser (to
 * close the client-side insert side door — see Dev Notes of that story) without
 * re-typing/re-deriving the mapping a second time, which would risk the two
 * call sites silently drifting apart on error-code handling.
 */

export type CampaignCreateSuccessCode = 'CREATED' | 'IDEMPOTENT_REPLAY';

/**
 * `READINESS_BLOCKED` / `STALE_READINESS` / `CAMPAIGN_CREATE_CONFLICT` are the
 * sanitized codes the RPC itself returns. `UNAUTHORIZED` is synthesized by the
 * caller when the RPC raises the RLS/workspace-membership rejection (Postgres
 * `42501`) — the database layer signals that as a thrown error, not a result
 * payload.
 */
export type CampaignCreateErrorCode =
  | 'READINESS_BLOCKED'
  | 'STALE_READINESS'
  | 'CAMPAIGN_CREATE_CONFLICT'
  | 'UNAUTHORIZED';

/** Postgres `insufficient_privilege` — the RLS/workspace-membership rejection. */
export const CAMPAIGN_CREATE_INSUFFICIENT_PRIVILEGE = '42501';

export interface CampaignCreateDraft {
  id: string;
  workspaceId: string;
  projectId: string | null;
  name: string;
  status: string;
  stepCurrent: number;
  createdAt: string;
}

export interface CampaignCreateSuccess {
  ok: true;
  code: CampaignCreateSuccessCode;
  campaign: CampaignCreateDraft;
}

export interface CampaignCreateFailure {
  ok: false;
  code: CampaignCreateErrorCode;
  /** Sanitized, operator-safe message — never a path, token or private content. */
  message: string;
}

export type CampaignCreateResult = CampaignCreateSuccess | CampaignCreateFailure;

export interface CampaignCreateRpcInput {
  workspaceId: string;
  projectId: string | null;
  name: string;
  idempotencyKey: string;
  expectedProjectName?: string | null;
}

/** Snake-case argument shape `campaign_create_readiness_rpc` expects. */
export interface CampaignCreateRpcParams {
  p_workspace_id: string;
  p_project_id: string | null;
  p_name: string;
  p_idempotency_key: string;
  p_expected_project_name: string | null;
}

export function buildCampaignCreateRpcParams(input: CampaignCreateRpcInput): CampaignCreateRpcParams {
  return {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_name: input.name,
    p_idempotency_key: input.idempotencyKey,
    p_expected_project_name: input.expectedProjectName ?? null,
  };
}

interface RpcCampaignRow {
  id: string;
  workspaceId: string;
  projectId: string | null;
  name: string;
  status: string;
  stepCurrent: number;
  createdAt: string;
}

interface RpcSuccessPayload {
  ok: true;
  code: CampaignCreateSuccessCode;
  campaign: RpcCampaignRow;
}

interface RpcFailurePayload {
  ok: false;
  code: 'READINESS_BLOCKED' | 'STALE_READINESS' | 'CAMPAIGN_CREATE_CONFLICT';
  message: string;
  blockingCode?: string;
}

type RpcPayload = RpcSuccessPayload | RpcFailurePayload;

export function isCampaignCreateRpcPayload(value: unknown): value is RpcPayload {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).ok === 'boolean' &&
    typeof (value as Record<string, unknown>).code === 'string'
  );
}

/** Postgres-shaped error as returned by `supabase-js` (`{ code, message }`). */
export interface CampaignCreateRpcError {
  code?: string;
  message: string;
}

/**
 * Maps a raw `{ data, error }` RPC response to the typed `CampaignCreateResult`.
 * Throws (does not return a result) for genuine infrastructure failures — an
 * unrecognized DB error or a malformed payload — mirroring `campaign-create-repo.ts`'s
 * original behaviour: those are not domain rejections a caller should render
 * inline, they are bugs/outages a caller should log and surface generically.
 */
export function mapCampaignCreateRpcResponse(
  data: unknown,
  error: CampaignCreateRpcError | null | undefined,
): CampaignCreateResult {
  if (error) {
    if (error.code === CAMPAIGN_CREATE_INSUFFICIENT_PRIVILEGE) {
      return {
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Sem permissão para criar campanha neste workspace.',
      };
    }
    throw new Error(`[campaign-create] rpc failed: ${error.message}`);
  }

  if (!isCampaignCreateRpcPayload(data)) {
    throw new Error('[campaign-create] rpc returned an unexpected payload');
  }

  if (data.ok) {
    return { ok: true, code: data.code, campaign: data.campaign };
  }
  return { ok: false, code: data.code, message: data.message };
}
