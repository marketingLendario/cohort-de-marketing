// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const assert = require("assert");
const {
  hasThemeSignal,
  inferThemeFromDesignMd,
  isPlaceholderThemeSignal,
} = require("./theme-inference.cjs");

{
  const theme = inferThemeFromDesignMd("Supabase is a dark-mode-native developer platform with near-black backgrounds.", {
    preview_tokens: { surface_bg: "#fafafa" },
  });
  assert.equal(theme.default, "dark");
  assert.equal(theme.confidence, "medium");
}

{
  const theme = inferThemeFromDesignMd("A warm-cream editorial canvas instead of the typical dark IDE atmosphere.", {
    preview_tokens: { surface_bg: "#f7f7f4" },
  });
  assert.equal(theme.default, "light");
}

{
  const theme = inferThemeFromDesignMd("xAI is dark-first brutalist minimalism with an almost-black background.", {
    preview_tokens: { surface_bg: "#ffffff" },
  });
  assert.equal(theme.default, "dark");
}

{
  const placeholder = { default: "light", signals: ["awesome-design-md-import"] };
  assert.equal(isPlaceholderThemeSignal(placeholder), true);
  assert.equal(hasThemeSignal(placeholder), false);
}

console.log("theme-inference tests passed");
