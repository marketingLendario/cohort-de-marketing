// ────────────────────────────────────────────────────────────────────
//  design-md — Standalone Claude Code Skill
//  Author: Alan Nicolas (@oalanicolas)
//  GitHub: https://github.com/oalanicolas
//  License: MIT
// ────────────────────────────────────────────────────────────────────

"use strict";

const axios = require("axios");
const cheerio = require("cheerio");
const { URL: NodeURL } = require("url");

// Whitelist of diagnostic headers to preserve (AC6.2)
// Excludes cookie, set-cookie, authorization and other sensitive headers
const HEADER_WHITELIST = [
  "server", "x-powered-by", "x-vercel-id", "cf-ray", "x-fastly-request-id",
  "x-amz-cf-id", "x-cdn", "via", "x-shopify-stage", "x-shopid",
  "x-github-request-id", "x-cache", "x-nf-request-id",
];

// ── HTML fetch ──────────────────────────────────────────────────────
// Returns { html, headers } where headers contains only whitelisted diagnostic keys (lowercased)
async function fetchHtml(url) {
  const res = await axios.get(url, {
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    maxRedirects: 5,
  });

  const rawHeaders = res.headers || {};
  const responseHeaders = {};
  for (const key of HEADER_WHITELIST) {
    const val = rawHeaders[key];
    if (val !== undefined && val !== null) {
      responseHeaders[key] = String(val);
    }
  }

  return { html: res.data, headers: responseHeaders };
}

// ── CSS fetching with @import recursion ─────────────────────────────
async function fetchCssOnce(absolute, fetched) {
  if (fetched.has(absolute)) return null;
  fetched.add(absolute);
  try {
    const res = await axios.get(absolute, {
      timeout: 15000,
      responseType: "text",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; design-ops-extractor/0.1)" },
    });
    return typeof res.data === "string" ? res.data : "";
  } catch (err) {
    return `/* FAILED ${absolute}: ${err.message} */`;
  }
}

async function resolveImports(cssText, baseUrl, fetched, depth = 0) {
  if (depth >= 2) return cssText;
  const re = /@import\s+(?:url\(\s*)?["']?([^"')\s]+)["']?\s*\)?\s*([^;]*);/gi;
  const matches = [...cssText.matchAll(re)];
  if (!matches.length) return cssText;

  let resolved = cssText;
  for (const m of matches) {
    const importUrl = m[1];
    try {
      const absolute = new NodeURL(importUrl, baseUrl).toString();
      const importedCss = await fetchCssOnce(absolute, fetched);
      if (importedCss == null) continue;
      const recursive = await resolveImports(importedCss, absolute, fetched, depth + 1);
      resolved = resolved.replace(
        m[0],
        `/* ── @import → ${absolute} ── */\n${recursive}\n/* ── /@import ── */`
      );
    } catch {
      // ignore unresolvable
    }
  }
  return resolved;
}

async function collectCss(html, baseUrl) {
  const $ = cheerio.load(html);
  const cssChunks = [];
  const meta = {
    external: [],
    preload: [],
    inline_style_blocks: 0,
    inline_style_attrs: 0,
    imports_resolved: 0,
    failed: [],
  };
  const fetched = new Set();

  const stylesheetHrefs = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) stylesheetHrefs.push(href);
  });

  const preloadHrefs = [];
  $('link[rel="preload"][as="style"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) preloadHrefs.push(href);
  });

  $('link[href$=".css"], link[href*=".css?"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href && !stylesheetHrefs.includes(href) && !preloadHrefs.includes(href)) {
      stylesheetHrefs.push(href);
    }
  });

  for (const href of [...stylesheetHrefs, ...preloadHrefs]) {
    try {
      const absolute = new NodeURL(href, baseUrl).toString();
      let cssText = await fetchCssOnce(absolute, fetched);
      if (cssText == null) continue;
      const before = fetched.size;
      cssText = await resolveImports(cssText, absolute, fetched);
      meta.imports_resolved += fetched.size - before;
      cssChunks.push(`/* ── ${absolute} ── */\n${cssText}\n`);
      if (preloadHrefs.includes(href)) meta.preload.push(absolute);
      else meta.external.push(absolute);
    } catch (err) {
      meta.failed.push({ href, error: err.message });
      cssChunks.push(`/* ── FAILED ${href}: ${err.message} ── */\n`);
    }
  }

  for (const el of $("style").toArray()) {
    let css = $(el).html();
    if (!css || !css.trim()) continue;
    css = await resolveImports(css, baseUrl, fetched);
    cssChunks.push(`/* ── inline <style> #${++meta.inline_style_blocks} ── */\n${css}\n`);
  }

  $("[style]").each((_, el) => {
    const s = $(el).attr("style");
    if (s) {
      cssChunks.push(`/* ── inline style="" attr ── */\n.__inline${++meta.inline_style_attrs} { ${s} }\n`);
    }
  });

  return { css: cssChunks.join("\n"), meta };
}

// ── Favicon (best-effort, multi-path fallback) ──────────────────────
async function fetchFavicon(html, baseUrl) {
  const $ = cheerio.load(html);
  const candidates = [];
  const seen = new Set();
  const pushIfNew = (href) => {
    if (!href || seen.has(href)) return;
    seen.add(href);
    candidates.push(href);
  };
  $('link[rel="apple-touch-icon"]').each((_, el) => pushIfNew($(el).attr("href")));
  $('link[rel="apple-touch-icon-precomposed"]').each((_, el) => pushIfNew($(el).attr("href")));
  $('link[rel="icon"]').each((_, el) => pushIfNew($(el).attr("href")));
  $('link[rel="shortcut icon"]').each((_, el) => pushIfNew($(el).attr("href")));
  $('meta[property="og:image"]').each((_, el) => pushIfNew($(el).attr("content")));
  pushIfNew("/favicon.svg");
  pushIfNew("/favicon.ico");
  pushIfNew("/apple-touch-icon.png");

  for (const href of candidates) {
    try {
      const absolute = new NodeURL(href, baseUrl).toString();
      const res = await axios.get(absolute, {
        timeout: 8000,
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; design-ops-extractor/0.1)" },
        maxContentLength: 1024 * 1024,
      });
      if (!res.data || res.data.length === 0) continue;
      const ct = res.headers["content-type"] || "";
      if (/^text\/html/i.test(ct)) continue;
      const mime =
        /svg/i.test(ct) ? "image/svg+xml" :
        /png/i.test(ct) ? "image/png" :
        /jpe?g/i.test(ct) ? "image/jpeg" :
        /ico|x-icon/i.test(ct) ? "image/x-icon" :
        /webp/i.test(ct) ? "image/webp" :
        href.endsWith(".svg") ? "image/svg+xml" :
        href.endsWith(".png") ? "image/png" :
        href.endsWith(".ico") ? "image/x-icon" : "image/png";
      const b64 = Buffer.from(res.data).toString("base64");
      return { dataUrl: `data:${mime};base64,${b64}`, sourceUrl: absolute, size: res.data.length, mime };
    } catch {
      // try next candidate
    }
  }
  return null;
}

// ── Logo (priority hierarchy + sprite/icon rejection) ───────────────
async function fetchLogo(html, baseUrl) {
  const $ = cheerio.load(html);
  const candidates = [];
  const pushIfNew = (src, scope, priority) => {
    if (!src) return;
    if (candidates.some(c => c.src === src)) return;
    candidates.push({ src, scope, priority });
  };

  const isLikelyLogo = (svgOuter) => {
    if (!svgOuter) return false;
    if (/<use\s/i.test(svgOuter) && (svgOuter.match(/<path/g) || []).length === 0) return false;
    const pathCount = (svgOuter.match(/<path/g) || []).length;
    const hasText = /<text|<tspan/i.test(svgOuter);
    return pathCount >= 2 || hasText;
  };

  // P1: <svg>/<img> inside link with logo signals
  $('a').each((_, anchor) => {
    const $anchor = $(anchor);
    const cls = ($anchor.attr("class") || "").toLowerCase();
    const aria = ($anchor.attr("aria-label") || "").toLowerCase();
    const id = ($anchor.attr("id") || "").toLowerCase();
    const href = $anchor.attr("href") || "";
    const isHomeLink = href === "/" || href === "./" || href === "#" || href === "" ||
      /home|brand|logo/i.test(cls) || /home|brand|logo/i.test(aria) || /home|brand|logo/i.test(id);
    if (!isHomeLink) return;
    $anchor.find("img").each((_, el) => {
      pushIfNew($(el).attr("src") || $(el).attr("data-src"), `<a class="${cls.slice(0,40)}"> > <img>`, 1);
    });
    $anchor.find("svg").each((_, el) => {
      const outer = $.html(el);
      if (outer && outer.length >= 150 && outer.length < 50000 && isLikelyLogo(outer)) {
        candidates.push({ inlineSvg: outer, scope: `<a> > <svg>`, priority: 1 });
      }
    });
  });

  // P2: <img class*="logo">
  $('img[class*="logo" i], img[id*="logo" i]').each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src") || $el.attr("data-src");
    if (!src) return;
    if (/hero|banner|cover|wallpaper|product|gallery|story|illustration/i.test(src)) return;
    pushIfNew(src, `<img class="${($el.attr("class") || "").slice(0, 40)}">`, 2);
  });

  // P3: <img alt="logo">
  $('img[alt*="logo" i]').each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (!src) return;
    if (/hero|banner|cover|wallpaper|product|gallery|story|illustration/i.test(src)) return;
    pushIfNew(src, `<img alt="logo">`, 3);
  });

  // P4: header/nav scoped svgs
  $('header [class*="logo" i] svg, header [id*="logo" i] svg, nav [class*="logo" i] svg, nav [id*="logo" i] svg, [class*="brand-logo" i] svg, [class*="brandmark" i] svg, [class*="globalnav" i] svg').slice(0, 5).each((_, el) => {
    const outer = $.html(el);
    if (outer && outer.length >= 150 && outer.length < 50000 && isLikelyLogo(outer)) {
      candidates.push({ inlineSvg: outer, scope: `inline svg in branded scope`, priority: 4 });
    }
  });

  // P5: header/nav direct child svg
  $('header > svg, header > a > svg, header > div > svg, header > div > a > svg, nav > svg, nav > a > svg').slice(0, 3).each((_, el) => {
    const outer = $.html(el);
    if (outer && outer.length >= 150 && outer.length < 50000 && isLikelyLogo(outer)) {
      candidates.push({ inlineSvg: outer, scope: `header/nav direct child svg`, priority: 5 });
    }
  });

  // P6: <noscript> fallback (Next.js SPA static HTML escape hatch)
  $('noscript').each((_, el) => {
    const noscriptHtml = $(el).html() || "";
    if (!noscriptHtml) return;
    const $$ = cheerio.load(noscriptHtml);
    $$('a img').each((_, img) => {
      const src = $$(img).attr("src");
      const cls = ($$(img).attr("class") || "").toLowerCase();
      const alt = ($$(img).attr("alt") || "").toLowerCase();
      if (src && (/logo|brand/i.test(cls) || /logo|brand/i.test(alt))) {
        pushIfNew(src, "<noscript> > <img>", 6);
      }
    });
  });

  // P7: og:logo / og:image:logo / og:image
  $('meta[property="og:logo"], meta[property="og:image:logo"]').each((_, el) => {
    pushIfNew($(el).attr("content"), $(el).attr("property"), 7);
  });
  $('meta[property="og:image"]').each((_, el) => {
    pushIfNew($(el).attr("content"), "og:image", 8);
  });

  // P9: PWA manifest icons
  const manifestHrefs = [];
  $('link[rel="manifest"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) manifestHrefs.push(href);
  });
  for (const mhref of manifestHrefs) {
    try {
      const absoluteManifest = new NodeURL(mhref, baseUrl).toString();
      const res = await axios.get(absoluteManifest, { timeout: 6000, responseType: "json" });
      const manifest = typeof res.data === "object" ? res.data : null;
      if (manifest && Array.isArray(manifest.icons)) {
        const sortedIcons = [...manifest.icons].sort((a, b) => {
          const parseSize = (s) => parseInt(String(s || "0").split("x")[0], 10) || 0;
          return parseSize(b.sizes) - parseSize(a.sizes);
        });
        for (const icon of sortedIcons) {
          if (!icon.src) continue;
          try {
            const iconAbsolute = new NodeURL(icon.src, absoluteManifest).toString();
            pushIfNew(iconAbsolute, `manifest icon ${icon.sizes || ""}`, 9);
          } catch {}
        }
      }
    } catch {}
  }

  candidates.sort((a, b) => a.priority - b.priority);

  for (const c of candidates) {
    if (c.inlineSvg) {
      const svgClean = c.inlineSvg.replace(/^(<svg[^>]*)\s(width|height)\s*=\s*["'][^"']*["']/g, "$1");
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgClean)}`;
      return { dataUrl, sourceUrl: null, size: svgClean.length, mime: "image/svg+xml", source: c.scope, kind: "svg-inline" };
    }
    try {
      const absolute = new NodeURL(c.src, baseUrl).toString();
      const res = await axios.get(absolute, {
        timeout: 8000,
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; design-ops-extractor/0.1)" },
        maxContentLength: 2 * 1024 * 1024,
      });
      if (!res.data || res.data.length === 0) continue;
      const ct = res.headers["content-type"] || "";
      if (/^text\/html/i.test(ct)) continue;
      if (res.data.length > 200 * 1024) continue;
      const mime =
        /svg/i.test(ct) ? "image/svg+xml" :
        /png/i.test(ct) ? "image/png" :
        /jpe?g/i.test(ct) ? "image/jpeg" :
        /webp/i.test(ct) ? "image/webp" :
        absolute.endsWith(".svg") ? "image/svg+xml" :
        absolute.endsWith(".png") ? "image/png" :
        "image/png";
      if (mime === "image/jpeg" && res.data.length > 30 * 1024) continue;
      const b64 = Buffer.from(res.data).toString("base64");
      return { dataUrl: `data:${mime};base64,${b64}`, sourceUrl: absolute, size: res.data.length, mime, source: c.scope, kind: mime.includes("svg") ? "svg" : "img" };
    } catch {
      continue;
    }
  }

  return null;
}

// ── Font file embedding (cross-origin CORS bypass via data: URL) ────
const KNOWN_GOOGLE_FONTS = new Set([
  "inter", "manrope", "geist", "geist sans", "geist mono", "roboto", "open sans",
  "lato", "montserrat", "poppins", "noto sans", "noto serif", "playfair display",
  "merriweather", "raleway", "ubuntu", "oswald", "source sans pro", "source code pro",
  "fira code", "fira sans", "ibm plex sans", "ibm plex serif", "ibm plex mono",
  "jetbrains mono", "space grotesk", "space mono", "dm sans", "dm serif display",
  "instrument serif", "instrument sans", "outfit", "plus jakarta sans", "figtree",
  "work sans", "rubik", "barlow", "karla", "nunito", "nunito sans", "quicksand",
  "pt sans", "pt serif", "crimson text", "lora", "bitter", "cormorant",
]);

async function embedFontFiles(fontFaces, sourceUrl, requestedFamilies) {
  const embedded = {};
  if (!Array.isArray(fontFaces) || fontFaces.length === 0) return embedded;
  const requested = new Set((requestedFamilies || []).map(f => String(f).trim().toLowerCase().replace(/^"|"$/g, "")));
  const familyWeights = {};
  for (const face of fontFaces) {
    if (!face.family || !face.src_urls || face.src_urls.length === 0) continue;
    const familyLower = String(face.family).toLowerCase().replace(/^"|"$/g, "").trim();
    if (KNOWN_GOOGLE_FONTS.has(familyLower)) continue;
    if (requested.size > 0 && !requested.has(familyLower)) continue;
    if (!familyWeights[familyLower]) familyWeights[familyLower] = [];
    if (familyWeights[familyLower].length >= 2) continue;
    familyWeights[familyLower].push(face);
  }
  const allFaces = Object.values(familyWeights).flat().slice(0, 8);

  for (const face of allFaces) {
    const sortedUrls = [...face.src_urls.entries()]
      .sort((a, b) => {
        const fa = (face.src_formats && face.src_formats[a[0]]) || "";
        const fb = (face.src_formats && face.src_formats[b[0]]) || "";
        const score = (f) => /woff2/i.test(f) ? 0 : /woff/i.test(f) ? 1 : /truetype|ttf/i.test(f) ? 2 : 3;
        return score(fa) - score(fb);
      })
      .map(([, u]) => u);

    const baseUrl = face.source_css_url || sourceUrl;
    for (const u of sortedUrls.slice(0, 1)) {
      try {
        const absolute = new NodeURL(u, baseUrl).toString();
        if (embedded[absolute]) break;
        const res = await axios.get(absolute, {
          timeout: 10000,
          responseType: "arraybuffer",
          maxContentLength: 1.5 * 1024 * 1024,
        });
        if (!res.data || res.data.length === 0) continue;
        const ct = res.headers["content-type"] || "";
        const mime =
          /woff2/i.test(ct) || absolute.endsWith(".woff2") ? "font/woff2" :
          /woff/i.test(ct) || absolute.endsWith(".woff") ? "font/woff" :
          /ttf|truetype/i.test(ct) || absolute.endsWith(".ttf") ? "font/ttf" :
          /otf/i.test(ct) || absolute.endsWith(".otf") ? "font/otf" :
          "font/woff2";
        const b64 = Buffer.from(res.data).toString("base64");
        embedded[absolute] = `data:${mime};base64,${b64}`;
        break;
      } catch {
        continue;
      }
    }
  }
  return embedded;
}

module.exports = {
  fetchHtml,
  fetchCssOnce,
  resolveImports,
  collectCss,
  fetchFavicon,
  fetchLogo,
  embedFontFiles,
  KNOWN_GOOGLE_FONTS,
  HEADER_WHITELIST,
};
