import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, sep } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CachedExternalResearchAdapter, sanitizeCollectorEnv } from './adapter.js'
import { assertSnapshotIntegrity, type ExternalResearchSourceResult } from './contracts.js'
import { CodexCliLocalSkillRunner, type SkillProposal } from '../local-skill-runner.js'

const roots: string[] = []

async function runtimeRoot(): Promise<string> {
  const root = await mkdtemp(resolve(tmpdir(), 'external-research-test-'))
  roots.push(root)
  return root
}

function completedSource(): ExternalResearchSourceResult {
  return {
    sourceId: 'search-primary',
    provider: 'apify',
    kind: 'google-search',
    target: 'dor de gestores de tráfego',
    status: 'completed',
    startedAt: '2026-07-11T10:00:00.000Z',
    completedAt: '2026-07-11T10:00:01.000Z',
    itemCount: 1,
    items: [{
      sourceItemId: 'result-1',
      url: 'https://example.com/review',
      publishedAt: null,
      author: 'Cliente real',
      text: 'Eu perco horas tentando entender por que a campanha parou.',
      metrics: {},
      literal: { title: 'Review literal' },
    }],
    failure: null,
  }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('external research adapter', () => {
  it('confines cache paths even when projectId contains traversal segments', async () => {
    const root = await runtimeRoot()
    const adapter = new CachedExternalResearchAdapter({ runtimeRoot: root })
    const result = await adapter.collect({
      skillId: 'avatar-funil',
      projectId: '../../escape',
      request: { mode: 'offline', pastedMaterial: 'Material literal.', sources: [], maxBillableCalls: 0 },
    })

    expect(result.snapshotPath.startsWith(`${root}${sep}`)).toBe(true)
    expect(result.snapshotPath).not.toContain('..')
  })

  it('freezes pasted material offline without invoking a network collector', async () => {
    const executeCollector = vi.fn()
    const adapter = new CachedExternalResearchAdapter({ runtimeRoot: await runtimeRoot(), executeCollector })
    const result = await adapter.collect({
      skillId: 'avatar-funil',
      projectId: 'project-1',
      request: {
        mode: 'offline',
        pastedMaterial: 'Review literal fornecido pelo operador.',
        pastedSourceLabel: 'Planilha de entrevistas',
        sources: [],
        maxBillableCalls: 0,
      },
    })

    expect(executeCollector).not.toHaveBeenCalled()
    expect(result.cacheHit).toBe(false)
    expect(result.snapshot.mode).toBe('offline')
    expect(result.snapshot.sources[0]).toMatchObject({ provider: 'operator', itemCount: 1 })
    expect(result.snapshot.sources[0].items[0].text).toContain('Review literal')
    expect(result.snapshot.quota.attemptedBillableCalls).toBe(0)
    expect(() => assertSnapshotIntegrity(result.snapshot)).not.toThrow()
  })

  it('passes only collector credentials and reuses the immutable cache on retry', async () => {
    const executeCollector = vi.fn(async ({ env }: { env: NodeJS.ProcessEnv }) => {
      expect(env.APIFY_API_TOKEN).toBe('apify-secret-value')
      expect(env.OPENAI_API_KEY).toBeUndefined()
      expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined()
      return { sources: [completedSource()] }
    })
    const adapter = new CachedExternalResearchAdapter({
      runtimeRoot: await runtimeRoot(),
      env: {
        PATH: '/usr/bin',
        APIFY_API_TOKEN: 'apify-secret-value',
        OPENAI_API_KEY: 'openai-secret-value',
        SUPABASE_SERVICE_ROLE_KEY: 'supabase-secret-value',
      },
      executeCollector,
    })
    const input = {
      skillId: 'trend-hunting' as const,
      projectId: 'project-1',
      request: {
        mode: 'network',
        query: 'tráfego pago 2026',
        sources: [{ id: 'search-primary', provider: 'apify', kind: 'google-search', target: 'tráfego pago 2026', limit: 5 }],
        maxBillableCalls: 1,
      },
    }
    const first = await adapter.collect(input)
    const retry = await adapter.collect(input)

    expect(executeCollector).toHaveBeenCalledOnce()
    expect(first.cacheHit).toBe(false)
    expect(retry.cacheHit).toBe(true)
    expect(retry.snapshot).toEqual(first.snapshot)
    expect(JSON.stringify(first.snapshot)).not.toContain('apify-secret-value')
    expect(first.snapshot.quota).toMatchObject({ attemptedBillableCalls: 1, completedBillableCalls: 1 })
  })

  it('tracks per-source failures instead of pretending collection succeeded', async () => {
    const failed = completedSource()
    failed.status = 'failed'
    failed.itemCount = 0
    failed.items = []
    failed.failure = 'Monthly usage hard limit exceeded'
    const adapter = new CachedExternalResearchAdapter({
      runtimeRoot: await runtimeRoot(),
      executeCollector: async () => ({ sources: [failed] }),
    })
    const result = await adapter.collect({
      skillId: 'conteudo-funil',
      projectId: 'project-1',
      request: {
        mode: 'network',
        sources: [{ id: 'search-primary', provider: 'apify', kind: 'google-search', target: 'conteúdo viral', limit: 5 }],
        maxBillableCalls: 1,
      },
    })

    expect(result.snapshot.failures).toEqual([{ sourceId: 'search-primary', reason: 'Monthly usage hard limit exceeded' }])
    expect(result.snapshot.quota.completedBillableCalls).toBe(0)
  })

  it('rejects private URLs inside the real isolated subprocess', async () => {
    const adapter = new CachedExternalResearchAdapter({ runtimeRoot: await runtimeRoot() })
    const result = await adapter.collect({
      skillId: 'espiao-do-concorrente',
      projectId: 'project-1',
      request: {
        mode: 'network',
        sources: [{ id: 'private-url', provider: 'public-url', kind: 'public-url', target: 'https://127.0.0.1/admin?token=must-not-persist', limit: 1 }],
        maxBillableCalls: 1,
      },
    })

    expect(result.snapshot.sources[0]).toMatchObject({ status: 'failed', itemCount: 0 })
    expect(result.snapshot.sources[0].failure).toContain('URL privada')
    expect(result.snapshot.sources[0].target).toBe('https://127.0.0.1/admin')
    expect(JSON.stringify(result.snapshot)).not.toContain('must-not-persist')
  })

  it('uses an allowlist for the collector environment', () => {
    const sanitized = sanitizeCollectorEnv({
      PATH: '/usr/bin',
      APIFY_API_TOKEN: 'allowed',
      META_AD_LIBRARY_TOKEN: 'allowed-meta',
      OPENAI_API_KEY: 'blocked',
      LOCAL_SKILL_RUNNER_TOKEN: 'blocked',
    })
    expect(sanitized).toEqual({ PATH: '/usr/bin', APIFY_API_TOKEN: 'allowed', META_AD_LIBRARY_TOKEN: 'allowed-meta' })
  })

  it('injects the frozen snapshot into Codex without credentials and appends the authoritative artifact', async () => {
    const backingAdapter = new CachedExternalResearchAdapter({ runtimeRoot: await runtimeRoot() })
    const collected = await backingAdapter.collect({
      skillId: 'avatar-funil',
      projectId: 'project-1',
      request: { mode: 'offline', pastedMaterial: 'Frase literal do cliente.', sources: [], maxBillableCalls: 0 },
    })
    let prompt = ''
    const execute = vi.fn(async (execution: { outputPath: string; prompt: string; env: NodeJS.ProcessEnv }) => {
      prompt = execution.prompt
      expect(execution.env.APIFY_API_TOKEN).toBeUndefined()
      await writeFile(execution.outputPath, JSON.stringify({
        summary: 'Pesquisa concluída.',
        resultMarkdown: '# Avatar',
        artifacts: [
          { artifactType: 'avatar', title: 'Avatar', path: 'relatorio-avatar.md', format: 'markdown', content: '# Avatar' },
          {
            artifactType: 'avatar', title: 'Avatar visual', path: 'relatorio-avatar.html', format: 'html',
            content: '<!doctype html><html><body><main><h1>Avatar</h1><a href="index.html">Voltar ao Book</a></main></body></html>',
          },
        ],
        fields: [],
        questions: [],
        warnings: [],
      } satisfies SkillProposal))
    })
    const externalResearch = { collect: vi.fn(async () => collected) }
    const runner = new CodexCliLocalSkillRunner({
      repoRoot: new URL('../../../../', import.meta.url).pathname,
      execute,
      externalResearch,
    })
    const previousToken = process.env.APIFY_API_TOKEN
    process.env.APIFY_API_TOKEN = 'must-never-reach-codex'
    try {
      const result = await runner.run('avatar-funil', {
        projectId: 'project-1',
        brief: {},
        context: { externalResearch: { mode: 'offline', pastedMaterial: 'Frase literal do cliente.', sources: [], maxBillableCalls: 0 } },
      })
      expect(externalResearch.collect).toHaveBeenCalledOnce()
      expect(prompt).toContain('SNAPSHOT EXTERNO CONGELADO')
      expect(prompt).toContain(collected.snapshot.contentHash)
      expect(prompt).not.toContain('must-never-reach-codex')
      expect(result.proposal.artifacts.at(-1)).toMatchObject({ artifactType: 'researchSnapshot', format: 'json' })
      expect(result.proposal.fields).toContainEqual({ key: 'externalResearchItems', value: '1' })
    } finally {
      if (previousToken === undefined) delete process.env.APIFY_API_TOKEN
      else process.env.APIFY_API_TOKEN = previousToken
    }
  })
})
