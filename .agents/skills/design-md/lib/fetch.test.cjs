// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

// Network-bound module — keep tests minimal (smoke + KNOWN_GOOGLE_FONTS surface).
// Real extraction is verified end-to-end by the smoke run in run.cjs.

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { fetchHtml, collectCss, fetchFavicon, fetchLogo, embedFontFiles, KNOWN_GOOGLE_FONTS, HEADER_WHITELIST } = require("./fetch.cjs");

test("module exports the expected surface", () => {
  assert.equal(typeof fetchHtml, "function");
  assert.equal(typeof collectCss, "function");
  assert.equal(typeof fetchFavicon, "function");
  assert.equal(typeof fetchLogo, "function");
  assert.equal(typeof embedFontFiles, "function");
});

test("KNOWN_GOOGLE_FONTS includes common families", () => {
  assert.ok(KNOWN_GOOGLE_FONTS.has("inter"));
  assert.ok(KNOWN_GOOGLE_FONTS.has("geist sans"));
  assert.ok(KNOWN_GOOGLE_FONTS.has("manrope"));
  assert.ok(!KNOWN_GOOGLE_FONTS.has("anthropic serif"));
  assert.ok(!KNOWN_GOOGLE_FONTS.has("sf pro display"));
});

test("fetchLogo returns null on empty html", async () => {
  const result = await fetchLogo("<html><body></body></html>", "https://example.com");
  assert.equal(result, null);
});

test("collectCss handles html with no stylesheets", async () => {
  const result = await collectCss("<html><body><h1>x</h1></body></html>", "https://example.com");
  assert.ok(typeof result.css === "string");
  assert.equal(result.meta.external.length, 0);
  assert.equal(result.meta.inline_style_blocks, 0);
});

test("collectCss captures inline <style>", async () => {
  const html = "<html><head><style>body { color: red; }</style></head><body></body></html>";
  const { css, meta } = await collectCss(html, "https://example.com");
  assert.match(css, /color: red/);
  assert.equal(meta.inline_style_blocks, 1);
});

test("collectCss captures style=\"\" attrs", async () => {
  const html = '<html><body><div style="color:blue">x</div></body></html>';
  const { meta } = await collectCss(html, "https://example.com");
  assert.equal(meta.inline_style_attrs, 1);
});

test("embedFontFiles returns empty for no fontFaces", async () => {
  const result = await embedFontFiles([], "https://example.com", ["Inter"]);
  assert.deepEqual(result, {});
});

// ── S6: fetchHtml returns { html, headers } shape ────────────────────

test("S6: HEADER_WHITELIST is exported and includes expected diagnostic keys", () => {
  assert.ok(Array.isArray(HEADER_WHITELIST));
  assert.ok(HEADER_WHITELIST.includes("server"));
  assert.ok(HEADER_WHITELIST.includes("x-vercel-id"));
  assert.ok(HEADER_WHITELIST.includes("cf-ray"));
  assert.ok(HEADER_WHITELIST.includes("x-powered-by"));
  // Sensitive headers must NOT be in whitelist
  assert.ok(!HEADER_WHITELIST.includes("cookie"));
  assert.ok(!HEADER_WHITELIST.includes("set-cookie"));
  assert.ok(!HEADER_WHITELIST.includes("authorization"));
});

test("S6: fetchHtml return type is object with html and headers keys", () => {
  // Structural test — we cannot make real network calls in unit tests,
  // but we can verify the function signature returns an object (Promise).
  // The actual { html, headers } shape is verified in smoke E2E runs.
  const promise = fetchHtml("https://this-domain-should-never-exist-12345.example");
  assert.equal(typeof promise.then, "function", "fetchHtml returns a Promise");
  // Absorb the expected rejection so it does not fail the test runner
  promise.catch(() => {});
});

test("S6: HEADER_WHITELIST does not contain sensitive header names", () => {
  const sensitiveNames = ["cookie", "set-cookie", "authorization", "x-auth-token", "proxy-authorization"];
  for (const name of sensitiveNames) {
    assert.ok(!HEADER_WHITELIST.includes(name), `Whitelist must not include '${name}'`);
  }
});
