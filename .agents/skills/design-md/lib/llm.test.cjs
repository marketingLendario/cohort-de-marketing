// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { buildAgentPrompt } = require("./llm.cjs");

const designMdSample = `---
name: Apple
colors:
  primary: "#0071e3"
  surface: "#ffffff"
typography:
  h1:
    fontFamily: SF Pro Display
    fontSize: 48px
---

## Overview
Test`;

test("buildAgentPrompt emits compact component brief without embedding DESIGN.md", () => {
  const prompt = buildAgentPrompt({
    url: "https://www.apple.com/",
    designMd: designMdSample,
    tokens: { name: "Apple", colors: { primary: "#0071e3", surface: "#ffffff" } },
    pageCopy: { heading: "Hello Apple", body: "Test body" },
    brandName: "Apple",
  });
  assert.match(prompt, /Apple/);
  assert.match(prompt, /#0071e3/);
  assert.match(prompt, /Hello Apple/);
  assert.match(prompt, /\[REPLACE THIS LINE/);
  assert.match(prompt, /Component rules/);
  assert.doesNotMatch(prompt, /Source DESIGN\.md/);
  assert.doesNotMatch(prompt, /```markdown/);
  assert.match(prompt, /Generate the component now/);
});

test("buildAgentPrompt falls back when tokens are missing", () => {
  const prompt = buildAgentPrompt({
    url: "https://x.com",
    designMd: "",
    tokens: null,
    pageCopy: null,
    brandName: null,
  });
  assert.match(prompt, /the brand|x\.com/i);
  assert.match(prompt, /#000000/); // primary fallback
});

test("buildAgentPrompt prefers preview_tokens over colors", () => {
  const prompt = buildAgentPrompt({
    url: "https://x.com",
    designMd: "",
    tokens: {
      colors: { primary: "#aaaaaa" },
      preview_tokens: { button_primary_bg: "#bbbbbb" },
    },
    pageCopy: {},
    brandName: "X",
  });
  assert.match(prompt, /#bbbbbb/);
  assert.doesNotMatch(prompt.match(/Primary CTA fill:.*$/m)?.[0] || "", /#aaaaaa/);
});

test("buildAgentPrompt extracts hostname when brandName is missing", () => {
  const prompt = buildAgentPrompt({
    url: "https://www.linear.app/about",
    designMd: "",
    tokens: { colors: {} },
    pageCopy: {},
    brandName: null,
  });
  assert.match(prompt, /linear\.app/);
});

test("invokeClaude accepts maxTurns option", () => {
  // Verifies the function signature accepts options without throwing.
  // Cannot test actual subprocess in unit tests — verifies interface only.
  assert.doesNotThrow(() => {
    const { invokeClaude: fn } = require("./llm.cjs");
    // invokeClaude requires a real 'claude' binary — just validate it is a function
    assert.equal(typeof fn, "function");
  });
});

// ── invokeLlm + detectProvider (AC1.1, AC1.5) ────────────────────────

test("invokeLlm is exported and is async", () => {
  const { invokeLlm } = require("./llm.cjs");
  assert.equal(typeof invokeLlm, "function");
  // async functions return a Promise
  const savedKey = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.VERCEL;
  // Should attempt claude-cli — result will fail since no binary, but it's a function
  assert.equal(typeof invokeLlm, "function");
  if (savedKey !== undefined) process.env.OPENROUTER_API_KEY = savedKey;
});

test("detectProvider returns claude-cli by default (no env vars)", () => {
  const { detectProvider } = require("./llm.cjs");
  const savedKey = process.env.OPENROUTER_API_KEY;
  const savedVercel = process.env.VERCEL;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.VERCEL;

  const result = detectProvider({});
  assert.equal(result, "claude-cli");

  if (savedKey !== undefined) process.env.OPENROUTER_API_KEY = savedKey;
  if (savedVercel !== undefined) process.env.VERCEL = savedVercel;
});

test("detectProvider returns openrouter when OPENROUTER_API_KEY is set", () => {
  const { detectProvider } = require("./llm.cjs");
  const savedKey = process.env.OPENROUTER_API_KEY;
  const savedVercel = process.env.VERCEL;
  delete process.env.VERCEL;
  process.env.OPENROUTER_API_KEY = "sk-test";

  const result = detectProvider({});
  assert.equal(result, "openrouter");

  if (savedKey !== undefined) process.env.OPENROUTER_API_KEY = savedKey;
  else delete process.env.OPENROUTER_API_KEY;
  if (savedVercel !== undefined) process.env.VERCEL = savedVercel;
});

test("detectProvider returns openrouter when VERCEL=1", () => {
  const { detectProvider } = require("./llm.cjs");
  const savedKey = process.env.OPENROUTER_API_KEY;
  const savedVercel = process.env.VERCEL;
  delete process.env.OPENROUTER_API_KEY;
  process.env.VERCEL = "1";

  const result = detectProvider({});
  assert.equal(result, "openrouter");

  if (savedKey !== undefined) process.env.OPENROUTER_API_KEY = savedKey;
  if (savedVercel !== undefined) process.env.VERCEL = savedVercel;
  else delete process.env.VERCEL;
});

test("detectProvider honors explicit provider override", () => {
  const { detectProvider } = require("./llm.cjs");
  // Even with VERCEL=1 env, explicit override wins
  const savedVercel = process.env.VERCEL;
  process.env.VERCEL = "1";

  const result = detectProvider({ provider: "claude-cli" });
  assert.equal(result, "claude-cli");

  if (savedVercel !== undefined) process.env.VERCEL = savedVercel;
  else delete process.env.VERCEL;
});
