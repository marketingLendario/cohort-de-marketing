// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const { URL: NodeURL } = require("url");
const { resolveCssVar } = require("./extractors.cjs");
const { KNOWN_GOOGLE_FONTS } = require("./fetch.cjs");

// ── Color flattening (only valid color values) ──────────────────────
function flattenColors(colors, prefix = "") {
  if (!colors || typeof colors !== "object") return [];
  const out = [];
  for (const [k, v] of Object.entries(colors)) {
    const label = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flattenColors(v, label));
      continue;
    }
    if (typeof v === "string") {
      const s = v.trim();
      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s) || /^rgb(a)?\(/i.test(s) || /^hsl(a)?\(/i.test(s)) {
        out.push({ key: label, value: s });
      }
    }
  }
  return out;
}

// ── Typography helpers ──────────────────────────────────────────────
function typographyEntries(typo) {
  if (!typo || typeof typo !== "object") return [];
  return Object.entries(typo)
    .filter(([, v]) => v && typeof v === "object" && !Array.isArray(v))
    .map(([name, spec]) => ({ name, spec }));
}

function firstFontFamily(spec) {
  const raw = spec.fontFamily ?? spec.font_family ?? spec["font-family"];
  if (typeof raw !== "string") return "";
  return raw.split(",")[0].trim().replace(/['"]/g, "");
}

// ── Google Fonts CDN URL ────────────────────────────────────────────
const GENERIC_FONTS = new Set([
  "inherit", "sans-serif", "serif", "monospace", "system-ui",
  "ui-sans-serif", "ui-serif", "ui-monospace", "apple system",
]);

function buildGoogleFontsHref(families) {
  const cleaned = [
    ...new Set(
      families
        .map((f) => f.trim())
        .filter((f) => f && !GENERIC_FONTS.has(f.toLowerCase()) && KNOWN_GOOGLE_FONTS.has(f.toLowerCase().replace(/^"|"$/g, "")))
    ),
  ];
  if (!cleaned.length) return null;
  const q = cleaned.map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

// ── Self-hosted @font-face block (uses pre-embedded data: URLs) ─────
function buildSelfHostedFontFaces(fontFaces, sourceUrl, requestedFamilies, embeddedFonts) {
  if (!Array.isArray(fontFaces) || fontFaces.length === 0) return "";
  const requested = new Set((requestedFamilies || []).map(f => String(f).trim().toLowerCase().replace(/^"|"$/g, "")));
  const blocks = [];
  for (const face of fontFaces) {
    if (!face.family) continue;
    const familyLower = String(face.family).toLowerCase().replace(/^"|"$/g, "").trim();
    if (requested.size > 0 && !requested.has(familyLower)) continue;
    if (KNOWN_GOOGLE_FONTS.has(familyLower)) continue;

    if (!face.src_urls || face.src_urls.length === 0) continue;
    const absoluteUrls = [];
    for (let i = 0; i < face.src_urls.length; i++) {
      const u = face.src_urls[i];
      const fmt = (face.src_formats && face.src_formats[i]) || "";
      try {
        const absolute = new NodeURL(u, sourceUrl).toString();
        const embedded = embeddedFonts && embeddedFonts[absolute];
        if (embedded) {
          absoluteUrls.push(`url("${embedded}")${fmt ? ` format("${fmt}")` : ""}`);
        } else {
          absoluteUrls.push(`url("${absolute}")${fmt ? ` format("${fmt}")` : ""}`);
        }
      } catch {}
    }
    if (absoluteUrls.length === 0) continue;
    const block = `@font-face {
  font-family: "${face.family}";
  font-style: ${face.style || "normal"};
  font-weight: ${face.weight || "400"};
  font-display: swap;
  src: ${absoluteUrls.join(", ")};
}`;
    blocks.push(block);
  }
  return blocks.join("\n\n");
}

// ── Spacing/radius scale conversion to px ───────────────────────────
function parsePx(value) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const s = String(value).trim();
  let m = s.match(/^(\d+(?:\.\d+)?)\s*px$/i);
  if (m) return parseFloat(m[1]);
  m = s.match(/^(\d+(?:\.\d+)?)\s*r?em$/i);
  if (m) return parseFloat(m[1]) * 16;
  m = s.match(/^(\d+(?:\.\d+)?)$/);
  if (m) return parseFloat(m[1]);
  return null;
}

function scaleBlocks(data) {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data)
    .map(([key, val]) => ({ key, px: parsePx(val) || 0 }))
    .filter((x) => x.px > 0);
}

// ── Color → hex normalization (re-export from utils for tokens consumers) ─
function colorToHex(value) {
  if (!value) return null;
  const s = String(value).trim();
  let m = s.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/);
  if (m) return "#" + m[1].toLowerCase();
  m = s.match(/^#([0-9a-fA-F]{3})$/);
  if (m) {
    const c = m[1];
    return ("#" + c[0] + c[0] + c[1] + c[1] + c[2] + c[2]).toLowerCase();
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (m) {
    const r = Math.round(parseFloat(m[1]));
    const g = Math.round(parseFloat(m[2]));
    const b = Math.round(parseFloat(m[3]));
    const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return ("#" + toHex(r) + toHex(g) + toHex(b)).toLowerCase();
  }
  if (/^(transparent|currentcolor|inherit)$/i.test(s)) return null;
  return null;
}

// ── Component-level token resolution (from CSS vars heuristic) ──────
function getFirst(cssVars, ...names) {
  for (const n of names) {
    const v = resolveCssVar(cssVars, n);
    if (v) return v;
  }
  return null;
}

function pickComponentTokens(cssVars) {
  return {
    button: {
      primary: {
        bg: getFirst(cssVars,
          "--button-primary--background", "--button-primary-bg", "--btn-primary-bg",
          "--cta-bg", "--cta-primary-bg", "--action-bg", "--sk-button-background",
          "--button-background", "--button--background", "--btn-bg"
        ),
        text: getFirst(cssVars,
          "--button-primary--text", "--button-primary-color", "--btn-primary-color",
          "--btn-primary-text", "--cta-text", "--cta-primary-text",
          "--sk-button-color", "--sk-button-foreground", "--sk-button-text-color",
          "--button-text", "--button--text", "--button-color", "--button-foreground"
        ),
        border: getFirst(cssVars,
          "--button-primary--border", "--button-primary-border", "--btn-primary-border",
          "--sk-button-border-color", "--button-border", "--button--border"
        ),
      },
      secondary: {
        bg: getFirst(cssVars,
          "--button-secondary--background", "--button-secondary-bg", "--btn-secondary-bg",
          "--button-outline-bg", "--button-ghost-bg"
        ),
        text: getFirst(cssVars,
          "--button-secondary--text", "--button-secondary-color", "--btn-secondary-color",
          "--button-outline-text", "--button-ghost-text"
        ),
        border: getFirst(cssVars,
          "--button-secondary--border", "--button-secondary-border", "--btn-secondary-border",
          "--button-outline-border"
        ),
      },
      tertiary: {
        bg: getFirst(cssVars,
          "--button-tertiary--background", "--button-tertiary-bg", "--btn-tertiary-bg",
          "--button-text-bg", "--link-button-bg"
        ),
        text: getFirst(cssVars,
          "--button-tertiary--text", "--button-tertiary-color", "--btn-tertiary-color",
          "--link-color", "--sk-body-link-color"
        ),
        border: getFirst(cssVars,
          "--button-tertiary--border", "--button-tertiary-border", "--btn-tertiary-border"
        ),
      },
      radius: getFirst(cssVars,
        "--button--radius", "--button-radius", "--radius--button", "--btn-radius",
        "--sk-button-border-radius", "--button-border-radius"
      ),
    },
    surface: {
      base: getFirst(cssVars,
        "--background", "--surface", "--bg", "--page-background",
        "--sk-body-background-color", "--canvas", "--color-bg-default"
      ),
      secondary: getFirst(cssVars,
        "--background-secondary", "--surface-secondary", "--bg-secondary",
        "--surface-elevated", "--color-bg-subtle"
      ),
      card: getFirst(cssVars,
        "--card", "--card-background", "--card-bg", "--surface-card",
        "--color-canvas-default", "--bg-card"
      ),
      cardFaded: getFirst(cssVars, "--card-faded", "--card-secondary"),
    },
    text: {
      base: getFirst(cssVars,
        "--text", "--foreground", "--color-text", "--text-color", "--fg",
        "--sk-body-text-color", "--color-fg-default"
      ),
      muted: getFirst(cssVars,
        "--text-muted", "--text-secondary", "--text-subtle", "--text-agate",
        "--color-fg-muted", "--text-tertiary", "--muted-foreground"
      ),
    },
    border: {
      base: getFirst(cssVars,
        "--border", "--border-color", "--color-border-default",
        "--sk-border-color", "--hairline"
      ),
      strong: getFirst(cssVars,
        "--border-strong", "--border-emphasized", "--color-border-emphasis"
      ),
    },
    input: {
      bg: getFirst(cssVars,
        "--input--background", "--field--background", "--form-input--background",
        "--input-bg", "--field-bg"
      ),
      text: getFirst(cssVars,
        "--input--text", "--field--text", "--form-input--text", "--input-color"
      ),
      border: getFirst(cssVars,
        "--input--border", "--field--border", "--form-input--border", "--input-border"
      ),
    },
  };
}

module.exports = {
  flattenColors,
  typographyEntries,
  firstFontFamily,
  buildGoogleFontsHref,
  buildSelfHostedFontFaces,
  scaleBlocks,
  parsePx,
  colorToHex,
  getFirst,
  pickComponentTokens,
  GENERIC_FONTS,
};
