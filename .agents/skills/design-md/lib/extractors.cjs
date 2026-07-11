// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

// Static-CSS extractors and analyzers.
// Each function takes a CSS string (or HTML+CSS) and returns structured tokens.
// Pure functions — no I/O. Easy to test.

const cheerio = require("cheerio");
const TurndownService = require("turndown");

// ── CSS truncation for LLM input (cost discipline) ──────────────────
// Empirical: Apple css-collected.css = 668KB. Phase 6 LLM cost = $5.50/run with Opus.
// Most of that is brand-irrelevant utility CSS. The DESIGN.md generator only needs:
//   1. :root and theme vars (token primitives)
//   2. dark mode overrides (.dark, [data-theme=dark], @media prefers-color-scheme: dark)
//   3. component selectors that actually use the tokens (via usage-graph hint)
//   4. font-face declarations (already extracted but kept here for context)
// Strategy: select prioritized rule blocks until budget is hit, drop the rest.
// Default budget: 100KB (~25K tokens) — keeps Phase 6 input within ~4× compression.

const DEFAULT_CSS_BUDGET_BYTES = 100 * 1024;

function truncateCssForLlm(css, options = {}) {
  const budget = options.budgetBytes || DEFAULT_CSS_BUDGET_BYTES;
  if (!css || css.length <= budget) {
    return { truncated: css || "", original_bytes: (css || "").length, kept_bytes: (css || "").length, dropped: false };
  }

  // Split into rule blocks (`selector { ... }`) keeping ranges. Naive but effective:
  //   we walk the string, balancing braces, capturing each top-level block.
  const blocks = [];
  let depth = 0;
  let blockStart = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const block = css.slice(blockStart, i + 1);
        blocks.push(block);
        blockStart = i + 1;
      }
    }
  }

  // Score each block by priority. Higher score = keep first.
  const scored = blocks.map((block, idx) => {
    let score = 0;
    const head = block.slice(0, 200).toLowerCase();
    // 1. :root and CSS var declarations — highest priority (token primitives)
    if (/:root\b/.test(head)) score += 1000;
    // 2. Dark mode (.dark, data-theme, prefers-color-scheme)
    if (/\.dark\b|\[data-theme[^\]]*\]|prefers-color-scheme/.test(head)) score += 800;
    // 3. @theme inline (Tailwind v4 token mapping)
    if (/@theme\b/.test(head)) score += 700;
    // 4. font-face — kept for context (already separately extracted)
    if (/@font-face\b/.test(head)) score += 600;
    // 5. CSS-vars-heavy blocks (lots of --foo: declarations)
    const varCount = (block.match(/--[a-z][\w-]*\s*:/gi) || []).length;
    score += Math.min(varCount * 5, 500);
    // 6. Component-like selectors (most common: button, input, card, modal/dialog)
    if (/\b(button|input|card|modal|dialog|form|nav|header|footer|menu|tooltip|select)\b/.test(head)) {
      score += 200;
    }
    // 7. Atom selectors (single class/element) score moderately
    if (/^[\s\w*][^,{]{0,30}\{/.test(block)) score += 50;
    // Penalty: very long media query blocks (responsive utility soup)
    if (/@media\b/.test(head) && block.length > 5000) score -= 200;
    // Penalty: vendor prefixes / animation keyframes (low signal for tokens)
    if (/@-webkit-|@-moz-|@keyframes\b/.test(head) && block.length > 2000) score -= 100;

    return { idx, block, score, len: block.length };
  });

  // Sort by score desc, then accumulate until budget is exhausted.
  scored.sort((a, b) => b.score - a.score);
  const kept = [];
  let used = 0;
  for (const item of scored) {
    if (used + item.len > budget) continue;
    kept.push(item);
    used += item.len;
  }

  // Restore original document order so the LLM sees natural cascade
  kept.sort((a, b) => a.idx - b.idx);
  const truncated = kept.map(k => k.block).join("\n\n");

  const summary = `\n/* TRUNCATED for LLM budget — kept ${kept.length}/${blocks.length} blocks (${used}/${css.length} bytes ≈ ${Math.round(used / css.length * 100)}%) */\n`;
  return {
    truncated: summary + truncated,
    original_bytes: css.length,
    kept_bytes: used,
    blocks_total: blocks.length,
    blocks_kept: kept.length,
    dropped: true,
  };
}

// ── Phase 3e: Stack suppression table ───────────────────────────────
// Parent framework suppresses child markers (redundant signal — preserved with suppressed_by field)
const STACK_SUPPRESSIONS = {
  "Next.js":   ["React"],
  "Nuxt":      ["Vue"],
  "SvelteKit": ["Svelte"],
  "Astro":     ["React", "Vue", "Svelte"],
};

// ── Phase 3a: Regex token detection (legacy heuristic helper) ───────
function detectTokens(css) {
  const colorsHex = new Set();
  const colorsRgb = new Set();
  const colorsHsl = new Set();
  const fontFamilies = new Set();
  const fontSizes = new Set();
  const lineHeights = new Set();
  const fontWeights = new Set();
  const radii = new Set();
  const spacing = new Set();
  const googleFonts = new Set();

  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) colorsHex.add(m[0].toLowerCase());
  for (const m of css.matchAll(/rgba?\([^)]+\)/gi)) colorsRgb.add(m[0].replace(/\s+/g, ""));
  for (const m of css.matchAll(/hsla?\([^)]+\)/gi)) colorsHsl.add(m[0].replace(/\s+/g, ""));
  for (const m of css.matchAll(/font-family\s*:\s*([^;}{\n]+)/gi)) {
    const value = m[1].replace(/['"]/g, "").trim();
    value.split(",").map((v) => v.trim()).filter(Boolean).forEach((v) => fontFamilies.add(v));
  }
  for (const m of css.matchAll(/font-size\s*:\s*([^;}{\n]+)/gi)) fontSizes.add(m[1].trim());
  for (const m of css.matchAll(/line-height\s*:\s*([^;}{\n]+)/gi)) lineHeights.add(m[1].trim());
  for (const m of css.matchAll(/font-weight\s*:\s*([^;}{\n]+)/gi)) fontWeights.add(m[1].trim());
  for (const m of css.matchAll(/border-radius\s*:\s*([^;}{\n]+)/gi)) radii.add(m[1].trim());
  for (const m of css.matchAll(/(?:padding|margin|gap)\s*:\s*([^;}{\n]+)/gi)) spacing.add(m[1].trim());
  for (const m of css.matchAll(/fonts\.googleapis\.com[^"'\s)]+/gi)) googleFonts.add(m[0]);

  return {
    colors: {
      hex: [...colorsHex].sort(),
      rgb: [...colorsRgb].slice(0, 80),
      hsl: [...colorsHsl].slice(0, 80),
    },
    typography: {
      family: [...fontFamilies].sort(),
      size: [...fontSizes].slice(0, 60),
      weight: [...fontWeights].sort(),
      line_height: [...lineHeights].slice(0, 40),
    },
    radii: [...radii].slice(0, 40),
    spacing: [...spacing].slice(0, 80),
    google_fonts_urls: [...googleFonts],
  };
}

// ── Phase 3b: Native CSS variable detection (ground truth) ──────────
function detectCssVars(css) {
  const declarations = [];
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let match;
  let line = 1;
  let lastIndex = 0;
  while ((match = ruleRe.exec(css)) !== null) {
    line += (css.slice(lastIndex, match.index).match(/\n/g) || []).length;
    lastIndex = match.index;
    const selector = match[1].trim().replace(/\s+/g, " ").slice(0, 200);
    const body = match[2];
    const declRe = /(--[a-zA-Z][\w-]*)\s*:\s*([^;]+?)\s*(?:;|$)/g;
    let dm;
    while ((dm = declRe.exec(body)) !== null) {
      const name = dm[1];
      const value = dm[2].trim();
      const isAlias = /^var\(/.test(value);
      declarations.push({ selector, name, value, is_alias: isAlias, line });
    }
  }
  return declarations;
}

// ── Phase 3c: @font-face exhaustive parsing ─────────────────────────
// Tracks origin CSS file via collectCss() comment markers so relative
// font URLs (e.g. Next.js `url(../media/foo.woff2)`) resolve against
// the CSS file URL, not the page URL.
//
// collectCss() emits three marker shapes:
//   /* ── <url> ── */                 → top-level chunk file
//   /* ── @import → <url> ── */       → push imported url
//   /* ── /@import ── */              → pop back to parent
//
// We walk the markers in order, maintaining a chunk + import stack, and
// emit ranges [start, end, url) so that any byte in the bundled CSS
// resolves to its true origin URL.
function buildOriginIndex(css) {
  const tokenRe = /\/\*\s*──\s*(@import\s*→\s*(https?:\/\/[^\s]+?)|\/@import|(https?:\/\/[^\s]+?))\s*──\s*\*\//g;
  const events = [];
  let m;
  while ((m = tokenRe.exec(css)) !== null) {
    if (m[2]) events.push({ index: m.index + m[0].length, kind: "import_push", url: m[2] });
    else if (m[3]) events.push({ index: m.index + m[0].length, kind: "chunk", url: m[3] });
    else events.push({ index: m.index + m[0].length, kind: "import_pop" });
  }
  const ranges = [];
  let chunk = null;
  const importStack = [];
  let cursor = 0;
  for (const ev of events) {
    const current = importStack.length > 0 ? importStack[importStack.length - 1] : chunk;
    if (current && ev.index > cursor) ranges.push({ start: cursor, end: ev.index, url: current });
    if (ev.kind === "chunk") {
      chunk = ev.url;
      importStack.length = 0;
    } else if (ev.kind === "import_push") {
      importStack.push(ev.url);
    } else if (ev.kind === "import_pop") {
      importStack.pop();
    }
    cursor = ev.index;
  }
  const tail = importStack.length > 0 ? importStack[importStack.length - 1] : chunk;
  if (tail) ranges.push({ start: cursor, end: css.length, url: tail });
  return ranges;
}
function originAt(ranges, pos) {
  for (const r of ranges) {
    if (pos >= r.start && pos < r.end) return r.url;
  }
  return null;
}
function detectFontFaces(css) {
  const faces = [];
  const origins = buildOriginIndex(css);
  const re = /@font-face\s*\{([^}]+)\}/gi;
  let match;
  while ((match = re.exec(css)) !== null) {
    const body = match[1];
    const get = (prop) => {
      const m = body.match(new RegExp(`${prop}\\s*:\\s*([^;]+?)\\s*(?:;|$)`, "i"));
      return m ? m[1].trim().replace(/['"]/g, "") : null;
    };
    const family = get("font-family");
    if (!family) continue;
    const srcRaw = body.match(/src\s*:\s*([^;]+?)\s*(?:;|$)/i);
    const urls = srcRaw
      ? [...srcRaw[1].matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map((m) => m[1])
      : [];
    const formats = srcRaw
      ? [...srcRaw[1].matchAll(/format\(\s*["']?([^"')]+)["']?\s*\)/gi)].map((m) => m[1])
      : [];
    faces.push({
      family,
      weight: get("font-weight"),
      style: get("font-style"),
      display: get("font-display"),
      stretch: get("font-stretch"),
      unicode_range: get("unicode-range"),
      src_urls: urls,
      src_formats: formats,
      source_css_url: originAt(origins, match.index),
      raw: match[0].slice(0, 500),
    });
  }
  return faces;
}

// ── Phase 3d: Token usage graph (declarations × references) ─────────
function buildUsageGraph(css, declarations) {
  const usage = new Map();
  for (const d of declarations) {
    if (!usage.has(d.name)) usage.set(d.name, { declarations: 0, references: 0 });
    usage.get(d.name).declarations++;
  }
  const refRe = /var\(\s*(--[a-zA-Z][\w-]*)/g;
  let m;
  while ((m = refRe.exec(css)) !== null) {
    const name = m[1];
    if (!usage.has(name)) usage.set(name, { declarations: 0, references: 0 });
    usage.get(name).references++;
  }
  const out = [];
  for (const [name, counts] of usage.entries()) {
    out.push({ name, ...counts });
  }
  out.sort((a, b) => b.references - a.references);
  return out;
}

// ── Phase 3e: Stack fingerprint detection ───────────────────────────
/**
 * Detects technology stack from HTML, CSS, CSS metadata, and HTTP response headers.
 * Returns an array of match objects: { name, kind, evidence, confidence, suppressed_by? }
 *
 * @param {string} html - Raw HTML content
 * @param {string} css - Concatenated CSS content
 * @param {object} cssMeta - CSS metadata (external URLs, etc.)
 * @param {object} [headers={}] - HTTP response headers (keys lowercased). Default {} for backward compat.
 */
function detectStack(html, css, cssMeta, headers = {}) {
  const matches = [];
  // Dedup by (name, kind) pair — header-based detection wins over CSS-URL heuristic
  const add = (name, kind, evidence, confidence = "medium") => {
    if (matches.some(m => m.name === name && m.kind === kind)) return;
    matches.push({ name, kind, evidence: evidence.slice(0, 120), confidence });
  };

  const sample = html.slice(0, 200000);

  // ── Header-based detections (always "high" — server response is fact, not inference) ──
  if ((headers["server"] && /cloudflare/i.test(headers["server"])) || headers["cf-ray"]) {
    add("Cloudflare", "cdn", "Cloudflare server header / cf-ray", "high");
  }
  if (headers["x-vercel-id"] || (headers["server"] && /vercel/i.test(headers["server"]))) {
    add("Vercel", "hosting", "x-vercel-id header", "high");
  }
  if ((headers["server"] && /netlify/i.test(headers["server"])) || headers["x-nf-request-id"]) {
    add("Netlify", "hosting", "Netlify response header", "high");
  }
  if (headers["x-shopify-stage"] || headers["x-shopid"]) {
    add("Shopify", "ecommerce", "Shopify response header", "high");
  }
  if (headers["x-powered-by"] && /Next\.js/i.test(headers["x-powered-by"])) {
    add("Next.js", "framework", "x-powered-by header", "high");
  }
  if (headers["x-github-request-id"]) {
    add("GitHub Pages", "hosting", "GitHub Pages response header", "high");
  }

  // Frameworks (build-time / runtime)
  if (/__next|_next\/static\/|next-route-announcer/i.test(sample)) add("Next.js", "framework", "_next/static/ paths in HTML", "high");
  if (/__nuxt|_nuxt\/|nuxt-link/i.test(sample)) add("Nuxt", "framework", "_nuxt/ paths", "high");
  if (/data-reactroot|react-dom|__react/i.test(sample)) add("React", "framework", "react markers", "medium");
  if (/data-svelte|__svelte_kit/i.test(sample)) add("SvelteKit", "framework", "svelte markers", "high");
  if (/_astro\/|astro-island/i.test(sample)) add("Astro", "framework", "_astro/ paths", "high");
  if (/data-vue-meta|__vue/i.test(sample)) add("Vue", "framework", "vue markers", "medium");
  if (/data-wf-page|w-webflow|w-richtext|webflow/i.test(sample)) add("Webflow", "builder", "data-wf-page or w- classes", "high");
  if (/wix-(?:site|protocol)|x-wix-/i.test(sample)) add("Wix", "builder", "wix markers", "high");
  if (/data-framer|framer-motion-data/i.test(sample)) add("Framer", "builder", "framer markers", "high");
  if (/Squarespace\.|sqspthumb|static\d?\.squarespace/i.test(sample)) add("Squarespace", "builder", "squarespace markers", "high");
  if (/wp-content\/|wp-includes\/|\/wp-json\//i.test(sample)) add("WordPress", "cms", "wp-content / wp-includes paths", "high");
  if (/data-shopify|shopify\.com\/cdn|window\.Shopify/i.test(sample)) add("Shopify", "ecommerce", "shopify markers", "high");
  if (/__GHOST_URL__|content\/.*\/ghost/i.test(sample)) add("Ghost", "cms", "ghost markers", "high");
  if (/cdn\.contentful\.com|ctfassets/i.test(sample)) add("Contentful", "cms", "contentful CDN", "high");
  if (/cdn\.sanity\.io/i.test(sample)) add("Sanity", "cms", "sanity CDN", "high");

  // CSS frameworks
  if (/tailwindcss\s+v(\d+)/i.test(css)) {
    const m = css.match(/tailwindcss\s+v(\d+(?:\.\d+)?)/i);
    add(`Tailwind CSS${m ? ` v${m[1]}` : ""}`, "css-framework", "tailwindcss banner in CSS", "high");
  } else if (/--tw-translate-x|tw-bg-opacity|--tw-/i.test(css)) {
    // Inferred from var usage without explicit banner
    add("Tailwind CSS", "css-framework", "--tw-* CSS variables", "medium");
  }
  // shadcn tokens are explicit namespace markers → high
  if (/--shadcn|hsl\(var\(--background\)\)|--popover-foreground/i.test(css)) add("shadcn/ui", "component-library", "shadcn/ui design tokens", "high");
  // MUI explicit class prefix → high
  if (/\.MuiButton-|\.MuiCard-|@mui\/material/i.test(sample) || /\.Mui[A-Z]/.test(css)) add("Material UI", "component-library", "MUI class prefix", "high");
  // Radix explicit data attributes → high
  if (/data-radix-|--radix-/i.test(css) || /@radix-ui\//i.test(sample)) add("Radix UI", "component-library", "radix data attributes", "high");
  // Chakra namespace → high
  if (/chakra\.|--chakra-|chakra-ui/i.test(css) || /__chakra/i.test(sample)) add("Chakra UI", "component-library", "chakra markers", "high");
  if (/--mantine-|mantine\.style/i.test(css) || /mantine/i.test(sample)) add("Mantine", "component-library", "mantine markers", "medium");
  if (/bulma|\.is-primary\.is-/i.test(css)) add("Bulma", "css-framework", "bulma classes", "medium");
  if ((/bootstrap(?:\.min)?\.css|\/bootstrap\//i.test(sample)) || (/\.col-md-\d/i.test(css) && /\.container-fluid|\.row\s*\{/i.test(css))) {
    add("Bootstrap", "css-framework", "bootstrap markers", "medium");
  }

  // Animation libraries
  if (/gsap\.|window\.gsap|gsap\.registerPlugin/i.test(sample)) add("GSAP", "animation", "gsap calls", "high");
  if (/framer-motion|m\.div|motion\.div/i.test(sample)) add("Framer Motion", "animation", "motion. component", "high");
  if (/lenis|smooth-scroll-lenis|@studio-freight\/lenis/i.test(sample)) add("Lenis", "animation", "lenis smooth scroll", "medium");
  if (/lottie-(?:web|player)|\.lottie/i.test(sample)) add("Lottie", "animation", "lottie player", "high");
  if (/three\.js|three\.module|\.glb|\.gltf/i.test(sample)) add("Three.js", "3d", "three.js / GLTF assets", "high");
  if (/spline\.design|spline\.runtime/i.test(sample)) add("Spline", "3d", "spline runtime", "high");

  // Analytics
  if (/googletagmanager|gtag\(|google-analytics/i.test(sample)) add("Google Analytics / GTM", "analytics", "gtag or googletagmanager", "high");
  if (/segment\.com\/analytics|window\.analytics\.load/i.test(sample)) add("Segment", "analytics", "segment loader", "high");
  if (/mixpanel\.|cdn\.mxpnl/i.test(sample)) add("Mixpanel", "analytics", "mixpanel", "high");
  if (/plausible\.io|plausible\.outbound/i.test(sample)) add("Plausible", "analytics", "plausible", "high");
  if (/posthog\.|app\.posthog\.com/i.test(sample)) add("PostHog", "analytics", "posthog", "high");
  if (/amplitude\.|cdn\.amplitude/i.test(sample)) add("Amplitude", "analytics", "amplitude", "high");
  if (/heap\.io|heap\.|cdn\.heapanalytics/i.test(sample)) add("Heap", "analytics", "heap analytics", "high");
  if (/hotjar\.com|static\.hotjar/i.test(sample)) add("Hotjar", "analytics", "hotjar", "high");
  if (/cdn\.vercel-insights|_vercel\/insights/i.test(sample)) add("Vercel Analytics", "analytics", "vercel insights", "medium");

  // Auth / forms / backend
  if (/clerk\.com|@clerk\/|clerk\.dev/i.test(sample)) add("Clerk", "auth", "clerk", "high");
  if (/auth0\.com|@auth0\//i.test(sample)) add("Auth0", "auth", "auth0", "high");
  if (/next-auth|nextauth/i.test(sample)) add("NextAuth", "auth", "nextauth", "high");
  if (/supabase\.co|@supabase\//i.test(sample)) add("Supabase", "backend", "supabase", "high");
  if (/firebaseapp\.com|firebase\.|@firebase\//i.test(sample)) add("Firebase", "backend", "firebase", "high");

  // Hosting / CDN (CSS-URL inference — medium confidence, header check above is high)
  if ((cssMeta?.external || []).some(u => /vercel\.com|vercel-storage|vercel-app/i.test(u))) add("Vercel", "hosting", "vercel CDN in stylesheets", "medium");
  if ((cssMeta?.external || []).some(u => /cloudflare|cdn\.cloudflare/i.test(u))) add("Cloudflare", "cdn", "cloudflare CDN", "medium");
  if ((cssMeta?.external || []).some(u => /akamai/i.test(u))) add("Akamai", "cdn", "akamai CDN", "medium");
  if ((cssMeta?.external || []).some(u => /cdn\.prod\.website-files\.com/i.test(u))) add("Webflow CDN", "cdn", "webflow CDN", "high");

  // A/B testing + Live chat
  if (/optimizely\.|cdn\.optimizely/i.test(sample)) add("Optimizely", "ab-testing", "optimizely", "high");
  if (/cdn\.split\.io|sdk\.split\.io/i.test(sample)) add("Split", "ab-testing", "split sdk", "high");
  if (/intercom\.|widget\.intercom/i.test(sample)) add("Intercom", "support", "intercom", "high");
  if (/drift\.com\/widget|driftt\.com/i.test(sample)) add("Drift", "support", "drift", "high");
  if (/crisp\.chat|static\.crisp/i.test(sample)) add("Crisp", "support", "crisp", "high");
  if (/zdassets\.com|zendesk\.com\/embeddable/i.test(sample)) add("Zendesk", "support", "zendesk widget", "high");

  // Brand-proprietary stacks
  if (/ac-globalnav|ac-localnav|ac-gn-|ac-ln-|globalnav-content/i.test(sample) || /--sk-(?:button|body|focus)-/i.test(css)) {
    add("Apple Storekit (SK Design System)", "design-system", "ac-globalnav / --sk-* tokens", "high");
  }
  if (/--anthropic-|class="anthropic-/i.test(css) || /AnthropicSerif|AnthropicSans|AnthropicMono/i.test(css)) {
    add("Anthropic Brand System", "design-system", "Anthropic Sans/Serif/Mono", "high");
  }
  if (/--bb-(?:lime|dark|cream|surface|ink)/i.test(css)) {
    add("AIOX Brandbook", "design-system", "--bb-* token namespace", "high");
  }
  if (/--geist-|@vercel\/geist|GeistSans|GeistMono/i.test(css) || /__geist/i.test(sample)) {
    add("Vercel Geist", "design-system", "--geist-* tokens or Geist Sans/Mono", "high");
  }

  // ── S3: Cross-signal suppression pass ───────────────────────────────
  // Mark redundant child signals with suppressed_by — preserve evidence, mark as secondary
  for (const [parent, children] of Object.entries(STACK_SUPPRESSIONS)) {
    if (matches.find(m => m.name === parent)) {
      for (const child of children) {
        const childMatch = matches.find(m => m.name === child);
        if (childMatch && !childMatch.suppressed_by) {
          childMatch.suppressed_by = parent;
        }
      }
    }
  }

  return matches;
}

// ── Phase 3f: Style fingerprint classification (visual archetype) ────

// Archetype expectations — visual fingerprint catalog.
// Each archetype lists expected signal values with weights for scoring.
// This table is the single source of truth for the algorithm.
const ARCHETYPES = {
  "shadcn-neutral": {
    // shadcn is monochrome with subtle-to-moderate accents (Github's blue, lucide).
    // GitHub real homepage has 3 backdrop-filter declarations (modals/dropdowns) but
    // overall is shadcn-flavored. Glass is permitted as auxiliary surface, not primary.
    radius_scale:       ["moderate", "minimal", "minimal-to-moderate"],
    color_saturation:   ["near-zero", "moderate"],
    spacing_density:    ["moderate"],
    typography_weight:  ["regular-bold", "regular-medium-semibold-bold", "regular"],
    shadow_intensity:   ["subtle", "none", "moderate"],
    surface_treatment:  ["flat-with-border", "flat", "glass"],
  },
  "carbon-enterprise": {
    // Carbon palette is grayscale-dominant with single saturated brand blue; median
    // chroma is "very-low". Empirical: real Carbon CSS yields very-low saturation.
    // surface_treatment: prefer borders, but accept flat when sample lacks border decls.
    radius_scale:       ["minimal", "minimal-to-moderate"],
    color_saturation:   ["moderate", "very-low"],
    spacing_density:    ["compact"],
    typography_weight:  ["regular-bold", "regular"],
    shadow_intensity:   ["none"],
    surface_treatment:  ["flat-with-border", "flat"],
  },
  "material-elevation": {
    radius_scale:       ["moderate", "minimal-to-moderate"],
    color_saturation:   ["high"],
    spacing_density:    ["moderate"],
    typography_weight:  ["regular-medium-semibold-bold", "regular-bold"],
    shadow_intensity:   ["strong", "moderate"],
    surface_treatment:  ["shadowed", "soft-shadowed"],
  },
  "polaris-friendly": {
    // Polaris allows broader font weights (Inter 400/500/600 common in admin context).
    // shopify.com homepage uses gradients on hero — accept "gradient" surface as valid.
    // CALIBRATION 2026-04-27: Polaris does NOT use glass surfaces (e-commerce wants
    // clarity, not Apple-style frosted overlays). Removed "glass" greediness.
    radius_scale:       ["moderate", "moderate-high"],
    color_saturation:   ["moderate", "high", "very-low"],
    spacing_density:    ["very-roomy", "moderate"],
    typography_weight:  ["regular-bold", "regular-medium-semibold-bold", "regular"],
    shadow_intensity:   ["subtle", "moderate", "strong"],
    surface_treatment:  ["soft-shadowed", "flat", "flat-with-border", "gradient"],
  },
  "apple-glass": {
    // Calibrated 2026-04-27 from real apple.com run: shadow_intensity comes back
    // "strong" (Apple uses prominent dropshadows on cards/floating elements),
    // typography_weight is "regular-medium-semibold-bold" (SF Pro 4-weight),
    // spacing_density is "moderate" (header/nav are tight; only hero is roomy).
    // Glass is the strong invariant. CRITICAL: reject "high-with-gradients" saturation —
    // that's marketing-gradient territory (Stripe), not Apple's restrained mono palette.
    radius_scale:       ["high", "moderate-high", "moderate"],
    color_saturation:   ["near-zero", "very-low"],  // Apple is strictly mono — NO high/high-with-gradients
    spacing_density:    ["very-roomy", "moderate"],
    typography_weight:  ["thin-bold", "regular-bold", "regular-medium-semibold-bold"],
    shadow_intensity:   ["subtle", "none", "moderate", "strong"],
    surface_treatment:  ["glass"],
  },
  "brutalist-mono": {
    radius_scale:       ["minimal", "high"],   // Geist allows 0 OR pill
    color_saturation:   ["near-zero"],
    spacing_density:    ["moderate"],
    typography_weight:  ["regular-bold"],
    shadow_intensity:   ["none"],
    surface_treatment:  ["flat", "flat-with-border"],
  },
  "govuk-conservative": {
    radius_scale:       ["minimal"],
    color_saturation:   ["moderate"],
    spacing_density:    ["moderate"],
    typography_weight:  ["bold-only", "regular-bold"],
    shadow_intensity:   ["none"],
    surface_treatment:  ["flat-thick-border"],
  },
  "porsche-precision": {
    // Porsche signature: NEVER plain "regular" weight (always uses bold pairing —
    // 400 + 700 Porsche Next). When sample shows only 400/no 700, this is NOT Porsche.
    // Surface: precise/border preferred; accept flat when CSS sample lacks border decls.
    radius_scale:       ["minimal", "minimal-to-moderate"],
    color_saturation:   ["very-low", "near-zero"],
    spacing_density:    ["compact", "moderate", "very-roomy"],
    typography_weight:  ["regular-bold"],
    shadow_intensity:   ["none"],
    surface_treatment:  ["flat-with-precise-borders", "flat-with-border", "flat"],
  },
  "ant-china-enterprise": {
    // Ant blue is highly saturated → median chroma can read as "high" or "high-with-gradients"
    // (when palette includes 14 named colors). Accept both.
    // surface_treatment: prefer borders, accept flat when sample is thin.
    radius_scale:       ["minimal", "minimal-to-moderate"],
    color_saturation:   ["high", "high-with-gradients"],
    spacing_density:    ["compact"],
    typography_weight:  ["regular"],
    shadow_intensity:   ["subtle"],
    surface_treatment:  ["flat-with-border", "flat"],
  },
  "marketing-gradient": {
    // Stripe.com mixes gradient hero with glass cards — accept both surfaces.
    // The diagnostic signal is "high-with-gradients" saturation, not surface alone.
    radius_scale:       ["high", "moderate-high"],
    color_saturation:   ["high-with-gradients", "high"],
    spacing_density:    ["very-roomy"],
    typography_weight:  ["thin-bold", "regular-bold"],
    shadow_intensity:   ["moderate", "strong"],
    surface_treatment:  ["gradient", "glass"],
  },
  "community-polished": {
    radius_scale:       ["moderate", "moderate-high"],
    color_saturation:   ["high", "moderate"],
    spacing_density:    ["moderate"],
    typography_weight:  ["regular-bold", "regular-medium-semibold-bold"],
    shadow_intensity:   ["moderate", "subtle"],
    surface_treatment:  ["soft-shadowed"],
  },
};

// ── helpers: signal extraction ──────────────────────────────────────

// Convert hex/rgb/hsl to approximate oklch chroma. Cheap heuristic — not perceptually exact.
// Returns C ∈ [0, ~0.5+] where 0 = pure gray, > 0.18 = saturated.
function approxChroma(colorString) {
  const s = colorString.trim();
  let r, g, b;

  const hexMatch = s.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    if (h.length === 8) h = h.slice(0, 6); // strip alpha
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    const rgbMatch = s.match(/rgba?\(\s*([\d.]+)\s*,?\s*([\d.]+)\s*,?\s*([\d.]+)/i);
    if (rgbMatch) {
      r = parseFloat(rgbMatch[1]);
      g = parseFloat(rgbMatch[2]);
      b = parseFloat(rgbMatch[3]);
    } else {
      const hslMatch = s.match(/hsla?\(\s*([\d.]+)\s*,?\s*([\d.]+)%\s*,?\s*([\d.]+)%/i);
      if (hslMatch) {
        const sat = parseFloat(hslMatch[2]) / 100;
        const lit = parseFloat(hslMatch[3]) / 100;
        // hsl saturation×min(L, 1-L) approximates oklch chroma magnitude
        return sat * Math.min(lit, 1 - lit) * 0.6;
      }
      const oklchMatch = s.match(/oklch\(\s*[\d.]+\s+([\d.]+)/i);
      if (oklchMatch) return parseFloat(oklchMatch[1]);
      return null;
    }
  }
  if (r === undefined) return null;
  // Quick saturation proxy: max(R,G,B) - min(R,G,B), normalized
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const range = (max - min) / 255; // 0 = gray, 1 = max saturation
  return range * 0.4; // scale into oklch C-ish range
}

function classifyColorSaturation(tokensDetected) {
  const allColors = [
    ...(tokensDetected?.colors?.hex || []),
    ...(tokensDetected?.colors?.rgb || []),
    ...(tokensDetected?.colors?.hsl || []),
  ];
  if (allColors.length === 0) return null;

  const chromas = allColors.map(approxChroma).filter(c => c !== null);
  if (chromas.length === 0) return "near-zero";

  // Use MEDIAN (not average) so a single saturated accent color (Porsche red,
  // shadcn destructive) does not dominate the verdict for an otherwise mono palette.
  const sorted = [...chromas].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // For decisions the AVERAGE-OF-FILTERED (non-mono) is also tracked as a tiebreaker.
  const filtered = chromas.filter(c => c > 0.005);
  const avg = filtered.length > 0
    ? filtered.reduce((a, b) => a + b, 0) / filtered.length
    : 0;

  // If most colors are mono (median ≈ 0) → palette is mono regardless of accent count.
  if (median <= 0.02 && avg <= 0.10) return "near-zero";
  if (median <= 0.05 || avg <= 0.10)  return "very-low";
  if (avg <= 0.18) return "moderate";
  if (avg <= 0.30) return "high";
  return "high-with-gradients";
}

// Parse a CSS dimension string to pixels. Returns null if not parseable.
function dimToPx(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  const remMatch = v.match(/^([\d.]+)\s*rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = v.match(/^([\d.]+)\s*px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);
  if (/^[\d.]+$/.test(v)) return parseFloat(v);
  return null;
}

function classifyRadiusScale(tokensDetected, cssVarsDetected) {
  // Prefer --radius-* CSS vars; fallback to tokensDetected.radii
  const varsArr = Array.isArray(cssVarsDetected) ? cssVarsDetected : [];
  const fromVars = varsArr
    .filter(v => v && v.name && (/--radius/i.test(v.name) || /--rounded/i.test(v.name)))
    .map(v => dimToPx(v.value))
    .filter(n => n !== null && n >= 0 && n < 200);  // skip 9999px (pill)

  const fromTokens = [...(tokensDetected?.radii || [])]
    .map(r => {
      const m = String(r).match(/[\d.]+(?:px|rem)?/);
      return m ? dimToPx(m[0]) : null;
    })
    .filter(n => n !== null && n >= 0 && n < 200);

  const samples = fromVars.length > 0 ? fromVars : fromTokens;
  if (samples.length === 0) return null;

  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  if (avg <= 2)  return "minimal";
  if (avg <= 6)  return "minimal-to-moderate";
  if (avg <= 12) return "moderate";
  if (avg <= 18) return "moderate-high";
  return "high";
}

function classifySpacingDensity(tokensDetected) {
  const spacings = [...(tokensDetected?.spacing || [])]
    .map(s => {
      const first = String(s).match(/[\d.]+(?:px|rem)?/);
      return first ? dimToPx(first[0]) : null;
    })
    .filter(n => n !== null && n > 0 && n < 300);

  if (spacings.length === 0) return null;

  const distinct = [...new Set(spacings)].sort((a, b) => a - b);
  const baseUnit = distinct[0];
  const maxSpacing = distinct[distinct.length - 1];
  const range = maxSpacing - baseUnit;
  const stepCount = distinct.length;

  // Detect "very-roomy" pattern: large jumps (next/prev ratio > 1.6) on at least 30% of steps,
  // OR max spacing > 80px (Apple/marketing hero spacing)
  let largeJumps = 0;
  for (let i = 1; i < distinct.length; i++) {
    if (distinct[i] / distinct[i - 1] > 1.6) largeJumps++;
  }
  const largeJumpRatio = largeJumps / Math.max(distinct.length - 1, 1);

  // Compact: tight base + many steps (Carbon-style 8px grid with 10+ values)
  if (baseUnit >= 7 && stepCount >= 8) return "compact";
  // Compact: base 8px and steps span > 100px (B2B dense)
  if (baseUnit >= 8 && range > 80) return "compact";
  // Very-roomy: max spacing > 80px (hero/marketing scale) OR ratio > 30%
  if (maxSpacing >= 80 || largeJumpRatio > 0.3) return "very-roomy";
  return "moderate";
}

function classifyTypographyWeight(tokensDetected, fontFaces) {
  const weights = new Set();

  // From tokensDetected.fontWeights (raw CSS font-weight values)
  const fontWeightsArr = (tokensDetected && Array.isArray(tokensDetected.fontWeights))
    ? tokensDetected.fontWeights
    : [];
  for (const w of fontWeightsArr) {
    const n = parseInt(w, 10);
    if (!isNaN(n)) weights.add(n);
    if (/^(normal|regular)$/i.test(w)) weights.add(400);
    if (/^bold$/i.test(w)) weights.add(700);
    if (/^light$/i.test(w)) weights.add(300);
  }

  // From fontFaces
  const fontFacesArr = Array.isArray(fontFaces) ? fontFaces : [];
  for (const ff of fontFacesArr) {
    if (!ff) continue;
    if (typeof ff.weight === "number") weights.add(ff.weight);
    else if (typeof ff.weight === "string") {
      const n = parseInt(ff.weight, 10);
      if (!isNaN(n)) weights.add(n);
    }
  }

  const arr = [...weights].sort((a, b) => a - b);
  if (arr.length === 0) return null;

  const hasThin   = arr.some(w => w <= 300);
  const hasReg    = arr.some(w => w >= 400 && w <= 450);
  const hasMedium = arr.some(w => w >= 500 && w <= 550);
  const hasSemi   = arr.some(w => w >= 600 && w <= 650);
  const hasBold   = arr.some(w => w >= 700);

  if (hasThin && hasBold && !hasReg) return "thin-bold";
  if (arr.length === 1 && hasBold)   return "bold-only";
  if (hasReg && hasMedium && hasSemi && hasBold) return "regular-medium-semibold-bold";
  if (hasReg && hasBold)             return "regular-bold";
  if (hasReg && !hasBold)            return "regular";
  return null;
}

function classifyShadowIntensity(shadows) {
  let list;
  if (Array.isArray(shadows)) list = shadows;
  else if (shadows && Array.isArray(shadows.declarations)) list = shadows.declarations;
  else if (shadows && Array.isArray(shadows.list)) list = shadows.list;
  else list = [];
  if (list.length === 0) return "none";

  // Each shadow has alpha + blur (parse from CSS value)
  let maxAlpha = 0;
  let maxBlur = 0;
  for (const s of list) {
    const value = typeof s === "string" ? s : (s.value || s.shadow || "");
    const alphaMatch = value.match(/rgba?\([^)]+,\s*(0?\.\d+|1(?:\.0+)?)\s*\)/);
    if (alphaMatch) maxAlpha = Math.max(maxAlpha, parseFloat(alphaMatch[1]));
    // Extract blur (3rd numeric in the box-shadow declaration: x y blur ...)
    const blurMatch = value.match(/(?:^|\s)(?:-?\d+(?:\.\d+)?(?:px|rem)?\s+){2}(\d+(?:\.\d+)?)px/);
    if (blurMatch) maxBlur = Math.max(maxBlur, parseFloat(blurMatch[1]));
  }

  // Recalibrated thresholds based on empirical samples:
  //   shadcn typical: alpha 0.05-0.10, blur 1-3px, 1-2 shadows → subtle
  //   material:      alpha 0.20+,     blur 4-15px, 3+ shadows → strong
  //   marketing:     colored shadows blur 30+px, alpha 0.10-0.20 → moderate or strong
  if (maxAlpha < 0.05 && maxBlur < 2) return "none";
  if (list.length <= 2 && maxAlpha <= 0.12 && maxBlur < 8) return "subtle";
  if (maxAlpha >= 0.20 || maxBlur >= 20) return "strong";
  return "moderate";
}

function classifySurfaceTreatment(css, shadowIntensity, radiusScale, tokensDetected) {
  const cssText = css || "";

  // ── glass: requires MULTIPLE backdrop-filter declarations OR a single one
  // accompanied by translucent rgba/hsla backgrounds (apple-glass signature).
  // A single isolated blur (header overlay, modal backdrop) is common in modern
  // sites and is NOT enough — it caused 4/5 false positives in 2026-04-27 batch.
  const blurMatches = (cssText.match(/backdrop-filter:\s*blur/gi) || []).length;
  const translucentBgs = (cssText.match(/background(?:-color)?:\s*(?:rgba|hsla)\([^)]+,\s*0?\.\d/gi) || []).length;
  const isGlass = blurMatches >= 3 || (blurMatches >= 1 && translucentBgs >= 5);

  // ── gradient: requires MULTIPLE gradient declarations on backgrounds
  // (not just one hero gradient, which is universal in modern marketing).
  // Threshold: ≥3 gradient declarations OR ≥1 gradient on body/html (full surface).
  const gradientMatches = (cssText.match(/linear-gradient|radial-gradient|conic-gradient/gi) || []).length;
  const fullSurfaceGradient = /(?:body|html|main)[^{]*\{[^}]*(?:linear-gradient|radial-gradient)/i.test(cssText);
  const isGradient = gradientMatches >= 3 || fullSurfaceGradient;

  if (isGlass) return "glass";
  if (isGradient) return "gradient";

  // Check border thickness from raw CSS
  const borderWidths = [...cssText.matchAll(/border(?:-width)?:\s*([\d.]+)\s*px/gi)]
    .map(m => parseFloat(m[1]))
    .filter(n => n > 0 && n < 20);
  const maxBorder = borderWidths.length > 0 ? Math.max(...borderWidths) : 0;

  if (maxBorder >= 3) return "flat-thick-border";

  if (shadowIntensity === "moderate" || shadowIntensity === "strong") return "shadowed";
  if (shadowIntensity === "subtle" && (radiusScale === "moderate-high" || radiusScale === "high")) {
    return "soft-shadowed";
  }
  if (shadowIntensity === "none" && maxBorder > 0) return "flat-with-border";
  if (maxBorder > 0) return "flat-with-border";
  return "flat";
}

// ── archetype scoring ──────────────────────────────────────────────

// Signal weights — rare/specific signals score higher because they are stronger evidence.
// surface_treatment "glass" or "gradient" is very specific (hard to fake).
// color_saturation "high-with-gradients" implies colorful brand — strong distinguisher.
// shadow_intensity "strong" + spacing "very-roomy" both correlate with marketing/elevation.
const SIGNAL_WEIGHTS = {
  radius_scale:      1.0,
  color_saturation:  1.5,   // primary brand signal
  spacing_density:   1.0,
  typography_weight: 1.0,
  shadow_intensity:  1.0,
  surface_treatment: 2.0,   // strong specificity (glass/gradient/flat-thick-border are diagnostic)
};

// Bonus matches when the signal value itself is rare (penalizes archetypes that match
// only on common/generic values like "moderate everywhere").
const RARE_SIGNAL_VALUES = {
  color_saturation:  ["high-with-gradients", "near-zero"],
  surface_treatment: ["glass", "gradient", "flat-thick-border", "flat-with-precise-borders"],
  typography_weight: ["thin-bold", "bold-only"],
  shadow_intensity:  ["strong"],
  radius_scale:      ["high", "minimal"],
  spacing_density:   ["very-roomy", "compact"],
};

function scoreAgainstArchetype(signals, expected) {
  let score = 0;
  let total = 0;
  for (const [signal, expectedValues] of Object.entries(expected)) {
    const weight = SIGNAL_WEIGHTS[signal] || 1.0;
    total += weight;
    if (signals[signal] && expectedValues.includes(signals[signal])) {
      let matchScore = weight;
      // Bonus: archetype matches on a RARE signal value → stronger evidence
      if (RARE_SIGNAL_VALUES[signal]?.includes(signals[signal])) {
        matchScore *= 1.5;
        total += weight * 0.5; // keep total scaled (so max remains 100%)
      }
      score += matchScore;
    }
  }
  return total > 0 ? (score / total) * 100 : 0;
}

/**
 * Classifies the extracted visual style against the canonical archetype catalog
 * (see ARCHETYPES table above).
 *
 * Complementary to detectStack(): detectStack identifies TECHNICAL stack
 * (Next.js, Tailwind, Radix). classifyStyle identifies VISUAL archetype
 * (shadcn-neutral, apple-glass, carbon-enterprise, etc.) — orthogonal signals.
 *
 * @param {object} tokensDetected - Output of detectTokens (colors/spacing/radius/etc.)
 * @param {Array}  cssVarsDetected - Output of detectCssVars
 * @param {object} shadows - Output of detectShadows
 * @param {Array}  fontFaces - Output of detectFontFaces
 * @param {string} css - Concatenated CSS content (for backdrop-filter / gradient detection)
 * @returns {object} { extracted_signals, classification, archetype_distance }
 */
function classifyStyle(tokensDetected, cssVarsDetected, shadows, fontFaces, css) {
  // 1. Extract signals
  const radius_scale       = classifyRadiusScale(tokensDetected, cssVarsDetected);
  const color_saturation   = classifyColorSaturation(tokensDetected);
  const spacing_density    = classifySpacingDensity(tokensDetected);
  const typography_weight  = classifyTypographyWeight(tokensDetected, fontFaces);
  const shadow_intensity   = classifyShadowIntensity(shadows);
  const surface_treatment  = classifySurfaceTreatment(css, shadow_intensity, radius_scale, tokensDetected);

  const extracted_signals = {
    radius_scale,
    color_saturation,
    spacing_density,
    typography_weight,
    shadow_intensity,
    surface_treatment,
  };

  // 2. Score against each archetype
  const archetype_distance = {};
  for (const [name, expected] of Object.entries(ARCHETYPES)) {
    archetype_distance[name] = scoreAgainstArchetype(extracted_signals, expected);
  }

  // 3. Pick winner
  const ranked = Object.entries(archetype_distance).sort((a, b) => b[1] - a[1]);
  const [topName, topScore] = ranked[0];
  const [secondName, secondScore] = ranked[1];

  const minimum_confidence_threshold = 50;  // % of signals matching
  const multi_archetype_threshold    = 0.85; // top-2 within 85%

  let primary_archetype = null;
  let secondary_archetype = null;
  let confidence_score = topScore;

  if (topScore >= minimum_confidence_threshold) {
    primary_archetype = topName;
    if (secondScore >= topScore * multi_archetype_threshold && secondScore >= minimum_confidence_threshold) {
      secondary_archetype = secondName;
    }
  }

  // 4. Build explanation
  const matched = [];
  const mismatched = [];
  if (primary_archetype) {
    const expected = ARCHETYPES[primary_archetype];
    for (const [signal, expectedValues] of Object.entries(expected)) {
      if (extracted_signals[signal] && expectedValues.includes(extracted_signals[signal])) {
        matched.push(`${signal}=${extracted_signals[signal]}`);
      } else if (extracted_signals[signal]) {
        mismatched.push(`${signal}=${extracted_signals[signal]} (expected ${expectedValues.join("|")})`);
      }
    }
  }

  const explanation = primary_archetype
    ? `Matched ${primary_archetype} on: ${matched.join(", ")}${mismatched.length ? `. Diverged on: ${mismatched.join(", ")}` : ""}.`
    : "No archetype reached confidence threshold (50%). Style is unclassified or hybrid.";

  return {
    extracted_signals,
    classification: {
      primary_archetype,
      confidence_score: Math.round(confidence_score),
      secondary_archetype,
      explanation,
    },
    archetype_distance,
    _reference: "lib/extractors.cjs:ARCHETYPES",
  };
}

// ── S4: Stack summary helper for LLM injection ──────────────────────
/**
 * Filters suppressed matches, sorts by confidence (high > medium > low), returns top 8.
 * Emits compact objects { name, kind, confidence } — no evidence, no suppressed_by.
 * Output is designed to stay < 2KB when JSON-serialized (R5 budget).
 *
 * @param {Array} matches - Raw detectStack output
 * @returns {Array} Filtered, sorted, truncated summary
 */
function summarizeStackForPrompt(matches) {
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  return matches
    .filter(m => !m.suppressed_by)
    .sort((a, b) => (confidenceOrder[a.confidence] ?? 99) - (confidenceOrder[b.confidence] ?? 99))
    .slice(0, 8)
    .map(({ name, kind, confidence }) => ({ name, kind, confidence }));
}

// ── Phase 3f: Shadow extraction (elevation ladder) ──────────────────
function detectShadows(css) {
  const re = /box-shadow\s*:\s*([^;}]+)/gi;
  const counts = {};
  let m;
  while ((m = re.exec(css)) !== null) {
    const value = m[1].trim();
    if (value === "none" || value === "inherit" || value === "initial") continue;
    if (value.length > 250) continue;
    counts[value] = (counts[value] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);
}

// ── Phase 3g: Motion / animation tokens ─────────────────────────────
function detectMotion(css) {
  const durations = {};
  for (const m of css.matchAll(/transition[\w-]*\s*:\s*([^;}]+)/gi)) {
    const value = m[1];
    for (const dur of value.match(/\b\d+(?:\.\d+)?(ms|s)\b/gi) || []) {
      durations[dur] = (durations[dur] || 0) + 1;
    }
  }
  for (const m of css.matchAll(/animation-duration\s*:\s*([^;}]+)/gi)) {
    const value = m[1].trim();
    for (const dur of value.match(/\b\d+(?:\.\d+)?(ms|s)\b/gi) || []) {
      durations[dur] = (durations[dur] || 0) + 1;
    }
  }
  const easings = {};
  for (const m of css.matchAll(/cubic-bezier\([^)]+\)/gi)) {
    const value = m[0].replace(/\s+/g, "");
    easings[value] = (easings[value] || 0) + 1;
  }
  for (const m of css.matchAll(/transition-timing-function\s*:\s*([^;}]+)/gi)) {
    const value = m[1].trim();
    if (/^(ease(-in)?(-out)?|linear|step-start|step-end)$/.test(value)) {
      easings[value] = (easings[value] || 0) + 1;
    }
  }
  const keyframes = [];
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    keyframes.push(m[1]);
  }
  return {
    durations: Object.entries(durations).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    easings: Object.entries(easings).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    keyframes: [...new Set(keyframes)].slice(0, 30),
  };
}

// ── Phase 3h: Breakpoints (media queries) ───────────────────────────
function detectBreakpoints(css) {
  // Match BOTH legacy and modern media query syntax:
  //   legacy: (min-width: 900px) / (max-width: 30em)
  //   modern: (width>=900px) / (width<=899px)
  const legacy = /\(\s*(?:min|max)-width\s*:\s*([\d.]+)\s*(px|rem|em)\s*\)/gi;
  const modern = /\(\s*width\s*[<>]=?\s*([\d.]+)\s*(px|rem|em)\s*\)/gi;
  const counts = {};
  for (const re of [legacy, modern]) {
    let m;
    while ((m = re.exec(css)) !== null) {
      const value = `${m[1]}${m[2]}`;
      counts[value] = (counts[value] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

// ── Phase 3i: Dark mode detection ───────────────────────────────────
function detectDarkMode(css, cssVars) {
  const signals = [];
  if (/@media[^{]*prefers-color-scheme\s*:\s*dark/i.test(css)) signals.push("prefers-color-scheme: dark media query");
  const themeAttrCount = (css.match(/\[data-theme[~|*]?=["']?dark/gi) || []).length;
  if (themeAttrCount > 0) signals.push(`[data-theme="dark"] selector (${themeAttrCount}× rules)`);
  const darkClassCount = (css.match(/\.dark[\s,.{:>]/g) || []).length;
  if (darkClassCount > 5) signals.push(`.dark class (${darkClassCount}× rules)`);
  const themeDarkClassCount = (css.match(/\.theme-dark[\s,.{:>]/g) || []).length;
  if (themeDarkClassCount > 0) signals.push(`.theme-dark class (${themeDarkClassCount}× rules)`);

  const darkVars = cssVars.filter(v => /\.dark|\.theme-dark|\[data-theme[~|*]?=["']?dark|prefers-color-scheme.*dark/i.test(v.selector));
  return {
    has_dark_mode: signals.length > 0,
    signals,
    dark_var_count: darkVars.length,
    dark_var_sample: darkVars.slice(0, 30).map(v => ({ name: v.name, value: v.value, selector: v.selector.slice(0, 60) })),
  };
}

// ── Phase 3j: Per-component property extraction ─────────────────────

// Canonical component names and their selector aliases.
const KNOWN_COMPONENTS = [
  "button", "card", "input", "badge", "link", "nav", "tab",
  // Extended (B2) — adds the rest of common DS atoms
  "alert", "table", "tooltip", "modal", "avatar", "label", "help_text", "error_text",
];

// Interactive states extracted from CSS pseudo-classes and explicit selectors.
const KNOWN_STATES = ["default", "hover", "focus", "focus-visible", "active", "disabled", "checked", "selected", "expanded"];

// Selector alias map: CSS class prefix → canonical component name.
const _COMPONENT_ALIASES = {
  btn: "button", button: "button", cta: "button", "bb-button": "button", "ds-btn": "button",
  card: "card", "bb-card": "card", "ds-card": "card",
  input: "input", "bb-input": "input", "ds-input": "input", field: "input", "text-field": "input",
  badge: "badge", "bb-badge": "badge", tag: "badge", pill: "badge", chip: "badge",
  a: "link", link: "link", "bb-link": "link",
  nav: "nav", "bb-nav": "nav", navbar: "nav", navigation: "nav",
  tab: "tab", "bb-tab": "tab", tabs: "tab",
  // Extended (B2)
  alert: "alert", "bb-alert": "alert", banner: "alert", notice: "alert", notification: "alert", callout: "alert", toast: "alert",
  table: "table", tbl: "table", "data-table": "table",
  tooltip: "tooltip", "bb-tooltip": "tooltip", popover: "tooltip", tip: "tooltip",
  modal: "modal", dialog: "modal", "bb-modal": "modal", drawer: "modal", sheet: "modal", popup: "modal",
  avatar: "avatar", "bb-avatar": "avatar", "user-avatar": "avatar", "profile-pic": "avatar",
  label: "label", "form-label": "label",
  "help-text": "help_text", helper: "help_text", "form-help": "help_text", description: "help_text",
  "error-text": "error_text", "field-error": "error_text", "form-error": "error_text", invalid: "error_text",
};

// Pseudo-class → canonical state name.
const _STATE_PSEUDO_MAP = {
  hover: "hover", focus: "focus", "focus-visible": "focus-visible",
  active: "active", disabled: "disabled", checked: "checked",
  selected: "selected", expanded: "expanded",
};

/**
 * Parses a CSS selector and returns the component, variant, and interactive state it represents.
 * Handles: base class, pseudo-classes, BEM modifiers (--variant), and [data-variant] attributes.
 * Returns { component: string|null, variant: string|null, state: string }.
 */
function parseSelectorVariantState(selector) {
  const s = (selector || "").trim();

  // Strip leading combinators / whitespace to get the primary simple selector token.
  // We look for the first class, element, or attribute token.
  // Supported forms: .btn, .btn:hover, .btn--primary, .btn--ghost:hover, .btn[data-variant="ghost"],
  //   button:disabled, input:focus, a:hover, nav.active, etc.

  // Extract class name(s) — take the last meaningful class token before any pseudo.
  // E.g. ".btn--ghost:hover" → base=".btn", modifier="ghost", pseudo="hover"
  const classMatch = s.match(/\.([\w-]+)/);
  const elementMatch = !classMatch ? s.match(/^(a|button|input|select|textarea|nav|ul|li|span|div)(?=[:\s\[{,]|$)/i) : null;

  const rawToken = classMatch ? classMatch[1] : (elementMatch ? elementMatch[1].toLowerCase() : null);
  if (!rawToken) return { component: null, variant: null, state: "default" };

  // Resolve BEM modifier: .btn--primary → base="btn", modifier="primary"
  //   Also supports single-dash: .btn-primary (common Bootstrap convention).
  let base = rawToken;
  let variant = null;
  const bemDouble = rawToken.match(/^([\w]+)--([\w-]+)$/);
  const bemSingle = !bemDouble ? rawToken.match(/^(btn|card|badge|input|nav|tab|link|alert|table|tooltip|modal|avatar|label)-([\w-]+)$/) : null;
  if (bemDouble) {
    base = bemDouble[1];
    variant = bemDouble[2];
  } else if (bemSingle) {
    base = bemSingle[1];
    variant = bemSingle[2];
  }

  // COMPOUND CLASS variants — `.btn.btn-primary`, `.button.is-primary`, `.cta.cta-secondary`.
  // After the primary token (rawToken), look for sibling classes carrying a known variant suffix.
  if (!variant) {
    // Find ALL classes in the selector and check each for variant patterns
    const allClasses = [...s.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
    const VARIANT_KEYWORDS = /^(?:primary|secondary|tertiary|ghost|outline|outlined|link|danger|destructive|success|warning|info|neutral|brand|filled|soft|subtle|plain|default|elevated|callout|emphasis|critical|positive|negative|cta|hero|loading|small|medium|large|sm|md|lg|xl)$/i;
    for (const cls of allClasses) {
      if (cls === rawToken) continue;
      // Bulma: `.button.is-primary` → "primary"
      const bulma = cls.match(/^is-([\w-]+)$/i);
      if (bulma && VARIANT_KEYWORDS.test(bulma[1])) { variant = bulma[1].toLowerCase(); break; }
      // Bootstrap: `.btn.btn-primary` → "primary"
      const bsCompound = cls.match(/^(?:btn|button|card|alert|badge|nav|tab|link|input|table|tooltip|modal|avatar|label)-([\w-]+)$/i);
      if (bsCompound && VARIANT_KEYWORDS.test(bsCompound[1])) { variant = bsCompound[1].toLowerCase(); break; }
      // Direct keyword: `.btn.primary`
      if (VARIANT_KEYWORDS.test(cls)) { variant = cls.toLowerCase(); break; }
    }
  }

  // Resolve [data-variant|data-state|data-type|aria-pressed]="value" attribute.
  const dataVariantMatch = s.match(/\[(?:data-(?:variant|kind|appearance|theme|color|tone|size)|aria-(?:current|selected))[=~|]?["']?([\w-]+)["']?\]/);
  if (dataVariantMatch) variant = dataVariantMatch[1];

  // Resolve pseudo-class state.
  let state = "default";
  const pseudoMatch = s.match(/:(?!:)([\w-]+)/);
  if (pseudoMatch) {
    const pseudo = pseudoMatch[1].toLowerCase();
    state = _STATE_PSEUDO_MAP[pseudo] || "default";
  }

  // Resolve component canonical name.
  const component = _COMPONENT_ALIASES[base.toLowerCase()] || null;
  return { component, variant, state };
}

function detectComponentProperties(css) {
  // Regexes to detect whether a selector belongs to a known component family.
  // Pattern strategy:
  //   - element + lookahead `(?=[\s.\[:#{,]|$)` accepts `tag.class`, `tag:hover`, `tag[attr]`, `tag {`, etc.
  //   - class regexes allow CSS modules (`__hash`) by NOT putting `(?![-_])` after the canonical name
  //   - explicit BEM/Bootstrap variant suffixes are still allowed (`.btn-primary`, `.btn--primary`)
  const COMPONENT_KEYS = {
    button: /(?:^|[\s,>+~])(?:\.[\w-]*(?:btn|[Bb]utton)[\w_-]*|button(?=[\s.\[:#{,]|$)|\.cta\b|\[data-(?:component|radix-collection-item)=["']?button|input\[type=["']?(?:submit|button))/,
    card: /(?:^|[\s,>+~])(?:\.[\w-]*(?:card|product[-_](?:card|tile)|cms-block|feature-block|article-card)[\w_-]*|\.tile(?![\w-])|\.tile[-_][\w-]+|\.panel(?![\w-])|\.panel[-_][\w-]+|\.box[-_][\w-]+|article\.[\w-]*(?:card|tile)|\.bb-card|\.ds-card)/,
    input: /(?:^|[\s,>+~])(?:\.[\w-]*(?:input|field|text-field|form-control)[\w_-]*|(?:input|textarea|select)(?=[\s.\[:#{,]|$)|\.bb-input|\.ds-input)/,
    badge: /(?:^|[\s,>+~])(?:\.[\w-]*(?:badge|tag|pill|chip|eyebrow|label[-_](?:tag|chip))[\w_-]*|\.bb-badge)/,
    link: /(?:^|[\s,>+~])(?:\.[\w-]*link[\w_-]*|a(?=[\s.\[:#{,]|$)|\.bb-link)/,
    nav: /(?:^|[\s,>+~])(?:\.[\w-]*(?:nav|navbar|navigation|topbar|globalnav)[\w_-]*|nav(?=[\s.\[:#{,]|$)|\.bb-nav)/,
    tab: /(?:^|[\s,>+~])(?:\.[\w-]*(?:tab|tabs|tablist)[\w_-]*|\[role=["']?tab(?:list|panel)?|\.bb-tab)/,
    alert: /(?:^|[\s,>+~])(?:\.[\w-]*(?:alert|banner|notice|notification|callout|toast|flash|message)[\w_-]*|\[role=["']?(?:alert|status)|\.bb-alert)/,
    table: /(?:^|[\s,>+~])(?:\.[\w-]*(?:table|tbl|data-table|grid-table)[\w_-]*|table(?=[\s.\[:#{,]|$)|(?:thead|tbody|tr|th|td)(?=[\s.\[:#{,]|$))/,
    tooltip: /(?:^|[\s,>+~])(?:\.[\w-]*(?:tooltip|popover|tip)[\w_-]*|\[role=["']?tooltip|\[data-radix-tooltip|\.bb-tooltip)/,
    modal: /(?:^|[\s,>+~])(?:\.[\w-]*(?:modal|dialog|drawer|sheet|popup|overlay)[\w_-]*|dialog(?=[\s.\[:#{,]|$)|\[role=["']?dialog|\[data-radix-dialog|\.bb-modal)/,
    avatar: /(?:^|[\s,>+~])(?:\.[\w-]*(?:avatar|user-image|profile-(?:img|pic|image))[\w_-]*|\.bb-avatar)/,
    label: /(?:^|[\s,>+~])(?:\.[\w-]*(?:form-label|field-label)[\w_-]*|label(?=[\s.\[:#{,]|$)|\.label\b)/,
    help_text: /(?:^|[\s,>+~])(?:\.[\w-]*(?:help-text|form-help|helper-text|hint-text|description-text)[\w_-]*|\.hint(?=[\s.\[:#{,]|$))/,
    error_text: /(?:^|[\s,>+~])(?:\.[\w-]*(?:error-text|field-error|form-error|error-message|invalid-feedback)[\w_-]*|\.is-invalid\b)/,
  };
  const PROPS = [
    // Existing — default state visual contract
    "border-radius", "padding", "font-weight", "font-size",
    "border-width", "background-color", "color",
    // S12-extension: interactive state visual contract (CONCERN-001 fix)
    "opacity",         // disabled greying
    "cursor",          // disabled / interactive affordance
    "outline",         // focus-visible primary signal
    "outline-color",
    "outline-offset",
    "box-shadow",      // hover/focus elevation
    "transform",       // hover/active micro-motion
    "transition",      // duration/easing of state change
  ];

  // Accumulate declarations keyed by (component, state, variant).
  // Structure: acc[comp][state|"__variant__:name"][prop] = [{ selector, value }]
  const acc = {};
  for (const comp of KNOWN_COMPONENTS) {
    acc[comp] = { __default__: {} };
    for (const p of PROPS) acc[comp].__default__[p] = [];
  }

  const ruleRe = /([^{}@]+)\{([^}]*)\}/g;
  let m;
  while ((m = ruleRe.exec(css)) !== null) {
    const selector = m[1].trim();
    const body = m[2];
    if (!selector || selector.length > 200) continue;
    if (/:after|:before|loading|spinner|::backdrop/i.test(selector)) continue;

    // Split comma-separated selectors so ".btn, .button { ... }" hits both.
    const parts = selector.split(",");
    for (const part of parts) {
      const partTrimmed = part.trim();
      let matchedComp = null;
      for (const [comp, regex] of Object.entries(COMPONENT_KEYS)) {
        if (regex.test(partTrimmed)) { matchedComp = comp; break; }
      }
      if (!matchedComp) continue;

      const parsed = parseSelectorVariantState(partTrimmed);
      // If parseSelectorVariantState found a different component, trust COMPONENT_KEYS match (broader).
      const comp = matchedComp;
      const interactiveState = parsed.state || "default";
      const variantKey = parsed.variant ? `__variant__:${parsed.variant}` : null;

      for (const prop of PROPS) {
        // Use (?<![a-z-]) to avoid "color" matching inside "background-color".
        const propRe = new RegExp("(?<![a-z-])" + prop + "\\s*:\\s*([^;}]+)", "i");
        const pm = body.match(propRe);
        if (!pm) continue;
        const value = pm[1].trim();
        const entry = { selector: partTrimmed.slice(0, 120), value };

        // Store under state bucket only when no variant is present OR when state is explicitly
        // interactive (hover/focus/etc.) — avoids polluting default state with variant-only rules.
        if (!variantKey || interactiveState !== "default") {
          if (!acc[comp][interactiveState]) acc[comp][interactiveState] = {};
          if (!acc[comp][interactiveState][prop]) acc[comp][interactiveState][prop] = [];
          acc[comp][interactiveState][prop].push(entry);
        }

        // Store under variant bucket when a variant was parsed.
        if (variantKey) {
          if (!acc[comp][variantKey]) acc[comp][variantKey] = {};
          if (!acc[comp][variantKey][prop]) acc[comp][variantKey][prop] = [];
          acc[comp][variantKey][prop].push(entry);
        }
      }
    }
  }

  // Collapse declarations using most_common heuristic.
  function collapse(propMap) {
    const result = {};
    for (const [prop, decls] of Object.entries(propMap)) {
      if (!decls || decls.length === 0) continue;
      const counts = {};
      for (const d of decls) counts[d.value] = (counts[d.value] || 0) + 1;
      const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      result[prop] = {
        most_common: ranked[0][0],
        most_common_count: ranked[0][1],
        total_declarations: decls.length,
        all_values: ranked.slice(0, 5).map(([v, c]) => ({ value: v, count: c })),
      };
    }
    return result;
  }

  const summary = {};
  for (const comp of KNOWN_COMPONENTS) {
    const bucket = acc[comp];
    const statesObj = {};
    const variantsObj = {};

    for (const [key, propMap] of Object.entries(bucket)) {
      if (key.startsWith("__variant__:")) {
        const variantName = key.slice("__variant__:".length);
        const collapsed = collapse(propMap);
        if (Object.keys(collapsed).length > 0) variantsObj[variantName] = collapsed;
      } else {
        // key is an interactive state (e.g. "default", "hover", "focus")
        const collapsed = collapse(propMap);
        if (Object.keys(collapsed).length > 0) statesObj[key] = collapsed;
      }
    }

    if (Object.keys(statesObj).length === 0 && Object.keys(variantsObj).length === 0) continue;

    // Ensure default exists when we have other states.
    if (!statesObj.default) statesObj.default = {};

    summary[comp] = {
      states: statesObj,
      variants: variantsObj,
      // Backward compat: spread default state properties at component top-level.
      ...statesObj.default,
    };
  }

  return { summary };
}

// ── HTML → markdown ─────────────────────────────────────────────────
function htmlToMarkdown(html) {
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
  const $ = cheerio.load(html);
  $("script, noscript, style, svg, link").remove();
  return td.turndown($.html());
}

// ── Page copy specimens (for typography preview) ────────────────────
function stripMarkdownInline(s) {
  return String(s || "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_]+)_(?!_)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/https?:\/\/[^\s)]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPageCopy(md) {
  const lines = md.split("\n").map((l) => l.trim()).filter(Boolean);
  const headingLine = lines.find((l) => /^#{1,3}\s/.test(l));
  const headingRaw = headingLine ? headingLine.replace(/^#{1,3}\s+/, "") : "";
  const heading = stripMarkdownInline(headingRaw).slice(0, 80);

  let body = "";
  for (const l of lines) {
    if (l.startsWith("#") || l.startsWith(">") || l.startsWith("-") || l.startsWith("*") || l.startsWith("|") || l.startsWith("!")) continue;
    const stripped = stripMarkdownInline(l);
    const alphaLen = stripped.replace(/[^a-zA-Z]/g, "").length;
    if (alphaLen < 30) continue;
    body = stripped.slice(0, 160);
    break;
  }
  return { heading, body };
}

// ── CSS var resolution (used by tokens.cjs and preview.cjs) ─────────
function resolveCssVar(cssVars, name, seen = new Set()) {
  if (seen.has(name)) return null;
  seen.add(name);
  if (!Array.isArray(cssVars)) return null;
  const rootDecl = cssVars.find((v) => v.name === name && v.selector === ":root");
  const decl = rootDecl || cssVars.find((v) => v.name === name);
  if (!decl) return null;
  let value = decl.value;
  const aliasMatch = value.match(/^var\(\s*(--[a-zA-Z][\w-]*)\s*(?:,([^)]+))?\)\s*$/);
  if (aliasMatch) {
    const resolved = resolveCssVar(cssVars, aliasMatch[1], seen);
    if (resolved) return resolved;
    if (aliasMatch[2]) return aliasMatch[2].trim();
    return null;
  }
  return value;
}

// ── L3/L4 EXTRA DETECTORS ────────────────────────────────────────────
// Each returns a structured object suitable for tokens-extended.json.

function detectGradients(css) {
  const re = /(linear-gradient|radial-gradient|conic-gradient)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi;
  const counts = new Map();
  let m;
  while ((m = re.exec(css)) !== null) {
    const full = `${m[1]}(${m[2]})`;
    counts.set(full, (counts.get(full) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    primary: sorted[0]?.[0] || null,
    secondary: sorted[1]?.[0] || null,
    total_unique: sorted.length,
    top: sorted.slice(0, 10).map(([value, count]) => ({ value, count })),
  };
}

function detectBackdropBlur(css) {
  const re = /backdrop-filter\s*:\s*([^;}]+)/gi;
  const blurs = new Map();
  let m;
  while ((m = re.exec(css)) !== null) {
    const blurMatch = m[1].match(/blur\(\s*([\d.]+)(px|rem|em)?\s*\)/i);
    if (!blurMatch) continue;
    const px = blurMatch[2] === "rem" || blurMatch[2] === "em"
      ? parseFloat(blurMatch[1]) * 16
      : parseFloat(blurMatch[1]);
    if (!isNaN(px) && px > 0) blurs.set(px, (blurs.get(px) || 0) + 1);
  }
  if (blurs.size === 0) return { has_backdrop_blur: false };
  const sorted = [...blurs.keys()].sort((a, b) => a - b);
  const out = { has_backdrop_blur: true, total_unique: sorted.length };
  if (sorted.length >= 1) out.sm = sorted[0] + "px";
  if (sorted.length >= 2) out.md = sorted[Math.floor(sorted.length / 2)] + "px";
  if (sorted.length >= 1) out.lg = sorted[sorted.length - 1] + "px";
  return out;
}

function detectZIndex(css) {
  const re = /z-index\s*:\s*(-?\d+)/gi;
  const counts = new Map();
  let m;
  while ((m = re.exec(css)) !== null) {
    const z = parseInt(m[1], 10);
    if (!isNaN(z) && z >= 0 && z < 100000) counts.set(z, (counts.get(z) || 0) + 1);
  }
  if (counts.size === 0) return { all: [] };
  const sorted = [...counts.entries()].sort((a, b) => a[0] - b[0]);
  // Bucket: base / dropdown / modal / toast / tooltip
  const out = { all: sorted.map(([value, count]) => ({ value, count })) };
  const values = sorted.map((e) => e[0]);
  if (values.length >= 1) out.base = values[0];
  if (values.length >= 2) out.dropdown = values[Math.floor(values.length * 0.4)];
  if (values.length >= 3) out.modal = values[Math.floor(values.length * 0.7)];
  if (values.length >= 4) out.toast = values[Math.floor(values.length * 0.85)];
  if (values.length >= 1) out.tooltip = values[values.length - 1];
  return out;
}

function detectContainerMaxWidth(css) {
  // Look for max-width declarations INSIDE rule bodies for container-ish classes.
  // Broader selector list + utility-style (.max-w-*) + body-level fallback.
  // Excludes @media/@container queries (where max-width appears inside parens).
  const counts = new Map();

  // Pass 1: known container class names
  const re1 = /\.(container|wrapper|layout|content|main|inner|page|site|app|root|shell|frame|holder|grid-container|max-w-[\w-]+)[^{}]*\{([^{}]*)\}/gi;
  let m;
  while ((m = re1.exec(css)) !== null) {
    const mw = m[2].match(/max-width\s*:\s*([^;}]+)/i);
    if (!mw) continue;
    const v = mw[1].trim();
    if (!v || v === "none" || v === "100%" || v === "auto") continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }

  // Pass 2: rules where max-width >= 768px (likely container) — lower threshold
  // than before. Excludes very small values that are usually image/widget caps.
  const re2 = /\{[^{}]*max-width\s*:\s*([\d.]+)(px|rem|em)[^{}]*\}/g;
  let m2;
  while ((m2 = re2.exec(css)) !== null) {
    const num = parseFloat(m2[1]);
    const unit = m2[2];
    const px = unit === "px" ? num : (unit === "rem" || unit === "em") ? num * 16 : num;
    if (px < 768) continue; // tablet+ only
    if (px > 4000) continue; // probably an outlier
    const v = num + unit;
    // Already counted from Pass 1? add extra weight if already present.
    counts.set(v, (counts.get(v) || 0) + 1);
  }

  if (counts.size === 0) return { value: null };
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return { value: sorted[0][0], all: sorted.slice(0, 5).map(([v, c]) => ({ value: v, count: c })) };
}

function detectOpacityScale(css) {
  const re = /(?<!\w)opacity\s*:\s*(0?\.\d+|0|1|\d+%)/gi;
  const counts = new Map();
  let m;
  while ((m = re.exec(css)) !== null) {
    let v = m[1];
    if (v.endsWith("%")) v = (parseFloat(v) / 100).toString();
    const n = parseFloat(v);
    if (isNaN(n) || n <= 0 || n > 1) continue;
    if (n === 1) continue; // skip "fully visible" — doesn't represent a token
    counts.set(n, (counts.get(n) || 0) + 1);
  }
  if (counts.size === 0) return null;
  const sorted = [...counts.entries()].sort((a, b) => a[0] - b[0]);
  const out = { all: sorted.map(([v, c]) => ({ value: v, count: c })) };
  // Bucket: disabled (lowest), muted (mid-low), hover (mid-high)
  const values = sorted.map((e) => e[0]);
  if (values.length >= 1) out.disabled = values[0];
  if (values.length >= 2) out.muted = values[Math.floor(values.length / 2)];
  if (values.length >= 1) out.hover = values[values.length - 1];
  return out;
}

// Detect the THEME the site renders by default (dark vs light).
// Signals (in priority order):
//   1. <meta name="color-scheme" content="dark light"> — first word is preferred
//   2. <html data-theme="dark|light">, <html data-color-mode="dark|light">
//   3. <body class="...dark...">
//   4. <meta name="theme-color" content="#hex"> — luminance heuristic (<0.3 = dark)
// Returns { default: "dark"|"light", confidence: "high"|"medium"|"low", signals: [...] }
function detectDefaultTheme(html, css = null) {
  if (!html) return { default: "light", confidence: "low", signals: ["no-html-fallback"] };
  const signals = [];
  let pick = null;

  // 1. color-scheme meta — strongest signal
  const csMatch = html.match(/<meta[^>]+name=["']color-scheme["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (csMatch) {
    const tokens = csMatch[1].toLowerCase().trim().split(/\s+/);
    const first = tokens[0];
    if (first === "dark" || first === "light") {
      pick = first;
      signals.push(`meta color-scheme="${csMatch[1]}" → ${first}`);
    }
  }

  // 2. html data-theme / data-color-mode
  if (!pick) {
    const htmlTag = (html.match(/<html[^>]*>/i) || [""])[0];
    const dataTheme = htmlTag.match(/data-(?:theme|color-mode)\s*=\s*["']([^"']+)["']/i);
    if (dataTheme) {
      const v = dataTheme[1].toLowerCase();
      if (v === "dark" || v === "light") {
        pick = v;
        signals.push(`<html data-theme="${v}">`);
      }
    }
  }

  // 3a. html class — Tailwind/Next-themes convention: <html class="dark">
  if (!pick) {
    const htmlTag2 = (html.match(/<html[^>]*>/i) || [""])[0];
    const htmlClass = htmlTag2.match(/class\s*=\s*["']([^"']+)["']/i);
    if (htmlClass) {
      const cls = htmlClass[1].toLowerCase();
      if (/\bdark(-theme|-mode)?\b/.test(cls)) {
        pick = "dark";
        signals.push(`<html class*="dark*">`);
      } else if (/\blight(-theme|-mode)?\b/.test(cls)) {
        pick = "light";
        signals.push(`<html class*="light*">`);
      }
    }
  }

  // 3b. body class
  if (!pick) {
    const bodyMatch = html.match(/<body[^>]+class=["']([^"']+)["']/i);
    if (bodyMatch) {
      const cls = bodyMatch[1].toLowerCase();
      if (/\bdark(-theme|-mode)?\b/.test(cls)) {
        pick = "dark";
        signals.push(`<body class*="dark*">`);
      } else if (/\blight(-theme|-mode)?\b/.test(cls)) {
        pick = "light";
        signals.push(`<body class*="light*">`);
      }
    }
  }

  // 4. theme-color luminance fallback
  if (!pick) {
    const tcMatches = [...html.matchAll(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["'][^>]*>/gi)];
    if (tcMatches.length > 0) {
      // Pick first non-media-prefixed theme-color (the "default")
      const defaultTc = tcMatches.find((m) => !/(prefers-color-scheme:\s*(?:dark|light))/.test(m[0])) || tcMatches[0];
      const hex = defaultTc[1].replace("#", "").trim();
      const luminance = computeLuminance(hex);
      if (luminance != null) {
        pick = luminance < 0.4 ? "dark" : "light";
        signals.push(`theme-color="${defaultTc[1]}" luminance=${luminance.toFixed(2)} → ${pick}`);
      }
    }
  }

  // 5. CSS-based fallback — when HTML emits no theme signal (common in
  //    Tailwind sites that toggle `.dark` on the client), inspect the
  //    background-related custom properties declared in global selectors
  //    (`:root`, `html`, `body`). Most-frequent value wins; the average
  //    luminance of those values picks the default mode.
  if (!pick && css) {
    const cssPick = inferThemeFromCssBackgrounds(css);
    if (cssPick) {
      pick = cssPick.mode;
      signals.push(`css-bg vars luminance avg=${cssPick.luminance.toFixed(2)} → ${pick}`);
    }
  }

  if (!pick) return { default: "light", confidence: "low", signals: signals.length ? signals : ["no-signal-fallback"] };

  // Confidence:
  //   - high: color-scheme meta or html data-attr (explicit declaration)
  //   - low: CSS-inferred (statistical heuristic)
  //   - medium: everything else (class selector, theme-color luminance)
  let confidence;
  if (/color-scheme|data-theme|data-color-mode/.test(signals.join(" "))) {
    confidence = "high";
  } else if (/css-bg vars/.test(signals.join(" "))) {
    confidence = "low";
  } else {
    confidence = "medium";
  }
  return { default: pick, confidence, signals };
}

const BG_VAR_RE = /--(?:color-)?(?:background|bg|bg-base|bg-canvas|surface|page-bg)(?:-default)?\s*:\s*([^;}]+)/gi;
const BG_PROP_RE = /(?:^|[^-])(?:background|background-color)\s*:\s*([^;}]+)/gi;

function inferThemeFromCssBackgrounds(css) {
  // Walk every block declared on a global selector (:root, :host, html, body).
  // We classify each block's "default-ness":
  //
  //   - Selectors like `:root:not(:where(.light))` apply BY DEFAULT, when no
  //     class is set. They're the dark-default pattern shadcn / Tailwind use
  //     to ship dark-first themes. Any background declared here is the
  //     real default.
  //   - Selectors like `:root,:where(.light)` apply when EITHER root OR a
  //     `.light` class is present — these are explicit light-state rules,
  //     not the implicit default.
  //   - Plain `:root`, `html`, `body` apply by default.
  //
  // We prefer evidence from default-applying selectors. If any are found,
  // they win. Otherwise, fall back to averaging all explicit declarations.
  const BLOCK_RE = /([^{}]+)\{([^{}]+)\}/g;
  const defaultLuminances = [];
  const fallbackLuminances = [];
  let block;
  while ((block = BLOCK_RE.exec(css)) !== null) {
    const selector = block[1].trim().toLowerCase();
    const isGlobal = /^(?::root|:host|html|body)\b/.test(selector) || /[\s,]body\b/.test(selector);
    if (!isGlobal) continue;
    if (/\.dark|\bdata-theme\s*=\s*["']?dark|\bdata-color-mode\s*=\s*["']?dark|prefers-color-scheme:\s*dark/.test(selector)) continue;

    // shadcn-style dark-first: `:root:not(:where(.light))` declares the
    // background that wins when no .light class is present.
    const isDefaultDark = /:not\(\s*:where\(\s*\.light\b|:not\(\s*\.light\b/.test(selector);
    // Inverse: `:not(.dark)` selectors apply when no .dark class is set.
    const isDefaultLight = /:not\(\s*:where\(\s*\.dark\b|:not\(\s*\.dark\b/.test(selector);
    // Selector explicitly opts into a light state (`.light` class active).
    // Skip those — they're not the implicit default. But don't skip the
    // negated form `:not(:where(.light))`, which fires precisely when the
    // light class is ABSENT (i.e. the default).
    const isExplicitLightState =
      /:where\(\s*\.light\b|\.light\b/.test(selector) && !isDefaultDark && !isDefaultLight;
    if (isExplicitLightState) continue;

    const body = block[2];
    const bucket = (isDefaultDark || isDefaultLight) ? defaultLuminances : fallbackLuminances;

    BG_VAR_RE.lastIndex = 0;
    let m;
    while ((m = BG_VAR_RE.exec(body)) !== null) {
      const value = m[1].trim().replace(/!important/gi, "").trim();
      const lum = luminanceFromCssColor(value);
      if (lum != null) bucket.push(lum);
    }

    BG_PROP_RE.lastIndex = 0;
    while ((m = BG_PROP_RE.exec(body)) !== null) {
      const value = m[1].trim().replace(/!important/gi, "").trim();
      const lum = luminanceFromCssColor(value);
      if (lum != null) bucket.push(lum);
    }
  }
  // Default-applying selectors always win when present — they're the most
  // direct signal of "what does the page paint when nothing is toggled".
  const source = defaultLuminances.length > 0 ? defaultLuminances : fallbackLuminances;
  if (source.length === 0) return null;
  const avg = source.reduce((a, b) => a + b, 0) / source.length;
  if (avg < 0.42) return { mode: "dark", luminance: avg };
  if (avg > 0.6) return { mode: "light", luminance: avg };
  return null;
}

function luminanceFromCssColor(value) {
  if (!value) return null;
  const v = value.trim();
  if (v.startsWith("var(")) return null; // self-referential, skip
  if (v.startsWith("#")) return computeLuminance(v.replace("#", ""));
  // rgb(0, 0, 0) / rgba(0,0,0,1)
  const rgb = v.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i);
  if (rgb) {
    const r = Number(rgb[1]) / 255;
    const g = Number(rgb[2]) / 255;
    const b = Number(rgb[3]) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  // Common named shorthand
  if (/^white$/i.test(v)) return 1;
  if (/^black$/i.test(v)) return 0;
  return null;
}

function computeLuminance(hex) {
  let h = hex;
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  if ([r, g, b].some((v) => isNaN(v))) return null;
  // Relative luminance approximation (sRGB)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function detectFocusRing(css) {
  // Extract outline / box-shadow declarations within :focus-visible rules
  const re = /:focus(?:-visible)?\s*\{([^{}]*)\}/gi;
  const outlines = new Map();
  const shadows = new Map();
  let m;
  while ((m = re.exec(css)) !== null) {
    const body = m[1];
    const outlineMatch = body.match(/outline\s*:\s*([^;}]+)/i);
    if (outlineMatch) {
      const v = outlineMatch[1].trim();
      if (v && v !== "none" && v !== "0") outlines.set(v, (outlines.get(v) || 0) + 1);
    }
    const offsetMatch = body.match(/outline-offset\s*:\s*([^;}]+)/i);
    if (offsetMatch) outlines.set("__offset__:" + offsetMatch[1].trim(), 1);
    const shadowMatch = body.match(/box-shadow\s*:\s*([^;}]+)/i);
    if (shadowMatch) {
      const v = shadowMatch[1].trim();
      if (v && v !== "none") shadows.set(v, (shadows.get(v) || 0) + 1);
    }
  }
  const out = { detected: outlines.size > 0 || shadows.size > 0 };
  if (outlines.size > 0) {
    const sorted = [...outlines.entries()].sort((a, b) => b[1] - a[1]);
    const topOutline = sorted.find((e) => !e[0].startsWith("__offset__:"));
    if (topOutline) out.outline = topOutline[0];
    const topOffset = sorted.find((e) => e[0].startsWith("__offset__:"));
    if (topOffset) out.outline_offset = topOffset[0].slice("__offset__:".length);
  }
  if (shadows.size > 0) {
    const sorted = [...shadows.entries()].sort((a, b) => b[1] - a[1]);
    out.box_shadow = sorted[0][0];
  }
  return out;
}

module.exports = {
  detectTokens,
  detectCssVars,
  detectFontFaces,
  detectStack,
  classifyStyle,
  truncateCssForLlm,
  DEFAULT_CSS_BUDGET_BYTES,
  summarizeStackForPrompt,
  detectShadows,
  detectMotion,
  detectBreakpoints,
  detectDarkMode,
  detectComponentProperties,
  parseSelectorVariantState,
  KNOWN_COMPONENTS,
  KNOWN_STATES,
  buildUsageGraph,
  htmlToMarkdown,
  stripMarkdownInline,
  extractPageCopy,
  resolveCssVar,
  STACK_SUPPRESSIONS,
  // L3/L4 extras
  detectGradients,
  detectBackdropBlur,
  detectZIndex,
  detectContainerMaxWidth,
  detectOpacityScale,
  detectFocusRing,
  // Theme default detection (dark vs light)
  detectDefaultTheme,
  computeLuminance,
};
