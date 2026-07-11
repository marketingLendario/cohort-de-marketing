// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  detectTokens, detectCssVars, detectFontFaces, detectStack,
  classifyStyle,
  truncateCssForLlm,
  summarizeStackForPrompt,
  detectShadows, detectMotion, detectBreakpoints, detectDarkMode,
  detectComponentProperties, parseSelectorVariantState, KNOWN_COMPONENTS, KNOWN_STATES,
  buildUsageGraph, resolveCssVar,
  stripMarkdownInline, extractPageCopy,
  STACK_SUPPRESSIONS,
} = require("./extractors.cjs");

test("detectTokens captures hex colors", () => {
  const css = "body { color: #ff0000; background: #00ff00; } a { color: rgb(0, 0, 255); }";
  const t = detectTokens(css);
  assert.ok(t.colors.hex.includes("#ff0000"));
  assert.ok(t.colors.hex.includes("#00ff00"));
  assert.equal(t.colors.rgb.length, 1);
});

test("detectCssVars captures --vars with selector scope", () => {
  const css = ":root { --primary: #ff0000; --bg: var(--primary); } .dark { --primary: #00ff00; }";
  const vars = detectCssVars(css);
  const root = vars.find(v => v.selector === ":root" && v.name === "--primary");
  assert.equal(root.value, "#ff0000");
  assert.equal(root.is_alias, false);
  const alias = vars.find(v => v.name === "--bg");
  assert.equal(alias.is_alias, true);
});

test("detectFontFaces parses family + weight + urls", () => {
  const css = `@font-face { font-family: "Inter"; font-weight: 400; font-style: normal; src: url("/inter.woff2") format("woff2"), url("/inter.woff") format("woff"); }`;
  const faces = detectFontFaces(css);
  assert.equal(faces.length, 1);
  assert.equal(faces[0].family, "Inter");
  assert.equal(faces[0].weight, "400");
  assert.deepEqual(faces[0].src_urls, ["/inter.woff2", "/inter.woff"]);
  assert.deepEqual(faces[0].src_formats, ["woff2", "woff"]);
});

test("detectStack matches Next.js + Tailwind", () => {
  const html = `<html><body><div id="__next">x</div><script src="/_next/static/chunks/x.js"></script></body></html>`;
  const css = "/* tailwindcss v4.2.1 */";
  const stack = detectStack(html, css, { external: [] });
  const names = stack.map(s => s.name);
  assert.ok(names.some(n => n.startsWith("Next.js")));
  assert.ok(names.some(n => n.startsWith("Tailwind CSS")));
});

test("detectStack matches Webflow + GSAP", () => {
  const html = `<html><body data-wf-page="abc"><script src="//gsap.com/gsap.js"></script></body></html>`;
  const stack = detectStack(html, "", { external: [] });
  const names = stack.map(s => s.name);
  assert.ok(names.includes("Webflow"));
  assert.ok(names.includes("GSAP"));
});

test("detectShadows aggregates by uniqueness + count", () => {
  const css = `.a { box-shadow: 0 1px 2px #0001; } .b { box-shadow: 0 1px 2px #0001; } .c { box-shadow: 0 4px 8px #0002; }`;
  const shadows = detectShadows(css);
  assert.equal(shadows.length, 2);
  assert.equal(shadows[0].count, 2);
  assert.match(shadows[0].value, /0 1px 2px/);
});

test("detectMotion finds durations + easings + keyframes", () => {
  const css = `
    .a { transition: opacity 200ms ease-out; }
    .b { animation-duration: 300ms; }
    @keyframes spin { from {} to {} }
    .c { transition: 200ms cubic-bezier(0.4, 0, 0.2, 1); }
  `;
  const m = detectMotion(css);
  assert.ok(m.durations.find(d => d.value === "200ms"));
  assert.ok(m.easings.length > 0);
  assert.ok(m.keyframes.includes("spin"));
});

test("detectBreakpoints aggregates media query widths", () => {
  const css = `@media (min-width: 768px) {} @media (max-width: 1024px) {} @media (min-width: 768px) {}`;
  const bp = detectBreakpoints(css);
  assert.equal(bp.find(b => b.value === "768px").count, 2);
});

test("detectDarkMode finds prefers-color-scheme + .dark class", () => {
  const css = `@media (prefers-color-scheme: dark) {} .dark .foo {} .dark .bar {} .dark .baz {} .dark .qux {} .dark .quux {} .dark .six {}`;
  const dm = detectDarkMode(css, []);
  assert.equal(dm.has_dark_mode, true);
  assert.ok(dm.signals.length >= 1);
});

test("detectComponentProperties surfaces .btn { border-radius: 0 } override", () => {
  const css = `:root { --radius-md: 8px; } .btn { border-radius: 0; padding: 8px 16px; } .btn { border-radius: 0; }`;
  const cp = detectComponentProperties(css);
  assert.equal(cp.summary.button["border-radius"].most_common, "0");
});

test("buildUsageGraph counts declarations vs references", () => {
  const css = ":root { --primary: red; } .a { color: var(--primary); } .b { color: var(--primary); }";
  const vars = detectCssVars(css);
  const graph = buildUsageGraph(css, vars);
  const primary = graph.find(g => g.name === "--primary");
  assert.equal(primary.declarations, 1);
  assert.equal(primary.references, 2);
});

test("resolveCssVar follows alias chain", () => {
  const vars = [
    { name: "--primary", value: "#ff0000", selector: ":root", is_alias: false },
    { name: "--bg", value: "var(--primary)", selector: ":root", is_alias: true },
    { name: "--surface", value: "var(--bg)", selector: ":root", is_alias: true },
  ];
  assert.equal(resolveCssVar(vars, "--surface"), "#ff0000");
  assert.equal(resolveCssVar(vars, "--missing"), null);
});

test("resolveCssVar handles cycles", () => {
  const vars = [
    { name: "--a", value: "var(--b)", selector: ":root", is_alias: true },
    { name: "--b", value: "var(--a)", selector: ":root", is_alias: true },
  ];
  assert.equal(resolveCssVar(vars, "--a"), null);
});

test("stripMarkdownInline removes link syntax", () => {
  assert.equal(stripMarkdownInline("[click here](url)"), "click here");
  assert.equal(stripMarkdownInline("**bold** and *italic*"), "bold and italic");
  assert.equal(stripMarkdownInline("`code` text"), "code text");
});

test("extractPageCopy returns clean heading + body", () => {
  const md = `# Hello [world](https://x.com)

This is some text inside of a div block that should be picked as the body specimen.`;
  const c = extractPageCopy(md);
  assert.equal(c.heading, "Hello world");
  assert.match(c.body, /text inside of a div block/);
});

// ── S2: Confidence ladder ────────────────────────────────────────────

test("S2: Webflow via data-wf-page is confidence high", () => {
  const html = `<html><body data-wf-page="abc123"></body></html>`;
  const stack = detectStack(html, "", { external: [] });
  const webflow = stack.find(s => s.name === "Webflow");
  assert.ok(webflow, "Webflow should be detected");
  assert.equal(webflow.confidence, "high");
});

test("S2: Tailwind via --tw-* vars without banner is confidence medium", () => {
  const css = `.a { --tw-translate-x: 0; }`;
  const stack = detectStack("", css, { external: [] });
  const tw = stack.find(s => s.name === "Tailwind CSS");
  assert.ok(tw, "Tailwind should be detected");
  assert.equal(tw.confidence, "medium");
});

test("S2: Tailwind via explicit banner is confidence high", () => {
  const css = `/* tailwindcss v3.4.0 */`;
  const stack = detectStack("", css, { external: [] });
  const tw = stack.find(s => s.name && s.name.startsWith("Tailwind CSS"));
  assert.ok(tw, "Tailwind with banner should be detected");
  assert.equal(tw.confidence, "high");
});

test("S2: shadcn via --popover-foreground is confidence high", () => {
  const css = `:root { --popover-foreground: 222 84% 5%; }`;
  const stack = detectStack("", css, { external: [] });
  const shadcn = stack.find(s => s.name === "shadcn/ui");
  assert.ok(shadcn, "shadcn/ui should be detected");
  assert.equal(shadcn.confidence, "high");
});

// ── S3: Cross-signal suppression ─────────────────────────────────────

test("S3: Next.js suppresses React — suppressed_by set", () => {
  const html = `<html><body><div id="__next"><div data-reactroot></div><script src="/_next/static/x.js"></script></div></body></html>`;
  const stack = detectStack(html, "", { external: [] });
  const react = stack.find(s => s.name === "React");
  const nextjs = stack.find(s => s.name === "Next.js");
  assert.ok(nextjs, "Next.js should be detected");
  assert.ok(react, "React should still be in matches");
  assert.equal(react.suppressed_by, "Next.js");
});

test("S3: Astro suppresses React and Vue when both present", () => {
  const html = `<html><body><astro-island></astro-island><div data-reactroot></div><div data-vue-meta="{}"></div><script src="/_astro/x.js"></script></body></html>`;
  const stack = detectStack(html, "", { external: [] });
  const react = stack.find(s => s.name === "React");
  const vue = stack.find(s => s.name === "Vue");
  const astro = stack.find(s => s.name === "Astro");
  assert.ok(astro, "Astro should be detected");
  if (react) assert.equal(react.suppressed_by, "Astro");
  if (vue) assert.equal(vue.suppressed_by, "Astro");
});

test("S3: SvelteKit alone — no suppression applied", () => {
  const html = `<html><body><div data-svelte-kit="yes"></div></body></html>`;
  const stack = detectStack(html, "", { external: [] });
  const sveltekit = stack.find(s => s.name === "SvelteKit");
  // SvelteKit detected but no Svelte separately → nothing to suppress
  if (sveltekit) assert.equal(sveltekit.suppressed_by, undefined);
});

test("S3: STACK_SUPPRESSIONS constant exists with expected keys", () => {
  assert.ok(typeof STACK_SUPPRESSIONS === "object");
  assert.ok(Array.isArray(STACK_SUPPRESSIONS["Next.js"]));
  assert.ok(STACK_SUPPRESSIONS["Next.js"].includes("React"));
  assert.ok(STACK_SUPPRESSIONS["Astro"].includes("React"));
  assert.ok(STACK_SUPPRESSIONS["Astro"].includes("Vue"));
});

// ── S6: HTTP headers signals ──────────────────────────────────────────

test("S6: x-vercel-id header detects Vercel with confidence high", () => {
  const stack = detectStack("", "", { external: [] }, { "x-vercel-id": "iad1::abc-123" });
  const vercel = stack.find(s => s.name === "Vercel" && s.kind === "hosting");
  assert.ok(vercel, "Vercel should be detected from header");
  assert.equal(vercel.confidence, "high");
});

test("S6: cf-ray header detects Cloudflare with confidence high", () => {
  const stack = detectStack("", "", { external: [] }, { "cf-ray": "8abc123-IAD" });
  const cf = stack.find(s => s.name === "Cloudflare" && s.kind === "cdn");
  assert.ok(cf, "Cloudflare should be detected from cf-ray");
  assert.equal(cf.confidence, "high");
});

test("S6: x-shopify-stage header detects Shopify with confidence high", () => {
  const stack = detectStack("", "", { external: [] }, { "x-shopify-stage": "production" });
  const shopify = stack.find(s => s.name === "Shopify" && s.kind === "ecommerce");
  assert.ok(shopify, "Shopify should be detected from header");
  assert.equal(shopify.confidence, "high");
});

test("S6: Cloudflare from header dedups with CSS URL detection — only one entry per (name, kind)", () => {
  const headers = { "cf-ray": "8abc123-IAD" };
  const cssMeta = { external: ["https://cdnjs.cloudflare.com/x.css"] };
  const stack = detectStack("", "", cssMeta, headers);
  const cfMatches = stack.filter(s => s.name === "Cloudflare" && s.kind === "cdn");
  assert.equal(cfMatches.length, 1, "Cloudflare cdn should appear only once (header wins)");
});

test("S6: detectStack backward compat — 3 args still works (headers defaults to {})", () => {
  const html = `<html><body data-wf-page="x"></body></html>`;
  // Should not throw with 3 args
  const stack = detectStack(html, "", { external: [] });
  assert.ok(Array.isArray(stack));
});

// ── S4: summarizeStackForPrompt ───────────────────────────────────────

test("S4: summarizeStackForPrompt filters suppressed entries", () => {
  const html = `<html><body><div id="__next"><div data-reactroot></div><script src="/_next/static/x.js"></script></div></body></html>`;
  const stack = detectStack(html, "", { external: [] });
  const summary = summarizeStackForPrompt(stack);
  const reactInSummary = summary.find(s => s.name === "React");
  assert.equal(reactInSummary, undefined, "React suppressed by Next.js should not appear in summary");
});

test("S4: summarizeStackForPrompt orders high > medium > low", () => {
  const stack = [
    { name: "B", kind: "x", confidence: "medium", evidence: "e" },
    { name: "A", kind: "x", confidence: "high", evidence: "e" },
    { name: "C", kind: "x", confidence: "low", evidence: "e" },
  ];
  const summary = summarizeStackForPrompt(stack);
  assert.equal(summary[0].name, "A");
  assert.equal(summary[1].name, "B");
  assert.equal(summary[2].name, "C");
});

test("S4: summarizeStackForPrompt limits to top 8", () => {
  const stack = Array.from({ length: 12 }, (_, i) => ({
    name: `Tech${i}`, kind: "x", confidence: "medium", evidence: "e",
  }));
  const summary = summarizeStackForPrompt(stack);
  assert.equal(summary.length, 8);
});

test("S4: summarizeStackForPrompt emits compact objects without evidence or suppressed_by", () => {
  const stack = [{ name: "Next.js", kind: "framework", confidence: "high", evidence: "long evidence string here" }];
  const summary = summarizeStackForPrompt(stack);
  assert.equal(summary.length, 1);
  assert.equal(summary[0].name, "Next.js");
  assert.equal(summary[0].kind, "framework");
  assert.equal(summary[0].confidence, "high");
  assert.equal(summary[0].evidence, undefined, "evidence should not be in summary");
  assert.equal(summary[0].suppressed_by, undefined, "suppressed_by should not be in summary");
});

// ── classifyStyle (visual archetype classification) ──────────────────
test("classifyStyle returns shape per output_contract", () => {
  const result = classifyStyle({}, [], { declarations: [] }, [], "");
  assert.ok(result.extracted_signals, "has extracted_signals");
  assert.ok(result.classification, "has classification");
  assert.ok(result.archetype_distance, "has archetype_distance");
  assert.equal(typeof result.classification.confidence_score, "number");
  // Empty input → no archetype reaches threshold
  assert.equal(result.classification.primary_archetype, null);
});

test("classifyStyle detects glass surface only with MULTIPLE backdrop-filter (threshold)", () => {
  // Single isolated backdrop-filter is common in modern sites (header, modal) and is NOT glass
  const cssSingle = ".header { backdrop-filter: blur(8px); background: rgba(0,0,0,0.5); }";
  const single = classifyStyle({}, [], {}, [], cssSingle);
  assert.notEqual(single.extracted_signals.surface_treatment, "glass",
    "Single backdrop-filter should NOT trigger glass (false positive in batch 2026-04-27)");

  // Apple-glass signature: ≥3 backdrop-filter blocks
  const cssMany = `.panel-1 { backdrop-filter: blur(20px); }
                   .panel-2 { backdrop-filter: blur(20px); }
                   .panel-3 { backdrop-filter: blur(15px); background: rgba(255,255,255,0.7); }`;
  const many = classifyStyle({}, [], {}, [], cssMany);
  assert.equal(many.extracted_signals.surface_treatment, "glass");
});

test("classifyStyle: glass also triggers with 1 blur + many translucent bgs", () => {
  // ≥1 backdrop + ≥5 translucent bgs = apple-glass companion pattern
  const css = `.modal { backdrop-filter: blur(20px); }
               .a { background: rgba(255,255,255,0.6); }
               .b { background: rgba(0,0,0,0.4); }
               .c { background-color: rgba(255,255,255,0.3); }
               .d { background: hsla(0, 0%, 0%, 0.5); }
               .e { background: rgba(20,20,20,0.7); }`;
  const result = classifyStyle({}, [], {}, [], css);
  assert.equal(result.extracted_signals.surface_treatment, "glass");
});

test("classifyStyle detects gradient only with MULTIPLE gradient declarations OR full-surface", () => {
  // Single hero gradient is universal in modern marketing — NOT enough
  const cssSingle = ".hero { background: linear-gradient(135deg, #00d4ff 0%, #ff00ff 100%); }";
  const single = classifyStyle({}, [], {}, [], cssSingle);
  assert.notEqual(single.extracted_signals.surface_treatment, "gradient",
    "Single gradient should NOT trigger gradient archetype");

  // ≥3 gradient declarations
  const cssMany = `.hero { background: linear-gradient(135deg, #00d4ff, #ff00ff); }
                   .card { background: linear-gradient(180deg, #f00, #00f); }
                   .button { background: radial-gradient(circle, #abc, #def); }`;
  const many = classifyStyle({}, [], {}, [], cssMany);
  assert.equal(many.extracted_signals.surface_treatment, "gradient");

  // OR full-surface gradient (body/html/main)
  const cssFull = "body { background: linear-gradient(180deg, #fff, #000); }";
  const full = classifyStyle({}, [], {}, [], cssFull);
  assert.equal(full.extracted_signals.surface_treatment, "gradient");
});

test("classifyStyle scores shadcn-neutral from monochrome oklch tokens", () => {
  const tokensDetected = {
    colors: {
      hex: ["#fafafa", "#18181b", "#27272a"],
      rgb: [],
      hsl: [],
    },
    radii: ["0.625rem", "0.5rem", "0.75rem"],
    spacing: ["1rem", "0.5rem", "1.5rem", "2rem"],
    fontWeights: ["400", "500", "600", "700"],
  };
  const result = classifyStyle(tokensDetected, [], { declarations: [] }, [], "");
  assert.ok(
    result.classification.primary_archetype === "shadcn-neutral" ||
    result.classification.secondary_archetype === "shadcn-neutral",
    `Expected shadcn-neutral in primary/secondary; got primary=${result.classification.primary_archetype} secondary=${result.classification.secondary_archetype}`
  );
});

test("classifyStyle scores carbon-enterprise from saturated blue + sharp corners", () => {
  const tokensDetected = {
    colors: {
      hex: ["#0f62fe", "#161616", "#525252", "#0353e9"],
      rgb: [],
      hsl: [],
    },
    radii: ["0", "2px", "4px"],
    spacing: ["8px", "16px", "24px", "32px", "40px", "48px", "64px", "80px", "96px", "112px"],
    fontWeights: ["400", "600"],
  };
  const result = classifyStyle(tokensDetected, [], { declarations: [] }, [], "");
  // Carbon-enterprise should rank in top 3
  const ranked = Object.entries(result.archetype_distance).sort((a, b) => b[1] - a[1]);
  const top3 = ranked.slice(0, 3).map(([n]) => n);
  assert.ok(
    top3.includes("carbon-enterprise"),
    `Expected carbon-enterprise in top 3; got ${top3.join(", ")}`
  );
});

// ── truncateCssForLlm (Sprint 4 — cost discipline) ──────────────────
test("truncateCssForLlm: small CSS untouched", () => {
  const css = ":root { --x: red; } .btn { color: var(--x); }";
  const r = truncateCssForLlm(css);
  assert.equal(r.dropped, false);
  assert.equal(r.truncated, css);
});

test("truncateCssForLlm: large CSS truncated to budget", () => {
  const blocks = [];
  blocks.push(":root { --primary: #f00; --secondary: #00f; }");
  blocks.push(".dark { --primary: #800; }");
  for (let i = 0; i < 1000; i++) {
    blocks.push(`.utility-${i} { padding: ${i % 16}px; margin: ${i % 8}px; transform: rotate(${i}deg); transition: all 0.2s; }`);
  }
  const css = blocks.join("\n");
  assert.ok(css.length > 50000);
  const r = truncateCssForLlm(css, { budgetBytes: 10 * 1024 });
  assert.equal(r.dropped, true);
  assert.ok(r.kept_bytes < r.original_bytes);
  assert.ok(r.truncated.includes(":root"), "kept :root block");
  assert.ok(r.truncated.includes(".dark"), "kept dark mode block");
});

test("truncateCssForLlm: empty input safe", () => {
  const r = truncateCssForLlm("");
  assert.equal(r.dropped, false);
  assert.equal(r.truncated, "");
});

test("truncateCssForLlm: prioritizes :root over utilities", () => {
  const utilities = Array.from({ length: 500 }, (_, i) =>
    `.util-${i} { padding: ${i}px; margin: ${i}px; }`
  ).join("\n");
  const css = utilities + "\n:root { --critical: #f00; --secondary: #0f0; }";
  const r = truncateCssForLlm(css, { budgetBytes: 5 * 1024 });
  assert.equal(r.dropped, true);
  assert.ok(r.truncated.includes(":root"), "kept :root despite ordering");
  assert.ok(r.truncated.includes("--critical"), "kept critical var");
});

// ── S12: Variant Matrix Extraction ──────────────────────────────────

test("parseSelectorVariantState: .btn → default state, no variant", () => {
  const r = parseSelectorVariantState(".btn");
  assert.equal(r.component, "button");
  assert.equal(r.variant, null);
  assert.equal(r.state, "default");
});

test("parseSelectorVariantState: .btn:hover → hover state", () => {
  const r = parseSelectorVariantState(".btn:hover");
  assert.equal(r.component, "button");
  assert.equal(r.variant, null);
  assert.equal(r.state, "hover");
});

test("parseSelectorVariantState: .btn:focus-visible → focus-visible state", () => {
  const r = parseSelectorVariantState(".btn:focus-visible");
  assert.equal(r.component, "button");
  assert.equal(r.variant, null);
  assert.equal(r.state, "focus-visible");
});

test("parseSelectorVariantState: .btn:active → active state", () => {
  const r = parseSelectorVariantState(".btn:active");
  assert.equal(r.component, "button");
  assert.equal(r.state, "active");
});

test("parseSelectorVariantState: .btn:disabled → disabled state", () => {
  const r = parseSelectorVariantState(".btn:disabled");
  assert.equal(r.component, "button");
  assert.equal(r.state, "disabled");
});

test("parseSelectorVariantState: .btn--primary → primary variant, default state", () => {
  const r = parseSelectorVariantState(".btn--primary");
  assert.equal(r.component, "button");
  assert.equal(r.variant, "primary");
  assert.equal(r.state, "default");
});

test("parseSelectorVariantState: .btn--ghost:hover → ghost variant + hover state", () => {
  const r = parseSelectorVariantState(".btn--ghost:hover");
  assert.equal(r.component, "button");
  assert.equal(r.variant, "ghost");
  assert.equal(r.state, "hover");
});

test("parseSelectorVariantState: .btn[data-variant=\"ghost\"] → ghost variant", () => {
  const r = parseSelectorVariantState('.btn[data-variant="ghost"]');
  assert.equal(r.component, "button");
  assert.equal(r.variant, "ghost");
  assert.equal(r.state, "default");
});

test("parseSelectorVariantState: unknown selector → component null", () => {
  const r = parseSelectorVariantState(".unknown-widget");
  assert.equal(r.component, null);
});

test("KNOWN_COMPONENTS and KNOWN_STATES exported with expected values", () => {
  assert.ok(Array.isArray(KNOWN_COMPONENTS));
  assert.ok(KNOWN_COMPONENTS.includes("button"));
  assert.ok(KNOWN_COMPONENTS.includes("card"));
  assert.ok(KNOWN_COMPONENTS.includes("input"));
  assert.ok(KNOWN_COMPONENTS.includes("badge"));
  assert.ok(KNOWN_COMPONENTS.includes("link"));
  assert.ok(KNOWN_COMPONENTS.includes("nav"));
  assert.ok(KNOWN_COMPONENTS.includes("tab"));
  assert.ok(Array.isArray(KNOWN_STATES));
  assert.ok(KNOWN_STATES.includes("default"));
  assert.ok(KNOWN_STATES.includes("hover"));
  assert.ok(KNOWN_STATES.includes("focus"));
  assert.ok(KNOWN_STATES.includes("focus-visible"));
  assert.ok(KNOWN_STATES.includes("disabled"));
});

test("detectComponentProperties: button states schema from sample CSS", () => {
  const css = `
    .btn { border-radius: 4px; padding: 8px 16px; }
    .btn:hover { background-color: #0066cc; }
    .btn:focus-visible { color: #fff; }
    .btn:disabled { background-color: #ccc; color: #999; }
  `;
  const cp = detectComponentProperties(css);
  const btn = cp.summary.button;
  assert.ok(btn, "button component detected");
  assert.ok(btn.states, "states object exists");
  assert.ok(btn.states.default, "default state exists");
  assert.equal(btn.states.default["border-radius"].most_common, "4px");
  assert.ok(btn.states.hover, "hover state exists");
  assert.equal(btn.states.hover["background-color"].most_common, "#0066cc");
  assert.ok(btn.states["focus-visible"], "focus-visible state exists");
  assert.ok(btn.states.disabled, "disabled state exists");
  assert.equal(btn.states.disabled["background-color"].most_common, "#ccc");
});

test("detectComponentProperties: BEM variants populated", () => {
  const css = `
    .btn { border-radius: 0; padding: 12px 24px; }
    .btn--primary { background-color: #007bff; color: #fff; }
    .btn--ghost { background-color: transparent; border-width: 1px; }
  `;
  const cp = detectComponentProperties(css);
  const btn = cp.summary.button;
  assert.ok(btn.variants, "variants object exists");
  assert.ok(btn.variants.primary, "primary variant exists");
  assert.equal(btn.variants.primary["background-color"].most_common, "#007bff");
  assert.ok(btn.variants.ghost, "ghost variant exists");
  assert.equal(btn.variants.ghost["background-color"].most_common, "transparent");
});

test("detectComponentProperties: backward compat — legacy top-level keys equivalent to states.default", () => {
  const css = `.btn { border-radius: 8px; padding: 10px 20px; font-weight: 600; }`;
  const cp = detectComponentProperties(css);
  const btn = cp.summary.button;
  assert.equal(btn["border-radius"].most_common, btn.states.default["border-radius"].most_common);
  assert.equal(btn["padding"].most_common, btn.states.default["padding"].most_common);
  assert.equal(btn["font-weight"].most_common, btn.states.default["font-weight"].most_common);
});

test("detectComponentProperties: simple component with no interactives has only default state", () => {
  const css = `.card { border-radius: 12px; padding: 24px; }`;
  const cp = detectComponentProperties(css);
  const card = cp.summary.card;
  assert.ok(card, "card detected");
  assert.ok(card.states, "states exists");
  assert.ok(card.states.default, "default state exists");
  assert.deepEqual(Object.keys(card.states), ["default"], "only default state present");
  assert.deepEqual(card.variants, {}, "no variants");
});

// ── S12 CONCERN-001: PROPS whitelist expansion ───────────────────────

test("detectComponentProperties: disabled state captures opacity + cursor (CONCERN-001)", () => {
  const css = `.btn { border-radius: 0; } .btn:disabled { opacity: 0.5; cursor: not-allowed; }`;
  const cp = detectComponentProperties(css);
  const disabled = cp.summary.button?.states?.disabled;
  assert.ok(disabled, "disabled state exists");
  assert.equal(disabled.opacity.most_common, "0.5");
  assert.equal(disabled.cursor.most_common, "not-allowed");
});

test("detectComponentProperties: focus-visible state captures outline (CONCERN-001)", () => {
  const css = `.btn { padding: 8px; } .btn:focus-visible { outline: 2px solid blue; }`;
  const cp = detectComponentProperties(css);
  const focusVisible = cp.summary.button?.states?.["focus-visible"];
  assert.ok(focusVisible, "focus-visible state exists");
  assert.equal(focusVisible.outline.most_common, "2px solid blue");
});

test("detectComponentProperties: hover state captures box-shadow + transform (CONCERN-001)", () => {
  const css = `.btn { padding: 8px; } .btn:hover { box-shadow: 0 4px 8px rgba(0,0,0,.1); transform: translateY(-2px); }`;
  const cp = detectComponentProperties(css);
  const hover = cp.summary.button?.states?.hover;
  assert.ok(hover, "hover state exists");
  assert.equal(hover["box-shadow"].most_common, "0 4px 8px rgba(0,0,0,.1)");
  assert.equal(hover.transform.most_common, "translateY(-2px)");
});
