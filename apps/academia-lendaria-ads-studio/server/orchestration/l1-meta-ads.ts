/**
 * L1 — Deterministic adapter layer.
 *
 * REUSE of `services/meta-ads/` (arch §2.2 L1, §9 IDS REUSE). The worker invokes
 * the adapter as a pass-through subprocess via `spawnSync` with an ARGS ARRAY
 * (never `exec()` with a string — arch §8 "Não-shell-interpolation"). Secrets
 * live only in the adapter's `.env.{spoke}` resolution on the backend/worker,
 * NEVER in the client bundle (NFR10, AC4).
 *
 * This module implements the REAL `--check --spoke=<spoke>` invocation as the
 * proof that L1 works end-to-end (story scope item 2). When the adapter CLI or a
 * spoke's credentials are absent, it returns a TREATABLE unavailability state
 * (NFR9, AC5) — never a mute throw.
 *
 * STORY-AL-ADS-1.3 (AC1, AC4, AC5).
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Resolve the repo-relative `services/meta-ads/index.js` by walking up from this
 * module until a directory containing `services/meta-ads/index.js` is found.
 * This is robust across the source layout (`server/orchestration/`) and the
 * built layout (`dist/server/orchestration/`), which differ in depth — a fixed
 * `../../..` count would break in one of them (portable-paths rule: never
 * hardcode brittle relative depth). Falls back to a best-effort resolve.
 */
function resolveMetaAdsIndex(): string {
  const REL = 'services/meta-ads/index.js'
  let dir = __dirname
  for (let i = 0; i < 12; i++) {
    const candidate = resolve(dir, REL)
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  // Best-effort default (used only for the error message when truly absent).
  return resolve(__dirname, '../../../../', REL)
}

const META_ADS_INDEX = resolveMetaAdsIndex()

/** Outcome of an L1 adapter invocation — always treatable (AC5/NFR9). */
export type L1Result =
  | { ok: true; layer: 'L1'; stdout: string }
  | {
      ok: false
      layer: 'L1'
      /** Treatable reason for the UI. */
      reason: string
      /** `true` → capability indisponível (CLI/creds missing) → degradation. */
      capabilityUnavailable: boolean
    }

export interface MetaAdsAdapterOptions {
  /** Override the adapter path (tests). Defaults to the repo `services/meta-ads`. */
  adapterPath?: string
  /** Injectable spawn (tests). Defaults to `node:child_process.spawnSync`. */
  spawn?: typeof spawnSync
  /** Subprocess timeout in ms. */
  timeoutMs?: number
}

/**
 * Whether the meta-ads adapter is present on disk. When absent, the worker must
 * degrade gracefully rather than crash (AC5/NFR9).
 */
export function isMetaAdsAdapterAvailable(options: MetaAdsAdapterOptions = {}): boolean {
  const adapterPath = options.adapterPath ?? META_ADS_INDEX
  return existsSync(adapterPath)
}

/**
 * Run `node services/meta-ads/index.js --check --spoke=<spoke>` and map the
 * exit code to a treatable {@link L1Result}.
 *
 * - exit 0           → `ok: true`
 * - adapter missing  → `capabilityUnavailable: true` (degradation)
 * - non-zero exit    → `ok: false` with the scrubbed reason (creds/scope issue)
 */
export function metaAdsCheck(
  spoke: string,
  options: MetaAdsAdapterOptions = {},
): L1Result {
  const adapterPath = options.adapterPath ?? META_ADS_INDEX
  const spawn = options.spawn ?? spawnSync
  const timeout = options.timeoutMs ?? 30_000

  if (!existsSync(adapterPath)) {
    return {
      ok: false,
      layer: 'L1',
      reason: `meta-ads adapter not found at ${adapterPath} — capability unavailable`,
      capabilityUnavailable: true,
    }
  }

  // spawnSync with an ARGS ARRAY — no shell interpolation (arch §8).
  const proc = spawn('node', [adapterPath, '--check', `--spoke=${spoke}`], {
    encoding: 'utf-8',
    timeout,
  })

  if (proc.error) {
    // ENOENT on `node`, timeout, etc. — treat as unavailability, not a crash.
    return {
      ok: false,
      layer: 'L1',
      reason: `meta-ads adapter failed to spawn: ${proc.error.message}`,
      capabilityUnavailable: true,
    }
  }

  const stdout = (proc.stdout ?? '').toString()
  const stderr = (proc.stderr ?? '').toString()

  if (proc.status === 0) {
    return { ok: true, layer: 'L1', stdout }
  }

  return {
    ok: false,
    layer: 'L1',
    reason:
      stderr.trim() ||
      stdout.trim() ||
      `meta-ads --check exited with code ${proc.status ?? 'null'} for spoke ${spoke}`,
    // Non-zero exit with a present adapter = creds/scope problem, still treatable
    // and re-runnable when fixed; not a hard "capability missing".
    capabilityUnavailable: proc.status === null,
  }
}

export { META_ADS_INDEX }
