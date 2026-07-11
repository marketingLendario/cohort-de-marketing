import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../app.js'
import { LOCAL_RUNNER_TOKEN_HEADER } from '../local-runner-security.js'
import { createProjectStatusService, ProjectStatusError } from './service.js'

function digest(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex')
}

describe('project status read-only service', () => {
  const roots: string[] = []
  afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))))

  it('reconcilia filesystem, banco e Book sem alterar a árvore', async () => {
    const projectsRoot = await mkdtemp(join(tmpdir(), 'project-status-'))
    roots.push(projectsRoot)
    const root = join(projectsRoot, 'cliente-x')
    await mkdir(root)
    await writeFile(join(root, 'avatar.md'), '# Avatar\n')
    await writeFile(join(root, 'pendencias.md'), '- [ ] Pixel <!-- key: pixel-id -->\n')
    await writeFile(join(root, 'book-do-funil.json'), JSON.stringify({
      schemaVersion: '1.0.0', projectSlug: 'cliente-x',
      cards: [{ id: 'avatar-funil', title: 'Avatar', phase: 'Pesquisa', status: 'feito', link: 'avatar.html', versions: [] }],
      current: { completedSkillId: 'avatar-funil', nextCommand: '/offerbook' },
    }))
    const before = await Promise.all(['avatar.md', 'pendencias.md', 'book-do-funil.json'].map(async (path) => digest(await readFile(join(root, path)))))
    const service = createProjectStatusService({
      projectsRoot,
      store: {
        async getProject() { return { id: 'p1', slug: 'cliente-x' } },
        async listArtifacts() { return [{ artifactType: 'avatar', path: 'avatar.md', verification: 'confirmed' }] },
      },
    })

    const result = await service.read('p1')
    const after = await Promise.all(['avatar.md', 'pendencias.md', 'book-do-funil.json'].map(async (path) => digest(await readFile(join(root, path)))))
    expect(result.readOnly).toBe(true)
    expect(result.nextCommand).toBe('/offerbook')
    expect(result.pending.open).toBe(1)
    expect(result.pieces[0]?.converged).toBe(true)
    expect(after).toEqual(before)
  })

  it('reports an invalid Book as drift instead of failing the read-only status', async () => {
    const projectsRoot = await mkdtemp(join(tmpdir(), 'project-status-book-'))
    roots.push(projectsRoot)
    const root = join(projectsRoot, 'cliente-x')
    await mkdir(root)
    await writeFile(join(root, 'book-do-funil.json'), '{invalid')
    const service = createProjectStatusService({
      projectsRoot,
      store: { async getProject() { return { id: 'p1', slug: 'cliente-x' } }, async listArtifacts() { return [] } },
    })
    await expect(service.read('p1')).resolves.toMatchObject({ sourceIssues: ['book-state-invalid'], readOnly: true })
  })

  it('rejeita slug que tenta escapar da raiz', async () => {
    const service = createProjectStatusService({
      projectsRoot: '/tmp/projects',
      store: { async getProject() { return { id: 'p1', slug: '../private' } }, async listArtifacts() { return [] } },
    })
    await expect(service.read('p1')).rejects.toMatchObject({ code: 'invalid-project-slug' } satisfies Partial<ProjectStatusError>)
  })
})

describe('project status HTTP boundary', () => {
  it('expõe o mesmo snapshot somente para loopback autenticado', async () => {
    const status = {
      schemaVersion: '1.0.0' as const, projectSlug: 'cliente-x', pieces: [], alternatives: [],
      pending: { open: 0, resolved: 0, decisions: [] }, completed: 0, total: 11,
      nextCommand: '/avatar-funil', divergences: [],
      profile: { offerType: null, destination: null, voice: null, affiliate: false }, guidance: null,
      sourceIssues: [],
      sourceHashes: { filesystem: 'a', database: 'b', book: null, pendings: null }, readOnly: true as const,
    }
    const app = await buildApp({
      projectStatusService: { async read() { return status } },
      localRunnerToken: 'status-token', skillRunner: null, campaignRepo: null, recoverOnBoot: false,
    })
    try {
      const unauthorized = await app.inject({ method: 'GET', url: '/api/local/projects/p1/status' })
      expect(unauthorized.statusCode).toBe(401)
      const allowed = await app.inject({
        method: 'GET', url: '/api/local/projects/p1/status',
        headers: { [LOCAL_RUNNER_TOKEN_HEADER]: 'status-token' },
      })
      expect(allowed.statusCode).toBe(200)
      expect(allowed.json()).toEqual(status)
      const remote = await app.inject({
        method: 'GET', url: '/api/local/projects/p1/status', remoteAddress: '192.168.0.2',
        headers: { [LOCAL_RUNNER_TOKEN_HEADER]: 'status-token' },
      })
      expect(remote.statusCode).toBe(403)
    } finally {
      await app.close()
    }
  })
})
