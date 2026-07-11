// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const test = require("node:test");
const assert = require("node:assert");
const {
  parseCustomProperties,
  resolveTerminal,
  injectFallbacks,
  injectFallbacksOnProps,
} = require("./var-resolver.cjs");

const SAMPLE_CSS = `
  :root {
    --bg: #ffffff;
    --text: #111;
    --primary: var(--blue-500);
    --blue-500: #2563eb;
  }
  .dark-theme {
    --bg: #000;
    --text: #f5f5f5;
  }
  .unrelated { color: red; }
`;

test("parseCustomProperties: separates :root and .dark-theme blocks", () => {
  const { light, dark } = parseCustomProperties(SAMPLE_CSS);
  assert.strictEqual(light.get("--bg"), "#ffffff");
  assert.strictEqual(light.get("--text"), "#111");
  assert.strictEqual(dark.get("--bg"), "#000");
  assert.strictEqual(dark.get("--text"), "#f5f5f5");
});

test("parseCustomProperties: ignores non-root non-dark blocks", () => {
  const { light } = parseCustomProperties(SAMPLE_CSS);
  // .unrelated has `color: red` (not a custom prop) so nothing leaks.
  assert.strictEqual(light.has("color"), false);
});

test("parseCustomProperties: handles empty / null input", () => {
  const a = parseCustomProperties("");
  const b = parseCustomProperties(null);
  assert.strictEqual(a.light.size, 0);
  assert.strictEqual(b.dark.size, 0);
});

test("resolveTerminal: follows aliases", () => {
  const { light } = parseCustomProperties(SAMPLE_CSS);
  // --primary aliases --blue-500 which is #2563eb
  assert.strictEqual(resolveTerminal(light, "--primary"), "#2563eb");
});

test("resolveTerminal: returns null for missing var", () => {
  const { light } = parseCustomProperties(SAMPLE_CSS);
  assert.strictEqual(resolveTerminal(light, "--missing"), null);
});

test("resolveTerminal: bails on cycles", () => {
  const map = new Map([
    ["--a", "var(--b)"],
    ["--b", "var(--a)"],
  ]);
  assert.strictEqual(resolveTerminal(map, "--a"), null);
});

test("injectFallbacks: rewrites var(--x) → var(--x, hex)", () => {
  const scopes = parseCustomProperties(SAMPLE_CSS);
  assert.strictEqual(
    injectFallbacks("var(--bg)", scopes),
    "var(--bg, #ffffff)",
  );
  assert.strictEqual(
    injectFallbacks("var(--primary)", scopes),
    "var(--primary, #2563eb)",
  );
});

test("injectFallbacks: leaves vars with existing fallback alone", () => {
  const scopes = parseCustomProperties(SAMPLE_CSS);
  assert.strictEqual(
    injectFallbacks("var(--bg, #fafafa)", scopes),
    "var(--bg, #fafafa)",
  );
});

test("injectFallbacks: leaves unresolvable vars verbatim", () => {
  const scopes = parseCustomProperties(SAMPLE_CSS);
  assert.strictEqual(
    injectFallbacks("var(--ghost-token)", scopes),
    "var(--ghost-token)",
  );
});

test("injectFallbacks: handles compound CSS values (multi-shadow)", () => {
  const scopes = parseCustomProperties(SAMPLE_CSS);
  const out = injectFallbacks("0 0 0 1px var(--text), 0 0 0 4px var(--primary)", scopes);
  assert.strictEqual(out, "0 0 0 1px var(--text, #111), 0 0 0 4px var(--primary, #2563eb)");
});

test("injectFallbacksOnProps: walks a flat prop record", () => {
  const scopes = parseCustomProperties(SAMPLE_CSS);
  const props = { bg: "var(--bg)", text: "#000", padding: "8px" };
  const out = injectFallbacksOnProps(props, scopes);
  assert.deepStrictEqual(out, {
    bg: "var(--bg, #ffffff)",
    text: "#000",
    padding: "8px",
  });
});

test("injectFallbacks: passes through non-var strings unchanged", () => {
  const scopes = parseCustomProperties(SAMPLE_CSS);
  assert.strictEqual(injectFallbacks("#000", scopes), "#000");
  assert.strictEqual(injectFallbacks("8px 16px", scopes), "8px 16px");
});

const { flattenScope, buildThemedVars } = require("./var-resolver.cjs");

test("flattenScope: walks aliases to terminal values", () => {
  const { light } = parseCustomProperties(SAMPLE_CSS);
  const flat = flattenScope(light);
  assert.strictEqual(flat["--bg"], "#ffffff");
  assert.strictEqual(flat["--primary"], "#2563eb");
});

test("buildThemedVars: emits supportsDark=true when dark block present", () => {
  const scopes = parseCustomProperties(SAMPLE_CSS);
  const themed = buildThemedVars(scopes);
  assert.strictEqual(themed.supportsDark, true);
  assert.strictEqual(themed.light["--bg"], "#ffffff");
  assert.strictEqual(themed.dark["--bg"], "#000");
});

test("buildThemedVars: emits supportsDark=false when no dark block", () => {
  const scopes = parseCustomProperties(":root { --x: #fff; }");
  const themed = buildThemedVars(scopes);
  assert.strictEqual(themed.supportsDark, false);
  assert.deepStrictEqual(themed.dark, {});
});

test("buildThemedVars: merges global into light but NOT into dark", () => {
  const css = `
    :root { --primary: #00f; }
    .dark-theme { --bg: #000; }
    .button { --extra: red; }
  `;
  const scopes = parseCustomProperties(css);
  const themed = buildThemedVars(scopes);
  assert.strictEqual(themed.light["--extra"], "red");
  assert.strictEqual(themed.light["--primary"], "#00f");
  assert.strictEqual(themed.dark["--extra"], undefined);
  assert.strictEqual(themed.dark["--bg"], "#000");
});

test("parseCustomProperties: promotes proprietary DS scope without treating it as toggle dark", () => {
  const css = `
    :root { --background: #ffffff; --card: #ffffff; }
    .brandbook-root {
      --background: #050505;
      --card: #0f0f11;
      --border: #9c9c9c26;
      --lime: #d1ff00;
    }
  `;
  const scopes = parseCustomProperties(css);
  const themed = buildThemedVars(scopes);
  assert.strictEqual(scopes.preferred.get("--background"), "#050505");
  assert.strictEqual(themed.preferred["--border"], "#9c9c9c26");
  assert.strictEqual(themed.supportsDark, false);
  assert.deepStrictEqual(themed.dark, {});
});

test("injectFallbacks: prefers proprietary DS scope over generic :root", () => {
  const css = `
    :root { --card: #ffffff; }
    .brandbook-root { --card: #0f0f11; }
  `;
  const scopes = parseCustomProperties(css);
  assert.strictEqual(injectFallbacks("var(--card)", scopes), "var(--card, #0f0f11)");
});
