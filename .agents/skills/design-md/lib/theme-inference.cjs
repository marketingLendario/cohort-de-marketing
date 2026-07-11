// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const DARK_STRONG_PATTERNS = [
  /\bdark[-\s]?mode[-\s]?native\b/i,
  /\bdark[-\s]?native\b/i,
  /\bdark[-\s]?first\b/i,
  /\bdark[-\s]?default\b/i,
  /\bpure\s+dark\s+theme\b/i,
  /\bdark\s+theme\b/i,
  /\bdark\s+canvas\b/i,
  /\bdark\s+backgrounds?\b/i,
  /\bnear[-\s]?black\s+(?:background|canvas|surface|bg)\b/i,
  /\balmost[-\s]?black\s+(?:background|canvas|surface|bg)\b/i,
  /\bterminal[-\s]?inspired\b/i,
  /\bterminal\s+(?:aesthetic|window|surface)\b/i,
  /\bcode\s+editor\s+aesthetic\b/i,
];

const LIGHT_STRONG_PATTERNS = [
  /\blight[-\s]?mode[-\s]?native\b/i,
  /\blight[-\s]?first\b/i,
  /\blight[-\s]?default\b/i,
  /\blight\s+theme\b/i,
  /\blight\s+canvas\b/i,
  /\bwhite\s+(?:background|canvas|surface|surfaces)\b/i,
  /\boff[-\s]?white\s+(?:background|canvas|surface|surfaces)\b/i,
  /\bcream\s+(?:background|canvas|surface|surfaces)\b/i,
  /\bwarm[-\s]?cream\s+(?:editorial\s+)?canvas\b/i,
];

const NEGATED_DARK_PATTERNS = [
  /\binstead\s+of\s+(?:the\s+)?(?:typical\s+)?dark\b/i,
  /\bnot\s+(?:a\s+)?dark\b/i,
  /\bwithout\s+(?:a\s+)?dark\b/i,
];

function inferThemeFromDesignMd(markdown = "", tokens = {}) {
  const text = stripFrontmatter(String(markdown || "")).replace(/\s+/g, " ");
  const darkHits = collectHits(text, DARK_STRONG_PATTERNS);
  const lightHits = collectHits(text, LIGHT_STRONG_PATTERNS);
  const negatedDarkHits = collectHits(text, NEGATED_DARK_PATTERNS);
  const semanticDarkScore = darkHits.length - negatedDarkHits.length;
  const semanticLightScore = lightHits.length;

  if (semanticDarkScore >= 1 && semanticDarkScore >= semanticLightScore) {
    return {
      default: "dark",
      confidence: semanticDarkScore >= 2 ? "high" : "medium",
      signals: darkHits.slice(0, 4).map((hit) => `design-md semantic="${hit}" → dark`),
    };
  }

  if (semanticLightScore >= 1 && semanticLightScore > semanticDarkScore) {
    return {
      default: "light",
      confidence: semanticLightScore >= 2 ? "high" : "medium",
      signals: lightHits.slice(0, 4).map((hit) => `design-md semantic="${hit}" → light`),
    };
  }

  const tokenTheme = inferThemeFromTokens(tokens);
  if (tokenTheme) return tokenTheme;

  return {
    default: "light",
    confidence: "low",
    signals: ["design-md-no-semantic-signal"],
  };
}

function inferThemeFromTokens(tokens = {}) {
  const colors = tokens.colors || {};
  const pt = tokens.preview_tokens || {};
  const surface = firstHex(
    pt.surface_bg,
    colors.surface,
    colors.background,
    colors.canvas,
    colors["dark-background"],
    colors["near-black"],
    colors.dark,
  );
  const luminance = surface ? relativeLuminance(surface) : null;
  if (luminance == null) return null;
  return {
    default: luminance < 0.42 ? "dark" : "light",
    confidence: "medium",
    signals: [`token surface="${surface}" luminance=${luminance.toFixed(2)} → ${luminance < 0.42 ? "dark" : "light"}`],
  };
}

function isPlaceholderThemeSignal(themeDefault) {
  const signals = themeDefault?.signals;
  return (
    Array.isArray(signals) &&
    signals.length === 1 &&
    signals[0] === "awesome-design-md-import"
  );
}

function hasThemeSignal(themeDefault) {
  const signals = themeDefault?.signals;
  return (
    Array.isArray(signals) &&
    signals.length > 0 &&
    !signals.includes("no-signal-fallback") &&
    !signals.includes("no-html-fallback") &&
    !signals.includes("design-md-no-semantic-signal") &&
    !isPlaceholderThemeSignal(themeDefault)
  );
}

function stripFrontmatter(markdown) {
  const trimmed = markdown.trimStart();
  if (!trimmed.startsWith("---")) return markdown;
  const end = trimmed.indexOf("\n---", 3);
  return end === -1 ? markdown : trimmed.slice(end + 4);
}

function collectHits(text, patterns) {
  const hits = [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[0]) hits.push(match[0].trim());
  }
  return hits;
}

function firstHex(...values) {
  for (const value of values) {
    const hex = normalizeHex(value);
    if (hex) return hex;
  }
  return null;
}

function normalizeHex(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) hex = hex.split("").map((char) => `${char}${char}`).join("");
  return `#${hex}`;
}

function relativeLuminance(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const raw = normalized.slice(1);
  const channels = [
    parseInt(raw.slice(0, 2), 16),
    parseInt(raw.slice(2, 4), 16),
    parseInt(raw.slice(4, 6), 16),
  ];
  if (channels.some((channel) => Number.isNaN(channel))) return null;
  const [r, g, b] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

module.exports = {
  hasThemeSignal,
  inferThemeFromDesignMd,
  inferThemeFromTokens,
  isPlaceholderThemeSignal,
};
