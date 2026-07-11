// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { sanitizeValue, sanitizeProps, cleanVariantName } = require("./sanitize.cjs");

test("sanitize: drops global reset keywords", () => {
  assert.strictEqual(sanitizeValue("unset", "bg"), null);
  assert.strictEqual(sanitizeValue("initial", "padding"), null);
  assert.strictEqual(sanitizeValue("revert", "radius"), null);
  assert.strictEqual(sanitizeValue("revert-layer", "font_size"), null);
});

test("sanitize: strips !important and trims", () => {
  assert.strictEqual(sanitizeValue("#fff !important", "bg"), "#fff");
  assert.strictEqual(sanitizeValue("  16px  ", "font_size"), "16px");
});

test("sanitize: rejects color inherit keywords for color fields", () => {
  assert.strictEqual(sanitizeValue("inherit", "text"), null);
  assert.strictEqual(sanitizeValue("currentColor", "border_color"), null);
  // But inherit on a non-color field is allowed (font-family inherit is real)
  assert.strictEqual(sanitizeValue("inherit", "font_family"), "inherit");
});

test("sanitize: rejects debug outline rules", () => {
  assert.strictEqual(sanitizeValue("3px solid red", "outline"), null);
  assert.strictEqual(sanitizeValue("2px solid lime", "outline"), null);
  assert.strictEqual(sanitizeValue("1px solid magenta", "outline"), null);
  // Real DS outlines pass through
  assert.strictEqual(sanitizeValue("none", "outline"), "none");
  assert.strictEqual(sanitizeValue("0", "outline"), "0");
  assert.strictEqual(sanitizeValue("2px solid var(--focus)", "outline"), "2px solid var(--focus)");
  assert.strictEqual(sanitizeValue("auto", "outline"), "auto");
});

test("sanitize: rejects hidden transforms (scale 0)", () => {
  assert.strictEqual(sanitizeValue("scale(0)", "transform"), null);
  assert.strictEqual(sanitizeValue("scale(0) translate(-7px)", "transform"), null);
  assert.strictEqual(sanitizeValue("scaleX(0)", "transform"), null);
  assert.strictEqual(sanitizeValue("scaleY(0.0)", "transform"), null);
  // Real transforms pass
  assert.strictEqual(sanitizeValue("translateY(-1px)", "transform"), "translateY(-1px)");
  assert.strictEqual(sanitizeValue("scale(1)", "transform"), "scale(1)");
  assert.strictEqual(sanitizeValue("rotate(45deg)", "transform"), "rotate(45deg)");
});

test("sanitize: rejects foreign-component transforms", () => {
  assert.strictEqual(
    sanitizeValue("translateY(calc(var(--nav--hamburger-thickness) * 0.75))", "transform"),
    null,
  );
  assert.strictEqual(
    sanitizeValue("var(--menu-offset)", "transform"),
    null,
  );
});

test("sanitize: drops padding-zero broad resets", () => {
  assert.strictEqual(sanitizeValue("0", "padding"), null);
  assert.strictEqual(sanitizeValue("0 0", "padding"), null);
  assert.strictEqual(sanitizeValue("0 0 0 0", "padding"), null);
  assert.strictEqual(sanitizeValue("0px 0px", "padding"), null);
  // Real padding passes
  assert.strictEqual(sanitizeValue("8px 16px", "padding"), "8px 16px");
  assert.strictEqual(sanitizeValue("0.5rem", "padding"), "0.5rem");
});

test("sanitizeProps: drops null fields entirely", () => {
  const out = sanitizeProps({
    bg: "unset",
    text: "#000",
    padding: "0",
    radius: "8px",
    outline: "3px solid red",
    transform: "scale(0)",
  });
  assert.deepStrictEqual(out, { text: "#000", radius: "8px" });
});

test("cleanVariantName: strips CSS module hash", () => {
  assert.strictEqual(cleanVariantName("module__VSkE6q__buttonActions"), "buttonActions");
  assert.strictEqual(
    cleanVariantName("popover-module__H3jTzW__upgradeButton"),
    "upgradeButton",
  );
  assert.strictEqual(cleanVariantName("primary"), "primary");
  assert.strictEqual(cleanVariantName(""), "");
});

test("sanitize: numbers pass through finite-only", () => {
  assert.strictEqual(sanitizeValue(0.5, "opacity"), 0.5);
  assert.strictEqual(sanitizeValue(NaN, "opacity"), null);
  assert.strictEqual(sanitizeValue(Infinity, "opacity"), null);
});
