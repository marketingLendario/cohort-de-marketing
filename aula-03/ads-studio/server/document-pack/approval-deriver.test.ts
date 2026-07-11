import { describe, expect, it, vi } from 'vitest';
import { createDocumentPackApprovalDeriver, immutableRevisionPath } from './approval-deriver.js';

const repoRoot = new URL('../../../../', import.meta.url).pathname;

describe('document pack approval deriver', () => {
  it('uses canonical immutable paths for documents and collections', () => {
    expect(immutableRevisionPath('offerbook.md', 2, 'v-suffix')).toBe('offerbook-v2.md');
    expect(immutableRevisionPath('emails/venda.html', 2, 'version-directory')).toBe('emails/v2/venda.html');
  });
  it('derives the Offerbook DOCX from the approved canonical Markdown source', async () => {
    const content = Buffer.from('PK\u0003\u0004approved');
    const render = vi.fn(async () => ({
      content,
      contentHash: 'hash',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' as const,
    }));
    const derive = createDocumentPackApprovalDeriver({ repoRoot, render });

    const result = await derive({
      skillId: 'offerbook',
      projectSlug: 'demo',
      skillRunId: 'run-1',
      proposalRevision: 1,
      artifacts: [
        { artifactType: 'offerbook', title: 'Offerbook', path: 'offerbook.md', format: 'markdown', content: '# Aprovado' },
        { artifactType: 'offerbook', title: 'HTML', path: 'offerbook.html', format: 'html', content: '<!doctype html><html><body><main><h1>Offerbook</h1><a href="index.html">Voltar ao Book</a></main></body></html>' },
        { artifactType: 'offerbook', title: 'Briefing', path: 'briefing-offerbook.md', format: 'markdown', content: '# Briefing' },
      ],
    });

    expect(result).toHaveLength(7);
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({
      path: 'offerbook.docx',
      format: 'docx',
      derivedFrom: 'offerbook.md',
      content,
    }), expect.objectContaining({ path: 'offerbook-v1.docx' }), expect.objectContaining({ path: 'offerbook-v1.md' }), expect.objectContaining({ path: 'index.html' }), expect.objectContaining({ path: 'book-do-funil.json' })]));
    expect(render).toHaveBeenCalledWith(expect.objectContaining({
      repoRoot,
      sourceContent: '# Aprovado',
      output: expect.objectContaining({ renderer: 'offerbook-docx' }),
    }), undefined);
  });

  it('returns no derivative for a skill without a document-pack contract', async () => {
    const render = vi.fn();
    const derive = createDocumentPackApprovalDeriver({ repoRoot, render });
    await expect(derive({ skillId: 'zelador', projectSlug: 'demo', skillRunId: 'run-1', proposalRevision: 1, artifacts: [] })).resolves.toEqual([]);
    expect(render).not.toHaveBeenCalled();
  });

  it('fails closed when the approved source required by the contract is absent', async () => {
    const derive = createDocumentPackApprovalDeriver({ repoRoot, render: vi.fn() });
    await expect(derive({ skillId: 'copy-funil', projectSlug: 'demo', skillRunId: 'run-1', proposalRevision: 1, artifacts: [] }))
      .rejects.toThrow('copy.md');
  });
});
