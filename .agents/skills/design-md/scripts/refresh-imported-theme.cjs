#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const { buildRenderContract } = require("../lib/render-contract.cjs");
const { detectLiveThemeDefault } = require("../lib/live-theme.cjs");
const { getThemeCuration } = require("../lib/theme-curation.cjs");
const { hasThemeSignal, inferThemeFromDesignMd } = require("../lib/theme-inference.cjs");

function findRepoRoot(start) {
  let dir = path.resolve(start);
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readText(filePath, fallback = "") {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return fallback;
  }
}

function readYaml(filePath, fallback = null) {
  try {
    return yaml.load(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function isImportedRun(runDir) {
  const telemetry = readJson(path.join(runDir, "telemetry.json"), {});
  const log = readYaml(path.join(runDir, "extraction-log.yaml"), {});
  return telemetry.provider === "awesome-design-md" || log?.source === "awesome-design-md";
}

function sourceUrlFor(runDir) {
  const telemetry = readJson(path.join(runDir, "telemetry.json"), {});
  const log = readYaml(path.join(runDir, "extraction-log.yaml"), {});
  return telemetry.source_url || telemetry.url || log?.source_url || log?.url || null;
}

function slugFor(runDir) {
  const telemetry = readJson(path.join(runDir, "telemetry.json"), {});
  const log = readYaml(path.join(runDir, "extraction-log.yaml"), {});
  return telemetry.getdesign_slug || log?.getdesign_slug || path.basename(runDir);
}

async function refreshRun(runDir) {
  if (!isImportedRun(runDir)) return { skipped: true, reason: "not-awesome-design-md" };
  const designMd = readText(path.join(runDir, "DESIGN.md"));
  const tokensPath = path.join(runDir, "tokens.json");
  const tokens = readJson(tokensPath, null);
  if (!designMd || !tokens) return { skipped: true, reason: "missing-design-or-tokens" };

  const sourceUrl = sourceUrlFor(runDir);
  const curatedTheme = getThemeCuration(slugFor(runDir), sourceUrl);
  const semanticTheme = inferThemeFromDesignMd(designMd, tokens);
  const liveTheme = curatedTheme ? null : await detectLiveThemeDefault(sourceUrl);
  const usedLive = liveTheme && hasThemeSignal(liveTheme);
  const resolvedTheme = curatedTheme || (usedLive ? liveTheme : semanticTheme);
  const themeDefault = {
    ...resolvedTheme,
    source: curatedTheme ? "theme-curation" : usedLive ? "live-http-refresh" : "design-md-semantic-refresh",
  };

  fs.mkdirSync(path.join(runDir, "inputs"), { recursive: true });
  fs.writeFileSync(path.join(runDir, "inputs", "theme-default.json"), JSON.stringify(themeDefault, null, 2));

  const extended = readJson(path.join(runDir, "tokens-extended.json"), {});
  const contract = buildRenderContract({
    url: sourceUrl,
    tokens,
    extended,
    themeDefault,
  });
  fs.writeFileSync(path.join(runDir, "render-contract.json"), JSON.stringify(contract, null, 2));

  const fingerprintPath = path.join(runDir, "style-fingerprint.json");
  const fingerprint = readJson(fingerprintPath, null);
  if (fingerprint?.classification && fingerprint.source === "imported-design-md") {
    fingerprint.classification.primary_archetype =
      themeDefault.default === "dark" ? "dark-editorial" : "agent-ready";
    fingerprint.signals = {
      ...(fingerprint.signals || {}),
      theme_default: themeDefault.default,
    };
    fs.writeFileSync(fingerprintPath, JSON.stringify(fingerprint, null, 2));
  }

  return {
    skipped: false,
    mode: contract.theme?.default_mode,
    signal: themeDefault.signals?.[0] || null,
  };
}

async function main() {
  const repoRoot = findRepoRoot(process.cwd());
  const root =
    process.env.DESIGN_MD_OUTPUTS_DIR ||
    path.join(repoRoot, "outputs", "design-md");
  const args = process.argv.slice(2);
  const only = new Set(args.filter((arg) => !arg.startsWith("--")));
  const dirs = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => only.size === 0 || only.has(name));

  let updated = 0;
  let skipped = 0;
  for (const name of dirs) {
    const runDir = path.join(root, name);
    const result = await refreshRun(runDir);
    if (result.skipped) {
      skipped += 1;
      continue;
    }
    updated += 1;
    console.log(`[theme] ${name}: ${result.mode} (${result.signal})`);
  }
  console.log(`[done] updated=${updated} skipped=${skipped}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

module.exports = { refreshRun };
