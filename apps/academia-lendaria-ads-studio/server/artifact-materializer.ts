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
import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parse as parseYaml } from 'yaml';

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

function assertValidRelativePath(relativePath: string): void {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new ArtifactMaterializerError('invalid-relative-path', 'Caminho relativo vazio.');
  }
  if (relativePath.includes('\0')) {
    throw new ArtifactMaterializerError('invalid-relative-path', 'Caminho relativo contém byte nulo.');
  }
  if (isAbsolute(relativePath)) {
    throw new ArtifactMaterializerError(
      'invalid-relative-path',
      `Caminho relativo não pode ser absoluto: ${JSON.stringify(relativePath)}.`,
    );
  }
  // Rejeita '..' em qualquer segmento (tanto POSIX quanto Windows).
  const segments = relativePath.split(/[\\/]+/);
  if (segments.some((segment) => segment === '..')) {
    throw new ArtifactMaterializerError(
      'invalid-relative-path',
      `Caminho relativo não pode conter '..': ${JSON.stringify(relativePath)}.`,
    );
  }
  if (segments.every((segment) => segment === '' || segment === '.')) {
    throw new ArtifactMaterializerError(
      'invalid-relative-path',
      `Caminho relativo não aponta para um arquivo: ${JSON.stringify(relativePath)}.`,
    );
  }
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

async function pathExists(target: string): Promise<boolean> {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

/**
 * Resolve o alvo canônico dentro de `projetos/{slug}/`, criando os diretórios
 * intermediários de forma segura e recusando qualquer escape por symlink.
 *
 * A checagem estrutural percorre cada ancestral existente sob a raiz real do
 * projeto: se algum for symlink, aborta (não segue o link). Diretórios ausentes
 * são criados um a um dentro de território já verificado.
 */
async function resolveSafeTarget(
  projectsRoot: string,
  slug: string,
  relativePath: string,
): Promise<{ target: string; realProjectRoot: string }> {
  const projectRoot = resolve(projectsRoot, slug);
  await mkdir(projectRoot, { recursive: true });
  // realpath resolve symlinks da própria raiz (ex.: projetos/ montado via link) — o
  // território "seguro" passa a ser a raiz real resolvida.
  const realProjectRoot = await realpath(projectRoot);

  const target = resolve(realProjectRoot, relativePath);
  const withinRoot = target === realProjectRoot || target.startsWith(realProjectRoot + sep);
  if (!withinRoot) {
    throw new ArtifactMaterializerError(
      'path-escape',
      `Caminho resolvido escapa da raiz do projeto: ${target} ∉ ${realProjectRoot}`,
    );
  }

  // Percorre os diretórios ancestrais entre a raiz e o diretório-pai do alvo.
  const parentDir = dirname(target);
  const relParent = relative(realProjectRoot, parentDir);
  const segments = relParent.length === 0 ? [] : relParent.split(sep).filter(Boolean);

  let current = realProjectRoot;
  for (const segment of segments) {
    current = join(current, segment);
    if (await pathExists(current)) {
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) {
        throw new ArtifactMaterializerError(
          'symlink-escape',
          `Ancestral é symlink (escape recusado): ${current}`,
        );
      }
      if (!stat.isDirectory()) {
        throw new ArtifactMaterializerError(
          'not-a-directory',
          `Ancestral não é diretório: ${current}`,
        );
      }
    } else {
      await mkdir(current);
    }
  }

  // O próprio alvo, se já existir, não pode ser symlink nem diretório.
  if (await pathExists(target)) {
    const stat = await lstat(target);
    if (stat.isSymbolicLink()) {
      throw new ArtifactMaterializerError(
        'symlink-escape',
        `Alvo é symlink (escape recusado): ${target}`,
      );
    }
    if (!stat.isFile()) {
      throw new ArtifactMaterializerError('not-a-file', `Alvo existente não é arquivo: ${target}`);
    }
  }

  return { target, realProjectRoot };
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
  assertValidRelativePath(request.relativePath);
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

  const { target } = await resolveSafeTarget(
    options.projectsRoot,
    request.projectSlug,
    request.relativePath,
  );

  const nowIso = (options.now ?? (() => new Date()))().toISOString();
  const buildAudit = (outcome: ArtifactWriteOutcome, hashBefore: string | null, bytesWritten: number): ArtifactAuditEvent => ({
    event: 'artifact.materialize',
    schemaVersion: ARTIFACT_WRITE_SCHEMA_VERSION,
    projectSlug: request.projectSlug,
    relativePath: request.relativePath,
    runId: request.runId,
    format: request.format,
    outcome,
    hashBefore,
    hashAfter,
    bytesWritten,
    timestamp: nowIso,
  });

  // Estado canônico anterior.
  let hashBefore: string | null = null;
  if (await pathExists(target)) {
    hashBefore = sha256(await readFile(target, 'utf8'));
  }

  // Idempotência: mesmo hash = no-op.
  if (hashBefore === hashAfter) {
    return {
      outcome: 'unchanged',
      hashBefore,
      hashAfter,
      absolutePath: target,
      relativePath: request.relativePath,
      bytesWritten: 0,
      audit: buildAudit('unchanged', hashBefore, 0),
    };
  }

  // Conflito: conteúdo divergente exige revisão explícita (onConflict: 'overwrite').
  const onConflict = request.onConflict ?? 'reject';
  if (hashBefore !== null && onConflict === 'reject') {
    return {
      outcome: 'conflict',
      hashBefore,
      hashAfter,
      absolutePath: target,
      relativePath: request.relativePath,
      bytesWritten: 0,
      audit: buildAudit('conflict', hashBefore, 0),
    };
  }

  // Escrita atômica: arquivo temporário no mesmo diretório + rename.
  const bytes = Buffer.byteLength(request.content, 'utf8');
  const tempPath = join(dirname(target), `.${basename(target)}.${randomUUID()}.tmp`);
  try {
    await writeFile(tempPath, request.content, { encoding: 'utf8', flag: 'wx' });
    await rename(tempPath, target);
  } catch (error) {
    // Rollback: remove o temporário; o arquivo canônico permanece intacto.
    await rm(tempPath, { force: true });
    throw new ArtifactMaterializerError(
      'write-failed',
      `Falha na escrita atômica de ${target}: ${(error as Error).message}`,
    );
  }

  return {
    outcome: 'written',
    hashBefore,
    hashAfter,
    absolutePath: target,
    relativePath: request.relativePath,
    bytesWritten: bytes,
    audit: buildAudit('written', hashBefore, bytes),
  };
}
