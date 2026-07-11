// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const { detectDefaultTheme } = require("./extractors.cjs");

async function detectLiveThemeDefault(sourceUrl) {
  try {
    const htmlResponse = await fetch(sourceUrl, {
      headers: { "user-agent": "design-md-extractor" },
    });
    if (!htmlResponse.ok) return null;
    const html = await htmlResponse.text();
    const css = await fetchLinkedCss(html, sourceUrl);
    return detectDefaultTheme(html, css);
  } catch {
    return null;
  }
}

async function fetchLinkedCss(html, sourceUrl) {
  const links = extractStylesheetHrefs(html).slice(0, 8);
  const chunks = [];
  for (const href of links) {
    try {
      const url = new URL(href, sourceUrl).toString();
      const response = await fetch(url, { headers: { "user-agent": "design-md-extractor" } });
      if (!response.ok) continue;
      chunks.push(await response.text());
    } catch {
      // Best effort: one blocked stylesheet should not make theme inference fail.
    }
  }
  return chunks.join("\n\n");
}

function extractStylesheetHrefs(html) {
  const hrefs = [];
  const linkRe = /<link\b[^>]*>/gi;
  let match;
  while ((match = linkRe.exec(html)) !== null) {
    const tag = match[0];
    if (!/\brel\s*=\s*["'][^"']*stylesheet[^"']*["']/i.test(tag)) continue;
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (href) hrefs.push(href);
  }
  return hrefs;
}

module.exports = {
  detectLiveThemeDefault,
  extractStylesheetHrefs,
  fetchLinkedCss,
};
