// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const claudeCli = require("./providers/claude-cli.cjs");
const openrouter = require("./providers/openrouter.cjs");

// ── Per-provider model defaults + allow-list ────────────────────────
// Operator policy (2026-04-27):
//   - claude-cli (local): Opus permitted (operator's own quota)
//   - openrouter (API):    Haiku-only (cost discipline; 240× cheaper than Opus)
// Empirical: 1 Haiku run = $0.02 / score 86 vs 7 Opus runs avg $4.00 / score 88.
const PROVIDER_DEFAULTS = {
  "claude-cli":  { default_model: "claude-opus-4-7",          allowed: null /* any */ },
  "openrouter":  { default_model: "anthropic/claude-haiku-4-5", allowed: [/haiku/i] /* haiku family only */ },
};

// ── Provider auto-detection (AC1.5) ─────────────────────────────────
function detectProvider(options) {
  if (options && options.provider) return options.provider; // explicit override
  if (process.env.VERCEL === "1") return "openrouter";     // production
  if (process.env.OPENROUTER_API_KEY) return "openrouter"; // local opt-in
  return "claude-cli";                                     // local default
}

// ── Provider+Model policy gate (NEW) ────────────────────────────────
// Returns { ok: true, model } or throws Error with explanation.
// Used both by run.cjs at startup (early failure) and tests.
function validateProviderModel(provider, requestedModel) {
  const policy = PROVIDER_DEFAULTS[provider];
  if (!policy) {
    throw new Error(`Unknown provider: ${provider}. Supported: ${Object.keys(PROVIDER_DEFAULTS).join(", ")}.`);
  }
  // No explicit model → use provider default
  if (!requestedModel) {
    return { ok: true, model: policy.default_model, source: "provider-default" };
  }
  // Explicit model → must pass allow-list (if any)
  if (policy.allowed) {
    const passes = policy.allowed.some(pattern => pattern.test(requestedModel));
    if (!passes) {
      throw new Error(
        `Provider '${provider}' policy rejects model '${requestedModel}'.\n` +
        `  Allowed pattern(s): ${policy.allowed.map(p => p.source).join(", ")}.\n` +
        `  Reason: cost discipline — OpenRouter is restricted to Haiku-class models.\n` +
        `  Fix: switch to --provider claude-cli for Opus access, or pick a Haiku model.`
      );
    }
  }
  return { ok: true, model: requestedModel, source: "explicit" };
}

// ── Main dispatcher (AC1.1) ──────────────────────────────────────────
// options: { provider?, model?, maxTurns?, maxTokens?, cwd?, designMdPath? }
// Returns: { status, stdout, stderr, usage?, finishReason? }
async function invokeLlm(promptText, options = {}) {
  const provider = detectProvider(options);
  const isOverride = options && options.provider;

  // Apply provider-specific model policy (NEW)
  const policyResult = validateProviderModel(provider, options.model);
  const effectiveOptions = { ...options, model: policyResult.model };

  console.log(`[llm] provider=${provider} (${isOverride ? "--provider override" : "auto-detected"}) · model=${policyResult.model} (${policyResult.source})`);

  if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("[!] OpenRouter selected but OPENROUTER_API_KEY not set. Set it in .env.local or shell, or use --provider claude-cli.");
      process.exit(6);
    }
    return openrouter.invoke(promptText, effectiveOptions);
  }

  // claude-cli
  return claudeCli.invoke(promptText, effectiveOptions);
}

// ── Legacy invokeClaude — preserved for test compatibility ───────────
// Callers in run.cjs have been migrated to invokeLlm. This shim allows
// llm.test.cjs to continue requiring { invokeClaude } without changes.
function invokeClaude(promptText, cwd, { maxTurns = 30 } = {}) {
  const result = claudeCli.invoke(promptText, { maxTurns, cwd });
  return result;
}

// ── Agent prompt builder ─────────────────────────────────────────────
function buildAgentPrompt({ url, designMd, tokens, pageCopy, brandName }) {
  void designMd;
  const colors = (tokens && tokens.colors) || {};
  const typo = (tokens && tokens.typography) || {};
  const rounded = (tokens && tokens.rounded) || {};
  const previewTokens = (tokens && tokens.preview_tokens) || {};

  const primary = previewTokens.button_primary_bg || colors.primary || colors.brand || "#000000";
  const primaryText = previewTokens.button_primary_text || colors.surface || "#ffffff";
  const surface = previewTokens.surface_bg || colors.surface || colors.background || "#ffffff";
  const cardBg = previewTokens.card_bg || colors.card || surface;
  const text = previewTokens.text || colors.text || "#111111";
  const textMuted = previewTokens.text_muted || colors["text-muted"] || colors["text-secondary"] || "#666666";
  const border = previewTokens.border || colors.border || "#e5e5e5";
  const accent = previewTokens.accent || colors.accent || primary;
  const buttonRadius = previewTokens.button_radius || rounded.md || rounded.main || "8px";
  const cardRadius = previewTokens.card_radius || rounded.lg || rounded.large || "16px";
  const inputRadius = previewTokens.input_radius || rounded.sm || buttonRadius;
  const secondaryBg = previewTokens.button_secondary_bg || colors.secondary || "transparent";
  const secondaryText = previewTokens.button_secondary_text || text;
  const secondaryBorder = previewTokens.button_secondary_border || border;
  const tertiaryText = previewTokens.button_tertiary_text || accent;

  const firstFam = (s) => String(s || "").split(",")[0].trim().replace(/['"]/g, "");
  const headingFont = firstFam(typo.h1?.fontFamily || typo.display?.fontFamily) || "system-ui";
  const bodyFont = firstFam(typo["body-md"]?.fontFamily || typo.body?.fontFamily) || "system-ui";
  const monoFont = firstFam(typo.mono?.fontFamily) || "ui-monospace";

  const heading = pageCopy?.heading || `${brandName || "Brand"} component`;
  const safeBrand = brandName || (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "the brand"; } })();

  return `# Component generation brief — on-brand for ${safeBrand}

You are a senior frontend engineer building a React component for ${safeBrand}.
Your task: generate clean, accessible TSX (React + Tailwind CSS, shadcn/ui patterns)
that respects the design system below.

## Hard token rules (DO NOT deviate)

- Primary CTA fill:        ${primary}
- Primary CTA text:        ${primaryText}
- Page surface:            ${surface}
- Card / elevated surface: ${cardBg}
- Body text:               ${text}
- Muted text:              ${textMuted}
- Hairline border:         ${border}
- Brand accent:            ${accent}
- Button border-radius:    ${buttonRadius}
- Card border-radius:      ${cardRadius}
- Input border-radius:     ${inputRadius}

## Typography

- Headings (h1-h3): "${headingFont}", weight ${typo.h1?.fontWeight || 700}, letter-spacing ${typo.h1?.letterSpacing || "normal"}
- Body:             "${bodyFont}", weight ${typo["body-md"]?.fontWeight || 400}, line-height ${typo["body-md"]?.lineHeight || 1.5}
- Mono / labels:    "${monoFont}"

## Component rules

- Primary buttons use ${primary} background, ${primaryText} text, ${buttonRadius} radius.
- Secondary buttons use ${secondaryBg} background, ${secondaryText} text, ${secondaryBorder} border.
- Tertiary/link actions use ${tertiaryText} text with no filled surface.
- Cards use ${cardBg} background, ${border} border, ${cardRadius} radius.
- Inputs use ${surface} background, ${border} border, ${inputRadius} radius.
- Use ${textMuted} only for helper text, metadata, placeholders, and secondary labels.

## Voice / sample copy

Heading sample: "${heading.slice(0, 80)}"
${pageCopy?.body ? `Body sample: "${pageCopy.body.slice(0, 140)}"` : ""}

## What to build

[REPLACE THIS LINE WITH YOUR REQUEST — e.g. "a pricing card with three tiers" or "a hero section with primary CTA and secondary outline button"]

## Constraints

- Use ONLY the hex values listed above. Do not invent new colors.
- Use the listed font families. If they are not loaded, fall back to system-ui.
- Apply the listed border-radius values verbatim — buttons get \`button_radius\`, cards get \`card_radius\`.
- Component must be accessible (semantic HTML, focusable, contrast-compliant).
- Output a single TSX file. Tailwind utility classes preferred over inline styles.
- No external dependencies beyond shadcn/ui, the registered icon library (default lucide-react; per archetype.brand_driven.icons), and clsx.

---

Generate the component now.`;
}

module.exports = {
  invokeLlm,
  invokeClaude,
  buildAgentPrompt,
  detectProvider,
  validateProviderModel,
  PROVIDER_DEFAULTS,
};
