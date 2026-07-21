import { describe, expect, it, vi } from 'vitest'
import { createEnvironmentBootstrapService, EnvironmentBootstrapError } from './service.js'
import { buildApp } from '../app.js'
import { LOCAL_RUNNER_TOKEN_HEADER } from '../local-runner-security.js'

function runReady(command: string) {
  if (command === 'git') return Promise.resolve({ ok: true, stdout: '## main...origin/main\n', stderr: '' })
  if (command === 'python3') return Promise.resolve({ ok: true, stdout: 'Python 3.13', stderr: '' })
  return Promise.resolve({ ok: true, stdout: 'Logged in using ChatGPT', stderr: '' })
}

describe('environment bootstrap adapter', () => {
  it('returns a sanitized deterministic diagnosis and the two canonical starts', async () => {
    const service = createEnvironmentBootstrapService({
      repoRoot: '/repo', platform: 'darwin', nodeVersion: '22.17.0',
      env: { APIFY_API_TOKEN: 'apify_api_super_secret_value' }, run: runReady, mirrorEqual: async () => true,
      now: () => '2026-07-11T12:00:00.000Z',
    })
    const result = await service.diagnose()
    expect(result.status).toBe('ready')
    expect(result.starts.map((start) => start.nextCommand)).toEqual(['/avatar-funil', '/design-md'])
    expect(JSON.stringify(result)).not.toContain('super_secret')
    expect(result.diagnosisHash).toHaveLength(64)
  })

  it('requires consent and rejects a stale diagnosis before a closed recovery action', async () => {
    let aligned = false
    const syncMirror = vi.fn(async () => { aligned = true })
    const service = createEnvironmentBootstrapService({
      repoRoot: '/repo', platform: 'darwin', nodeVersion: '22.0.0', env: {}, run: runReady,
      mirrorEqual: async () => aligned, syncMirror, now: () => '2026-07-11T12:00:00.000Z',
    })
    const diagnosis = await service.diagnose()
    await expect(service.recover({ actionId: 'sync-skill-mirror', expectedDiagnosisHash: diagnosis.diagnosisHash, consent: false }))
      .rejects.toMatchObject({ code: 'consent-required' } satisfies Partial<EnvironmentBootstrapError>)
    await expect(service.recover({ actionId: 'sync-skill-mirror', expectedDiagnosisHash: 'stale', consent: true }))
      .rejects.toMatchObject({ code: 'stale-diagnosis' } satisfies Partial<EnvironmentBootstrapError>)
    await expect(service.recover({ actionId: 'sync-skill-mirror', expectedDiagnosisHash: diagnosis.diagnosisHash, consent: true }))
      .resolves.toMatchObject({ status: 'degraded', checks: expect.arrayContaining([expect.objectContaining({ id: 'skill-mirror', status: 'ready' })]) })
    expect(syncMirror).toHaveBeenCalledOnce()
  })

  it('preserves dirty work and only offers a fast-forward pull for a clean behind branch', async () => {
    const dirty = createEnvironmentBootstrapService({
      repoRoot: '/repo', platform: 'darwin', nodeVersion: '22.0.0', env: { APIFY_API_TOKEN: 'configured' }, mirrorEqual: async () => true,
      run: async (command) => command === 'git'
        ? { ok: true, stdout: '## feature...origin/feature [behind 2]\n M file.ts\n', stderr: '' }
        : { ok: true, stdout: command === 'codex' ? 'Logged in' : 'Python 3.13', stderr: '' },
    })
    const result = await dirty.diagnose()
    const git = result.checks.find((check) => check.id === 'git')
    expect(git).toMatchObject({ status: 'degraded' })
    expect(git).not.toHaveProperty('recoveryActionId')
  })

  it('persists an Apify token with consent and never echoes its value', async () => {
    const env: NodeJS.ProcessEnv = {}
    const writeApifyToken = vi.fn(async () => undefined)
    const service = createEnvironmentBootstrapService({
      repoRoot: '/repo', platform: 'darwin', nodeVersion: '22.0.0', env, run: runReady,
      mirrorEqual: async () => true, writeApifyToken, now: () => '2026-07-11T12:00:00.000Z',
    })
    const diagnosis = await service.diagnose()
    expect(diagnosis.checks.find((check) => check.id === 'apify')).toMatchObject({ recoveryActionId: 'configure-apify' })
    const token = 'apify_api_1234567890abcdefghijkl'
    const recovered = await service.recover({ actionId: 'configure-apify', expectedDiagnosisHash: diagnosis.diagnosisHash, consent: true, value: token })
    expect(writeApifyToken).toHaveBeenCalledWith(token)
    expect(recovered.checks.find((check) => check.id === 'apify')).toMatchObject({ status: 'ready' })
    expect(JSON.stringify(recovered)).not.toContain(token)
  })
})

describe('environment bootstrap HTTP boundary', () => {
  it('requires loopback, token, consent and the current diagnosis hash', async () => {
    const snapshot = {
      schemaVersion: '1.0.0' as const, status: 'ready' as const, checkedAt: '2026-07-11T12:00:00.000Z', diagnosisHash: 'a'.repeat(64),
      checks: [], starts: [{ id: 'aula-1' as const, label: 'Pesquisa', nextCommand: '/avatar-funil' as const }],
    }
    const recover = vi.fn(async () => snapshot)
    const app = await buildApp({
      environmentBootstrapService: { async diagnose() { return snapshot }, recover },
      localRunnerToken: 'bootstrap-token', skillRunner: null, campaignRepo: null, recoverOnBoot: false,
    })
    try {
      expect((await app.inject({ method: 'GET', url: '/api/local/environment-bootstrap' })).statusCode).toBe(401)
      const headers = { [LOCAL_RUNNER_TOKEN_HEADER]: 'bootstrap-token' }
      expect((await app.inject({ method: 'GET', url: '/api/local/environment-bootstrap', headers })).statusCode).toBe(200)
      expect((await app.inject({ method: 'GET', url: '/api/local/environment-bootstrap', headers, remoteAddress: '10.0.0.8' })).statusCode).toBe(403)
      expect((await app.inject({ method: 'POST', url: '/api/local/environment-bootstrap/recover', headers, payload: {
        actionId: 'sync-skill-mirror', expectedDiagnosisHash: snapshot.diagnosisHash, consent: false,
      } })).statusCode).toBe(400)
      expect((await app.inject({ method: 'POST', url: '/api/local/environment-bootstrap/recover', headers, payload: {
        actionId: 'sync-skill-mirror', expectedDiagnosisHash: snapshot.diagnosisHash, consent: true,
      } })).statusCode).toBe(200)
      expect(recover).toHaveBeenCalledOnce()
    } finally {
      await app.close()
    }
  })
})
