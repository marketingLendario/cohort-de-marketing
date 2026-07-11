// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const assert = require("node:assert/strict");
const { test, mock, beforeEach, afterEach } = require("node:test");

// ── Helpers ──────────────────────────────────────────────────────────
function makeFetchMock(status, jsonBody, ok = true) {
  return async () => ({
    ok,
    status,
    json: async () => jsonBody,
    text: async () => JSON.stringify(jsonBody),
  });
}

function makeOpenRouterResponse(content, finishReason = "stop", promptTokens = 100, completionTokens = 200) {
  return {
    id: "test-id",
    model: "anthropic/claude-haiku-4-5",
    choices: [{ message: { role: "assistant", content }, finish_reason: finishReason }],
    usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens },
  };
}

// ── Tests ────────────────────────────────────────────────────────────

test("openrouter invoke exits 6 when OPENROUTER_API_KEY not set", async () => {
  const originalKey = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;

  let exitCode = null;
  const originalExit = process.exit;
  process.exit = (code) => { exitCode = code; throw new Error(`process.exit(${code})`); };

  try {
    const { invoke } = require("./openrouter.cjs");
    await invoke("test prompt", {});
  } catch (err) {
    // expected — process.exit throws in test
  } finally {
    process.exit = originalExit;
    if (originalKey !== undefined) process.env.OPENROUTER_API_KEY = originalKey;
  }

  assert.equal(exitCode, 6);
});

test("openrouter invoke returns content on success", async () => {
  process.env.OPENROUTER_API_KEY = "sk-test-key";
  const fs = require("fs");
  const tmpPath = `/tmp/openrouter-test-${Date.now()}.md`;

  const responseBody = makeOpenRouterResponse("# Design\n## Overview\nTest content");

  global.fetch = makeFetchMock(200, responseBody, true);

  try {
    // Clear module cache to pick up env change
    delete require.cache[require.resolve("./openrouter.cjs")];
    const { invoke } = require("./openrouter.cjs");
    const result = await invoke("test prompt", { designMdPath: tmpPath });

    assert.equal(result.status, 0);
    assert.equal(result.finishReason, "stop");
    assert.ok(result.stdout.includes("Design"));
    assert.ok(fs.existsSync(tmpPath), "DESIGN.md should be written to disk");
    assert.ok(fs.readFileSync(tmpPath, "utf8").includes("Design"));
  } finally {
    delete global.fetch;
    delete process.env.OPENROUTER_API_KEY;
    try { fs.unlinkSync(tmpPath); } catch {}
    delete require.cache[require.resolve("./openrouter.cjs")];
  }
});

test("openrouter invoke returns error on HTTP 429", async () => {
  process.env.OPENROUTER_API_KEY = "sk-test-key";

  global.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ error: "rate limit" }),
    text: async () => "rate limit exceeded",
  });

  try {
    delete require.cache[require.resolve("./openrouter.cjs")];
    const { invoke } = require("./openrouter.cjs");
    const result = await invoke("test prompt", {});

    assert.equal(result.status, 1);
    assert.equal(result.httpStatus, 429);
    assert.ok(result.stderr.includes("429"));
  } finally {
    delete global.fetch;
    delete process.env.OPENROUTER_API_KEY;
    delete require.cache[require.resolve("./openrouter.cjs")];
  }
});

test("openrouter invoke returns error on HTTP 500", async () => {
  process.env.OPENROUTER_API_KEY = "sk-test-key";

  global.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: "server error" }),
    text: async () => "internal server error",
  });

  try {
    delete require.cache[require.resolve("./openrouter.cjs")];
    const { invoke } = require("./openrouter.cjs");
    const result = await invoke("test prompt", {});

    assert.equal(result.status, 1);
    assert.equal(result.httpStatus, 500);
    assert.ok(result.stderr.includes("500"));
  } finally {
    delete global.fetch;
    delete process.env.OPENROUTER_API_KEY;
    delete require.cache[require.resolve("./openrouter.cjs")];
  }
});

test("openrouter invoke handles finish_reason=length", async () => {
  process.env.OPENROUTER_API_KEY = "sk-test-key";

  const responseBody = makeOpenRouterResponse("partial content", "length");
  global.fetch = makeFetchMock(200, responseBody, true);

  try {
    delete require.cache[require.resolve("./openrouter.cjs")];
    const { invoke } = require("./openrouter.cjs");
    const result = await invoke("test prompt", {});

    assert.equal(result.status, 0);
    assert.equal(result.finishReason, "length");
  } finally {
    delete global.fetch;
    delete process.env.OPENROUTER_API_KEY;
    delete require.cache[require.resolve("./openrouter.cjs")];
  }
});

test("openrouter invoke handles network error gracefully", async () => {
  process.env.OPENROUTER_API_KEY = "sk-test-key";

  global.fetch = async () => { throw new Error("network failure"); };

  try {
    delete require.cache[require.resolve("./openrouter.cjs")];
    const { invoke } = require("./openrouter.cjs");
    const result = await invoke("test prompt", {});

    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes("network failure"));
    assert.equal(result.httpStatus, null);
  } finally {
    delete global.fetch;
    delete process.env.OPENROUTER_API_KEY;
    delete require.cache[require.resolve("./openrouter.cjs")];
  }
});

test("openrouter OPENROUTER_DEFAULT_MODEL exported", () => {
  delete require.cache[require.resolve("./openrouter.cjs")];
  const { OPENROUTER_DEFAULT_MODEL } = require("./openrouter.cjs");
  assert.equal(typeof OPENROUTER_DEFAULT_MODEL, "string");
  assert.ok(OPENROUTER_DEFAULT_MODEL.length > 0);
  delete require.cache[require.resolve("./openrouter.cjs")];
});
