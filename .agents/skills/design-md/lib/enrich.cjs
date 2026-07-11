// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const fs = require("fs");
const path = require("path");
const { sanitizeProps, cleanVariantName } = require("./sanitize.cjs");
const { hasThemeSignal } = require("./theme-inference.cjs");
const {
  parseCustomProperties,
  injectFallbacksOnProps,
  buildThemedVars,
} = require("./var-resolver.cjs");

// ── Shadow ladder (xs/sm/md/lg/xl by blur radius) ───────────────────
function parseShadowBlur(value) {
  // "0 2px 4px rgba(0,0,0,0.1)" → 4 (third value, before optional spread)
  // Multi-shadow uses commas; we look at the FIRST layer.
  const firstLayer = String(value).split(",")[0];
  const m = firstLayer.match(/(?:^|\s)(?:-?[\d.]+)(?:px)?\s+(?:-?[\d.]+)(?:px)?\s+([\d.]+)(?:px)?/);
  return m ? parseFloat(m[1]) : null;
}

function bucketShadows(shadowsArr) {
  if (!Array.isArray(shadowsArr) || shadowsArr.length === 0) return null;
  const parsed = shadowsArr
    .map((s) => ({ value: s.value || s, count: s.count || 1, blur: parseShadowBlur(s.value || s) }))
    .filter((x) => x.blur != null && x.blur > 0); // exclude 0-blur "none"-like entries
  if (parsed.length === 0) return null;
  parsed.sort((a, b) => a.blur - b.blur);
  const buckets = ["xs", "sm", "md", "lg", "xl"];
  const out = {};
  if (parsed.length <= 5) {
    parsed.forEach((p, i) => { out[buckets[i]] = p.value; });
  } else {
    // Pick representatives at ~10%, 30%, 50%, 75%, 95% percentiles
    const ps = [0.1, 0.3, 0.5, 0.75, 0.95];
    ps.forEach((p, i) => {
      const idx = Math.min(parsed.length - 1, Math.floor(p * parsed.length));
      out[buckets[i]] = parsed[idx].value;
    });
  }
  return out;
}

// ── Motion buckets ──────────────────────────────────────────────────
function parseDurationMs(value) {
  const m = String(value).match(/^([\d.]+)(ms|s)$/);
  if (!m) return null;
  return m[2] === "s" ? parseFloat(m[1]) * 1000 : parseFloat(m[1]);
}

function bucketMotion(motion) {
  const out = {};
  if (Array.isArray(motion?.durations) && motion.durations.length > 0) {
    // Use UNIQUE values sorted, NOT weighted by count.
    // Counts can be inflated by infinite animations (e.g. logo spin) and would
    // collapse fast/base/slow to the same value. Transition tokens are about
    // distinct steps in the design system, not occurrence frequency.
    const unique = Array.from(new Set(
      motion.durations
        .map((d) => parseDurationMs(d.value || d))
        .filter((ms) => ms != null && ms > 0 && ms <= 1500) // exclude likely-animation values
    )).sort((a, b) => a - b);

    if (unique.length === 0) {
      // Fall back to all durations if filter killed everything
      const all = Array.from(new Set(
        motion.durations.map((d) => parseDurationMs(d.value || d)).filter((ms) => ms != null && ms > 0)
      )).sort((a, b) => a - b);
      if (all.length > 0) unique.push(...all);
    }

    if (unique.length >= 1) {
      const pick = (p) => unique[Math.min(unique.length - 1, Math.floor(p * (unique.length - 1)))];
      out.duration_fast = pick(0) + "ms";
      out.duration_base = pick(0.5) + "ms";
      out.duration_slow = pick(1) + "ms";
    }
  }
  if (Array.isArray(motion?.easings) && motion.easings.length > 0) {
    // Prefer specific cubic-bezier over generic browser keywords (ease/linear/...)
    const generics = new Set(["ease", "ease-in", "ease-out", "ease-in-out", "linear", "step-end", "step-start"]);
    const ranked = motion.easings
      .filter((e) => e.value)
      .sort((a, b) => (b.count || 0) - (a.count || 0));
    const specific = ranked.find((e) => !generics.has(String(e.value).trim()));
    out.easing = specific?.value || ranked[0]?.value || null;
  }
  if (Array.isArray(motion?.keyframes)) {
    out.keyframes_count = motion.keyframes.length;
  }
  return Object.keys(out).length > 0 ? out : null;
}

// ── Component tokens promotion ──────────────────────────────────────
const PROP_KEY_MAP = {
  "border-radius": "radius",
  "padding": "padding",
  "font-weight": "font_weight",
  "font-size": "font_size",
  "line-height": "line_height",
  "letter-spacing": "letter_spacing",
  "border-width": "border_width",
  "border-color": "border_color",
  "background-color": "bg",
  "color": "text",
  "box-shadow": "shadow",
  "transition": "transition",
  "transform": "transform",
  "opacity": "opacity",
  "outline": "outline",
  "outline-color": "outline_color",
  "outline-offset": "outline_offset",
  "cursor": "cursor",
};

function normalizePropKey(prop) {
  return PROP_KEY_MAP[prop] || prop.replace(/-/g, "_");
}

function liftStateProps(stateProps) {
  if (!stateProps || typeof stateProps !== "object") return null;
  const out = {};
  for (const [prop, info] of Object.entries(stateProps)) {
    if (!info || typeof info !== "object") continue;
    if (info.most_common != null) {
      out[normalizePropKey(prop)] = info.most_common;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

function buildComponents(componentProperties, options = {}) {
  if (!componentProperties?.summary) return null;
  const cssScopes = options.cssScopes || null;

  // Sanitize raw props: drop unset/initial/inherit, debug outline rules,
  // hidden transforms, padding-zero resets. Then inject var() fallbacks so
  // downstream renderers can resolve `var(--ds-x)` even without the source
  // site's :root mounted.
  const finishProps = (props) => {
    if (!props) return props;
    const sanitized = sanitizeProps(props);
    if (Object.keys(sanitized).length === 0) return null;
    if (cssScopes) return injectFallbacksOnProps(sanitized, cssScopes);
    return sanitized;
  };

  const out = {};
  for (const [name, comp] of Object.entries(componentProperties.summary)) {
    const c = {};
    // States (default → flat at top, others → states.{name})
    if (comp.states?.default) {
      const def = finishProps(liftStateProps(comp.states.default));
      if (def) Object.assign(c, def);
    }
    const otherStates = {};
    for (const [stateName, stateProps] of Object.entries(comp.states || {})) {
      if (stateName === "default") continue;
      const lifted = finishProps(liftStateProps(stateProps));
      if (lifted) otherStates[stateName] = lifted;
    }
    if (Object.keys(otherStates).length > 0) c.states = otherStates;
    // Variants are emitted as an OBJECT keyed by variant name (e.g. { primary: {...props} }).
    // Lift to tokens.components.{name}.variants — preserve the per-variant property map.
    // Variant names are humanised (CSS module hashes stripped); duplicates after
    // cleanup are merged so `module__abc__primary` and `module__xyz__primary`
    // collapse into one `primary` entry.
    if (comp.variants && typeof comp.variants === "object" && Object.keys(comp.variants).length > 0) {
      c.variants = {};
      for (const [rawName, variantProps] of Object.entries(comp.variants)) {
        const cleanName = cleanVariantName(rawName);
        if (!cleanName || cleanName === "true" || cleanName === "false") continue;
        const lifted = finishProps(liftStateProps(variantProps));
        if (!lifted) continue;
        // Merge into existing variant of the same humanised name (later wins
        // on key conflicts — last extractor selector usually has more signals).
        c.variants[cleanName] = c.variants[cleanName]
          ? { ...c.variants[cleanName], ...lifted }
          : lifted;
      }
      if (Object.keys(c.variants).length === 0) delete c.variants;
    }
    // Backward-compat: top-level props (before states were detected)
    const topLevel = {};
    for (const [prop, info] of Object.entries(comp)) {
      if (prop === "states" || prop === "variants") continue;
      if (info && typeof info === "object" && info.most_common != null) {
        topLevel[normalizePropKey(prop)] = info.most_common;
      }
    }
    const cleanedTopLevel = finishProps(topLevel);
    if (cleanedTopLevel) {
      for (const [k, v] of Object.entries(cleanedTopLevel)) {
        if (c[k] == null) c[k] = v;
      }
    }
    if (Object.keys(c).length > 0) out[name] = c;
  }
  return Object.keys(out).length > 0 ? out : null;
}

// ── Meta from style-fingerprint ─────────────────────────────────────
function buildMeta(styleFingerprint) {
  const cls = styleFingerprint?.classification || {};
  if (!cls.primary_archetype) return null;
  const out = {
    style_archetype: cls.primary_archetype,
    archetype_confidence: cls.confidence_score ?? null,
  };
  if (cls.secondary_archetype) out.style_archetype_secondary = cls.secondary_archetype;
  return out;
}

// ── C1: Density inference from spacing scale + button padding ───────
// Returns "compact" | "regular" | "spacious"
function inferDensity(tokensDetected, componentProperties) {
  // Heuristic 1: median of spacing tokens
  const spacingPx = (tokensDetected?.spacing || [])
    .map((s) => parseFloat(s))
    .filter((x) => !isNaN(x) && x > 0);
  spacingPx.sort((a, b) => a - b);
  const medianSpacing = spacingPx.length > 0 ? spacingPx[Math.floor(spacingPx.length / 2)] : null;

  // Heuristic 2: button padding most-common value
  const btnPadding = componentProperties?.summary?.button?.states?.default?.padding?.most_common
    || componentProperties?.summary?.button?.padding?.most_common
    || null;
  const btnPaddingPx = btnPadding ? parsePaddingMaxPx(btnPadding) : null;

  // Composite signal — small numbers = compact, large = spacious
  const signals = [];
  if (medianSpacing != null) {
    if (medianSpacing < 12) signals.push("compact");
    else if (medianSpacing > 24) signals.push("spacious");
    else signals.push("regular");
  }
  if (btnPaddingPx != null) {
    if (btnPaddingPx < 10) signals.push("compact");
    else if (btnPaddingPx > 18) signals.push("spacious");
    else signals.push("regular");
  }
  if (signals.length === 0) return null;
  // Majority vote
  const counts = signals.reduce((a, s) => { a[s] = (a[s] || 0) + 1; return a; }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parsePaddingMaxPx(value) {
  // "8px 16px" → 16 (largest dimension), "12px" → 12
  const matches = String(value).match(/[\d.]+(?=px)/g);
  if (!matches || matches.length === 0) return null;
  return Math.max(...matches.map((s) => parseFloat(s)).filter((x) => !isNaN(x)));
}

// ── Theme mismatch detection ────────────────────────────────────────
// Compares tokens.colors.surface luminance vs detected default theme.
// Returns null when no signal, or { mismatch: bool, expected, actual, surface_luminance }.
function detectThemeMismatch(tokens, themeDefault) {
  if (!themeDefault?.default || !tokens?.colors?.surface) return null;
  const surface = tokens.colors.surface;
  const lum = computeLumFromHex(surface);
  if (lum == null) return null;
  const actual = lum < 0.4 ? "dark" : "light";
  const expected = themeDefault.default;
  return {
    mismatch: actual !== expected,
    expected,
    actual,
    surface,
    surface_luminance: Math.round(lum * 100) / 100,
    confidence: themeDefault.confidence || "low",
  };
}

function computeLumFromHex(hex) {
  if (!hex || typeof hex !== "string") return null;
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  if ([r, g, b].some((v) => isNaN(v))) return null;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ── Coverage: classify what's detected vs missing, with reason ─────
// Categories mirror the audit (32 cells × 5 layers). For each missing item,
// classifyGap() inspects the raw CSS to decide WHY it's missing:
//   - not_used_by_site: CSS truly has no signal (flat design, no glassmorphism, etc.)
//   - flat_design: shadows are explicitly "none" or near-zero — design intent
//   - extractor_limitation: signal exists in CSS but detector heuristic missed it
//   - obfuscated: CSS-in-JS or hash classes elude pattern matching
//   - partial_detection: some data extracted but not the full structure
const REASON_CODES = {
  not_used_by_site: "Site does not use this token category. CSS has no relevant declarations.",
  flat_design: "Site is intentionally flat. No box-shadow declarations beyond 'none'.",
  no_glassmorphism: "Site does not use backdrop-filter. Glass effects absent by design.",
  no_form_surface: "Site lacks public forms. Label/help/error tokens are conventionally undefined.",
  marketing_surface: "Marketing-only site. Component (tabs/avatar/tooltip) doesn't appear in homepage flow.",
  no_variants: "Site uses a single button style. No variant suffix detected (primary/secondary/ghost).",
  obfuscated: "Site uses CSS-in-JS / hash-based class names that elude pattern matching.",
  extractor_limitation: "Signal exists in CSS but current detector heuristics didn't match.",
  theme_mismatch: "Tokens encode the opposite theme of what the site renders by default. Re-extract recommended.",
  unknown: "Could not classify — investigate manually.",
};

function classifyGap(category, css) {
  if (!css) return "unknown";
  switch (category) {
    case "L3.backdrop_blur":
      return /backdrop-filter\s*:\s*(?!none)/.test(css) ? "extractor_limitation" : "no_glassmorphism";
    case "L3.shadow_ladder": {
      const total = (css.match(/box-shadow\s*:/g) || []).length;
      const none = (css.match(/box-shadow\s*:\s*none/g) || []).length;
      if (total === 0) return "not_used_by_site";
      if (none / Math.max(1, total) > 0.7) return "flat_design";
      return "extractor_limitation";
    }
    case "L2.tooltip":
      return /(?:tooltip|popover|\[role=["']?tooltip)/i.test(css) ? "extractor_limitation" : "not_used_by_site";
    case "L2.modal":
      return /(?:modal|dialog|drawer|\[role=["']?dialog)/i.test(css) ? "extractor_limitation" : "not_used_by_site";
    case "L2.tab":
      return /(?:\.tab\b|tabs|\[role=["']?tab)/i.test(css) ? "extractor_limitation" : "marketing_surface";
    case "L2.avatar":
      return /(?:avatar|profile-pic|profile-img|user-image)/i.test(css) ? "extractor_limitation" : "marketing_surface";
    case "L2.label":
    case "L2.help_text":
    case "L2.error_text":
      return /(?:^|[\s,])label\b|\.form-label|\.field-error|\.help-text/i.test(css) ? "extractor_limitation" : "no_form_surface";
    case "L2.alert":
      return /(?:\.alert|\.banner|\.notice|\.toast|\[role=["']?alert)/i.test(css) ? "extractor_limitation" : "not_used_by_site";
    case "L2.table":
      return /(?:^|[\s,])table\b|\.data-table|\.tbl/i.test(css) ? "extractor_limitation" : "not_used_by_site";
    case "L2.nav":
      return /(?:^|[\s,])nav\b|\.nav|navigation|navbar/i.test(css) ? "obfuscated" : "not_used_by_site";
    case "L2.badge":
      return /(?:badge|tag|pill|chip|eyebrow)/i.test(css) ? "extractor_limitation" : "not_used_by_site";
    case "L2.button.variants":
      return /(?:btn--|btn-(?:primary|secondary|ghost|outline)|\[data-variant|is-primary|is-secondary)/i.test(css)
        ? "extractor_limitation"
        : "no_variants";
    case "L2.button.states":
      return /:hover|:focus|:active|\[data-state/i.test(css) ? "extractor_limitation" : "not_used_by_site";
    default:
      return "unknown";
  }
}

function buildCoverage({ tokens, ext, breakpoints, css }) {
  function present(v) {
    if (v == null) return false;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return !!v;
  }
  function depth(v) {
    if (!v || typeof v !== "object") return 0;
    let d = 1;
    if (v.states && Object.keys(v.states).length) d = 2;
    if (v.variants && (Array.isArray(v.variants) ? v.variants.length : Object.keys(v.variants).length)) d = 3;
    return d;
  }

  const c = ext.components || {};
  const checks = [
    ["L1.colors_semantic", present(tokens.colors)],
    ["L1.colors_extended", Object.keys(tokens.colors || {}).length >= 4],
    ["L1.typography", present(tokens.typography)],
    ["L1.rounded", present(tokens.rounded)],
    ["L1.spacing", present(tokens.spacing)],
    ["L2.button", depth(c.button) >= 1],
    ["L2.button.states", depth(c.button) >= 2],
    ["L2.button.variants", depth(c.button) >= 3],
    ["L2.card", depth(c.card) >= 1],
    ["L2.input", depth(c.input) >= 1],
    ["L2.badge", depth(c.badge) >= 1],
    ["L2.link", depth(c.link) >= 1],
    ["L2.nav", depth(c.nav) >= 1],
    ["L2.tab", depth(c.tab) >= 1],
    ["L2.alert", depth(c.alert) >= 1],
    ["L2.table", depth(c.table) >= 1],
    ["L2.tooltip", depth(c.tooltip) >= 1],
    ["L2.modal", depth(c.modal) >= 1],
    ["L2.avatar", depth(c.avatar) >= 1],
    ["L2.label", depth(c.label) >= 1],
    ["L3.shadow_ladder", present(ext.shadow)],
    ["L3.motion_buckets", present(ext.motion)],
    ["L3.gradient", present(ext.gradient)],
    ["L3.backdrop_blur", present(ext.backdrop_blur)],
    ["L3.opacity_scale", present(ext.opacity)],
    ["L3.focus_ring", present(ext.focus_ring)],
    ["L4.breakpoints", (breakpoints || []).length > 0],
    ["L4.z_index", present(ext.z_index)],
    ["L4.container_max_width", present(ext.container)],
    ["L5.style_archetype", !!ext.meta?.style_archetype],
    ["L5.density", !!ext.meta?.density],
    ["L5.motion_preference", !!ext.meta?.motion_preference],
  ];

  const detected = [];
  const missing = [];
  for (const [cat, ok] of checks) {
    if (ok) {
      detected.push(cat);
    } else {
      missing.push({
        category: cat,
        reason: classifyGap(cat, css),
      });
    }
  }

  return {
    overall: { detected: detected.length, total: checks.length, percent: Math.round((detected.length / checks.length) * 1000) / 10 },
    by_layer: aggregateByLayer(checks),
    detected,
    missing,
    reason_codes: REASON_CODES,
  };
}

function aggregateByLayer(checks) {
  const layers = {};
  for (const [cat, ok] of checks) {
    const layer = cat.split(".")[0];
    if (!layers[layer]) layers[layer] = { detected: 0, total: 0 };
    layers[layer].total++;
    if (ok) layers[layer].detected++;
  }
  for (const k of Object.keys(layers)) {
    layers[k].percent = Math.round((layers[k].detected / layers[k].total) * 100);
  }
  return layers;
}

// ── C1: Motion preference inference from duration distribution ──────
// Returns "snappy" | "smooth" | "minimal"
function inferMotionPreference(motion) {
  if (!motion?.durations || motion.durations.length === 0) return null;
  const ms = motion.durations
    .map((d) => parseDurationMs(d.value || d))
    .filter((x) => x != null && x > 0 && x <= 1500);
  if (ms.length === 0) return "minimal"; // no transitions found, only animations
  ms.sort((a, b) => a - b);
  const median = ms[Math.floor(ms.length / 2)];
  if (median < 200) return "snappy";
  if (median < 400) return "smooth";
  return "minimal";
}

// ── Top-level entry point ───────────────────────────────────────────
// Reads files in `runDir` and returns:
//   {
//     componentsPatch: object (to merge into tokens.json#components),
//     extended: object (full tokens-extended.json content),
//   }
function buildEnrichment(runDir) {
  const read = (rel) => {
    const p = path.join(runDir, rel);
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
  };

  const componentProperties = read("inputs/component-properties.json");
  const shadows = read("inputs/shadows.json");
  const motion = read("inputs/motion.json");
  const styleFingerprint = read("style-fingerprint.json");
  const tokensDetected = read("inputs/tokens-detected.json");

  // L3/L4 extras (B1) — added by detectGradients/detectBackdropBlur/etc
  const gradients = read("inputs/gradients.json");
  const backdropBlur = read("inputs/backdrop-blur.json");
  const zIndex = read("inputs/z-index.json");
  const container = read("inputs/container.json");
  const opacityScale = read("inputs/opacity-scale.json");
  const focusRing = read("inputs/focus-ring.json");

  // Pre-parse the source CSS's :root and dark-theme blocks once. We pass
  // these scopes into buildComponents so var() values get a concrete
  // fallback injected — `var(--ds-x)` becomes `var(--ds-x, #...)`.
  let cssEarly = "";
  try {
    const cssPath = path.join(runDir, "inputs", "css-collected.css");
    if (fs.existsSync(cssPath)) cssEarly = fs.readFileSync(cssPath, "utf8");
  } catch {}
  const cssScopes = parseCustomProperties(cssEarly);

  const components = buildComponents(componentProperties, { cssScopes });
  const shadowLadder = bucketShadows(shadows);
  const motionBuckets = bucketMotion(motion);
  const meta = buildMeta(styleFingerprint);

  // C1: density + motion_preference inference
  if (meta) {
    const density = inferDensity(tokensDetected, componentProperties);
    if (density) meta.density = density;
    const motionPref = inferMotionPreference(motion);
    if (motionPref) meta.motion_preference = motionPref;
  }

  const extended = {
    schema_version: "1.1",
    source: { run_dir_basename: path.basename(runDir) },
  };
  if (components) extended.components = components;
  if (shadowLadder) extended.shadow = shadowLadder;
  if (motionBuckets) extended.motion = motionBuckets;
  if (meta) extended.meta = meta;

  // L3 extras
  if (gradients && (gradients.primary || gradients.total_unique > 0)) {
    extended.gradient = {
      primary: gradients.primary,
      secondary: gradients.secondary,
      total_unique: gradients.total_unique,
    };
  }
  if (backdropBlur && backdropBlur.has_backdrop_blur) {
    extended.backdrop_blur = {
      sm: backdropBlur.sm,
      md: backdropBlur.md,
      lg: backdropBlur.lg,
    };
  }
  if (opacityScale && opacityScale.disabled != null) {
    extended.opacity = {
      disabled: opacityScale.disabled,
      muted: opacityScale.muted,
      hover: opacityScale.hover,
    };
  }
  if (focusRing && focusRing.detected) {
    extended.focus_ring = {
      outline: focusRing.outline || null,
      outline_offset: focusRing.outline_offset || null,
      box_shadow: focusRing.box_shadow || null,
    };
  }

  // L4 extras
  if (zIndex && (zIndex.base != null || zIndex.modal != null)) {
    extended.z_index = {
      base: zIndex.base,
      dropdown: zIndex.dropdown,
      modal: zIndex.modal,
      toast: zIndex.toast,
      tooltip: zIndex.tooltip,
    };
  }
  if (container && container.value) {
    extended.container = { max_width: container.value };
  }

  // Load tokens.json early so themed-mode classification (below) can read
  // the surface luminance.
  let tokensJson = null;
  try {
    const tp = path.join(runDir, "tokens.json");
    if (fs.existsSync(tp)) tokensJson = JSON.parse(fs.readFileSync(tp, "utf8"));
  } catch {}

  // Themed CSS custom properties — expose light + dark vars as flat resolved
  // maps so downstream renderers can inline-declare them on a wrapper instead
  // of parsing CSS at runtime.
  //
  // defaultMode classification — high-confidence detector wins, otherwise
  // surface composition decides.
  //
  //   1. theme-default.json with HIGH confidence → trust verbatim. Sites
  //      with explicit `<html data-theme="dark">` (Linear) or
  //      `<meta color-scheme="dark light">` (Vercel) signal their default
  //      unambiguously, even when the LLM-extracted tokens.json snapshots
  //      the light theme.
  //   2. Surface luminance from tokens.json — direct signal of the rendered
  //      surface. Catches mixed-mode sites (light surface + dark modal vars)
  //      and dark-default brandbooks captured via a light variant.
  //   3. theme-default.json with medium confidence as last resort.
  //
  // supportsDark is the canonical toggle signal: only light-default sites
  // that ALSO ship dark vars get one.
  const themed = buildThemedVars(cssScopes);
  const themeDefault = read("inputs/theme-default.json");
  const surfaceColor =
    tokensJson?.preview_tokens?.surface_bg ??
    tokensJson?.colors?.surface ??
    null;
  const surfaceLum = computeLumFromHex(surfaceColor);
  const hasDarkVars = Object.keys(themed.dark).length > 0;
  const detectorHigh = themeDefault?.confidence === "high";

  // Trust theme-default.json verbatim when it has any pick (i.e. when the
  // detector found at least one signal and isn't pure no-signal-fallback).
  // The detector now reads HTML markers AND CSS background-var luminance,
  // so even "low" confidence picks (e.g. OpenAI's `:root:not(:where(.light))`
  // dark default) are more reliable than the LLM-extracted surface, which
  // can snapshot the light theme even when the live site renders dark.
  const detectorPick = themeDefault?.default;
  const detectorHasSignal = hasThemeSignal(themeDefault);

  let defaultMode;
  if (detectorHasSignal && detectorPick) {
    defaultMode = detectorPick === "dark" ? "dark" : "light";
  } else if (surfaceLum != null) {
    defaultMode = surfaceLum < 0.42 ? "dark" : "light";
  } else if (hasDarkVars) {
    defaultMode = "dark";
  } else {
    defaultMode = "light";
  }
  // Mark unused locals so eslint doesn't trip on the higher-confidence path
  // that was simplified away.
  void detectorHigh;

  themed.defaultMode = defaultMode;
  themed.supportsDark = defaultMode === "light" && hasDarkVars;
  if (Object.keys(themed.light).length > 0 || hasDarkVars) {
    extended.themed = themed;
  }
  const breakpoints = read("inputs/breakpoints.json") || [];
  // Reuse the CSS string we already loaded above for buildComponents — no
  // need to re-read the file from disk.
  extended.coverage = buildCoverage({
    tokens: tokensJson || {},
    ext: extended,
    breakpoints,
    css: cssEarly,
  });

  // Theme + mismatch detection — surface dark/light disagreement vs detected default
  if (themeDefault) {
    extended.theme = {
      default: themeDefault.default,
      confidence: themeDefault.confidence,
      signals: themeDefault.signals,
    };
    const mismatch = detectThemeMismatch(tokensJson, themeDefault);
    if (mismatch) {
      extended.theme.mismatch = mismatch.mismatch;
      extended.theme.expected = mismatch.expected;
      extended.theme.actual = mismatch.actual;
      extended.theme.surface_luminance = mismatch.surface_luminance;
      // Append to coverage.missing as a flagged issue when mismatched
      if (mismatch.mismatch && extended.coverage) {
        extended.coverage.missing = extended.coverage.missing || [];
        extended.coverage.missing.push({
          category: "L0.theme_consistency",
          reason: "theme_mismatch",
          detail: `tokens encode '${mismatch.actual}' theme but site renders '${mismatch.expected}' by default`,
        });
      }
    }
  }

  return {
    componentsPatch: components,
    extended,
  };
}

// Apply enrichment into a tokens.json object (mutates and returns it).
// Only fills components that the LLM left empty/missing.
function applyEnrichmentToTokens(tokens, componentsPatch) {
  if (!tokens || typeof tokens !== "object") return tokens;
  if (!componentsPatch) return tokens;
  tokens.components = tokens.components || {};
  for (const [name, fields] of Object.entries(componentsPatch)) {
    const existing = tokens.components[name] || {};
    // Only fill missing fields — don't overwrite LLM choices
    const merged = { ...fields, ...existing };
    // BUT: if existing was empty/null, prefer detected
    tokens.components[name] = merged;
  }
  return tokens;
}

module.exports = {
  buildEnrichment,
  applyEnrichmentToTokens,
  // Exposed for tests
  bucketShadows,
  bucketMotion,
  buildComponents,
  buildMeta,
  buildCoverage,
  classifyGap,
  inferDensity,
  inferMotionPreference,
  parseShadowBlur,
  parseDurationMs,
  normalizePropKey,
  REASON_CODES,
};
