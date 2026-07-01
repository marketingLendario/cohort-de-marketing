---
name: design-md
description: 'Extracts Google-spec DESIGN.md from any URL via static HTML/CSS analysis (no headless browser). Outputs tokens.json, preview.html, lint report, optional drift vs local DESIGN.md.'
version: 1.0.0
---

# /design-md — URL → DESIGN.md Pipeline

> Built by **Alan Nicolas** ([@oalanicolas](https://github.com/oalanicolas)) — [github.com/oalanicolas](https://github.com/oalanicolas)

Extract a Google-spec [`DESIGN.md`](https://github.com/google-labs-code/design.md) from any public URL using static analysis only — **no headless browser, no Playwright, no Hyperbrowser**. The cognition layer is `claude -p` (default) or OpenRouter Haiku.

> **Standalone skill.** Self-contained — copy the `design-md/` folder into any Claude Code project's `.claude/skills/` and run `npm install` inside it. No host-repo coupling.

## Onde salvar e ler — convenção de projeto

Todo o trabalho de um nicho fica em **`projetos/{slug}/`** (um slug por nicho). Um projeto = uma pasta, com todas as peças do funil dentro. Nada solto na raiz.

**Como descobrir o projeto ativo:**
1. Se o usuário passou o slug/nicho no comando, use-o.
2. Senão, `ls projetos/ 2>/dev/null`: **uma** pasta → use-a; **várias** → pergunte qual; **nenhuma** → o funil ainda não começou (rode `/offerbook` primeiro).

**Nomes dentro da pasta** (sem repetir o slug): `avatar.md`, `offerbook.md`, `copy.md`, `funil.md`, `DESIGN.md`, `recuperacao.md`, `cro.md`; subpastas `pagina/`, `emails/`, `conteudo/`, `carrossel/`, `mockups/`. Nos 3 formatos (md/html/pdf) onde a skill gera.

> **Nota (convenção de projeto):** esta skill tem pipeline próprio e gera em `outputs/design-md/{slug-da-url}/`. Ao terminar, **copie o `DESIGN.md` gerado para `projetos/{slug}/DESIGN.md`** — é de lá que as skills seguintes (página, e-mails, conteúdo) leem a identidade visual.

## When to invoke

- User asks to "extract design from <URL>", "get a DESIGN.md from <site>", "rip the DS from <url>", or similar
- User wants drift detection: "is my DESIGN.md still aligned with <live URL>?"
- User wants `tokens.json` + `preview.html` generated from any public site
- User wants a stack/style fingerprint of an unknown site

Skip if the user wants TSX components (use `/print-to-code` style skills instead) or motion-only extraction.

## Install

```bash
# 1. Drop the folder into your project
cp -R design-md .claude/skills/

# 2. Install local deps
cd .claude/skills/design-md && npm install

# 3. (Optional) install the lint dependency once globally so npx is offline-friendly
npx --yes @google/design.md@0.1.0 --version
```

The skill only requires Node 18+. The `claude -p` provider needs the [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) on `PATH`. The `openrouter` provider needs `OPENROUTER_API_KEY` set.

## Quick run

```bash
node .claude/skills/design-md/run.cjs --url https://www.anthropic.com/
```

Output lands under one folder per **URL variant** in `outputs/design-md/{slug}/` (relative to your CWD). The slugger is **subdomain- and path-aware** so different DSes under the same company don't collide:

- `https://www.anthropic.com/` → `anthropic`
- `https://www.shopify.com/` → `shopify`
- `https://www.shopify.com/br/enterprise` → `shopify-br-enterprise` (different DS from root)
- `https://brand.acme.com/brandbook/guidelines` → `acme-brand-brandbook-guidelines`
- `https://app.linear.app/` → `linear-app` (product UI ≠ marketing root)

`www.` is stripped silently; other subdomains and the first 4 path segments become qualifiers (capped at 80 chars). Root URLs of the same company are backwards-compatible (still slug to bare company name).

```
{company}/                ← latest "best" extraction at root
  DESIGN.md               ← Google-spec, with provenance comments inline
  tokens.json             ← parsed YAML frontmatter
  extraction-log.yaml     ← provenance + confidence summary (machine-readable)
  lint-report.json        ← @google/design.md lint output
  quality-score.json      ← A-F across 7 categories
  preview.html            ← single-file standalone (Google Fonts CDN + Prism)
  style-fingerprint.json  ← visual archetype classification
  agent-prompt.txt        ← reusable LLM prompt with extracted tokens
  telemetry.json          ← run timing, model, cost, reuse trace
  inputs/                 ← raw HTML, CSS, tokens-detected, fingerprints, prompt
  history/
    {YYYYMMDD-HHmmss}/    ← prior runs, archived when superseded
```

The latest run only stays at the company root if it scores `>= ` the previous best (quality + confidence_high · 0.5 − lint_errors · 5). Otherwise it goes to `history/{ts}/` and the previous best stays at root.

Override the outputs root via the `--out` flag or by setting `DESIGN_MD_OUTPUTS_DIR=/abs/path` (used by the `scripts/*.cjs` helpers).

## Drift mode

Compare a live URL against a local DESIGN.md:

```bash
node .claude/skills/design-md/run.cjs \
  --url https://brand.acme.com/brandbook/guidelines \
  --compare apps/my-app/DESIGN.md
```

Adds `drift-report.json` + verdict in stdout: `in-sync` / `minor-drift` / `notable-drift` / `major-drift`.

## Flags

| Flag | Default | Notes |
|---|---|---|
| `--url <url>` | required | Public http(s) URL |
| `--out <dir>` | `outputs/design-md/{slug}/` (CWD-relative) | Output directory |
| `--prompt <file>` | `data/url-extract-prompt.txt` (in skill) | Override LLM prompt template |
| `--compare <file>` | — | Local DESIGN.md to drift-check against |
| `--no-content-gate` | off | Skip the content-validation gate (R1) |
| `--no-llm-retry` | off | CI mode — fail hard on first LLM error |
| `--no-reuse` | off | Disable phase reuse from prior runs (force cold run) |
| `--provider <id>` | auto | `claude-cli` (local) or `openrouter` (CI/Vercel) |
| `--model <id>` | provider default | claude-cli → Opus 4.7; openrouter → Haiku 4.5 (allow-list enforced) |
| `--max-tokens <n>` | 8192 | Only used by `openrouter` |

## Environment variables

| Var | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | Required when `--provider openrouter` |
| `DESIGN_MD_OUTPUTS_DIR` | Override outputs root for the `scripts/*.cjs` helpers |
| `DESIGN_MD_POST_HOOK` | Optional Node script invoked after each successful extract (`node $HOOK $outDir`). Fire-and-forget — failures don't fail the extract. |
| `DESIGN_MD_SKIP_HOOK` | Set to `1` to bypass the post-hook |

## Phase reuse (default on)

Re-running the extractor on a URL with a prior fresh extract (< 24h) **reuses outputs phase-by-phase** from `{company}/` (the current "best" run) instead of re-fetching, re-detecting, or re-calling the LLM.

| Phase | Reuse condition | Skips on hit |
|---|---|---|
| `fetch` | `{company}/inputs/page.html` exists and is < 24h old | HTTP fetch + headers |
| `collect` | Phase `fetch` hit AND `{company}/inputs/css-collected.css` exists | CSS bundle download (often 0.5–2 MB) + favicon + logo |
| `detect` | Phase `collect` hit AND all 13 detection files + `style-fingerprint.json` exist | All regex/static analysis |
| `markdown` | Phase `fetch` hit AND `{company}/inputs/page.md` exists | HTML → markdown conversion |
| `llm` | Prior run telemetry has same model AND prompt content matches (path-normalized) | LLM call + retry loop |

End-of-run telemetry includes `reuse.trace` and a one-liner: `[reuse] 5/5 phases reused from {slug} — fetch=HIT collect=HIT detect=HIT markdown=HIT llm=HIT`. Pass `--no-reuse` for CI/auditing where each run must be deterministic from cold.

## Migrating existing extracts

A one-shot script consolidates legacy `{slug}-{timestamp}/` dirs into the new `{company}/` layout:

```bash
# Preview migration plan
node scripts/organize.cjs --dry-run

# Apply (drops failed extracts without DESIGN.md)
node scripts/organize.cjs --apply --skip-junk
```

Best-run selection: complete → high quality_score → high confidence_high → low lint errors → most recent.

## Pipeline (8 phases)

1. `axios.get(url)` → HTML
2. `cheerio` walks `<link rel="stylesheet">`, inline `<style>`, `style=""` → fetches and concatenates all CSS (preload + `@import` resolved)
3. Regex pass detects: hex/rgb/hsl, `font-family|size|weight`, `line-height`, `border-radius`, `padding|margin|gap`, Google Fonts URLs. Emits `stack.json` (Next.js, Tailwind, Radix, GSAP, …) and `style-fingerprint.json` (shadcn-neutral, carbon-enterprise, apple-glass, polaris-friendly, marketing-gradient, …)
4. `turndown` HTML → markdown; first heading + first long paragraph become the type specimen `pageCopy`
5. Templates `data/url-extract-prompt.txt` with input file paths (HTML, CSS, page-copy, tokens-detected, css-vars, font-faces, stack-summary). Fingerprints feed prose tone — LLM matches archetype rather than producing generic descriptions
6. `claude -p <prompt> --output-format text` (or OpenRouter API) — instructed to use the Write tool to emit `DESIGN.md` at the resolved output path. Normalize + lint (`@google/design.md@0.1.0`) + retry once on max-turns / missing sections
7. Parse YAML frontmatter → `tokens.json`. Build `extraction-log.yaml`, quality score, drift report (if `--compare`). Embed fonts as data: URLs
8. Render single-file `preview.html` — color swatches, typography (Google Fonts), spacing/radius scales, raw DESIGN.md (Prism CDN), audit panel with fingerprint summary

Optional Phase 9: invoke `DESIGN_MD_POST_HOOK` if set (fire-and-forget — failures don't fail the extract).

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success — DESIGN.md produced, preview rendered |
| 1 | Usage error (missing `--url`) |
| 2 | LLM ran but DESIGN.md was not written. Check `inputs/prompt.txt` |
| 4 | Content-validation gate failed (bot detection / paywall / SPA shell). Override with `--no-content-gate` |
| 5 | LLM exhausted budget AND retry failed, OR missing required sections after retry |
| 6 | `--provider openrouter` chosen but `OPENROUTER_API_KEY` not set |
| 7 | OpenRouter HTTP error after retry exhausted |

## Confidence ladder (C1)

Each top-level token in the YAML frontmatter is annotated with a provenance comment that the script grades:

| Level | Source | Example comment |
|---|---|---|
| `high` | CSS var or `@font-face` | `# from --swatch--clay` |
| `medium` | Non-var CSS declaration | `# from h1 declaration` |
| `low` | Inferred | `# inferred from primary darker variant` |

Aggregated in `extraction-log.yaml#confidence_summary` and rendered as colored badges in the preview header.

## Tests

```bash
cd .claude/skills/design-md
npm test
# or directly:
node --test lib/*.test.cjs lib/providers/*.test.cjs
```

## Anti-patterns

- Don't add Playwright / Puppeteer / Hyperbrowser. The constraint is intentional — prove static analysis + headless LLM works before adding browsers.
- Don't call the Anthropic API directly. The cognition layer is `claude -p` (or OpenRouter pass-through). Provider/model policy lives in `lib/llm.cjs` (`PROVIDER_DEFAULTS`).
- Don't bypass the content-validation gate without `--no-content-gate` — thin content (bot blocks, paywalls, JS shells) wastes LLM turns.

## References

- **Spec:** Google [`@google/design.md`](https://github.com/google-labs-code/design.md) v0.1.0
- **Awesome catalog:** [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
- **Provider docs:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code) · [OpenRouter](https://openrouter.ai)

## Author

Alan Nicolas — [@oalanicolas](https://github.com/oalanicolas) — [github.com/oalanicolas](https://github.com/oalanicolas)

---

## Ao terminar — SEMPRE diga o próximo passo

Toda execução desta skill **termina apontando o próximo passo** — pra o aluno nunca ficar sem saber o que fazer depois. Consulte o **Mapa de Execução do `/metodo-funil`** (ou a sequência da aula) pra saber qual skill vem a seguir, e aponte-a explicitamente:

> Pronto. **Próximo passo:** rode `/{proxima-skill}` — [o que ela entrega].

Nunca encerre sem o próximo passo.
