// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const { spawnSync } = require("child_process");

// ── Invoke Claude Code as subprocess (CLI mode) ─────────────────────
// Headless flags per .claude/rules/headless-pipeline.md:
//   R1 — --dangerously-skip-permissions (without it, all tools auto-denied)
//   R3/R4 — --allowedTools "Read,Write"
//   R5 — --max-turns 90 (cap budget; large sites with 1000+ css-vars +
//   the post-Phase-2 prompt (450 lines, 30KB demanding 8-atom components:,
//   12-18 typography roles, 9 numbered sections + Agent Prompt Guide) need
//   substantial turn headroom. Mercado Livre stalled at 12 turns under
//   stream timeout; bumping to 90 + bumping process timeout to 15min.)
//   Retry path in run.cjs still bumps further when needed.
//
// Override at the per-call level via options.maxTurns or globally via
// the env vars DESIGN_MD_MAX_TURNS / DESIGN_MD_TIMEOUT_MS.
//
// Returns { status, stdout, stderr } — callers parse claudeMetadata from stdout
// per headless-pipeline.md R8.
function invoke(promptText, options = {}) {
  const envTurns = parseInt(process.env.DESIGN_MD_MAX_TURNS || "", 10);
  const maxTurnsDefault = Number.isFinite(envTurns) && envTurns > 0 ? envTurns : 90;
  const envTimeout = parseInt(process.env.DESIGN_MD_TIMEOUT_MS || "", 10);
  const timeoutDefault = Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout : 900000;
  const { maxTurns = maxTurnsDefault, timeoutMs = timeoutDefault, cwd } = options;
  console.log("[claude-cli] spawning headless session…");
  const result = spawnSync(
    "claude",
    [
      "-p",
      promptText,
      "--output-format", "json",
      "--allowedTools", "Read,Write",
      "--dangerously-skip-permissions",
      "--max-turns", String(maxTurns),
    ],
    {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: timeoutMs, // 15min default — post-Phase-2 prompt heavier; ML stalled at 8.6min
      encoding: "utf8",
    }
  );

  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

module.exports = { invoke };
