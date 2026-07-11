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
  flattenColors, typographyEntries, firstFontFamily,
  buildGoogleFontsHref, buildSelfHostedFontFaces, scaleBlocks,
  pickComponentTokens, getFirst,
} = require("./tokens.cjs");

test("flattenColors extracts only valid color values", () => {
  const colors = {
    primary: "#ff0000",
    invalid: "not-a-color",
    nested: { ok: "#00ff00", bad: "blue" },
    rgb: "rgb(0, 0, 255)",
  };
  const flat = flattenColors(colors);
  assert.equal(flat.find(c => c.key === "primary").value, "#ff0000");
  assert.equal(flat.find(c => c.key === "rgb").value, "rgb(0, 0, 255)");
  assert.ok(!flat.find(c => c.key === "invalid"));
});

test("typographyEntries returns object entries", () => {
  const typo = { h1: { fontFamily: "Inter" }, "body-md": { fontFamily: "Inter" }, invalid: "not-an-object" };
  const entries = typographyEntries(typo);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].name, "h1");
});

test("firstFontFamily strips quotes and picks first", () => {
  assert.equal(firstFontFamily({ fontFamily: '"Anthropic Serif", Georgia, serif' }), "Anthropic Serif");
  assert.equal(firstFontFamily({ fontFamily: "Inter, sans-serif" }), "Inter");
  assert.equal(firstFontFamily({}), "");
});

test("buildGoogleFontsHref filters known Google Fonts only", () => {
  const href = buildGoogleFontsHref(["Inter", "SF Pro Display", "Geist Sans"]);
  assert.match(href, /Inter/);
  assert.match(href, /Geist\+Sans|Geist%20Sans/);
  assert.doesNotMatch(href, /SF\+Pro|SF%20Pro/);
});

test("buildGoogleFontsHref returns null for empty / non-google fonts", () => {
  assert.equal(buildGoogleFontsHref(["SF Pro Display", "Anthropic Serif"]), null);
  assert.equal(buildGoogleFontsHref([]), null);
});

test("buildSelfHostedFontFaces emits @font-face block", () => {
  const faces = [{
    family: "Anthropic Serif",
    weight: "400",
    style: "normal",
    src_urls: ["/fonts/anthropic-serif.woff2"],
    src_formats: ["woff2"],
  }];
  const block = buildSelfHostedFontFaces(faces, "https://anthropic.com", ["Anthropic Serif"], {});
  assert.match(block, /@font-face/);
  assert.match(block, /Anthropic Serif/);
  assert.match(block, /https:\/\/anthropic\.com\/fonts\/anthropic-serif\.woff2/);
});

test("buildSelfHostedFontFaces uses embedded data URL when available", () => {
  const faces = [{
    family: "Anthropic Serif",
    weight: "400",
    style: "normal",
    src_urls: ["/fonts/x.woff2"],
    src_formats: ["woff2"],
  }];
  const embedded = { "https://anthropic.com/fonts/x.woff2": "data:font/woff2;base64,AAAA" };
  const block = buildSelfHostedFontFaces(faces, "https://anthropic.com", ["Anthropic Serif"], embedded);
  assert.match(block, /data:font\/woff2;base64,AAAA/);
});

test("scaleBlocks converts px and rem to numeric px", () => {
  const blocks = scaleBlocks({ sm: "4px", md: "1rem", lg: "1.5em", invalid: "auto" });
  assert.equal(blocks.find(b => b.key === "sm").px, 4);
  assert.equal(blocks.find(b => b.key === "md").px, 16);
  assert.equal(blocks.find(b => b.key === "lg").px, 24);
  assert.ok(!blocks.find(b => b.key === "invalid"));
});

test("getFirst returns first resolved CSS var", () => {
  const vars = [
    { name: "--bg", value: "#fff", selector: ":root", is_alias: false },
  ];
  assert.equal(getFirst(vars, "--missing", "--bg", "--also-missing"), "#fff");
  assert.equal(getFirst(vars, "--missing", "--also-missing"), null);
});

test("pickComponentTokens resolves --sk-button-background (Apple convention)", () => {
  const vars = [
    { name: "--sk-button-background", value: "rgb(0, 113, 227)", selector: ":root", is_alias: false },
    { name: "--sk-body-background-color", value: "#ffffff", selector: ":root", is_alias: false },
    { name: "--sk-body-text-color", value: "#1d1d1f", selector: ":root", is_alias: false },
  ];
  const ct = pickComponentTokens(vars);
  assert.equal(ct.button.primary.bg, "rgb(0, 113, 227)");
  assert.equal(ct.surface.base, "#ffffff");
  assert.equal(ct.text.base, "#1d1d1f");
});

test("pickComponentTokens resolves --button-primary--background (Anthropic convention)", () => {
  const vars = [
    { name: "--button-primary--background", value: "#141413", selector: ":root", is_alias: false },
  ];
  const ct = pickComponentTokens(vars);
  assert.equal(ct.button.primary.bg, "#141413");
});
