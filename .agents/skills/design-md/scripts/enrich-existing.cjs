#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

/**
 * enrich-existing — apply enrichment to extracts that already exist.
 *
 * For each {company}/ root and each {company}/history/{ts}/, regenerate
 * tokens.json (with components patch) and tokens-extended.json from the
 * detection JSON files already on disk. Zero LLM cost.
 *
 * Usage:
 *   node scripts/enrich-existing.cjs              # process all companies
 *   node scripts/enrich-existing.cjs anthropic    # one company only
 *   node scripts/enrich-existing.cjs --no-history # skip history dirs
 *
 * Override the outputs root by setting DESIGN_MD_OUTPUTS_DIR=/abs/path,
 * otherwise resolves to <CWD>/outputs/design-md/.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const { buildEnrichment, applyEnrichmentToTokens } = require("../lib/enrich.cjs");
const { buildRenderContractFromRunDir } = require("../lib/render-contract.cjs");
const {
  detectGradients,
  detectBackdropBlur,
  detectZIndex,
  detectContainerMaxWidth,
  detectOpacityScale,
  detectFocusRing,
  detectComponentProperties,
  detectBreakpoints,
  detectDefaultTheme,
} = require("../lib/extractors.cjs");

// Re-run static detectors. Always overwrites — the detector logic evolves
// (e.g. modern @media syntax, broader component selectors, lifted variants).
function backfillDetectors(runDir) {
  const cssPath = path.join(runDir, "inputs", "css-collected.css");
  if (!fs.existsSync(cssPath)) return { skipped: true };
  const css = fs.readFileSync(cssPath, "utf8");
  const inputs = path.join(runDir, "inputs");
  const wrote = [];
  const write = (rel, data) => {
    fs.writeFileSync(path.join(inputs, rel), JSON.stringify(data, null, 2));
    wrote.push(rel);
  };
  write("gradients.json", detectGradients(css));
  write("backdrop-blur.json", detectBackdropBlur(css));
  write("z-index.json", detectZIndex(css));
  write("container.json", detectContainerMaxWidth(css));
  write("opacity-scale.json", detectOpacityScale(css) || { all: [] });
  write("focus-ring.json", detectFocusRing(css));
  write("breakpoints.json", detectBreakpoints(css));
  write("component-properties.json", detectComponentProperties(css));
  // Theme default (v1.1) — read HTML + CSS so the detector can fall back to
  // background-var luminance when no explicit HTML signal is present
  // (Tailwind/Next sites that toggle `.dark` on the client).
  const htmlPath = path.join(inputs, "page.html");
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, "utf8");
    write("theme-default.json", detectDefaultTheme(html, css));
  }
  return { wrote };
}

function findRepoRoot(start) {
  let dir = path.resolve(start);
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function enrichOne(runDir) {
  const tokensPath = path.join(runDir, "tokens.json");
  if (!fs.existsSync(tokensPath)) {
    return { runDir, skipped: true, reason: "no-tokens-json" };
  }
  let tokens;
  try { tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8")); } catch (err) {
    return { runDir, skipped: true, reason: "tokens-parse-error: " + err.message };
  }
  // First run any missing static detectors (B1) and refresh component-properties (B2)
  const detectorResult = backfillDetectors(runDir);
  // Then enrich
  const enrichment = buildEnrichment(runDir);
  applyEnrichmentToTokens(tokens, enrichment.componentsPatch);
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
  fs.writeFileSync(path.join(runDir, "tokens-extended.json"), JSON.stringify(enrichment.extended, null, 2));
  const renderContract = buildRenderContractFromRunDir(runDir);
  fs.writeFileSync(path.join(runDir, "render-contract.json"), JSON.stringify(renderContract, null, 2));

  return {
    runDir,
    components: enrichment.componentsPatch ? Object.keys(enrichment.componentsPatch).length : 0,
    shadow: enrichment.extended.shadow ? Object.keys(enrichment.extended.shadow).length : 0,
    motion: enrichment.extended.motion ? Object.keys(enrichment.extended.motion).filter(k => k.startsWith("duration") || k === "easing").length : 0,
    gradient: !!enrichment.extended.gradient,
    backdrop_blur: !!enrichment.extended.backdrop_blur,
    z_index: !!enrichment.extended.z_index,
    container: !!enrichment.extended.container,
    opacity: !!enrichment.extended.opacity,
    focus_ring: !!enrichment.extended.focus_ring,
    archetype: enrichment.extended.meta?.style_archetype || null,
    density: enrichment.extended.meta?.density || null,
    motion_pref: enrichment.extended.meta?.motion_preference || null,
    render_mode: renderContract.theme?.default_mode || null,
    render_toggle: !!renderContract.theme?.supports_dark,
    detectors_wrote: detectorResult.wrote || [],
  };
}

function main() {
  const args = process.argv.slice(2);
  const noHistory = args.includes("--no-history");
  const onlyCompanies = args.filter((a) => !a.startsWith("--"));

  const repoRoot = findRepoRoot(process.cwd());
  const extractsRoot =
    process.env.DESIGN_MD_OUTPUTS_DIR ||
    path.join(repoRoot, "outputs", "design-md");
  if (!fs.existsSync(extractsRoot)) {
    console.error(`[!] not found: ${extractsRoot}`);
    process.exit(3);
  }

  let companies = fs.readdirSync(extractsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name);
  if (onlyCompanies.length > 0) {
    companies = companies.filter((c) => onlyCompanies.includes(c));
  }

  let processed = 0, skipped = 0;
  for (const c of companies) {
    const companyDir = path.join(extractsRoot, c);
    console.log(`\n[${c}]`);
    const rootResult = enrichOne(companyDir);
    if (rootResult.skipped) {
      console.log(`  root: skipped (${rootResult.reason})`);
      skipped++;
    } else {
      const extras = [
        rootResult.gradient && "gradient",
        rootResult.backdrop_blur && "backdrop_blur",
        rootResult.z_index && "z_index",
        rootResult.container && "container",
        rootResult.opacity && "opacity",
        rootResult.focus_ring && "focus_ring",
      ].filter(Boolean).join(",");
      console.log(`  root: comps=${rootResult.components} shadow=${rootResult.shadow} motion=${rootResult.motion} archetype=${rootResult.archetype} density=${rootResult.density} mp=${rootResult.motion_pref} render=${rootResult.render_mode}${rootResult.render_toggle ? "+toggle" : ""} extras=[${extras}]`);
      processed++;
    }
    if (noHistory) continue;
    const historyDir = path.join(companyDir, "history");
    if (!fs.existsSync(historyDir)) continue;
    const histEntries = fs.readdirSync(historyDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    for (const h of histEntries) {
      const hDir = path.join(historyDir, h);
      const r = enrichOne(hDir);
      if (r.skipped) {
        skipped++;
      } else {
        processed++;
        console.log(`  history/${h}: components=${r.components} shadow=${r.shadow} motion=${r.motion}`);
      }
    }
  }
  console.log(`\n[done] processed=${processed}  skipped=${skipped}`);
}

if (require.main === module) main();

module.exports = { enrichOne };
