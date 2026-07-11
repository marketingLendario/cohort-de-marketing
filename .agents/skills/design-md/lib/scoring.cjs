// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

const REQUIRED_ARTIFACTS = [
  "DESIGN.md",
  "tokens.json",
  "telemetry.json",
  "preview.html",
  "lint-report.json",
  "quality-score.json",
  "extraction-log.yaml",
  "style-fingerprint.json",
  "agent-prompt.txt",
];

function scoreRun(runDir) {
  const exists = (f) => fs.existsSync(path.join(runDir, f));
  const missing = REQUIRED_ARTIFACTS.filter((f) => !exists(f));
  const hasDesignMd = exists("DESIGN.md");
  const complete = missing.length === 0;

  let value = 0;
  let quality = null;
  let confidenceHigh = null;
  let lintErrors = null;

  if (hasDesignMd) {
    try {
      const q = JSON.parse(fs.readFileSync(path.join(runDir, "quality-score.json"), "utf8"));
      quality = q.overall ?? 0;
      value += quality;
    } catch {}
    try {
      const log = YAML.parse(fs.readFileSync(path.join(runDir, "extraction-log.yaml"), "utf8"));
      confidenceHigh = log?.confidence_summary?.high ?? 0;
      value += confidenceHigh * 0.5;
    } catch {}
    try {
      const lint = JSON.parse(fs.readFileSync(path.join(runDir, "lint-report.json"), "utf8"));
      lintErrors = lint?.errors_count ?? 0;
      value -= Math.max(0, lintErrors) * 5;
    } catch {}
  }

  return { complete, hasDesignMd, value, quality, confidenceHigh, lintErrors, missing };
}

module.exports = { REQUIRED_ARTIFACTS, scoreRun };
