import { writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import {
  CodexCliLocalSkillRunner,
  LocalSkillRunAbortError,
  derivedUnavailableTrafficMetrics,
  type LocalSkillRunner,
  type SkillProposal,
  unavailableTrafficMetrics,
} from '../local-skill-runner.js';
import {
  LOCAL_RUNNER_TOKEN_HEADER,
  WorkspaceMismatchError,
  authorizeLocalRunnerRequest,
  createConcurrencyLimiter,
  resolveLocalBindHost,
  resolveLocalRunnerToken,
  resolveTenantWorkspaceId,
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

  it('rejects runner requests that do not originate from loopback', async () => {
    const app = await buildApp({ campaignRepo: null, skillRunner: stubRunner(), localRunnerToken: TOKEN });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      remoteAddress: '192.168.1.20',
      headers: AUTH,
      payload: VALID_BODY,
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe('LOCAL_SKILL_RUNNER_LOOPBACK_ONLY');
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

  // --- QA-W2B1-03: integridade de tenant do workspace na escrita service-role ---

  it('derives the workspace from the project and rejects a mismatched client workspace before writing (QA-W2B1-03)', async () => {
    const app = await buildApp({
      campaignRepo: null,
      skillRunner: stubRunner(),
      localRunnerToken: TOKEN,
      // Deriva o workspace autoritativo do projeto (simula `marketing_projects`).
      deriveProjectWorkspaceId: async () => 'ws-real',
    });
    apps.push(app);

    // Mismatch: o cliente afirma um workspace ≠ do projeto → 400 ANTES de qualquer
    // escrita service-role no journal (o job nunca é criado nem despachado).
    const mismatch = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      headers: AUTH,
      payload: { workspaceId: 'ws-attacker', projectId: 'project-1', brief: { project: { slug: 'demo' } } },
    });
    expect(mismatch.statusCode).toBe(400);
    expect(mismatch.json().code).toBe('SKILL_RUN_WORKSPACE_MISMATCH');

    // Workspace informado igual ao derivado → aceito (202) e executa.
    const matching = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      headers: AUTH,
      payload: { workspaceId: 'ws-real', projectId: 'project-1', brief: { project: { slug: 'demo' } } },
    });
    expect(matching.statusCode).toBe(202);
    await pollUntil(app, matching.json().jobId, (view) => view.status === 'succeeded');

    // Workspace omitido → usa o derivado (nunca client-asserted) → 202.
    const derived = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      headers: AUTH,
      payload: { projectId: 'project-1', brief: { project: { slug: 'demo' } } },
    });
    expect(derived.statusCode).toBe(202);
  });

  it('fails closed when the authoritative workspace lookup fails before writing', async () => {
    let dispatched = false;
    const app = await buildApp({
      campaignRepo: null,
      skillRunner: stubRunner({
        async run() {
          dispatched = true;
          throw new Error('must not run');
        },
      }),
      localRunnerToken: TOKEN,
      deriveProjectWorkspaceId: async () => {
        throw new Error('workspace lookup unavailable');
      },
    });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      headers: AUTH,
      payload: { workspaceId: 'ws-attacker', projectId: 'project-1', brief: { project: { slug: 'demo' } } },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().code).toBe('LOCAL_SKILL_ENQUEUE_FAILED');
    expect(dispatched).toBe(false);
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
        artifacts: [{
          artifactType: 'offerbook',
          title: 'Offerbook',
          path: 'generated/offerbook.md',
          format: 'markdown',
          content: '# Offerbook',
        }],
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

  it('fails with an actionable error when a skill omits its required artifact', async () => {
    const execute = vi.fn(async ({ outputPath }: { outputPath: string }) => {
      await writeFile(outputPath, JSON.stringify({
        summary: 'Faltam dados para materializar o Offerbook.',
        resultMarkdown: 'Preencha os campos pendentes.',
        artifacts: [],
        fields: [],
        questions: ['Qual é a oferta?'],
        warnings: [],
      } satisfies SkillProposal));
    });
    const runner = new CodexCliLocalSkillRunner({
      repoRoot: new URL('../../../../', import.meta.url).pathname,
      execute,
    });

    await expect(runner.run('offerbook', { projectId: 'project-1', brief: {} }))
      .rejects.toThrow('não produziu o artefato obrigatório');
  });

  it('fails closed when Diagnosticador derives a metric marked as nao_fornecido by Leitor (QA-W3.1-P2-001)', async () => {
    const metricContext = {
      artifacts: [{
        artifactType: 'trafficMetricReading',
        content: [
          'leitor:',
          '  sinais:',
          '    - metrica: CTR',
          '      valor: null',
          '      selo: nao_fornecido',
          '    - metrica: CPA',
          '      valor: "R$ 52,50"',
          '      selo: Real',
        ].join('\n'),
      }],
    };
    let capturedPrompt = '';
    const execute = vi.fn(async ({ outputPath, prompt }: { outputPath: string; prompt: string }) => {
      capturedPrompt = prompt;
      await writeFile(outputPath, JSON.stringify({
        summary: 'Diagnóstico',
        resultMarkdown: 'CTR aproximado de 0,8% foi derivado apesar de o valor literal não ter sido fornecido.',
        artifacts: [],
        fields: [],
        questions: [],
        warnings: [],
      } satisfies SkillProposal));
    });
    const runner = new CodexCliLocalSkillRunner({
      repoRoot: new URL('../../../../', import.meta.url).pathname,
      execute,
    });

    await expect(runner.run('diagnosticador', {
      projectId: 'project-1',
      brief: {},
      context: metricContext,
    })).rejects.toThrow('Diagnosticador derivou CTR');
    expect(capturedPrompt).toContain('GUARDA LITERAL DO LEITOR: CTR');
    expect(capturedPrompt).toContain('não pode calcular, estimar, derivar nem mencionar qualquer valor numérico');
  });

  it('allows Diagnosticador to name an unavailable metric without assigning a number', async () => {
    const context = {
      artifacts: [{
        artifactType: 'trafficMetricReading',
        content: JSON.stringify({ leitor: { sinais: [{ metrica: 'frequência', valor: null, selo: 'Não fornecido' }] } }),
      }],
    };
    const proposal: SkillProposal = {
      summary: 'A frequência não foi fornecida.',
      resultMarkdown: 'Aprovar 1 finalista em até 1 dia; frequência permanece não fornecida.',
      artifacts: [{
        artifactType: 'trafficDiagnosis',
        title: 'Painel da Semana',
        path: 'PAINEL-DA-SEMANA.yaml',
        format: 'yaml',
        content: 'diagnosticador:\n  alavanca_unica: "Aguardar dados literais"',
      }],
      fields: [],
      questions: [],
      warnings: ['Não diagnosticar frequência.'],
    };
    const execute = vi.fn(async ({ outputPath }: { outputPath: string }) => {
      await writeFile(outputPath, JSON.stringify(proposal));
    });
    const runner = new CodexCliLocalSkillRunner({
      repoRoot: new URL('../../../../', import.meta.url).pathname,
      execute,
    });

    expect(unavailableTrafficMetrics(context)).toEqual(expect.arrayContaining(['frequência', 'CTR', 'CPM']));
    expect(derivedUnavailableTrafficMetrics(proposal, ['frequência'])).toEqual([]);
    await expect(runner.run('diagnosticador', { projectId: 'project-1', brief: {}, context })).resolves.toMatchObject({
      proposal: { summary: 'A frequência não foi fornecida.' },
    });
  });

  it('does not attribute unavailable metric thresholds inherited from earlier panel sections to Diagnosticador', () => {
    const proposal: SkillProposal = {
      summary: 'Uma alavanca para decisão humana.',
      resultMarkdown: 'A recomendação usa apenas o CPA literal fornecido.',
      artifacts: [{
        artifactType: 'trafficDiagnosis',
        title: 'Painel da Semana',
        path: 'PAINEL-DA-SEMANA.yaml',
        format: 'yaml',
        content: [
          'estruturador:',
          '  circuit_breaker: "interromper se CTR ficar abaixo de 0,5%"',
          'diagnosticador:',
          '  alavanca: "manter verba e revisar o criativo"',
          '  criterio_sucesso: "CPA literal permanece dentro do limite informado"',
        ].join('\n'),
      }],
      fields: [],
      questions: [],
      warnings: [],
    };

    expect(derivedUnavailableTrafficMetrics(proposal, ['CTR'])).toEqual([]);
  });

  it('matches English Meta aliases to the Portuguese traffic metric contract', () => {
    const context = {
      artifacts: [{
        artifactType: 'trafficMetricReading',
        content: JSON.stringify({ leitor: { sinais: [
          { metrica: 'Frequency', valor: 1.53, selo: 'Real' },
          { metrica: 'Reach', valor: 114596, selo: 'Real' },
        ] } }),
      }],
    };

    expect(unavailableTrafficMetrics(context)).toEqual(expect.arrayContaining(['CTR', 'CPM', 'CPA', 'ROAS']));
    expect(unavailableTrafficMetrics(context)).not.toEqual(expect.arrayContaining(['frequência', 'alcance']));
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

  it('passes only operational essentials to the child — no inherited secrets (AC4 / QA-W2B1-04)', () => {
    const source: NodeJS.ProcessEnv = {
      // Essenciais operacionais → devem passar.
      PATH: '/usr/bin',
      HOME: '/home/op',
      LANG: 'pt_BR.UTF-8',
      LC_ALL: 'pt_BR.UTF-8',
      TMPDIR: '/tmp',
      CODEX_HOME: '/home/op/.codex',
      // Segredos herdados → NUNCA podem chegar ao filho agentic.
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
      SUPABASE_URL: 'https://project.supabase.co',
      LOCAL_SKILL_RUNNER_TOKEN: 'runner-token-secret',
      APIFY_TOKEN: 'apify-secret',
      OPENAI_API_KEY: 'sk-secret',
      CODEX_API_KEY: 'codex-secret',
      SOME_ARBITRARY_SECRET: 'nope',
    };
    const sanitized = sanitizeCodexEnv(source);

    expect(sanitized.PATH).toBe('/usr/bin');
    expect(sanitized.HOME).toBe('/home/op');
    expect(sanitized.LANG).toBe('pt_BR.UTF-8');
    expect(sanitized.LC_ALL).toBe('pt_BR.UTF-8');
    expect(sanitized.TMPDIR).toBe('/tmp');
    expect(sanitized.CODEX_HOME).toBe('/home/op/.codex');

    expect(sanitized.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(sanitized.SUPABASE_URL).toBeUndefined();
    expect(sanitized.LOCAL_SKILL_RUNNER_TOKEN).toBeUndefined();
    expect(sanitized.APIFY_TOKEN).toBeUndefined();
    expect(sanitized.OPENAI_API_KEY).toBeUndefined();
    expect(sanitized.CODEX_API_KEY).toBeUndefined();
    expect(sanitized.SOME_ARBITRARY_SECRET).toBeUndefined();
    // Nenhum vazamento do valor do segredo em nenhuma chave do resultado.
    expect(Object.values(sanitized)).not.toContain('service-role-secret');
    expect(source.SUPABASE_SERVICE_ROLE_KEY).toBe('service-role-secret'); // fonte intacta
  });

  it('honors the operator escape hatch CODEX_ENV_ALLOWLIST without leaking it or other secrets', () => {
    const source: NodeJS.ProcessEnv = {
      CODEX_ENV_ALLOWLIST: 'FOO_OPS,BAR_OPS',
      FOO_OPS: 'ok',
      BAR_OPS: 'ok',
      SUPABASE_SERVICE_ROLE_KEY: 'still-secret',
    };
    const sanitized = sanitizeCodexEnv(source);
    expect(sanitized.FOO_OPS).toBe('ok');
    expect(sanitized.BAR_OPS).toBe('ok');
    // A própria config do boundary não é repassada, e nada fora da lista passa.
    expect(sanitized.CODEX_ENV_ALLOWLIST).toBeUndefined();
    expect(sanitized.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });

  it('never trusts a client workspace against the derived one (QA-W2B1-03)', () => {
    // Derivado presente: provided divergente é rejeitado; igual/ausente usa o derivado.
    expect(resolveTenantWorkspaceId('p1', 'ws-a', 'ws-a')).toBe('ws-a');
    expect(resolveTenantWorkspaceId('p1', undefined, 'ws-a')).toBe('ws-a');
    expect(() => resolveTenantWorkspaceId('p1', 'ws-b', 'ws-a')).toThrow(WorkspaceMismatchError);
    // Sem derivado (fallback dev, sem writer service-role): usa provided ou projectId.
    expect(resolveTenantWorkspaceId('p1', 'ws-x', null)).toBe('ws-x');
    expect(resolveTenantWorkspaceId('p1', undefined, null)).toBe('p1');
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
