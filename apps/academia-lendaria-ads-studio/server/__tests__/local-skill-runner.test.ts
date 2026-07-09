import { writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { CodexCliLocalSkillRunner, type LocalSkillRunner } from '../local-skill-runner.js';
import {
  LOCAL_RUNNER_TOKEN_HEADER,
  authorizeLocalRunnerRequest,
  createConcurrencyLimiter,
  resolveLocalBindHost,
  resolveLocalRunnerToken,
  sanitizeCodexEnv,
  timingSafeEqualStrings,
} from '../local-runner-security.js';

const TOKEN = 'test-token-secret-value';

/** Runner de teste que sempre devolve uma proposta estruturada mínima. */
function stubRunner(overrides: Partial<LocalSkillRunner> = {}): LocalSkillRunner {
  return {
    async run(skillId) {
      return {
        skillId,
        skillHash: 'hash-1',
        model: 'test-model',
        proposal: {
          summary: 'Proposta pronta',
          resultMarkdown: '# Resultado',
          artifacts: [],
          fields: [],
          questions: [],
          warnings: [],
        },
      };
    },
    ...overrides,
  };
}

describe('local skill runner endpoint', () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('keeps the local runner disabled by default', async () => {
    const app = await buildApp({ campaignRepo: null, skillRunner: null });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      payload: { projectId: 'project-1', brief: {} },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json().code).toBe('LOCAL_SKILL_RUNNER_DISABLED');
  });

  it('returns a structured proposal from an injected runner when authorized', async () => {
    const app = await buildApp({ campaignRepo: null, skillRunner: stubRunner(), localRunnerToken: TOKEN });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      headers: { [LOCAL_RUNNER_TOKEN_HEADER]: TOKEN },
      payload: { projectId: 'project-1', brief: { project: { slug: 'demo' } } },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ skillId: 'offerbook', skillHash: 'hash-1', model: 'test-model' });
  });

  it('rejects malformed input before invoking the runner (authorized)', async () => {
    let called = false;
    const runner = stubRunner({
      async run() {
        called = true;
        throw new Error('should not run');
      },
    });
    const app = await buildApp({ campaignRepo: null, skillRunner: runner, localRunnerToken: TOKEN });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      headers: { [LOCAL_RUNNER_TOKEN_HEADER]: TOKEN },
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(called).toBe(false);
  });

  // --- AC2: boundary autenticado por token ---

  it('returns 401 when the token header is absent', async () => {
    let called = false;
    const runner = stubRunner({
      async run() {
        called = true;
        return { skillId: 'x', skillHash: 'h', model: 'm', proposal: { summary: '', resultMarkdown: '', artifacts: [], fields: [], questions: [], warnings: [] } };
      },
    });
    const app = await buildApp({ campaignRepo: null, skillRunner: runner, localRunnerToken: TOKEN });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      payload: { projectId: 'project-1', brief: {} },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe('LOCAL_SKILL_RUNNER_UNAUTHENTICATED');
    expect(called).toBe(false);
  });

  it('returns 403 when the token is present but incorrect', async () => {
    let called = false;
    const runner = stubRunner({
      async run() {
        called = true;
        return { skillId: 'x', skillHash: 'h', model: 'm', proposal: { summary: '', resultMarkdown: '', artifacts: [], fields: [], questions: [], warnings: [] } };
      },
    });
    const app = await buildApp({ campaignRepo: null, skillRunner: runner, localRunnerToken: TOKEN });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      headers: { [LOCAL_RUNNER_TOKEN_HEADER]: 'wrong-token' },
      payload: { projectId: 'project-1', brief: {} },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe('LOCAL_SKILL_RUNNER_FORBIDDEN');
    expect(called).toBe(false);
  });

  // --- AC5: limites de concorrência e payload ---

  it('returns 429 when the concurrency limit is exhausted', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolveGate) => {
      release = resolveGate;
    });
    const runner = stubRunner({
      async run(skillId) {
        await gate;
        return { skillId, skillHash: 'h', model: 'm', proposal: { summary: '', resultMarkdown: '', artifacts: [], fields: [], questions: [], warnings: [] } };
      },
    });
    const app = await buildApp({
      campaignRepo: null,
      skillRunner: runner,
      localRunnerToken: TOKEN,
      localRunnerLimits: { maxConcurrency: 1 },
    });
    apps.push(app);

    const headers = { [LOCAL_RUNNER_TOKEN_HEADER]: TOKEN };
    const payload = { projectId: 'project-1', brief: {} };
    const first = app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', headers, payload });
    // Give the first request time to acquire the single slot.
    await new Promise((r) => setTimeout(r, 20));
    const second = await app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', headers, payload });
    expect(second.statusCode).toBe(429);
    expect(second.json().code).toBe('LOCAL_SKILL_RUNNER_BUSY');

    release();
    const firstResult = await first;
    expect(firstResult.statusCode).toBe(200);
  });

  it('releases the concurrency slot after completion', async () => {
    const app = await buildApp({
      campaignRepo: null,
      skillRunner: stubRunner(),
      localRunnerToken: TOKEN,
      localRunnerLimits: { maxConcurrency: 1 },
    });
    apps.push(app);
    const headers = { [LOCAL_RUNNER_TOKEN_HEADER]: TOKEN };
    const payload = { projectId: 'project-1', brief: {} };
    for (let i = 0; i < 3; i += 1) {
      const response = await app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', headers, payload });
      expect(response.statusCode).toBe(200);
    }
  });

  it('rejects payloads that exceed the configured body limit', async () => {
    const app = await buildApp({
      campaignRepo: null,
      skillRunner: stubRunner(),
      localRunnerToken: TOKEN,
      localRunnerLimits: { bodyLimitBytes: 1024 },
    });
    apps.push(app);
    const huge = 'x'.repeat(4096);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      headers: { [LOCAL_RUNNER_TOKEN_HEADER]: TOKEN },
      payload: { projectId: 'project-1', brief: { blob: huge } },
    });
    expect(response.statusCode).toBe(413);
  });

  // --- AC6: ausência de segredos nos logs ---

  it('never emits the boundary token to stdout/stderr across the request lifecycle', async () => {
    const captured: string[] = [];
    const outSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
      captured.push(String(chunk));
      return true;
    });
    const errSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      captured.push(String(chunk));
      return true;
    });
    try {
      const runner = stubRunner({
        async run() {
          throw new Error('falha controlada sem segredo');
        },
      });
      const app = await buildApp({ campaignRepo: null, skillRunner: runner, localRunnerToken: TOKEN });
      apps.push(app);
      const response = await app.inject({
        method: 'POST',
        url: '/api/local/skills/offerbook/run',
        headers: { [LOCAL_RUNNER_TOKEN_HEADER]: TOKEN },
        payload: { projectId: 'project-1', brief: {} },
      });
      expect(response.statusCode).toBe(500);
    } finally {
      outSpy.mockRestore();
      errSpy.mockRestore();
    }
    expect(captured.join('')).not.toContain(TOKEN);
  });

  // --- AC4: sanitização do ambiente do subprocesso Codex ---

  it('executes the authenticated Codex CLI with a read-only sandbox and structured output', async () => {
    const execute = vi.fn(async ({ args, outputPath, env }: { args: string[]; outputPath: string; env: NodeJS.ProcessEnv }) => {
      await writeFile(outputPath, JSON.stringify({
        summary: 'Proposta local',
        resultMarkdown: '# Resultado',
        artifacts: [],
        fields: [],
        questions: [],
        warnings: [],
      }));
      expect(args).toEqual(expect.arrayContaining([
        'exec',
        '--ephemeral',
        '--sandbox',
        'read-only',
        '--output-schema',
        '--output-last-message',
      ]));
      // AC4: as chaves OpenAI/Codex não podem chegar ao processo filho.
      expect(env.OPENAI_API_KEY).toBeUndefined();
      expect(env.CODEX_API_KEY).toBeUndefined();
    });
    const runner = new CodexCliLocalSkillRunner({
      repoRoot: new URL('../../../../', import.meta.url).pathname,
      execute,
    });

    const previousOpenAi = process.env.OPENAI_API_KEY;
    const previousCodex = process.env.CODEX_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-should-be-stripped';
    process.env.CODEX_API_KEY = 'codex-should-be-stripped';
    try {
      const result = await runner.run('offerbook', { projectId: 'project-1', brief: {} });
      expect(execute).toHaveBeenCalledOnce();
      expect(result).toMatchObject({ skillId: 'offerbook', model: 'codex-cli-default' });
    } finally {
      if (previousOpenAi === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousOpenAi;
      if (previousCodex === undefined) delete process.env.CODEX_API_KEY;
      else process.env.CODEX_API_KEY = previousCodex;
    }
  });
});

// --- Unidade: primitivas do boundary de segurança ---

describe('local runner security primitives', () => {
  it('binds loopback (127.0.0.1) by default and honors an explicit HOST (AC1)', () => {
    expect(resolveLocalBindHost({})).toBe('127.0.0.1');
    expect(resolveLocalBindHost({ HOST: '   ' })).toBe('127.0.0.1');
    expect(resolveLocalBindHost({ HOST: '0.0.0.0' })).toBe('0.0.0.0');
  });

  it('compares tokens in constant time by content (AC2)', () => {
    expect(timingSafeEqualStrings('abc', 'abc')).toBe(true);
    expect(timingSafeEqualStrings('abc', 'abcd')).toBe(false);
    expect(timingSafeEqualStrings('abc', 'xyz')).toBe(false);
  });

  it('authorizes only requests carrying the exact token (AC2)', () => {
    expect(authorizeLocalRunnerRequest(undefined, TOKEN)).toMatchObject({ ok: false, status: 401 });
    expect(authorizeLocalRunnerRequest('', TOKEN)).toMatchObject({ ok: false, status: 401 });
    expect(authorizeLocalRunnerRequest('nope', TOKEN)).toMatchObject({ ok: false, status: 403 });
    expect(authorizeLocalRunnerRequest(TOKEN, TOKEN)).toEqual({ ok: true });
  });

  it('resolves the configured local secret and falls back to an ephemeral token (AC2)', () => {
    expect(resolveLocalRunnerToken({ LOCAL_SKILL_RUNNER_TOKEN: 'shared-secret' })).toEqual({
      token: 'shared-secret',
      ephemeral: false,
    });
    const ephemeral = resolveLocalRunnerToken({});
    expect(ephemeral.ephemeral).toBe(true);
    expect(ephemeral.token).toHaveLength(64);
  });

  it('strips OpenAI/Codex keys without mutating the source env (AC4)', () => {
    const source: NodeJS.ProcessEnv = { OPENAI_API_KEY: 'a', CODEX_API_KEY: 'b', PATH: '/usr/bin' };
    const sanitized = sanitizeCodexEnv(source);
    expect(sanitized.OPENAI_API_KEY).toBeUndefined();
    expect(sanitized.CODEX_API_KEY).toBeUndefined();
    expect(sanitized.PATH).toBe('/usr/bin');
    // Fonte intacta.
    expect(source.OPENAI_API_KEY).toBe('a');
  });

  it('caps concurrency and recovers slots on release (AC5)', () => {
    const limiter = createConcurrencyLimiter(2);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
    limiter.release();
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.max).toBe(2);
  });
});
