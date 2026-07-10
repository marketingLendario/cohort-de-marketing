import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from './app.js'
import { LOCAL_RUNNER_TOKEN_HEADER } from './local-runner-security.js'
import {
  ProjectIntakeError,
  createProjectIntakeService,
  type ProjectIntakeArtifactRecord,
  type ProjectIntakeProject,
  type ProjectIntakeStore,
} from './project-intake.js'

const PROJECT: ProjectIntakeProject = {
  id: 'project-1',
  workspaceId: 'ws-1',
  slug: 'maquina-de-receita-com-ia',
  name: 'Máquina de Receita com IA',
}

const token = 'project-intake-token'

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

function fakeStore(seedArtifacts: ProjectIntakeArtifactRecord[] = []) {
  const artifacts = [...seedArtifacts]
  const saveArtifact = vi.fn<ProjectIntakeStore['saveArtifact']>(async (input) => {
    const now = new Date().toISOString()
    const record: ProjectIntakeArtifactRecord = {
      id: input.id ?? `artifact-${artifacts.length + 1}`,
      projectId: input.projectId,
      path: input.path,
      artifactType: input.artifactType,
      format: input.format,
      hash: input.hash,
      source: 'filesystem',
      updatedAt: now,
    }
    const existingIndex = artifacts.findIndex((artifact) => artifact.id === record.id)
    if (existingIndex >= 0) artifacts.splice(existingIndex, 1, record)
    else artifacts.unshift(record)
    return record
  })
  const store: ProjectIntakeStore = {
    getProject: vi.fn(async (projectId) => (projectId === PROJECT.id ? PROJECT : undefined)),
    listArtifacts: vi.fn(async (projectId) => (projectId === PROJECT.id ? [...artifacts] : [])),
    saveArtifact,
  }
  return { store, artifacts, saveArtifact }
}

describe('project intake service', () => {
  let projectsRoot: string

  beforeEach(async () => {
    projectsRoot = await mkdtemp(join(tmpdir(), 'cohort-project-intake-'))
  })

  afterEach(async () => {
    await rm(projectsRoot, { recursive: true, force: true })
  })

  it('lists only real directories confined to projetos/', async () => {
    await mkdir(join(projectsRoot, 'academia-fit'))
    await mkdir(join(projectsRoot, 'academia-lendaria'))
    await writeFile(join(projectsRoot, 'README.md'), '# not a source')
    await symlink(join(projectsRoot, 'academia-fit'), join(projectsRoot, 'link-externo'))

    const service = createProjectIntakeService({ store: fakeStore().store, projectsRoot })
    await expect(service.listSources()).resolves.toEqual([
      { slug: 'academia-fit', root: 'projetos/academia-fit' },
      { slug: 'academia-lendaria', root: 'projetos/academia-lendaria' },
    ])
  })

  it('builds a preview manifest with paths, types, hashes and conflicts', async () => {
    await mkdir(join(projectsRoot, 'academia-lendaria', 'copy'), { recursive: true })
    await mkdir(join(projectsRoot, 'academia-lendaria', '.github'), { recursive: true })
    await writeFile(join(projectsRoot, 'academia-lendaria', 'offerbook.md'), '# Offerbook\n')
    await writeFile(join(projectsRoot, 'academia-lendaria', 'copy', 'offer.md'), '# Copy\n')
    await writeFile(join(projectsRoot, 'academia-lendaria', 'metrics.csv'), 'date,spend\n2026-07-10,100\n')
    await writeFile(join(projectsRoot, 'academia-lendaria', '.github', 'workflow.yml'), 'name: ignored\n')
    const { store } = fakeStore([
      {
        id: 'artifact-existing',
        projectId: PROJECT.id,
        path: 'offerbook.md',
        artifactType: 'offerbook',
        format: 'markdown',
        hash: sha256('# versão antiga\n'),
        source: 'filesystem',
        updatedAt: '2026-07-10T12:00:00.000Z',
      },
    ])

    const service = createProjectIntakeService({ store, projectsRoot })
    const preview = await service.preview({ projectId: PROJECT.id, sourceSlug: 'academia-lendaria' })

    expect(preview.manifest.sourcePath).toBe('projetos/academia-lendaria')
    expect(preview.manifest.allowlist.length).toBeGreaterThan(0)
    expect(preview.files).toEqual([
      expect.objectContaining({
        path: 'copy/offer.md',
        artifactType: 'copyOffer',
        format: 'markdown',
        conflict: 'new',
      }),
      expect.objectContaining({
        path: 'metrics.csv',
        artifactType: 'metrics',
        format: 'csv',
        conflict: 'new',
      }),
      expect.objectContaining({
        path: 'offerbook.md',
        artifactType: 'offerbook',
        format: 'markdown',
        conflict: 'conflict',
        existingHash: sha256('# versão antiga\n'),
      }),
    ])
    expect(preview.conflicts).toEqual([
      {
        path: 'offerbook.md',
        existingHash: sha256('# versão antiga\n'),
        incomingHash: sha256('# Offerbook\n'),
      },
    ])
    expect(preview.files.some((file) => file.path.startsWith('.github/'))).toBe(false)
  })

  it('rejects traversal attempts in the source slug', async () => {
    const service = createProjectIntakeService({ store: fakeStore().store, projectsRoot })
    await expect(service.preview({ projectId: PROJECT.id, sourceSlug: '../secrets' })).rejects.toMatchObject({
      code: 'path-traversal',
    } satisfies Partial<ProjectIntakeError>)
  })

  it('rejects symlinks inside the source tree', async () => {
    await mkdir(join(projectsRoot, 'academia-lendaria'), { recursive: true })
    await writeFile(join(projectsRoot, 'fora.md'), '# fora')
    await symlink(join(projectsRoot, 'fora.md'), join(projectsRoot, 'academia-lendaria', 'atalho.md'))

    const service = createProjectIntakeService({ store: fakeStore().store, projectsRoot })
    await expect(service.preview({ projectId: PROJECT.id, sourceSlug: 'academia-lendaria' })).rejects.toMatchObject({
      code: 'symlink-rejected',
    } satisfies Partial<ProjectIntakeError>)
  })

  it('rejects known secrets before import', async () => {
    await mkdir(join(projectsRoot, 'academia-lendaria'), { recursive: true })
    await writeFile(join(projectsRoot, 'academia-lendaria', '.env'), 'OPENAI_API_KEY=secret')

    const service = createProjectIntakeService({ store: fakeStore().store, projectsRoot })
    await expect(service.preview({ projectId: PROJECT.id, sourceSlug: 'academia-lendaria' })).rejects.toMatchObject({
      code: 'secret-rejected',
    } satisfies Partial<ProjectIntakeError>)
  })

  it('rejects files outside the allowlist', async () => {
    await mkdir(join(projectsRoot, 'academia-lendaria'), { recursive: true })
    await writeFile(join(projectsRoot, 'academia-lendaria', 'script.sh'), 'echo unsafe')

    const service = createProjectIntakeService({ store: fakeStore().store, projectsRoot })
    await expect(service.preview({ projectId: PROJECT.id, sourceSlug: 'academia-lendaria' })).rejects.toMatchObject({
      code: 'allowlist-violation',
    } satisfies Partial<ProjectIntakeError>)
  })

  it('persists confirmed metadata without duplicating the same project/path/hash', async () => {
    await mkdir(join(projectsRoot, 'academia-lendaria'), { recursive: true })
    await writeFile(join(projectsRoot, 'academia-lendaria', 'offerbook.md'), '# Offerbook\n')
    const { store, artifacts, saveArtifact } = fakeStore()
    const service = createProjectIntakeService({ store, projectsRoot })

    const preview = await service.preview({ projectId: PROJECT.id, sourceSlug: 'academia-lendaria' })
    const first = await service.confirm({
      projectId: PROJECT.id,
      sourceSlug: 'academia-lendaria',
      expectedManifestHash: preview.manifest.hash,
    })
    const second = await service.confirm({
      projectId: PROJECT.id,
      sourceSlug: 'academia-lendaria',
      expectedManifestHash: preview.manifest.hash,
    })

    expect(first.imported).toBe(1)
    expect(first.unchanged).toBe(0)
    expect(second.imported).toBe(0)
    expect(second.unchanged).toBe(1)
    expect(saveArtifact).toHaveBeenCalledTimes(1)
    expect(artifacts).toEqual([
      expect.objectContaining({
        path: 'offerbook.md',
        artifactType: 'offerbook',
        hash: sha256('# Offerbook\n'),
        source: 'filesystem',
      }),
    ])
  })
})

describe('project intake HTTP boundary', () => {
  const apps: Awaited<ReturnType<typeof buildApp>>[] = []

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()))
  })

  it('protects the local routes with the boundary token', async () => {
    const projectsRoot = await mkdtemp(join(tmpdir(), 'cohort-project-intake-http-'))
    await mkdir(join(projectsRoot, 'academia-lendaria'), { recursive: true })
    try {
      const service = createProjectIntakeService({ store: fakeStore().store, projectsRoot })
      const app = await buildApp({
        projectIntakeService: service,
        localRunnerToken: token,
        skillRunner: null,
        campaignRepo: null,
        recoverOnBoot: false,
      })
      apps.push(app)

      const missing = await app.inject({ method: 'GET', url: '/api/local/project-intake/sources' })
      expect(missing.statusCode).toBe(401)

      const allowed = await app.inject({
        method: 'GET',
        url: '/api/local/project-intake/sources',
        headers: { [LOCAL_RUNNER_TOKEN_HEADER]: token },
      })
      expect(allowed.statusCode).toBe(200)
      expect(allowed.json()).toEqual([{ slug: 'academia-lendaria', root: 'projetos/academia-lendaria' }])
    } finally {
      await rm(projectsRoot, { recursive: true, force: true })
    }
  })
})
