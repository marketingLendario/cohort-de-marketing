// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

// Lightweight test runner — no framework dep, runs as `node lib/utils.test.cjs`.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseArgs, slugifyHost, timestamp, parsePx, colorToHex, parseFrontmatter, safeHtml } = require("./utils.cjs");

test("parseArgs picks up --url", () => {
  const a = parseArgs(["node", "run", "--url", "https://x.com"]);
  assert.equal(a.url, "https://x.com");
});

test("parseArgs picks up positional URL", () => {
  const a = parseArgs(["node", "run", "https://y.com"]);
  assert.equal(a.url, "https://y.com");
});

test("parseArgs picks up --compare", () => {
  const a = parseArgs(["node", "run", "--url", "x", "--compare", "DESIGN.md"]);
  assert.equal(a.compare, "DESIGN.md");
});

test("slugifyHost normalizes www", () => {
  assert.equal(slugifyHost("https://www.apple.com/"), "www-apple-com");
  assert.equal(slugifyHost("https://brand.acme.com/x"), "brand-acme-com");
});

test("slugifyHost handles invalid url", () => {
  assert.equal(slugifyHost("not a url"), "extract");
});

test("timestamp returns 15-char string", () => {
  const t = timestamp();
  assert.match(t, /^\d{8}-\d{6}$/);
});

test("parsePx handles px / rem / bare number", () => {
  assert.equal(parsePx("8px"), 8);
  assert.equal(parsePx("1rem"), 16);
  assert.equal(parsePx("0.5em"), 8);
  assert.equal(parsePx("12"), 12);
  assert.equal(parsePx(null), null);
  assert.equal(parsePx("auto"), null);
});

test("colorToHex normalizes 3/6/8 hex", () => {
  assert.equal(colorToHex("#abc"), "#aabbcc");
  assert.equal(colorToHex("#aabbcc"), "#aabbcc");
  assert.equal(colorToHex("#aabbccdd"), "#aabbcc"); // alpha stripped
});

test("colorToHex converts rgb/rgba", () => {
  assert.equal(colorToHex("rgb(0, 113, 227)"), "#0071e3");
  assert.equal(colorToHex("rgba(20, 20, 19, 0.1)"), "#141413");
});

test("colorToHex converts hsl", () => {
  // hsl(0, 100%, 50%) = pure red
  assert.equal(colorToHex("hsl(0, 100%, 50%)"), "#ff0000");
});

test("colorToHex returns null for keywords", () => {
  assert.equal(colorToHex("transparent"), null);
  assert.equal(colorToHex("currentcolor"), null);
  assert.equal(colorToHex(""), null);
  assert.equal(colorToHex(null), null);
});

test("parseFrontmatter extracts YAML block", () => {
  const md = "---\nname: Test\ncolors:\n  primary: '#ff0000'\n---\n\n## Body";
  const t = parseFrontmatter(md);
  assert.equal(t.name, "Test");
  assert.equal(t.colors.primary, "#ff0000");
  assert.equal(t.__parseError, undefined);
});

test("parseFrontmatter returns object with __parseError when no ---", () => {
  const t = parseFrontmatter("# just markdown");
  assert.ok(t && typeof t === "object", "must return an object");
  assert.match(t.__parseError, /no frontmatter delimiter/);
});

test("parseFrontmatter returns object with __parseError when frontmatter unterminated", () => {
  const t = parseFrontmatter("---\nname: Test\n# no closing fence");
  assert.match(t.__parseError, /unterminated frontmatter/);
});

test("parseFrontmatter returns object with __parseError on invalid YAML", () => {
  // YAML parser tolerates many things; force a parse error with a known-bad block
  const t = parseFrontmatter("---\nname: 'unclosed string\nfoo: bar\n---");
  assert.ok(t && typeof t === "object");
  assert.ok(t.__parseError, "must surface parse error");
});

test("parseFrontmatter never returns null (downstream contract)", () => {
  // Downstream code relies on `tokens.colors`-style access. parseFrontmatter
  // must always return a usable object so destructuring/property access never
  // throws on malformed input.
  const cases = [
    "# no frontmatter",
    "---\nunterminated",
    "",
    "---\n---",
  ];
  for (const md of cases) {
    const t = parseFrontmatter(md);
    assert.notEqual(t, null, `parseFrontmatter(${JSON.stringify(md.slice(0, 30))}) returned null`);
    assert.equal(typeof t, "object");
  }
});

test("safeHtml escapes special chars", () => {
  assert.equal(safeHtml('<a href="x">&'), "&lt;a href=&quot;x&quot;&gt;&amp;");
  assert.equal(safeHtml("'foo'"), "&#39;foo&#39;");
  assert.equal(safeHtml(null), "");
});

test("parseArgs handles --no-content-gate flag", () => {
  const a = parseArgs(["node", "run", "--url", "https://x.com", "--no-content-gate"]);
  assert.equal(a["no-content-gate"], true);
});

test("parseArgs handles --no-llm-retry flag", () => {
  const a = parseArgs(["node", "run", "--url", "https://x.com", "--no-llm-retry"]);
  assert.equal(a["no-llm-retry"], true);
});

test("parseArgs defaults boolean flags to false", () => {
  const a = parseArgs(["node", "run", "--url", "https://x.com"]);
  assert.equal(a["no-content-gate"], false);
  assert.equal(a["no-llm-retry"], false);
});

// ── New flags: --provider, --model, --max-tokens (AC2.1, AC2.2, AC2.3) ──

test("parseArgs --provider sets provider string", () => {
  const a = parseArgs(["node", "run", "--url", "x", "--provider", "openrouter"]);
  assert.equal(a.provider, "openrouter");
});

test("parseArgs --provider claude-cli sets provider string", () => {
  const a = parseArgs(["node", "run", "--url", "x", "--provider", "claude-cli"]);
  assert.equal(a.provider, "claude-cli");
});

test("parseArgs --provider absent defaults to null", () => {
  const a = parseArgs(["node", "run", "--url", "x"]);
  assert.equal(a.provider, null);
});

test("parseArgs --model sets model string", () => {
  const a = parseArgs(["node", "run", "--url", "x", "--model", "anthropic/claude-haiku-4-5"]);
  assert.equal(a.model, "anthropic/claude-haiku-4-5");
});

test("parseArgs --model absent defaults to null", () => {
  const a = parseArgs(["node", "run", "--url", "x"]);
  assert.equal(a.model, null);
});

test("parseArgs --max-tokens parses integer", () => {
  const a = parseArgs(["node", "run", "--url", "x", "--max-tokens", "16384"]);
  assert.equal(a["max-tokens"], 16384);
});

test("parseArgs --max-tokens defaults to 8192 when absent", () => {
  const a = parseArgs(["node", "run", "--url", "x"]);
  assert.equal(a["max-tokens"], 8192);
});

test("parseArgs --max-tokens invalid value falls back to 8192", () => {
  const a = parseArgs(["node", "run", "--url", "x", "--max-tokens", "notanumber"]);
  assert.equal(a["max-tokens"], 8192);
});
