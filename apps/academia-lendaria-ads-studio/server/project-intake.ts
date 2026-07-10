import { createHash } from 'node:crypto'
import { lstat, readFile, readdir, realpath } from 'node:fs/promises'
import { basename, extname, join, normalize, relative, resolve, sep } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'

export const PROJECT_INTAKE_MANIFEST_VERSION = 'filesystem-project-intake.v1' as const
export const PROJECT_INTAKE_ALLOWLIST_VERSION = 'filesystem-project-intake-allowlist.v1' as const
export const PROJECT_INTAKE_ALLOWLIST = [
  '**/*.md',
  '**/*.markdown',
  '**/*.html',
  '**/*.json',
  '**/*.yaml',
  '**/*.yml',
  '**/*.txt',
  '**/*.csv',
  '**/*.pdf',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.webp',
  '**/*.svg',
] as const

const ALLOWED_EXTENSIONS = new Set([
  '.md',
  '.markdown',
  '.html',
  '.json',
  '.yaml',
  '.yml',
  '.txt',
  '.csv',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
])

const FORBIDDEN_DIRECTORY_NAMES = new Set(['.git', '.svn', '.hg', 'node_modules', 'dist', 'build'])
const FORBIDDEN_FILE_NAMES = [
  /^\.env(?:\..+)?$/i,
  /^id_(?:rsa|ecdsa|ed25519)$/i,
  /^known_hosts$/i,
  /^authorized_keys$/i,
  /^credentials(?:\..+)?$/i,
  /^service-account(?:\..+)?$/i,
]

const SECRET_PATTERNS = [
  /OPENAI_API_KEY\s*=/,
  /CODEX_API_KEY\s*=/,
  /SUPABASE_SERVICE_ROLE_KEY\s*=/,
  /SUPABASE_DB_URL\s*=/,
  /ghp_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP )?PRIVATE KEY-----/,
]

export type IntakeFormat = 'markdown' | 'html' | 'json' | 'yaml' | 'csv' | 'pdf' | 'image' | 'other'
export type IntakeConflict = 'new' | 'unchanged' | 'conflict'

export interface ProjectIntakeSource {
  slug: string
  root: string
}

export interface ProjectIntakeProject {
  id: string
  workspaceId: string
  slug: string
  name: string
}

export interface ProjectIntakeArtifactRecord {
  id: string
  projectId: string
  path: string
  artifactType: string
  format: IntakeFormat
  hash: string | null
  source: string
  updatedAt: string
}

export interface ProjectIntakePreviewFile {
  path: string
  artifactType: string
  format: IntakeFormat
  hash: string
  sizeBytes: number
  conflict: IntakeConflict
  existingHash: string | null
}

export interface ProjectIntakeManifest {
  schemaVersion: typeof PROJECT_INTAKE_MANIFEST_VERSION
  allowlistVersion: typeof PROJECT_INTAKE_ALLOWLIST_VERSION
  root: 'projetos'
  sourceSlug: string
  sourcePath: string
  hash: string
  generatedAt: string
  fileCount: number
  allowlist: readonly string[]
  entries: Array<{
    path: string
    artifactType: string
    format: IntakeFormat
    hash: string
    sizeBytes: number
  }>
}

export interface ProjectIntakePreview {
  projectId: string
  projectSlug: string
  manifest: ProjectIntakeManifest
  files: ProjectIntakePreviewFile[]
  conflicts: Array<{ path: string; existingHash: string; incomingHash: string }>
}

export interface ProjectIntakeConfirmation {
  projectId: string
  projectSlug: string
  manifestHash: string
  sourcePath: string
  imported: number
  unchanged: number
  files: Array<{
    path: string
    artifactId: string
    hash: string
    outcome: 'imported' | 'updated' | 'unchanged'
  }>
}

export interface ProjectIntakeStore {
  getProject(projectId: string): Promise<ProjectIntakeProject | undefined>
  listArtifacts(projectId: string): Promise<ProjectIntakeArtifactRecord[]>
  saveArtifact(input: {
    id?: string
    workspaceId: string
    projectId: string
    artifactType: string
    title: string
    path: string
    format: IntakeFormat
    hash: string
  }): Promise<ProjectIntakeArtifactRecord>
}

export interface ProjectIntakeService {
  listSources(): Promise<ProjectIntakeSource[]>
  preview(input: { projectId: string; sourceSlug: string }): Promise<ProjectIntakePreview>
  confirm(input: { projectId: string; sourceSlug: string; expectedManifestHash: string }): Promise<ProjectIntakeConfirmation>
}

export type ProjectIntakeErrorCode =
  | 'project-not-found'
  | 'source-not-found'
  | 'path-traversal'
  | 'symlink-rejected'
  | 'secret-rejected'
  | 'allowlist-violation'
  | 'manifest-stale'
  | 'persist-failed'

export class ProjectIntakeError extends Error {
  readonly code: ProjectIntakeErrorCode

  constructor(code: ProjectIntakeErrorCode, message: string) {
    super(message)
    this.name = 'ProjectIntakeError'
    this.code = code
  }
}

function sha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex')
}

function toPosixPath(value: string): string {
  return value.split(sep).join('/')
}

function normalizeRelativePath(value: string): string {
  const normalized = toPosixPath(normalize(value)).replace(/^\/+/, '')
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new ProjectIntakeError('path-traversal', `Path inválido fora da raiz permitida: ${value}`)
  }
  return normalized
}

function ensureSourceSlug(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('/') || trimmed.includes('\\') || trimmed === '.' || trimmed === '..' || trimmed.includes('..')) {
    throw new ProjectIntakeError('path-traversal', `Diretório de origem inválido: ${value}`)
  }
  return trimmed
}

function classifyFormat(path: string): IntakeFormat {
  const extension = extname(path).toLowerCase()
  if (extension === '.md' || extension === '.markdown' || extension === '.txt') return 'markdown'
  if (extension === '.html') return 'html'
  if (extension === '.json') return 'json'
  if (extension === '.yaml' || extension === '.yml') return 'yaml'
  if (extension === '.csv') return 'csv'
  if (extension === '.pdf') return 'pdf'
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(extension)) return 'image'
  return 'other'
}

function deriveArtifactType(path: string): string {
  const withoutExtension = path.replace(/\.[^./]+$/, '')
  const segments = withoutExtension
    .split('/')
    .map((segment) => segment.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .map((segment) => segment.replace(/[^a-zA-Z0-9]+/g, ' ').trim())
    .filter(Boolean)
  if (segments.length === 0) return 'filesystemArtifact'
  const words = segments.flatMap((segment) => segment.split(/\s+/))
  const [first, ...rest] = words
  return `${first.charAt(0).toLowerCase()}${first.slice(1)}${rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('')}`
}

function titleFromPath(path: string): string {
  return basename(path).replace(/\.[^./]+$/, '')
}

function isAllowlisted(path: string): boolean {
  const extension = extname(path).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(extension)) return false
  return path.split('/').every((segment) => segment.length > 0 && !segment.startsWith('.'))
}

function looksLikeKnownSecret(path: string, content: Buffer): boolean {
  const fileName = basename(path)
  if (FORBIDDEN_FILE_NAMES.some((pattern) => pattern.test(fileName))) return true
  if (content.includes(0)) return false
  const sample = content.subarray(0, 16_384).toString('utf8')
  return SECRET_PATTERNS.some((pattern) => pattern.test(sample))
}

function pickNewestByPath(artifacts: ProjectIntakeArtifactRecord[]): Map<string, ProjectIntakeArtifactRecord> {
  const byPath = new Map<string, ProjectIntakeArtifactRecord>()
  for (const artifact of artifacts) {
    const current = byPath.get(artifact.path)
    if (!current || Date.parse(current.updatedAt) < Date.parse(artifact.updatedAt)) {
      byPath.set(artifact.path, artifact)
    }
  }
  return byPath
}

async function resolveConfinedPath(root: string, relativePath: string): Promise<string> {
  const expected = resolve(root, relativePath)
  const stats = await lstat(expected).catch(() => null)
  if (!stats) {
    throw new ProjectIntakeError('source-not-found', `Diretório não encontrado em projetos/: ${relativePath}`)
  }
  if (stats.isSymbolicLink()) {
    throw new ProjectIntakeError('symlink-rejected', `Symlink não permitido no intake: ${relativePath}`)
  }
  const real = await realpath(expected)
  const escaped = relative(root, real)
  if (escaped === '..' || escaped.startsWith(`..${sep}`) || escaped.includes(`${sep}..${sep}`)) {
    throw new ProjectIntakeError('path-traversal', `Path fora de projetos/: ${relativePath}`)
  }
  return real
}

async function collectFiles(root: string, current: string, output: ProjectIntakeManifest['entries']): Promise<void> {
  const entries = await readdir(current, { withFileTypes: true })
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = join(current, entry.name)
    const relativePath = normalizeRelativePath(toPosixPath(relative(root, absolutePath)))
    if (entry.isSymbolicLink()) {
      throw new ProjectIntakeError('symlink-rejected', `Symlink não permitido no intake: ${relativePath}`)
    }
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || FORBIDDEN_DIRECTORY_NAMES.has(entry.name)) {
        continue
      }
      await collectFiles(root, absolutePath, output)
      continue
    }
    if (!entry.isFile()) continue
    if (FORBIDDEN_FILE_NAMES.some((pattern) => pattern.test(basename(relativePath)))) {
      throw new ProjectIntakeError('secret-rejected', `Arquivo rejeitado por conter segredo conhecido: ${relativePath}`)
    }
    if (!isAllowlisted(relativePath)) {
      throw new ProjectIntakeError('allowlist-violation', `Arquivo fora da allowlist: ${relativePath}`)
    }
    const content = await readFile(absolutePath)
    if (looksLikeKnownSecret(relativePath, content)) {
      throw new ProjectIntakeError('secret-rejected', `Arquivo rejeitado por conter segredo conhecido: ${relativePath}`)
    }
    output.push({
      path: relativePath,
      artifactType: deriveArtifactType(relativePath),
      format: classifyFormat(relativePath),
      hash: sha256(content),
      sizeBytes: content.byteLength,
    })
  }
}

export function createProjectIntakeService({
  store,
  projectsRoot,
}: {
  store: ProjectIntakeStore
  projectsRoot: string
}): ProjectIntakeService {
  async function readPreview(input: { projectId: string; sourceSlug: string }): Promise<ProjectIntakePreview> {
    const project = await store.getProject(input.projectId)
    if (!project) throw new ProjectIntakeError('project-not-found', `Projeto ${input.projectId} não encontrado.`)

    const root = await realpath(projectsRoot).catch(() => resolve(projectsRoot))
    const sourceSlug = ensureSourceSlug(input.sourceSlug)
    const sourceDirectory = await resolveConfinedPath(root, sourceSlug)
    const manifestEntries: ProjectIntakeManifest['entries'] = []
    await collectFiles(sourceDirectory, sourceDirectory, manifestEntries)
    manifestEntries.sort((left, right) => left.path.localeCompare(right.path))

    const artifacts = await store.listArtifacts(project.id)
    const artifactsByPath = pickNewestByPath(artifacts)
    const files = manifestEntries.map<ProjectIntakePreviewFile>((entry) => {
      const existing = artifactsByPath.get(entry.path)
      const existingHash = existing?.hash ?? null
      const conflict: IntakeConflict =
        existingHash === null ? 'new' : existingHash === entry.hash ? 'unchanged' : 'conflict'
      return { ...entry, conflict, existingHash }
    })
    const conflicts = files
      .filter((file) => file.conflict === 'conflict' && file.existingHash)
      .map((file) => ({ path: file.path, existingHash: file.existingHash!, incomingHash: file.hash }))

    const manifest = {
      schemaVersion: PROJECT_INTAKE_MANIFEST_VERSION,
      allowlistVersion: PROJECT_INTAKE_ALLOWLIST_VERSION,
      root: 'projetos' as const,
      sourceSlug,
      sourcePath: `projetos/${sourceSlug}`,
      generatedAt: new Date().toISOString(),
      fileCount: manifestEntries.length,
      allowlist: PROJECT_INTAKE_ALLOWLIST,
      entries: manifestEntries,
      hash: sha256(
        JSON.stringify({
          projectId: project.id,
          sourceSlug,
          entries: files.map((file) => ({
            path: file.path,
            artifactType: file.artifactType,
            format: file.format,
            hash: file.hash,
          })),
        }),
      ),
    } satisfies ProjectIntakeManifest

    return {
      projectId: project.id,
      projectSlug: project.slug,
      manifest,
      files,
      conflicts,
    }
  }

  return {
    async listSources() {
      const root = await realpath(projectsRoot).catch(() => null)
      if (!root) return []
      const entries = await readdir(root, { withFileTypes: true }).catch(() => [])
      return entries
        .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink() && !entry.name.startsWith('.'))
        .map((entry) => ({ slug: entry.name, root: `projetos/${entry.name}` }))
        .sort((left, right) => left.slug.localeCompare(right.slug))
    },

    preview: readPreview,

    async confirm(input) {
      const preview = await readPreview(input)
      if (preview.manifest.hash !== input.expectedManifestHash) {
        throw new ProjectIntakeError('manifest-stale', 'O preview mudou antes da confirmação humana. Gere um novo preview.')
      }
      const project = await store.getProject(input.projectId)
      if (!project) throw new ProjectIntakeError('project-not-found', `Projeto ${input.projectId} não encontrado.`)

      const existingArtifacts = pickNewestByPath(await store.listArtifacts(project.id))
      const results: ProjectIntakeConfirmation['files'] = []
      let imported = 0
      let unchanged = 0

      for (const file of preview.files) {
        const existing = existingArtifacts.get(file.path)
        if (existing?.hash === file.hash) {
          unchanged += 1
          results.push({ path: file.path, artifactId: existing.id, hash: file.hash, outcome: 'unchanged' })
          continue
        }
        const persisted = await store.saveArtifact({
          id: existing?.id,
          workspaceId: project.workspaceId,
          projectId: project.id,
          artifactType: file.artifactType,
          title: titleFromPath(file.path),
          path: file.path,
          format: file.format,
          hash: file.hash,
        }).catch((error) => {
          throw new ProjectIntakeError('persist-failed', error instanceof Error ? error.message : 'Falha ao persistir o intake.')
        })
        imported += 1
        results.push({
          path: file.path,
          artifactId: persisted.id,
          hash: file.hash,
          outcome: existing ? 'updated' : 'imported',
        })
      }

      return {
        projectId: project.id,
        projectSlug: project.slug,
        manifestHash: preview.manifest.hash,
        sourcePath: preview.manifest.sourcePath,
        imported,
        unchanged,
        files: results,
      }
    },
  }
}

export function createSupabaseProjectIntakeStore(client: SupabaseClient): ProjectIntakeStore {
  return {
    async getProject(projectId) {
      const { data, error } = await client
        .from('marketing_projects')
        .select('id, workspace_id, slug, name')
        .eq('id', projectId)
        .maybeSingle()
      if (error) throw new Error(`Falha ao consultar o projeto do intake: ${error.message}`)
      if (!data) return undefined
      return {
        id: data.id as string,
        workspaceId: data.workspace_id as string,
        slug: data.slug as string,
        name: data.name as string,
      }
    },

    async listArtifacts(projectId) {
      const { data, error } = await client
        .from('project_artifacts')
        .select('id, project_id, path, artifact_type, format, content_hash, source, updated_at')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
      if (error) throw new Error(`Falha ao listar artefatos do intake: ${error.message}`)
      return (data as Array<Record<string, unknown>> | null ?? []).map((row) => ({
        id: row.id as string,
        projectId: row.project_id as string,
        path: (row.path as string | null) ?? '',
        artifactType: row.artifact_type as string,
        format: (row.format as IntakeFormat | undefined) ?? 'other',
        hash: (row.content_hash as string | null) ?? null,
        source: (row.source as string | undefined) ?? 'filesystem',
        updatedAt: row.updated_at as string,
      }))
    },

    async saveArtifact(input) {
      const payload = {
        workspace_id: input.workspaceId,
        project_id: input.projectId,
        artifact_type: input.artifactType,
        title: input.title,
        path: input.path,
        format: input.format,
        state: 'confirmed',
        verification: 'confirmed',
        source: 'filesystem',
        content: null,
        content_hash: input.hash,
        skill_run_id: null,
        updated_at: new Date().toISOString(),
      }
      if (input.id) {
        const { data, error } = await client
          .from('project_artifacts')
          .update(payload)
          .eq('id', input.id)
          .select('id, project_id, path, artifact_type, format, content_hash, source, updated_at')
          .single()
        if (error) throw new Error(`Falha ao atualizar metadata do intake: ${error.message}`)
        return {
          id: data.id as string,
          projectId: data.project_id as string,
          path: (data.path as string | null) ?? '',
          artifactType: data.artifact_type as string,
          format: (data.format as IntakeFormat | undefined) ?? 'other',
          hash: (data.content_hash as string | null) ?? null,
          source: (data.source as string | undefined) ?? 'filesystem',
          updatedAt: data.updated_at as string,
        }
      }
      const { data, error } = await client
        .from('project_artifacts')
        .insert(payload)
        .select('id, project_id, path, artifact_type, format, content_hash, source, updated_at')
        .single()
      if (error) throw new Error(`Falha ao registrar metadata do intake: ${error.message}`)
      return {
        id: data.id as string,
        projectId: data.project_id as string,
        path: (data.path as string | null) ?? '',
        artifactType: data.artifact_type as string,
        format: (data.format as IntakeFormat | undefined) ?? 'other',
        hash: (data.content_hash as string | null) ?? null,
        source: (data.source as string | undefined) ?? 'filesystem',
        updatedAt: data.updated_at as string,
      }
    },
  }
}
