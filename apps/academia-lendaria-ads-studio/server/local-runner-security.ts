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
 *   - AC4: sanitização do ambiente do subprocesso Codex por ALLOWLIST operacional
 *     (só PATH/HOME, locale e temporários chegam ao filho; segredos nunca).
 *   - AC5: limites de concorrência, payload e timeout (com kill escalonado).
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Header por onde o proxy Vite injeta o segredo local (AC3). */
export const LOCAL_RUNNER_TOKEN_HEADER = 'x-local-runner-token';

/**
 * Allowlist operacional do ambiente do subprocesso Codex (AC4 / QA-W2B1-04).
 *
 * O modelo é allowlist, não denylist: por padrão o processo filho agentic NÃO
 * herda nada de `process.env` além do mínimo que o Codex CLI local precisa para
 * rodar — localizar binários (`PATH`), autenticar pela sessão do próprio CLI
 * (`HOME`/`CODEX_HOME` → `~/.codex`), locale e temporários. Assim segredos como
 * `SUPABASE_SERVICE_ROLE_KEY`, `LOCAL_SKILL_RUNNER_TOKEN`, `APIFY_TOKEN`,
 * `OPENAI_API_KEY`/`CODEX_API_KEY` e QUALQUER outra variável arbitrária nunca
 * chegam ao filho — mesmo que um SKILL.md/brief prompt-injetado tente lê-los e
 * embuti-los na proposta (o canal de saída legítimo do filho).
 */
export const CODEX_ENV_ALLOWLIST = [
  'PATH',
  'HOME',
  'SHELL',
  'USER',
  'LOGNAME',
  'TERM',
  'TMPDIR',
  'TEMP',
  'TMP',
  'LANG',
  'LANGUAGE',
  'TZ',
  // Diretório de config/sessão do Codex CLI (caminho, não segredo): sem ele o
  // CLI perderia a autenticação de sessão local quando o operador o customiza.
  'CODEX_HOME',
  // Base dirs XDG (caminhos) — resolução de config/cache do CLI, nunca segredos.
  'XDG_CONFIG_HOME',
  'XDG_CACHE_HOME',
  'XDG_DATA_HOME',
  'XDG_RUNTIME_DIR',
] as const;

/** Prefixos sempre liberados: todas as categorias de locale (`LC_ALL`, `LC_CTYPE`, ...). */
const CODEX_ENV_ALLOWLIST_PREFIXES = ['LC_'] as const;

/**
 * Escape hatch controlado pelo operador: chaves extras liberadas EXPLICITAMENTE
 * via `CODEX_ENV_ALLOWLIST` (lista separada por vírgula). Vazio por padrão — a
 * postura segura nunca depende dessa lista, que só existe para o caso de o CLI
 * passar a precisar de uma variável operacional nova sem exigir mudança de código.
 */
function operatorEnvAllowlist(env: NodeJS.ProcessEnv): string[] {
  return (env.CODEX_ENV_ALLOWLIST ?? '')
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}

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
 * Constrói o ambiente do subprocesso Codex por ALLOWLIST (AC4 / QA-W2B1-04):
 * apenas as chaves operacionais essenciais (`CODEX_ENV_ALLOWLIST` + prefixos de
 * locale + o escape hatch do operador) são copiadas. Tudo o mais — incluindo
 * qualquer segredo herdado — é descartado por padrão. Retorna uma cópia nova; o
 * `process.env` original permanece intacto.
 */
export function sanitizeCodexEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const allowed = new Set<string>([...CODEX_ENV_ALLOWLIST, ...operatorEnvAllowlist(env)]);
  const sanitized: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue;
    if (key === 'CODEX_ENV_ALLOWLIST') continue; // config do próprio boundary, não repassa
    const permitted = allowed.has(key) || CODEX_ENV_ALLOWLIST_PREFIXES.some((prefix) => key.startsWith(prefix));
    if (permitted) sanitized[key] = value;
  }
  return sanitized;
}

/** Erro de integridade de tenant: workspace informado não bate com o do projeto (QA-W2B1-03). */
export class WorkspaceMismatchError extends Error {
  readonly projectId: string;
  constructor(projectId: string) {
    super(`Workspace informado não corresponde ao projeto ${projectId}.`);
    this.name = 'WorkspaceMismatchError';
    this.projectId = projectId;
  }
}

/**
 * Resolve o eixo de tenant (`workspace_id`) de uma escrita service-role sobre um
 * projeto (QA-W2B1-03). O writer service-role IGNORA a RLS, então o workspace
 * NUNCA pode ser asserido pelo cliente contra um valor derivado:
 *   - `derived` presente (workspace do projeto, lido de `marketing_projects`):
 *     um `provided` divergente é rejeitado (`WorkspaceMismatchError`); um
 *     `provided` ausente ou igual usa o derivado.
 *   - `derived` ausente (sem DB / fallback in-memory de dev, sem writer
 *     service-role a proteger): usa `provided` ou, na falta, o próprio `projectId`.
 */
export function resolveTenantWorkspaceId(
  projectId: string,
  provided: string | undefined,
  derived: string | null,
): string {
  if (derived) {
    if (provided && provided !== derived) throw new WorkspaceMismatchError(projectId);
    return derived;
  }
  return provided ?? projectId;
}
