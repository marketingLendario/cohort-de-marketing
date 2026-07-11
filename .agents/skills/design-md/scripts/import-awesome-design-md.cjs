#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const yaml = require("js-yaml");

const { buildRenderContract } = require("../lib/render-contract.cjs");
const { renderPreview } = require("../lib/preview.cjs");
const { detectLiveThemeDefault } = require("../lib/live-theme.cjs");
const { getThemeCuration } = require("../lib/theme-curation.cjs");
const { inferThemeFromDesignMd, hasThemeSignal } = require("../lib/theme-inference.cjs");

const EXTRACTS_ROOT =
  process.env.DESIGN_MD_OUTPUTS_DIR ||
  path.join(process.cwd(), "outputs", "design-md");
const CATALOG_TREE_URL =
  "https://api.github.com/repos/VoltAgent/awesome-design-md/git/trees/main?recursive=1";
const TMP_ROOT = path.join(os.tmpdir(), "design-md-awesome-import");

const CLI_EXTRA_SLUGS = [
  "binance",
  "bmw-m",
  "bugatti",
  "mastercard",
  "meta",
  "nike",
  "playstation",
  "shopify",
  "slack",
  "starbucks",
  "theverge",
  "vodafone",
  "wired",
];

const KNOWN_UNAVAILABLE_SLUGS = new Set([
  // Listed in the GitHub catalog on 2026-04-29, but absent from
  // `npx getdesign@latest list`, so `getdesign add semrush` fails.
  "semrush",
]);

const EXISTING_ALIASES = {
  "linear.app": "linear",
};

const DOMAIN_OVERRIDES = {
  airbnb: "airbnb.com",
  airtable: "airtable.com",
  apple: "apple.com",
  bmw: "bmw.com",
  cal: "cal.com",
  claude: "claude.ai",
  clay: "clay.com",
  clickhouse: "clickhouse.com",
  cohere: "cohere.com",
  coinbase: "coinbase.com",
  composio: "composio.dev",
  cursor: "cursor.com",
  elevenlabs: "elevenlabs.io",
  expo: "expo.dev",
  ferrari: "ferrari.com",
  figma: "figma.com",
  framer: "framer.com",
  hashicorp: "hashicorp.com",
  ibm: "ibm.com",
  intercom: "intercom.com",
  kraken: "kraken.com",
  lamborghini: "lamborghini.com",
  lovable: "lovable.dev",
  minimax: "minimax.io",
  mintlify: "mintlify.com",
  miro: "miro.com",
  mongodb: "mongodb.com",
  notion: "notion.so",
  nvidia: "nvidia.com",
  ollama: "ollama.com",
  pinterest: "pinterest.com",
  playstation: "playstation.com",
  posthog: "posthog.com",
  raycast: "raycast.com",
  renault: "renault.com",
  replicate: "replicate.com",
  resend: "resend.com",
  revolut: "revolut.com",
  runwayml: "runwayml.com",
  sanity: "sanity.io",
  semrush: "semrush.com",
  sentry: "sentry.io",
  slack: "slack.com",
  spacex: "spacex.com",
  spotify: "spotify.com",
  starbucks: "starbucks.com",
  stripe: "stripe.com",
  supabase: "supabase.com",
  superhuman: "superhuman.com",
  tesla: "tesla.com",
  theverge: "theverge.com",
  uber: "uber.com",
  vercel: "vercel.com",
  vodafone: "vodafone.com",
  voltagent: "voltagent.dev",
  warp: "warp.dev",
  webflow: "webflow.com",
  wired: "wired.com",
  wise: "wise.com",
  zapier: "zapier.com",
};

const args = process.argv.slice(2);
const onlyIndex = args.indexOf("--only");
const only = onlyIndex >= 0 ? new Set(String(args[onlyIndex + 1] || "").split(",").filter(Boolean)) : null;
const force = args.includes("--force");

async function main() {
  fs.mkdirSync(EXTRACTS_ROOT, { recursive: true });
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  fs.mkdirSync(TMP_ROOT, { recursive: true });

  const catalog = await fetchCatalogSlugs();
  const selected = only ? catalog.filter((slug) => only.has(slug)) : catalog;

  const summary = {
    catalog: catalog.length,
    selected: selected.length,
    imported: [],
    skipped: [],
    failed: [],
  };

  for (const slug of selected) {
    const outputSlug = slug;
    const alias = EXISTING_ALIASES[slug];
    const existingSlug = alias && hasUsableRun(alias) ? alias : outputSlug;
    if (!force && hasUsableRun(existingSlug)) {
      summary.skipped.push({ slug, reason: alias ? `already-have-alias:${alias}` : "already-have" });
      continue;
    }

    try {
      const result = await importSlug(slug, outputSlug);
      summary.imported.push(result);
      console.log(`[imported] ${slug} -> ${result.dir}`);
    } catch (error) {
      summary.failed.push({ slug, error: error.message, stack: error.stack });
      console.error(`[failed] ${slug}: ${error.stack || error.message}`);
    }
  }

  const reportPath = path.join(EXTRACTS_ROOT, "_awesome-design-md-import-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  console.log("");
  console.log(`[done] catalog=${summary.catalog} selected=${summary.selected} imported=${summary.imported.length} skipped=${summary.skipped.length} failed=${summary.failed.length}`);
  console.log(`[report] ${reportPath}`);

  if (summary.failed.length > 0) {
    process.exitCode = 1;
  }
}

async function fetchCatalogSlugs() {
  const response = await fetch(CATALOG_TREE_URL, {
    headers: { "user-agent": "design-md-extractor" },
  });
  if (!response.ok) {
    throw new Error(`Could not fetch awesome-design-md tree: HTTP ${response.status}`);
  }
  const payload = await response.json();
  const githubSlugs = payload.tree
    .filter((entry) => entry.type === "tree" && /^design-md\/[^/]+$/.test(entry.path))
    .map((entry) => entry.path.split("/")[1])
    .filter((slug) => !KNOWN_UNAVAILABLE_SLUGS.has(slug));

  return [...new Set([...githubSlugs, ...CLI_EXTRA_SLUGS])].sort();
}

function hasUsableRun(slug) {
  const dir = path.join(EXTRACTS_ROOT, slug);
  return fs.existsSync(path.join(dir, "DESIGN.md")) && fs.existsSync(path.join(dir, "tokens.json"));
}

async function importSlug(slug, outputSlug) {
  const workDir = path.join(TMP_ROOT, slug.replace(/[^a-z0-9._-]/gi, "_"));
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  const cli = spawnSync("npx", ["--yes", "getdesign@latest", "add", slug], {
    cwd: workDir,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8,
  });

  if (cli.status !== 0) {
    throw new Error((cli.stderr || cli.stdout || `getdesign exited ${cli.status}`).trim());
  }

  const rawDesignPath = path.join(workDir, "DESIGN.md");
  if (!fs.existsSync(rawDesignPath)) {
    throw new Error("getdesign did not produce DESIGN.md");
  }

  const rawDesignMd = fs.readFileSync(rawDesignPath, "utf8");
  const split = splitFrontmatter(rawDesignMd);
  const meta = buildMetadata(slug, rawDesignMd, split.frontmatter);
  const tokens = buildTokens(rawDesignMd, meta, split.frontmatter);
  const designMd = withFrontmatter(split.body, tokens);
  const outDir = path.join(EXTRACTS_ROOT, outputSlug);
  const themeDefault = await resolveThemeDefault(meta.source_url, rawDesignMd, tokens, meta);

  fs.mkdirSync(path.join(outDir, "inputs"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "DESIGN.md"), designMd);
  fs.writeFileSync(path.join(outDir, "tokens.json"), JSON.stringify(tokens, null, 2));
  fs.writeFileSync(path.join(outDir, "tokens-extended.json"), JSON.stringify(buildExtended(slug, meta), null, 2));
  fs.writeFileSync(path.join(outDir, "telemetry.json"), JSON.stringify(buildTelemetry(slug, meta), null, 2));
  fs.writeFileSync(path.join(outDir, "agent-prompt.txt"), buildAgentPrompt(tokens));
  fs.writeFileSync(path.join(outDir, "quality-score.json"), JSON.stringify(buildQualityScore(), null, 2));
  fs.writeFileSync(path.join(outDir, "style-fingerprint.json"), JSON.stringify(buildStyleFingerprint(tokens), null, 2));
  fs.writeFileSync(path.join(outDir, "inputs", "DESIGN.md.raw"), rawDesignMd);
  fs.writeFileSync(path.join(outDir, "inputs", "favicon.json"), JSON.stringify({
    sourceUrl: meta.favicon_url,
    source: "google-s2-favicon",
  }, null, 2));
  fs.writeFileSync(path.join(outDir, "inputs", "theme-default.json"), JSON.stringify({
    ...themeDefault,
    source: "awesome-design-md-import",
  }, null, 2));
  fs.writeFileSync(path.join(outDir, "extraction-log.yaml"), yaml.dump({
    source: "awesome-design-md",
    source_url: meta.source_url,
    getdesign_slug: slug,
    imported_at: new Date().toISOString(),
  }, { lineWidth: -1 }));

  const renderContract = buildRenderContract({
    url: meta.source_url,
    tokens,
    extended: {},
    themeDefault,
  });
  fs.writeFileSync(path.join(outDir, "render-contract.json"), JSON.stringify(renderContract, null, 2));

  const previewHtml = renderPreview({
    url: meta.source_url,
    designMd,
    tokens,
    pageCopy: {
      title: tokens.name,
      description: tokens.description,
    },
    cssMeta: {
      external: [],
      preload: [],
      imports_resolved: 0,
      inline_style_blocks: 0,
      inline_style_attrs: 0,
      failed: [],
    },
    detected: {
      colors: {
        hex: Object.keys(colorUsageMap(rawDesignMd)),
        hex_usage: colorUsageMap(rawDesignMd),
      },
      typography: {
        family: [firstTypographicFamily(tokens.typography)],
        size: ["12px", "16px", "24px", "36px", "48px"],
      },
      fonts: [],
      spacing: [],
      radii: [],
    },
    cssVars: [],
    fontFaces: [],
    usageGraph: [],
    extractionLog: null,
    lintResult: null,
    favicon: { sourceUrl: meta.favicon_url },
    qualityScore: buildQualityScore(),
    styleFingerprint: buildStyleFingerprint(tokens),
    agentPrompt: buildAgentPrompt(tokens),
  });
  fs.writeFileSync(path.join(outDir, "preview.html"), previewHtml);

  return { slug, dir: outDir, source_url: meta.source_url };
}

async function resolveThemeDefault(sourceUrl, rawDesignMd, tokens, meta = {}) {
  const curated = getThemeCuration(meta.slug, meta.domain, sourceUrl);
  if (curated) return curated;
  const semantic = inferThemeFromDesignMd(rawDesignMd, tokens);
  const live = await detectLiveThemeDefault(sourceUrl);
  if (live && hasThemeSignal(live)) return live;
  return semantic;
}

function buildMetadata(slug, rawDesignMd, frontmatter = null) {
  const domain = DOMAIN_OVERRIDES[slug] || (slug.includes(".") ? slug : `${slug}.com`);
  const name = frontmatter?.name || titleFromDesignMd(rawDesignMd) || titleCase(slug.replace(/\..+$/, ""));
  return {
    slug,
    domain,
    name,
    source_url: `https://${domain}/`,
    getdesign_url: `https://getdesign.md/${slug}/design-md`,
    favicon_url: `https://www.google.com/s2/favicons?domain_url=https://${domain}&sz=64`,
  };
}

function titleFromDesignMd(markdown) {
  const firstHeading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!firstHeading) return null;
  return firstHeading
    .replace(/^Design System Inspired by\s+/i, "")
    .replace(/\s+Inspired Design System$/i, "")
    .trim();
}

function buildTokens(markdown, meta, frontmatter = null) {
  const palette = extractPalette(markdown);
  const roles = assignColorRoles(palette);
  const font = extractPrimaryFont(markdown);
  const mono = extractMonoFont(markdown);
  const radius = extractRadius(markdown);

  const colors = cleanObject({
    primary: roles.primary,
    secondary: roles.secondary,
    tertiary: roles.tertiary,
    neutral: roles.neutral,
    surface: roles.surface,
    text: roles.text,
    "text-muted": roles.muted,
    border: roles.border,
    accent: roles.accent,
    success: roles.success,
    error: roles.error,
    ...palette.named,
  });

  const buttonBg = roles.primary;
  const buttonText = contrastText(buttonBg);

  const base = frontmatter && typeof frontmatter === "object" ? JSON.parse(JSON.stringify(frontmatter)) : {};

  const tokens = {
    ...base,
    version: base.version || "1.0",
    name: meta.name,
    description: base.description || firstDescription(markdown, meta.name),
    source: {
      type: "awesome-design-md",
      slug: meta.slug,
      url: meta.getdesign_url,
    },
    colors: Object.keys(base.colors || {}).length > 0 ? base.colors : colors,
    typography: Object.keys(base.typography || {}).length > 0 ? base.typography : {
      h1: { fontFamily: font, fontSize: "48px", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.04em" },
      h2: { fontFamily: font, fontSize: "36px", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.03em" },
      h3: { fontFamily: font, fontSize: "24px", fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.02em" },
      body: { fontFamily: font, fontSize: "16px", fontWeight: 400, lineHeight: 1.5, letterSpacing: "0em" },
      label: { fontFamily: mono, fontSize: "12px", fontWeight: 600, lineHeight: 1.25, letterSpacing: "0.08em" },
      mono: { fontFamily: mono, fontSize: "13px", fontWeight: 500, lineHeight: 1.45, letterSpacing: "0em" },
    },
    spacing: Object.keys(base.spacing || {}).length > 0 ? base.spacing : {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "40px",
    },
    rounded: Object.keys(base.rounded || {}).length > 0 ? base.rounded : {
      none: "0px",
      sm: `${Math.max(2, Math.round(radius * 0.5))}px`,
      md: `${radius}px`,
      lg: `${Math.max(radius + 4, 12)}px`,
      full: "9999px",
    },
  };

  tokens.preview_tokens = {
    button_primary_bg: buttonBg,
    button_primary_text: buttonText,
    button_primary_border: buttonBg,
    button_secondary_bg: "transparent",
    button_secondary_text: roles.primary,
    button_secondary_border: roles.border,
    button_tertiary_text: roles.accent,
    surface_bg: roles.surface,
    card_bg: roles.card,
    text: roles.text,
    text_muted: roles.muted,
    border: roles.border,
    accent: roles.accent,
    button_radius: `${radius}px`,
    card_radius: `${Math.max(radius + 4, 12)}px`,
    input_radius: `${radius}px`,
    ...(base.preview_tokens || {}),
  };

  return tokens;
}

function withFrontmatter(markdown, tokens) {
  const frontmatter = yaml.dump(tokens, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
  return `---\n${frontmatter}---\n\n${markdown.trim()}\n`;
}

function splitFrontmatter(markdown) {
  const trimmed = String(markdown || "").trimStart();
  if (!trimmed.startsWith("---")) {
    return { frontmatter: null, body: markdown };
  }

  const end = trimmed.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: null, body: markdown };
  }

  const raw = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 4).trimStart();
  try {
    return { frontmatter: yaml.load(raw), body };
  } catch {
    return { frontmatter: null, body: markdown };
  }
}

function extractPalette(markdown) {
  const matches = [...markdown.matchAll(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g)]
    .map((match) => normalizeHex(match[0]))
    .filter(Boolean);

  const counts = new Map();
  for (const hex of matches) counts.set(hex, (counts.get(hex) || 0) + 1);

  const ordered = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);

  const named = {};
  const namedMatches = markdown.matchAll(/\*\*([^*\n]+?)\*\*\s*\(`(#[0-9a-fA-F]{3,8})`\)/g);
  for (const match of namedMatches) {
    const key = slugKey(match[1]);
    const value = normalizeHex(match[2]);
    if (key && value && !named[key]) named[key] = value;
    if (Object.keys(named).length >= 10) break;
  }

  return {
    ordered,
    named,
  };
}

function assignColorRoles(palette) {
  const ordered = palette.ordered.length > 0 ? palette.ordered : ["#000000", "#ffffff"];
  const surface = findColor(ordered, isVeryLight) || "#ffffff";
  const text = findColor(ordered, isVeryDark) || "#111111";
  const muted = findColor(ordered, (hex) => isNeutral(hex) && !isVeryLight(hex) && !isVeryDark(hex)) || "#666666";
  const border = findColor(ordered, (hex) => isNeutral(hex) && isLight(hex) && hex !== surface) || "#e5e5e5";
  const accent = findColor(ordered, (hex) => !isNeutral(hex) && !isVeryLight(hex)) || text;
  const secondAccent = findColor(ordered, (hex) => !isNeutral(hex) && !isVeryLight(hex) && hex !== accent) || muted;
  const success = findColor(ordered, (hex) => hueFamily(hex) === "green") || accent;
  const error = findColor(ordered, (hex) => hueFamily(hex) === "red") || secondAccent;

  const primary = ordered.find((hex) => hex !== surface && !isVeryLight(hex)) || text;

  return {
    primary,
    secondary: secondAccent,
    tertiary: accent,
    neutral: muted,
    surface,
    card: surface,
    text,
    muted,
    border,
    accent,
    success,
    error,
  };
}

function extractPrimaryFont(markdown) {
  const primary = markdown.match(/\*\*Primary\*\*:\s*`([^`]+)`/i)?.[1];
  if (primary) return primary.replace(/^["']|["']$/g, "");
  const family = markdown.match(/(?:Font Family|Font):[^\n`]*`([^`]+)`/i)?.[1];
  if (family) return family.replace(/^["']|["']$/g, "");
  return "Inter, ui-sans-serif, system-ui, sans-serif";
}

function extractMonoFont(markdown) {
  const mono = markdown.match(/\*\*(?:Monospace|Mono)\*\*:\s*`([^`]+)`/i)?.[1];
  if (mono) return mono.replace(/^["']|["']$/g, "");
  return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
}

function extractRadius(markdown) {
  const radiusValues = [...markdown.matchAll(/Radius:\s*`?(\d+(?:\.\d+)?)px/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value >= 0 && value < 80);
  if (radiusValues.length === 0) return 8;
  const counts = new Map();
  for (const value of radiusValues) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function firstDescription(markdown, name) {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());
  const paragraph = lines.find((line) =>
    line &&
    !line.startsWith("#") &&
    !line.startsWith("-") &&
    !line.startsWith("|") &&
    !line.startsWith("**") &&
    !line.includes("`#") &&
    line.length > 80
  );
  return paragraph ? paragraph.replace(/\s+/g, " ").slice(0, 260) : `Design system inspired by ${name}.`;
}

function buildExtended(slug, meta) {
  return {
    schema_version: "1.0",
    source: {
      type: "awesome-design-md",
      slug,
      url: meta.getdesign_url,
    },
    components: {},
  };
}

function buildTelemetry(slug, meta) {
  return {
    url: meta.source_url,
    source_url: meta.source_url,
    provider: "awesome-design-md",
    getdesign_slug: slug,
    getdesign_url: meta.getdesign_url,
    generated_at: new Date().toISOString(),
  };
}

function buildQualityScore() {
  return {
    overall: 82,
    grade: "B",
    source: "imported-design-md",
    note: "Imported from curated DESIGN.md; not scored from live extraction evidence.",
    categories: {
      color_discipline: { score: 80, grade: "B", value: "curated markdown", ideal: "live evidence" },
      typography: { score: 80, grade: "B", value: "curated markdown", ideal: "font evidence" },
      tokenization: { score: 70, grade: "C", value: "heuristic frontmatter", ideal: "extracted tokens" },
      lint_compliance: { score: 80, grade: "B", value: "imported", ideal: "0E 0W" },
      accessibility: { score: 70, grade: "C", value: "not audited", ideal: "100% AA" },
    },
  };
}

function buildStyleFingerprint(tokens) {
  const theme = inferTheme(tokens);
  return {
    schema_version: "1.0",
    source: "imported-design-md",
    classification: {
      primary_archetype: theme === "dark" ? "dark-editorial" : "agent-ready",
      confidence_score: 0.55,
    },
    signals: {
      surface: tokens.preview_tokens.surface_bg,
      accent: tokens.preview_tokens.accent,
    },
  };
}

function buildAgentPrompt(tokens) {
  return `Use ${tokens.name} DESIGN.md as the visual source of truth. Preserve the declared colors, typography, radius, spacing, component rules, and Do's/Don'ts before writing UI. Prefer Tailwind and shadcn-compatible implementation while keeping the visual signature faithful.`;
}

function firstTypographicFamily(typography) {
  if (!typography || typeof typography !== "object") return "system-ui";
  for (const value of Object.values(typography)) {
    if (value && typeof value === "object" && value.fontFamily) return value.fontFamily;
  }
  return "system-ui";
}

function colorUsageMap(markdown) {
  const out = {};
  const matches = markdown.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g) || [];
  for (const match of matches) {
    const hex = normalizeHex(match);
    if (!hex) continue;
    out[hex] = (out[hex] || 0) + 1;
  }
  return out;
}

function inferTheme(tokens) {
  return relativeLuminance(tokens.preview_tokens.surface_bg) < 0.42 ? "dark" : "light";
}

function normalizeHex(value) {
  const raw = String(value || "").trim().toLowerCase();
  const match = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!match) return null;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) {
    hex = hex.split("").map((char) => `${char}${char}`).join("");
  }
  if (hex.length === 8) hex = hex.slice(0, 6);
  return `#${hex}`;
}

function slugKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_.]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item != null && item !== ""));
}

function findColor(colors, predicate) {
  return colors.find((hex) => predicate(hex)) || null;
}

function isVeryLight(hex) {
  return relativeLuminance(hex) > 0.88;
}

function isLight(hex) {
  return relativeLuminance(hex) > 0.68;
}

function isVeryDark(hex) {
  return relativeLuminance(hex) < 0.18;
}

function isNeutral(hex) {
  const { r, g, b } = rgb(hex);
  return Math.max(r, g, b) - Math.min(r, g, b) < 18;
}

function hueFamily(hex) {
  const { r, g, b } = rgb(hex);
  if (g > r * 1.12 && g > b * 1.12) return "green";
  if (r > g * 1.15 && r > b * 1.15) return "red";
  if (b > r * 1.15 && b > g * 1.15) return "blue";
  return "other";
}

function contrastText(bg) {
  return relativeLuminance(bg) > 0.52 ? "#000000" : "#ffffff";
}

function relativeLuminance(hex) {
  const { r, g, b } = rgb(hex);
  const srgb = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function rgb(hex) {
  const normalized = normalizeHex(hex) || "#000000";
  const raw = normalized.slice(1);
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
