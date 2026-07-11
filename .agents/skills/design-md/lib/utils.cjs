// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const { URL: NodeURL } = require("url");
const YAML = require("yaml");

// ── CLI args ────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { url: null, out: null, prompt: null, compare: null, "no-content-gate": false, "no-llm-retry": false, "no-reuse": false, provider: null, model: null, "max-tokens": 8192 };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") args.url = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--prompt") args.prompt = argv[++i];
    else if (a === "--compare") args.compare = argv[++i];
    else if (a === "--no-content-gate") args["no-content-gate"] = true;
    else if (a === "--no-llm-retry") args["no-llm-retry"] = true;
    else if (a === "--no-reuse") args["no-reuse"] = true;
    else if (a === "--provider") args.provider = argv[++i] || null;
    else if (a === "--model") args.model = argv[++i] || null;
    else if (a === "--max-tokens") { const n = parseInt(argv[++i], 10); args["max-tokens"] = isNaN(n) ? 8192 : n; }
    else if (!a.startsWith("--")) positional.push(a);
  }
  if (!args.url && positional.length > 0) args.url = positional[0];
  return args;
}

function slugifyHost(url) {
  try {
    const u = new NodeURL(url);
    return u.host.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-|-$/g, "");
  } catch {
    return "extract";
  }
}

// ── Company-name extraction ─────────────────────────────────────────
// "https://www.anthropic.com/foo" → "anthropic"
// "https://brand.acme.com" → "acme"
// "https://linear.app" → "linear"
const COMPANY_PREFIXES = ["www.", "brand.", "app.", "dev.", "developer.", "docs.", "doc.", "api.", "blog.", "store.", "shop.", "help.", "support."];
// Compound TLDs (e.g. mercadolivre.com.br, bbc.co.uk) MUST be matched before
// their simple suffixes (.br, .uk). Sort by length descending at load time so
// the strip-first-match loop picks the longest valid TLD.
const COMPANY_TLDS = [
  // Compound (longest first by sort below)
  ".com.br", ".com.au", ".com.mx", ".com.ar", ".com.co", ".com.pe",
  ".co.uk", ".co.jp", ".co.kr", ".co.in", ".co.nz",
  ".com.cn", ".com.hk", ".com.sg",
  // Simple
  ".com", ".io", ".ai", ".app", ".co", ".net", ".org", ".dev",
  ".cloud", ".page", ".uk", ".br", ".me", ".tv",
].sort((a, b) => b.length - a.length);

function companyFromHost(host) {
  let h = String(host || "").toLowerCase();
  for (const p of COMPANY_PREFIXES) {
    if (h.startsWith(p)) { h = h.slice(p.length); break; }
  }
  for (const t of COMPANY_TLDS) {
    if (h.endsWith(t)) { h = h.slice(0, -t.length); break; }
  }
  const stem = h.split(".")[0];
  const cleaned = stem.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "extract";
}

function companyFromUrl(url) {
  try {
    return companyFromHost(new NodeURL(url).host);
  } catch {
    return "extract";
  }
}

// "www-anthropic-com" → "anthropic"
// "brand-acme-com" → "acme"
function companyFromSlug(slug) {
  if (!slug) return "extract";
  let s = String(slug).toLowerCase();
  for (const p of COMPANY_PREFIXES) {
    const dashed = p.replace(/\.$/, "-");
    if (s.startsWith(dashed)) { s = s.slice(dashed.length); break; }
  }
  for (const t of COMPANY_TLDS) {
    const dashed = "-" + t.replace(/^\./, "");
    if (s.endsWith(dashed)) { s = s.slice(0, -dashed.length); break; }
  }
  return s.replace(/^-|-$/g, "") || "extract";
}

// ── Variant-aware slug ───────────────────────────────────────────────
// Different subdomains and subpaths under the same company often carry
// distinct design systems (marketing vs brandbook vs app vs enterprise vs
// product brand hosted under parent infrastructure).
//
// Subdomain classification:
//   - transparent (www, ∅)        → strip silently, parent is the company
//   - generic namespace          → keep as qualifier, parent is the company
//                                   (brand, app, dev, docs, api, blog, store,
//                                    shop, help, support — distinct DSes
//                                    BELONGING to the parent brand)
//   - distinct brand subdomain   → IS the company (e.g. redpine.acme.com
//                                   where redpine is its own product brand)
//
// Examples:
//   https://www.shopify.com/                        → "shopify"
//   https://www.shopify.com/br/enterprise           → "shopify-br-enterprise"
//   https://brand.acme.com/brandbook/guidelines     → "acme-brand-brandbook-guidelines"
//   https://app.linear.app/                         → "linear-app"
//   https://docs.anthropic.com/en/api/messages      → "anthropic-docs-en-api-messages"
//   https://redpine.acme.com/                       → "redpine"  (distinct brand)
const VARIANT_PATH_MAX_SEGMENTS = 4;
const VARIANT_SLUG_MAX_LENGTH = 80;
const VARIANT_TRANSPARENT_SUBDOMAINS = new Set(["www", ""]);
// Generic namespaces — a subdomain in this set is a sub-property of the parent
// company, not a distinct brand. Derived from COMPANY_PREFIXES minus www.
const COMPANY_GENERIC_SUBDOMAINS = new Set(
  COMPANY_PREFIXES
    .map((p) => p.replace(/\.$/, ""))
    .filter((s) => s !== "www")
);

function _hostParts(host) {
  let h = String(host || "").toLowerCase();
  // Strip TLD
  for (const t of COMPANY_TLDS) {
    if (h.endsWith(t)) { h = h.slice(0, -t.length); break; }
  }
  const parts = h.split(".").filter(Boolean);
  if (parts.length === 0) return { company: "extract", subdomain: null };
  const slugify = (s) => s.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || null;

  // No subdomain — apex company name.
  if (parts.length === 1) {
    return { company: slugify(parts[0]) || "extract", subdomain: null };
  }
  const leftmost = parts[0];
  const apex = parts[parts.length - 1];

  // www.foo.com → company = foo, no qualifier
  if (VARIANT_TRANSPARENT_SUBDOMAINS.has(leftmost)) {
    return { company: slugify(apex) || "extract", subdomain: null };
  }
  // brand.acme.com / app.linear.app / docs.anthropic.com →
  // generic namespace under parent. Parent is company, leftmost is qualifier.
  if (COMPANY_GENERIC_SUBDOMAINS.has(leftmost)) {
    return { company: slugify(apex) || "extract", subdomain: slugify(leftmost) };
  }
  // Distinct brand subdomain — leftmost IS the company.
  // e.g. redpine.acme.com → company=redpine, no qualifier from parent
  return { company: slugify(leftmost) || "extract", subdomain: null };
}

function _pathQualifier(pathname) {
  if (!pathname || pathname === "/") return null;
  const segs = pathname.split("/").filter((s) => s.length > 0).slice(0, VARIANT_PATH_MAX_SEGMENTS);
  if (segs.length === 0) return null;
  const slug = segs
    .map((s) => {
      try { s = decodeURIComponent(s); } catch { /* keep raw */ }
      return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    })
    .filter(Boolean)
    .join("-");
  return slug || null;
}

function slugFromUrl(url) {
  try {
    const u = new NodeURL(url);
    const { company, subdomain } = _hostParts(u.host);
    const pathPart = _pathQualifier(u.pathname);
    const tail = [subdomain, pathPart].filter(Boolean).join("-");
    if (!tail) return company;
    return `${company}-${tail}`.slice(0, VARIANT_SLUG_MAX_LENGTH).replace(/-+$/g, "");
  } catch {
    return "extract";
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// ── Numeric parsing ─────────────────────────────────────────────────
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

// ── Color normalization ─────────────────────────────────────────────
// Converts any color value (hex / rgb / rgba / hsl) to a 6-digit hex string.
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
  m = s.match(/^hsla?\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i);
  if (m) {
    const h = parseFloat(m[1]) / 360;
    const sat = parseFloat(m[2]) / 100;
    const l = parseFloat(m[3]) / 100;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    let r, g, b;
    if (sat === 0) { r = g = b = l; }
    else {
      const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
    return ("#" + toHex(r) + toHex(g) + toHex(b)).toLowerCase();
  }
  if (/^(transparent|currentcolor|inherit)$/i.test(s)) return null;
  return null;
}

// ── DESIGN.md frontmatter parsing ───────────────────────────────────
// Returns { ok, value, error } — value is always a usable object so downstream
// `tokens.colors`-style access never crashes. Caller should warn on !ok.
// Legacy callers that destructure may still pass — value is the parsed object
// or {} when parsing fails.
function parseFrontmatter(designMd) {
  const trimmed = designMd.trimStart();
  if (!trimmed.startsWith("---")) {
    return Object.assign({}, { __parseError: "no frontmatter delimiter (---)" });
  }
  const end = trimmed.indexOf("\n---", 3);
  if (end === -1) {
    return Object.assign({}, { __parseError: "unterminated frontmatter (no closing ---)" });
  }
  const inner = trimmed.slice(3, end).trim();
  try {
    const parsed = YAML.parse(inner);
    if (parsed == null || typeof parsed !== "object") {
      return Object.assign({}, { __parseError: "frontmatter parsed but is not an object" });
    }
    return parsed;
  } catch (err) {
    return Object.assign({}, { __parseError: `YAML parse error: ${err.message || String(err)}` });
  }
}

// ── HTML escaping (used by preview.cjs) ─────────────────────────────
function safeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

module.exports = {
  parseArgs,
  slugifyHost,
  companyFromHost,
  companyFromUrl,
  companyFromSlug,
  slugFromUrl,
  timestamp,
  parsePx,
  colorToHex,
  parseFrontmatter,
  safeHtml,
};
