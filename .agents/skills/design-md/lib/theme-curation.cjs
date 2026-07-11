// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const fs = require("fs");
const path = require("path");

const CURATION_PATH = path.join(__dirname, "..", "data", "theme-curation.json");

function readCuration() {
  try {
    return JSON.parse(fs.readFileSync(CURATION_PATH, "utf8"));
  } catch {
    return {};
  }
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function getThemeCuration(...keys) {
  const curation = readCuration();
  for (const rawKey of keys) {
    const key = normalizeKey(rawKey);
    if (!key) continue;
    if (curation[key]) return curation[key];
    const noTld = key.replace(/\.[a-z]{2,}$/, "");
    if (curation[noTld]) return curation[noTld];
  }
  return null;
}

module.exports = {
  getThemeCuration,
};
