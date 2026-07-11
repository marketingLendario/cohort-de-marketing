import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, realpath, rename, rm } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { basename, isAbsolute, join } from 'node:path';

type InitMessage = {
  id: number;
  type: 'init';
  projectsRoot: string;
  slug: string;
  forWrite: boolean;
};

type ReadMessage = {
  id: number;
  type: 'read';
  relativePath: string;
};

type MaterializeMessage = {
  id: number;
  type: 'materialize';
  relativePath: string;
  content: string;
  encoding?: 'utf8' | 'base64';
  hashAfter: string;
  onConflict: 'reject' | 'overwrite';
};

type WorkerMessage = InitMessage | ReadMessage | MaterializeMessage;

type WorkerResult =
  | { missing: true; content?: never }
  | { missing: false; content: string | null }
  | {
      outcome: 'written' | 'unchanged' | 'conflict';
      hashBefore: string | null;
      hashAfter: string;
      absolutePath: string;
      relativePath: string;
      bytesWritten: number;
    };

class WorkerFilesystemError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'WorkerFilesystemError';
    this.code = code;
  }
}

let initialized = false;
let projectsRootReal = '';
let projectRootReal = '';
let projectSlug = '';
let writeMode = false;

function sha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

function asWorkerError(error: unknown): WorkerFilesystemError {
  if (error instanceof WorkerFilesystemError) return error;
  const errno = error as NodeJS.ErrnoException;
  if (errno.code === 'ELOOP') return new WorkerFilesystemError('symlink-escape', errno.message);
  if (errno.code === 'EISDIR' || errno.code === 'ENOTDIR') return new WorkerFilesystemError('not-a-file', errno.message);
  return new WorkerFilesystemError('write-failed', error instanceof Error ? error.message : String(error));
}

async function assertTrustedDirectory(name: string, expected: string): Promise<void> {
  let stat;
  try {
    stat = await lstat(name);
  } catch (error) {
    throw asWorkerError(error);
  }
  if (stat.isSymbolicLink()) {
    throw new WorkerFilesystemError('symlink-escape', `Symlink recusado: ${name}`);
  }
  if (!stat.isDirectory()) {
    throw new WorkerFilesystemError('not-a-directory', `Não é diretório: ${name}`);
  }

  // The path can be swapped after lstat. chdir fixes the cwd to the inode that
  // was actually opened; realpath('.') then proves it is the identity we
  // validated before any leaf operation is attempted.
  const candidate = await realpath(name);
  if (candidate !== expected) {
    throw new WorkerFilesystemError(
      'symlink-escape',
      `Diretório não corresponde à identidade esperada: ${candidate} ≠ ${expected}`,
    );
  }
  process.chdir(name);
  const actual = await realpath('.');
  if (actual !== expected) {
    throw new WorkerFilesystemError('symlink-escape', `Diretório mudou durante a validação: ${actual} ≠ ${expected}`);
  }
}

async function reanchorProjectRoot(): Promise<boolean> {
  process.chdir(projectsRootReal);
  const actual = await realpath('.');
  if (actual !== projectsRootReal) {
    throw new WorkerFilesystemError(
      'symlink-escape',
      `projectsRoot mudou durante a reancoragem: ${actual} ≠ ${projectsRootReal}`,
    );
  }

  if (!(await pathExists(projectSlug))) {
    if (!writeMode) return false;
    try {
      await mkdir(projectSlug);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw asWorkerError(error);
    }
  }

  const expectedProjectRoot = join(projectsRootReal, projectSlug);
  await assertTrustedDirectory(projectSlug, expectedProjectRoot);
  projectRootReal = await realpath('.');
  return true;
}

async function enterProjectRoot(projectsRoot: string, slug: string, forWrite: boolean): Promise<boolean> {
  if (isAbsolute(slug) || slug.includes('/') || slug.includes('\\') || slug === '.' || slug === '..') {
    throw new WorkerFilesystemError('invalid-slug', `Slug inválido: ${slug}`);
  }

  projectSlug = slug;
  writeMode = forWrite;

  let rootReal: string;
  try {
    rootReal = await realpath(projectsRoot);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || !forWrite) {
      throw asWorkerError(error);
    }
    await mkdir(projectsRoot, { recursive: true });
    rootReal = await realpath(projectsRoot);
  }

  projectsRootReal = rootReal;
  process.chdir(rootReal);
  const actualProjectsRoot = await realpath('.');
  if (actualProjectsRoot !== rootReal) {
    throw new WorkerFilesystemError(
      'symlink-escape',
      `projectsRoot mudou durante a validação: ${actualProjectsRoot} ≠ ${rootReal}`,
    );
  }

  initialized = true;
  return reanchorProjectRoot();
}

async function enterParentDirectories(relativePath: string, createMissing: boolean): Promise<boolean> {
  if (!(await reanchorProjectRoot())) return false;
  const segments = relativePath.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new WorkerFilesystemError('invalid-relative-path', `Caminho não canônico: ${relativePath}`);
  }
  const traversed: string[] = [];
  for (const segment of segments.slice(0, -1)) {
    const expected = join(projectRootReal, ...traversed, segment);
    if (!(await pathExists(segment))) {
      if (!createMissing) return false;
      try {
        await mkdir(segment);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw asWorkerError(error);
      }
    }
    await assertTrustedDirectory(segment, expected);
    traversed.push(segment);
  }
  return true;
}

function assertNoFollowSupport(): number {
  const noFollow = (constants as unknown as Record<string, number | undefined>).O_NOFOLLOW;
  if (typeof noFollow !== 'number') {
    throw new WorkerFilesystemError('write-failed', 'O_NOFOLLOW não é suportado neste runtime.');
  }
  return noFollow;
}

async function readLeaf(relativePath: string): Promise<string | null> {
  if (!(await enterParentDirectories(relativePath, false))) return null;
  const leaf = basename(relativePath);
  const noFollow = assertNoFollowSupport();
  let handle;
  try {
    handle = await open(leaf, constants.O_RDONLY | noFollow);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw asWorkerError(error);
  }
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new WorkerFilesystemError('not-a-file', `Alvo não é arquivo: ${relativePath}`);
    return await handle.readFile({ encoding: 'utf8' });
  } finally {
    await handle.close();
  }
}

async function materializeLeaf(message: MaterializeMessage): Promise<WorkerResult> {
  if (!(await enterParentDirectories(message.relativePath, true))) {
    throw new WorkerFilesystemError('write-failed', 'Projeto não foi criado para escrita.');
  }
  const leaf = basename(message.relativePath);
  const content = message.encoding === 'base64' ? Buffer.from(message.content, 'base64') : Buffer.from(message.content, 'utf8');
  const noFollow = assertNoFollowSupport();
  let hashBefore: string | null = null;
  let existingHandle;
  try {
    existingHandle = await open(leaf, constants.O_RDONLY | noFollow);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw asWorkerError(error);
  }
  if (existingHandle) {
    try {
      const stat = await existingHandle.stat();
      if (!stat.isFile()) throw new WorkerFilesystemError('not-a-file', `Alvo não é arquivo: ${message.relativePath}`);
      hashBefore = sha256(await existingHandle.readFile());
    } finally {
      await existingHandle.close();
    }
  }

  if (hashBefore === message.hashAfter) {
    return {
      outcome: 'unchanged',
      hashBefore,
      hashAfter: message.hashAfter,
      absolutePath: join(projectRootReal, message.relativePath),
      relativePath: message.relativePath,
      bytesWritten: 0,
    };
  }
  if (hashBefore !== null && message.onConflict === 'reject') {
    return {
      outcome: 'conflict',
      hashBefore,
      hashAfter: message.hashAfter,
      absolutePath: join(projectRootReal, message.relativePath),
      relativePath: message.relativePath,
      bytesWritten: 0,
    };
  }

  const tempName = `.${leaf}.${randomUUID()}.tmp`;
  let tempHandle;
  try {
    tempHandle = await open(tempName, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o644);
    await tempHandle.writeFile(content);
    await tempHandle.sync();
    await tempHandle.close();
    tempHandle = undefined;
    // Both names are resolved relative to the already fixed project cwd. A
    // swapped pathname cannot redirect this rename outside that directory.
    await rename(tempName, leaf);
  } catch (error) {
    await tempHandle?.close().catch(() => {});
    await rm(tempName, { force: true }).catch(() => {});
    throw asWorkerError(error);
  }

  return {
    outcome: 'written',
    hashBefore,
    hashAfter: message.hashAfter,
    absolutePath: join(projectRootReal, message.relativePath),
    relativePath: message.relativePath,
    bytesWritten: content.length,
  };
}

async function handle(message: WorkerMessage): Promise<WorkerResult> {
  if (message.type === 'init') {
    const projectExists = await enterProjectRoot(message.projectsRoot, message.slug, message.forWrite);
    return projectExists ? { missing: false, content: null } : { missing: true };
  }
  if (!initialized) throw new WorkerFilesystemError('write-failed', 'Worker não inicializado.');
  if (message.type === 'read') return { missing: false, content: await readLeaf(message.relativePath) };
  return materializeLeaf(message);
}

function writeResponse(response: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

const input = createInterface({ input: process.stdin });
let queue = Promise.resolve();
input.on('line', (line) => {
  queue = queue.then(async () => {
    let message: WorkerMessage;
    try {
      message = JSON.parse(line) as WorkerMessage;
      const result = await handle(message);
      writeResponse({ id: message.id, ok: true, result });
    } catch (error) {
      const normalized = asWorkerError(error);
      const id = (() => {
        try {
          return (JSON.parse(line) as { id?: number }).id ?? null;
        } catch {
          return null;
        }
      })();
      writeResponse({ id, ok: false, error: { code: normalized.code, message: normalized.message } });
    }
  });
});
