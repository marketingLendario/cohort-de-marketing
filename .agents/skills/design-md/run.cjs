#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

/**
 * extract-from-url — squad design-ops pipeline orchestrator
 *
 * Refactored 2026-04-27 from a 3591-line monolith into 8 focused modules
 * under `lib/`. Pattern follows Dembrandt's `lib/` structure (8 files) +
 * Project Wallace's test-vizinho convention.
 *
 * lib/telemetry.cjs is the 9th module — justified exception to 8-file cap
 * because it is a new purpose-built module (not a fragment of an existing one).
 *
 * Pipeline:
 *   1. fetch HTML + preserve HTTP response-headers.json (S6 — whitelist of diagnostic headers)
 *   2. collect CSS (external + preload + @import resolved + inline + style="" attrs)
 *      + favicon + logo
 *   2.5 content-validation gate (R1) — aborts if content is insubstantial
 *   3. static-CSS detection (tokens, vars, fonts, shadows, motion, breakpoints,
 *      dark mode, component properties, stack fingerprint with confidence ladder + suppression)
 *      → inputs/stack.json (full with suppressed_by)
 *      → inputs/stack-summary.json (filtered top-8, no suppressed_by, < 2KB for LLM)
 *   4. HTML → markdown (turndown) + page copy specimens
 *   5. prepare prompt + invoke LLM (provider-agnostic via invokeLlm)
 *      prompt input #8 = STACK_PATH (stack-summary.json)
 *   6. normalize DESIGN.md (spec-clean) + lint via @google/design.md
 *      + LLM retry (R2) if max-turns hit or sections incomplete
 *   7. extraction-log + quality score + drift report (if --compare) +
 *      embed fonts as data: URLs + agent prompt
 *   8. render single-file preview.html
 *
 * Exit codes:
 *   1 — usage error (missing --url)
 *   2 — DESIGN.md not produced by LLM
 *   4 — content-validation gate: content too thin (bot detection, paywall, SPA)
 *       override with --no-content-gate
 *   5 — LLM exhausted budget (max-turns hit) and retry also failed
 *       or DESIGN.md missing required sections after retry
 *       override retry with --no-llm-retry (CI mode — fail hard on first error)
 *   6 — OpenRouter selected but OPENROUTER_API_KEY not set
 *   7 — OpenRouter HTTP error (4xx/5xx) after retry exhausted
 *
 * Flags:
 *   --url <url>           Target URL to extract design from
 *   --out <dir>           Output directory (default: outputs/design-md/<slug>)
 *   --prompt <file>       Custom prompt template file
 *   --compare <file>      Compare extracted tokens against local DESIGN.md
 *   --no-content-gate     Skip content-validation gate
 *   --no-llm-retry        Fail hard on first LLM error (CI mode)
 *   --provider <id>       Force provider: claude-cli | openrouter (auto-detected by default)
 *   --model <id>          Model ID for openrouter (e.g. anthropic/claude-haiku-4-5)
 *   --max-tokens <n>      Max tokens for openrouter response (default: 8192)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

const { parseArgs, slugifyHost, companyFromUrl, slugFromUrl, timestamp, parseFrontmatter } = require("./lib/utils.cjs");
const {
  fetchHtml,
  collectCss,
  fetchFavicon,
  fetchLogo,
  embedFontFiles,
} = require("./lib/fetch.cjs");
const {
  detectTokens,
  detectCssVars,
  detectFontFaces,
  detectStack,
  classifyStyle,
  truncateCssForLlm,
  summarizeStackForPrompt,
  detectShadows,
  detectMotion,
  detectBreakpoints,
  detectDarkMode,
  detectComponentProperties,
  buildUsageGraph,
  htmlToMarkdown,
  extractPageCopy,
  // L3/L4 extras (B1)
  detectGradients,
  detectBackdropBlur,
  detectZIndex,
  detectContainerMaxWidth,
  detectOpacityScale,
  detectFocusRing,
  // Theme default detection
  detectDefaultTheme,
} = require("./lib/extractors.cjs");
const { invokeLlm, buildAgentPrompt } = require("./lib/llm.cjs");
const {
  normalizeDesignMd,
  runLint,
  buildExtractionLog,
  computeQualityScore,
  computeDrift,
} = require("./lib/design-md.cjs");
const { renderPreview } = require("./lib/preview.cjs");
const {
  createPhaseTimer,
  parseClaudeCliStdout,
  parseOpenRouterResponse,
  estimateCost,
  estimateCostFromChars,
  validateDesignMdSections,
} = require("./lib/telemetry.cjs");
const {
  FRESH_MS_DEFAULT,
  findLatestRunForUrl,
  isFresh,
  copyAllOrNone,
  copyIfExists,
  readPrevTelemetryModel,
  promptsEqual,
  promoteOrArchive,
  moveDir,
} = require("./lib/reuse.cjs");

// ── Content-validation gate thresholds (R1) — adjustable ────────────
const CONTENT_GATE_CSS_MIN_BYTES = 1000;
const CONTENT_GATE_HTML_MIN_BYTES = 500;
const CONTENT_GATE_COLORS_MIN = 3;

// ── Pipeline error class — preserves exit code while letting catch handler save crash-context ──
class PipelineError extends Error {
  constructor(message, exitCode = 1, details = {}) {
    super(message);
    this.name = "PipelineError";
    this.exitCode = exitCode;
    this.details = details;
  }
}

// ── HTTP retry with 2s delay (AC4.3) — openrouter only ──────────────
// claude-cli does NOT return httpStatus (subprocess), so it falls through to
// the generic non-zero exit branch below. Use `!= null` to catch undefined.
async function invokeWithHttpRetry(promptText, llmOptions, noRetry) {
  const result = await invokeLlm(promptText, llmOptions);

  // openrouter HTTP error path (httpStatus is set when provider is openrouter)
  if (result.status !== 0 && result.httpStatus != null && !noRetry) {
    const code = result.httpStatus;
    if (code === 429 || (code >= 500 && code < 600)) {
      console.log(`     [openrouter] HTTP ${code} — waiting 2s then retrying…`);
      await new Promise((res) => setTimeout(res, 2000));
      const retry = await invokeLlm(promptText, llmOptions);
      if (retry.status !== 0) {
        const retryBody = retry.stderr || "";
        console.error(`[!] OpenRouter HTTP error after retry: ${retryBody.slice(0, 500)}`);
        throw new PipelineError(`OpenRouter HTTP error after retry`, 7, { httpStatus: retry.httpStatus, body: retryBody.slice(0, 500) });
      }
      return { result: retry, httpRetried: true };
    }
    // Non-retryable openrouter HTTP error
    const errBody = result.stderr || "";
    console.error(`[!] OpenRouter HTTP error: ${errBody.slice(0, 500)}`);
    throw new PipelineError(`OpenRouter HTTP error`, 7, { httpStatus: code, body: errBody.slice(0, 500) });
  }

  // Generic non-zero exit (claude-cli subprocess failure, network error, etc.)
  if (result.status !== 0) {
    const errBody = result.stderr || result.stdout || "";
    const provider = llmOptions.provider || "claude-cli";

    // SOFT FAILURE — claude-cli exits 1 specifically when max-turns hits.
    // The stdout contains a JSON result with subtype "error_max_turns".
    // We must NOT throw here — let the main pipeline detect via parseClaudeCliStdout
    // and trigger the retry path (which uses maxTurns 60 + reduced prompt).
    const isMaxTurnsSoftFail =
      provider === "claude-cli" &&
      result.status === 1 &&
      typeof result.stdout === "string" &&
      result.stdout.includes("error_max_turns");
    if (isMaxTurnsSoftFail) {
      console.log(`     [claude-cli] hit max-turns (soft failure) — main pipeline will retry with reduced context`);
      return { result, httpRetried: false };
    }

    console.error(`[!] LLM invocation failed (provider=${provider}, exit=${result.status}): ${errBody.slice(0, 500)}`);
    throw new PipelineError(
      `LLM invocation failed (provider=${provider}, exit=${result.status})`,
      7,
      { provider, exit: result.status, body: errBody.slice(0, 800) }
    );
  }

  return { result, httpRetried: false };
}

// ── Main pipeline ───────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  if (!args.url) {
    console.error("usage: extract-from-url.cjs --url <url> [--out <dir>] [--prompt <prompt-file>] [--compare <local-DESIGN.md>] [--no-content-gate] [--no-llm-retry] [--provider <claude-cli|openrouter>] [--model <model-id>] [--max-tokens <n>]");
    process.exit(1);
  }

  // Standalone skill: outputs land relative to the user's CWD; prompt + lint
  // resolve relative to this skill folder. No assumption of a host repo layout.
  const skillRoot = __dirname;
  const repoRoot = process.cwd();
  // Variant-aware slug — different subpaths/subdomains under the same company
  // get their own folder so multiple distinct DSes don't collide.
  // Backwards compatible: root URLs still slug to bare company name.
  const company = slugFromUrl(args.url);
  const baseCompany = companyFromUrl(args.url);
  const runTs = timestamp();
  const extractsRoot = path.join(repoRoot, "outputs", "design-md");
  const companyDir = path.join(extractsRoot, company);
  // Write to scratch dir during the run; promote/archive at the end.
  const outDir = args.out || path.join(companyDir, `.run-${runTs}`);
  const inputsDir = path.join(outDir, "inputs");
  const promptFile =
    args.prompt || path.join(skillRoot, "data", "url-extract-prompt.txt");

  fs.mkdirSync(inputsDir, { recursive: true });

  // ── Reuse setup ───────────────────────────────────────────────────
  // Cache source = current `{company}/` root (latest "best" extraction).
  // If fresh (< 24h), each phase may copy its outputs from there instead of
  // recomputing. Disable with --no-reuse.
  const reuseEnabled = !args["no-reuse"];
  const previousRun = reuseEnabled
    ? findLatestRunForUrl({
        outputsDir: extractsRoot,
        company,
        currentRunDir: outDir,
      })
    : null;
  const previousFresh = previousRun ? isFresh(previousRun, FRESH_MS_DEFAULT) : false;
  const previousInputs = previousRun ? path.join(previousRun, "inputs") : null;
  const reuseTrace = { fetch: "MISS", collect: "MISS", detect: "MISS", markdown: "MISS", llm: "MISS" };
  console.log(`[layout] company=${company}  scratch=${path.basename(outDir)}`);
  if (previousRun) {
    const ageH = (require("./lib/reuse.cjs").dirAgeMs(previousRun) / 36e5).toFixed(1);
    const stamp = previousFresh ? `${ageH}h old, fresh` : `${ageH}h old, stale (>24h)`;
    console.log(`[reuse] previous run found: ${company}/ (${stamp})`);
  } else if (reuseEnabled) {
    console.log(`[reuse] no previous run for this URL — running cold`);
  } else {
    console.log(`[reuse] disabled via --no-reuse`);
  }

  const timer = createPhaseTimer();
  const wallStart = Date.now();

  // Expose timer + paths to the crash handler at module scope so a failure
  // anywhere in the pipeline produces a debuggable crash-context.json.
  if (process.__extractCrashCtx) {
    process.__extractCrashCtx.timer = timer;
    process.__extractCrashCtx.outDir = outDir;
    process.__extractCrashCtx.inputsDir = inputsDir;
    process.__extractCrashCtx.url = args.url;
  }

  // ── Phase 1: Fetch HTML ───────────────────────────────────────────
  let html, responseHeaders;
  if (
    previousFresh &&
    copyAllOrNone(previousInputs, inputsDir, ["page.html", "response-headers.json"])
  ) {
    html = fs.readFileSync(path.join(inputsDir, "page.html"), "utf8");
    responseHeaders = JSON.parse(fs.readFileSync(path.join(inputsDir, "response-headers.json"), "utf8"));
    reuseTrace.fetch = "HIT";
    console.log(`[1/8] fetch — reused from ${path.basename(previousRun)}`);
  } else {
    console.log(`[1/8] fetching ${args.url}`);
    timer.start("phase_1_fetch");
    ({ html, headers: responseHeaders } = await fetchHtml(args.url));
    timer.end("phase_1_fetch");
    fs.writeFileSync(path.join(inputsDir, "page.html"), html);
    // Save whitelisted response headers as provenance artifact
    fs.writeFileSync(path.join(inputsDir, "response-headers.json"), JSON.stringify(responseHeaders, null, 2));
  }

  // ── Phase 2: Collect CSS + favicon + logo ─────────────────────────
  // Reuse if Phase 1 hit AND prior run has the required collect artifacts.
  // favicon.json / logo.json are optional (some sites lack them).
  let css, cssMeta, favicon = null, logo = null;
  const collectRequired = ["css-collected.css", "css-meta.json"];
  const canReuseCollect =
    reuseTrace.fetch === "HIT" &&
    copyAllOrNone(previousInputs, inputsDir, collectRequired);
  if (canReuseCollect) {
    css = fs.readFileSync(path.join(inputsDir, "css-collected.css"), "utf8");
    cssMeta = JSON.parse(fs.readFileSync(path.join(inputsDir, "css-meta.json"), "utf8"));
    if (copyIfExists(path.join(previousInputs, "favicon.json"), path.join(inputsDir, "favicon.json"))) {
      favicon = JSON.parse(fs.readFileSync(path.join(inputsDir, "favicon.json"), "utf8"));
    }
    if (copyIfExists(path.join(previousInputs, "logo.json"), path.join(inputsDir, "logo.json"))) {
      logo = JSON.parse(fs.readFileSync(path.join(inputsDir, "logo.json"), "utf8"));
    }
    reuseTrace.collect = "HIT";
    console.log(`[2/8] collect — reused from ${path.basename(previousRun)}`);
  } else {
    console.log(`[2/8] collecting CSS + favicon + logo`);
    timer.start("phase_2_collect");
    ({ css, meta: cssMeta } = await collectCss(html, args.url));
    timer.end("phase_2_collect");
    fs.writeFileSync(path.join(inputsDir, "css-collected.css"), css);
    fs.writeFileSync(path.join(inputsDir, "css-meta.json"), JSON.stringify(cssMeta, null, 2));

    favicon = await fetchFavicon(html, args.url);
    if (favicon) {
      fs.writeFileSync(path.join(inputsDir, "favicon.json"), JSON.stringify({ sourceUrl: favicon.sourceUrl, mime: favicon.mime, size: favicon.size }, null, 2));
      console.log(`     favicon: ${favicon.sourceUrl} (${favicon.mime}, ${favicon.size}b)`);
    } else {
      console.log(`     favicon: not found`);
    }

    logo = await fetchLogo(html, args.url);
    if (!logo && favicon) {
      logo = { ...favicon, source: "favicon (fallback)", kind: favicon.mime.includes("svg") ? "svg" : "img" };
      console.log(`     logo: using favicon as fallback`);
    }
    if (logo) {
      fs.writeFileSync(path.join(inputsDir, "logo.json"), JSON.stringify({ sourceUrl: logo.sourceUrl, mime: logo.mime, size: logo.size, source: logo.source, kind: logo.kind }, null, 2));
      if (logo.source !== "favicon (fallback)") console.log(`     logo: ${logo.source} (${logo.mime}, ${logo.size}b)`);
    } else {
      console.log(`     logo: not found`);
    }
  }

  // ── Phase 2.5: Content-validation gate (R1) ───────────────────────
  const preLiminaryColors = (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
  const cssBytes = css.length;
  const htmlBytes = html.length;
  const colorsFound = preLiminaryColors;

  if (!args["no-content-gate"]) {
    if (cssBytes < CONTENT_GATE_CSS_MIN_BYTES || htmlBytes < CONTENT_GATE_HTML_MIN_BYTES || colorsFound < CONTENT_GATE_COLORS_MIN) {
      console.error(`[!] Content-validation gate FAILED — content too thin to produce a meaningful DESIGN.md`);
      console.error(`    Observed: html=${htmlBytes}b  css=${cssBytes}b  colors=${colorsFound}`);
      console.error(`    Thresholds: html>=${CONTENT_GATE_HTML_MIN_BYTES}b  css>=${CONTENT_GATE_CSS_MIN_BYTES}b  colors>=${CONTENT_GATE_COLORS_MIN}`);
      console.error(`    Likely bot detection, paywall, or pure-SPA shell.`);
      console.error(`    Try a different URL or add --no-content-gate to override.`);
      process.exit(4);
    }
  }

  // ── Phase 3: Token detection ──────────────────────────────────────
  // Reuse if Phase 2 hit AND prior run has all 13 detection artifacts (12 in inputs/, 1 at outDir root).
  const detectInputsFiles = [
    "tokens-detected.json", "css-vars-detected.json", "font-faces.json",
    "token-usage-graph.json", "component-properties.json", "breakpoints.json",
    "dark-mode.json", "shadows.json", "motion.json", "stack.json",
    "stack-summary.json", "css-for-llm.css", "css-truncation-stats.json",
    // L3/L4 extras (B1)
    "gradients.json", "backdrop-blur.json", "z-index.json",
    "container.json", "opacity-scale.json", "focus-ring.json",
    // Theme default
    "theme-default.json",
  ];
  let detected, cssVars, fontFaces, usageGraph, componentProps, breakpoints, darkMode, shadows, motion, stack, styleFingerprint;
  const prevStyleFingerprint = previousRun ? path.join(previousRun, "style-fingerprint.json") : null;
  const canReuseDetect =
    reuseTrace.collect === "HIT" &&
    fs.existsSync(prevStyleFingerprint) &&
    copyAllOrNone(previousInputs, inputsDir, detectInputsFiles);
  if (canReuseDetect) {
    fs.copyFileSync(prevStyleFingerprint, path.join(outDir, "style-fingerprint.json"));
    detected = JSON.parse(fs.readFileSync(path.join(inputsDir, "tokens-detected.json"), "utf8"));
    cssVars = JSON.parse(fs.readFileSync(path.join(inputsDir, "css-vars-detected.json"), "utf8"));
    fontFaces = JSON.parse(fs.readFileSync(path.join(inputsDir, "font-faces.json"), "utf8"));
    usageGraph = JSON.parse(fs.readFileSync(path.join(inputsDir, "token-usage-graph.json"), "utf8"));
    componentProps = JSON.parse(fs.readFileSync(path.join(inputsDir, "component-properties.json"), "utf8"));
    breakpoints = JSON.parse(fs.readFileSync(path.join(inputsDir, "breakpoints.json"), "utf8"));
    darkMode = JSON.parse(fs.readFileSync(path.join(inputsDir, "dark-mode.json"), "utf8"));
    shadows = JSON.parse(fs.readFileSync(path.join(inputsDir, "shadows.json"), "utf8"));
    motion = JSON.parse(fs.readFileSync(path.join(inputsDir, "motion.json"), "utf8"));
    stack = JSON.parse(fs.readFileSync(path.join(inputsDir, "stack.json"), "utf8"));
    styleFingerprint = JSON.parse(fs.readFileSync(path.join(outDir, "style-fingerprint.json"), "utf8"));
    reuseTrace.detect = "HIT";
    console.log(`[3/8] detect — reused from ${path.basename(previousRun)}`);
  } else {
    console.log(`[3/8] token detection (regex + CSS vars + @font-face + usage graph)`);
    timer.start("phase_3_detect");
    detected = detectTokens(css);
    detected.colors.hex_usage = {};
    for (const hex of detected.colors.hex) {
      const re = new RegExp(hex.replace(/[#]/g, "\\#"), "gi");
      const matches = css.match(re);
      detected.colors.hex_usage[hex.toLowerCase()] = matches ? matches.length : 0;
    }
    fs.writeFileSync(path.join(inputsDir, "tokens-detected.json"), JSON.stringify(detected, null, 2));

    cssVars = detectCssVars(css);
    fs.writeFileSync(path.join(inputsDir, "css-vars-detected.json"), JSON.stringify(cssVars, null, 2));

    fontFaces = detectFontFaces(css);
    fs.writeFileSync(path.join(inputsDir, "font-faces.json"), JSON.stringify(fontFaces, null, 2));

    usageGraph = buildUsageGraph(css, cssVars);
    fs.writeFileSync(path.join(inputsDir, "token-usage-graph.json"), JSON.stringify(usageGraph, null, 2));

    componentProps = detectComponentProperties(css);
    fs.writeFileSync(path.join(inputsDir, "component-properties.json"), JSON.stringify(componentProps, null, 2));

    breakpoints = detectBreakpoints(css);
    fs.writeFileSync(path.join(inputsDir, "breakpoints.json"), JSON.stringify(breakpoints, null, 2));

    darkMode = detectDarkMode(css, cssVars);
    fs.writeFileSync(path.join(inputsDir, "dark-mode.json"), JSON.stringify(darkMode, null, 2));

    shadows = detectShadows(css);
    fs.writeFileSync(path.join(inputsDir, "shadows.json"), JSON.stringify(shadows, null, 2));

    motion = detectMotion(css);
    fs.writeFileSync(path.join(inputsDir, "motion.json"), JSON.stringify(motion, null, 2));

    stack = detectStack(html, css, cssMeta, responseHeaders);
    fs.writeFileSync(path.join(inputsDir, "stack.json"), JSON.stringify(stack, null, 2));
    const stackSummary = summarizeStackForPrompt(stack);
    fs.writeFileSync(path.join(inputsDir, "stack-summary.json"), JSON.stringify(stackSummary, null, 2));

    // ── Phase 3f: Style fingerprint (visual archetype classification) ──
    // Complementary to detectStack (technical). Maps to canonical archetypes
    // (shadcn-neutral, carbon-enterprise, apple-glass, polaris-friendly,
    // marketing-gradient, ...) — see lib/extractors.cjs:classifyStyle.
    styleFingerprint = classifyStyle(detected, cssVars, shadows, fontFaces, css);
    fs.writeFileSync(path.join(outDir, "style-fingerprint.json"), JSON.stringify(styleFingerprint, null, 2));

    // ── Phase 3g: CSS truncation for LLM cost discipline (Gap #15) ──────
    // Apple css-collected.css = 668KB → $5.50/run with Opus. Truncate to ~100KB
    // prioritizing :root, dark mode, @theme inline, font-face, component selectors.
    const cssTruncated = truncateCssForLlm(css);
    fs.writeFileSync(path.join(inputsDir, "css-for-llm.css"), cssTruncated.truncated);
    fs.writeFileSync(path.join(inputsDir, "css-truncation-stats.json"), JSON.stringify({
      original_bytes: cssTruncated.original_bytes,
      kept_bytes: cssTruncated.kept_bytes,
      blocks_total: cssTruncated.blocks_total || null,
      blocks_kept: cssTruncated.blocks_kept || null,
      dropped: cssTruncated.dropped,
      reduction_pct: cssTruncated.dropped
        ? Math.round((1 - cssTruncated.kept_bytes / cssTruncated.original_bytes) * 100)
        : 0,
    }, null, 2));

    // ── Phase 3h: L3/L4 extra detectors (B1) ──────────────────────────
    // Gradients, backdrop blur, z-index ladder, container max-width,
    // opacity scale, focus ring — all from raw CSS, no LLM.
    fs.writeFileSync(path.join(inputsDir, "gradients.json"), JSON.stringify(detectGradients(css), null, 2));
    fs.writeFileSync(path.join(inputsDir, "backdrop-blur.json"), JSON.stringify(detectBackdropBlur(css), null, 2));
    fs.writeFileSync(path.join(inputsDir, "z-index.json"), JSON.stringify(detectZIndex(css), null, 2));
    fs.writeFileSync(path.join(inputsDir, "container.json"), JSON.stringify(detectContainerMaxWidth(css), null, 2));
    fs.writeFileSync(path.join(inputsDir, "opacity-scale.json"), JSON.stringify(detectOpacityScale(css) || { all: [] }, null, 2));
    fs.writeFileSync(path.join(inputsDir, "focus-ring.json"), JSON.stringify(detectFocusRing(css), null, 2));

    // ── Phase 3i: Default theme detection (dark vs light) ─────────────
    // Used by the LLM prompt to disambiguate when CSS has both theme variants.
    fs.writeFileSync(path.join(inputsDir, "theme-default.json"), JSON.stringify(detectDefaultTheme(html), null, 2));

    timer.end("phase_3_detect");
  }

  console.log(`     css-vars=${cssVars.length}  @font-face=${fontFaces.length}  unique-tokens=${usageGraph.length}`);
  console.log(`     shadows=${shadows.length}  motion: ${motion.durations.length} durations · ${motion.easings.length} easings · ${motion.keyframes.length} keyframes`);
  if (stack.length > 0) {
    const summary = stack.slice(0, 6).map(s => s.name).join(" · ");
    console.log(`     stack: ${stack.length} signals — ${summary}${stack.length > 6 ? " · …" : ""}`);
  }
  if (styleFingerprint.classification.primary_archetype) {
    const c = styleFingerprint.classification;
    const sec = c.secondary_archetype ? ` (also: ${c.secondary_archetype})` : "";
    console.log(`     archetype: ${c.primary_archetype} (${c.confidence_score}% confidence)${sec}`);
  } else {
    console.log(`     archetype: unclassified (no archetype reached 50% confidence threshold)`);
  }
  const btnRadius = componentProps.summary.button?.["border-radius"];
  if (btnRadius) console.log(`     button radius (most common in source): ${btnRadius.most_common} (${btnRadius.most_common_count}/${btnRadius.total_declarations} decls)`);

  // ── Phase 4: HTML → markdown ──────────────────────────────────────
  // Reuse if Phase 1 hit (markdown is purely a function of HTML).
  let md, pageCopy;
  const canReuseMarkdown =
    reuseTrace.fetch === "HIT" &&
    copyAllOrNone(previousInputs, inputsDir, ["page.md", "page-copy.json"]);
  if (canReuseMarkdown) {
    md = fs.readFileSync(path.join(inputsDir, "page.md"), "utf8");
    pageCopy = JSON.parse(fs.readFileSync(path.join(inputsDir, "page-copy.json"), "utf8"));
    reuseTrace.markdown = "HIT";
    console.log(`[4/8] markdown — reused from ${path.basename(previousRun)}`);
  } else {
    console.log(`[4/8] HTML → markdown`);
    timer.start("phase_4_markdown");
    md = htmlToMarkdown(html);
    fs.writeFileSync(path.join(inputsDir, "page.md"), md);
    pageCopy = extractPageCopy(md);
    fs.writeFileSync(path.join(inputsDir, "page-copy.json"), JSON.stringify(pageCopy, null, 2));
    timer.end("phase_4_markdown");
  }

  // ── Phase 5: Prepare prompt ──────────────────────────────────────
  console.log(`[5/8] preparing prompt`);
  timer.start("phase_5_prompt");
  const promptTemplate = fs.readFileSync(promptFile, "utf8");
  const designMdPath = path.join(outDir, "DESIGN.md");
  // Read theme-default detection result for prompt substitution
  let defaultTheme = "light";
  let themeConfidence = "low";
  try {
    const td = JSON.parse(fs.readFileSync(path.join(inputsDir, "theme-default.json"), "utf8"));
    defaultTheme = td.default || "light";
    themeConfidence = td.confidence || "low";
  } catch {}
  const filled = promptTemplate
    .replace(/\{\{URL\}\}/g, args.url)
    .replace(/\{\{HTML_MD_PATH\}\}/g, path.join(inputsDir, "page.md"))
    .replace(/\{\{CSS_PATH\}\}/g, path.join(inputsDir, "css-for-llm.css"))
    .replace(/\{\{CSS_FULL_PATH\}\}/g, path.join(inputsDir, "css-collected.css"))
    .replace(/\{\{TOKENS_PATH\}\}/g, path.join(inputsDir, "tokens-detected.json"))
    .replace(/\{\{CSS_VARS_PATH\}\}/g, path.join(inputsDir, "css-vars-detected.json"))
    .replace(/\{\{FONT_FACES_PATH\}\}/g, path.join(inputsDir, "font-faces.json"))
    .replace(/\{\{USAGE_GRAPH_PATH\}\}/g, path.join(inputsDir, "token-usage-graph.json"))
    .replace(/\{\{COMPONENT_PROPS_PATH\}\}/g, path.join(inputsDir, "component-properties.json"))
    .replace(/\{\{STACK_PATH\}\}/g, path.join(inputsDir, "stack-summary.json"))
    .replace(/\{\{STYLE_FINGERPRINT_PATH\}\}/g, path.join(outDir, "style-fingerprint.json"))
    .replace(/\{\{ARCHETYPE\}\}/g, styleFingerprint.classification.primary_archetype || "unclassified")
    .replace(/\{\{DEFAULT_THEME\}\}/g, defaultTheme)
    .replace(/\{\{THEME_CONFIDENCE\}\}/g, themeConfidence)
    .replace(/\{\{OUTPUT_PATH\}\}/g, designMdPath);
  fs.writeFileSync(path.join(inputsDir, "prompt.txt"), filled);
  timer.end("phase_5_prompt");

  // ── Phase 6: Invoke LLM + retry loop (R2) ────────────────────────
  console.log(`[6/8] invoking LLM (this may take 30-120s)`);
  timer.start("phase_6_llm");

  const noLlmRetry = !!args["no-llm-retry"];
  const provider = args.provider || null; // null = auto-detect in invokeLlm
  const model = args.model || null;
  const maxTokens = args["max-tokens"] || 8192;

  const llmOptions = {
    provider,
    model,
    maxTurns: 50,
    maxTokens,
    cwd: repoRoot,
    designMdPath,
  };

  let llmResult = null;
  let claudeMetadata = null;
  let openrouterUsage = null;
  let retries = 0;
  let retryReasons = [];
  let maxTurnsHit = false;
  let resolvedProvider = provider || (process.env.VERCEL === "1" ? "openrouter" : (process.env.OPENROUTER_API_KEY ? "openrouter" : "claude-cli"));
  let designMd;
  let rawDesignMdForEvidence = null;

  // ── LLM reuse check ────────────────────────────────────────────────
  // Skip the LLM call entirely if a previous run produced an identical prompt
  // with the same model. The reused DESIGN.md is copied verbatim.
  let canReuseLlm = false;
  const prevModel = readPrevTelemetryModel(previousRun);
  if (
    previousFresh && prevModel &&
    fs.existsSync(path.join(previousInputs, "prompt.txt")) &&
    fs.existsSync(path.join(previousRun, "DESIGN.md"))
  ) {
    const sameModel = !model || model === prevModel;
    if (sameModel) {
      const prevPrompt = fs.readFileSync(path.join(previousInputs, "prompt.txt"), "utf8");
      if (promptsEqual(prevPrompt, filled)) {
        fs.copyFileSync(path.join(previousRun, "DESIGN.md"), designMdPath);
        llmResult = { status: 0, stdout: "", stderr: "", usage: null };
        claudeMetadata = {
          input_tokens: 0,
          output_tokens: 0,
          cache_read_tokens: 0,
          cache_creation_tokens: 0,
          model: prevModel,
          turns_used: 0,
          error_max_turns: false,
        };
        designMd = fs.readFileSync(designMdPath, "utf8");
        canReuseLlm = true;
        reuseTrace.llm = "HIT";
        console.log(`     LLM — reused from ${path.basename(previousRun)} (model=${prevModel}, prompt unchanged)`);
      }
    }
  }

  if (!canReuseLlm) {
  // Attempt 1
  const { result: attempt1, httpRetried: httpRetried1 } = await invokeWithHttpRetry(filled, llmOptions, noLlmRetry);
  llmResult = attempt1;
  if (httpRetried1) {
    retries = 1;
    retryReasons.push("http_429");
  }

  if (resolvedProvider === "openrouter") {
    openrouterUsage = llmResult.usage || null;
    claudeMetadata = {
      input_tokens: openrouterUsage?.prompt_tokens ?? null,
      output_tokens: openrouterUsage?.completion_tokens ?? null,
      cache_read_tokens: null,
      cache_creation_tokens: null,
      model: null, // openrouter returns model in json — captured via usage
      turns_used: null,
      error_max_turns: false,
    };
  } else {
    claudeMetadata = parseClaudeCliStdout(llmResult.stdout);

    // Soft failure: claude-cli exits 1 specifically on max-turns. Do NOT throw
    // here — the failSignal check below will route to the retry path with
    // maxTurns 60 + reduced prompt. Hard-fail only on truly unexpected exits.
    if (llmResult.status !== 0 && !claudeMetadata.error_max_turns) {
      throw new Error(`claude -p exited with status ${llmResult.status}`);
    }
  }

  // DESIGN.md may not exist yet on max-turns failure — that's expected and the
  // retry path handles it. Only hard-fail if no max-turns soft failure either.
  if (!fs.existsSync(designMdPath)) {
    if (claudeMetadata.error_max_turns) {
      // Synthesize a placeholder so the failSignal check has something to read.
      // The retry will overwrite it.
      fs.writeFileSync(designMdPath, "---\nname: placeholder\n---\n");
    } else {
      console.error(`[!] DESIGN.md not produced at ${designMdPath}`);
      process.exit(2);
    }
  }

  designMd = fs.readFileSync(designMdPath, "utf8");

  // AC4.1 — provider-agnostic fail signal
  const sectionsCheck = validateDesignMdSections(designMd);
  maxTurnsHit = claudeMetadata.error_max_turns;
  const openrouterLengthHit = resolvedProvider === "openrouter" && llmResult.finishReason === "length";

  const failSignal =
    (resolvedProvider === "claude-cli" && claudeMetadata.error_max_turns) ||
    (resolvedProvider === "openrouter" && openrouterLengthHit) ||
    !sectionsCheck.valid;

  if (failSignal) {
    if (maxTurnsHit) {
      console.log(`     [!] LLM hit max-turns (30). ${noLlmRetry ? "Failing hard (--no-llm-retry)." : "Retrying with max-turns 60…"}`);
      retryReasons.push("error_max_turns");
    }
    if (openrouterLengthHit) {
      console.log(`     [!] OpenRouter finish_reason=length. ${noLlmRetry ? "Failing hard (--no-llm-retry)." : "Retrying with max_tokens 16384…"}`);
      retryReasons.push("length");
    }
    if (!sectionsCheck.valid) {
      console.log(`     [!] DESIGN.md missing sections: ${sectionsCheck.missing.join(", ")}. ${noLlmRetry ? "Failing hard (--no-llm-retry)." : "Retrying…"}`);
      retryReasons.push("sections_invalid");
    }

    if (noLlmRetry) {
      console.error(`[!] LLM validation failed. Missing sections: ${sectionsCheck.missing.join(", ")}`);
      console.error(`    Turns used: ${claudeMetadata.turns_used ?? "unknown"}`);
      console.error(`    CI mode (--no-llm-retry active): failing hard without retry.`);
      process.exit(5);
    }

    // Attempt 2 — AC4.2: reduced prompt for claude-cli, maxTokens 16384 for openrouter
    retries = Math.max(retries, 1);
    const retryMaxTokens = resolvedProvider === "openrouter" ? 16384 : maxTokens;
    const reducedFilled = promptTemplate
      .replace(/\{\{URL\}\}/g, args.url)
      .replace(/\{\{HTML_MD_PATH\}\}/g, path.join(inputsDir, "page.md"))
      .replace(/\{\{CSS_PATH\}\}/g, path.join(inputsDir, "css-for-llm.css"))
    .replace(/\{\{CSS_FULL_PATH\}\}/g, path.join(inputsDir, "css-collected.css"))
      .replace(/\{\{TOKENS_PATH\}\}/g, "") // drop tokens-detected to reduce context
      .replace(/\{\{CSS_VARS_PATH\}\}/g, path.join(inputsDir, "css-vars-detected.json"))
      .replace(/\{\{FONT_FACES_PATH\}\}/g, path.join(inputsDir, "font-faces.json"))
      .replace(/\{\{USAGE_GRAPH_PATH\}\}/g, "") // drop usage-graph to reduce context
      .replace(/\{\{COMPONENT_PROPS_PATH\}\}/g, path.join(inputsDir, "component-properties.json"))
      .replace(/\{\{STACK_PATH\}\}/g, path.join(inputsDir, "stack-summary.json"))
      .replace(/\{\{OUTPUT_PATH\}\}/g, designMdPath);

    const retryOptions = {
      ...llmOptions,
      maxTurns: 60,
      maxTokens: retryMaxTokens,
    };

    console.log(`     [retry] invoking LLM with reduced context…`);
    fs.writeFileSync(path.join(inputsDir, "prompt-retry.txt"), reducedFilled);

    const { result: attempt2 } = await invokeWithHttpRetry(reducedFilled, retryOptions, true);
    llmResult = attempt2;

    if (resolvedProvider === "openrouter") {
      openrouterUsage = llmResult.usage || openrouterUsage;
      claudeMetadata = {
        ...claudeMetadata,
        input_tokens: openrouterUsage?.prompt_tokens ?? claudeMetadata.input_tokens,
        output_tokens: openrouterUsage?.completion_tokens ?? claudeMetadata.output_tokens,
      };
    } else {
      claudeMetadata = parseClaudeCliStdout(llmResult.stdout);

      if (llmResult.status !== 0) {
        throw new Error(`claude -p retry exited with status ${llmResult.status}`);
      }
    }

    if (!fs.existsSync(designMdPath)) {
      console.error(`[!] DESIGN.md not produced after retry at ${designMdPath}`);
      process.exit(2);
    }

    designMd = fs.readFileSync(designMdPath, "utf8");
    const sectionsCheck2 = validateDesignMdSections(designMd);
    const maxTurnsHit2 = claudeMetadata.error_max_turns;
    const openrouterLengthHit2 = resolvedProvider === "openrouter" && llmResult.finishReason === "length";

    if (!sectionsCheck2.valid || maxTurnsHit2 || openrouterLengthHit2) {
      console.error(`[!] LLM exhausted budget on second attempt. Site may be too large.`);
      console.error(`    Missing sections: ${sectionsCheck2.missing.join(", ")}`);
      console.error(`    Turns used: ${claudeMetadata.turns_used ?? "unknown"}`);
      console.error(`    Suggestions: Try --max-tokens 16384 manually, or split the URL into sections.`);
      process.exit(5);
    }

    console.log(`     [retry] success — all required sections present`);
    maxTurnsHit = false;
  }
  } // close if (!canReuseLlm)

  timer.end("phase_6_llm");

  // Defensive normalization
  rawDesignMdForEvidence = designMd;
  const { md: normalized, changes: normChanges } = normalizeDesignMd(designMd);
  if (normChanges.length > 0) {
    fs.writeFileSync(path.join(inputsDir, "DESIGN.md.raw"), designMd);
    fs.writeFileSync(designMdPath, normalized);
    designMd = normalized;
    console.log(`     normalized: ${normChanges.length} change(s) applied (raw saved to inputs/DESIGN.md.raw)`);
    for (const c of normChanges.slice(0, 8)) console.log(`        · ${c}`);
    if (normChanges.length > 8) console.log(`        · …and ${normChanges.length - 8} more`);
  }

  const tokens = parseFrontmatter(designMd);
  if (tokens.__parseError) {
    console.warn(`[!] frontmatter parse degraded: ${tokens.__parseError}. Pipeline continues with empty tokens — quality score will reflect this.`);
  }

  // ── Enrichment (A) ───────────────────────────────────────────────
  // Promote detected data into tokens.components + emit tokens-extended.json.
  // This is purely deterministic — runs after every extraction with $0 LLM cost.
  const { buildEnrichment, applyEnrichmentToTokens } = require("./lib/enrich.cjs");
  const enrichment = buildEnrichment(outDir);
  applyEnrichmentToTokens(tokens, enrichment.componentsPatch);
  fs.writeFileSync(path.join(outDir, "tokens.json"), JSON.stringify(tokens, null, 2));
  fs.writeFileSync(path.join(outDir, "tokens-extended.json"), JSON.stringify(enrichment.extended, null, 2));
  const { buildRenderContractFromRunDir } = require("./lib/render-contract.cjs");
  const renderContract = buildRenderContractFromRunDir(outDir, { url: args.url });
  fs.writeFileSync(path.join(outDir, "render-contract.json"), JSON.stringify(renderContract, null, 2));
  const enrichSummary = [];
  if (enrichment.componentsPatch) enrichSummary.push(`components=${Object.keys(enrichment.componentsPatch).length}`);
  if (enrichment.extended.shadow) enrichSummary.push(`shadow=${Object.keys(enrichment.extended.shadow).length}`);
  if (enrichment.extended.motion) enrichSummary.push(`motion=${Object.keys(enrichment.extended.motion).filter(k => k.startsWith("duration") || k === "easing").length}`);
  if (enrichment.extended.meta?.style_archetype) enrichSummary.push(`archetype=${enrichment.extended.meta.style_archetype}`);
  if (renderContract.theme?.default_mode) enrichSummary.push(`render=${renderContract.theme.default_mode}${renderContract.theme.supports_dark ? "+toggle" : ""}`);
  console.log(`     enriched: ${enrichSummary.join(" · ")}`);

  // Pre-fetch fonts as data: URLs
  const requestedFamilies = Object.values(tokens?.typography || {})
    .map(t => String(t.fontFamily || "").split(",")[0].trim().replace(/['"]/g, ""))
    .filter(Boolean);
  console.log(`     embedding fonts (this may take a moment)…`);
  const embeddedFonts = await embedFontFiles(fontFaces, args.url, requestedFamilies);
  fs.writeFileSync(path.join(inputsDir, "embedded-fonts.json"), JSON.stringify(Object.keys(embeddedFonts).reduce((acc, url) => { acc[url] = `[${(embeddedFonts[url].length / 1024).toFixed(0)}KB data: URL]`; return acc; }, {}), null, 2));
  console.log(`     embedded ${Object.keys(embeddedFonts).length} font file(s)`);

  // Lint via @google/design.md
  const lintResult = runLint(designMdPath, repoRoot);
  fs.writeFileSync(path.join(outDir, "lint-report.json"), JSON.stringify(lintResult, null, 2));
  console.log(`     lint: ${lintResult.ran ? `${lintResult.errors_count}E ${lintResult.warnings_count}W` : `skipped (${lintResult.error})`}`);

  // ── Phase 7: Extraction log + quality score + drift + agent prompt ─
  timer.start("phase_7_log");
  const extractionLog = buildExtractionLog({
    url: args.url, designMd: rawDesignMdForEvidence || designMd, tokens, cssVars, fontFaces, usageGraph, cssMeta, lintResult,
  });
  fs.writeFileSync(path.join(outDir, "extraction-log.yaml"), YAML.stringify(extractionLog));
  console.log(`     confidence: high=${extractionLog.confidence_summary.high} medium=${extractionLog.confidence_summary.medium} low=${extractionLog.confidence_summary.low}`);

  const qualityScore = computeQualityScore(tokens, extractionLog, lintResult, cssVars, fontFaces);
  fs.writeFileSync(path.join(outDir, "quality-score.json"), JSON.stringify(qualityScore, null, 2));
  console.log(`     quality: ${qualityScore.grade} (${qualityScore.overall}/100) — ${Object.entries(qualityScore.categories).map(([k,v]) => `${k.split("_")[0]}=${v.grade}`).join(" ")}`);

  const agentPrompt = buildAgentPrompt({ url: args.url, designMd, tokens, pageCopy, brandName: tokens?.name });
  fs.writeFileSync(path.join(outDir, "agent-prompt.txt"), agentPrompt);
  console.log(`     agent-prompt: ${(agentPrompt.length / 1024).toFixed(1)}KB`);

  let driftReport = null;
  if (args.compare) {
    try {
      const localDesignMdPath = path.resolve(args.compare);
      if (!fs.existsSync(localDesignMdPath)) {
        console.log(`     drift: skipped (compare path not found: ${args.compare})`);
      } else {
        const localDesignMd = fs.readFileSync(localDesignMdPath, "utf8");
        const localTokens = parseFrontmatter(localDesignMd);
        if (localTokens.__parseError) {
          console.log(`     drift: skipped (could not parse YAML frontmatter from ${args.compare}: ${localTokens.__parseError})`);
        } else {
          driftReport = computeDrift(localTokens, tokens);
          driftReport.compared_against = localDesignMdPath;
          driftReport.live_url = args.url;
          fs.writeFileSync(path.join(outDir, "drift-report.json"), JSON.stringify(driftReport, null, 2));
          const s = driftReport.summary;
          console.log(`     drift: ${s.verdict.toUpperCase()} — ${s.total_drifted} drifted, ${s.total_added} added, ${s.total_removed} removed, ${s.total_matched} matched (score ${s.drift_score})`);
        }
      }
    } catch (err) {
      console.log(`     drift: error (${err.message})`);
    }
  }
  timer.end("phase_7_log");

  // ── Phase 8: Render preview.html ──────────────────────────────────
  console.log(`[7/8] rendering preview.html`);
  timer.start("phase_8_preview");
  const previewHtml = renderPreview({
    url: args.url,
    designMd,
    tokens,
    pageCopy,
    cssMeta,
    detected,
    cssVars,
    fontFaces,
    usageGraph,
    extractionLog,
    lintResult,
    favicon,
    qualityScore,
    driftReport,
    breakpoints,
    darkMode,
    logo,
    shadows,
    motion,
    embeddedFonts,
    agentPrompt,
    stack,
    styleFingerprint,
  });
  fs.writeFileSync(path.join(outDir, "preview.html"), previewHtml);
  timer.end("phase_8_preview");

  // ── R3: Telemetry output ──────────────────────────────────────────
  const wallClockMs = Date.now() - wallStart;
  const phaseReport = timer.report();

  // Cost estimation — prefer SDK usage, fallback to char-based
  let costEstimate;
  const llmModel = (resolvedProvider === "openrouter" && llmResult.usage)
    ? (model || process.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-haiku-4-5")
    : (claudeMetadata.model || "claude-opus-4-7");

  if (resolvedProvider === "openrouter" && openrouterUsage) {
    const orUsage = {
      input_tokens: openrouterUsage.prompt_tokens,
      output_tokens: openrouterUsage.completion_tokens,
    };
    costEstimate = estimateCost(orUsage, llmModel);
  } else if (claudeMetadata.input_tokens != null) {
    costEstimate = estimateCost(claudeMetadata, llmModel);
  } else {
    const promptChars = filled.length;
    const outputChars = designMd.length;
    costEstimate = estimateCostFromChars(promptChars, outputChars, llmModel);
  }

  const reusedFromSlug = previousRun ? path.basename(previousRun) : null;
  const reuseHits = Object.values(reuseTrace).filter((v) => v === "HIT").length;

  const telemetry = {
    schema_version: "1.0",
    url: args.url,
    provider: resolvedProvider,
    phases: phaseReport,
    wall_clock_ms: wallClockMs,
    reuse: {
      enabled: reuseEnabled,
      previous_run: reusedFromSlug,
      hits: reuseHits,
      trace: reuseTrace,
    },
    llm: {
      model: llmModel,
      provider: resolvedProvider,
      reused: reuseTrace.llm === "HIT",
      input_tokens: resolvedProvider === "openrouter"
        ? (openrouterUsage?.prompt_tokens ?? null)
        : claudeMetadata.input_tokens,
      output_tokens: resolvedProvider === "openrouter"
        ? (openrouterUsage?.completion_tokens ?? null)
        : claudeMetadata.output_tokens,
      cache_read_tokens: resolvedProvider === "claude-cli" ? claudeMetadata.cache_read_tokens : null,
      cache_creation_tokens: resolvedProvider === "claude-cli" ? claudeMetadata.cache_creation_tokens : null,
      turns_used: claudeMetadata.turns_used,
      retries,
      retry_reasons: retryReasons.length > 0 ? retryReasons : undefined,
      max_turns_hit: maxTurnsHit,
      cost_estimate: costEstimate,
    },
  };

  fs.writeFileSync(path.join(outDir, "telemetry.json"), JSON.stringify(telemetry, null, 2));

  // ── Promote-or-archive ───────────────────────────────────────────
  // If --out was specified, the user wants raw output exactly there — skip
  // the company-layout promotion step and leave files where they are.
  let finalDir = outDir;
  let promotion = null;
  if (!args.out) {
    promotion = promoteOrArchive({ companyDir, scratchDir: outDir, scratchTs: runTs });
    finalDir = promotion.promoted ? companyDir : path.join(companyDir, "history", runTs);
  }

  const finalDesignMd = path.join(finalDir, "DESIGN.md");
  const finalPreview = path.join(finalDir, "preview.html");
  const finalTelemetry = path.join(finalDir, "telemetry.json");

  console.log(`[8/8] done`);
  console.log(`     DESIGN.md  → ${finalDesignMd}`);
  console.log(`     preview    → ${finalPreview}`);
  console.log(`     telemetry  → ${finalTelemetry}`);

  const wallSec = (wallClockMs / 1000).toFixed(1);
  const costUsd = (costEstimate.usd ?? 0).toFixed(2);
  const modelShort = llmModel.replace("anthropic/", "").replace("claude-", "").replace(/-\d+$/, "");
  console.log(`[telemetry] wall=${wallSec}s · provider=${resolvedProvider} · llm=${modelShort} · ~$${costUsd} · ${retries} retries`);
  if (reuseHits > 0) {
    const trace = `fetch=${reuseTrace.fetch} collect=${reuseTrace.collect} detect=${reuseTrace.detect} markdown=${reuseTrace.markdown} llm=${reuseTrace.llm}`;
    console.log(`[reuse] ${reuseHits}/5 phases reused from ${reusedFromSlug} — ${trace}`);
  }
  if (promotion) {
    if (promotion.promoted) {
      const archived = promotion.archivedAs ? ` (previous best archived as history/${promotion.archivedAs})` : "";
      console.log(`[layout] promoted to ${company}/  score=${promotion.newScore.value.toFixed(1)}${archived}`);
    } else {
      console.log(`[layout] archived to ${company}/history/${runTs}  (score ${promotion.newScore.value.toFixed(1)} < previous ${promotion.prevScore.value.toFixed(1)})`);
    }
  }

  // Phase 9 (silent) — optional post-extract hook for downstream consumers
  // (galleries, indexers, deploy steps). Fire-and-forget: a missing script or
  // a non-zero exit does NOT fail the extract — the extract is the canonical
  // artifact, downstream views are derived. Set DESIGN_MD_POST_HOOK to an
  // executable script path to opt in. Skip entirely with DESIGN_MD_SKIP_HOOK=1.
  const postHook = process.env.DESIGN_MD_POST_HOOK;
  if (postHook && process.env.DESIGN_MD_SKIP_HOOK !== "1") {
    try {
      const { spawnSync } = require("child_process");
      if (fs.existsSync(postHook)) {
        const r = spawnSync("node", [postHook, outDir], {
          cwd: repoRoot,
          stdio: ["ignore", "pipe", "pipe"],
          encoding: "utf8",
          timeout: 30000,
        });
        if (r.status === 0) {
          const tail = (r.stdout || "").trim().split("\n").slice(-1)[0];
          if (tail) console.log(`[post-hook] ${tail}`);
        }
      }
    } catch { /* fire-and-forget */ }
  }
}

// Re-exports for external consumers (web playground, tests, governance scripts)
module.exports = {
  // High-level
  main,
  // Utils
  ...require("./lib/utils.cjs"),
  // Fetchers
  ...require("./lib/fetch.cjs"),
  // Extractors
  ...require("./lib/extractors.cjs"),
  // LLM
  ...require("./lib/llm.cjs"),
  // DESIGN.md pipeline
  ...require("./lib/design-md.cjs"),
  // Tokens prep for render
  ...require("./lib/tokens.cjs"),
  // Preview
  renderPreview: require("./lib/preview.cjs").renderPreview,
  // Render contract
  ...require("./lib/render-contract.cjs"),
  // Telemetry
  ...require("./lib/telemetry.cjs"),
};

// ── Crash context handler — saves debugging info on any failure ──────
// Without this, a crash post-Phase-2 leaves inputs/ populated but no
// top-level explanation. 4/25 historical runs had this exact symptom.
function saveCrashContext(err, ctx) {
  const crashFile = ctx.outDir
    ? path.join(ctx.outDir, "crash-context.json")
    : path.join(process.cwd(), `crash-context-${Date.now()}.json`);
  const payload = {
    schema_version: "1.0",
    crashed_at: new Date().toISOString(),
    last_phase: ctx.lastPhase || "unknown",
    completed_phases: ctx.completedPhases || {},
    error: {
      message: err.message,
      name: err.name,
      stack: err.stack ? err.stack.split("\n").slice(0, 10).join("\n") : null,
      code: err.code || null,
      exit_code: err.exitCode || null,
      details: err.details || null,
    },
    inputs: {
      url: ctx.url || null,
      out_dir: ctx.outDir || null,
      inputs_dir: ctx.inputsDir || null,
    },
    partial_outputs: ctx.outDir
      ? (() => { try { return require("fs").readdirSync(ctx.outDir); } catch { return []; } })()
      : [],
    debug_hint: getDebugHint(err, ctx.lastPhase),
  };
  try {
    require("fs").mkdirSync(path.dirname(crashFile), { recursive: true });
    require("fs").writeFileSync(crashFile, JSON.stringify(payload, null, 2));
    console.error(`[crash-context] saved to ${crashFile}`);
  } catch (writeErr) {
    console.error(`[crash-context] could not save (${writeErr.message}) — payload:`);
    console.error(JSON.stringify(payload, null, 2));
  }
}

function getDebugHint(err, lastPhase) {
  if (err.message?.includes("ECONNREFUSED") || err.message?.includes("ENOTFOUND")) {
    return "Network error reaching the URL. Check connectivity / DNS.";
  }
  if (err.message?.includes("max-turns") || err.message?.includes("budget")) {
    return "LLM hit max-turns budget. Increase --max-tokens or use --no-llm-retry to fail fast.";
  }
  if (err.code === "ENOENT" && err.message?.includes("prompt")) {
    return "Prompt template missing. Verify --prompt path or that data/url-extract-prompt.txt exists.";
  }
  if (lastPhase === "phase_6_llm") {
    return "LLM phase failed. Check ~/.claude/logs/ or claude-cli output. Often retryable.";
  }
  if (lastPhase === "phase_2_collect") {
    return "CSS collection failed. Site may block scrapers (403/cloudflare) or have huge CSS.";
  }
  if (lastPhase === "phase_1_fetch") {
    return "Initial HTTP fetch failed. Check URL accessibility and rate limits.";
  }
  return "Inspect inputs/ directory for partial state. Re-run with --no-llm-retry to fail fast.";
}

// Exposed for test consumers
module.exports.saveCrashContext = saveCrashContext;
module.exports.getDebugHint = getDebugHint;

if (require.main === module) {
  // Module-scoped crash context — main() populates it via process.__extractCrashCtx
  // so the catch handler always has access to last phase + outDir even on early failure.
  process.__extractCrashCtx = { timer: null, outDir: null, inputsDir: null, url: null };

  main().catch((err) => {
    console.error("[fatal]", err.message);
    if (err.stack) console.error(err.stack);
    const ctx = process.__extractCrashCtx || {};
    saveCrashContext(err, {
      url: ctx.url,
      outDir: ctx.outDir,
      inputsDir: ctx.inputsDir,
      lastPhase: ctx.timer?.currentPhase?.() || null,
      completedPhases: ctx.timer?.report?.() || {},
    });
    // PipelineError carries explicit exit code; generic errors → exit 1
    process.exit(err.exitCode || 1);
  });
}
