// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { parseCustomProperties } = require("./var-resolver.cjs");
const { buildRenderContract } = require("./render-contract.cjs");

test("render-contract: dark surface means dark-default without toggle", () => {
  const contract = buildRenderContract({
    url: "https://linear.app",
    tokens: {
      colors: {
        surface: "#08090a",
        text: "#f7f8f8",
        primary: "#5e6ad2",
        border: "#23252a",
      },
      preview_tokens: {
        surface_bg: "#08090a",
        card_bg: "#0f1011",
        text: "#f7f8f8",
        button_primary_bg: "#5e6ad2",
        button_primary_text: "#ffffff",
        button_primary_border: "#5e6ad2",
        button_radius: "9999px",
      },
    },
    extended: {
      components: {
        button: {
          padding: "0.65rem 1.2rem",
        },
      },
    },
    cssScopes: parseCustomProperties(":root { --background: #08090a; }"),
    themeDefault: { default: "light", confidence: "low" },
  });

  assert.strictEqual(contract.theme.default_mode, "dark");
  assert.strictEqual(contract.theme.supports_dark, false);
  assert.strictEqual(contract.native_vars.supports_dark, false);
  assert.strictEqual(contract.components.button.variants.primary.renderable, true);
});

test("render-contract: light surface plus explicit dark vars means toggle-able", () => {
  const contract = buildRenderContract({
    tokens: {
      colors: { surface: "#ffffff", text: "#111111", primary: "#111111" },
      preview_tokens: { surface_bg: "#ffffff", button_primary_bg: "#111", button_primary_text: "#fff", button_primary_border: "#111" },
    },
    extended: { components: { button: { padding: "8px 16px", radius: "8px" } } },
    cssScopes: parseCustomProperties(`
      :root { --background: #ffffff; --foreground: #111111; }
      .dark { --background: #000000; --foreground: #ffffff; }
    `),
  });

  assert.strictEqual(contract.theme.default_mode, "light");
  assert.strictEqual(contract.theme.supports_dark, true);
  assert.strictEqual(contract.native_vars.has_explicit_dark_scope, true);
});

test("render-contract: light surface with dark CSS vars stays light-default", () => {
  const contract = buildRenderContract({
    tokens: {
      colors: {
        surface: "#faf8f8",
        text: "#11090a",
        primary: "#ab2832",
        border: "#e8e3e3",
      },
      preview_tokens: {
        surface_bg: "#faf8f8",
        card_bg: "#ffffff",
        text: "#11090a",
        button_primary_bg: "#ab2832",
        button_primary_text: "#ffffff",
        button_primary_border: "#ab2832",
        button_radius: "0px",
      },
    },
    extended: { components: { button: { padding: "12px 18px" } } },
    cssScopes: parseCustomProperties(`
      :root {
        --background: #faf8f8;
        --foreground: #11090a;
        --border: #e8e3e3;
      }
      .dark {
        --background: #252522;
        --foreground: #faf9f2;
        --border: #e0dac524;
      }
    `),
    themeDefault: { default: "light", confidence: "medium" },
  });

  assert.strictEqual(contract.theme.inferred_from_surface, "light");
  assert.strictEqual(contract.theme.default_mode, "light");
  assert.strictEqual(contract.theme.supports_dark, true);
  assert.strictEqual(contract.theme.border, "#e8e3e3");
});

test("render-contract: proprietary scope preserves alpha border for dark-only systems", () => {
  const contract = buildRenderContract({
    tokens: {
      colors: { surface: "#0f0f11", text: "#f5f4e7", border: "#9c9c9c" },
      preview_tokens: {
        surface_bg: "#050505",
        card_bg: "#0f0f11",
        text: "#f5f4e7",
        button_primary_bg: "#d1ff00",
        button_primary_text: "#050505",
        button_primary_border: "#d1ff00",
        button_radius: "0px",
      },
    },
    extended: {
      components: {
        button: { padding: ".65rem 1.5rem" },
        card: { bg: "var(--card, #0f0f11)", text: "var(--card-foreground, #f5f4e7)" },
      },
    },
    cssScopes: parseCustomProperties(`
      :root { --background: #ffffff; --card: #ffffff; --border: #9c9c9c3d; }
      .brandbook-root {
        --background: #050505;
        --card: #0f0f11;
        --card-foreground: #f5f4e7;
        --border: #9c9c9c26;
        --primary: #d1ff00;
      }
    `),
  });

  assert.strictEqual(contract.theme.default_mode, "dark");
  assert.strictEqual(contract.theme.supports_dark, false);
  assert.strictEqual(contract.native_vars.preferred["--border"], "#9c9c9c26");
  assert.strictEqual(contract.theme.border, "#9c9c9c26");
});

test("render-contract: marks incomplete primary button as not renderable", () => {
  const contract = buildRenderContract({
    tokens: {
      colors: { surface: "#ffffff", text: "#111111" },
      preview_tokens: { surface_bg: "#ffffff" },
    },
    extended: {
      components: {
        button: {
          text: "#111111",
          radius: "8px",
          padding: "8px 16px",
        },
      },
    },
    cssScopes: parseCustomProperties(":root { --background: #fff; }"),
  });

  assert.strictEqual(contract.components.button.variants.primary.renderable, false);
  assert.deepStrictEqual(contract.components.button.variants.primary.missing, ["bg", "border_color"]);
  assert.strictEqual(contract.warnings.some((w) => w.code === "button_primary_not_renderable"), true);
});

test("render-contract: ignores layout-destructive transforms and reset padding", () => {
  const contract = buildRenderContract({
    tokens: {
      colors: { surface: "#ffffff", text: "#111111", primary: "#111111" },
      preview_tokens: {
        surface_bg: "#ffffff",
        button_primary_bg: "#111111",
        button_primary_text: "#ffffff",
        button_primary_border: "#111111",
      },
    },
    extended: {
      components: {
        button: {
          padding: "0",
          font_size: "10px",
          states: {
            hover: { transform: "rotate(45deg)", bg: "#222222" },
          },
        },
      },
    },
    cssScopes: parseCustomProperties(":root { --background: #fff; }"),
  });

  assert.strictEqual(contract.components.button.base.padding, "0.65rem 1.2rem");
  assert.strictEqual(contract.components.button.base.font_size, "0.875rem");
  assert.strictEqual(contract.components.button.states.hover.transform, undefined);
  assert.strictEqual(contract.warnings.some((w) => w.code === "component_reset_padding"), true);
  assert.strictEqual(contract.warnings.some((w) => w.code === "component_font_size_below_min"), true);
  assert.strictEqual(contract.warnings.some((w) => w.code === "component_non_flow_transform"), true);
});

test("render-contract: warns when component background equals text", () => {
  const contract = buildRenderContract({
    tokens: {
      colors: { surface: "#ffffff", text: "#111111", primary: "#111111" },
      preview_tokens: {
        surface_bg: "#ffffff",
        button_primary_bg: "#111111",
        button_primary_text: "#111111",
        button_primary_border: "#111111",
      },
    },
    extended: {
      components: {
        button: { padding: "8px 16px" },
      },
    },
    cssScopes: parseCustomProperties(":root { --background: #fff; }"),
  });

  assert.strictEqual(contract.warnings.some((w) => w.code === "component_bg_equals_text"), true);
});
