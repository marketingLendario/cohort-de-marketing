import { createHash } from 'node:crypto';
import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { DerivedDocumentPackOutput, DocumentPackProcessExecutor } from './renderers.js';
import { renderDocumentPackOutput } from './renderers.js';

const repoRoot = new URL('../../../../', import.meta.url).pathname;
const PDF = Buffer.from('%PDF-1.7\nfixture');
const DOCX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('fixture')]);

function sha256(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function pdfOutput(): DerivedDocumentPackOutput {
  return {
    path: 'copy.pdf',
    format: 'pdf',
    sourcePath: 'copy.html',
    renderer: 'chromium-pdf',
  };
}

function docxOutput(): DerivedDocumentPackOutput {
  return {
    path: 'offerbook.docx',
    format: 'docx',
    sourcePath: 'offerbook.md',
    renderer: 'offerbook-docx',
  };
}

describe('document pack renderers', () => {
  it('renders approved HTML with headless Chrome and returns a verified PDF', async () => {
    let temporaryDirectory = '';
    const executor = vi.fn<DocumentPackProcessExecutor>(async (execution) => {
      temporaryDirectory = execution.cwd;
      const outputArgument = execution.args.find((argument) => argument.startsWith('--print-to-pdf='));
      const sourceArgument = execution.args.at(-1);
      expect(outputArgument).toBeDefined();
      expect(sourceArgument).toMatch(/^file:/);
      expect(await readFile(new URL(sourceArgument!), 'utf8')).toBe('<main>Aprovado</main>');
      await writeFile(outputArgument!.slice('--print-to-pdf='.length), PDF);
    });

    const rendered = await renderDocumentPackOutput({
      repoRoot,
      output: pdfOutput(),
      sourceContent: '<main>Aprovado</main>',
    }, {
      executor,
      chromeExecutable: '/opt/google/chrome',
      timeoutMs: 4_321,
      environment: {
        PATH: '/safe/bin',
        HOME: '/safe/home',
        OPENAI_API_KEY: 'must-not-leak',
      },
    });

    expect(rendered).toEqual({ content: PDF, contentHash: sha256(PDF), mimeType: 'application/pdf' });
    expect(executor).toHaveBeenCalledOnce();
    const execution = executor.mock.calls[0][0];
    expect(execution.command).toBe('/opt/google/chrome');
    expect(execution.timeoutMs).toBe(4_321);
    expect(execution.shell).toBe(false);
    expect(execution.args).toEqual(expect.arrayContaining([
      '--headless=new',
      '--host-resolver-rules=MAP * ~NOTFOUND',
      expect.stringMatching(/^--user-data-dir=/),
    ]));
    expect(execution.env).toMatchObject({
      PATH: '/safe/bin',
      HOME: '/safe/home',
      TMPDIR: temporaryDirectory,
      TEMP: temporaryDirectory,
      TMP: temporaryDirectory,
      LANG: 'C.UTF-8',
      LC_ALL: 'C.UTF-8',
      TZ: 'UTC',
    });
    expect(execution.env.OPENAI_API_KEY).toBeUndefined();
    await expect(access(temporaryDirectory)).rejects.toThrow();
  });

  it('renders approved Markdown through the canonical Offerbook script and template', async () => {
    let temporaryDirectory = '';
    const executor = vi.fn<DocumentPackProcessExecutor>(async (execution) => {
      temporaryDirectory = execution.cwd;
      expect(await readFile(execution.args[1], 'utf8')).toBe('# Offerbook aprovado\n');
      const outputIndex = execution.args.indexOf('--output');
      await writeFile(execution.args[outputIndex + 1], DOCX);
    });

    const rendered = await renderDocumentPackOutput({
      repoRoot,
      output: docxOutput(),
      sourceContent: '# Offerbook aprovado\n',
    }, {
      executor,
      pythonExecutable: '/safe/python3',
    });

    expect(rendered).toEqual({
      content: DOCX,
      contentHash: sha256(DOCX),
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const execution = executor.mock.calls[0][0];
    expect(execution.command).toBe('/safe/python3');
    expect(execution.shell).toBe(false);
    expect(execution.args[0]).toBe(resolve(repoRoot, '.claude/skills/offerbook/scripts/gerar_docx.py'));
    expect(execution.args).toEqual(expect.arrayContaining([
      '--template',
      resolve(repoRoot, '.claude/skills/offerbook/templates/Template-Offerbook.docx'),
    ]));
    expect(dirname(execution.args[1])).toBe(temporaryDirectory);
    await expect(access(temporaryDirectory)).rejects.toThrow();
  });

  it.each([
    ['pdf', pdfOutput(), Buffer.from('not a pdf')],
    ['docx', docxOutput(), Buffer.from('not a docx')],
  ] as const)('rejects invalid %s magic bytes and still cleans up', async (_format, output, invalidContent) => {
    let temporaryDirectory = '';
    const executor: DocumentPackProcessExecutor = async (execution) => {
      temporaryDirectory = execution.cwd;
      const outputPath = output.format === 'pdf'
        ? execution.args.find((argument) => argument.startsWith('--print-to-pdf='))!.split('=', 2)[1]
        : execution.args[execution.args.indexOf('--output') + 1];
      await writeFile(outputPath, invalidContent);
    };

    await expect(renderDocumentPackOutput({ repoRoot, output, sourceContent: 'approved' }, { executor }))
      .rejects.toThrow(`arquivo ${output.format.toUpperCase()} com magic bytes inválidos`);
    await expect(access(temporaryDirectory)).rejects.toThrow();
  });

  it('rejects mismatched renderer/format pairs before invoking a subprocess', async () => {
    const executor = vi.fn<DocumentPackProcessExecutor>();
    const invalid = { ...pdfOutput(), renderer: 'offerbook-docx' as const };

    await expect(renderDocumentPackOutput({ repoRoot, output: invalid, sourceContent: '<main />' }, { executor }))
      .rejects.toThrow('incompatível com o formato pdf');
    expect(executor).not.toHaveBeenCalled();
  });
});
