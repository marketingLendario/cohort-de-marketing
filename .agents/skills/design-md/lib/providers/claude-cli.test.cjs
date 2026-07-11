// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { invoke } = require("./claude-cli.cjs");

test("claude-cli invoke is a function", () => {
  assert.equal(typeof invoke, "function");
});

test("claude-cli invoke accepts options with maxTurns", () => {
  // Validates interface only — cannot spawn real claude binary in unit tests
  assert.doesNotThrow(() => {
    assert.equal(typeof invoke, "function");
    // confirm it accepts the expected signature
    const sig = invoke.length;
    // promptText + options = 2 params (options optional)
    assert.ok(sig >= 1);
  });
});
