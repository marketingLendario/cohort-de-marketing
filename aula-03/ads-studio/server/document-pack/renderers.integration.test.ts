import { describe, expect, it } from 'vitest';
import { renderDocumentPackOutput } from './renderers.js';

const realIt = process.env.DOCUMENT_PACK_REAL_RENDER === '1' ? it : it.skip;
const repoRoot = new URL('../../../../', import.meta.url).pathname;

describe('document pack real renderer integration', () => {
  realIt('renders a real PDF and Offerbook DOCX with installed local runtimes', async () => {
    const pdf = await renderDocumentPackOutput({
      repoRoot,
      output: { path: 'proof.pdf', format: 'pdf', sourcePath: 'proof.html', renderer: 'chromium-pdf' },
      sourceContent: '<!doctype html><html><body><h1>Documento aprovado</h1><p>Epic 11</p></body></html>',
    });
    const docx = await renderDocumentPackOutput({
      repoRoot,
      output: { path: 'offerbook.docx', format: 'docx', sourcePath: 'offerbook.md', renderer: 'offerbook-docx' },
      sourceContent: '# Offerbook - Prova Epic 11\n\n## Bloco 1 - Materiais\n\n### Links\n\nhttps://example.test\n',
    });
    const pdfReplay = await renderDocumentPackOutput({
      repoRoot,
      output: { path: 'proof.pdf', format: 'pdf', sourcePath: 'proof.html', renderer: 'chromium-pdf' },
      sourceContent: '<!doctype html><html><body><h1>Documento aprovado</h1><p>Epic 11</p></body></html>',
    });
    const docxReplay = await renderDocumentPackOutput({
      repoRoot,
      output: { path: 'offerbook.docx', format: 'docx', sourcePath: 'offerbook.md', renderer: 'offerbook-docx' },
      sourceContent: '# Offerbook - Prova Epic 11\n\n## Bloco 1 - Materiais\n\n### Links\n\nhttps://example.test\n',
    });

    expect(pdf.content.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.content.byteLength).toBeGreaterThan(1_000);
    expect(docx.content.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    expect(docx.content.byteLength).toBeGreaterThan(10_000);
    if (!pdf.content.equals(pdfReplay.content)) {
      const first = pdf.content.findIndex((byte, index) => byte !== pdfReplay.content[index]);
      console.info('PDF_FIRST_DIFF', first, pdf.content.subarray(Math.max(0, first - 80), first + 120).toString('latin1'));
    }
    if (!docx.content.equals(docxReplay.content)) {
      const first = docx.content.findIndex((byte, index) => byte !== docxReplay.content[index]);
      console.info('DOCX_FIRST_DIFF', first, docx.content.subarray(Math.max(0, first - 80), first + 120).toString('hex'));
    }
    expect(pdfReplay.content).toEqual(pdf.content);
    expect(docxReplay.content).toEqual(docx.content);
    console.info('DOCUMENT_PACK_REAL_EVIDENCE', JSON.stringify({
      pdf: { bytes: pdf.content.byteLength, hash: pdf.contentHash, mime: pdf.mimeType },
      docx: { bytes: docx.content.byteLength, hash: docx.contentHash, mime: docx.mimeType },
    }));
  }, 180_000);
});
