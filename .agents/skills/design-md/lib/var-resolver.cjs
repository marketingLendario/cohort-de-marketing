// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

// var-resolver.cjs — turn `var(--ds-x)` into `var(--ds-x, <concrete-fallback>)`
// by walking the source CSS's :root-style declarations.
//
// Why we need this: extracted component contracts (extended.components.button.bg
// = "var(--ds-gray-1000)") work only inside the source site, where the custom
// property is defined. Downstream renderers don't have those vars mounted, so
// the browser silently drops the declaration.
//
// We mitigate by injecting the resolved value as the var() fallback. The
// browser still prefers the cascade (so re-mounted vars / dark-theme overrides
// keep working), but when --ds-gray-1000 is absent the fallback hex carries
// the design intent. Best of both worlds — fidelity + portability.

// Selectors we treat as the canonical "light" scope. We keep things simple:
// any block whose selector contains `:root` or `:host` becomes the global
// declaration source.
//
// Dark scope detection is broader because sites disagree on the convention.
// We match:
//   - .dark, .dark-theme  (Vercel, generic)
//   - [data-theme="dark"], [data-theme=dark]  (Tailwind / shadcn)
//   - [data-color-mode=dark], [data-dark-theme=dark]  (GitHub Primer)
//   - @media (prefers-color-scheme: dark)  (system-pref sites)
const LIGHT_SELECTOR_RE = /:root\b|:host\b/;
const DARK_SELECTOR_RE =
  /\.dark(?:-theme)?\b|\[data-theme(?:["']?)\s*=\s*["']?dark["']?\]|\[data-color-mode(?:["']?)\s*=\s*["']?dark["']?\]|\[data-dark-theme(?:[*~|]?)["']?\s*=\s*["']?dark["']?(?:[\w_]*)?\]|prefers-color-scheme:\s*dark/;
const SYSTEM_SCOPE_RE = /\.brandbook-root\b|\.theme-[\w-]+\b/;
const EXPLICIT_THEME_SELECTOR_RE = /\[data-(?:theme|color-mode)[^\]]+\]|\.dark(?:-theme)?\b|\.light(?:-theme)?\b/;

const VAR_USE_RE = /var\(\s*(--[\w-]+)(\s*,\s*([^()]*?))?\)/g;
const VAR_DECL_RE = /(--[\w-]+)\s*:\s*([^;}]+?)\s*(?:;|$)/g;

// Pre-extract `@media (prefers-color-scheme: dark) { ... }` bodies into a
// flat dark-scoped CSS string so our flat block walker (which doesn't
// understand nested at-rules) still picks them up. The original CSS is
// returned with those at-rule bodies stripped to avoid double-counting.
function extractPrefersDarkBlocks(css) {
  if (!css.includes("prefers-color-scheme")) return { rest: css, dark: "" };
  // Match @media ... { body } with one level of nesting tolerance.
  const RE = /@media[^{]*?\bprefers-color-scheme\s*:\s*dark\b[^{]*\{((?:[^{}]|\{[^{}]*\})*)\}/g;
  const dark = [];
  const rest = css.replace(RE, (_, body) => {
    dark.push(body);
    return "";
  });
  return { rest, dark: dark.join("\n") };
}

// Parse the CSS file once. Returns { light, dark, preferred, global }:
//   - light:  declarations in :root / :host blocks (canonical light theme)
//   - dark:   declarations in .dark / .dark-theme / [data-theme=dark]
//   - preferred: dense/proprietary DS scopes that should win over generic :root
//   - global: declarations from ANY other selector (best-effort fallback)
// For light/dark we use last-writer-wins (matches CSS cascade for
// same-specificity rules at the document root). For `global` we use
// most-frequent-value because the same var name often gets several
// values across unrelated selectors (Apple's --sk-button-color appears
// 6× with different values; the most common one is the canonical token).
function parseCustomProperties(css) {
  const light = new Map();
  const dark = new Map();
  const preferred = new Map();
  const selectorCounts = new Map();
  const globalCounts = new Map(); // Map<name, Map<value, count>>
  if (!css || typeof css !== "string") {
    return { light, dark, preferred, preferred_selector: null, global: new Map() };
  }

  // Pull out @media (prefers-color-scheme: dark) bodies first — flat block
  // walker can't traverse nested at-rules. Treat them as if they were a
  // top-level dark scope.
  const { rest: cssRest, dark: darkMediaBody } = extractPrefersDarkBlocks(css);

  const ingest = (cssText, forceScope /* "dark" | "light" | null */) => {
    const BLOCK_RE = /([^{}]+)\{([^{}]+)\}/g;
    let block;
    while ((block = BLOCK_RE.exec(cssText)) !== null) {
      const selector = block[1].trim();
      const body = block[2];
      if (!body.includes("--")) continue;

      const isDark =
        forceScope === "dark" || DARK_SELECTOR_RE.test(selector);
      const isLight =
        !isDark && (forceScope === "light" || LIGHT_SELECTOR_RE.test(selector));
      const isPreferred = !isLight && SYSTEM_SCOPE_RE.test(selector);

      let m;
      let declarationsInBlock = 0;
      VAR_DECL_RE.lastIndex = 0;
      while ((m = VAR_DECL_RE.exec(body)) !== null) {
        const name = m[1];
        const value = m[2].trim().replace(/!important/gi, "").trim();
        declarationsInBlock++;
        if (isPreferred) {
          preferred.set(name, value);
        }
        if (isDark) {
          dark.set(name, value);
        } else if (isLight) {
          light.set(name, value);
        } else {
          let counts = globalCounts.get(name);
          if (!counts) {
            counts = new Map();
            globalCounts.set(name, counts);
          }
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      }
      if (declarationsInBlock > 0) {
        selectorCounts.set(selector, (selectorCounts.get(selector) || 0) + declarationsInBlock);
      }
    }
  };

  ingest(cssRest, null);
  if (darkMediaBody) ingest(darkMediaBody, "dark");

  // Reduce frequency map to a single value per var: most-common wins.
  // Ties broken by alphabetical order so output is deterministic.
  const global = new Map();
  for (const [name, counts] of globalCounts) {
    const ranked = [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1),
    );
    global.set(name, ranked[0][0]);
  }

  // Fallback for proprietary scopes without an obvious name: the densest
  // non-root selector with many custom properties is usually a design-system
  // wrapper. Promote it to preferred so renderers do not fall back to a generic
  // light :root when the source system is scoped.
  if (preferred.size === 0) {
    const dense = [...selectorCounts.entries()]
      .filter(([selector]) =>
        !LIGHT_SELECTOR_RE.test(selector) &&
        !DARK_SELECTOR_RE.test(selector) &&
        !EXPLICIT_THEME_SELECTOR_RE.test(selector)
      )
      .sort((a, b) => b[1] - a[1])
      .find(([, count]) => count >= 20);
    if (dense) {
      const [denseSelector] = dense;
      const BLOCK_RE = /([^{}]+)\{([^{}]+)\}/g;
      let block;
      while ((block = BLOCK_RE.exec(cssRest)) !== null) {
        if (block[1].trim() !== denseSelector) continue;
        VAR_DECL_RE.lastIndex = 0;
        let dm;
        while ((dm = VAR_DECL_RE.exec(block[2])) !== null) {
          const name = dm[1];
          const value = dm[2].trim().replace(/!important/gi, "").trim();
          preferred.set(name, value);
        }
      }
    }
  }

  const preferredSelector = preferred.size > 0
    ? [...selectorCounts.entries()]
        .filter(([selector]) => SYSTEM_SCOPE_RE.test(selector))
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null
    : null;

  return { light, dark, preferred, preferred_selector: preferredSelector, global };
}

// Resolve a var name to its terminal value by following the chain. Stops at
// the first non-var value or when it hits a cycle. Returns null when no
// resolution is possible.
function resolveTerminal(map, name, depth = 0) {
  if (depth > 16) return null; // cycle / pathological depth
  const value = map.get(name);
  if (value == null) return null;
  // Strip trailing fallback inside `var(--a, var(--b, x))` chains so we keep
  // following the primary var. The terminal is the first non-var value.
  const match = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*[^)]*)?\)\s*$/);
  if (match) {
    return resolveTerminal(map, match[1], depth + 1);
  }
  return value;
}

// Walk a value string and rewrite every `var(--x)` into `var(--x, <fallback>)`.
// If the var already has a fallback, leave it alone. If we can't resolve --x
// in light or global scope, leave it alone (renderer will use its own fallback).
// We try light first (canonical light theme), then global (best-effort —
// captures vars declared inside specific selectors like `.button-primary`).
function injectFallbacks(value, scopes) {
  if (typeof value !== "string" || !value.includes("var(")) return value;
  const { preferred, light, global } = scopes;
  return value.replace(VAR_USE_RE, (full, name, hasFallback, fallback) => {
    if (hasFallback && fallback != null && fallback.trim()) {
      return full;
    }
    let resolved = preferred ? resolveTerminal(preferred, name) : null;
    if (!resolved) resolved = resolveTerminal(light, name);
    if (!resolved && global) resolved = resolveTerminal(global, name);
    if (!resolved) return full;
    const enriched = injectFallbacks(resolved, scopes);
    return `var(${name}, ${enriched})`;
  });
}

// Rewrite all string values in a flat record. Numbers + non-strings pass
// through. Useful for the prop maps coming out of buildComponents().
function injectFallbacksOnProps(props, scopes) {
  if (!props || typeof props !== "object") return props;
  const out = {};
  for (const [k, v] of Object.entries(props)) {
    out[k] = typeof v === "string" ? injectFallbacks(v, scopes) : v;
  }
  return out;
}

// Build a flat map { --var: terminal_value } from a Map, walking aliases.
// Vars that don't resolve (point at undefined names) are kept verbatim with
// their declared value, so the consumer can still attempt browser resolution.
function flattenScope(scope) {
  if (!scope || scope.size === 0) return {};
  const out = {};
  for (const [name] of scope) {
    const terminal = resolveTerminal(scope, name);
    out[name] = terminal != null ? terminal : scope.get(name);
  }
  return out;
}

// Build the themed mapping for tokens-extended.json. Returns null when the
// site has no detectable dark capability (no .dark / .dark-theme blocks).
// The returned shape is friendly to the renderer: vars are flat strings,
// already resolved through the alias chain so the UI can apply them inline
// without re-parsing CSS.
function buildThemedVars(scopes) {
  const { light, dark, preferred, global } = scopes;
  const supportsDark = dark && dark.size > 0;
  // Light scope expanded with global as best-effort. We DON'T merge global
  // into dark by default — global vars are usually light-mode declarations
  // from arbitrary selectors; using them as dark fallback would corrupt the
  // dark theme.
  const lightFlat = { ...flattenScope(global), ...flattenScope(light) };
  const preferredFlat = flattenScope(preferred);
  const darkFlat = supportsDark ? flattenScope(dark) : {};
  return {
    supportsDark: Boolean(supportsDark),
    preferredSelector: scopes.preferred_selector || null,
    preferred: preferredFlat,
    light: lightFlat,
    dark: darkFlat,
  };
}

module.exports = {
  parseCustomProperties,
  resolveTerminal,
  injectFallbacks,
  injectFallbacksOnProps,
  flattenScope,
  buildThemedVars,
  extractPrefersDarkBlocks,
};
