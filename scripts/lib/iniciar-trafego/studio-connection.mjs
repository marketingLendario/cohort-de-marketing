import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const DEFAULT_BFF_PORT = 3002;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_MAX = 3;
const DEFAULT_RETRY_BASE_MS = 500;

function parsePort(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1024 && n <= 65535 ? n : fallback;
}

/** Fonte canônica cohort ↔ Studio (alinha marketing-studio.mjs). */
export function studioConnectionConfig() {
  const bffPort = parsePort(
    process.env.MARKETING_STUDIO_BFF_PORT,
    parsePort(process.env.MARKETING_STUDIO_PORT, DEFAULT_BFF_PORT),
  );
  const bffUrl =
    process.env.MARKETING_STUDIO_BFF_URL
    || process.env.LOCAL_BFF_URL
    || process.env.AIOX_STUDIO_BASE_URL
    || process.env.MARKETING_STUDIO_URL
    || `http://127.0.0.1:${bffPort}`;
  const token =
    process.env.LOCAL_SKILL_RUNNER_TOKEN
    || process.env.AIOX_LOCAL_RUNNER_TOKEN
    || process.env.LOCAL_RUNNER_TOKEN
    || '';
  const studioRoot = resolve(
    process.env.AIOX_STUDIO_ROOT
    || resolve(import.meta.dirname, '../../../../academia-lendaria-ads-studio'),
  );
  const runtimeId = createHash('sha256').update(studioRoot).digest('hex').slice(0, 12);
  const defaultRuntimeDir = resolve(tmpdir(), `marketing-studio-${runtimeId}`);
  const readinessFile = process.env.MARKETING_STUDIO_READINESS_FILE
    || join(defaultRuntimeDir, 'readiness.json');
  const stateFile = resolveReadinessSibling(readinessFile, 'state.json');
  return {
    bffUrl: bffUrl.replace(/\/$/, ''),
    bffPort,
    token,
    headerName: 'x-local-runner-token',
    healthPath: '/healthz',
    syncPath: '/api/local/traffic-start/sync',
    timeoutMs: Number(process.env.AIOX_STUDIO_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
    retryMax: Number(process.env.AIOX_STUDIO_RETRY_MAX) || DEFAULT_RETRY_MAX,
    retryBaseMs: Number(process.env.AIOX_STUDIO_RETRY_BASE_MS) || DEFAULT_RETRY_BASE_MS,
    readinessFile,
    stateFile,
  };
}

function resolveReadinessSibling(readinessFile, name) {
  if (!readinessFile) return '';
  try {
    return resolve(readinessFile, '..', name);
  } catch {
    return '';
  }
}

export function studioAuthHeaders(config = studioConnectionConfig()) {
  return config.token ? { [config.headerName]: config.token } : {};
}

export async function studioHealthCheck(config = studioConnectionConfig()) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const res = await fetch(`${config.bffUrl}${config.healthPath}`, {
      headers: studioAuthHeaders(config),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

export function readLauncherTokenFromState(config = studioConnectionConfig()) {
  if (config.token) return config.token;
  if (!config.stateFile || !existsSync(config.stateFile)) return '';
  try {
    const state = JSON.parse(readFileSync(config.stateFile, 'utf8'));
    return String(state?.localSkillRunnerToken || state?.token || '');
  } catch {
    return '';
  }
}

export async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function isAuthFailure(status, body) {
  if (status === 401 || status === 403) return true;
  const code = String(body?.code || '').toUpperCase();
  return code.includes('UNAUTHORIZED') || code.includes('FORBIDDEN') || code.includes('TOKEN');
}
