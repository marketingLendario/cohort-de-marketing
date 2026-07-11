/**
 * STORY-8.W1.3 — Materializador atômico de artefatos.
 *
 * Materializa uma proposta aprovada em um arquivo canônico verificável dentro
 * de `projetos/{projectSlug}/`, de forma que o estado sobreviva ao chat e seja
 * consumido pelas próximas skills.
 *
 * Garantias:
 *  - Escrita apenas dentro de `projetos/{slug}/`, com slug e caminho relativo validados.
 *  - Proteção contra path traversal e escape por symlink (checagem estrutural de ancestrais).
 *  - Escrita atômica via arquivo temporário + rename no mesmo diretório.
 *  - SHA-256, idempotência (mesmo hash = no-op) e conflito explícito (divergência exige revisão).
 *  - Rollback sem corromper o arquivo canônico em caso de falha.
 *  - Evento de auditoria serializável (before/after).
 *
 * Contrato: `data/contracts/artifact-write.v1.schema.json` (app-local).
 */
import { createHash } from 'node:crypto';
import { isAbsolute } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  ConfinedFilesystemError,
  materializeConfinedArtifact,
  readConfinedArtifactFile,
} from './artifact-fs-worker-client.js';

export const ARTIFACT_WRITE_SCHEMA_VERSION = '1.0.0';

export type ArtifactFormat = 'markdown' | 'json' | 'yaml' | 'html' | 'text';

/** Requisição de escrita — espelha `artifact-write.v1.schema.json`. */
export interface ArtifactWriteRequest {
  schemaVersion: typeof ARTIFACT_WRITE_SCHEMA_VERSION;
  projectSlug: string;
  relativePath: string;
  format: ArtifactFormat;
  content: string;
  /** SHA-256 hex esperado do conteúdo (gate de integridade opcional). */
  expectedHash?: string;
  runId: string;
  /** Política de conflito quando já existe conteúdo divergente. Default: 'reject'. */
  onConflict?: 'reject' | 'overwrite';
}

export type ArtifactWriteOutcome = 'written' | 'unchanged' | 'conflict';

/** Evento de auditoria serializável emitido a cada materialização. */
export interface ArtifactAuditEvent {
  event: 'artifact.materialize';
  schemaVersion: typeof ARTIFACT_WRITE_SCHEMA_VERSION;
  projectSlug: string;
  relativePath: string;
  runId: string;
  format: ArtifactFormat;
  outcome: ArtifactWriteOutcome;
  hashBefore: string | null;
  hashAfter: string;
  bytesWritten: number;
  timestamp: string;
}

export interface ArtifactWriteResult {
  outcome: ArtifactWriteOutcome;
  /** SHA-256 hex do conteúdo canônico antes da operação (null = arquivo não existia). */
  hashBefore: string | null;
  /** SHA-256 hex do conteúdo proposto. */
  hashAfter: string;
  absolutePath: string;
  relativePath: string;
  /** Bytes efetivamente gravados (0 quando outcome != 'written'). */
  bytesWritten: number;
  audit: ArtifactAuditEvent;
}

/** Códigos de falha determinísticos — permitem tratamento treatable pelo caller. */
export type ArtifactErrorCode =
  | 'invalid-schema-version'
  | 'invalid-slug'
  | 'invalid-relative-path'
  | 'path-escape'
  | 'symlink-escape'
  | 'not-a-directory'
  | 'not-a-file'
  | 'hash-mismatch'
  | 'invalid-content'
  | 'write-failed';

export class ArtifactMaterializerError extends Error {
  readonly code: ArtifactErrorCode;
  constructor(code: ArtifactErrorCode, message: string) {
    super(message);
    this.name = 'ArtifactMaterializerError';
    this.code = code;
  }
}

export interface ArtifactMaterializerOptions {
  /** Raiz absoluta de `projetos/`. Todo write resolve para {projectsRoot}/{slug}/... */
  projectsRoot: string;
  /** Injeção de relógio para testes determinísticos. Default: () => new Date(). */
  now?: () => Date;
}

// Slug: minúsculas, dígitos e hífen; começa/termina alfanumérico; sem barra, ponto ou traversal.
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/;

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function assertValidSlug(slug: string): void {
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug) || slug.length > 100) {
    throw new ArtifactMaterializerError(
      'invalid-slug',
      `Slug de projeto inválido: ${JSON.stringify(slug)}. Use apenas minúsculas, dígitos e hífen.`,
    );
  }
}

/**
 * Canonical path contract shared by planning, approval and materialization.
 * Backslashes are aliases for POSIX separators and `.` segments are removed;
 * `..` is always rejected rather than resolved so the security boundary never
 * depends on the caller's platform.
 */
export function canonicalizeRelativeArtifactPath(relativePath: string): string {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new ArtifactMaterializerError('invalid-relative-path', 'Caminho relativo vazio.');
  }
  if (relativePath.includes('\0')) {
    throw new ArtifactMaterializerError('invalid-relative-path', 'Caminho relativo contém byte nulo.');
  }
  const slashPath = relativePath.replaceAll('\\', '/');
  if (isAbsolute(relativePath) || slashPath.startsWith('/') || /^[A-Za-z]:/.test(slashPath)) {
    throw new ArtifactMaterializerError(
      'invalid-relative-path',
      `Caminho relativo não pode ser absoluto: ${JSON.stringify(relativePath)}.`,
    );
  }
  // Rejeita '..' em qualquer segmento (tanto POSIX quanto Windows).
  const segments = slashPath.split('/');
  if (segments.some((segment) => segment === '..')) {
    throw new ArtifactMaterializerError(
      'invalid-relative-path',
      `Caminho relativo não pode conter '..': ${JSON.stringify(relativePath)}.`,
    );
  }
  const canonicalSegments = segments.filter((segment) => segment !== '' && segment !== '.');
  if (canonicalSegments.length === 0) {
    throw new ArtifactMaterializerError(
      'invalid-relative-path',
      `Caminho relativo não aponta para um arquivo: ${JSON.stringify(relativePath)}.`,
    );
  }
  return canonicalSegments.join('/');
}

/**
 * Canonicalize a path relative to one project. Some skills historically
 * returned the repository prefix (`projetos/{slug}/arquivo`) even though the
 * materializer is already anchored at `projetos/{slug}/`. Accept that exact
 * alias, but reject a prefix for another project instead of silently nesting
 * or crossing project boundaries.
 */
export function canonicalizeProjectArtifactPath(projectSlug: string, relativePath: string): string {
  assertValidSlug(projectSlug);
  const canonicalPath = canonicalizeRelativeArtifactPath(relativePath);
  const projectPrefix = `projetos/${projectSlug}/`;

  if (!canonicalPath.startsWith('projetos/')) return canonicalPath;
  if (!canonicalPath.startsWith(projectPrefix)) {
    throw new ArtifactMaterializerError(
      'invalid-relative-path',
      `Caminho de artefato fora do projeto ${JSON.stringify(projectSlug)}: ${JSON.stringify(relativePath)}.`,
    );
  }

  const projectRelativePath = canonicalPath.slice(projectPrefix.length);
  if (!projectRelativePath) {
    throw new ArtifactMaterializerError(
      'invalid-relative-path',
      `Caminho de artefato não aponta para um arquivo: ${JSON.stringify(relativePath)}.`,
    );
  }
  return projectRelativePath;
}

function validateContentFormat(format: ArtifactFormat, content: string): void {
  if (format === 'json') {
    try {
      JSON.parse(content);
    } catch (error) {
      throw new ArtifactMaterializerError(
        'invalid-content',
        `Conteúdo declarado como JSON não parseia: ${(error as Error).message}`,
      );
    }
  } else if (format === 'yaml') {
    try {
      parseYaml(content);
    } catch (error) {
      throw new ArtifactMaterializerError(
        'invalid-content',
        `Conteúdo declarado como YAML não parseia: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * Read-only operation confined to a helper process whose cwd is fixed to the
 * validated project directory. The helper returns the bytes itself; callers
 * never receive a pathname that they could read after the validation window.
 */
export async function readSafeArtifactFile(
  projectsRoot: string,
  slug: string,
  relativePath: string,
): Promise<string | null> {
  const canonicalPath = canonicalizeProjectArtifactPath(slug, relativePath);
  try {
    return await readConfinedArtifactFile(projectsRoot, slug, canonicalPath);
  } catch (error) {
    if (error instanceof ConfinedFilesystemError) {
      throw new ArtifactMaterializerError(error.code as ArtifactErrorCode, error.message);
    }
    throw error;
  }
}

/**
 * Materializa um artefato canônico de forma atômica, idempotente e verificável.
 *
 * @throws {ArtifactMaterializerError} para violações de segurança/integridade.
 *         Conflito de conteúdo divergente com `onConflict: 'reject'` NÃO lança —
 *         retorna `outcome: 'conflict'` (treatable, exige revisão explícita).
 */
export async function materializeArtifact(
  request: ArtifactWriteRequest,
  options: ArtifactMaterializerOptions,
): Promise<ArtifactWriteResult> {
  if (request.schemaVersion !== ARTIFACT_WRITE_SCHEMA_VERSION) {
    throw new ArtifactMaterializerError(
      'invalid-schema-version',
      `schemaVersion não suportada: ${JSON.stringify(request.schemaVersion)} (esperado ${ARTIFACT_WRITE_SCHEMA_VERSION}).`,
    );
  }

  assertValidSlug(request.projectSlug);
  const canonicalPath = canonicalizeProjectArtifactPath(request.projectSlug, request.relativePath);
  validateContentFormat(request.format, request.content);

  const hashAfter = sha256(request.content);
  if (request.expectedHash !== undefined) {
    if (!SHA256_HEX_PATTERN.test(request.expectedHash)) {
      throw new ArtifactMaterializerError(
        'hash-mismatch',
        `expectedHash não é um SHA-256 hex válido: ${JSON.stringify(request.expectedHash)}.`,
      );
    }
    if (request.expectedHash !== hashAfter) {
      throw new ArtifactMaterializerError(
        'hash-mismatch',
        `Hash do conteúdo (${hashAfter}) diverge do expectedHash (${request.expectedHash}).`,
      );
    }
  }

  const nowIso = (options.now ?? (() => new Date()))().toISOString();
  const buildAudit = (outcome: ArtifactWriteOutcome, hashBefore: string | null, bytesWritten: number): ArtifactAuditEvent => ({
    event: 'artifact.materialize',
    schemaVersion: ARTIFACT_WRITE_SCHEMA_VERSION,
    projectSlug: request.projectSlug,
    relativePath: canonicalPath,
    runId: request.runId,
    format: request.format,
    outcome,
    hashBefore,
    hashAfter,
    bytesWritten,
    timestamp: nowIso,
  });

  try {
    const result = await materializeConfinedArtifact({
      projectsRoot: options.projectsRoot,
      slug: request.projectSlug,
      relativePath: canonicalPath,
      content: request.content,
      hashAfter,
      onConflict: request.onConflict ?? 'reject',
    });
    return {
      ...result,
      audit: buildAudit(result.outcome, result.hashBefore, result.bytesWritten),
    };
  } catch (error) {
    if (error instanceof ConfinedFilesystemError) {
      throw new ArtifactMaterializerError(error.code as ArtifactErrorCode, error.message);
    }
    throw new ArtifactMaterializerError(
      'write-failed',
      `Falha na escrita confinada: ${(error as Error).message}`,
    );
  }
}
