// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

// sanitize.cjs — final hygiene pass on extracted component contracts before
// they land in tokens-extended.json. The goal: emit only values that are
// usable as tokens by a downstream renderer.
//
// Each guard targets a real bug we hit when the UI started rendering from
// the contract verbatim:
//
//   - Anthropic shipped `outline: "3px solid red"` (debug rule from the
//     source site) as the canonical button outline.
//   - Anthropic badge had ALL props as the literal string `"unset"`,
//     captured from selectors that intentionally null tokens out.
//   - Apple emitted `transform: "scale(0) translate(...)"` on the badge
//     because the live site keeps it collapsed by default.
//   - Apple had `input.font_size: "24px"` from the global search bar.
//   - Multiple sites: `padding: "0"` from broad resets like
//     `button { padding: 0 }`, treated as a real token.
//   - Variant names with CSS-module hashes (`module__VSkE6q__buttonActions`)
//     leak into output; downstream consumers can't render them as labels.
//
// All rules are conservative: when in doubt, KEEP the value. We only
// reject patterns that are unambiguously not design intent.

// Keywords that reset to browser defaults / inherited values. None of these
// are ever a meaningful component token.
const GLOBAL_RESET_KEYWORDS = new Set([
  "unset",
  "initial",
  "revert",
  "revert-layer",
]);

// Color keywords that would inherit context from the parent — useful in
// real CSS but disastrous when a self-contained renderer applies them.
const COLOR_INHERIT_KEYWORDS = new Set([
  "inherit",
  "currentcolor",
]);

// Vivid named colors that show up almost exclusively in `outline: 3px solid X`
// debug rules. Real DS contracts use tokens (var(--focus)) or hex.
const DEBUG_OUTLINE_TAIL_COLORS = new Set([
  "red",
  "blue",
  "green",
  "yellow",
  "magenta",
  "cyan",
  "lime",
  "fuchsia",
  "aqua",
  "orange",
  "pink",
  "purple",
]);

// Custom-property names that signal the value was aggregated from an unrelated
// component (hamburger menu, header, drawer, swiper carousel, etc). Filtering
// by name is fragile in theory but reliable in practice — these prefixes are
// too specific to appear inside a button/card/badge contract by accident.
// Anything declared inside a third-party widget scope is foreign.
const FOREIGN_VARS = [
  "--nav--",
  "--hamburger",
  "--menu-",
  "--header-",
  "--drawer-",
  "--popover-",
  "--swiper-",
  "--swiper",
  "--carousel-",
  "--slider-",
  "--slick-",
  "--owl-",
  "--splide-",
  "--gallery-",
];

// Transforms that are unambiguously carousel/widget artifacts, not real
// component tokens. `rotate(180deg)` / `rotate(-180deg)` are the canonical
// Swiper / Slick "previous arrow" flip applied to the next-arrow icon —
// they always show up when the extractor scoops a `.swiper-button-prev`
// rule into the button contract.
const HIDING_TRANSFORM_RE = /\bscale(?:[XY])?\s*\(\s*0(?:\.0+)?\s*[,)]/i;
const FLIP_TRANSFORM_RE = /\brotate(?:[XYZ])?\s*\(\s*-?180\s*deg\s*\)/i;

// Padding / radius values that are universal resets, not tokens.
const RESET_LENGTH_VALUES = new Set([
  "0",
  "0 0",
  "0 0 0 0",
  "0px",
  "0px 0px",
  "0px 0px 0px 0px",
]);

// Property kinds we sanitize differently. Default is "string": only reset
// keywords are stripped. The rest get more specific handling.
const PROP_KIND = {
  bg: "color",
  text: "color",
  color: "color",
  border_color: "color",
  outline_color: "color",
  outline: "outline",
  transform: "transform",
  padding: "length",
  radius: "length",
  border_width: "length",
  font_size: "length",
  // numeric-shaped — opacity comes through with var()/!important; keep flexible
  opacity: "string",
};

function trim(value) {
  return String(value).replace(/!important/gi, "").trim();
}

function isResetKeyword(cleaned) {
  return GLOBAL_RESET_KEYWORDS.has(cleaned.toLowerCase());
}

function looksLikeDebugOutline(cleaned) {
  // Check the LAST whitespace-separated token. Outlines are shorthand:
  // `<width> <style> <color>`. A vivid named tail = debug.
  const parts = cleaned.split(/\s+/);
  if (parts.length < 2) return false; // 'none' / '0' alone are fine
  const tail = parts[parts.length - 1].toLowerCase();
  return DEBUG_OUTLINE_TAIL_COLORS.has(tail);
}

function looksLikeHidingTransform(cleaned) {
  return HIDING_TRANSFORM_RE.test(cleaned);
}

function looksLikeFlipTransform(cleaned) {
  return FLIP_TRANSFORM_RE.test(cleaned);
}

function looksLikeForeignValue(cleaned) {
  return FOREIGN_VARS.some((needle) => cleaned.includes(needle));
}

function looksLikeResetLength(cleaned) {
  return RESET_LENGTH_VALUES.has(cleaned);
}

// Returns sanitized value, or null when the value should be dropped entirely.
function sanitizeValue(rawValue, propKey) {
  if (rawValue == null) return null;
  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue) ? rawValue : null;
  }
  const cleaned = trim(rawValue);
  if (!cleaned) return null;

  // Global reset keywords — never useful as tokens.
  if (isResetKeyword(cleaned)) return null;

  // Foreign-widget vars (Swiper, Slick, hamburger, drawer…) are never the
  // canonical token of a button/card/badge no matter which property they
  // appear in. Reject everywhere — these widgets just happen to declare
  // selectors that match button/card class regexes during aggregation.
  if (looksLikeForeignValue(cleaned)) return null;

  const kind = PROP_KIND[propKey] || "string";

  if (kind === "color") {
    if (COLOR_INHERIT_KEYWORDS.has(cleaned.toLowerCase())) return null;
  }

  if (kind === "outline") {
    if (looksLikeDebugOutline(cleaned)) return null;
  }

  if (kind === "transform") {
    if (looksLikeHidingTransform(cleaned)) return null;
    // `rotate(180deg)` is a Swiper / Slick "flip the next-arrow into a
    // prev-arrow" hack. It's never a real button transform.
    if (looksLikeFlipTransform(cleaned)) return null;
  }

  if (kind === "length") {
    if (looksLikeResetLength(cleaned)) return null;
  }

  // Opacity-zero on a base contract means the live site keeps the element
  // hidden by default and only promotes it to opacity:1 in a hover/active
  // state (Apple's collapsed badge is the classic case). For a static demo
  // we want the visible state — drop the zero so the renderer falls through.
  if (propKey === "opacity") {
    const numeric = Number(cleaned);
    if (Number.isFinite(numeric) && numeric === 0) return null;
  }

  return cleaned;
}

// Apply sanitizeValue to a flat object of {prop: value}. Drops keys whose
// sanitized value is null. Preserves originals where sanitize returns the
// untouched cleaned string (i.e. valid tokens).
function sanitizeProps(props) {
  if (!props || typeof props !== "object") return props;
  const out = {};
  for (const [k, v] of Object.entries(props)) {
    const sanitized = sanitizeValue(v, k);
    if (sanitized == null) continue;
    out[k] = sanitized;
  }
  return out;
}

// Strip CSS-module hash prefixes from variant identifiers. A name like
// `popover-module__H3jTzW__upgradeButton` carries no semantic value
// downstream — humanise to `upgradeButton` (or leave alone if already clean).
function cleanVariantName(rawName) {
  if (typeof rawName !== "string") return rawName;
  return rawName.replace(/^[a-z]+(?:-module)?__[A-Za-z0-9]+__/, "").trim();
}

module.exports = {
  sanitizeValue,
  sanitizeProps,
  cleanVariantName,
  // exposed for tests
  GLOBAL_RESET_KEYWORDS,
  COLOR_INHERIT_KEYWORDS,
  DEBUG_OUTLINE_TAIL_COLORS,
  FOREIGN_VARS,
  RESET_LENGTH_VALUES,
};
