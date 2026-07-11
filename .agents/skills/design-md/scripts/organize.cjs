#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

/**
 * design-md-organize — consolidate timestamped run dirs into per-company layout.
 *
 *   outputs/design-md/
 *     {company}/
 *       DESIGN.md, tokens.json, preview.html, ...    ← best run promoted
 *       inputs/
 *       history/
 *         {YYYYMMDD-HHmmss}/                          ← all other runs
 *
 * Usage:
 *   node scripts/organize.cjs --dry-run   # preview only
 *   node scripts/organize.cjs --apply     # actually move files
 *   node scripts/organize.cjs --apply --skip-junk    # also drop junk dirs (no DESIGN.md)
 *
 * Override the outputs root by setting DESIGN_MD_OUTPUTS_DIR=/abs/path,
 * otherwise resolves to <CWD>/outputs/design-md/.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const { companyFromSlug } = require("../lib/utils.cjs");
const { scoreRun } = require("../lib/scoring.cjs");

const TS_REGEX = /^(.+)-(\d{8}-\d{6})$/;

function findRepoRoot(start) {
  let dir = path.resolve(start);
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function parseFlags(argv) {
  const flags = { dryRun: false, apply: false, skipJunk: false };
  for (const a of argv.slice(2)) {
    if (a === "--dry-run") flags.dryRun = true;
    else if (a === "--apply") flags.apply = true;
    else if (a === "--skip-junk") flags.skipJunk = true;
  }
  if (!flags.dryRun && !flags.apply) flags.dryRun = true;
  return flags;
}

function listRunDirs(outputsDir) {
  if (!fs.existsSync(outputsDir)) return [];
  return fs
    .readdirSync(outputsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => TS_REGEX.test(n))
    .map((name) => {
      const m = name.match(TS_REGEX);
      const slug = m[1];
      const ts = m[2];
      return { name, slug, ts, fullPath: path.join(outputsDir, name) };
    });
}

function planMigration(outputsDir, { skipJunk }) {
  const runs = listRunDirs(outputsDir);
  const groups = {};
  for (const r of runs) {
    const company = companyFromSlug(r.slug);
    if (!groups[company]) groups[company] = [];
    groups[company].push(r);
  }

  const plan = [];
  const junk = [];

  for (const [company, list] of Object.entries(groups)) {
    const scored = list
      .map((r) => ({ ...r, score: scoreRun(r.fullPath) }))
      .sort((a, b) => {
        if (a.score.complete !== b.score.complete) return b.score.complete - a.score.complete;
        if (a.score.value !== b.score.value) return b.score.value - a.score.value;
        return b.ts.localeCompare(a.ts);
      });

    // Junk = runs where DESIGN.md does NOT exist (extraction failed entirely)
    // Useful = runs with DESIGN.md, even if minor artifacts are missing
    const useful = scored.filter((r) => fs.existsSync(path.join(r.fullPath, "DESIGN.md")));
    const broken = scored.filter((r) => !fs.existsSync(path.join(r.fullPath, "DESIGN.md")));

    if (useful.length === 0) {
      // All runs for this company lack DESIGN.md → all junk
      for (const r of scored) junk.push({ ...r, company, reason: "no-design-md" });
      continue;
    }

    const best = useful[0];
    const rest = useful.slice(1);

    if (skipJunk) {
      for (const r of broken) junk.push({ ...r, company, reason: "no-design-md" });
    }

    plan.push({
      company,
      best,
      rest: skipJunk ? rest : [...rest, ...broken],
      hasComplete: best.score.complete,
    });
  }

  return { plan, junk };
}

function planSummary(plan, junk) {
  const lines = [];
  lines.push(`# Migration Plan`);
  lines.push(``);
  lines.push(`Companies: ${plan.length}  ·  Junk dirs (no complete run): ${junk.length}`);
  lines.push(``);
  for (const p of plan) {
    lines.push(`## ${p.company} (${p.rest.length + 1} runs)`);
    if (p.best.score.complete) {
      const s = p.best.score;
      lines.push(`  - PROMOTE: ${p.best.name}  → quality=${s.quality}  conf_high=${s.confidenceHigh}  lint_err=${s.lintErrors}`);
    } else {
      lines.push(`  - PROMOTE (best of incomplete): ${p.best.name}  ⚠ missing: ${p.best.score.missing.slice(0, 3).join(", ")}${p.best.score.missing.length > 3 ? ", …" : ""}`);
    }
    for (const r of p.rest) {
      const tag = r.score.complete ? "complete" : `incomplete (${r.score.missing.length} missing)`;
      lines.push(`  - history: ${r.name}  (${tag})`);
    }
    lines.push(``);
  }
  if (junk.length > 0) {
    lines.push(`## Junk (will be dropped with --skip-junk)`);
    for (const j of junk) {
      lines.push(`  - ${j.name}  → ${j.company}  ⚠ ${j.reason}`);
    }
  }
  return lines.join("\n");
}

function moveDir(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(src, dest);
}

function applyPlan(outputsDir, plan) {
  for (const p of plan) {
    const companyDir = path.join(outputsDir, p.company);
    const historyDir = path.join(companyDir, "history");
    fs.mkdirSync(historyDir, { recursive: true });

    // Move "rest" to history first (so they are out of the way)
    for (const r of p.rest) {
      const dest = path.join(historyDir, r.ts);
      if (fs.existsSync(dest)) {
        // Already moved? skip
        fs.rmSync(r.fullPath, { recursive: true, force: true });
        continue;
      }
      moveDir(r.fullPath, dest);
    }

    // Promote best to companyDir root (move children of best.fullPath into companyDir)
    const bestPath = p.best.fullPath;
    if (!fs.existsSync(bestPath)) continue;
    for (const item of fs.readdirSync(bestPath)) {
      // Don't overwrite history if user already had a {company}/history dir
      if (item === "history") continue;
      const src = path.join(bestPath, item);
      const dest = path.join(companyDir, item);
      if (fs.existsSync(dest)) {
        // Backup existing root file/dir into history first
        const stamp = "preexisting-" + Date.now();
        moveDir(dest, path.join(historyDir, stamp + "-" + item));
      }
      moveDir(src, dest);
    }
    // Remove now-empty best dir
    try { fs.rmdirSync(bestPath); } catch {}
  }
}

function applyJunk(junk) {
  for (const j of junk) {
    fs.rmSync(j.fullPath, { recursive: true, force: true });
  }
}

function main() {
  const repoRoot = findRepoRoot(process.cwd());
  const outputsDir =
    process.env.DESIGN_MD_OUTPUTS_DIR ||
    path.join(repoRoot, "outputs", "design-md");
  const flags = parseFlags(process.argv);

  if (!fs.existsSync(outputsDir)) {
    console.error(`[!] not found: ${outputsDir}`);
    process.exit(3);
  }

  const { plan, junk } = planMigration(outputsDir, flags);

  console.log(planSummary(plan, junk));

  if (flags.dryRun) {
    console.log(`\n[dry-run] no changes made. Re-run with --apply to execute.`);
    return;
  }

  console.log(`\n[apply] migrating…`);
  applyPlan(outputsDir, plan);
  if (flags.skipJunk) applyJunk(junk);
  console.log(`[apply] done.`);
}

if (require.main === module) main();

module.exports = { planMigration, scoreRun, planSummary };
