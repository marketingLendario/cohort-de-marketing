# design-md — Standalone Claude Code Skill

> Built by **Alan Nicolas** ([@oalanicolas](https://github.com/oalanicolas)) — [github.com/oalanicolas](https://github.com/oalanicolas)

Extract a Google-spec [`DESIGN.md`](https://github.com/google-labs-code/design.md) from any public URL using static HTML/CSS analysis. **No headless browser. No Playwright.** Static-only fetch + a single LLM call.

This is a **self-contained Claude Code skill** — drop the folder into any project's `.claude/skills/` directory and it works. Zero external repo dependencies.

## What it does

Given a public URL, the pipeline:

1. Fetches HTML and walks every `<link rel="stylesheet">`, inline `<style>`, and `style=""` attribute
2. Regex-detects colors, type, spacing, radii, shadows, motion, breakpoints, dark-mode, and stack signals
3. Classifies the visual archetype (shadcn-neutral, apple-glass, carbon-enterprise, polaris-friendly, ...)
4. Hands all of the above to `claude -p` (or OpenRouter Haiku) which emits a Google-spec `DESIGN.md`
5. Lints with `@google/design.md@0.1.0`, scores quality A–F, computes drift vs. a local DESIGN.md (optional)
6. Renders a single-file `preview.html` with swatches, typography, fingerprint, and the raw DESIGN.md

Output lives under `outputs/design-md/{slug}/`.

## Install

```bash
# 1. Copy the skill folder into your project
cp -R design-md /path/to/your-project/.claude/skills/

# 2. Install Node deps inside the skill folder (one time)
cd /path/to/your-project/.claude/skills/design-md
npm install

# 3. Make sure you have either `claude` (Claude Code CLI) on PATH,
#    or an OpenRouter API key in OPENROUTER_API_KEY.
```

Requirements:
- Node 18+
- One LLM provider: [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) **or** an OpenRouter API key

## Use

From your project root (any CWD works — outputs go relative to CWD):

```bash
node .claude/skills/design-md/run.cjs --url https://www.anthropic.com/
```

Or in Claude Code, just say:

> Extract a DESIGN.md from https://www.anthropic.com/

The skill auto-activates.

## Examples

```bash
# Static extract (default — claude-cli provider)
node .claude/skills/design-md/run.cjs --url https://stripe.com/

# Cheap CI-friendly extract via OpenRouter Haiku
OPENROUTER_API_KEY=sk-… node .claude/skills/design-md/run.cjs \
  --url https://stripe.com/ \
  --provider openrouter \
  --model anthropic/claude-haiku-4-5

# Drift-check a live URL against your local DESIGN.md
node .claude/skills/design-md/run.cjs \
  --url https://docs.anthropic.com/ \
  --compare apps/web/DESIGN.md

# Custom output dir
node .claude/skills/design-md/run.cjs \
  --url https://linear.app/ \
  --out ./design-extracts/linear

# Force a cold run (no phase reuse from prior extracts)
node .claude/skills/design-md/run.cjs --url https://stripe.com/ --no-reuse
```

## Output layout

```
outputs/design-md/{slug}/
├── DESIGN.md                ← Google-spec design system file
├── tokens.json              ← parsed YAML frontmatter
├── preview.html             ← single-file viewer (swatches + type + raw md)
├── extraction-log.yaml      ← provenance + confidence per token
├── lint-report.json         ← @google/design.md lint results
├── quality-score.json       ← A–F across 7 categories
├── style-fingerprint.json   ← visual archetype classification
├── agent-prompt.txt         ← reusable LLM prompt with extracted tokens
├── telemetry.json           ← run timing, model, cost, reuse trace
├── render-contract.json     ← derived render contract (typography/colors/etc.)
├── inputs/                  ← raw HTML, CSS, detected tokens, prompt
└── history/{ts}/            ← prior runs, archived when superseded
```

## Flags

| Flag | Default | Notes |
|---|---|---|
| `--url <url>` | required | Public http(s) URL |
| `--out <dir>` | `outputs/design-md/{slug}/` | Override output directory |
| `--prompt <file>` | `data/url-extract-prompt.txt` | Custom LLM prompt template |
| `--compare <file>` | — | Local DESIGN.md to drift-check against |
| `--no-content-gate` | off | Skip the content-validation gate |
| `--no-llm-retry` | off | Fail hard on first LLM error (CI mode) |
| `--no-reuse` | off | Force cold run, no reuse from prior extracts |
| `--provider <id>` | auto | `claude-cli` or `openrouter` |
| `--model <id>` | provider default | `claude-cli` → Opus 4.7; `openrouter` → Haiku 4.5 |
| `--max-tokens <n>` | 8192 | OpenRouter only |

## Environment

| Var | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | Required for `--provider openrouter` |
| `DESIGN_MD_OUTPUTS_DIR` | Override outputs root for the helper scripts in `scripts/` |
| `DESIGN_MD_POST_HOOK` | Optional Node script invoked as `node $HOOK $outDir` after each extract. Fire-and-forget. |
| `DESIGN_MD_SKIP_HOOK` | Set to `1` to bypass the post-hook |

## Helper scripts

```bash
# Reorganize legacy timestamped runs into per-company layout
node scripts/organize.cjs --dry-run
node scripts/organize.cjs --apply --skip-junk

# Re-derive tokens.json + tokens-extended.json from existing detections (no LLM)
node scripts/enrich-existing.cjs              # all companies
node scripts/enrich-existing.cjs anthropic    # one only

# Rebuild render-contract.json from existing inputs
node scripts/backfill-render-contract.cjs --dry-run

# Refresh theme defaults by re-fetching live URLs (for imported extracts)
node scripts/refresh-imported-theme.cjs

# Bulk-import the VoltAgent awesome-design-md catalog
node scripts/import-awesome-design-md.cjs
```

All helper scripts honor `DESIGN_MD_OUTPUTS_DIR` if you keep extracts elsewhere.

## Tests

```bash
npm test
```

The lib has full per-module test coverage (`*.test.cjs` next to each source file).

## How it works (1-paragraph version)

The hard part of generating a DESIGN.md isn't the LLM call — it's giving the LLM enough static signal to ground every token. This pipeline does the grounding mechanically: ~30 detection passes against the raw CSS produce `tokens-detected.json`, `css-vars.json`, `font-faces.json`, `stack-summary.json`, `shadows.json`, `motion.json`, `breakpoints.json`, etc. Those go into the prompt as input file paths so the LLM reads structured detection output, not a 2 MB CSS dump. The LLM's job is to *describe* the design system in natural language and project the detected signals onto the 9-section spec — not to invent tokens. The result is a deterministic, citable DESIGN.md with provenance per token.

## Author

**Alan Nicolas** — [@oalanicolas](https://github.com/oalanicolas)

GitHub: [github.com/oalanicolas](https://github.com/oalanicolas)

If this skill saved you time, a star on GitHub or a mention is appreciated.

## License

MIT © Alan Nicolas
