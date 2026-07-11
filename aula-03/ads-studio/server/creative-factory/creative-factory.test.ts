import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { CreativeFactoryLocalRunner } from './runner.js';
import { buildApp } from '../app.js';
import { createInMemorySkillRunJobStore } from '../jobs/store.js';
import { LOCAL_RUNNER_TOKEN_HEADER } from '../local-runner-security.js';
import type { LocalSkillRunner } from '../local-skill-runner.js';
import {
  promoteCreativeFactoryBatch,
  readCreativeFactoryAsset,
  readCreativeFactoryManifest,
} from './storage.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+Avz+WQAAAABJRU5ErkJggg==', 'base64');
const sha256 = (content: Buffer | string) => createHash('sha256').update(content).digest('hex');
let root: string;
let runtimeRoot: string;
let projectsRoot: string;

beforeEach(async () => {
  root = await import('node:fs/promises').then(({ mkdtemp }) => mkdtemp(join(tmpdir(), 'creative-factory-')));
  runtimeRoot = join(root, 'runtime');
  projectsRoot = join(root, 'projetos');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function input() {
  return {
    projectId: 'project-1',
    brief: { project: { name: 'Teste' } },
    context: {
      creativeFactory: {
        campaignId: 'campaign-1',
        formats: ['feed'],
        archetypes: ['dark_editorial', 'light_clean', 'didactic_compare'],
        variants: 1,
        personas: [] as string[],
        cta: 'Saiba mais',
        finalists: [{ id: 'finalist-1', hook: 'Um hook real', copy: 'Legenda completa.', format: 'feed' }],
      },
    },
  };
}

describe('CreativeFactoryLocalRunner', () => {
  it('normaliza o manifesto e não expõe paths absolutos', async () => {
    const runner = new CreativeFactoryLocalRunner({
      repoRoot: resolve(import.meta.dirname, '../../../..'),
      runtimeRoot,
      execute: async (execution) => {
        const campaign = parseYaml(await readFile(execution.args.at(-1)!, 'utf8')) as { params: { variants_per_hook: number } };
        expect(campaign.params.variants_per_hook).toBe(3);
        const output = String(execution.env.ACF_OUT_DIR);
        const campaignRoot = join(output, 'batch-0123456789abcdef');
        await mkdir(campaignRoot, { recursive: true });
        const generated = join(campaignRoot, 'generated.png');
        await writeFile(generated, PNG);
        await writeFile(join(campaignRoot, 'manifest.json'), JSON.stringify({
          hooks: [{
            id: 'finalist-1-dark-editorial-v1',
            status: 'OK',
            archetype: 'dark_editorial',
            headline: 'Um hook real',
            caption: 'Legenda completa.',
            link_description: 'Conheça',
            cta: 'Saiba mais',
            final: generated,
            gate: { verdict: 'pass', img: generated },
            review: { verdict: 'approved', final: generated },
          }],
        }));
      },
    });

    const result = await runner.run('ads-creative-factory', input(), { jobId: '0123456789abcdef', attempt: 1 });
    const manifest = JSON.parse(result.proposal.artifacts[0]!.content) as Record<string, unknown>;
    expect(JSON.stringify(manifest)).not.toContain(root);
    expect(JSON.stringify(manifest)).not.toContain('generated.png');
    expect(result.model).toBe('codex-cli-image-gen');
    expect(await readCreativeFactoryManifest(runtimeRoot, '0123456789abcdef')).toMatchObject({
      projectId: 'project-1',
      campaignId: 'campaign-1',
      items: [{ status: 'ready', assets: [{ width: 1, height: 1, sha256: sha256(PNG) }] }],
    });
    const item = (manifest.items as Array<Record<string, unknown>>)[0]!;
    expect(item.promptSanitized).toContain('archetype=dark_editorial');
    expect(item.promptSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('recusa likeness sem foto e autorização explícita antes de gerar', async () => {
    let executed = false;
    const runner = new CreativeFactoryLocalRunner({
      repoRoot: resolve(import.meta.dirname, '../../../..'),
      runtimeRoot,
      execute: async () => { executed = true; },
    });
    const personInput = input();
    personInput.context.creativeFactory.archetypes = ['person_authority'];
    personInput.context.creativeFactory.personas = ['alan-nicolas'];
    await expect(runner.run('ads-creative-factory', personInput, { jobId: '0123456789abcdef' }))
      .rejects.toThrow('exige foto e autorização explícita');
    expect(executed).toBe(false);
  });
});

describe('Creative Factory storage', () => {
  async function stage(status: 'ready' | 'flagged' = 'ready') {
    const batchId = 'fedcba9876543210';
    const batchRoot = join(runtimeRoot, batchId);
    await mkdir(join(batchRoot, 'assets'), { recursive: true });
    await writeFile(join(batchRoot, 'assets', 'asset-1.png'), PNG);
    await writeFile(join(batchRoot, 'manifest.json'), JSON.stringify({
      schemaVersion: '1.0.0', batchId, projectId: 'project-1', campaignId: 'campaign-1',
      status: 'ready_for_review', createdAt: '2026-07-11T12:00:00.000Z',
      items: [{
        id: 'creative-1', status, archetype: 'dark_editorial', headline: 'Headline',
        caption: 'Legenda', linkDescription: 'Descrição', cta: 'Saiba mais',
        promptSanitized: 'brand=test; archetype=dark_editorial', promptSha256: sha256('brand=test; archetype=dark_editorial'),
        gate: { verdict: status === 'ready' ? 'pass' : 'fail' }, review: {},
        assets: [{ id: 'asset-1', format: 'feed', width: 1, height: 1, sha256: sha256(PNG), bytes: PNG.length }],
      }],
    }));
    return batchId;
  }

  it('promove PNG e legendas de modo idempotente', async () => {
    const batchId = await stage();
    const first = await promoteCreativeFactoryBatch({ runtimeRoot, projectsRoot, projectSlug: 'cliente-x', batchId, selectedItemIds: ['creative-1'] });
    const second = await promoteCreativeFactoryBatch({ runtimeRoot, projectsRoot, projectSlug: 'cliente-x', batchId, selectedItemIds: ['creative-1'] });
    expect(first.promotedAssets[0]!.result.outcome).toBe('written');
    expect(second.promotedAssets[0]!.result.outcome).toBe('unchanged');
    expect(await readFile(join(projectsRoot, 'cliente-x', first.promotedAssets[0]!.relativePath))).toEqual(PNG);
    expect(await readFile(join(projectsRoot, 'cliente-x', first.artifactPath), 'utf8')).toContain('creative-1');
    expect(await readFile(join(projectsRoot, 'cliente-x', first.artifactPath.replace('manifest.json', 'legendas.md')), 'utf8')).toContain('Legenda');
  });

  it('bloqueia gate sinalizado e detecta adulteração do PNG', async () => {
    const flaggedBatch = await stage('flagged');
    await expect(promoteCreativeFactoryBatch({ runtimeRoot, projectsRoot, projectSlug: 'cliente-x', batchId: flaggedBatch, selectedItemIds: ['creative-1'] })).rejects.toThrow('sinalizados');
    await writeFile(join(runtimeRoot, flaggedBatch, 'assets', 'asset-1.png'), Buffer.from('tampered'));
    await expect(readCreativeFactoryAsset({ runtimeRoot, batchId: flaggedBatch, assetId: 'asset-1' })).rejects.toThrow('divergiu');
  });
});

describe('Creative Factory HTTP boundary', () => {
  it('serve o asset autenticado e promove o lote vinculado ao projeto', async () => {
    const store = createInMemorySkillRunJobStore();
    const job = await store.create({
      workspaceId: 'workspace-1', projectId: 'project-1', skillId: 'ads-creative-factory',
      input: { projectId: 'project-1', brief: {}, context: {} },
    });
    await store.claim(job.jobId, 'test-worker', 60_000);
    const batchRoot = join(runtimeRoot, job.jobId);
    await mkdir(join(batchRoot, 'assets'), { recursive: true });
    await writeFile(join(batchRoot, 'assets', 'asset-1.png'), PNG);
    const manifest = {
      schemaVersion: '1.0.0', batchId: job.jobId, projectId: 'project-1', campaignId: 'campaign-1',
      status: 'ready_for_review', createdAt: '2026-07-11T12:00:00.000Z',
      items: [{ id: 'creative-1', status: 'ready', archetype: 'dark_editorial', headline: 'Headline',
        caption: 'Legenda', linkDescription: 'Descrição', cta: 'Saiba mais',
        promptSanitized: 'brand=test; archetype=dark_editorial', promptSha256: sha256('brand=test; archetype=dark_editorial'),
        gate: { verdict: 'pass' }, review: {},
        assets: [{ id: 'asset-1', format: 'feed', width: 1, height: 1, sha256: sha256(PNG), bytes: PNG.length }] }],
    };
    await writeFile(join(batchRoot, 'manifest.json'), JSON.stringify(manifest));
    await store.complete(job.jobId, { proposal: { summary: 'ok', resultMarkdown: '', artifacts: [], fields: [], questions: [], warnings: [] }, skillHash: 'hash', model: 'test' });
    const runner: LocalSkillRunner = { async run() { throw new Error('não deveria executar'); } };
    const app = await buildApp({
      campaignRepo: null, skillRunner: runner, skillJobStore: store, localRunnerToken: 'factory-test-token',
      creativeFactoryRuntimeRoot: runtimeRoot, cohortRepoRoot: root, resolveProjectSlug: async () => 'cliente-x', recoverOnBoot: false,
    });
    const headers = { [LOCAL_RUNNER_TOKEN_HEADER]: 'factory-test-token' };
    try {
      const asset = await app.inject({ method: 'GET', url: `/api/local/creative-factory/batches/${job.jobId}/assets/asset-1`, headers });
      expect(asset.statusCode).toBe(200);
      expect(asset.headers['content-type']).toContain('image/png');
      expect(asset.rawPayload).toEqual(PNG);
      const promoted = await app.inject({ method: 'POST', url: `/api/local/creative-factory/batches/${job.jobId}/promote`, headers, payload: { projectId: 'project-1', selectedItemIds: ['creative-1'] } });
      expect(promoted.statusCode).toBe(200);
      expect(promoted.json()).toMatchObject({ batchId: job.jobId, promotedAssets: [{ assetId: 'asset-1' }] });
      expect(await readFile(join(projectsRoot, 'cliente-x', promoted.json().artifactPath), 'utf8')).not.toContain(root);
    } finally {
      await app.close();
    }
  });
});
