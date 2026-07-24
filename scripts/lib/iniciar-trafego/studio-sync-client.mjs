import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  isAuthFailure,
  readLauncherTokenFromState,
  sleep,
  studioAuthHeaders,
  studioConnectionConfig,
  studioHealthCheck,
} from './studio-connection.mjs';
import { validateStudioHandoff, validateStudioReadback } from './contract-validate.mjs';
import { ensureTrafficSyncRuntime } from '../iniciar-studio/coordinator.mjs';

function effectiveConfig() {
  const config = studioConnectionConfig();
  if (!config.token) {
    const fromState = readLauncherTokenFromState(config);
    if (fromState) config.token = fromState;
  }
  return config;
}

async function fetchWithRetry(path, init, config = effectiveConfig()) {
  let lastError = null;
  for (let attempt = 0; attempt <= config.retryMax; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const res = await fetch(`${config.bffUrl}${path}`, {
        ...init,
        headers: {
          ...(init.headers || {}),
          ...studioAuthHeaders(config),
        },
        signal: controller.signal,
      });
      const body = await res.json().catch(() => ({}));
      if (isAuthFailure(res.status, body)) {
        const err = new Error(body.message || body.code || `Autenticação Studio HTTP ${res.status}`);
        err.status = res.status;
        err.body = body;
        err.code = 'STUDIO_AUTH_FAILED';
        throw err;
      }
      if (!res.ok && res.status >= 500 && attempt < config.retryMax) {
        lastError = new Error(body.message || body.code || `Studio HTTP ${res.status}`);
        await sleep(config.retryBaseMs * (attempt + 1));
        continue;
      }
      return { res, body };
    } catch (error) {
      lastError = error;
      if (error?.code === 'STUDIO_AUTH_FAILED') throw error;
      if (attempt < config.retryMax) {
        await sleep(config.retryBaseMs * (attempt + 1));
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('Studio request failed');
}

export async function ensureStudioReady(projectRoot, intent) {
  const config = effectiveConfig();
  const health = await studioHealthCheck(config);
  if (health.ok) return { ok: true, mode: 'already_running', config };

  const ensured = await ensureTrafficSyncRuntime(projectRoot, intent);
  const configAfter = effectiveConfig();
  const healthAfter = await studioHealthCheck(configAfter);
  if (!healthAfter.ok) {
    return {
      ok: false,
      code: 'STUDIO_NOT_READY',
      message: 'Studio BFF indisponível após ensure interno',
      health: healthAfter,
      ensured,
    };
  }
  return { ok: true, mode: 'ensured', leaseId: ensured.leaseId, config: configAfter };
}

export async function syncTrafficStart(handoff, projectRoot, intentMeta = {}) {
  validateStudioHandoff(handoff);
  const handoffPath = intentMeta.handoffPath || resolve(projectRoot, '.aiox', 'studio-handoff.json');
  mkdirSync(dirname(handoffPath), { recursive: true });
  writeFileSync(handoffPath, `${JSON.stringify(handoff, null, 2)}\n`, 'utf8');
  const intent = {
    schemaVersion: '1.0.0',
    purpose: 'traffic-sync',
    projectRoot,
    handoffPath,
    proposalId: handoff.proposalId,
    proposalHash: handoff.proposalHash,
    runId: intentMeta.runId || '',
    leaseId: intentMeta.leaseId || '',
  };
  const ready = await ensureStudioReady(projectRoot, intent);
  if (!ready.ok) {
    const err = new Error(ready.message);
    err.code = ready.code;
    err.body = ready;
    throw err;
  }
  if (typeof intentMeta.beforePost === 'function') {
    await intentMeta.beforePost();
  }
  const config = effectiveConfig();
  const { res, body } = await fetchWithRetry(
    config.syncPath,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(handoff),
    },
    config,
  );
  if (!res.ok) {
    const err = new Error(body.message || body.code || `Studio sync HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return { ...body, leaseId: ready.leaseId ?? body.leaseId ?? null };
}

export async function readbackTrafficStart(receiptId) {
  const config = effectiveConfig();
  const { res, body } = await fetchWithRetry(`${config.syncPath}/${encodeURIComponent(receiptId)}`, { method: 'GET' }, config);
  if (!res.ok) {
    const err = new Error(body.message || body.code || `Studio readback HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  validateStudioReadback(body);
  return body;
}
