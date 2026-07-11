// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

// Pricing table — updated 2026-04
// Source: https://anthropic.com/pricing (consulted 2026-04-27)
// Claude CLI model IDs (short form)
const MODEL_PRICING = {
  "claude-haiku-4-5": {
    input: 1.0,        // $/MTok
    output: 5.0,
    cache_write: 1.25,
    cache_read: 0.10,
  },
  "claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    cache_write: 3.75,
    cache_read: 0.30,
  },
  "claude-opus-4-7": {
    input: 15.0,
    output: 75.0,
    cache_write: 18.75,
    cache_read: 1.50,
  },
  // OpenRouter format model IDs (AC3.2)
  "anthropic/claude-haiku-4-5": {
    input: 1.0,
    output: 5.0,
    cache_write: 1.25,
    cache_read: 0.10,
  },
  "anthropic/claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    cache_write: 3.75,
    cache_read: 0.30,
  },
  "anthropic/claude-opus-4-7": {
    input: 15.0,
    output: 75.0,
    cache_write: 18.75,
    cache_read: 1.50,
  },
};

const FALLBACK_MODEL = "claude-opus-4-7";

// Required sections — matches the 9-section numbered format emitted by
// data/url-extract-prompt.txt (Markdown Body — 9 Numbered Sections).
// Sections 6–9 (Depth, Dos/Donts, Responsive, Agent Prompt) are emitted but
// not enforced as required.
const REQUIRED_SECTIONS = [
  /^## 1\. Visual Theme/m,
  /^## 2\. Color Palette/m,
  /^## 3\. Typography Rules/m,
  /^## 4\. Components/m,
  /^## 5\. Layout Principles/m,
];

// ── Phase timer ─────────────────────────────────────────────────────
function createPhaseTimer() {
  const phases = {};
  const starts = {};
  let _currentPhase = null;

  function start(name) {
    starts[name] = Date.now();
    _currentPhase = name;
  }

  function end(name) {
    if (starts[name] !== undefined) {
      phases[name] = Date.now() - starts[name];
    }
    if (_currentPhase === name) _currentPhase = null;
  }

  function report() {
    return { ...phases };
  }

  function currentPhase() {
    return _currentPhase;
  }

  return { start, end, report, currentPhase };
}

// ── Parse claude -p stdout metadata (AC3.1 rename) ──────────────────
// Per headless-pipeline.md R8: JSON metadata lines are prefixed with
// {"type":"result" or {"error": — separate them from LLM text output.
function parseClaudeCliStdout(rawStdout) {
  if (!rawStdout) {
    return {
      input_tokens: null,
      output_tokens: null,
      cache_read_tokens: null,
      cache_creation_tokens: null,
      model: null,
      turns_used: null,
      error_max_turns: false,
    };
  }

  const lines = rawStdout.split("\n");
  let input_tokens = null;
  let output_tokens = null;
  let cache_read_tokens = null;
  let cache_creation_tokens = null;
  let model = null;
  let turns_used = null;
  let error_max_turns = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }

    if (parsed.type === "result") {
      if (parsed.subtype === "error_max_turns") {
        error_max_turns = true;
      }
      if (parsed.usage) {
        input_tokens = parsed.usage.input_tokens ?? input_tokens;
        output_tokens = parsed.usage.output_tokens ?? output_tokens;
        cache_read_tokens = parsed.usage.cache_read_input_tokens ?? cache_read_tokens;
        cache_creation_tokens = parsed.usage.cache_creation_input_tokens ?? cache_creation_tokens;
      }
      if (parsed.model) model = parsed.model;
      if (parsed.turns_used !== undefined) turns_used = parsed.turns_used;
      if (parsed.num_turns !== undefined) turns_used = parsed.num_turns;
    }

    if (parsed.error) {
      if (parsed.error === "max_turns_exceeded" || parsed.subtype === "error_max_turns") {
        error_max_turns = true;
      }
    }
  }

  return {
    input_tokens,
    output_tokens,
    cache_read_tokens,
    cache_creation_tokens,
    model,
    turns_used,
    error_max_turns,
  };
}

// Backward-compat alias — run.cjs may import parseClaudeStdout pre-migration
const parseClaudeStdout = parseClaudeCliStdout;

// ── Parse OpenRouter JSON response (AC3.1) ───────────────────────────
// Extracts usage and finish_reason from the OpenRouter response shape.
function parseOpenRouterResponse(jsonResponse) {
  if (!jsonResponse || typeof jsonResponse !== "object") {
    return {
      input_tokens: null,
      output_tokens: null,
      model: null,
      finish_reason: null,
    };
  }

  const usage = jsonResponse.usage || {};
  const choice = jsonResponse.choices && jsonResponse.choices[0];

  return {
    input_tokens: usage.prompt_tokens ?? null,
    output_tokens: usage.completion_tokens ?? null,
    model: jsonResponse.model || null,
    finish_reason: choice?.finish_reason || null,
  };
}

// ── Cost estimator (AC3.2) ───────────────────────────────────────────
// Accepts both short model IDs (claude-haiku-4-5) and OpenRouter format
// (anthropic/claude-haiku-4-5). Unknown models return { usd: null, source: "unknown-model" }.
function estimateCost(usage, model) {
  const resolvedModel = model || (usage && usage.model) || FALLBACK_MODEL;
  const pricing = MODEL_PRICING[resolvedModel];
  const fallback_model = !pricing;

  if (fallback_model && resolvedModel !== FALLBACK_MODEL) {
    return {
      usd: null,
      source: "unknown-model",
      model: resolvedModel,
    };
  }

  const effectivePricing = pricing || MODEL_PRICING[FALLBACK_MODEL];

  const inputTok = (usage && usage.input_tokens) || 0;
  const outputTok = (usage && usage.output_tokens) || 0;
  const cacheReadTok = (usage && usage.cache_read_tokens) || 0;
  const cacheWriteTok = (usage && usage.cache_creation_tokens) || 0;

  const inputCost = (inputTok / 1_000_000) * effectivePricing.input;
  const outputCost = (outputTok / 1_000_000) * effectivePricing.output;
  const cacheReadCost = (cacheReadTok / 1_000_000) * (effectivePricing.cache_read || 0);
  const cacheWriteCost = (cacheWriteTok / 1_000_000) * (effectivePricing.cache_write || 0);
  const usd = inputCost + outputCost + cacheReadCost + cacheWriteCost;

  return {
    usd: Math.round(usd * 10000) / 10000,
    source: "sdk-usage",
    model: resolvedModel,
    breakdown: {
      input_usd: Math.round(inputCost * 10000) / 10000,
      output_usd: Math.round(outputCost * 10000) / 10000,
      cache_read_usd: Math.round(cacheReadCost * 10000) / 10000,
      cache_write_usd: Math.round(cacheWriteCost * 10000) / 10000,
    },
  };
}

// ── Char-based cost fallback (when SDK usage not available) ──────────
// Per headless-pipeline.md R5: 4 chars/token estimate
function estimateCostFromChars(promptChars, outputChars, model) {
  const resolvedModel = model || FALLBACK_MODEL;
  const pricing = MODEL_PRICING[resolvedModel] || MODEL_PRICING[FALLBACK_MODEL];
  const fallback_model = !MODEL_PRICING[resolvedModel];

  const inputTok = Math.ceil(promptChars / 4);
  const outputTok = Math.ceil(outputChars / 4);

  const inputCost = (inputTok / 1_000_000) * pricing.input;
  const outputCost = (outputTok / 1_000_000) * pricing.output;
  const usd = inputCost + outputCost;

  const result = {
    usd: Math.round(usd * 10000) / 10000,
    source: "char-fallback",
    model: resolvedModel,
    breakdown: {
      input_usd: Math.round(inputCost * 10000) / 10000,
      output_usd: Math.round(outputCost * 10000) / 10000,
      cache_read_usd: 0,
      cache_write_usd: 0,
    },
  };

  if (fallback_model) result.fallback_model = true;
  return result;
}

// ── DESIGN.md section validator ──────────────────────────────────────
function validateDesignMdSections(designMdContent) {
  if (!designMdContent || typeof designMdContent !== "string") {
    return {
      valid: false,
      missing: ["## Overview", "## Colors", "## Typography", "## Layout", "## Components"],
    };
  }

  const sectionNames = ["## Overview", "## Colors", "## Typography", "## Layout", "## Components"];
  const missing = [];

  for (let i = 0; i < REQUIRED_SECTIONS.length; i++) {
    if (!REQUIRED_SECTIONS[i].test(designMdContent)) {
      missing.push(sectionNames[i]);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

module.exports = {
  createPhaseTimer,
  parseClaudeCliStdout,
  parseClaudeStdout, // backward-compat alias
  parseOpenRouterResponse,
  estimateCost,
  estimateCostFromChars,
  validateDesignMdSections,
};
