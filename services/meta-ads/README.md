# services/meta-ads — Meta Ads CLI Adapter

L4 Service adapter that wraps the official **Meta Ads CLI** (`meta-ads` v1.0.1, Python) with multi-spoke awareness, secret masking, and a Node.js entry-point aligned with other Sinkra services.

> Story: [STORY-152.2](../../docs/stories/epic-152/STORY-152.2-SERVICES-META-ADS-ADAPTER.md)
> Epic: [EPIC-152 — Meta Ads CLI Integration](../../docs/stories/epic-152/EPIC-152-META-ADS-CLI-INTEGRATION.md)

## Why a wrapper?

The Meta Ads CLI is excellent but assumes a single set of credentials per process via `ACCESS_TOKEN`, `AD_ACCOUNT_ID`, `BUSINESS_ID`. In Sinkra Hub each business (spoke) has its own Meta credentials. This wrapper:

1. Resolves credentials per spoke from `~/Downloads/apps/.env.{spoke}`
2. Maps `{SPOKE}_META_ACCESS_TOKEN` → `ACCESS_TOKEN` the CLI expects
3. Auto-prefixes `act_` on `AD_ACCOUNT_ID`
4. Scrubs the token from any output (defense-in-depth, even if the CLI ever echoes it)
5. Exposes the same UX pattern as `services/clickup/`, `services/etl/` (Node entry point)

## Prerequisites

- **Meta Ads CLI installed**: `pip install meta-ads` (Python ≥3.12)
  - Verify with `meta --version` → expect `meta, version 1.0.1+`
- **Node.js ≥18** (for this wrapper)
- **Per-spoke `.env` file** at `~/Downloads/apps/.env.{spoke}` with vars per `.env.example`

## Usage

### List available spokes

```bash
node services/meta-ads/index.js --list-spokes
```

Output:

```
Available spokes (with .env.{slug} present):
  ✓ natalia-tanaka
  · aiox  (no env file)
  ...
```

### Validate a spoke (auth status)

```bash
node services/meta-ads/index.js --check --spoke=natalia-tanaka
```

Output (token masked):

```
Spoke: natalia-tanaka
Source: /Users/rafaelcosta/Downloads/apps/.env.natalia-tanaka

Resolved CLI env (masked):
  ACCESS_TOKEN=EAAVHy***(len=202)
  AD_ACCOUNT_ID=act_***(len=19)
  BUSINESS_ID=762257***(len=15)

Invoking 'meta auth status' for live validation...
Authenticated (token: [REDACTED])

OK — spoke 'natalia-tanaka' is ready.
```

### Pass-through any meta CLI command

```bash
node services/meta-ads/index.js --spoke=natalia-tanaka ads campaign list
node services/meta-ads/index.js --spoke=natalia-tanaka ads adset list
node services/meta-ads/index.js --spoke=natalia-tanaka ads insights get --date-preset last_7d
```

### Daily insights pull (helper)

```bash
node services/meta-ads/insights-runner.js --spoke=natalia-tanaka
# Defaults: --date-preset=last_30d
# Writes outputs/aiox-ads/natalia-tanaka/{insights,campaigns,pages}-YYYY-MM-DD.json
```

## Adding a new spoke

Zero code changes needed. Pure config:

1. Onboard the spoke per `docs/migration/META-ADS-SPOKE-ONBOARDING-PLAYBOOK.md` (System User token, asset assignment, scope grants).
2. Create `~/Downloads/apps/.env.{slug}` with vars under prefix `{SLUG_UPPER}_META_*` (see `.env.example`).
3. Add `{slug}` to `SUPPORTED_SPOKES` array in `spoke-resolver.js` if not already there.
4. Sync to VPS per `.claude/rules/env-parity.md`.

## Security

- **Tokens are never committed.** `.env.{spoke}` files live in `~/Downloads/apps/` (gitignored).
- **`scrubSecrets()` runs on all CLI output** before forwarding. Even if the upstream CLI accidentally echoes a token in stderr/stdout, it gets replaced with `[REDACTED]` before reaching the terminal.
- **`maskSecret()` for the `--check` display** shows only the first 6 chars + length. Adequate for confirming the right token loaded without exposing the whole value.
- **No shell interpolation.** `child_process.spawnSync` with array of args, never `exec()` with a string.

## Caveats

- **`meta-ads` is alpha** (`Development Status :: 3 - Alpha` per PyPI metadata). API may change. Pin version in CI.
- **Read/check/pass-through commands fail closed** after `META_ADS_TIMEOUT_MS` (default: 30s).
- **`--output json` doesn't work uniformly across all subcommands.** `insights-runner.js` parses what it can and falls back to raw text in a `raw_table` field.
- **Token echo in `meta auth status`** may include a token fragment. The wrapper scrubs full and partial echoes before forwarding.

## Files

| File | Purpose |
|------|---------|
| `index.js` | Main entry. Parses flags, dispatches to check / list / passthrough. |
| `spoke-resolver.js` | Reads `.env.{spoke}`, maps to CLI env vars, masks secrets. |
| `insights-runner.js` | Daily pull helper. Writes JSON snapshots to `outputs/aiox-ads/{spoke}/`. |
| `.env.example` | Documents what each spoke's `.env.{slug}` should contain. |
| `package.json` | Service metadata (`@sinkra/meta-ads`, private). |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Failed to invoke 'meta'` | CLI not installed | `pip install meta-ads` |
| `MISSING required vars` | `.env.{slug}` incomplete | Compare to `.env.example`, fill missing vars |
| `Authenticated` but `campaign list` returns nothing | Token lacks `ads_read` or `ads_management` scope | Regenerate System User token with full scope set |
| Wrapper hangs on `--check` | Network issue calling Graph API | Test with `curl https://graph.facebook.com/v25.0/me?access_token=$TOKEN` |
| `Unknown spoke 'foo'` | Slug not in `SUPPORTED_SPOKES` | Add to array in `spoke-resolver.js` |

## Related

- `services/service-catalog.yaml` — registry entry `meta-ads`
- `squads/aiox-ads/` — strategist squad that consumes this adapter
- `outputs/aiox-ads/{spoke}/` — generated insights snapshots
- `docs/decisions/2026-04-30-aiox-meta-bm-strategy.md` — BM strategy decision
- `.claude/rules/env-parity.md` — VPS↔local sync policy
