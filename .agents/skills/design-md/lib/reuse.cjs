// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const fs = require("fs");
const path = require("path");

const { scoreRun } = require("./scoring.cjs");

const FRESH_MS_DEFAULT = 24 * 60 * 60 * 1000;

// Files that live at the company root and should NOT be moved when archiving the
// previous "best" run into history (history/ itself is preserved).
const ROOT_ARTIFACT_NAMES = new Set([
  "DESIGN.md", "DESIGN.md.raw",
  "tokens.json", "tokens-extended.json",
  "telemetry.json", "preview.html",
  "lint-report.json", "quality-score.json",
  "extraction-log.yaml", "style-fingerprint.json",
  "agent-prompt.txt", "drift-report.json",
  "crash-context.json", "inputs",
]);

// "Previous run" for cache lookup is the current `{company}/` root, since after
// migration that dir holds the latest "best" extraction. The currentRunDir
// (a scratch dir like {company}/.run-{ts}/) is excluded.
function findLatestRunForUrl({ outputsDir, company, currentRunDir }) {
  if (!company) return null;
  const companyDir = path.join(outputsDir, company);
  if (!fs.existsSync(companyDir)) return null;
  if (path.resolve(companyDir) === path.resolve(currentRunDir || "")) return null;
  // A useful previous run requires at minimum page.html + DESIGN.md
  if (!fs.existsSync(path.join(companyDir, "inputs", "page.html"))) return null;
  return companyDir;
}

function dirAgeMs(dir) {
  try {
    // Use page.html mtime if present (more stable than dir mtime which changes on history/ writes)
    const pageHtml = path.join(dir, "inputs", "page.html");
    if (fs.existsSync(pageHtml)) return Date.now() - fs.statSync(pageHtml).mtimeMs;
    return Date.now() - fs.statSync(dir).mtimeMs;
  } catch {
    return Infinity;
  }
}

function isFresh(dir, maxMs = FRESH_MS_DEFAULT) {
  return dirAgeMs(dir) < maxMs;
}

function copyIfExists(srcPath, destPath) {
  if (!fs.existsSync(srcPath)) return false;
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  return true;
}

function copyAllOrNone(srcDir, destDir, filenames) {
  const srcs = filenames.map((f) => path.join(srcDir, f));
  if (!srcs.every((p) => fs.existsSync(p))) return false;
  for (const f of filenames) {
    const src = path.join(srcDir, f);
    const dest = path.join(destDir, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  return true;
}

function readPrevTelemetryModel(previousRunDir) {
  if (!previousRunDir) return null;
  const telemetryPath = path.join(previousRunDir, "telemetry.json");
  if (!fs.existsSync(telemetryPath)) return null;
  try {
    const t = JSON.parse(fs.readFileSync(telemetryPath, "utf8"));
    return t?.llm?.model || null;
  } catch {
    return null;
  }
}

function readPrevTelemetry(previousRunDir) {
  if (!previousRunDir) return null;
  const telemetryPath = path.join(previousRunDir, "telemetry.json");
  if (!fs.existsSync(telemetryPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(telemetryPath, "utf8"));
  } catch {
    return null;
  }
}

function normalizePromptForComparison(prompt) {
  // Path-normalize across runs so prompt-equality comparisons survive output
  // dir rotations. Matches both the standalone (`outputs/design-md/`) and
  // legacy (`outputs/design-ops/url-extracts/`) layouts so older cached prompts
  // still hit on reuse.
  return prompt
    .replace(/(?:\/[^\s"']*?\/)?outputs\/design-md\/[^\s"']+/g, "outputs/design-md/RUN")
    .replace(/(?:\/[^\s"']*?\/)?outputs\/design-ops\/url-extracts\/[^\s"']+/g, "outputs/design-md/RUN");
}

function promptsEqual(a, b) {
  return normalizePromptForComparison(a) === normalizePromptForComparison(b);
}

// Recursively move src to dest. Uses fs.renameSync first (cheap intra-volume),
// falls back to copy+remove on EXDEV (cross-volume) or EBUSY.
function moveDir(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if (err.code === "EXDEV" || err.code === "EBUSY") {
      fs.cpSync(src, dest, { recursive: true });
      fs.rmSync(src, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}

// At end of pipeline: compare scratch run vs current company root.
// New best → archive root to history/{prev-ts}, promote scratch to root.
// New worse (or no prev root) → if no root exists, scratch becomes root anyway.
//                              → if prev root better, scratch goes to history/{this-ts}.
function promoteOrArchive({ companyDir, scratchDir, scratchTs }) {
  fs.mkdirSync(companyDir, { recursive: true });
  const historyDir = path.join(companyDir, "history");
  fs.mkdirSync(historyDir, { recursive: true });

  const newScore = scoreRun(scratchDir);
  const rootHasArtifacts = fs.existsSync(path.join(companyDir, "inputs", "page.html")) ||
                           fs.existsSync(path.join(companyDir, "DESIGN.md"));

  // No previous root → just promote scratch
  if (!rootHasArtifacts) {
    moveScratchToRoot(scratchDir, companyDir);
    return { promoted: true, reason: "no-previous-root", newScore, prevScore: null };
  }

  const prevScore = scoreRun(companyDir);

  // Decision rule (prioritize COMPLETENESS, then quality):
  //   1. New must have DESIGN.md (sanity gate)
  //   2. If new is complete AND prev is incomplete → new wins (more analyses present)
  //   3. If prev is complete AND new is incomplete → prev wins
  //   4. Same completeness level → higher score wins (ties go to new)
  let newWins = false;
  let reason = "";
  if (!newScore.hasDesignMd) {
    newWins = false;
    reason = "new-has-no-design-md";
  } else if (newScore.complete && !prevScore.complete) {
    newWins = true;
    reason = "new-complete-prev-incomplete";
  } else if (!newScore.complete && prevScore.complete) {
    newWins = false;
    reason = "prev-complete-new-incomplete";
  } else {
    newWins = newScore.value >= prevScore.value;
    reason = newWins ? "new-better-or-equal-score" : "previous-better-score";
  }

  if (newWins) {
    // Archive previous root → history/{prev-ts}
    const prevTs = derivePrevTs(companyDir) || "preexisting-" + Date.now();
    const archiveTarget = path.join(historyDir, prevTs);
    archiveRootToHistory(companyDir, archiveTarget);
    // Promote scratch to root
    moveScratchToRoot(scratchDir, companyDir);
    return { promoted: true, reason, newScore, prevScore, archivedAs: prevTs };
  }

  // New loses → scratch goes to history
  const archiveTarget = path.join(historyDir, scratchTs);
  moveDir(scratchDir, archiveTarget);
  return { promoted: false, reason, newScore, prevScore };
}

function derivePrevTs(companyDir) {
  // Try telemetry.json schema_version was added with reuse — read URL+timestamp from there
  const telemetryPath = path.join(companyDir, "telemetry.json");
  if (fs.existsSync(telemetryPath)) {
    try {
      const t = JSON.parse(fs.readFileSync(telemetryPath, "utf8"));
      // Format: extract from page.html mtime as fallback
      const mtime = fs.statSync(path.join(companyDir, "inputs", "page.html")).mtime;
      return mtimeToTs(mtime);
    } catch {}
  }
  // Fallback: derive timestamp from the inputs/page.html mtime
  try {
    const mtime = fs.statSync(path.join(companyDir, "inputs", "page.html")).mtime;
    return mtimeToTs(mtime);
  } catch {
    return null;
  }
}

function mtimeToTs(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function archiveRootToHistory(companyDir, archiveDir) {
  fs.mkdirSync(archiveDir, { recursive: true });
  for (const item of fs.readdirSync(companyDir)) {
    if (item === "history") continue; // never move the history dir into itself
    if (!ROOT_ARTIFACT_NAMES.has(item)) continue;
    const src = path.join(companyDir, item);
    const dest = path.join(archiveDir, item);
    moveDir(src, dest);
  }
}

function moveScratchToRoot(scratchDir, companyDir) {
  for (const item of fs.readdirSync(scratchDir)) {
    const src = path.join(scratchDir, item);
    const dest = path.join(companyDir, item);
    if (fs.existsSync(dest)) {
      // Defensive: remove leftover before move (root should be cleared by archive step)
      fs.rmSync(dest, { recursive: true, force: true });
    }
    moveDir(src, dest);
  }
  // Remove now-empty scratch dir
  try { fs.rmdirSync(scratchDir); } catch {}
}

module.exports = {
  FRESH_MS_DEFAULT,
  findLatestRunForUrl,
  dirAgeMs,
  isFresh,
  copyIfExists,
  copyAllOrNone,
  readPrevTelemetryModel,
  readPrevTelemetry,
  normalizePromptForComparison,
  promptsEqual,
  promoteOrArchive,
  moveDir,
};
