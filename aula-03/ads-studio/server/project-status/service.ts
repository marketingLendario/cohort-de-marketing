import { createHash } from 'node:crypto'
import { lstat, readFile, readdir, realpath } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { parseBookDoFunilState } from '../document-pack/book-reconciler.js'
import { evaluateProjectStatus, type ProjectStatusArtifact, type ProjectStatusSnapshot } from './status.js'

export interface ProjectStatusProject {
  id: string
  slug: string
}

export interface ProjectStatusStore {
  getProject(projectId: string): Promise<ProjectStatusProject | undefined>
  listArtifacts(projectId: string): Promise<ProjectStatusArtifact[]>
}

export interface ProjectStatusResult extends ProjectStatusSnapshot {
  sourceHashes: {
    filesystem: string
    database: string
    book: string | null
    pendings: string | null
  }
  readOnly: true
  sourceIssues: Array<'book-state-invalid'>
}

export interface ProjectStatusService {
  read(projectId: string): Promise<ProjectStatusResult>
}

export class ProjectStatusError extends Error {
  readonly code: 'project-not-found' | 'invalid-project-slug' | 'symlink-rejected'

  constructor(code: 'project-not-found' | 'invalid-project-slug' | 'symlink-rejected', message: string) {
    super(message)
    this.name = 'ProjectStatusError'
    this.code = code
  }
}

function hash(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function posixPath(value: string): string {
  return value.split(sep).join('/')
}

function assertSafeSlug(slug: string): void {
  if (!slug || slug === '.' || slug === '..' || slug.includes('/') || slug.includes('\\') || slug.includes('..')) {
    throw new ProjectStatusError('invalid-project-slug', `Slug de projeto inválido: ${JSON.stringify(slug)}.`)
  }
}

async function scanProject(root: string): Promise<Array<{ path: string; hash: string }>> {
  const rootStats = await lstat(root).catch(() => null)
  if (!rootStats) return []
  if (rootStats.isSymbolicLink()) throw new ProjectStatusError('symlink-rejected', 'A raiz do projeto não pode ser um symlink.')
  const rootReal = await realpath(root)
  const output: Array<{ path: string; hash: string }> = []

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true })
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue
      const absolute = resolve(directory, entry.name)
      if (entry.isSymbolicLink()) throw new ProjectStatusError('symlink-rejected', `Symlink não permitido no status: ${entry.name}.`)
      if (entry.isDirectory()) {
        await walk(absolute)
        continue
      }
      if (!entry.isFile()) continue
      const escaped = relative(rootReal, await realpath(absolute))
      if (escaped.startsWith(`..${sep}`) || escaped === '..') {
        throw new ProjectStatusError('invalid-project-slug', 'Arquivo fora da raiz confinada do projeto.')
      }
      output.push({ path: posixPath(relative(rootReal, absolute)), hash: hash(await readFile(absolute)) })
    }
  }

  await walk(rootReal)
  return output.sort((left, right) => left.path.localeCompare(right.path))
}

export function createProjectStatusService(input: { store: ProjectStatusStore; projectsRoot: string }): ProjectStatusService {
  return {
    async read(projectId) {
      const project = await input.store.getProject(projectId)
      if (!project) throw new ProjectStatusError('project-not-found', `Projeto ${projectId} não encontrado.`)
      assertSafeSlug(project.slug)
      const projectRoot = resolve(input.projectsRoot, project.slug)
      const files = await scanProject(projectRoot)
      const fileMap = new Map(files.map((file) => [file.path, file.hash]))
      const bookContent = await readFile(resolve(projectRoot, 'book-do-funil.json'), 'utf8').catch(() => null)
      const pendingMarkdown = await readFile(resolve(projectRoot, 'pendencias.md'), 'utf8').catch(() => null)
      const profileMarkdown = await readFile(resolve(projectRoot, 'offerbook.md'), 'utf8').catch(() => null)
      const funnelMarkdown = await readFile(resolve(projectRoot, 'funil.md'), 'utf8').catch(() => null)
      const artifacts = await input.store.listArtifacts(project.id)
      const sourceIssues: ProjectStatusResult['sourceIssues'] = []
      let book = null
      try {
        book = parseBookDoFunilState(bookContent, project.slug)
      } catch {
        sourceIssues.push('book-state-invalid')
      }
      const status = evaluateProjectStatus({
        projectSlug: project.slug,
        filesystemPaths: files.map((file) => file.path),
        artifacts,
        book,
        pendingMarkdown,
        profileMarkdown,
        funnelMarkdown,
      })
      return {
        ...status,
        sourceHashes: {
          filesystem: hash(JSON.stringify(files)),
          database: hash(JSON.stringify([...artifacts].sort((left, right) => left.path.localeCompare(right.path)))),
          book: fileMap.get('book-do-funil.json') ?? null,
          pendings: fileMap.get('pendencias.md') ?? null,
        },
        readOnly: true,
        sourceIssues,
      }
    },
  }
}

export function createSupabaseProjectStatusStore(client: SupabaseClient): ProjectStatusStore {
  return {
    async getProject(projectId) {
      const { data, error } = await client.from('marketing_projects').select('id, slug').eq('id', projectId).maybeSingle()
      if (error) throw new Error(`Falha ao consultar o projeto para status: ${error.message}`)
      return data ? { id: String(data.id), slug: String(data.slug) } : undefined
    },
    async listArtifacts(projectId) {
      const { data, error } = await client.from('project_artifacts')
        .select('artifact_type, path, verification').eq('project_id', projectId)
      if (error) throw new Error(`Falha ao listar artefatos para status: ${error.message}`)
      return (data ?? []).map((row) => ({
        artifactType: String(row.artifact_type),
        path: String(row.path ?? ''),
        verification: String(row.verification ?? ''),
      }))
    },
  }
}
