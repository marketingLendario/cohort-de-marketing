// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const fs = require("fs");

// Default model — override via OPENROUTER_DEFAULT_MODEL env or --model flag
const OPENROUTER_DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-haiku-4-5";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// ── Extract DESIGN.md from raw LLM response ──────────────────────────
// Small models like Haiku sometimes prepend explanatory prose before the
// actual DESIGN.md content. This strips everything before the first "---"
// frontmatter delimiter so downstream parsers get clean YAML+Markdown.
function extractDesignMd(rawContent) {
  if (!rawContent) return "";
  // Find the first line that is exactly "---" (frontmatter start)
  const fmStart = rawContent.search(/^---\s*$/m);
  if (fmStart !== -1) return rawContent.slice(fmStart);
  // Fallback: return as-is if no frontmatter found
  return rawContent;
}

// ── Invoke OpenRouter via native fetch (Node 18+) ────────────────────
// AC1.3: headers include Authorization, HTTP-Referer, X-Title
// AC1.4: writes DESIGN.md to options.designMdPath from response content
async function invoke(promptText, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[!] OpenRouter selected but OPENROUTER_API_KEY not set. Set it in .env.local or shell, or use --provider claude-cli.");
    process.exit(6);
  }

  const model = options.model || OPENROUTER_DEFAULT_MODEL;
  const maxTokens = options.maxTokens || 8192;

  console.log(`[openrouter] calling ${model} (max_tokens=${maxTokens})…`);

  const body = JSON.stringify({
    model,
    messages: [{ role: "user", content: promptText }],
    max_tokens: maxTokens,
  });

  const bearerToken = `Bearer ${apiKey}`;

  let response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": bearerToken,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sinkra.ai",
        "X-Title": "extract-from-url",
      },
      body,
    });
  } catch (err) {
    return {
      status: 1,
      stdout: "",
      stderr: `[openrouter] network error: ${err.message}`,
      httpStatus: null,
      finishReason: null,
      usage: null,
    };
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    const trimmed = bodyText.slice(0, 500);
    return {
      status: 1,
      stdout: "",
      stderr: `[openrouter] HTTP ${response.status}: ${trimmed}`,
      httpStatus: response.status,
      finishReason: null,
      usage: null,
    };
  }

  let json;
  try {
    json = await response.json();
  } catch (err) {
    return {
      status: 1,
      stdout: "",
      stderr: `[openrouter] failed to parse JSON response: ${err.message}`,
      httpStatus: response.status,
      finishReason: null,
      usage: null,
    };
  }

  const choice = json.choices && json.choices[0];
  const rawContent = choice?.message?.content || "";
  const finishReason = choice?.finish_reason || null;
  const usage = json.usage || null;

  // Extract DESIGN.md body — models like Haiku sometimes prepend explanatory prose.
  // Look for the first "---" that starts a YAML frontmatter block.
  const content = extractDesignMd(rawContent);

  // AC1.4: write DESIGN.md to filesystem if path provided
  if (options.designMdPath && content) {
    fs.writeFileSync(options.designMdPath, content, "utf8");
  }

  return {
    status: 0,
    stdout: content,
    stderr: "",
    httpStatus: response.status,
    finishReason,
    usage,
  };
}

module.exports = { invoke, OPENROUTER_DEFAULT_MODEL };
