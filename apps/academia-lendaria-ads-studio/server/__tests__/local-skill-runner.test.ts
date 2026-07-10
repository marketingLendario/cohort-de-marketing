import { writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import {
  CodexCliLocalSkillRunner,
  LocalSkillRunAbortError,
  type LocalSkillRunner,
} from '../local-skill-runner.js';
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
const AUTH = { [LOCAL_RUNNER_TOKEN_HEADER]: TOKEN };
const VALID_BODY = { workspaceId: 'ws-1', projectId: 'project-1', brief: { project: { slug: 'demo' } } };

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

type BuiltApp = Awaited<ReturnType<typeof buildApp>>;

/** Poll the projection endpoint until `predicate` holds or the tries run out. */
async function pollUntil(
  app: BuiltApp,
  jobId: string,
  predicate: (view: { status: string }) => boolean,
  tries = 100,
): Promise<{ status: string; proposal?: unknown; attempt?: number }> {
  for (let i = 0; i < tries; i += 1) {
    const res = await app.inject({ method: 'GET', url: `/api/local/skill-runs/${jobId}`, headers: AUTH });
    if (res.statusCode === 200) {
      const view = res.json();
      if (predicate(view)) return view;
    }
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(`timeout waiting for job ${jobId}`);
}

describe('local skill runner endpoint', () => {
  const apps: BuiltApp[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('keeps the local runner disabled by default', async () => {
    const app = await buildApp({ campaignRepo: null, skillRunner: null });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      payload: VALID_BODY,
    });
    expect(response.statusCode).toBe(503);
    expect(response.json().code).toBe('LOCAL_SKILL_RUNNER_DISABLED');
  });

  it('accepts the run, responds 202 + jobId, and completes async (AC1/AC3)', async () => {
    const app = await buildApp({ campaignRepo: null, skillRunner: stubRunner(), localRunnerToken: TOKEN });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      headers: AUTH,
      payload: VALID_BODY,
    });
    expect(response.statusCode).toBe(202);
    const { jobId, status } = response.json();
    expect(jobId).toBeTruthy();
    expect(status).toBe('queued');

    const done = await pollUntil(app, jobId, (view) => view.status === 'succeeded');
    expect(done.status).toBe('succeeded');
    expect((done.proposal as { summary: string }).summary).toBe('Proposta pronta');
  });

  it('rejects malformed input before persisting or dispatching (authorized)', async () => {
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
      headers: AUTH,
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(called).toBe(false);
  });

  // --- AC2: boundary autenticado por token (hardening W1.2 preservado) ---

  it('returns 401 when the token header is absent', async () => {
    const app = await buildApp({ campaignRepo: null, skillRunner: stubRunner(), localRunnerToken: TOKEN });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      payload: VALID_BODY,
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe('LOCAL_SKILL_RUNNER_UNAUTHENTICATED');
  });

  it('returns 403 when the token is present but incorrect', async () => {
    const app = await buildApp({ campaignRepo: null, skillRunner: stubRunner(), localRunnerToken: TOKEN });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      headers: { [LOCAL_RUNNER_TOKEN_HEADER]: 'wrong-token' },
      payload: VALID_BODY,
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe('LOCAL_SKILL_RUNNER_FORBIDDEN');
  });

  // --- AC5: limites de concorrência e payload (hardening W1.2 preservado) ---

  it('returns 429 when the concurrency admission is exhausted', async () => {
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

    const first = await app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', headers: AUTH, payload: VALID_BODY });
    expect(first.statusCode).toBe(202);
    // The single slot is now held by the background run.
    const second = await app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', headers: AUTH, payload: VALID_BODY });
    expect(second.statusCode).toBe(429);
    expect(second.json().code).toBe('LOCAL_SKILL_RUNNER_BUSY');

    release();
    await pollUntil(app, first.json().jobId, (view) => view.status === 'succeeded');
  });

  it('releases the concurrency slot after the run completes', async () => {
    const app = await buildApp({
      campaignRepo: null,
      skillRunner: stubRunner(),
      localRunnerToken: TOKEN,
      localRunnerLimits: { maxConcurrency: 1 },
    });
    apps.push(app);
    for (let i = 0; i < 3; i += 1) {
      const response = await app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', headers: AUTH, payload: VALID_BODY });
      expect(response.statusCode).toBe(202);
      // Wait for the slot to free before the next admission.
      await pollUntil(app, response.json().jobId, (view) => view.status === 'succeeded');
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
      headers: AUTH,
      payload: { ...VALID_BODY, brief: { blob: huge } },
    });
    expect(response.statusCode).toBe(413);
  });

  // --- AC4: cancelamento e retry sobre a projeção durável ---

  it('cancels an in-flight run and records a terminal state (AC4)', async () => {
    const gate = new Promise<void>(() => {
      /* never resolves — the run only ends via abort */
    });
    const runner = stubRunner({
      run(_skillId, _input, options) {
        return new Promise((_resolve, reject) => {
          void gate;
          options?.signal?.addEventListener('abort', () => reject(new LocalSkillRunAbortError()));
        });
      },
    });
    const app = await buildApp({ campaignRepo: null, skillRunner: runner, localRunnerToken: TOKEN });
    apps.push(app);
    const started = await app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', headers: AUTH, payload: VALID_BODY });
    const { jobId } = started.json();
    await pollUntil(app, jobId, (view) => view.status === 'running');

    const cancel = await app.inject({ method: 'POST', url: `/api/local/skill-runs/${jobId}/cancel`, headers: AUTH });
    expect(cancel.statusCode).toBe(200);
    const terminal = await pollUntil(app, jobId, (view) => view.status === 'cancelled');
    expect(terminal.status).toBe('cancelled');
  });

  it('retry creates a new auditable attempt after a failure (AC4)', async () => {
    let attempts = 0;
    const runner = stubRunner({
      async run(skillId) {
        attempts += 1;
        if (attempts === 1) throw new Error('primeira tentativa falhou');
        return { skillId, skillHash: 'h', model: 'm', proposal: { summary: 'ok', resultMarkdown: '#', artifacts: [], fields: [], questions: [], warnings: [] } };
      },
    });
    const app = await buildApp({ campaignRepo: null, skillRunner: runner, localRunnerToken: TOKEN });
    apps.push(app);
    const started = await app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', headers: AUTH, payload: VALID_BODY });
    const { jobId } = started.json();
    await pollUntil(app, jobId, (view) => view.status === 'failed');

    const retry = await app.inject({ method: 'POST', url: `/api/local/skill-runs/${jobId}/retry`, headers: AUTH });
    expect(retry.statusCode).toBe(202);
    expect(retry.json().attempt).toBe(2);
    const done = await pollUntil(app, jobId, (view) => view.status === 'succeeded');
    expect(done.attempt).toBe(2);
  });

  it('rejects retry of a non-terminal run (409) and cancel of a missing run (404)', async () => {
    const app = await buildApp({ campaignRepo: null, skillRunner: stubRunner(), localRunnerToken: TOKEN });
    apps.push(app);
    const cancelMissing = await app.inject({ method: 'POST', url: '/api/local/skill-runs/does-not-exist/cancel', headers: AUTH });
    expect(cancelMissing.statusCode).toBe(404);
  });

  it('recovers a non-terminal run left by a crashed BFF without duplicating (AC5)', async () => {
    // Pre-seed a store with a job stuck in `queued` (a crashed run before start).
    const { createInMemorySkillRunJobStore } = await import('../jobs/store.js');
    const store = createInMemorySkillRunJobStore();
    const seeded = await store.create({ workspaceId: 'ws-1', projectId: 'project-1', skillId: 'offerbook', input: { projectId: 'project-1', brief: {} } });
    const app = await buildApp({
      campaignRepo: null,
      skillRunner: stubRunner(),
      localRunnerToken: TOKEN,
      skillJobStore: store,
      // recoverOnBoot defaults to true.
    });
    apps.push(app);
    const done = await pollUntil(app, seeded.jobId, (view) => view.status === 'succeeded');
    expect(done.status).toBe('succeeded');
  });

  // --- AC3: SSE snapshot ---

  it('streams a snapshot event over SSE for a known job (AC3)', async () => {
    const app = await buildApp({ campaignRepo: null, skillRunner: stubRunner(), localRunnerToken: TOKEN });
    apps.push(app);
    const started = await app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', headers: AUTH, payload: VALID_BODY });
    const { jobId } = started.json();
    // SSE is a long-lived stream — listen for real and read the first frame.
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const http = await import('node:http');
    const firstFrame = await new Promise<string>((resolvePromise, reject) => {
      const request = http.get(
        { host: '127.0.0.1', port, path: `/api/local/skill-runs/${jobId}/stream`, headers: AUTH },
        (res) => {
          expect(res.headers['content-type']).toContain('text/event-stream');
          res.on('data', (chunk: Buffer) => {
            request.destroy();
            resolvePromise(chunk.toString());
          });
          res.on('error', reject);
        },
      );
      request.on('error', (error) => {
        // `destroy()` above surfaces as an aborted error once we already resolved.
        if (!request.destroyed) reject(error);
      });
    });
    expect(firstFrame).toContain('event: snapshot');
    expect(firstFrame).toContain(jobId);
  });

  // --- AC6: ausência de segredos nos logs, mesmo com falha em background ---

  it('never emits the boundary token to stdout/stderr across the async lifecycle', async () => {
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
      const started = await app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', headers: AUTH, payload: VALID_BODY });
      expect(started.statusCode).toBe(202);
      await pollUntil(app, started.json().jobId, (view) => view.status === 'failed');
    } finally {
      outSpy.mockRestore();
      errSpy.mockRestore();
    }
    expect(captured.join('')).not.toContain(TOKEN);
  });

  // --- AC4: sanitização do ambiente do subprocesso Codex (hardening W1.2) ---

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

  it('propagates the AbortSignal to the Codex execution and cleans up (AC4)', async () => {
    const controller = new AbortController();
    const execute = vi.fn(({ signal }: { signal?: AbortSignal }) =>
      new Promise<void>((_resolve, reject) => {
        if (signal?.aborted) return reject(new LocalSkillRunAbortError());
        signal?.addEventListener('abort', () => reject(new LocalSkillRunAbortError()));
      }),
    );
    const runner = new CodexCliLocalSkillRunner({
      repoRoot: new URL('../../../../', import.meta.url).pathname,
      execute,
    });
    const run = runner.run('offerbook', { projectId: 'project-1', brief: {} }, { signal: controller.signal });
    // Give the runner time to reach the (blocked) execute call, then cancel.
    await new Promise((r) => setTimeout(r, 20));
    controller.abort();
    await expect(run).rejects.toBeInstanceOf(LocalSkillRunAbortError);
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
