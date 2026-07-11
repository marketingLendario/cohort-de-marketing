// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const fs = require("fs");
const path = require("path");
const { buildThemedVars, parseCustomProperties } = require("./var-resolver.cjs");
const { hasThemeSignal } = require("./theme-inference.cjs");

const COMPONENT_KEYS = ["button", "card", "input", "badge", "link", "nav", "tab", "alert", "table", "tooltip", "modal", "avatar", "label"];
const MIN_FONT_SIZE_PX = 12;
const MAX_INLINE_TRANSLATE_PX = 8;
const REJECT_TRANSFORM_RE = /\b(?:rotate|skew|matrix|translate3d)\s*\(|translate(?:x|y)?\s*\(\s*-?50%|\bscale(?:[XY])?\s*\(\s*0(?:\.0+)?\s*[,)]/i;
const RESET_PADDING_RE = /^0(?:px|rem|em)?(?:\s+0(?:px|rem|em)?){0,3}$/i;

function buildRenderContract({
  url = null,
  tokens = {},
  extended = {},
  cssScopes = null,
  themeDefault = null,
} = {}) {
  const scopes = cssScopes || parseCustomProperties("");
  const nativeVars = buildThemedVars(scopes);
  const pt = tokens.preview_tokens || {};
  const colors = tokens.colors || {};
  const sourceSurface = pt.surface_bg || pickNative(nativeVars, "light", ["--background", "--bg-base", "--surface", "--card"]) || colors.surface || "#ffffff";
  const luminance = relativeLuminance(sourceSurface);
  const inferredTheme = luminance != null && luminance < 0.42 ? "dark" : "light";
  // default_mode classification:
  //   1. theme-default.json HIGH confidence → trust verbatim. Sites that
  //      explicitly declare their default mode in HTML/meta are unambiguous;
  //      Vercel ships `meta color-scheme="dark light"` even when the LLM
  //      extracts the light theme as tokens.json.
  //   2. Surface luminance — direct signal of the rendered surface. Catches
  //      mixed-mode sites (light surface with dark modal vars) and dark-default
  //      brandbooks the LLM may have snapshotted via a light variant.
  //   3. theme-default.json (any confidence) as last resort.
  const hasDarkVars = nativeVars.supportsDark === true;
  // Trust theme-default.json verbatim whenever it found any signal — the
  // detector now reads both HTML markers and CSS background-var luminance,
  // so even "low" confidence picks beat the LLM-snapshotted surface
  // (which often captures the light theme even when the live page is dark).
  const detectorPick = themeDefault?.default;
  const detectorHasSignal = hasThemeSignal(themeDefault);
  let effectiveTheme;
  if (detectorHasSignal && detectorPick) {
    effectiveTheme = detectorPick === "dark" ? "dark" : "light";
  } else if (luminance != null) {
    effectiveTheme = inferredTheme;
  } else {
    effectiveTheme = "light";
  }
  const nativeScope = effectiveTheme === "dark" ? "dark" : "light";
  const supportsModeToggle = effectiveTheme === "light" && hasDarkVars;
  const resolvedSurface = effectiveTheme === "dark"
    ? pickDarkColor(
        pickNative(nativeVars, nativeScope, ["--background", "--bg-base", "--bb-canvas", "--surface"]),
        colors["canvas-dark"],
        colors["dark-background"],
        colors["near-black"],
        colors.ink,
        colors["body-strong"],
        colors.dark,
        colors.text,
        colors.primary,
        sourceSurface,
      ) || "#0a0a0a"
    : pickFirst(
        pt.surface_bg,
        pickNative(nativeVars, nativeScope, ["--background", "--bg-base", "--bb-canvas", "--surface"]),
        colors.surface,
        "#ffffff",
      );
  const resolvedText = effectiveTheme === "dark"
    ? pickLightColor(
        pt.text,
        pickNative(nativeVars, nativeScope, ["--foreground", "--text-primary", "--card-foreground", "--bb-cream"]),
        colors["text-primary"],
        colors["pure-white"],
        colors["fg-on-dark"],
        colors["contrast-fg"],
        colors.surface,
      ) || "#ffffff"
    : pickFirst(
        pt.text,
        pickNative(nativeVars, nativeScope, ["--foreground", "--text-primary", "--card-foreground", "--bb-cream"]),
        colors.text,
        "#111111",
      );

  const theme = {
    default: effectiveTheme,
    default_mode: effectiveTheme,
    supports_dark: supportsModeToggle,
    supports_dark_reason: supportsModeToggle
      ? "light-default surface with explicit dark variable scope"
      : effectiveTheme === "dark"
        ? "dark-default surface; no toggle inferred from dark composition"
        : "light-default surface without dark toggle evidence",
    declared_default: themeDefault?.default || null,
    confidence: luminance == null ? (themeDefault?.confidence || "low") : "high",
    inferred_from_surface: inferredTheme,
    surface: resolvedSurface,
    surface_alt: effectiveTheme === "dark"
      ? pickDarkColor(
          pt.card_bg,
          pickNative(nativeVars, nativeScope, ["--card", "--bg-surface", "--bb-surface", "--surface-alt"]),
          colors["surface-elevated"],
          colors["surface-card"],
          colors["card-dark"],
          colors.secondary,
        ) || resolvedSurface
      : pickFirst(
          pt.card_bg,
          pickNative(nativeVars, nativeScope, ["--card", "--bg-surface", "--bb-surface", "--surface-alt"]),
          colors.secondary,
          colors.surface,
        ),
    text: resolvedText,
    muted: pickFirst(
      pt.text_muted,
      pickNative(nativeVars, nativeScope, ["--text-muted", "--muted-foreground", "--text-secondary", "--bb-meta"]),
      colors["text-muted"],
      colors.neutral,
    ),
    border: pickFirst(
      pickNative(nativeVars, nativeScope, ["--border", "--bb-border", "--border-subtle", "--border-medium"]),
      pt.border,
      colors.border,
      effectiveTheme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
    ),
    accent: pickFirst(
      pt.accent,
      pickNative(nativeVars, nativeScope, ["--primary", "--bb-lime", "--accent-foreground", "--color-brand"]),
      colors.primary,
      colors.accent,
    ),
  };

  theme.border = normalizeBorder(theme.border, theme.surface);

  const components = buildComponentContracts({ tokens, extended, theme });
  const warnings = dedupeWarnings([
    ...buildCleanupWarnings(extended.components || {}),
    ...buildWarnings({ theme, components }),
  ]);

  return {
    schema_version: "1.0",
    source: { url },
    theme,
    native_vars: {
      supports_dark: supportsModeToggle,
      has_explicit_dark_scope: nativeVars.supportsDark,
      preferred_selector: nativeVars.preferredSelector,
      preferred_count: Object.keys(nativeVars.preferred || {}).length,
      light: nativeVars.light,
      dark: nativeVars.dark,
      preferred: nativeVars.preferred,
    },
    components,
    warnings,
  };
}

function buildRenderContractFromRunDir(runDir, options = {}) {
  const readJson = (rel, fallback = null) => {
    const file = path.join(runDir, rel);
    if (!fs.existsSync(file)) return fallback;
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return fallback;
    }
  };
  const readText = (rel) => {
    const file = path.join(runDir, rel);
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  };
  const css = readText("inputs/css-collected.css");
  return buildRenderContract({
    url: options.url || null,
    tokens: readJson("tokens.json", {}),
    extended: readJson("tokens-extended.json", {}),
    cssScopes: parseCustomProperties(css),
    themeDefault: readJson("inputs/theme-default.json", null),
  });
}

function buildComponentContracts({ tokens, extended, theme }) {
  const out = {};
  const raw = extended.components || {};
  for (const key of COMPONENT_KEYS) {
    if (key === "button") {
      out.button = buildButtonContract(tokens, raw.button || {}, theme);
    } else if (key === "card") {
      out.card = buildBoxContract("card", tokens, raw.card || {}, theme);
    } else if (key === "input") {
      out.input = buildBoxContract("input", tokens, raw.input || {}, theme);
    } else if (raw[key]) {
      out[key] = buildGenericComponentContract(raw[key], theme);
    }
  }
  return out;
}

function buildButtonContract(tokens, button, theme) {
  const pt = tokens.preview_tokens || {};
  const base = cleanRenderProps({
    bg: pickFirst(pt.button_primary_bg, button.bg, theme.accent),
    text: pickFirst(pt.button_primary_text, button.text, theme.surface),
    border_color: pickFirst(pt.button_primary_border, button.border_color, pt.button_primary_bg, theme.accent),
    border_width: pickFirstUsableBoxValue(button.border_width, pt.button_border_width, "1px"),
    radius: pickFirst(button.radius, pt.button_radius, tokens.rounded?.md, "0px"),
    padding: pickFirstUsableBoxValue(button.padding, composePadding(pt), "0.65rem 1.2rem"),
    font_size: pickFirstUsableFontSize(button.font_size, pt.button_font_size, "0.875rem"),
    font_weight: pickFirst(button.font_weight, pt.button_font_weight, 600),
    transition: pickFirst(button.transition, pt.button_transition),
    shadow: pickFirst(button.shadow, pt.button_shadow),
  });

  const variants = {
    primary: completeVariant("primary", base, button.variants?.primary || {}),
    secondary: completeVariant("secondary", {
      ...base,
      bg: pickFirst(pt.button_secondary_bg, button.variants?.secondary?.bg, "transparent"),
      text: pickFirst(pt.button_secondary_text, button.variants?.secondary?.text, theme.text),
      border_color: pickFirst(pt.button_secondary_border, button.variants?.secondary?.border_color, theme.border),
    }, button.variants?.secondary || {}),
  };

  const states = {
    hover: cleanRenderProps({
      bg: pickFirst(pt.button_hover_bg, button.states?.hover?.bg),
      text: pickFirst(pt.button_hover_text, button.states?.hover?.text),
      border_color: pickFirst(pt.button_hover_border, button.states?.hover?.border_color),
      shadow: button.states?.hover?.shadow,
      transform: button.states?.hover?.transform,
    }),
    active: cleanRenderProps({
      bg: pickFirst(pt.button_active_bg, button.states?.active?.bg),
      text: button.states?.active?.text,
      transform: button.states?.active?.transform,
    }),
    disabled: cleanRenderProps({
      bg: button.states?.disabled?.bg,
      text: button.states?.disabled?.text,
      opacity: button.states?.disabled?.opacity,
      cursor: button.states?.disabled?.cursor,
    }),
    focus_visible: cleanRenderProps({
      outline: button.states?.["focus-visible"]?.outline,
      outline_color: button.states?.["focus-visible"]?.outline_color,
      outline_offset: button.states?.["focus-visible"]?.outline_offset,
      shadow: button.states?.["focus-visible"]?.shadow,
    }),
  };

  return {
    renderable: variants.primary.renderable,
    base,
    variants,
    states,
    source_confidence: scoreComponentConfidence(button),
  };
}

function buildBoxContract(kind, tokens, component, theme) {
  const pt = tokens.preview_tokens || {};
  const prefix = kind === "card" ? "card" : "input";
  const base = cleanRenderProps({
    bg: pickFirst(component.bg, pt[`${prefix}_bg`], kind === "card" ? theme.surface_alt : theme.surface),
    text: pickFirst(component.text, theme.text),
    border_color: pickFirst(component.border_color, pt[`${prefix}_border_color`], theme.border),
    border_width: pickFirstUsableBoxValue(component.border_width, pt[`${prefix}_border_width`], "1px"),
    radius: pickFirst(component.radius, pt[`${prefix}_radius`], "0px"),
    padding: pickFirstUsableBoxValue(component.padding, pt[`${prefix}_padding`], kind === "card" ? "1.25rem" : null),
    shadow: pickFirst(component.shadow, pt[`${prefix}_shadow`]),
    transition: component.transition,
  });
  return {
    renderable: Boolean(base.bg || base.border_color || base.text),
    base,
    states: cleanStateMap(component.states),
    variants: cleanStateMap(component.variants),
    source_confidence: scoreComponentConfidence(component),
  };
}

function buildGenericComponentContract(component, theme) {
  const base = cleanRenderProps({
    bg: component.bg,
    text: pickFirst(component.text, theme.text),
    border_color: component.border_color,
    radius: component.radius,
    padding: component.padding,
    font_size: component.font_size,
    font_weight: component.font_weight,
  });
  return {
    renderable: Object.keys(base).length > 0,
    base,
    states: cleanStateMap(component.states),
    variants: cleanStateMap(component.variants),
    source_confidence: scoreComponentConfidence(component),
  };
}

function completeVariant(name, base, override) {
  const merged = cleanRenderProps({ ...base, ...override });
  const required = name === "secondary" ? ["text", "border_color", "radius", "padding"] : ["bg", "text", "border_color", "radius", "padding"];
  const missing = required.filter((key) => merged[key] == null || merged[key] === "");
  return {
    renderable: missing.length === 0,
    missing,
    ...merged,
  };
}

function scoreComponentConfidence(component) {
  if (!component || Object.keys(component).length === 0) return "missing";
  const props = Object.keys(component).filter((key) => key !== "states" && key !== "variants").length;
  const states = component.states ? Object.keys(component.states).length : 0;
  const variants = component.variants ? Object.keys(component.variants).length : 0;
  const score = props + states * 2 + variants;
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  return "thin";
}

function buildCleanupWarnings(rawComponents) {
  const warnings = [];
  for (const [componentName, component] of Object.entries(rawComponents || {})) {
    collectPropsWarnings(warnings, componentName, "base", component);
    for (const [stateName, state] of Object.entries(component.states || {})) {
      collectPropsWarnings(warnings, componentName, `state:${stateName}`, state);
    }
    for (const [variantName, variant] of Object.entries(component.variants || {})) {
      collectPropsWarnings(warnings, componentName, `variant:${variantName}`, variant);
    }
  }
  return warnings;
}

function dedupeWarnings(warnings) {
  const seen = new Set();
  const out = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.component || ""}:${warning.scope || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(warning);
  }
  return out;
}

function buildWarnings({ theme, components }) {
  const warnings = [];
  if (isDark(theme.surface) && isOpaqueLight(theme.border)) {
    warnings.push({
      code: "border_too_strong_for_dark_surface",
      message: "Dark surface uses an opaque light border; renderer should prefer alpha border tokens.",
      severity: "medium",
    });
  }
  const primary = components.button?.variants?.primary;
  if (primary && (!primary.renderable || isTransparent(primary.bg))) {
    warnings.push({
      code: "button_primary_not_renderable",
      message: "Primary button is missing visible render props.",
      severity: "high",
      missing: primary.missing || [],
    });
  }
  for (const [componentName, component] of Object.entries(components || {})) {
    collectComponentWarnings(warnings, componentName, component);
  }
  return warnings;
}

function pickNative(nativeVars, scope, names) {
  const map = nativeVars?.[scope] || {};
  for (const name of names) {
    if (map[name]) return map[name];
  }
  if (scope !== "preferred") {
    for (const name of names) {
      if (nativeVars?.preferred?.[name]) return nativeVars.preferred[name];
    }
  }
  return null;
}

function pickFirst(...values) {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return null;
}

function pickDarkColor(...values) {
  for (const value of values) {
    const lum = relativeLuminance(value);
    if (lum != null && lum < 0.42) return value;
  }
  return null;
}

function pickLightColor(...values) {
  for (const value of values) {
    const lum = relativeLuminance(value);
    if (lum != null && lum > 0.62) return value;
  }
  return null;
}

function pickFirstUsableBoxValue(...values) {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (isResetBoxValue(value)) continue;
    return value;
  }
  return null;
}

function pickFirstUsableFontSize(...values) {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (isTooSmallFontSize(value)) continue;
    return value;
  }
  return null;
}

function cleanObject(input) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    out[key] = value;
  }
  return out;
}

function cleanRenderProps(input) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (key === "transform" && isRejectedTransform(value)) continue;
    if (key === "font_size" && isTooSmallFontSize(value)) continue;
    if ((key === "padding" || key === "border_width") && isResetBoxValue(value)) continue;
    out[key] = value;
  }
  return out;
}

function cleanStateMap(input) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) {
    const cleaned = cleanRenderProps(value);
    if (Object.keys(cleaned).length > 0) out[key] = cleaned;
  }
  return out;
}

function collectComponentWarnings(warnings, componentName, component) {
  if (!component) return;
  collectPropsWarnings(warnings, componentName, "base", component.base);
  for (const [variantName, variant] of Object.entries(component.variants || {})) {
    collectPropsWarnings(warnings, componentName, `variant:${variantName}`, variant);
  }
  for (const [stateName, state] of Object.entries(component.states || {})) {
    collectPropsWarnings(warnings, componentName, `state:${stateName}`, state);
  }
}

function collectPropsWarnings(warnings, componentName, scope, props) {
  if (!props) return;
  if (props.bg && props.text && sameColor(props.bg, props.text)) {
    warnings.push({
      code: "component_bg_equals_text",
      message: `${componentName} ${scope} uses the same background and text color.`,
      severity: "high",
      component: componentName,
      scope,
    });
  }
  if (props.font_size && isTooSmallFontSize(props.font_size)) {
    warnings.push({
      code: "component_font_size_below_min",
      message: `${componentName} ${scope} font-size is below ${MIN_FONT_SIZE_PX}px and was ignored by render cleanup.`,
      severity: "medium",
      component: componentName,
      scope,
      min_px: MIN_FONT_SIZE_PX,
    });
  }
  if (props.transform && isRejectedTransform(props.transform)) {
    warnings.push({
      code: "component_non_flow_transform",
      message: `${componentName} ${scope} transform is layout-destructive and was ignored by render cleanup.`,
      severity: "medium",
      component: componentName,
      scope,
    });
  }
  if (props.padding && isResetBoxValue(props.padding)) {
    warnings.push({
      code: "component_reset_padding",
      message: `${componentName} ${scope} padding is a reset value and was ignored by render cleanup.`,
      severity: "medium",
      component: componentName,
      scope,
    });
  }
}

function composePadding(pt) {
  if (pt.button_padding_x && pt.button_padding_y) return `${pt.button_padding_y} ${pt.button_padding_x}`;
  return null;
}

function isRejectedTransform(value) {
  if (typeof value !== "string") return false;
  const normalized = value.toLowerCase();
  if (REJECT_TRANSFORM_RE.test(normalized)) return true;
  const translateMatch = normalized.match(/translate(?:3d|x|y)?\s*\(([^)]*)\)/);
  if (!translateMatch) return false;
  return translateMatch[1].split(",").some((part) => {
    const m = part.trim().match(/^(-?\d+(?:\.\d+)?)px$/);
    return m ? Math.abs(Number(m[1])) > MAX_INLINE_TRANSLATE_PX : false;
  });
}

function isTooSmallFontSize(value) {
  const px = parsePxLike(value);
  return px != null && px < MIN_FONT_SIZE_PX;
}

function isResetBoxValue(value) {
  return typeof value === "string" && RESET_PADDING_RE.test(value.trim());
}

function parsePxLike(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^([\d.]+)\s*(px|rem|em)?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] || "px").toLowerCase();
  if (unit === "px") return n;
  if (unit === "rem" || unit === "em") return n * 16;
  return null;
}

function sameColor(a, b) {
  const ca = parseColor(a);
  const cb = parseColor(b);
  return Boolean(ca && cb && ca.r === cb.r && ca.g === cb.g && ca.b === cb.b && Math.abs(ca.a - cb.a) < 0.01);
}

function normalizeBorder(border, surface) {
  if (!isDark(surface) || !isOpaqueLight(border)) return border;
  const rgb = parseColor(border);
  if (!rgb) return border;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.24)`;
}

function isTransparent(value) {
  if (!value) return true;
  const s = String(value).trim().toLowerCase();
  return s === "transparent" || s === "#0000" || s === "#00000000" || s === "rgba(0,0,0,0)" || s === "rgba(0, 0, 0, 0)";
}

function isDark(value) {
  const lum = relativeLuminance(value);
  return lum != null && lum < 0.42;
}

function isOpaqueLight(value) {
  const color = parseColor(value);
  if (!color || color.a < 0.75) return false;
  const lum = relativeLuminance(value);
  return lum != null && lum > 0.42;
}

function relativeLuminance(value) {
  const color = parseColor(value);
  if (!color || color.a === 0) return null;
  const channel = (n) => {
    const s = n / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function parseColor(value) {
  if (!value) return null;
  const s = String(value).trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    const hasAlpha = h.length === 8;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: hasAlpha ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/i);
  if (m) {
    return {
      r: Math.round(Number(m[1])),
      g: Math.round(Number(m[2])),
      b: Math.round(Number(m[3])),
      a: m[4] == null ? 1 : Number(m[4]),
    };
  }
  return null;
}

module.exports = {
  buildRenderContract,
  buildRenderContractFromRunDir,
  buildComponentContracts,
  relativeLuminance,
  parseColor,
};
