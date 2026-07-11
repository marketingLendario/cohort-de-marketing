// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  classifySource, normalizeDesignMd, stripComponentsBlock,
  colorDistanceRgb, flattenAllColors, computeDrift,
  computeQualityScore, buildExtractionLog,
} = require("./design-md.cjs");

test("classifySource detects css_var", () => {
  assert.deepEqual(classifySource("# from --primary"), { source: "css_var", confidence: "high", origin: "--primary" });
});

test("classifySource detects @font-face", () => {
  const r = classifySource("# from @font-face declaration");
  assert.equal(r.source, "font_face");
  assert.equal(r.confidence, "high");
});

test("classifySource detects inferred", () => {
  const r = classifySource("# inferred from primary darker variant");
  assert.equal(r.source, "inferred");
  assert.equal(r.confidence, "low");
});

test("normalizeDesignMd drops alpha from 8-digit hex", () => {
  const md = `---
colors:
  border: "#1414131a"
---

## Body`;
  const { md: out, changes } = normalizeDesignMd(md);
  assert.match(out, /border: "#141413"/);
  assert.ok(changes.some(c => c.includes("alpha")));
});

test("normalizeDesignMd strips inline provenance comments from frontmatter", () => {
  const md = `---
colors:
  primary: "#ff0000"      # from --brand
  text: "#111111"         # inferred from body color
description: "Keep #hash inside quoted strings"
---

## Body`;
  const { md: out, changes } = normalizeDesignMd(md);
  assert.match(out, /primary: "#ff0000"\n/);
  assert.match(out, /text: "#111111"\n/);
  assert.match(out, /Keep #hash inside quoted strings/);
  assert.doesNotMatch(out, /from --brand/);
  assert.doesNotMatch(out, /inferred from body color/);
  assert.ok(changes.some(c => c.includes("provenance")));
});

test("normalizeDesignMd keeps unquoted hash values intact", () => {
  const md = `---
colors:
  primary: #ff0000
---`;
  const { md: out } = normalizeDesignMd(md);
  assert.match(out, /primary: #ff0000/);
});

test("normalizeDesignMd converts bare 0 to 0px in rounded", () => {
  const md = `---
rounded:
  none: 0
  sm: 4px
---`;
  const { md: out, changes } = normalizeDesignMd(md);
  assert.match(out, /none: "0px"/);
  assert.ok(changes.some(c => c.includes("bare 0")));
});

test("normalizeDesignMd converts 100vw to 9999px in rounded", () => {
  const md = `---
rounded:
  full: 100vw
---`;
  const { md: out } = normalizeDesignMd(md);
  assert.match(out, /full: "9999px"/);
});

test("normalizeDesignMd converts letterSpacing: normal to 0em", () => {
  const md = `---
typography:
  body:
    letterSpacing: normal
---`;
  const { md: out } = normalizeDesignMd(md);
  assert.match(out, /letterSpacing: "0em"/);
});

test("stripComponentsBlock removes nested components", () => {
  const md = `---
colors:
  primary: "#000"
components:
  button:
    primary:
      background: "#000"
typography:
  h1: {}
---

## Body`;
  const out = stripComponentsBlock(md);
  assert.doesNotMatch(out, /components:/);
  assert.match(out, /typography:/);
  assert.match(out, /primary: "#000"/);
});

test("normalizeDesignMd PRESERVES components: block (Phase 2 reversal)", () => {
  // Pre-Phase-2 behavior: normalizeDesignMd stripped components: as v0.1.0
  // lint workaround. Phase 2 REVERSED that — strip moved to runLint via
  // a temp file. Canonical output must retain components:.
  // See docs/sessions/2026-04/2026-04-29-roundtable-design-pipeline.md C1, A2.
  const md = `---
colors:
  primary: "#FF6200"
components:
  button-primary:
    bg: "#FF6200"
    text: "#FFFFFF"
    radius: "12px"
typography:
  h1: {}
---

## 1. Visual Theme & Atmosphere`;
  const { md: out, changes } = normalizeDesignMd(md);
  assert.match(out, /components:/, "components: must survive normalize");
  assert.match(out, /button-primary:/, "atom keys must survive");
  assert.match(out, /bg: "#FF6200"/, "atom values must survive");
  assert.match(out, /typography:/, "downstream blocks must survive");
  assert.ok(!changes.some((c) => /removed.*components/i.test(c)), "must not log a strip change");
});

test("colorDistanceRgb returns 0 for identical, finite for different", () => {
  assert.equal(colorDistanceRgb("#000000", "#000000"), 0);
  assert.ok(colorDistanceRgb("#ff0000", "#00ff00") > 0);
  assert.equal(colorDistanceRgb("invalid", "#fff"), Infinity);
});

test("flattenAllColors recursively walks nested objects", () => {
  const colors = {
    primary: "#ff0000",
    nested: { a: "#00ff00", b: { c: "#0000ff" } },
  };
  const flat = flattenAllColors(colors);
  assert.equal(flat.primary, "#ff0000");
  assert.equal(flat["nested.a"], "#00ff00");
  assert.equal(flat["nested.b.c"], "#0000ff");
});

test("computeDrift returns in-sync verdict for identical tokens", () => {
  const tokens = { colors: { primary: "#ff0000" }, typography: {}, rounded: {}, spacing: {} };
  const r = computeDrift(tokens, tokens);
  assert.equal(r.summary.verdict, "in-sync");
  assert.equal(r.summary.drift_score, 0);
});

test("computeDrift detects color drift", () => {
  const local = { colors: { primary: "#ff0000", secondary: "#000000" }, typography: {}, rounded: {}, spacing: {} };
  const live = { colors: { primary: "#00ff00", secondary: "#ffffff" }, typography: {}, rounded: {}, spacing: {} };
  const r = computeDrift(local, live);
  assert.equal(r.colors.drifted.length, 2);
  // 2 drifted * 2 weight = 4 score → "minor-drift" (>=3)
  assert.notEqual(r.summary.verdict, "in-sync");
});

test("computeDrift detects added/removed tokens", () => {
  const local = { colors: { primary: "#ff0000", removed: "#000000" }, typography: {}, rounded: {}, spacing: {} };
  const live = { colors: { primary: "#ff0000", added: "#ffffff" }, typography: {}, rounded: {}, spacing: {} };
  const r = computeDrift(local, live);
  assert.equal(r.colors.added.length, 1);
  assert.equal(r.colors.removed.length, 1);
});

test("computeQualityScore returns A+grade and overall 0-100", () => {
  const tokens = {
    colors: { primary: "#000000", surface: "#ffffff", text: "#111111" },
    typography: { h1: { fontFamily: "Inter", fontSize: "48px", fontWeight: 700 }, "body-md": { fontFamily: "Inter", fontSize: "16px" }, h2: {}, h3: {} },
    rounded: { sm: "4px", md: "8px", lg: "12px" },
    spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px" },
  };
  const log = { confidence_summary: { high: 10, medium: 0, low: 0 } };
  const lint = { ran: true, errors_count: 0, warnings_count: 0 };
  const score = computeQualityScore(tokens, log, lint, [], []);
  assert.ok(score.overall >= 0 && score.overall <= 100);
  assert.match(score.grade, /^[A-F]$/);
  assert.equal(typeof score.categories.color_discipline.grade, "string");
});

test("buildExtractionLog parses inline provenance comments", () => {
  const md = `---
name: Test
colors:
  primary: "#ff0000"      # from --brand
  secondary: "#00ff00"    # inferred from primary
---

## Body`;
  const log = buildExtractionLog({
    url: "https://x.com",
    designMd: md,
    tokens: {},
    cssVars: [],
    fontFaces: [],
    usageGraph: [],
    cssMeta: { external: [], inline_style_blocks: 0, inline_style_attrs: 0 },
    lintResult: null,
  });
  assert.equal(log.tokens.colors.primary.value, "#ff0000");
  assert.equal(log.tokens.colors.primary.confidence, "high");
  assert.equal(log.tokens.colors.secondary.confidence, "low");
});
