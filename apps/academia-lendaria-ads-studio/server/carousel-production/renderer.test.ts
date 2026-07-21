import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  CarouselRenderAbortError,
  playwrightSlideRenderer,
  renderCarouselBatch,
  type CarouselRenderResult,
  type SlideRenderer,
} from './renderer.js';
import { PNG_SIGNATURE, readPngDimensions } from './png.js';
import { crc32, readDeterministicZip } from './zip.js';

const LOCAL_HEADER_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const DUMMY_HTML = '<!doctype html><html><body><div class="slide"></div></body></html>';

/** PNG grayscale 8-bit válido de dimensão arbitrária, sem navegador. */
function makePng(width: number, height: number, fill = 0): Buffer {
  const chunk = (type: string, data: Buffer): Buffer => {
    const typeBuffer = Buffer.from(type, 'latin1');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 0;
  const rowLength = width + 1;
  const raw = Buffer.alloc(rowLength * height, fill);
  for (let y = 0; y < height; y += 1) raw[y * rowLength] = 0;
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Slides canônicos, distintos entre si mas determinísticos por índice. */
function canonicalSlides(count: number): Buffer[] {
  return Array.from({ length: count }, (_unused, index) => makePng(1080, 1350, (index + 1) * 17));
}

function stubRenderer(buffers: Buffer[], onCall?: (request: Parameters<SlideRenderer>[0]) => void): SlideRenderer {
  return async (request) => {
    onCall?.(request);
    return buffers;
  };
}

function fileByPath(result: CarouselRenderResult, path: string): Buffer {
  const file = result.files.find((candidate) => candidate.path === path);
  if (!file) throw new Error(`Arquivo ausente no resultado: ${path}`);
  return file.content;
}

describe('carousel renderer orchestration', () => {
  it('não executa scripts do HTML durante a captura', async () => {
    const buffers = await playwrightSlideRenderer({
      html: '<!doctype html><style>.slide{width:120px;height:150px;background:#fff}</style><div class="slide"></div><script>document.querySelector(".slide").remove()</script>',
      batchSlug: 'script-disabled',
      minSlides: 1,
      maxSlides: 1,
      width: 120,
      height: 150,
      timeoutMs: 10_000,
    });

    expect(buffers).toHaveLength(1);
    expect(buffers[0]?.subarray(0, 8)).toEqual(PNG_SIGNATURE);
  }, 20_000);

  it('produz manifesto público coerente com os arquivos devolvidos', async () => {
    const buffers = canonicalSlides(3);
    let seenRequest: Parameters<SlideRenderer>[0] | undefined;
    const result = await renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-conteudo-01' },
      { renderer: stubRenderer(buffers, (request) => { seenRequest = request; }) },
    );

    expect(seenRequest?.width).toBe(1080);
    expect(seenRequest?.height).toBe(1350);
    expect(seenRequest?.minSlides).toBe(1);
    expect(seenRequest?.maxSlides).toBe(20);

    const { manifest } = result;
    expect(manifest.schemaVersion).toBe('1.0.0');
    expect(manifest.batchSlug).toBe('lote-conteudo-01');
    expect(manifest.slideCount).toBe(3);
    expect(manifest.totalBytes).toBe(buffers.reduce((sum, buffer) => sum + buffer.length, 0));
    expect(manifest.slides.map((slide) => slide.path)).toEqual([
      'slides/slide-01.png',
      'slides/slide-02.png',
      'slides/slide-03.png',
    ]);
    for (const slide of manifest.slides) {
      expect(slide.width).toBe(1080);
      expect(slide.height).toBe(1350);
      expect(slide.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(manifest.gallery.path).toBe('index.html');
    expect(manifest.archive.path).toBe('lote-conteudo-01.zip');

    // Todo caminho do manifesto tem um arquivo correspondente com hash/bytes iguais.
    const referenced = [...manifest.slides, manifest.gallery, manifest.archive];
    for (const entry of referenced) {
      const file = result.files.find((candidate) => candidate.path === entry.path);
      expect(file).toBeDefined();
      expect(file?.sha256).toBe(entry.sha256);
      expect(file?.bytes).toBe(entry.bytes);
    }
    expect(result.files).toHaveLength(3 + 2);
  });

  it('valida PNG e ZIP reais com round-trip do arquivo', async () => {
    const buffers = canonicalSlides(4);
    const result = await renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-real' },
      { renderer: stubRenderer(buffers) },
    );

    for (const slide of result.manifest.slides) {
      const png = fileByPath(result, slide.path);
      expect(png.subarray(0, 8)).toEqual(PNG_SIGNATURE);
      expect(readPngDimensions(png)).toEqual({ width: 1080, height: 1350 });
    }

    const archive = fileByPath(result, result.manifest.archive.path);
    expect(archive.subarray(0, 4)).toEqual(LOCAL_HEADER_MAGIC);
    const unzipped = readDeterministicZip(archive);
    expect(unzipped.map((entry) => entry.path)).toEqual([
      'slides/slide-01.png',
      'slides/slide-02.png',
      'slides/slide-03.png',
      'slides/slide-04.png',
    ]);
    for (const entry of unzipped) {
      const original = fileByPath(result, entry.path);
      expect(entry.content.equals(original)).toBe(true);
    }
  });

  it('é logicamente determinístico dado o mesmo conteúdo de entrada', async () => {
    const run = () => renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-determinismo' },
      { renderer: stubRenderer(canonicalSlides(5)) },
    );
    const first = await run();
    const second = await run();

    expect(first.manifest).toEqual(second.manifest);
    expect(fileByPath(first, first.manifest.archive.path).equals(
      fileByPath(second, second.manifest.archive.path),
    )).toBe(true);
    expect(fileByPath(first, 'index.html').equals(fileByPath(second, 'index.html'))).toBe(true);
  });

  it('gera galeria autocontida (sem rede) com botões de download', async () => {
    const result = await renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-galeria' },
      { renderer: stubRenderer(canonicalSlides(2)) },
    );
    const html = fileByPath(result, 'index.html').toString('utf8');
    expect(html).toContain('data:image/png;base64,');
    expect(html).toContain('data:application/zip;base64,');
    expect(html).toContain('download=');
    // Autocontida: nenhuma referência de rede.
    expect(html).not.toContain('http://');
    expect(html).not.toContain('https://');
    expect(html).not.toContain('//cdn');
  });

  it('não vaza caminhos absolutos no manifesto (privacidade)', async () => {
    const result = await renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-privado' },
      { renderer: stubRenderer(canonicalSlides(3)) },
    );
    const serialized = JSON.stringify(result.manifest);
    expect(serialized).not.toMatch(/"[^"]*\/(?:Users|home|tmp|var|private)\//);
    expect(serialized).not.toMatch(/[A-Za-z]:\\\\/);
    for (const slide of result.manifest.slides) {
      expect(slide.path.startsWith('/')).toBe(false);
    }
    expect(result.manifest.archive.path.startsWith('/')).toBe(false);
  });

  it('rejeita slugs de lote inseguros antes de renderizar (path safety)', async () => {
    const rejected = ['../evil', '/etc/passwd', 'a/b', '..', '', 'UPPER', 'a'.repeat(64), 'com espaço', '-inicio'];
    for (const batchSlug of rejected) {
      let called = false;
      const renderer = stubRenderer(canonicalSlides(1), () => { called = true; });
      await expect(renderCarouselBatch({ html: DUMMY_HTML, batchSlug }, { renderer }))
        .rejects.toThrow(/Slug de lote inválido/);
      expect(called).toBe(false);
    }
    // Um slug válido passa.
    const ok = await renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-01' },
      { renderer: stubRenderer(canonicalSlides(1)) },
    );
    expect(ok.manifest.batchSlug).toBe('lote-01');
  });

  it('cancela imediatamente quando o signal já está abortado', async () => {
    const controller = new AbortController();
    controller.abort();
    let called = false;
    const renderer = stubRenderer(canonicalSlides(1), () => { called = true; });
    await expect(renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-cancel' },
      { renderer, signal: controller.signal },
    )).rejects.toBeInstanceOf(CarouselRenderAbortError);
    expect(called).toBe(false);
  });

  it('cancela quando o signal aborta durante a renderização', async () => {
    const controller = new AbortController();
    const renderer: SlideRenderer = async () => {
      controller.abort();
      return canonicalSlides(2);
    };
    await expect(renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-cancel-meio' },
      { renderer, signal: controller.signal },
    )).rejects.toMatchObject({ aborted: true });
  });

  it('respeita o limite total de bytes', async () => {
    await expect(renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-grande' },
      { renderer: stubRenderer(canonicalSlides(3)), maxTotalBytes: 10 },
    )).rejects.toThrow(/limite total/);
  });

  it('rejeita contagem de slides fora da faixa 1–20', async () => {
    await expect(renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-vazio' },
      { renderer: stubRenderer([]) },
    )).rejects.toThrow(/entre 1 e 20/);

    await expect(renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-excesso' },
      { renderer: stubRenderer(canonicalSlides(21)) },
    )).rejects.toThrow(/entre 1 e 20/);
  });

  it('rejeita PNG com dimensão errada ou buffer não-PNG', async () => {
    await expect(renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-dim' },
      { renderer: stubRenderer([makePng(1080, 1080)]) },
    )).rejects.toThrow(/dimensão inválida/);

    await expect(renderCarouselBatch(
      { html: DUMMY_HTML, batchSlug: 'lote-naopng' },
      { renderer: stubRenderer([Buffer.from('xx not a png xx')]) },
    )).rejects.toThrow(/não é PNG válido/);
  });

  it('rejeita HTML vazio', async () => {
    await expect(renderCarouselBatch(
      { html: '   ', batchSlug: 'lote-html' },
      { renderer: stubRenderer(canonicalSlides(1)) },
    )).rejects.toThrow(/HTML do carrossel vazio/);
  });
});

// Renderização real com o Chromium do Playwright. Pesada; ativada via env, no
// mesmo padrão de gating dos testes de integração do document-pack.
const realIt = process.env.CAROUSEL_REAL_RENDER === '1' ? it : it.skip;

function slideMarkup(count: number): string {
  const slides = Array.from({ length: count }, (_unused, index) =>
    `<div class="slide" data-carousel-slide>${index + 1}</div>`).join('');
  return [
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>',
    '*{margin:0;padding:0;box-sizing:border-box}',
    '.slide{width:1080px;height:1350px;display:flex;align-items:center;justify-content:center;',
    'font-family:Arial,sans-serif;font-size:120px;color:#fff;background:#101010}',
    '.slide:nth-child(even){background:#1f2937}',
    '</style></head><body>',
    slides,
    '</body></html>',
  ].join('');
}

describe('carousel renderer real chromium', () => {
  realIt('renderiza slides 1080x1350 reais e um ZIP verificável', async () => {
    const result = await renderCarouselBatch({ html: slideMarkup(2), batchSlug: 'lote-chromium' });
    expect(result.manifest.slideCount).toBe(2);
    for (const slide of result.manifest.slides) {
      const png = fileByPath(result, slide.path);
      expect(png.subarray(0, 8)).toEqual(PNG_SIGNATURE);
      expect(readPngDimensions(png)).toEqual({ width: 1080, height: 1350 });
      expect(slide.bytes).toBe(png.length);
    }
    const archive = fileByPath(result, result.manifest.archive.path);
    const unzipped = readDeterministicZip(archive);
    expect(unzipped).toHaveLength(2);
    for (const entry of unzipped) {
      expect(entry.content.equals(fileByPath(result, entry.path))).toBe(true);
    }
  }, 180_000);

  realIt('rejeita HTML sem slides e HTML com mais de 20 slides', async () => {
    await expect(renderCarouselBatch(
      { html: '<!doctype html><html><body><p>sem slides</p></body></html>', batchSlug: 'lote-sem' },
    )).rejects.toThrow(/sem slides|entre 1 e 20/);

    await expect(renderCarouselBatch({ html: slideMarkup(21), batchSlug: 'lote-21' }))
      .rejects.toThrow(/excede o máximo|entre 1 e 20/);
  }, 180_000);
});
