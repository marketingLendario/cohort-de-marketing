import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

export interface ConfinedMaterializeResult {
  outcome: 'written' | 'unchanged' | 'conflict';
  hashBefore: string | null;
  hashAfter: string;
  absolutePath: string;
  relativePath: string;
  bytesWritten: number;
}

export class ConfinedFilesystemError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ConfinedFilesystemError';
    this.code = code;
  }
}

interface WorkerResponse {
  id: number;
  ok: boolean;
  result?: { missing?: boolean; content?: string | null } | ConfinedMaterializeResult;
  error?: { code?: string; message?: string };
}

interface PendingResponse {
  resolve: (result: WorkerResponse['result']) => void;
  reject: (error: Error) => void;
}

function workerCommand(): { args: string[] } {
  const compiled = fileURLToPath(new URL('./artifact-fs-worker.js', import.meta.url));
  if (existsSync(compiled)) return { args: [compiled] };
  const source = fileURLToPath(new URL('./artifact-fs-worker.ts', import.meta.url));
  return { args: ['--import', 'tsx/esm', source] };
}

class ConfinedFilesystemWorker {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<number, PendingResponse>();
  private nextId = 1;
  private closed = false;

  get isClosed(): boolean {
    return this.closed;
  }

  constructor() {
    this.child = spawn(process.execPath, workerCommand().args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });
    const lines = createInterface({ input: this.child.stdout });
    lines.on('line', (line) => this.handleResponse(line));
    this.child.stderr.on('data', () => {});
    // `stdin.write(..., callback)` não substitui o listener do stream: quando o
    // worker encerra sob carga, o pipe também emite `error` (EPIPE). Sem este
    // handler, a suíte e o processo BFF recebem uma uncaught exception tardia.
    this.child.stdin.on('error', (error) => this.fail(error));
    this.child.once('error', (error) => this.fail(error));
    this.child.once('exit', (code, signal) => {
      if (!this.closed) this.fail(new Error(`Filesystem worker terminou (${code ?? signal ?? 'unknown'}).`));
    });
  }

  private handleResponse(line: string): void {
    let response: WorkerResponse;
    try {
      response = JSON.parse(line) as WorkerResponse;
    } catch {
      this.fail(new Error('Filesystem worker retornou protocolo inválido.'));
      return;
    }
    const pending = this.pending.get(response.id);
    if (!pending) return;
    this.pending.delete(response.id);
    if (response.ok) pending.resolve(response.result);
    else pending.reject(new ConfinedFilesystemError(response.error?.code ?? 'write-failed', response.error?.message ?? 'Falha no worker filesystem.'));
  }

  private fail(error: Error): void {
    if (this.closed) return;
    this.closed = true;
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }

  request(payload: Record<string, unknown>): Promise<WorkerResponse['result']> {
    if (this.closed || !this.child.stdin.writable) return Promise.reject(new Error('Filesystem worker fechado.'));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.child.stdin.write(`${JSON.stringify({ id, ...payload })}\n`, (error) => {
        if (!error) return;
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    for (const pending of this.pending.values()) pending.reject(new Error('Filesystem worker encerrado.'));
    this.pending.clear();
    this.child.kill();
  }
}

const sessions = new Map<string, Promise<ConfinedFilesystemWorker | null>>();
type SessionHandle = {
  worker: ConfinedFilesystemWorker | null;
  promise: Promise<ConfinedFilesystemWorker | null>;
};

type SessionState = {
  worker: ConfinedFilesystemWorker;
  active: number;
};

const sessionStates = new Map<string, SessionState>();
const idleTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function sessionFor(projectsRoot: string, slug: string, forWrite: boolean): Promise<SessionHandle> {
  const key = `${projectsRoot}\0${slug}\0${forWrite ? 'write' : 'read'}`;
  const existing = sessions.get(key);
  if (existing) return { worker: await existing, promise: existing };
  const worker = new ConfinedFilesystemWorker();
  const session = worker
    .request({ type: 'init', projectsRoot, slug, forWrite })
    .then((result) => {
      if ((result as { missing?: boolean } | undefined)?.missing) {
        worker.close();
        if (sessions.get(key) === session) sessions.delete(key);
        return null;
      }
      sessionStates.set(key, { worker, active: 0 });
      return worker;
    })
    .catch((error) => {
      worker.close();
      if (sessions.get(key) === session) sessions.delete(key);
      const state = sessionStates.get(key);
      if (state?.worker === worker) sessionStates.delete(key);
      throw error;
    });
  sessions.set(key, session);
  return { worker: await session, promise: session };
}

function cancelIdleTimer(key: string): void {
  const prior = idleTimers.get(key);
  if (prior) clearTimeout(prior);
  idleTimers.delete(key);
}

function scheduleClose(key: string, worker: ConfinedFilesystemWorker): void {
  const state = sessionStates.get(key);
  if (!state || state.worker !== worker || state.active !== 0 || worker.isClosed) return;
  cancelIdleTimer(key);
  const timer = setTimeout(() => {
    if (idleTimers.get(key) !== timer) return;
    idleTimers.delete(key);
    const current = sessionStates.get(key);
    if (!current || current.worker !== worker || current.active !== 0 || worker.isClosed) return;
    sessionStates.delete(key);
    if (sessions.get(key)) sessions.delete(key);
    worker.close();
  }, 100);
  idleTimers.set(key, timer);
}

function invalidateSession(key: string, session: SessionHandle): void {
  if (sessions.get(key) === session.promise) sessions.delete(key);
  const state = sessionStates.get(key);
  if (state?.worker === session.worker) sessionStates.delete(key);
  cancelIdleTimer(key);
  session.worker?.close();
}

async function withSession<T>(
  projectsRoot: string,
  slug: string,
  forWrite: boolean,
  operation: (worker: ConfinedFilesystemWorker) => Promise<T>,
): Promise<T> {
  const key = `${projectsRoot}\0${slug}\0${forWrite ? 'write' : 'read'}`;
  cancelIdleTimer(key);
  const session = await sessionFor(projectsRoot, slug, forWrite);
  const worker = session.worker;
  if (!worker) return undefined as T;
  const state = sessionStates.get(key);
  if (!state || state.worker !== worker) {
    worker.close();
    throw new Error('Filesystem worker não possui estado de sessão válido.');
  }
  state.active += 1;
  try {
    return await operation(worker);
  } catch (error) {
    invalidateSession(key, session);
    throw error;
  } finally {
    state.active -= 1;
    if (sessionStates.get(key)?.worker === worker) scheduleClose(key, worker);
  }
}

export async function readConfinedArtifactFile(
  projectsRoot: string,
  slug: string,
  relativePath: string,
): Promise<string | null> {
  const result = await withSession(projectsRoot, slug, false, (worker) => worker.request({ type: 'read', relativePath }));
  return (result as { content?: string | null } | undefined)?.content ?? null;
}

export async function materializeConfinedArtifact(input: {
  projectsRoot: string;
  slug: string;
  relativePath: string;
  content: string;
  hashAfter: string;
  onConflict: 'reject' | 'overwrite';
}): Promise<ConfinedMaterializeResult> {
  const result = await withSession(input.projectsRoot, input.slug, true, (worker) =>
    worker.request({
      type: 'materialize',
      relativePath: input.relativePath,
      content: input.content,
      hashAfter: input.hashAfter,
      onConflict: input.onConflict,
    }),
  );
  return result as ConfinedMaterializeResult;
}
