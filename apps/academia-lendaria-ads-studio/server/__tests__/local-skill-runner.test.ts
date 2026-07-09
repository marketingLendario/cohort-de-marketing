import { writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { CodexCliLocalSkillRunner, type LocalSkillRunner } from '../local-skill-runner.js';

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

  it('returns a structured proposal from an injected runner', async () => {
    const runner: LocalSkillRunner = {
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
    };
    const app = await buildApp({ campaignRepo: null, skillRunner: runner });
    apps.push(app);
    const response = await app.inject({
      method: 'POST',
      url: '/api/local/skills/offerbook/run',
      payload: { projectId: 'project-1', brief: { project: { slug: 'demo' } } },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ skillId: 'offerbook', skillHash: 'hash-1', model: 'test-model' });
  });

  it('rejects malformed input before invoking the runner', async () => {
    let called = false;
    const runner: LocalSkillRunner = {
      async run() {
        called = true;
        throw new Error('should not run');
      },
    };
    const app = await buildApp({ campaignRepo: null, skillRunner: runner });
    apps.push(app);
    const response = await app.inject({ method: 'POST', url: '/api/local/skills/offerbook/run', payload: {} });
    expect(response.statusCode).toBe(400);
    expect(called).toBe(false);
  });

  it('executes the authenticated Codex CLI with a read-only sandbox and structured output', async () => {
    const execute = vi.fn(async ({ args, outputPath }: { args: string[]; outputPath: string }) => {
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
    });
    const runner = new CodexCliLocalSkillRunner({
      repoRoot: new URL('../../../../', import.meta.url).pathname,
      execute,
    });

    const result = await runner.run('offerbook', { projectId: 'project-1', brief: {} });

    expect(execute).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ skillId: 'offerbook', model: 'codex-cli-default' });
  });
});
