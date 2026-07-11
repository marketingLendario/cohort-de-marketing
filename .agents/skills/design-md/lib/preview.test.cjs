// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { renderPreview } = require("./preview.cjs");

test("renderPreview produces valid HTML with minimal inputs", () => {
  const html = renderPreview({
    url: "https://example.com",
    designMd: `---
name: Example
colors:
  primary: "#ff0000"
  surface: "#ffffff"
typography:
  h1:
    fontFamily: Inter
    fontSize: 48px
rounded:
  md: 8px
spacing:
  md: 16px
---

## Overview
Test`,
    tokens: {
      name: "Example",
      colors: { primary: "#ff0000", surface: "#ffffff" },
      typography: { h1: { fontFamily: "Inter", fontSize: "48px", fontWeight: 700 } },
      rounded: { md: "8px" },
      spacing: { md: "16px" },
    },
    pageCopy: { heading: "Test heading", body: "Body line" },
    cssMeta: { external: [], preload: [], inline_style_blocks: 0, inline_style_attrs: 0, failed: [] },
    detected: { colors: { hex: ["#ff0000"], hex_usage: { "#ff0000": 1 }, rgb: [], hsl: [] }, typography: { family: ["Inter"], size: [], weight: [], line_height: [] }, radii: [], spacing: [] },
    cssVars: [],
    fontFaces: [],
    usageGraph: [],
  });

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /Example/);
  assert.match(html, /#ff0000/);
  assert.match(html, /<\/html>/);
});

// Helper builder for minimal-but-complete renderPreview args
function minimalArgs(overrides = {}) {
  return {
    url: "https://x.com",
    designMd: "---\nname: X\n---\n\n## Body",
    tokens: { colors: {}, typography: {}, rounded: {}, spacing: {} },
    pageCopy: {},
    cssMeta: { external: [], preload: [], inline_style_blocks: 0, inline_style_attrs: 0, failed: [] },
    detected: { colors: { hex: [], hex_usage: {}, rgb: [], hsl: [] }, typography: { family: [], size: [], weight: [], line_height: [] }, radii: [], spacing: [] },
    cssVars: [],
    fontFaces: [],
    usageGraph: [],
    ...overrides,
  };
}

test("renderPreview includes lint badge when lintResult provided", () => {
  const html = renderPreview(minimalArgs({
    lintResult: { ran: true, errors_count: 0, warnings_count: 0 },
  }));
  assert.match(html, /lint:\s*pass/i);
});

test("renderPreview embeds agent prompt in script", () => {
  const html = renderPreview(minimalArgs({
    agentPrompt: "Test agent prompt content",
  }));
  assert.match(html, /Test agent prompt content/);
});

test("renderPreview shows stack signals when stack is provided", () => {
  const html = renderPreview(minimalArgs({
    stack: [{ name: "Next.js", kind: "framework", evidence: "test", confidence: "high" }],
  }));
  assert.match(html, /Next\.js/);
});
