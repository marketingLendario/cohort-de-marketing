// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { parsePx, colorToHex, parseFrontmatter } = require("./utils.cjs");

// ── Provenance classification (from inline `# from --var-name` comments) ─
function classifySource(comment) {
  if (!comment) return { source: "unknown", confidence: "low", origin: null };
  const trimmed = comment.replace(/^\s*#\s*/, "").trim();
  let m;
  if ((m = trimmed.match(/^from\s+(--[\w-]+)/i))) {
    return { source: "css_var", confidence: "high", origin: m[1] };
  }
  if (/^from\s+@font-face/i.test(trimmed)) {
    return { source: "font_face", confidence: "high", origin: "@font-face" };
  }
  if ((m = trimmed.match(/^from\s+(.+?)(?:\s+declaration)?$/i))) {
    return { source: "css_declaration", confidence: "medium", origin: m[1].trim() };
  }
  if (/^inferred/i.test(trimmed)) {
    return { source: "inferred", confidence: "low", origin: trimmed };
  }
  return { source: "other", confidence: "medium", origin: trimmed };
}

function stripInlineYamlComment(line) {
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === "#" && !inSingle && !inDouble) {
      const prev = line[i - 1] || "";
      if (/\s/.test(prev)) {
        const beforeHash = line.slice(0, i);
        const valuePart = beforeHash.includes(":")
          ? beforeHash.slice(beforeHash.indexOf(":") + 1).trim()
          : "";
        if (!valuePart) return line;
        return line.slice(0, i).trimEnd();
      }
    }
  }

  return line;
}

// ── Build extraction-log.yaml structure ─────────────────────────────
function buildExtractionLog({ url, designMd, tokens, cssVars, fontFaces, usageGraph, cssMeta, lintResult }) {
  const log = {
    url,
    extracted_at: new Date().toISOString(),
    sources: {
      external_css_files: cssMeta.external?.length || 0,
      preload_css_files: (cssMeta.preload || []).length,
      imports_resolved: cssMeta.imports_resolved || 0,
      inline_style_blocks: cssMeta.inline_style_blocks || 0,
      inline_style_attrs: cssMeta.inline_style_attrs || 0,
      failed_fetches: (cssMeta.failed || []).length,
    },
    detection: {
      css_vars_total: cssVars.length,
      css_vars_primitive: cssVars.filter((v) => !v.is_alias).length,
      css_vars_alias: cssVars.filter((v) => v.is_alias).length,
      font_faces: fontFaces.length,
      unique_tokens_in_graph: usageGraph.length,
    },
    tokens: { colors: {}, typography: {}, rounded: {}, spacing: {} },
    confidence_summary: { high: 0, medium: 0, low: 0 },
  };

  const trimmed = designMd.trimStart();
  if (!trimmed.startsWith("---")) return log;
  const end = trimmed.indexOf("\n---", 3);
  if (end === -1) return log;
  const frontmatter = trimmed.slice(3, end);

  const lines = frontmatter.split("\n");
  let topGroup = null;
  let typoEntry = null;

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch[1].length;

    if (indent === 0) {
      const m = line.match(/^([\w-]+):\s*$/);
      if (m && (m[1] === "colors" || m[1] === "typography" || m[1] === "rounded" || m[1] === "spacing")) {
        topGroup = m[1];
        typoEntry = null;
      } else {
        topGroup = null;
        typoEntry = null;
      }
      continue;
    }

    if (!topGroup) continue;

    if (topGroup === "typography" && indent === 2) {
      const m = line.match(/^\s*([\w-]+):\s*$/);
      if (m) {
        typoEntry = m[1];
        log.tokens.typography[typoEntry] = log.tokens.typography[typoEntry] || { properties: {} };
        continue;
      }
    }

    const headMatch = line.match(/^\s*([\w-]+):\s*(.*)$/);
    if (!headMatch) continue;
    const key = headMatch[1];
    let rest = headMatch[2];

    let value = rest;
    let comment = "";
    let inSingle = false, inDouble = false;
    for (let i = 0; i < rest.length; i++) {
      const ch = rest[i];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (ch === "#" && !inSingle && !inDouble) {
        value = rest.slice(0, i).trim();
        comment = rest.slice(i).trim();
        break;
      }
    }
    value = value.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    const meta = classifySource(comment);
    log.confidence_summary[meta.confidence] = (log.confidence_summary[meta.confidence] || 0) + 1;

    if (topGroup === "typography" && typoEntry && indent === 4) {
      log.tokens.typography[typoEntry].properties[key] = { value, ...meta };
    } else if (topGroup === "typography" && indent === 2) {
      // ignore — header-only line
    } else {
      log.tokens[topGroup][key] = { value, ...meta };
    }
  }

  if (lintResult) log.lint = lintResult;
  return log;
}

// ── Defensive normalization (spec-clean DESIGN.md) ──────────────────
function normalizeDesignMd(designMd) {
  const trimmed = designMd.trimStart();
  if (!trimmed.startsWith("---")) return { md: designMd, changes: [] };
  const fmEnd = trimmed.indexOf("\n---", 3);
  if (fmEnd === -1) return { md: designMd, changes: [] };

  const fm = trimmed.slice(3, fmEnd);
  const body = trimmed.slice(fmEnd);
  const changes = [];

  const lines = fm.split("\n");
  const out = [];
  let inDimGroup = null;

  // NOTE: Prior version stripped the entire `components:` block here as a
  // workaround for the @google/design.md v0.1.0 lint bug. That strip has
  // been REMOVED — components: now survives normalization. The lint bug is
  // handled downstream by runLint() via a temp-file strip (it never reaches
  // the canonical DESIGN.md output). See Phase 2 of the design pipeline
  // refactor (docs/sessions/2026-04/2026-04-29-roundtable-design-pipeline.md).

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");

    if (/^[\w-]+\s*:\s*$/.test(line)) {
      const m = line.match(/^([\w-]+)\s*:/);
      const key = m && m[1];
      inDimGroup = key === "rounded" || key === "spacing" ? key : null;
    } else if (line.match(/^[\w-]+\s*:/)) {
      inDimGroup = null;
    }

    let newLine = line;

    // 1. 8-digit hex → 6-digit hex (alpha dropped)
    newLine = newLine.replace(/(["'])#([0-9a-fA-F]{6})([0-9a-fA-F]{2})\1/g, (match, q, hex6, alphaHex) => {
      const a = (parseInt(alphaHex, 16) / 255).toFixed(2);
      changes.push(`#${hex6}${alphaHex} → #${hex6} (alpha ${a} dropped — not supported by lint spec)`);
      return `"#${hex6}"`;
    });

    // 2. Bare 0 → "0px"
    if (inDimGroup) {
      newLine = newLine.replace(/^(\s+[\w-]+\s*:\s*)["']?0["']?(\s*(?:#.*)?)$/, (m, head, tail) => {
        changes.push(`bare 0 → "0px" in ${inDimGroup}`);
        return `${head}"0px"${tail}`;
      });
    }

    // 3. vw/vh/% in rounded → 9999px (pill)
    if (inDimGroup === "rounded") {
      newLine = newLine.replace(/^(\s+[\w-]+\s*:\s*)["']?(\d+(?:\.\d+)?)(vw|vh|%)["']?(\s*(?:#.*)?)$/, (m, head, num, unit, tail) => {
        changes.push(`${num}${unit} → "9999px" in rounded (pill conversion)`);
        return `${head}"9999px"${tail}`;
      });
    }

    // 4. vw/vh/% in spacing → strip
    if (inDimGroup === "spacing") {
      if (/^\s+[\w-]+\s*:\s*["']?\d+(?:\.\d+)?(vw|vh|%)["']?/.test(newLine)) {
        changes.push(`stripped viewport/percent value from spacing: ${newLine.trim()}`);
        continue;
      }
    }

    // 5. letterSpacing: normal → "0em"
    newLine = newLine.replace(/^(\s+(?:letterSpacing|letter-spacing|letter_spacing)\s*:\s*)["']?normal["']?(\s*(?:#.*)?)$/i, (m, head, tail) => {
      changes.push("letterSpacing: normal → 0em");
      return `${head}"0em"${tail}`;
    });

    const withoutComment = stripInlineYamlComment(newLine);
    if (withoutComment !== newLine) {
      changes.push("stripped inline provenance comment from frontmatter");
      newLine = withoutComment;
    }

    out.push(newLine);
  }

  const newFm = out.join("\n");
  return { md: "---" + newFm + body, changes };
}

function stripComponentsBlock(designMd) {
  const trimmed = designMd.trimStart();
  if (!trimmed.startsWith("---")) return designMd;
  const fmEnd = trimmed.indexOf("\n---", 3);
  if (fmEnd === -1) return designMd;
  const fmStart = 3;
  const fm = trimmed.slice(fmStart, fmEnd);
  const body = trimmed.slice(fmEnd);

  const lines = fm.split("\n");
  const out = [];
  let inComponents = false;
  for (const line of lines) {
    if (/^components\s*:/.test(line)) { inComponents = true; continue; }
    if (inComponents) {
      if (/^\s+/.test(line) || line.trim() === "") continue;
      inComponents = false;
    }
    out.push(line);
  }
  return "---" + out.join("\n") + body;
}

// ── @google/design.md lint runner with workaround for v0.1.0 bug ────
function tryLint(filePath, cwd) {
  const result = spawnSync("npx", ["--yes", "@google/design.md@0.1.0", "lint", filePath, "--format", "json"], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 90000,
    encoding: "utf8",
    shell: process.platform === "win32", // no Windows o npx e npx.cmd; sem shell o spawnSync nao acha
  });
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  let parsed = null;
  try {
    const jsonMatch = stdout.match(/\{[\s\S]*\}\s*$/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    else if (stdout.trim()) parsed = JSON.parse(stdout);
  } catch {
    parsed = null;
  }
  return { exit_code: result.status, parsed, stdout, stderr };
}

function classifyLintResult(parsed, exit_code, stdout, stderr) {
  if (parsed) {
    const errors = parsed.errors || parsed.findings?.filter((f) => f.severity === "error") || [];
    const warnings = parsed.warnings || parsed.findings?.filter((f) => f.severity === "warning") || [];
    return { ran: true, exit_code, errors_count: errors.length, warnings_count: warnings.length, errors, warnings, raw: parsed };
  }
  const errCount = (stdout.match(/\b(\d+)\s+error/i) || [])[1];
  const warnCount = (stdout.match(/\b(\d+)\s+warning/i) || [])[1];
  return {
    ran: true,
    exit_code,
    errors_count: errCount ? parseInt(errCount, 10) : (exit_code !== 0 ? -1 : 0),
    warnings_count: warnCount ? parseInt(warnCount, 10) : 0,
    stdout_excerpt: stdout.slice(0, 2000),
    stderr_excerpt: stderr.slice(0, 1000),
  };
}

function isModelBuildingBug(result) {
  if (!result.parsed) return false;
  const findings = result.parsed.findings || result.parsed.errors || [];
  return findings.some((f) => /Unexpected error during model building/i.test(f.message || ""));
}

function runLint(designMdPath, cwd) {
  console.log("[lint] running @google/design.md@0.1.0 lint…");
  try {
    const first = tryLint(designMdPath, cwd);
    if (!isModelBuildingBug(first)) {
      return classifyLintResult(first.parsed, first.exit_code, first.stdout, first.stderr);
    }
    console.log("[lint] retrying with components: block stripped (linter v0.1.0 bug workaround)");
    const original = fs.readFileSync(designMdPath, "utf8");
    const tmpPath = path.join(path.dirname(designMdPath), ".lint-stripped.md");
    const stripped = stripComponentsBlock(original);
    fs.writeFileSync(tmpPath, stripped);
    try {
      const second = tryLint(tmpPath, cwd);
      const classified = classifyLintResult(second.parsed, second.exit_code, second.stdout, second.stderr);
      classified.workaround = "components-stripped";
      classified.note = "Linter v0.1.0 has a model-building bug with nested components. Re-ran on stripped copy; component validation skipped.";
      return classified;
    } finally {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  } catch (err) {
    return { ran: false, error: err.message };
  }
}

// ── Drift detection (compare local DESIGN.md vs URL extraction) ─────
function colorDistanceRgb(hex1, hex2) {
  const parse = (h) => {
    const s = String(h || "").replace(/^#/, "");
    if (s.length !== 6) return null;
    return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)];
  };
  const a = parse(hex1), b = parse(hex2);
  if (!a || !b) return Infinity;
  const dr = a[0]-b[0], dg = a[1]-b[1], db = a[2]-b[2];
  return Math.sqrt(dr*dr + dg*dg + db*db);
}

function flattenAllColors(colors, prefix="") {
  const out = {};
  if (!colors || typeof colors !== "object") return out;
  for (const [k, v] of Object.entries(colors)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenAllColors(v, key));
    } else if (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim())) {
      out[key] = v.trim().toLowerCase();
    }
  }
  return out;
}

function computeDrift(localTokens, liveTokens, tolerance = 8) {
  const result = {
    tolerance,
    colors: { matched: [], drifted: [], removed: [], added: [] },
    typography: { matched: [], drifted: [], removed: [], added: [] },
    rounded: { matched: [], drifted: [], removed: [], added: [] },
    spacing: { matched: [], drifted: [], removed: [], added: [] },
    summary: {},
  };

  const localColors = flattenAllColors(localTokens.colors);
  const liveColors = flattenAllColors(liveTokens.colors);
  for (const [key, localValue] of Object.entries(localColors)) {
    if (key in liveColors) {
      const liveValue = liveColors[key];
      const dist = colorDistanceRgb(localValue, liveValue);
      if (dist === 0) result.colors.matched.push({ key, value: localValue });
      else if (dist <= tolerance) result.colors.matched.push({ key, value: localValue, live_value: liveValue, delta: dist.toFixed(1) });
      else result.colors.drifted.push({ key, local: localValue, live: liveValue, delta: Math.round(dist) });
    } else {
      result.colors.removed.push({ key, value: localValue });
    }
  }
  for (const [key, liveValue] of Object.entries(liveColors)) {
    if (!(key in localColors)) result.colors.added.push({ key, value: liveValue });
  }

  const compareTypoEntries = (local, live) => {
    if (!local || !live) return null;
    const localFam = String(local.fontFamily || "").split(",")[0].trim().replace(/['"]/g, "").toLowerCase();
    const liveFam = String(live.fontFamily || "").split(",")[0].trim().replace(/['"]/g, "").toLowerCase();
    const familyMatch = localFam === liveFam;
    const sizeMatch = String(local.fontSize || "") === String(live.fontSize || "");
    const weightMatch = String(local.fontWeight || "") === String(live.fontWeight || "");
    return { familyMatch, sizeMatch, weightMatch, allMatch: familyMatch && sizeMatch && weightMatch };
  };
  const localTypo = localTokens.typography || {};
  const liveTypo = liveTokens.typography || {};
  for (const key of Object.keys(localTypo)) {
    if (key in liveTypo) {
      const cmp = compareTypoEntries(localTypo[key], liveTypo[key]);
      if (cmp.allMatch) result.typography.matched.push({ key });
      else result.typography.drifted.push({ key, local: localTypo[key], live: liveTypo[key], match: cmp });
    } else {
      result.typography.removed.push({ key, value: localTypo[key] });
    }
  }
  for (const key of Object.keys(liveTypo)) {
    if (!(key in localTypo)) result.typography.added.push({ key, value: liveTypo[key] });
  }

  for (const group of ["rounded", "spacing"]) {
    const local = localTokens[group] || {};
    const live = liveTokens[group] || {};
    for (const [k, v] of Object.entries(local)) {
      if (k in live) {
        const lpx = parsePx(v); const lvpx = parsePx(live[k]);
        if (lpx === lvpx) result[group].matched.push({ key: k, value: v });
        else result[group].drifted.push({ key: k, local: v, live: live[k] });
      } else {
        result[group].removed.push({ key: k, value: v });
      }
    }
    for (const k of Object.keys(live)) {
      if (!(k in local)) result[group].added.push({ key: k, value: live[k] });
    }
  }

  const totalDrifted =
    result.colors.drifted.length + result.typography.drifted.length +
    result.rounded.drifted.length + result.spacing.drifted.length;
  const totalAddedRemoved =
    result.colors.added.length + result.colors.removed.length +
    result.typography.added.length + result.typography.removed.length;
  const drift_score = totalDrifted * 2 + totalAddedRemoved;

  let verdict = "in-sync";
  if (drift_score >= 20) verdict = "major-drift";
  else if (drift_score >= 10) verdict = "notable-drift";
  else if (drift_score >= 3) verdict = "minor-drift";

  result.summary = {
    verdict,
    drift_score,
    total_drifted: totalDrifted,
    total_added: result.colors.added.length + result.typography.added.length,
    total_removed: result.colors.removed.length + result.typography.removed.length,
    total_matched: result.colors.matched.length + result.typography.matched.length + result.rounded.matched.length + result.spacing.matched.length,
  };
  return result;
}

// ── Quality score (A-F across 7 dimensions) ─────────────────────────
function computeQualityScore(tokens, extractionLog, lintResult, cssVars, fontFaces) {
  const colors = flattenAllColors(tokens.colors || {});
  const typoCount = Object.keys(tokens.typography || {}).length;
  const familyCount = new Set(
    Object.values(tokens.typography || {})
      .map(t => String(t.fontFamily || "").split(",")[0].trim().replace(/['"]/g, "").toLowerCase())
      .filter(Boolean)
  ).size;
  const radiiCount = Object.keys(tokens.rounded || {}).length;
  const spacingCount = Object.keys(tokens.spacing || {}).length;

  const score = (n) => {
    if (n >= 90) return "A";
    if (n >= 80) return "B";
    if (n >= 70) return "C";
    if (n >= 60) return "D";
    return "F";
  };

  const colorCount = Object.keys(colors).length;
  let colorScore = 100;
  if (colorCount > 80) colorScore = 50;
  else if (colorCount > 60) colorScore = 70;
  else if (colorCount > 40) colorScore = 85;
  else if (colorCount > 25) colorScore = 95;

  let typoScore = 100;
  if (familyCount === 0) typoScore = 40;
  else if (familyCount > 6) typoScore = 50;
  else if (familyCount > 4) typoScore = 75;
  else if (familyCount >= 2 && familyCount <= 4) typoScore = 100;
  else if (familyCount === 1) typoScore = 85;
  if (typoCount < 4) typoScore = Math.min(typoScore, 70);

  let spacingScore = 60;
  if (spacingCount >= 4 && spacingCount <= 8) spacingScore = 100;
  else if (spacingCount >= 3) spacingScore = 80;
  else if (spacingCount > 8) spacingScore = 75;

  let radiusScore = 60;
  if (radiiCount >= 3 && radiiCount <= 6) radiusScore = 100;
  else if (radiiCount >= 2) radiusScore = 80;
  else if (radiiCount > 6) radiusScore = 75;

  const summary = (extractionLog && extractionLog.confidence_summary) || {};
  const totalConf = (summary.high || 0) + (summary.medium || 0) + (summary.low || 0);
  const tokenizationPct = totalConf > 0 ? (summary.high / totalConf) * 100 : 0;
  const tokenizationScore = Math.max(40, tokenizationPct);

  const lintRanCleanly = lintResult && lintResult.ran && typeof lintResult.errors_count === "number" && lintResult.errors_count >= 0;
  const lintScore = lintRanCleanly ? (lintResult.errors_count === 0 ? 100 : 60) : 70;

  let aaaCount = 0, aaCount = 0, totalPairs = 0;
  const colorList = Object.entries(colors);
  const textKeys = colorList.filter(([k]) => /text|ink|primary|secondary/i.test(k)).slice(0, 6);
  const bgKeys = colorList.filter(([k]) => /surface|neutral|background|bg|card/i.test(k)).slice(0, 6);
  const lum = (hex) => {
    const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const c = [r,g,b].map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
    return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
  };
  for (const [, txt] of textKeys) {
    for (const [, bg] of bgKeys) {
      if (!/^#[0-9a-f]{6}$/i.test(txt) || !/^#[0-9a-f]{6}$/i.test(bg)) continue;
      const lt = lum(txt), lb = lum(bg);
      const ratio = (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05);
      totalPairs++;
      if (ratio >= 7) { aaaCount++; aaCount++; }
      else if (ratio >= 4.5) aaCount++;
    }
  }
  const a11yScore = totalPairs > 0 ? Math.round((aaCount / totalPairs) * 100) : 70;

  const categories = {
    color_discipline: { score: Math.round(colorScore), grade: score(colorScore), value: `${colorCount} colors`, ideal: "25-40" },
    typography: { score: Math.round(typoScore), grade: score(typoScore), value: `${familyCount} families, ${typoCount} scales`, ideal: "2-4 families" },
    spacing_system: { score: Math.round(spacingScore), grade: score(spacingScore), value: `${spacingCount} tokens`, ideal: "4-8" },
    border_radii: { score: Math.round(radiusScore), grade: score(radiusScore), value: `${radiiCount} levels`, ideal: "3-6" },
    tokenization: { score: Math.round(tokenizationScore), grade: score(tokenizationScore), value: `${Math.round(tokenizationPct)}% high confidence`, ideal: "≥80%" },
    lint_compliance: { score: lintScore, grade: score(lintScore), value: lintRanCleanly ? `${lintResult.errors_count}E ${lintResult.warnings_count}W` : "skipped", ideal: "0E 0W" },
    accessibility: { score: a11yScore, grade: score(a11yScore), value: `${aaCount}/${totalPairs} pairs ≥AA`, ideal: "100% AA" },
  };

  const overall = Math.round(
    (colorScore + typoScore + spacingScore + radiusScore + tokenizationScore + lintScore + a11yScore) / 7
  );
  return { overall, grade: score(overall), categories };
}

module.exports = {
  classifySource,
  buildExtractionLog,
  normalizeDesignMd,
  stripComponentsBlock,
  tryLint,
  classifyLintResult,
  isModelBuildingBug,
  runLint,
  colorDistanceRgb,
  flattenAllColors,
  computeDrift,
  computeQualityScore,
  parseFrontmatter, // re-export for convenience
};
