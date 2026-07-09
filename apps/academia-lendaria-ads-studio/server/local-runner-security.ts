/**
 * Boundary de segurança do runner Codex CLI local (STORY-8.W1.2).
 *
 * Este módulo concentra as primitivas de defesa da superfície
 * `/api/local/skills/:skillId/run`, mantendo `local-skill-runner.ts` focado
 * na execução do Codex CLI e `app.ts` focado no roteamento Fastify.
 *
 * Cobre:
 *   - AC1: resolução do host de bind com loopback (`127.0.0.1`) por padrão.
 *   - AC2: comparação de token em tempo constante (401 sem token / 403 inválido).
 *   - AC4: sanitização do ambiente do subprocesso Codex (remove chaves OpenAI).
 *   - AC5: limites de concorrência, payload e timeout (com kill escalonado).
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Header por onde o proxy Vite injeta o segredo local (AC3). */
export const LOCAL_RUNNER_TOKEN_HEADER = 'x-local-runner-token';

/**
 * Variáveis de ambiente removidas do subprocesso Codex (AC4). O Codex CLI local
 * autentica-se pela sessão do próprio CLI; nenhuma chave OpenAI deve vazar para
 * o processo filho agentic.
 */
export const CODEX_STRIPPED_ENV_KEYS = ['OPENAI_API_KEY', 'CODEX_API_KEY'] as const;

/** Host de loopback padrão — nunca escuta em interface pública sem opt-in. */
export const DEFAULT_LOCAL_BIND_HOST = '127.0.0.1';

export interface LocalRunnerLimits {
  /** Máximo de execuções Codex simultâneas antes de responder 429 (AC5). */
  maxConcurrency: number;
  /** Tamanho máximo do corpo aceito no endpoint de run, em bytes (AC5). */
  bodyLimitBytes: number;
  /** Timeout de execução do Codex CLI, em ms (AC5). */
  timeoutMs: number;
  /** Janela entre SIGTERM e SIGKILL no kill escalonado, em ms (AC5). */
  killGraceMs: number;
}

export const DEFAULT_LOCAL_RUNNER_LIMITS: LocalRunnerLimits = {
  maxConcurrency: 2,
  bodyLimitBytes: 256 * 1024,
  timeoutMs: 10 * 60 * 1000,
  killGraceMs: 5_000,
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

/** Resolve os limites operacionais a partir do ambiente, com defaults seguros. */
export function resolveLocalRunnerLimits(env: NodeJS.ProcessEnv = process.env): LocalRunnerLimits {
  return {
    maxConcurrency: parsePositiveInt(env.LOCAL_SKILL_RUNNER_MAX_CONCURRENCY, DEFAULT_LOCAL_RUNNER_LIMITS.maxConcurrency),
    bodyLimitBytes: parsePositiveInt(env.LOCAL_SKILL_RUNNER_BODY_LIMIT_BYTES, DEFAULT_LOCAL_RUNNER_LIMITS.bodyLimitBytes),
    timeoutMs: parsePositiveInt(env.CODEX_SKILL_TIMEOUT_MS, DEFAULT_LOCAL_RUNNER_LIMITS.timeoutMs),
    killGraceMs: parsePositiveInt(env.CODEX_SKILL_KILL_GRACE_MS, DEFAULT_LOCAL_RUNNER_LIMITS.killGraceMs),
  };
}

/**
 * Resolve o host de bind (AC1). Loopback por padrão; um bind público exige
 * `HOST` explicitamente configurado.
 */
export function resolveLocalBindHost(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.HOST?.trim();
  return configured ? configured : DEFAULT_LOCAL_BIND_HOST;
}

export interface ResolvedLocalRunnerToken {
  token: string;
  /** `true` quando gerado em memória por falta de segredo local configurado. */
  ephemeral: boolean;
}

/**
 * Resolve o token do boundary (AC2). Usa o segredo local
 * `LOCAL_SKILL_RUNNER_TOKEN` quando presente; caso contrário, gera um token
 * efêmero por processo. O runner falha fechado: sem um token válido, nenhuma
 * requisição é autorizada.
 */
export function resolveLocalRunnerToken(env: NodeJS.ProcessEnv = process.env): ResolvedLocalRunnerToken {
  const configured = env.LOCAL_SKILL_RUNNER_TOKEN?.trim();
  if (configured) return { token: configured, ephemeral: false };
  return { token: randomBytes(32).toString('hex'), ephemeral: true };
}

/**
 * Comparação de strings em tempo constante (AC2). Ambos os lados são reduzidos
 * a um digest SHA-256 de tamanho fixo antes do `timingSafeEqual`, o que elimina
 * o vazamento de timing por diferença de comprimento.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(a, 'utf8').digest();
  const digestB = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(digestA, digestB);
}

export type LocalRunnerAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 403; code: string; message: string };

/**
 * Autoriza uma requisição ao runner local (AC2):
 *   - token ausente/vazio → 401
 *   - token presente porém inválido → 403 (comparado em tempo constante)
 */
export function authorizeLocalRunnerRequest(
  providedToken: string | undefined,
  configuredToken: string,
): LocalRunnerAuthResult {
  if (!providedToken || providedToken.length === 0) {
    return {
      ok: false,
      status: 401,
      code: 'LOCAL_SKILL_RUNNER_UNAUTHENTICATED',
      message: 'Token do runner local ausente.',
    };
  }
  if (!timingSafeEqualStrings(providedToken, configuredToken)) {
    return {
      ok: false,
      status: 403,
      code: 'LOCAL_SKILL_RUNNER_FORBIDDEN',
      message: 'Token do runner local inválido.',
    };
  }
  return { ok: true };
}

export interface ConcurrencyLimiter {
  tryAcquire(): boolean;
  release(): void;
  readonly active: number;
  readonly max: number;
}

/**
 * Semáforo de contagem simples (AC5). Não enfileira: quando saturado,
 * `tryAcquire` retorna `false` e o endpoint responde 429 sem bloquear.
 */
export function createConcurrencyLimiter(max: number): ConcurrencyLimiter {
  const ceiling = Number.isFinite(max) && max > 0 ? Math.floor(max) : 1;
  let active = 0;
  return {
    tryAcquire() {
      if (active >= ceiling) return false;
      active += 1;
      return true;
    },
    release() {
      if (active > 0) active -= 1;
    },
    get active() {
      return active;
    },
    get max() {
      return ceiling;
    },
  };
}

/**
 * Copia o ambiente removendo as chaves OpenAI/Codex (AC4). Retorna uma cópia
 * rasa; o `process.env` original permanece intacto.
 */
export function sanitizeCodexEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const sanitized: NodeJS.ProcessEnv = { ...env };
  for (const key of CODEX_STRIPPED_ENV_KEYS) {
    delete sanitized[key];
  }
  return sanitized;
}
