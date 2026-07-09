/**
 * `AdPublisher` — plugable publication interface (arch §7).
 *
 * The publisher is abstracted so the rest of the system never couples to the
 * `meta-ads` CLI directly. Today: {@link MetaCliPublisher} over `services/meta-ads`
 * via `spawnSync`. Future (optional, post-MVP): a `MetaMcpPublisher`. Only the
 * `check` method is implemented in this skeleton (the proof of L1); the create/
 * confirm methods are typed stubs that the publish job type (`ads-publish`,
 * epic 5) fills in (AC6 — L2/L3 and the N-item publish flow come later).
 *
 * STORY-AL-ADS-1.3 (AC1, AC6).
 */
import { metaAdsCheck, type MetaAdsAdapterOptions } from '../orchestration/l1-meta-ads.js'

export interface AuthStatus {
  ok: boolean
  /** Masked account display (e.g. `act_••••3421`) — never the raw token (NFR10). */
  account?: string
  /** Treatable reason when `ok: false`. */
  reason?: string
  capabilityUnavailable?: boolean
}

export interface CampaignParams {
  name: string
  objective: string
  budgetCents: number
  status?: 'PAUSED' | 'ACTIVE'
}

export interface AdsetParams {
  campaignId: string
  pixelId: string
  customEventType?: string
}

export interface CreativeParams {
  imageRef: string
  pageId: string
  body: string
  linkUrl: string
}

export interface AdParams {
  adsetId: string
  creativeId: string
}

export interface PublishSummary {
  campaignId: string
  adsManagerUrl?: string
}

/** The plugable publication contract (arch §7). */
export interface AdPublisher {
  check(spoke: string): Promise<AuthStatus>
  createCampaign(spoke: string, params: CampaignParams): Promise<{ campaignId: string }>
  createAdset(spoke: string, params: AdsetParams): Promise<{ adsetId: string }>
  createCreative(spoke: string, params: CreativeParams): Promise<{ creativeId: string }>
  createAd(spoke: string, params: AdParams): Promise<{ adId: string }>
  confirm(spoke: string, campaignId: string): Promise<PublishSummary>
}

/** Stub error for the create/confirm methods not yet implemented in 1.3. */
class NotImplementedInSkeleton extends Error {
  constructor(method: string) {
    super(
      `MetaCliPublisher.${method} is a skeleton stub — the publish job type ` +
        `(ads-publish, epic 5) implements the N-item create flow (arch §7).`,
    )
    this.name = 'NotImplementedInSkeleton'
  }
}

/**
 * Default publisher over the `meta-ads` CLI. `check` is REAL (delegates to the
 * L1 adapter); the rest are skeleton stubs deferred to epic 5.
 */
export class MetaCliPublisher implements AdPublisher {
  private readonly options: MetaAdsAdapterOptions

  constructor(options: MetaAdsAdapterOptions = {}) {
    this.options = options
  }

  async check(spoke: string): Promise<AuthStatus> {
    const result = metaAdsCheck(spoke, this.options)
    if (result.ok) {
      return { ok: true, account: extractMaskedAccount(result.stdout) }
    }
    return {
      ok: false,
      reason: result.reason,
      capabilityUnavailable: result.capabilityUnavailable,
    }
  }

  async createCampaign(): Promise<{ campaignId: string }> {
    throw new NotImplementedInSkeleton('createCampaign')
  }

  async createAdset(): Promise<{ adsetId: string }> {
    throw new NotImplementedInSkeleton('createAdset')
  }

  async createCreative(): Promise<{ creativeId: string }> {
    throw new NotImplementedInSkeleton('createCreative')
  }

  async createAd(): Promise<{ adId: string }> {
    throw new NotImplementedInSkeleton('createAd')
  }

  async confirm(): Promise<PublishSummary> {
    throw new NotImplementedInSkeleton('confirm')
  }
}

/**
 * Best-effort extraction of the masked account from `--check` stdout
 * (e.g. `act_••••3421`). The adapter already masks; we only surface, never the
 * raw value.
 */
function extractMaskedAccount(stdout: string): string | undefined {
  const match = stdout.match(/act_[•\d*]+/)
  return match?.[0]
}
