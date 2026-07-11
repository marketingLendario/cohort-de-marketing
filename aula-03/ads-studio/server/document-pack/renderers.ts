import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { DocumentPackContract } from './contracts.js';

export type DerivedDocumentPackOutput = DocumentPackContract['derivedOutputs'][number];

export type DocumentPackMime =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface RenderedDocumentPackOutput {
  content: Buffer;
  contentHash: string;
  mimeType: DocumentPackMime;
}

export interface DocumentPackProcessExecution {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
  shell: false;
  /** Chrome on macOS may keep its process alive after the PDF is complete. */
  completionFile?: string;
}

export interface DocumentPackProcessResult {
  stdout: string;
  stderr: string;
}

export type DocumentPackProcessExecutor = (
  execution: DocumentPackProcessExecution,
) => Promise<DocumentPackProcessResult | void>;

export interface DocumentPackRenderInput {
  repoRoot: string;
  output: DerivedDocumentPackOutput;
  sourceContent: string | Buffer;
}

export interface DocumentPackRendererOptions {
  executor?: DocumentPackProcessExecutor;
  chromeExecutable?: string;
  pythonExecutable?: string;
  timeoutMs?: number;
  tempRoot?: string;
  environment?: NodeJS.ProcessEnv;
}

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_SUBPROCESS_OUTPUT_BYTES = 1024 * 1024;

const DOCUMENT_RENDERER_ENV_ALLOWLIST = new Set([
  'PATH',
  'HOME',
  'TMPDIR',
  'TEMP',
  'TMP',
  'LANG',
  'LANGUAGE',
  'LC_ALL',
  'LC_CTYPE',
  'TZ',
  'SystemRoot',
  'WINDIR',
  'COMSPEC',
  'PATHEXT',
]);

function defaultChromeExecutable(environment: NodeJS.ProcessEnv): string {
  if (environment.CHROME_PATH && !environment.CHROME_PATH.includes('\0')) {
    return environment.CHROME_PATH;
  }
  if (process.platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  if (process.platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  return 'google-chrome';
}

function positiveTimeout(value: number | undefined): number {
  if (value === undefined) return DEFAULT_TIMEOUT_MS;
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('O timeout do renderer deve ser um inteiro positivo em milissegundos.');
  }
  return value;
}

function sanitizeEnvironment(environment: NodeJS.ProcessEnv, temporaryDirectory: string): NodeJS.ProcessEnv {
  const sanitized: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(environment)) {
    if (!DOCUMENT_RENDERER_ENV_ALLOWLIST.has(key) || value === undefined || value.includes('\0')) continue;
    sanitized[key] = value;
  }

  return {
    ...sanitized,
    TMPDIR: temporaryDirectory,
    TEMP: temporaryDirectory,
    TMP: temporaryDirectory,
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    TZ: 'UTC',
    PYTHONHASHSEED: '0',
    PYTHONIOENCODING: 'utf-8',
  };
}

const defaultExecutor: DocumentPackProcessExecutor = (execution) => new Promise((resolvePromise, reject) => {
  const child = spawn(execution.command, execution.args, {
    cwd: execution.cwd,
    env: execution.env,
    shell: execution.shell,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  let settled = false;
  let completionReady = false;
  let lastCompletionSize = -1;
  let stableCompletionPolls = 0;
  let polling = false;

  const completionPoll = execution.completionFile ? setInterval(async () => {
    if (polling || settled) return;
    polling = true;
    try {
      const info = await stat(execution.completionFile!);
      stableCompletionPolls = info.size > 0 && info.size === lastCompletionSize ? stableCompletionPolls + 1 : 0;
      lastCompletionSize = info.size;
      if (stableCompletionPolls >= 2) {
        completionReady = true;
        child.kill('SIGTERM');
      }
    } catch {
      stableCompletionPolls = 0;
    } finally {
      polling = false;
    }
  }, 100) : undefined;

  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    child.kill('SIGKILL');
    if (completionPoll) clearInterval(completionPoll);
    reject(new Error(`O subprocesso do renderer excedeu ${execution.timeoutMs}ms (${execution.command}).`));
  }, execution.timeoutMs);

  const finish = (error?: Error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    if (completionPoll) clearInterval(completionPoll);
    if (error) reject(error);
    else resolvePromise({ stdout, stderr });
  };

  const collect = (current: string, chunk: Buffer): string => {
    const next = current + chunk.toString('utf8');
    if (Buffer.byteLength(next) > MAX_SUBPROCESS_OUTPUT_BYTES) {
      child.kill('SIGKILL');
      finish(new Error(`O subprocesso do renderer excedeu o limite de saída (${execution.command}).`));
    }
    return next;
  };
  child.stdout.on('data', (chunk: Buffer) => { stdout = collect(stdout, chunk); });
  child.stderr.on('data', (chunk: Buffer) => { stderr = collect(stderr, chunk); });
  child.once('error', (error) => finish(new Error(`O subprocesso do renderer falhou (${execution.command}: ${error.message}).`, { cause: error })));
  child.once('close', (code, signal) => {
    if (code === 0 || completionReady) finish();
    else finish(new Error(`O subprocesso do renderer falhou (${execution.command}: ${code ?? signal ?? 'unknown'}).`));
  });
});

function assertMagicBytes(format: DerivedDocumentPackOutput['format'], content: Buffer): void {
  const valid = format === 'pdf'
    ? content.length >= 5 && content.subarray(0, 5).equals(Buffer.from('%PDF-'))
    : content.length >= 4 && content.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));

  if (!valid) {
    throw new Error(`O renderer produziu um arquivo ${format.toUpperCase()} com magic bytes inválidos.`);
  }
}

function normalizePdfMetadata(content: Buffer): Buffer {
  let text = content.toString('latin1');
  const fixedDigits = '197001010000000000000000';
  text = text.replace(/D:\d{14}(?:[+-]\d{2}'\d{2}')?/g, (date) => {
    let digit = 0;
    return date.replace(/\d/g, () => fixedDigits[digit++] ?? '0');
  });
  text = text.replace(/\/ID\s*\[\s*<([a-fA-F0-9]+)>\s*<([a-fA-F0-9]+)>\s*\]/g, (full, first: string, second: string) =>
    full.replace(`<${first}>`, `<${'0'.repeat(first.length)}>`).replace(`<${second}>`, `<${'0'.repeat(second.length)}>`));
  return Buffer.from(text, 'latin1');
}

function normalizeZipTimestamps(content: Buffer): Buffer {
  const normalized = Buffer.from(content);
  for (let offset = 0; offset <= normalized.length - 16; offset += 1) {
    const signature = normalized.readUInt32LE(offset);
    const timestampOffset = signature === 0x04034b50 ? offset + 10 : signature === 0x02014b50 ? offset + 12 : -1;
    if (timestampOffset < 0) continue;
    normalized.writeUInt16LE(0, timestampOffset);
    normalized.writeUInt16LE(0x21, timestampOffset + 2);
  }
  return normalized;
}

/** Remove volatile renderer metadata while preserving the binary structure. */
export function normalizeDocumentPackBinary(
  format: DerivedDocumentPackOutput['format'],
  content: Buffer,
): Buffer {
  return format === 'pdf' ? normalizePdfMetadata(content) : normalizeZipTimestamps(content);
}

function mimeFor(format: DerivedDocumentPackOutput['format']): DocumentPackMime {
  return format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

function validateRendererPair(output: DerivedDocumentPackOutput): void {
  const expectedRenderer = output.format === 'pdf' ? 'chromium-pdf' : 'offerbook-docx';
  if (output.renderer !== expectedRenderer) {
    throw new Error(`Renderer ${output.renderer} incompatível com o formato ${output.format}.`);
  }
}

async function renderPdf(
  outputPath: string,
  sourcePath: string,
  execution: Omit<DocumentPackProcessExecution, 'command' | 'args'>,
  executor: DocumentPackProcessExecutor,
  chromeExecutable: string,
): Promise<void> {
  await executor({
    ...execution,
    command: chromeExecutable,
    completionFile: outputPath,
    args: [
      '--headless=new',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pdf-header-footer',
      '--host-resolver-rules=MAP * ~NOTFOUND',
      `--user-data-dir=${join(execution.cwd, 'chrome-profile')}`,
      `--print-to-pdf=${outputPath}`,
      pathToFileURL(sourcePath).href,
    ],
  });
}

async function renderOfferbookDocx(
  outputPath: string,
  sourcePath: string,
  execution: Omit<DocumentPackProcessExecution, 'command' | 'args'>,
  executor: DocumentPackProcessExecutor,
  pythonExecutable: string,
  repoRoot: string,
): Promise<void> {
  const offerbookRoot = resolve(repoRoot, '.claude/skills/offerbook');
  await executor({
    ...execution,
    command: pythonExecutable,
    args: [
      resolve(offerbookRoot, 'scripts/gerar_docx.py'),
      sourcePath,
      '--output',
      outputPath,
      '--template',
      resolve(offerbookRoot, 'templates/Template-Offerbook.docx'),
    ],
  });
}

export async function renderDocumentPackOutput(
  input: DocumentPackRenderInput,
  options: DocumentPackRendererOptions = {},
): Promise<RenderedDocumentPackOutput> {
  const { output, repoRoot, sourceContent } = input;
  validateRendererPair(output);
  const timeoutMs = positiveTimeout(options.timeoutMs);
  const temporaryDirectory = await mkdtemp(join(options.tempRoot ?? tmpdir(), 'document-pack-'));

  try {
    const sourcePath = join(temporaryDirectory, output.format === 'pdf' ? 'approved-source.html' : 'approved-source.md');
    const renderedPath = join(temporaryDirectory, output.format === 'pdf' ? 'rendered.pdf' : 'rendered.docx');
    await writeFile(sourcePath, sourceContent);

    const environment = options.environment ?? process.env;
    const execution = {
      cwd: temporaryDirectory,
      env: sanitizeEnvironment(environment, temporaryDirectory),
      timeoutMs,
      shell: false as const,
    };
    const executor = options.executor ?? defaultExecutor;

    if (output.renderer === 'chromium-pdf') {
      await renderPdf(
        renderedPath,
        sourcePath,
        execution,
        executor,
        options.chromeExecutable ?? defaultChromeExecutable(environment),
      );
    } else {
      await renderOfferbookDocx(
        renderedPath,
        sourcePath,
        execution,
        executor,
        options.pythonExecutable ?? 'python3',
        repoRoot,
      );
    }

    const content = normalizeDocumentPackBinary(output.format, await readFile(renderedPath));
    assertMagicBytes(output.format, content);
    return {
      content,
      contentHash: createHash('sha256').update(content).digest('hex'),
      mimeType: mimeFor(output.format),
    };
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

export const renderDerivedDocumentPackOutput = renderDocumentPackOutput;
