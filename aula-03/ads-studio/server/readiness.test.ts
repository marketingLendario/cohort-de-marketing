import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from './app.js'
import {
  aggregateReadiness,
  manualReadinessSnapshot,
  parseReadinessSnapshot,
  readReadinessSnapshot,
  type SystemReadinessCheck,
} from './readiness.js'

describe('system readiness projection', () => {
  const cleanup: string[] = []

  afterEach(async () => {
    await Promise.all(cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })))
  })

  it('aggregates required blockers before degraded optional checks', () => {
    const checks: SystemReadinessCheck[] = [
      { id: 'browser', label: 'Navegador', status: 'degraded', detail: 'manual', required: false },
      { id: 'codex', label: 'Codex', status: 'blocked', detail: 'login ausente', required: true },
    ]
    expect(aggregateReadiness(checks)).toBe('blocked')
    expect(aggregateReadiness([{ ...checks[0], status: 'ready' }])).toBe('ready')
  })

  it('returns a treatable degraded snapshot when no launcher file exists', async () => {
    expect(manualReadinessSnapshot('2026-07-10T12:00:00.000Z')).toMatchObject({
      status: 'degraded',
      source: 'manual',
      checks: [{ id: 'launcher', required: false }],
    })
    await expect(readReadinessSnapshot('/tmp/marketing-studio-does-not-exist.json')).resolves.toMatchObject({
      status: 'degraded',
      source: 'manual',
    })
  })

  it('whitelists fields and redacts secret-shaped values from the public response', async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'marketing-readiness-test-'))
    cleanup.push(directory)
    const filePath = resolve(directory, 'readiness.json')
    await writeFile(filePath, JSON.stringify({
      source: 'launcher',
      checkedAt: '2026-07-10T12:00:00.000Z',
      appUrl: 'http://127.0.0.1:5177',
      token: 'must-never-be-returned',
      checks: [{
        id: 'codex',
        label: 'Codex CLI',
        status: 'ready',
        detail: 'autenticado com sk-abcdefghijklmnopqrstuvwxyz e sb_secret_abcdefghijklmnopqrstuvwxyz',
        required: true,
        private: 'hidden',
      }],
    }))

    const snapshot = await readReadinessSnapshot(filePath)
    expect(snapshot).toEqual({
      status: 'ready',
      checkedAt: '2026-07-10T12:00:00.000Z',
      source: 'launcher',
      appUrl: 'http://127.0.0.1:5177',
      checks: [{
        id: 'codex',
        label: 'Codex CLI',
        status: 'ready',
        detail: 'autenticado com [REDACTED] e [REDACTED]',
        required: true,
      }],
    })
    expect(JSON.stringify(snapshot)).not.toContain('must-never-be-returned')
    expect(JSON.stringify(snapshot)).not.toContain('private')
  })

  it('derives the public status from checks instead of trusting the file', () => {
    expect(parseReadinessSnapshot({
      status: 'ready',
      source: 'launcher',
      checks: [{ id: 'db', label: 'Banco', status: 'blocked', detail: 'indisponível', required: true }],
    })).toMatchObject({ status: 'blocked' })
  })

  it('serves the sanitized snapshot without authentication or caching', async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'marketing-readiness-route-'))
    cleanup.push(directory)
    const filePath = resolve(directory, 'readiness.json')
    await writeFile(filePath, JSON.stringify({
      source: 'launcher',
      checkedAt: '2026-07-10T12:00:00.000Z',
      privateToken: 'never-public',
      checks: [{ id: 'web', label: 'Interface', status: 'ready', detail: 'Ativa.', required: true }],
    }))
    const app = await buildApp({ campaignRepo: null, skillRunner: null, readinessFile: filePath, recoverOnBoot: false })

    try {
      const response = await app.inject({ method: 'GET', url: '/api/local/readiness' })
      expect(response.statusCode).toBe(200)
      expect(response.headers['cache-control']).toBe('no-store')
      expect(response.json()).toMatchObject({ status: 'ready', source: 'launcher', checks: [{ id: 'web' }] })
      expect(response.body).not.toContain('never-public')
    } finally {
      await app.close()
    }
  })
})
