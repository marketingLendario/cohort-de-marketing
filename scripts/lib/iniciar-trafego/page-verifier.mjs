import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inspectConversionDestination, inspectPixel, isHttpsUrl, stripHtmlComments } from '../iniciar-trafego-gates.mjs';
import { writeJson } from './project-context.mjs';

export const DEPLOYMENT_REL = 'pagina/deployment.json';
export const MAX_FETCH_ATTEMPTS = 3;
export const FETCH_TIMEOUT_MS = 12_000;

const REJECT_HOST_PATTERNS = [
  /^pay\.hotmart\.com$/i,
  /^checkout\./i,
  /^(www\.)?(facebook|instagram|twitter|x|tiktok|linkedin)\.com$/i,
  /^fonts\.googleapis\.com$/i,
  /^cdn\./i,
];

export class PageVerifyError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'PageVerifyError';
    this.code = code;
    this.details = details;
  }
}

export function readDeployment(projectRoot) {
  const path = join(projectRoot, DEPLOYMENT_REL);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function sha256LocalPage(projectRoot) {
  const htmlPath = join(projectRoot, 'pagina/index.html');
  if (!existsSync(htmlPath)) return '';
  return createHash('sha256').update(readFileSync(htmlPath)).digest('hex');
}

export function classifyLandingUrl(url) {
  if (!isHttpsUrl(url)) {
    return { ok: false, code: 'BLOCKED_PAGE_NOT_PUBLISHED', reason: 'URL deve ser HTTPS valida' };
  }
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { ok: false, code: 'BLOCKED_PAGE_NOT_PUBLISHED', reason: 'URL malformada' };
  }
  if (REJECT_HOST_PATTERNS.some((re) => re.test(parsed.hostname))) {
    return { ok: false, code: 'BLOCKED_PAGE_NOT_PUBLISHED', reason: `Host rejeitado como landing: ${parsed.hostname}` };
  }
  if (/\.(css|js|png|jpe?g|webp|svg|woff2?|ico|pdf)(\?|$)/i.test(parsed.pathname)) {
    return { ok: false, code: 'BLOCKED_PAGE_NOT_PUBLISHED', reason: 'URL parece asset estatico, nao landing' };
  }
  return { ok: true, hostname: parsed.hostname };
}

export function extractPageIdentityMarker(html) {
  const stripped = stripHtmlComments(String(html ?? ''));
  const title = stripped.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? '';
  const h1 = stripped.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ?? '';
  const marker = [title, h1].filter(Boolean).join(' | ').slice(0, 240);
  return marker || createHash('sha256').update(stripped.slice(0, 4000)).digest('hex').slice(0, 16);
}

export function verifyPageIdentity(localHtml, remoteHtml) {
  const marker = extractPageIdentityMarker(localHtml);
  if (!marker) return { ok: false, reason: 'pagina local sem marcador identificavel' };
  const remote = stripHtmlComments(String(remoteHtml ?? ''));
  if (remote.includes(marker)) return { ok: true, marker };
  const remoteMarker = extractPageIdentityMarker(remoteHtml);
  if (marker.length >= 8 && remoteMarker === marker) return { ok: true, marker };
  return { ok: false, reason: 'identidade local/publicada divergente', marker, remoteMarker };
}

export function analyzeRemoteHtml(remoteHtml, conversionMode = 'direct_checkout') {
  const body = stripHtmlComments(String(remoteHtml ?? ''));
  const pixel = inspectPixel(body);
  const conversion = inspectConversionDestination(body, conversionMode);
  return {
    pixelOk: pixel.ok,
    pixel,
    checkoutOk: conversionMode === 'direct_checkout' ? conversion.ok : null,
    conversionOk: conversion.ok,
    conversion,
  };
}

export async function fetchWithRetry(url, fetchImpl = fetch, options = {}) {
  const attempts = options.maxAttempts ?? MAX_FETCH_ATTEMPTS;
  const timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS;
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'user-agent': 'AIOX-iniciar-trafego-page-verifier/1.0' },
        signal: controller.signal,
      });
      const body = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        finalUrl: res.url || url,
        body,
        attempt,
      };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(400 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new PageVerifyError('BLOCKED_PAGE_UNREACHABLE', `Pagina inacessivel apos ${attempts} tentativas`, {
    cause: lastError instanceof Error ? lastError.message : String(lastError),
  });
}

export async function verifyPublishedPage(projectRoot, url, input = {}) {
  const fetchImpl = input.fetch ?? fetch;
  const conversionMode = input.conversionMode ?? 'direct_checkout';
  const localHtml = readProjectFile(projectRoot, 'pagina/index.html');

  const classified = classifyLandingUrl(url);
  if (!classified.ok) {
    throw new PageVerifyError(classified.code, classified.reason);
  }
  if (!localHtml) {
    throw new PageVerifyError('BLOCKED_LOCAL_PAGE_MISSING', 'pagina/index.html ausente no projeto');
  }

  const remote = await fetchWithRetry(url.trim(), fetchImpl, input);
  if (remote.status < 200 || remote.status >= 400) {
    throw new PageVerifyError('BLOCKED_PAGE_UNREACHABLE', `HTTP ${remote.status} ao acessar landing publicada`, {
      httpStatus: remote.status,
      finalUrl: remote.finalUrl,
    });
  }

  const identity = verifyPageIdentity(localHtml, remote.body);
  if (!identity.ok) {
    throw new PageVerifyError('BLOCKED_PAGE_IDENTITY_MISMATCH', identity.reason, identity);
  }

  const remoteChecks = analyzeRemoteHtml(remote.body, conversionMode);
  if (!remoteChecks.pixelOk) {
    throw new PageVerifyError('BLOCKED_PIXEL_NOT_PUBLISHED', 'Pixel nao encontrado no HTML publicado (fora de comentario)', {
      httpStatus: remote.status,
      finalUrl: remote.finalUrl,
    });
  }
  if (!remoteChecks.conversionOk) {
    throw new PageVerifyError(
      conversionMode === 'direct_checkout' ? 'BLOCKED_CHECKOUT' : 'BLOCKED_APPLICATION_DESTINATION',
      conversionMode === 'direct_checkout'
        ? 'Checkout Hotmart com sck ausente no HTML publicado'
        : 'Destino de aplicação e evento de lead não estão operacionais no HTML publicado',
      {
        httpStatus: remote.status,
        finalUrl: remote.finalUrl,
        conversion: remoteChecks.conversion,
      },
    );
  }

  return {
    schemaVersion: '1.0.0',
    environment: 'production',
    url: url.trim(),
    provider: input.provider ?? 'remote-verify',
    origin: input.origin ?? 'set-page-url',
    deployedAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    localPageSha256: sha256LocalPage(projectRoot),
    remotePageSha256: createHash('sha256').update(remote.body).digest('hex'),
    status: 'verified',
    httpStatus: remote.status,
    finalUrl: remote.finalUrl,
    identityMatch: true,
    identityMarker: identity.marker,
    remotePixelOk: true,
    remoteCheckoutOk: conversionMode === 'direct_checkout' ? true : null,
    remoteConversionOk: true,
    conversionMode,
    conversionEvidence: remoteChecks.conversion,
    attempts: remote.attempt,
  };
}

export async function verifyAndWriteDeployment(projectRoot, url, input = {}) {
  const path = join(projectRoot, DEPLOYMENT_REL);
  try {
    const record = await verifyPublishedPage(projectRoot, url, input);
    writeJson(path, record);
    return record;
  } catch (error) {
    if (error instanceof PageVerifyError && error.code === 'BLOCKED_PAGE_UNREACHABLE') {
      const record = {
        schemaVersion: '1.0.0',
        environment: 'production',
        url: String(url).trim(),
        provider: input.provider ?? 'remote-verify',
        origin: input.origin ?? 'set-page-url',
        deployedAt: new Date().toISOString(),
        status: 'unverified',
        verificationCode: error.code,
        verificationError: error.message,
      };
      writeJson(path, record);
      error.details = { ...(error.details ?? {}), deployment: record };
    }
    throw error;
  }
}

export function resolvePublishedUrl(projectRoot, assessment) {
  const dep = readDeployment(projectRoot);
  if (dep?.url && isHttpsUrl(dep.url) && dep.status === 'verified') return dep.url.trim();
  return assessment?.pageOk ? assessment.publishedUrl ?? '' : '';
}

export function persistSyncReceipt(projectRoot, receipt) {
  const id = receipt.receiptId || `rcpt_${Date.now()}`;
  const path = join(projectRoot, '.aiox/iniciar-trafego/receipts', `${id}.json`);
  writeJson(path, { schemaVersion: '1.0.0', ...receipt, receiptId: id, syncedAt: new Date().toISOString() });
  return path;
}

function readProjectFile(projectRoot, rel) {
  const p = join(projectRoot, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @deprecated use verifyAndWriteDeployment — nao grava verified sem HTTP */
export function writeDeployment(projectRoot, url, localPageSha256 = '') {
  throw new Error('writeDeployment sincrono desativado — use verifyAndWriteDeployment ou set-page-url');
}
